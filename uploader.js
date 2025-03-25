
var cpUploadAPI = function(file, options){
    if (!this instanceof cpUploadAPI) {
        return new cpUploadAPI(file, options);
    }

    if(!this.file instanceof File){
        throw new Error("The first parameter of constructor must be an instance of File object");
    } else if(!options || !options.url){
        throw new Error("The second parameter of constructor must contain upload url");
    }
	if(options && options.url && options.url.indexOf('mediaupload.cincopa.com') == -1 ){
		console.log('%c' + 'Upload url doesn\'t contain mediaupload.cincopa.com', 'font-size:15px; font-weight:bold; background: linear-gradient(#f00, yellow); border-radius: 5px; padding: 10px');
	}
    if(options.chunk_size && (options.chunk_size < 0.5 || options.chunk_size > 10) )
    {
        options.chunk_size=(1024 * 10000); 
    }
    this.file = file;
    this.options = options;
    this.chunk_size =parseFloat(options.chunk_size)*1000*1024  || (1024 * 50000); // 50MB
    this.chunk_size = Math.min(this.chunk_size, this.file?.size) || 0;
    this.range_start = 0;
    this.range_end = Math.min(this.range_start + this.chunk_size, this.file?.size) || 0;
    this.lastPosition = 0;
    this.upload_error_count = 0;
    if ('mozSlice' in this.file) {
        this.slice_method = 'mozSlice';
    }
    else if ('webkitSlice' in this.file) {
        this.slice_method = 'webkitSlice';
    }
    else {
        this.slice_method = 'slice';
    }
	
    this.upload_request = new XMLHttpRequest();
    var uploadInfo = {
        xhr: this.upload_request,
        file: this.file,
        chunkSize: this.chunk_size,
        uploadState: 'Pending',
        percentComplete: 0
    };

    this.upload_request.onload = this._onChunkComplete(uploadInfo);

    var eventSource = this.upload_request.upload || this.upload_request;
    eventSource.onprogress = this._onUploadProgress(uploadInfo);
    this.upload_request.onerror = this._onUploadError(uploadInfo);
	window.onbeforeunload = this.closeIt;
	if(typeof options.onInit =='function'){
    	options.onInit(uploadInfo,this)
  	}
}

cpUploadAPI.prototype = {
    _upload: function (rangeStart) {
        var self = this, chunk;
        if (typeof rangeStart != 'undefined') {
            self.range_start = rangeStart;
            self.upload_error_count = 0;
        }

        setTimeout(function () {
            // Prevent range overflow
            if (self.range_end > self.file.size) {
                self.range_end = self.file.size;
            }

            chunk = self.file[self.slice_method](self.range_start, self.range_end);
			
			var random__number;
			if(self.file.unique_id){
              random__number  = self.file.unique_id;
            } else{
              random__number  = Date.now();
              self.file.unique_id = random__number;
            }
			
            self.upload_request.open('POST', self.options.url, true);
            self.upload_request.overrideMimeType('application/octet-stream');
            self.upload_request.setRequestHeader("Content-Type", "multipart/form-data");
            self.upload_request.setRequestHeader('X-FILE-NAME', encodeURIComponent(self.file.name));
            self.upload_request.setRequestHeader('Content-Range', 'bytes ' + self.range_start + '-' + self.range_end + (!self.file.tempChunk ? '/' + self.file.size: ""));
			self.upload_request.setRequestHeader('unique-id', random__number);
            
            self.upload_request.send(chunk);
			window.onbeforeunload = self.closeIt;
        }, 20)
    },

    _onChunkComplete: function (uploadInfo) {
        var self = this;
        return function (e) {
			if( uploadInfo.xhr.responseText.indexOf('error') > -1){
				if(typeof self.options.onUploadError === "function"){
                    self.options.onUploadError(uploadInfo);
                }
				window.onbeforeunload = function () {};
				return;
			}
			
            self.lastPosition = 0;
            self.upload_error_count = 0;
            if (self.range_end === self.file.size) {
                self._onComplete(uploadInfo);
                return;
            }
            // Update our ranges
            self.range_start = self.range_end;
            self.range_end = self.range_start + self.chunk_size;
			if(typeof self.options.onChunkComplete === "function"){
            	self.options.onChunkComplete(uploadInfo);
        	}
            // Continue as long as we aren't paused
            if (!self.is_paused) {
                self._upload();
            }
        }
    },

    _onComplete : function(uploadInfo) {
        var self = this;
        uploadInfo.uploadState = 'Complete';
		uploadInfo.percentComplete = 100;
		uploadInfo.loaded = uploadInfo.total;
        if(typeof self.options.onUploadComplete === "function"){
            var rid =  uploadInfo.xhr && uploadInfo.xhr.responseText && uploadInfo.xhr.responseText.match(/new resource id (\d+) (.*)/);
            rid = rid ? rid[2]:null;
			uploadInfo.rid = rid;
			if(uploadInfo.file && uploadInfo.file.type){
				uploadInfo.type = uploadInfo.file.type;
			}
            self.options.onUploadComplete(uploadInfo,{
                rid: rid
            });
        }
		window.onbeforeunload = function () {};
    },

    _onAbort: function(uploadInfo){
		var self = this;
		if(typeof self.options.onUploadAbort === "function"){
			self.options.onUploadAbort(uploadInfo);
		}
		window.onbeforeunload = function () {};
    },

    _onUploadProgress: function(uploadInfo){
        var self = this;
        return function (e) {
            var position = e.position || e.loaded;
            var total = self.file.size;

            uploadInfo.total = total;
            if (typeof  uploadInfo.loaded == 'undefined') {
                uploadInfo.loaded = 0;
            } else {
                uploadInfo.loaded += (position - self.lastPosition);
            }
            self.lastPosition = position;


            uploadInfo.percentComplete = (uploadInfo.loaded / total) * 99;
            uploadInfo.uploadState = 'Uploading';
            
            if(typeof self.options.onUploadProgress === "function"){
                self.options.onUploadProgress(uploadInfo,e);
            }
        }
    },

    _onUploadError: function(uploadInfo){
        var self = this;
        return function (e) {
            self.upload_error_count++;
            if (self.upload_error_count <= 10) {
                if (!self.is_paused) {
                    self._upload();
                }
            } else {
				uploadInfo.uploadState = 'Error';
                if(typeof self.options.onUploadError === "function"){
                    self.options.onUploadError(uploadInfo);
                }
				window.onbeforeunload = function () {};
            }
        }
    },
	
	closeIt: function(){
		return "You haven't finished uploading your file. If you leave now, file won't get published";
	},

    // Public Methods ____________________________________________________

    start: function () {
        this._upload();
    },

    pause: function () {
        this.is_paused = true;
    },

    resume: function () {
        this.is_paused = false;
        this._upload();
    },

    stop: function(){
        this.upload_request.abort();
		this._onAbort();
    }
}