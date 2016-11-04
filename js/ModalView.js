(function(){

	function ModalView(){
		var that = this;
		var main_html = String()
			+  '<div class="modal-view-part">'	
			+		'<span class="modal-prev-button"></span>'
			+		'<img class="modal-image" src="" alt="">'
			+		'<span class="modal-next-button"></span>'
			+	'</div>'
			+	'<div class="modal-loading"></div>'
			+	'<div class="modal-close-button"></div>';

		this.modalItemsInfoArray = Array();
		this.itemIndex           = null;
		this.currentImage = {
			width: 0,
			height: 0
		};

		//	创建遮罩和弹出框层
		this.modalMask = $('<div id="modal-mask"></div>');
		this.modalMain = $('<div id="modal-main"></div>');

		//	初始化DOM节点
		this.bodyNode = $(document.body);
		this.modalMain.html(main_html);
		this.bodyNode.append(this.modalMask, this.modalMain);

		//	获取需要操作的元素
		this.modalViewPart   = this.modalMain.find('.modal-view-part');
		this.modalImage      = this.modalMain.find('.modal-image');
		this.closeButton     = this.modalMain.find('.modal-close-button');
		this.loading         = this.modalMain.find('.modal-loading')
		this.modalNextButton = this.modalMain.find('.modal-next-button');
		this.modalPrevButton = this.modalMain.find('.modal-prev-button');

		this.initialize();
	}

	ModalView.prototype = {
		constructor: ModalView,

		initialize: function(){
			var that = this;

			//	获取页面中需要添加效果的元素
			this.getModalItems();
			this.events();
		},

		events: function(){
			var that = this;

			this.bodyNode.delegate('.g-modal', 'click', function(event) {
				event.stopPropagation();

				that.getArrayIndex($(this));
				that.displayButton();
				that.showModal($(this).attr('data-src'));

				return false;
			});

			//	给Mask层添加点击关闭事件
			this.modalMask.click(function(event) {
				that.modalMain.fadeOut(300);
				$(this).fadeOut(500);
			});

			//	给关闭按钮添加点击事件
			this.closeButton.click(function(event) {
				that.modalMain.fadeOut(300);
				that.modalMask.fadeOut(500);
			});

			//	图片切换按钮的显示逻辑
			this.modalNextButton.hover(function() {
				if(!$(this).hasClass('disabled') 
					&& that.modalItemsInfoArray.length > 1 
					&& that.itemIndex != that.modalItemsInfoArray.length - 1){
						$(this).addClass('modal-next-button-show');
				}
			}, function() {
				$(this).removeClass('modal-next-button-show');
			});

			this.modalPrevButton.hover(function() {
				if(!$(this).hasClass('disabled') 
					&& that.itemIndex != 0 
					&& that.modalItemsInfoArray.length > 1){
						$(this).addClass('modal-prev-button-show');
				}
			}, function() {
				$(this).removeClass('modal-prev-button-show');
			});

			//	图片切换按钮的调用
			this.modalNextButton.click(function(event) {
				if(!$(this).hasClass('disabled')){
					that.switchImage('next');
				}
			});

			this.modalPrevButton.click(function(event) {
				if(!$(this).hasClass('disabled')){
					that.switchImage('prev');
				}
			});

			var timer = undefined;
			//	窗口调整大小后重置图片尺寸
			$(window).resize(function(event) {
				if(!timer){
					timer = setTimeout(function(){
						that.changeImageSize(that.currentImage.width, that.currentImage.height);
						timer = undefined;	
					}, 500);
				}
			});
		},

		showModal: function(src){
			var that = this;

			var windowWidth  = $(window).width();
			var windowHeight = $(window).height();

			that.modalMask.fadeIn();
			that.modalMain.fadeIn();

			//	设定弹出框尺寸
			this.modalMain.css({
				width: windowWidth / 2,
				height: windowHeight / 2,
				//	modalMain的宽度为屏幕的1/2，所以屏幕四分之一宽度也就是modalMain的一半,marginLeft设定为这个值就可以让modalMain居中
				marginLeft: -(windowWidth / 4),
				top: windowHeight / 4
			});

			that.setImageSize(src);
		},

		setImageSize: function(src){
			var that = this;

			that.loading.show();
			that.closeButton.hide();
			that.modalImage.hide();

			//	因为图片元素的尺寸是直接设置上去的，第二次会直接读取到上一张图片的尺寸，清空才能避免
			// that.modalImage.css({
			// 	width: 'auto',
			// 	height: 'auto'
			// });

			//	取得图片的真实宽高
			this.earlyImage(src, function(image){
				that.modalImage.attr('src', src);
				that.currentImage = {
					width: image.width,
					height: image.height
				};
				that.changeImageSize(image.width, image.height);
			});	

		},

		changeImageSize: function(width, height){
			var that = this;

			that.loading.show();
			that.closeButton.hide();
			that.modalImage.hide();

			//	修改图片尺寸为当前页面可容纳的尺寸
			//	图片预载好了，下面可以将弹出框运动至可以容纳图片和兼容视口的尺寸
			var windowWidth  = $(window).width();
			var windowHeight = $(window).height();
			var imageWigth   = width;
			var imageHeight  = height;

			//	如果图片宽高大于浏览器的视口的宽高比，计算是否溢出
			var scale = Math.min(windowWidth/(imageWigth + 10),
							windowHeight/(imageHeight + 10), 1);

			imageWigth  = imageWigth * scale / 1.1;
			imageHeight = imageHeight * scale / 1.1;

			//	放大弹出层动画执行完毕后，设置图片尺寸并将其显示
			that.modalMain.animate({
				width      : imageWigth,
				height     : imageHeight,
				marginLeft : -(imageWigth / 2),
				top        : (windowHeight - imageHeight) / 2
			}, 300, function(){
				that.loading.hide();
				that.modalImage.css({
					width: imageWigth - 10,
					height: imageHeight - 10
				}).fadeIn();
				that.closeButton.show();
			});
		},

		earlyImage: function(src, callBack){
			var image = new Image();

			if(window.ActiveXObject){
				image.onreadystatechange = function(){
					if(this.readyState == 'complete'){
						callBack(image);
					}
				};
			}else{
				image.onload = function(){
					callBack(image);
				};
			}

			image.src = src;
		},

		getModalItems: function(){
			var that     = this;
			var itemArray = Array();

			itemArray = that.bodyNode.find('.g-modal');
			itemArray.each(function(index, el) {
				that.modalItemsInfoArray.push({
					'id': $(this).offset().left + $(this).offset().top,
					'src' : $(this).attr('data-src'),
					'alt' : $(this).attr('alt')
				});
			});
		},

		getArrayIndex: function(elem){
			var that = this;
			var index = 0;
			
			$(this.modalItemsInfoArray).each(function(i, el) {
				var id = $(elem).offset().left + $(elem).offset().top;
				if(this.id === id){
					that.itemIndex = i;
					return;
				}
			});
		},

		switchImage: function(dir){
			var that = this;

			if(dir === 'next'){
			 	that.setImageSize(that.modalItemsInfoArray[++that.itemIndex].src);
			}else if(dir === 'prev'){
				that.setImageSize(that.modalItemsInfoArray[--that.itemIndex].src);
			}
			that.displayButton();
		},
		
		displayButton: function(){
			var that = this;

			if(!that.modalItemsInfoArray.length){return;}
			lg(that.itemIndex);
			if(that.itemIndex === 0){	
				//	第一个元素的情况
				that.modalPrevButton.removeClass('modal-prev-button-show');
				that.modalPrevButton.addClass('disabled');
			}else if(that.itemIndex === (that.modalItemsInfoArray.length - 1)){
				//	最后一个元素的情况
				that.modalNextButton.removeClass('modal-next-button-show');
				that.modalNextButton.addClass('disabled');
			}else{
				//	其他情况
				that.modalPrevButton.removeClass('disabled');
				that.modalNextButton.removeClass('disabled');
			}
		}
	};

	new ModalView();

})();