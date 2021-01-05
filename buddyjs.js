/**
 * bootstrap-imageupload v1.1.2
 * https://github.com/egonolieux/bootstrap-imageupload
 * Copyright 2016 Egon Olieux
 * Released under the MIT license
 */

if (typeof jQuery === 'undefined') {
    throw new Error('bootstrap-imageupload\'s JavaScript requires jQuery.');
}

(function($) {
    'use strict';

    var options = {};

    var methods = {
        init: init,
        disable: disable,
        enable: enable,
        reset: reset
    };

    // -----------------------------------------------------------------------------
    // Plugin Definition
    // -----------------------------------------------------------------------------

    $.fn.imageupload = function(methodOrOptions) {
        var givenArguments = arguments;

        return this.filter('div').each(function() {
            if (methods[methodOrOptions]) {
                methods[methodOrOptions].apply($(this), Array.prototype.slice.call(givenArguments, 1));
            }
            else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
                methods.init.apply($(this), givenArguments);
            }
            else {
                throw new Error('Method "' + methodOrOptions + '" is not defined for imageupload.');
            }
        });
    };

    $.fn.imageupload.defaultOptions = {
        allowedFormats: [ 'jpg', 'jpeg', 'png', 'gif' ],
        //maxWidth: 250,
        //maxHeight: 250,
        maxFileSizeKb: 5120,
        preview: false,
    };

    // -----------------------------------------------------------------------------
    // Public Methods
    // -----------------------------------------------------------------------------

    function init(givenOptions) {
        options = $.extend({}, $.fn.imageupload.defaultOptions, givenOptions);

        var $imageupload = this;
        var $fileTab = $imageupload.find('.file-tab');
        var $fileTabButton = $imageupload.find('.panel-heading .btn-file');
        //var $browseFileButton = $fileTab.find('input[type="file"]');
        var $browseFileButton = $fileTab.find('.upload-btn');
        //var $removeFileButton = $fileTab.find('.btn:eq(1)');
        var $removeFileButton = $fileTab.find('.remove-btn');
        //Reset Preview Image Button
        var $resetFileButton = $('.btn-reset');

        var $urlTab = $imageupload.find('.url-tab');
        var $urlTabButton = $imageupload.find('.panel-heading .btn-url');
        var $submitUrlButton = $urlTab.find('.submit-btn');
        var $removeUrlButton = $urlTab.find('.remove-btn');

        var $uploadIcon = $fileTab.find('#upload-icon');


        // Do a complete reset.
        resetFileTab($fileTab);
        resetUrlTab($urlTab);
        showFileTab($fileTab);
        enable.call($imageupload);


        if(options.preview){
            $fileTab.prepend(getImageThumbnailHtml(options.preview));
            $browseFileButton.find('span').text('Change');
        }else{
            $resetFileButton.css('display','none');
        }
        if(options.preview){

        }
        // Unbind all previous bound event handlers.
        $fileTabButton.off();
        $browseFileButton.off();
        $removeFileButton.off();
        $resetFileButton.off();
        $urlTabButton.off();
        $submitUrlButton.off();
        $removeUrlButton.off();

        $fileTabButton.on('click', function() {
            $(this).blur();
            showFileTab($fileTab);
        });

        $browseFileButton.on('change', function() {
            $(this).blur();
            submitImageFile($fileTab);
        });

        $removeFileButton.on('click', function() {
            $(this).blur();
            resetFileTab($fileTab);
        });
        $resetFileButton.on('click',function () {
            $(this).blur();
            resetFileTab($fileTab);
            resetUrlTab($urlTab);
            if(options.preview){
                if($(this).closest('.file-tab').length){
                $fileTab.prepend(getImageThumbnailHtml(options.preview));
                }else{
                    $urlTab.prepend(getImageThumbnailHtml(options.preview));
                }
            }
        });
        $urlTabButton.on('click', function() {
            $(this).blur();
            showUrlTab($urlTab);
        });

        $submitUrlButton.on('click', function() {
            $(this).blur();
            submitImageUrl($urlTab);
        });

        $removeUrlButton.on('click', function() {
            $(this).blur();
            resetUrlTab($urlTab);
        });
    }

    function disable() {
        var $imageupload = this;
        $imageupload.addClass('imageupload-disabled');
    }

    function enable() {
        var $imageupload = this;
        $imageupload.removeClass('imageupload-disabled');
    }

    function reset() {
        var $imageupload = this;
        init.call($imageupload, options);
    }

    // -----------------------------------------------------------------------------
    // Private Methods
    // -----------------------------------------------------------------------------


    function getAlertHtml(message) {
        var html = [];
        html.push('<div class="alert alert-danger alert-dismissible">');
        html.push('<button type="button" class="close" data-dismiss="alert">');
        html.push('<span>&times;</span>');
        html.push('</button><span class="alert-message">' + message+ '</span>');
        html.push('</div>');
        return html.join('');
    }

    function getImageThumbnailHtml(src) {
        return '<div class="card-text">' +
            '<img src="' + src + '" alt="Image preview" class="img-thumbnail img-responsive" style="max-width: ' + options.maxWidth + 'px; max-height: ' + options.maxHeight + 'px"><hr></div>';
    }

    function getFileExtension(path) {
        return path.substr(path.lastIndexOf('.') + 1).toLowerCase();
    }

    function isValidImageFile(file, callback) {
        // Check file size.
        if (file.size / 1024 > options.maxFileSizeKb)
        {
            callback(false, 'File is too large (max ' + options.maxFileSizeKb + 'kB).');
            return;
        }

        // Check image format by file extension.
        var fileExtension = getFileExtension(file.name);
        if ($.inArray(fileExtension, options.allowedFormats) > -1) {
            callback(true, 'Image file is valid.');
        }
        else {
            callback(false, 'File type is not allowed.');
        }
    }

    function isValidImageUrl(url, callback) {
        var timer = null;
        var timeoutMs = 3000;
        var timeout = false;
        var image = new Image();

        image.onload = function() {
            if (!timeout) {
                window.clearTimeout(timer);

                // Strip querystring (and fragment) from URL.
                var tempUrl = url;
                if (tempUrl.indexOf('?') !== -1) {
                    tempUrl = tempUrl.split('?')[0].split('#')[0];
                }

                // Check image format by file extension.
                var fileExtension = getFileExtension(tempUrl);
                if ($.inArray(fileExtension, options.allowedFormats) > -1) {
                    callback(true, 'Image URL is valid.');
                }
                else {
                    callback(false, 'File type is not allowed.');
                }
            }
        };

        image.onerror = function() {
            if (!timeout) {
                window.clearTimeout(timer);
                callback(false, 'Image could not be found.');
            }
        };

        image.src = url;

        // Abort if image takes longer than 3000ms to load.
        timer = window.setTimeout(function() {
            timeout = true;
            image.src = '???'; // Trigger error to stop loading.
            callback(false, 'Loading image timed out.');
        }, timeoutMs);
    }

    function showFileTab($fileTab) {
        var $imageupload = $fileTab.closest('.imageupload');
        var $fileTabButton = $imageupload.find('.panel-heading .btn-file');

        if (!$fileTabButton.hasClass('active')) {
            var $urlTab = $imageupload.find('.url-tab');


            // Change active tab buttton.
            $imageupload.find('.panel-heading .btn-url').removeClass('active');
            $fileTabButton.addClass('active');

            // Hide URL tab and show file tab.
            $urlTab.hide();
            $urlTab.removeClass('d-block');
            $fileTab.show();
            resetUrlTab($urlTab);
            if(options.preview){
                $fileTab.prepend(getImageThumbnailHtml(options.preview));
            }
        }
    }

    function resetFileTab($fileTab) {
        $fileTab.find('.alert').remove();
        $fileTab.find('div.card-text').remove();
        $fileTab.find('#upload-icon').removeClass('fa-edit');
        if(options.preview){
            $fileTab.find('.btn span').text('Change');
        }else{
            $fileTab.find('.btn span').text('Browse');
            $('#image_old').val('');
        }
        $fileTab.find('.remove-btn').hide();
        $fileTab.find('input').val('');
    }

    function submitImageFile($fileTab) {
        var $browseFileButton = $fileTab.find('#upload-btn');
        var $removeFileButton = $fileTab.find('.remove-btn');
        var $fileInput = $browseFileButton.find('input');
        
        $fileTab.find('.alert').remove();
        $fileTab.find('div.card-text').remove();
        if(options.preview){
            $browseFileButton.find('span').text('Change');
        }else{
            $browseFileButton.find('span').text('Browse');
        }
        $removeFileButton.hide();

        // Check if file was uploaded.
        if (!($fileInput[0].files && $fileInput[0].files[0])) {
            return;
        }

        //$browseFileButton.prop('disabled', true);
        
        var file = $fileInput[0].files[0];

        isValidImageFile(file, function(isValid, message) {
            if (isValid) {
                var fileReader = new FileReader();

                fileReader.onload = function(e) {
                    // Show thumbnail and remove button.
                    $fileTab.prepend(getImageThumbnailHtml(e.target.result));
                    $browseFileButton.find('#upload-icon').removeClass('fa-upload').addClass('fa-edit');
                    $browseFileButton.find('span').text('Change');
                    $removeFileButton.css('display', 'inline-block');
                };

                fileReader.onerror = function() {
                    $fileTab.prepend(getAlertHtml('Error loading image file.'));
                    $fileInput.val('');
                };

                fileReader.readAsDataURL(file);
            }
            else {
                $fileTab.prepend(getAlertHtml(message));
                $browseFileButton.find('span').text('Browse');
                $fileInput.val('');
            }

            $browseFileButton.prop('disabled', false);
        });
    }

    function showUrlTab($urlTab) {
        var $imageupload = $urlTab.closest('.imageupload');
        var $urlTabButton = $imageupload.find('.panel-heading .btn-url');

        if (!$urlTabButton.hasClass('active')) {
            var $fileTab = $imageupload.find('.file-tab');

            // Change active tab button.
            $imageupload.find('.panel-heading .btn-file').removeClass('active');
            $urlTabButton.addClass('active');

            // Hide file tab and show URL tab.
            $fileTab.hide();
            $urlTab.addClass('d-block');
            $urlTab.show();
            resetFileTab($fileTab);
            if(options.preview){
                $urlTab.prepend(getImageThumbnailHtml(options.preview));
            }
        }
    }

    function resetUrlTab($urlTab) {
        $urlTab.find('.alert').remove();
        $urlTab.find('div.card-text').remove();
        $urlTab.find('#upload-icon').removeClass('fa-edit');
        $urlTab.find('.remove-btn').hide();
        if(options.preview) {
            $urlTab.find('#input-url').val(options.preview);
        }else{
            $urlTab.find('#input-url').val('');
        }
    }

    function submitImageUrl($urlTab) {
        var $urlInput = $urlTab.find('input[type="text"]');
        var $submitUrlButton = $urlTab.find('.submit-btn');
        var $removeUrlButton = $urlTab.find('.remove-btn');

        $urlTab.find('.alert').remove();
        $urlTab.find('img').remove();
        $removeUrlButton.hide();

        var url = $urlInput.val();
        if (!url) {
            $urlTab.prepend(getAlertHtml('Please enter an image URL.'));
            return;
        }

        $urlInput.prop('disabled', true);
        $submitUrlButton.prop('disabled', true);
        
        isValidImageUrl(url, function(isValid, message) {
            if (isValid) {
                // Submit URL value.
                $urlTab.find('input[type="hidden"]').val(url);

                // Show thumbnail and remove button.
                $(getImageThumbnailHtml(url)).insertAfter($submitUrlButton.closest('.input-group'));
                $removeUrlButton.css('display', 'inline-block');
            }
            else {
                $urlTab.prepend(getAlertHtml(message));
            }

            $urlInput.prop('disabled', false);
            $submitUrlButton.prop('disabled', false);
        });
    }
}(jQuery));
