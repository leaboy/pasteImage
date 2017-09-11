var pasteImage = new function(){
    var self = this;

    self.option = {
        maxSize: 2 * 1024 * 1024,
        maxWidth: $(window).width()/2,
        maxHeight: $(window).height()/2,
        minWidth: 200,
        minHeight: 200
    };

    var file = function (blob) {
        var i = 1,
            r = /\.([^.]+)$/;

        this.source = blob;
        this.name = blob.name || "untitled" + i++;

        var ext = r.exec(blob.name) ? RegExp.$1.toLowerCase() : "";
        if(!ext && blob.type){
            ext = /\/(jpg|jpeg|png|gif|bmp)$/i.exec(blob.type) ? RegExp.$1.toLowerCase() : "";
            this.name += "." + ext;
        }
        this.ext = ext;
        this.lastModifiedDate = blob.lastModifiedDate || (new Date).toLocaleString();

        this.size = blob.size || 0;
        this.type = !blob.type && this.ext && ~"jpg,jpeg,png,gif,bmp".indexOf(this.ext) ? "image/" + ("jpg" === this.ext ? "jpeg" : this.ext) : blob.type || "application/octet-stream";

        this.slice = function(start, end) {
            return this.exec("slice", start, end);
        };

        this.getSource = function() {
            return this.source;
        };
    };

    self.init = function(option) {
        $.extend(self.option, option);

        self.elem = $('body');

        self.destroy();
        self.elem.on('paste', '.layim-chat-textarea textarea', self.hander);
    };

    self.hander = function(e) {
        self.destroy();

        self.files = [];

        var items = e.originalEvent.clipboardData && e.originalEvent.clipboardData.items || [];
        for (var i = items.length - 1; i >= 0; i--) {
            var blob, item = items[i];
            if ('file' == item.kind && (blob = item.getAsFile())){
                self.files.push(new file(blob));
            }
        }
        if(self.files.length){
            e.preventDefault();
            e.stopPropagation();

            self.upload();
        }

        setTimeout(self.init, 1000);
    };

    self.preview = function (blob, res) {
        var file = new FileReader();
        file.addEventListener('loadend', function(e){
            var layerPaddingW = 40,
                layerPaddingH = 128,
                winWidth = $(window).width(),
                winHeight = $(window).height(),
                imgWidth = res.data.width || self.option.minWidth,
                imgHeight = res.data.height || self.option.minHeight;

            if(imgWidth > winWidth){
                imgHeight = (self.option.maxWidth/imgWidth)*imgHeight;
                imgWidth = self.option.maxWidth;
            }

            if(imgHeight > winHeight){
                imgWidth = (self.option.maxHeight/imgHeight)*imgWidth;
                imgHeight = self.option.maxHeight;
            }

            var offsetLeft = (winWidth - imgWidth - layerPaddingW)/2,
                offsetTop = (winHeight - imgHeight - layerPaddingH)/2;

            if(offsetLeft < 0 || offsetTop < 0){
                offsetLeft = offsetTop = 0;
            }

            // preview in a dialog
            // var $preview = '<img src="'+ e.target.result +'" id="pastePreview" width="'+ imgWidth +'">';
        });
        file.readAsDataURL(blob.getSource());
    };

    self.upload = function(){
        // loading

        if(!self.files || !self.files.length){
            return;
        }

        for (var i = self.files.length - 1; i >= 0; i--) {
            var blob = self.files[i];

            if(blob.size > self.option.maxSize){
                // out of size，limit 2M;
                // show msg, close loading
                return;
            }

            var data = new FormData();
            data.append('file', blob.getSource(), blob.name);

            $.ajax({
                method: 'POST',
                url: '/chat/api-upload-image',
                data: data,
                processData: false,
                contentType: false,
                success: function (json) {
                    var res = JSON.parse(json);
                    if(res.success || res.code == 0){
                        if(!res.data.src){
                            // failed
                            return false;
                        }

                        // preview
                        self.preview(blob, res);

                    }else{
                        // failed
                    }
                },
                error: function (res) {
                    // failed
                },
                complete: function () {
                    // close loading
                }
            });
        }
    };

    self.destroy = function() {
        self.elem.off('paste', self.hander);
    };
};