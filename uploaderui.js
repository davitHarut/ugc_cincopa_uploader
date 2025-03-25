var cpUploadUI = function (elem, options) {
    if (!this instanceof cpUploadUI) {
      return new cpUploadUI(file, options);
    }
  
    var defaultOptions = {
      width: 780,
      height: 400,
      theme_color: "#0086CF",
      multiple: true,
      onlyonce: false,
      btnText: "Choose files to upload",
      dragAndDropText: "Drag & Drop Your Files Here",
      forceCamCoder: false,
      background_mode: false,
    };
  
    function mergeObjects() {
      var resObj = {};
      for (var i = 0; i < arguments.length; i += 1) {
        var obj = arguments[i],
          keys = Object.keys(obj);
        for (var j = 0; j < keys.length; j += 1) {
          resObj[keys[j]] = obj[keys[j]];
        }
      }
      return resObj;
    }
    this.options = mergeObjects(defaultOptions, options || {});
    this.elem = elem; /* can be bull if we dont want draw anything */
    this.uploading = false;
    this.uploads = [];
  };
  
  cpUploadUI.prototype = {
    loadDependencies: function () {
      var self = this;
  
      if (self.isScriptLoaded("/ugc/uploader.js")) {
        self.createUI();
      } else {
        var script = document.createElement("script");
        script.src = "//wwwcdn.cincopa.com/_cms/ugc/uploader.js";
        document.head.appendChild(script);
        script.onload = function () {
          self.createUI();
        };
      }
      if(!self.isScriptLoaded("/ugc/fileInputPaster.js")) {
        var script = document.createElement("script");
        script.src = "//wwwcdn.cincopa.com/_cms/ugc/fileInputPaster.js";
        document.head.appendChild(script);
      }
      if(!self.isScriptLoaded("/ugs/uploader-with-url.js")) {
        var script = document.createElement("script");
        script.src = "//wwwcdn.cincopa.com/_cms/ugc/uploader-with-url.js";
        document.head.appendChild(script);
      }
  
      if (!self.isCssLoaded("/ugc/uploaderUI.css")) {
        var element = document.createElement("link");
        element.type = "text/css";
        element.rel = "stylesheet";
        element.href = "//www.cincopa.com/_cms/ugc/uploaderUI.css";
        document.head.appendChild(element);
      }
    },
  
    createUI: function (toElement, options) {
      var self = this;
  
      var container = document.createElement("div");
      container.classList.add("cp-upload-ui-container");
      container.style.width = this.options.width;
      container.style.height = this.options.height;
      if (toElement) {
        toElement.innerHTML = "";
        toElement.appendChild(container);
        toElement.classList.add("cp-default-ui");
        if(options.copy_paste) {
          self.makeAreaPasteable(toElement, options)
        }
      } else if (this.elem) {
        this.elem.appendChild(container);
      }
      var wrapper = document.createElement("div");
      wrapper.classList.add("cp-upload-ui-wrapper");
      wrapper.style.borderColor = this.options.theme_color;
      container.appendChild(wrapper);
      var message = document.createElement("div");
      message.classList.add("cp-upload-ui-message");
      if (self.options.dragAndDropText != "") {
        var messageSpan = document.createElement("span");
        messageSpan.innerText = self.options.dragAndDropText;
        var messageI = document.createElement("i");
        messageI.innerText = "- Or -";
      }
      var messageButton = document.createElement("button");
      messageButton.setAttribute("type", "button");
      messageButton.classList.add("cp-upload-ui-choose-btn");
      messageButton.innerText = self.options.btnText;
      if (self.options.dragAndDropText != "") {
        message.appendChild(messageSpan);
        message.appendChild(messageI);
      }
      message.appendChild(messageButton);
      wrapper.appendChild(message);
  
      if (!toElement) {
        var preview = document.createElement("div");
        preview.classList.add("cp-upload-ui-preview");
        preview.style.display = "none";
        if (self.options.background_mode) {
          var backgroundConatiner = document.createElement("div");
          backgroundConatiner.classList.add(
            "cp-upload-ui-preview--background",
            "cp-box-shadow"
          );
          backgroundConatiner.style.display = 'none';
          var backgroundConatinerHeader = document.createElement("div");
          var backgroundConatinerSubHeader = document.createElement("div");
          var backgroundConatinerContent = document.createElement("div");
          backgroundConatinerHeader.classList.add(
            "cp-upload-ui-preview--background__header"
          );
          backgroundConatinerSubHeader.classList.add(
            "cp-upload-ui-preview--background__subHeader",
            "cp-hide"
          );
          backgroundConatinerContent.classList.add(
            "cp-upload-ui-preview--background__content"
          );
          var minimizer = document.createElement("div");
          minimizer.classList.add("cp-upload-ui-preview--background--minimizer");
          minimizer.title = "Minimize";
          minimizer.innerText = "▼";
          var counter = document.createElement("div");
          counter.classList.add("cp-upload-ui-preview--background--counter");
          counter.innerText = "";
          var retryAll = document.createElement("div");
          retryAll.classList.add("cp-upload-ui-preview--background--retryAll");
          retryAll.innerText = "RETRY";
          var closer = document.createElement("div");
          closer.classList.add("cp-upload-ui-preview--background--closer");
          closer.title = "Close";
          closer.innerText = "✖";
          backgroundConatinerHeader.append(counter);
          backgroundConatinerHeader.append(minimizer);
          backgroundConatinerHeader.append(closer);
          backgroundConatinerSubHeader.append(retryAll);
          backgroundConatiner.appendChild(backgroundConatinerHeader);
          backgroundConatiner.appendChild(backgroundConatinerSubHeader);
          backgroundConatiner.appendChild(backgroundConatinerContent);
          backgroundConatinerContent.appendChild(preview);
          document.body.appendChild(backgroundConatiner);
          preview.style.display = "block";
  
          minimizer.addEventListener("click", function () {
            backgroundConatinerContent.classList.toggle("cp-hide");
            document
              .querySelector(".cp-upload-ui-preview--background")
              .classList.toggle("cp-box-shadow");
            if (backgroundConatinerContent.classList.contains("cp-hide")) {
              minimizer.innerText = "▲";
              minimizer.title = "Maximize";
            } else {
              minimizer.innerText = "▼";
              minimizer.title = "Minimize";
            }
          });
  
          closer.addEventListener("click", function () {
            var counter = self.getStatusCounts();
            if (
              self.uploads.length > 0 &&
              counter["uploading"] + counter["pending"] != 0
            ) {
              if(self.uploads.find(el => typeof el.stop == 'function')) {
                var result = window.confirm("Are you sure to cancel upload?");
                if (result) {
                  self.uploads.forEach(function (el) {
                    // delete self.uploads[uploadIndex].unique_id;
                    el.stop?.();
                  });
                  self.uploads = [];
                  preview.innerHTML = "";
                }
              }
            } else {
              preview.innerHTML = "";
            }
            backgroundConatiner.style.display = 'none';
          });
        } else {
          wrapper.appendChild(preview);
        }
        this.container = container;
        this.preview = preview;
        this.message = message;
      }
  
      var fileUpload = document.createElement("input");
      fileUpload.type = "file";
      fileUpload.multiple = self.options.multiple;
      fileUpload.classList.add("cp-upload-ui-file-input");
      if(self.options.upload_accept) {
        fileUpload.accept = self.options.upload_accept.split(',').map(el => '.'+el).join(',')
      }
      if (self.options.forceCamCoder) {
        fileUpload.setAttribute("accept", "video/*");
        fileUpload.setAttribute("capture", "camcorder");
      }
      container.appendChild(fileUpload);
  
      if (toElement) {
        this.DragAndDropUpload(toElement, options);
      } else {
        this.DragAndDropUpload(this.container);
      }
  
      container.addEventListener("click", function (e) {
        if (
          !self.closestByClass(e.target, "cp-upload-ui-item") &&
          message.style.display === "none"
        ) {
          fileUpload.click();
        }
      });
  
      messageButton.addEventListener("click", function (e) {
        fileUpload.click();
      });
  
      fileUpload.addEventListener("change", function (e) {
        var fileInput = this;
        self.inputOnChange(fileInput, options);
      });
    },
  
    inputOnChange: function (fileInput, options) {
      var self = this;
      var filteredArr = [];
      var unFilteredArr = [];
      if(!options){
        options = self.options;
      }
      if ("files" in fileInput) {
        for (var i = 0; i < fileInput.files.length; i++) {
          if (options) {
            fileInput.files[i].options = options;
          }
          if (options && options.upload_accept) {
            var mimeType = fileInput.files[i].type;
            if (mimeType == "") {
              var fileName = fileInput.files[i].name;
              var fileType = fileName.slice(fileName.lastIndexOf(".") + 1);
              var allowedTypes = options.upload_accept
                .split(",")
                .map(function (item) {
                  return item.slice(item.indexOf(".") + 1);
                });
            } else {
              var fileType = mimeType.slice(mimeType.indexOf("/") + 1);
              var allowedTypes = options.upload_accept
                .split(",")
                .map(function (item) {
                  return item.slice(item.indexOf(".") + 1);
                });
            }
            if (
              allowedTypes.find(function (item) {
                return item === fileType;
              })
            ) {
              filteredArr.push(fileInput.files[i]);
            } else {
              unFilteredArr.push(fileInput.files[i]);
            }
          } else {
            filteredArr.push(fileInput.files[i]);
          }
        }
        if (unFilteredArr.length > 0) {
          if(self.options.upload_accept){
              alert('File should be in '+ self.options.upload_accept + ' format');
          }else{
               alert("There are unsupported types in files");
          }
         
        }
        if(this.options.multiple){
          this.startUpload(filteredArr);
        }else if(!this.uploading){
          this.startUpload(filteredArr);
        }
       
      }
      fileInput.value = "";
    },
  
    DragAndDropUpload: function (uploadDiv, options) {
      var self = this;
      var files = [];
      if(uploadDiv) {
      uploadDiv.ondragover = function (e) {
        e.stopPropagation();
        e.preventDefault();
        uploadDiv.classList.add("cp-upload-ui-container-hovered");
        var hoverText = document.createElement("span");
        hoverText.classList.add("cp-upload-ui-container-hoverText");
        if (options && options.hover_text && !options.createUI) {
          hoverText.innerText = options.hover_text
            ? options.hover_text
            : "Drop files to instantly upload them";
          if (!uploadDiv.querySelector(".cp-upload-ui-container-hoverText")) {
            uploadDiv.append(hoverText);
          } else if (
            uploadDiv
              .querySelector(".cp-upload-ui-container-hoverText")
              .classList.contains("cp-hide")
          ) {
            uploadDiv
              .querySelector(".cp-upload-ui-container-hoverText")
              .classList.remove("cp-hide");
          }
        }
        if (options && options.hover_type && !options.createUI) {
          if (options.hover_type.type == "rect") {
            uploadDiv.style.border =
              "3px solid " +
              (options.hover_type.color ? options.hover_type.color : "#357DF3");
            uploadDiv.style.backgroundColor = options.hover_type.color
              ? options.hover_type.color
              : "rgba(66,133,244, .09)";
            if (options.hover_type.color) {
              var color = self.convertToRGB(options.hover_type.color);
              if (color && color.indexOf("a") == -1) {
                var rgbaColor = color
                  .replace(")", ", .09)")
                  .replace("rgb", "rgba");
                uploadDiv.style.backgroundColor = rgbaColor;
              }
              hoverText.style.backgroundColor = options.hover_type.color;
            }
          }
        }
  
        if (options && typeof options.hover_callback == "function") {
          options.hover_callback({
            context: options?.context || {},
            e
          });
        }
        return false;
      };
      uploadDiv.ondragleave = function (e) {
        e.stopPropagation();
        e.preventDefault();
        try {
          var dropContainerChilds =
            document.querySelector(".drop-container")?.children;
          for (var i = 0; i < dropContainerChilds?.length; i++) {
            if (
              e.fromElement ==
                uploadDiv.querySelector(".cp-upload-ui-container-hoverText") ||
              dropContainerChilds[i] == e.fromElement
            ) {
              return;
            }
          }
        } catch (error) {
          console.log(error);
        }
  
        uploadDiv.classList.remove("cp-upload-ui-container-hovered");
  
        if (
          options &&
          options.hover_text &&
          uploadDiv.querySelector(".cp-upload-ui-container-hoverText") &&
          !options.createUI
        ) {
          uploadDiv
            .querySelector(".cp-upload-ui-container-hoverText")
            .classList.add("cp-hide");
        }
  
        if (options && options.hover_type) {
          if (options.hover_type.type == "rect") {
            uploadDiv.style.border = "";
            uploadDiv.style.backgroundColor = "";
          }
        }
      };
      uploadDiv.ondrop = function (e) {
        e.preventDefault();
        uploadDiv.classList.remove("cp-upload-ui-container-hovered");
        if(!options){
          options = self.options;
        }
  
        if (
          options &&
          options.hover_text &&
          uploadDiv.querySelector(".cp-upload-ui-container-hoverText") &&
          !options.createUI
        ) {
          uploadDiv
            .querySelector(".cp-upload-ui-container-hoverText")
            .classList.add("cp-hide");
        }
  
        if (options && options.hover_type && !options.createUI) {
          if (options.hover_type.type == "rect") {
            uploadDiv.style.border = "";
            uploadDiv.style.backgroundColor = "";
          }
        }
  
        var filteredArr = [];
        var unFilteredArr = [];
        for (var i = 0; i < e.dataTransfer.files.length; i++) {
            if(e.dataTransfer.files[i].size > 0) {
              e.dataTransfer.files[i].options = options;
              if (options && options.upload_accept) {
                var mimeType = e.dataTransfer.files[i].type;
                if (mimeType == "") {
                  var fileName = e.dataTransfer.files[i].name;
                  var fileType = fileName.slice(fileName.lastIndexOf(".") + 1);
                  var allowedTypes = options.upload_accept
                    .split(",")
                    .map(function (item) {
                      return item.slice(item.indexOf(".") + 1);
                    });
                } else {
                  var fileType = mimeType.slice(mimeType.indexOf("/") + 1);
                  var allowedTypes = options.upload_accept
                    .split(",")
                    .map(function (item) {
                      return item.slice(item.indexOf(".") + 1);
                    });
                }
                if (
                  allowedTypes.find(function (item) {
                    return item === fileType;
                  })
                ) {
                  filteredArr.push(e.dataTransfer.files[i]);
                } else {
                  unFilteredArr.push(e.dataTransfer.files[i]);
                }
              } else {
                filteredArr.push(e.dataTransfer.files[i]);
              }
            }
        }
        if (unFilteredArr.length > 0) {
          if(self.options.upload_accept){
              alert('File should be in '+ self.options.upload_accept + ' format');
          }else{
               alert("There are unsupported types in files");
          }
        }
          if(filteredArr.length) {
              if (self.options.multiple) {
          self.startUpload(filteredArr);
        } else if(!self.uploading){
          self.startUpload([filteredArr[0]]);
        }
          }
      };
      }
    },
  
    startUpload: function (files) {
      var self = this;
  
      if (this.options.background_mode) {
        var backgroundConatiner = document.querySelector(
          ".cp-upload-ui-preview--background"
        );
        if (
          backgroundConatiner.style.display == 'none' &&
          files.length > 0
        ) {
          backgroundConatiner.style.display = 'block'
        }
      }
      if (files) {
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (self.options.regex) {
            var reg = new RegExp(self.options.regex);
            if (!reg.test(file.type)) {
              alert("Unsupported file extension !");
              continue;
            }
          }
  
          if (self.uploads.length > 0 && self.options.onlyonce) {
            break;
          }
          file.drawTimestamp = Date.now() + "_" + file?.name;
          this.drawItemUI(file);
          var uploader = new cpUploadAPI(file, {
            url: file?.options?.upload_url || self.options.upload_url,
            // chunk_size: 1, /* need to think  */
            onUploadComplete: function (e, options) {
              self.updateProgress(e);
              self.uploadComplete(e.file,e);
  
              /* new feature */
              if (typeof e.file?.options?.upload_done_callback == "function") {
                options.context = e.file?.options?.context || {};
                e.file.options.upload_done_callback(e, options);
              }
              if (typeof self.options.onUploadComplete == "function") {
                self.options.onUploadComplete(e, options);
              }
  
              var currentUploadIndex = self.returnCurrentIndex(e);
              self.uploads[currentUploadIndex].uploadState = "Complete";
              var isRetry = self.uploads[currentUploadIndex].isRetry;
              // self.uploads[currentUploadIndex] = null;
  
              if (!self.areAllUploadsDone() && !isRetry) {
                var next = self.getNextUpload();
                if (next) next.start?.();
              } else {
                self.uploading = false;
              }
            },
            onUploadProgress: function (e) {
              var currentUploadIndex = self.returnCurrentIndex(e);
              self.uploads[currentUploadIndex].uploadState = e.uploadState;
  
              self.updateProgress(e);
  
              /* new feature */
              if (
                typeof e.file?.options?.upload_progress_callback == "function"
              ) {
                e.file.options.upload_progress_callback(e, {
                  context: e.file?.options?.context || {},
                });
              } else if (typeof self.options.onUploadProgress == "function") {
                self.options.onUploadProgress(e);
              }
            },
            onUploadError: function (e) {
              var currentUploadIndex = self.returnCurrentIndex(e);
              self.uploads[currentUploadIndex].uploadState = e.uploadState;
  
              // delete self.uploads[currentUploadIndex].file.unique_id
  
              var next = self.getNextUpload();
              if (next) next.start?.();
  
              self.uploadError(e);
              /* new feature */
              if (typeof e.file?.options?.upload_error_callback == "function") {
                e.file.options.upload_error_callback(e, {
                  context: e.file?.options?.context || {},
                });
              } else if (typeof self.options.onUploadError == "function") {
                self.options.onUploadError(e);
              }
  
              var isAllCanceled = null;
  
              self.uploads.forEach((el) => {
                if (el.uploadState == "Error") {
                  isAllCanceled = true;
                } else {
                  isAllCanceled = false;
                }
                return isAllCanceled;
              });
  
              if (isAllCanceled) {
                document.querySelector(
                  ".cp-upload-ui-preview--background--counter"
                ).innerText = self.uploads.length + " uploads canceled";
                document
                  .querySelector(".cp-upload-ui-preview--background__subHeader")
                  .classList.remove("cp-hide");
                document
                  .querySelector(".cp-upload-ui-preview--background--retryAll")
                  .addEventListener("click", function () {
                    self.uploads.forEach((el) => {
                      el.start();
                    });
                  });
              }
            },
            onUploadAbort: function (e) {
              /* need to fix uploader.js to return e 
                                      var currentUploadIndex = self.returnCurrentIndex(e);
                                      self.uploads[currentUploadIndex].uploadState = e.uploadState;
  
                                      var next = self.getNextUpload();
                                      if(next) next.start?.()
                                      */
              if (self.options.background_mode) {
                var counter = self.getStatusCounts();
                if (counter["canceled"] == self.uploads.length) {
                  document.querySelector(
                    ".cp-upload-ui-preview--background--counter"
                  ).innerText = counter["canceled"] + " items canceled";
                }
                if (counter["canceled"] == 1) {
                  document.querySelector(
                    ".cp-upload-ui-preview--background--counter"
                  ).innerText = "1 item canceled";
                }
              }
            },
          });
          this.uploads.push(uploader);
  
          if (!this.uploading) {
            var next = self.getNextUpload();
            next.start?.();
          }
  
          this.uploading = true;
        }
      }
    },
  
    drawItemUI: function (file, linkMode) {
      var self = this;
      var div = document.createElement("div");
      div.classList.add("cp-upload-ui-item");
      div.classList.add("cp-upload-ui-item-waiting");
      div.setAttribute("data-drawTimestamp", file.drawTimestamp);
      this.preview.appendChild(div);
      if (!this.options.background_mode) {
        this.message.style.display = "none";
      }
      this.preview.classList.add("flex");
      var title = document.createElement("span");
      title.classList.add("cp-upload-ui-item-title");
      title.innerText = file.name;
      var progress = document.createElement("div");
      progress.classList.add("cp-upload-ui-item-progress");
      var innerProgress = document.createElement("div");
  
      /* need to fix */
      if(!linkMode) {
        var err = document.createElement("img");
        err.classList.add("cp-upload-ui-item-err", "cp-hide");
        err.src =
          "https://drive-thirdparty.googleusercontent.com/16/type//undefined";
    
        var retry = document.createElement("div");
        retry.classList.add("cp-upload-ui-item-retry");
        retry.innerHTML = "&#x21BB;"; //â†» symbole ;)
      }
  
      var editBtnWrapper = document.createElement("div");
          editBtnWrapper.classList.add("cp-upload-ui-item-edit");
          editBtnWrapper.style.display = 'none';
  
      var editBtn = document.createElement("div");
          editBtn.classList.add("cp-upload-ui-item-edit--btn");
          editBtn.style.cursor = 'pointer';
          editBtn.style.fontSize = '28px';
          editBtn.innerHTML = '<svg class="svg-icon" style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 115 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M307.3024 299.1104a25.6 25.6 0 0 0-25.6 25.6v95.2832a25.6 25.6 0 0 0 25.6 25.6512h95.232a25.6 25.6 0 0 0 25.6512-25.6V324.7104a25.6 25.6 0 0 0-25.6-25.6512H307.3024z m0-51.2512h95.232c42.496 0 76.9024 34.4064 76.9024 76.9024v95.232c0 42.496-34.4064 76.9024-76.8512 76.9024H307.3024c-42.496 0-76.9024-34.4064-76.9024-76.9024v-95.232c0-42.496 34.4064-76.9024 76.9024-76.9024z m339.712 37.2224a25.6 25.6 0 0 0-35.0208 9.4208l-47.616 82.4832a25.6 25.6 0 0 0 9.3696 35.0208l82.4832 47.616a25.6 25.6 0 0 0 35.0208-9.3696l47.616-82.4832a25.6 25.6 0 0 0-9.3696-35.0208l-82.4832-47.616z m108.1344 3.2768c36.7616 21.248 49.3568 68.2496 28.16 105.0112l-47.616 82.5344a76.9024 76.9024 0 0 1-105.0624 28.16l-82.5344-47.616a76.9024 76.9024 0 0 1-28.16-105.0624l47.616-82.5344a76.9024 76.9024 0 0 1 105.0624-28.16l82.5344 47.616z m-447.8464 307.456a25.6 25.6 0 0 0-25.6 25.6v95.2832a25.6 25.6 0 0 0 25.6 25.6h95.232a25.6 25.6 0 0 0 25.6512-25.6v-95.232a25.6 25.6 0 0 0-25.6-25.6512H307.3024z m0-51.2512h95.232c42.496 0 76.9024 34.4064 76.9024 76.8512v95.2832c0 42.496-34.4064 76.9024-76.8512 76.9024H307.3024c-42.496 0-76.9024-34.4064-76.9024-76.9024v-95.232c0-42.496 34.4064-76.9024 76.9024-76.9024z m296.704 51.2a25.6 25.6 0 0 0-25.6512 25.6512v95.2832a25.6 25.6 0 0 0 25.6 25.6h95.2832a25.6 25.6 0 0 0 25.6512-25.6v-95.232a25.6 25.6 0 0 0-25.6-25.6512h-95.2832z m0-51.2h95.232c42.496 0 76.9024 34.4064 76.9024 76.8512v95.2832c0 42.496-34.4064 76.9024-76.9024 76.9024h-95.232c-42.496 0-76.9024-34.4064-76.9024-76.9024v-95.232c0-42.496 34.4064-76.9024 76.9024-76.9024z"  /></svg>';
  
      editBtnWrapper.appendChild(editBtn);
  
  
  
      var cancel = document.createElement("div");
      cancel.classList.add("cp-upload-ui-item-cancel");
      cancel.style.display = "none";
      cancel.innerText = "✖";
      /* need to fix end */
  
      var innerProgress = document.createElement("div");
      innerProgress.classList.add("cp-upload-ui-item-inner-progress");
      innerProgress.style.width = 0;
      innerProgress.style.backgroundColor = this.options.theme_color;
      var percent = document.createElement("span");
      percent.classList.add("cp-upload-ui-item-progress-percent");
      var size = document.createElement("span");
      size.classList.add("cp-upload-ui-item-size");
      size.innerText = this.bytesToSize(file.size);
      /* need to fix */
      if (this.options.background_mode) {
  
        var innerProgressSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
                                  viewBox="0 0 300 300" preserveAspectRatio="none" style="width:40; height:40; top:0; left:0;">
                                  <circle cx="52" cy="110" r="${this.options.show_percentage ? '100' : '57'}" class="green-halo" fill="#ffffff" stroke="#0086cf" stroke-width="15"
                                      stroke-dasharray="0,20000" transform="rotate(-90,100,100)" />
                                  <circle cx="52" cy="110" r="${this.options.show_percentage ? '100' : '57'}" fill="#ffffff" stroke="#a0a0a0" stroke-width="15"
                                      stroke-dasharray="${this.options.show_percentage ? '630,20000' : '350,20000'}" transform="rotate(-90,100,100)" style="opacity:0.4" />
                                  ${this.options.show_percentage ? '<text x="105" y="155" fill="black" class="percent_text" style="font-size: 80px;font-weight: bold;" text-anchor="middle" alignment-baseline="central">0%</text>' : ''}
                                </svg>`;
        var mimeType = document.createElement("span");
        mimeType.classList.add("cp-upload-ui-item-mimeType");
        switch (file.type) {
          case "application/pdf":
            mimeType.classList.add("cp-upload-ui-item-mimeType--pdf");
            break;
          case "application/x-msdownload":
            mimeType.classList.add("cp-upload-ui-item-mimeType--x-msdownload");
            break;
          case "image/jpeg":
            mimeType.classList.add("cp-upload-ui-item-mimeType--jpeg");
            break;
          case "image/png":
            mimeType.classList.add("cp-upload-ui-item-mimeType--png");
            break;
          case "video/mp4":
            mimeType.classList.add("cp-upload-ui-item-mimeType--mp4");
            break;
          case "application/zip":
            mimeType.classList.add("cp-upload-ui-item-mimeType--zip");
            break;
          case "text/plain":
            mimeType.classList.add("cp-upload-ui-item-mimeType--plain");
            break;
          default:
            mimeType.classList.add("cp-upload-ui-item-mimeType--other");
            break;
        }
  
        div.appendChild(mimeType);
        innerProgress.innerHTML = innerProgressSVG;
      }
      /* need to fix end */
      progress.appendChild(innerProgress);
      div.appendChild(title);
      div.appendChild(progress);
      progress.appendChild(percent);
      /* need to fix */
      if (!this.options.background_mode) {
        div.appendChild(size);
      } else {
        div.appendChild(editBtnWrapper);
        if(!linkMode) {
          div.appendChild(retry);
          progress.appendChild(cancel);
          retry.addEventListener("click", function (e) {
            var uploadIndex = self.returnCurrentIndex(file);
            self.uploads[uploadIndex].isRetry = true;
            self.uploads[uploadIndex].start();
          });
          cancel.addEventListener("click", function (e) {
            var item = document.querySelector(
              '.cp-upload-ui-item[data-drawtimestamp="' + file.drawTimestamp + '"]'
            );
            item.classList.add("canceled");
            //document.querySelector('.cp-upload-ui-preview--background--counter').innerText = document.querySelectorAll('.cp-upload-ui-item.canceled').length + " items canceled"
            var uploadIndex = self.returnCurrentIndex(file);
            var oldState = self.uploads[uploadIndex].uploadState;
            self.uploads[uploadIndex].uploadState = "Aborted";
            // delete self.uploads[uploadIndex].unique_id;
            self.uploads[uploadIndex].stop();
            if (oldState == "Uploading" && self.areAllUploadsDone()) {
              var next = self.getNextUpload();
              if (next && next.uploadState != "Aborted") {
            next.start?.();
          } else {
           self.uploading = false;
          }
            }
          });
        }
      } /* need to fix end */
    },
  
    updateProgress: function (e) {
      var pendingDiv = this.preview.querySelector(
        "[data-drawtimestamp='" + e.file.drawTimestamp + "']"
      );
      pendingDiv.classList.remove("canceled");
      if (pendingDiv) {
        var progress = pendingDiv.getElementsByClassName(
          "cp-upload-ui-item-inner-progress"
        )[0];
        var percent = pendingDiv.getElementsByClassName(
          "cp-upload-ui-item-progress-percent"
        )[0];
      }
      var percentComplete = e.percentComplete;
      if (e.uploadState == "Complete") {
        percentComplete = 100;
      }
      if (this.options.background_mode) {
        var counter = this.getStatusCounts();
        if (counter["pending"] + counter["uploading"] == 1) {
          document.querySelector(
            ".cp-upload-ui-preview--background--counter"
          ).innerText = "1 item uploading";
        } else {
          document.querySelector(
            ".cp-upload-ui-preview--background--counter"
          ).innerText =
            counter["pending"] + counter["uploading"] + " items uploading";
        }
        if (progress && progress.children) {
          var progressChild = progress.children[0];
        }
        if (progressChild && progressChild.children) {
          if(this.options.show_percentage){
            progressChild.children[0].setAttribute(
              "stroke-dasharray",
              e.percentComplete * 6.3 + ", 20000"
            );
          }else{
            progressChild.children[0].setAttribute(
              "stroke-dasharray",
              e.percentComplete * 3.5 + ", 20000"
            );
          }
          
        }
      } else {
        if (progress) {
          progress.style.width = percentComplete + "%";
        }
        if (percent) {
          percent.innerText = Math.round(percentComplete) + "%";
        }
      }
  
      var percentText = this.preview.querySelector(".cp-upload-ui-item[data-drawtimestamp='" + e.file.drawTimestamp + "'] .percent_text");
      if(percentText){
        percentText.innerHTML = Math.round(percentComplete) + '%';
      }
    },
  
    uploadComplete: function (file,e) {
      var pendingDiv = this.preview.querySelector(
        "[data-drawtimestamp='" + file.drawTimestamp + "']"
      );
      pendingDiv.classList.remove("cp-upload-ui-item-waiting");
  
      if (this.options.background_mode) {
        var item = document.querySelector(
          '.cp-upload-ui-item[data-drawtimestamp="' + file.drawTimestamp + '"]'
        );
        item.classList.add("completed");
        item.classList.remove("canceled");
  
        if (
          document.querySelectorAll(".cp-upload-ui-item.completed").length == 1
        ) {
          document.querySelector(
            ".cp-upload-ui-preview--background--counter"
          ).innerText = "1 item uploaded";
        } else {
          document.querySelector(
            ".cp-upload-ui-preview--background--counter"
          ).innerText =
            document.querySelectorAll(".cp-upload-ui-item.completed").length +
            " items uploaded";
        }
  
        if(file && file.options && file.options.edit_view && typeof file.options.edit_button_click == 'function') {
          pendingDiv.querySelector('.cp-upload-ui-item-edit').style.display = 'block';
          pendingDiv.querySelector('.cp-upload-ui-item-edit--btn').onclick = function(){
            file.options.edit_button_click(e.rid)
          }
        }
  
        return;
      }
  
      if (file.type.indexOf("video/") > -1) {
        pendingDiv.innerHTML = "";
        var fr = new FileReader();
        fr.onload = function () {
          var video = document.createElement("video");
          video.src = fr.result;
          video.style.width = "100%";
          video.style.height = "100%";
          video.controls = true;
          pendingDiv.appendChild(video);
        };
        fr.readAsDataURL(file);
      } else if (file.type.indexOf("image/") > -1) {
        pendingDiv.innerHTML = "";
        pendingDiv.style.justifyContent = "center";
        var fr = new FileReader();
        fr.onload = function () {
          var image = document.createElement("img");
          image.src = fr.result;
          pendingDiv.appendChild(image);
        };
        fr.readAsDataURL(file);
      } else {
        var progress = pendingDiv.getElementsByClassName(
          "cp-upload-ui-item-progress"
        )[0];
        progress.parentNode.removeChild(progress);
      }
    },
  
    uploadError: function (e) {
      var item = this.preview.querySelector(
        '.cp-upload-ui-item[data-drawtimestamp="' + e.file.drawTimestamp + '"]'
      );
      item.classList.add("canceled");
      item.classList.remove("completed");
      item.classList.remove("cp-upload-ui-item-waiting");
  
      if (!this.options.background_mode) {
        var progress = item.getElementsByClassName(
          "cp-upload-ui-item-inner-progress"
        )[0];
        progress.style.backgroundColor = this.options.theme_color;
        item.style.border = "1px solid red";
      }
    },
  
    bytesToSize: function (bytes) {
      var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      if (bytes == 0) return "0 Byte";
      var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
    },
  
    closestByClass: function (el, cl) {
      // Traverse the DOM up with a while loop
      while (!el.className || el.className.indexOf(cl) === -1) {
        el = el.parentNode;
        if (!el) {
          return null;
        }
      }
      return el;
    },
  
    isScriptLoaded: function (path) {
      var scripts = document.getElementsByTagName("script");
      var alreadyLoaded = false;
  
      if (scripts.length) {
        for (var scriptIndex in scripts) {
          if (
            !alreadyLoaded &&
            scripts[scriptIndex].src &&
            scripts[scriptIndex].src.indexOf(path) > -1
          ) {
            alreadyLoaded = true;
            break;
          }
        }
      }
  
      return alreadyLoaded;
    },
  
    isCssLoaded: function (path) {
      var links = document.getElementsByTagName("link");
      var alreadyLoaded = false;
  
      if (links.length) {
        for (var linkIndex in links) {
          if (
            !alreadyLoaded &&
            links[linkIndex].href &&
            links[linkIndex].href.indexOf(path) > -1
          ) {
            alreadyLoaded = true;
            break;
          }
        }
      }
  
      return alreadyLoaded;
    },
  
    returnCurrentIndex: function (element) {
      var self = this;
      if (self.uploads.length > 0) {
        var idx = 0;
        self.uploads.forEach(function (el, index) {
          if (el === null) return;
          if (
            (element &&
              el &&
              element.file &&
              el.file.drawTimestamp == element.file.drawTimestamp &&
              el.file.unique_id == element.file.unique_id) ||
            (element.drawTimestamp &&
              element.drawTimestamp == el.file.drawTimestamp)
          ) {
            idx = index;
          }
        });
      }
      return idx;
    },
  
    areAllUploadsDone: function () {
      // return this.uploads.every(element => element === null );
      return this.uploads.every((element) => element.uploadState === "Complete" || element.uploadState === "Aborted");
    },
  
    getNextUpload: function () {
      var element;
      for (var i = 0; i < this.uploads.length; i++) {
        if (this.uploads[i] === null) continue;
        if (
          typeof this.uploads[i].uploadState == "undefined" ||
          this.uploads[i].uploadState == "Pending"
        ) {
          element = this.uploads[i];
          break;
        }
      }
      return element || null;
    },
  
    getStatusCounts() {
      var counter = {
        pending: 0,
        canceled: 0,
        completed: 0,
        uploading: 0,
      };
      for (var i = 0; i < this.uploads.length; i++) {
        if (this.uploads[i] === null) continue;
        if (
          typeof this.uploads[i].uploadState == "undefined" ||
          this.uploads[i].uploadState == "Pending"
        ) {
          counter.pending++;
        } else if (
          this.uploads[i].uploadState == "Error" ||
          this.uploads[i].uploadState == "Aborted"
        ) {
          counter.canceled++;
        } else if (this.uploads[i].uploadState == "Uploading") {
          counter.uploading++;
        } else if (this.uploads[i].uploadState == "Completec") {
          counter.completed++;
        }
      }
      return counter;
    },
  
    // Public Methods ____________________________________________________
    makeAreaDropable: function (element, options) {
      var self = this;
      if (options && options.createUI) {
        this.createUI(element, options);
      } else {
        // File Paster Feature
        if(options && options.copy_paste) {
          if(options.paste_element) {
            self.makeAreaPasteable(options.paste_element, options)
          } else {
            self.makeAreaPasteable(element, options)
          }
        }
  
        this.DragAndDropUpload(element, options);
        if (element && element.querySelector('input[type="file"]')) {
          self.addInputToUploaderUI(
            element.querySelector('input[type="file"]'),
            options
          );
        }
      }
    },
  
    makeAreaPasteable: function(element, options) {
      var self = this;
      const filePasterOptions = Object.assign(options, {
        paste_done_callback: (files) => {
          if (self.options.multiple) {
            self.startUpload(files);
          } else if (!self.uploading) {
            self.startUpload([files[0]]);
          }
        }
      })
      var filePaster = new cpFileInputPaster(filePasterOptions)
      filePaster.makeAreaPaste(element, filePasterOptions)
    },
  
    addInputToUploaderUI: function (inputElement, options) {
      var self = this;
      inputElement.addEventListener("change", function () {
        var fileInput = this;
        self.inputOnChange(fileInput, options);
      });
    },
  
    cancelDropableArea: function (element) {
      element.ondragover = null;
      element.ondragleave = null;
      element.ondrop = null;
    },
  
    start: function () {
      this.loadDependencies();
    },
  
    stop: function (index) {
      if(!index){
        var firstOne = this.uploads.shift();
        firstOne.stop();
        this.uploading = false;
      }
    },
  
    convertToRGB: function (color) {
      var rgb = "";
      if (color.indexOf("#") > -1) {
        //HEX TO RGB
        let r = 0,
          g = 0,
          b = 0;
        if (color.length == 4) {
          r = "0x" + color[1] + color[1];
          g = "0x" + color[2] + color[2];
          b = "0x" + color[3] + color[3];
        } else if (color.length == 7) {
          r = "0x" + color[1] + color[2];
          g = "0x" + color[3] + color[4];
          b = "0x" + color[5] + color[6];
        }
        rgb = "rgb(" + +r + "," + +g + "," + +b + ")";
      } else {
        // STRING COLOR
        var s = new Option().style;
        s.color = color;
        if (s.color == color) {
          let fakeDiv = document.createElement("div");
          fakeDiv.style.color = color;
          document.body.appendChild(fakeDiv);
  
          let cs = window.getComputedStyle(fakeDiv),
            pv = cs.getPropertyValue("color");
  
          document.body.removeChild(fakeDiv);
  
          rgb = pv;
        }
      }
      return rgb;
    },
  
    addLinkToUploaderUI: function (uploaderInfo, pOptions) {
      var self = this;
      var uploaderWithURL = new UploaderWithUrl(uploaderInfo, {
          ...pOptions,
          onUploadProgress: function(data) {
            const obj = {
              file: data.data,
              percentComplete: data.percentComplete
            }
            obj.file.drawTimestamp = obj.file.status_id
  
            self.updateProgress(obj)
          },
          onUploadComplete: function(data) {
            data.file = {
              drawTimestamp: data.data.status_id
            }
            self.updateProgress(data)
            self.uploadComplete(data.file,data);
            if(self.uploads.find(el => el.drawTimestamp == data.data.status_id)) {
              self.uploads.find(el => el.drawTimestamp == data.data.status_id).uploadState = 'Complete'
            } 
            if(self.areAllUploadsDone() && typeof pOptions.uploads_done_cb == 'function') {
              pOptions.uploads_done_cb();
            }
          },
          onRefSet: function(uploadInfo, reference, data) {
            if(typeof pOptions.ref_set_cb == 'function') {
              pOptions.ref_set_cb(uploadInfo, reference, data);
            } 
          },
          onUploadStart: function(info, data) {
            var backgroundConatiner = document.querySelector(
              ".cp-upload-ui-preview--background"
            );
            if (
              backgroundConatiner.style.display == 'none'
            ) {
              backgroundConatiner.style.display = 'block'
            }
            info.drawTimestamp = data.status_id
            self.uploads.push(info);
            self.drawItemUI(info, true)
          }
      });
      uploaderWithURL.start();
    }
  };
  