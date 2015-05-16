window.onload = function() {

    (function() {

        /**
         * 事件对象
         *
         * @class
         */
        function EventTarget() {
            
            /**
             * 用于子代继承以及子代间共享数值
             *
             * @type {Object}
             *
             * @param {number} para.diffX diffX = event.clientX - target.offsetWidth
             *                 优化拖拽元素时，鼠标指针的位置
             * @param {number} para.diffY diffX = event.clientY - target.offsetHeight
             *                 优化拖拽元素时，鼠标指针的位置
             * @param {boolean} para.dragging 元素是否正在被拖拽
             * @param {number} para.targetOffsetWidth 元素的OffsetWidth值
             * @param {number} para.targetOffsetHeight 元素的ffsetHeight值
             * @param {number} para.targetPostionLeft 元素position为absolute时，left的值
             * @param {number} para.targetPostionTop 元素position为absolute时，top的值
             * @param {Array} para.config 保存元素初始宽度与高度，默认值为0，0
             */
            this.para = {
                diffX: 0,
                diffY: 0,
                dragging: false,
                targetOffsetWidth: undefined,
                targetOffsetHeight: undefined,
                targetPostionLeft: 0,
                targetPostionTop: 0,
                config: [0, 0]
            }
        }

        EventTarget.prototype = {
            constructor: EventTarget,
            /**
             * 事件处理函数，用于子类继承并改写
             *
             * @private
             * @param {Object} event 事件处理对象
             */
            handler: function(event) {
                throw new Error("Unsupported operation on an abstract class");
            },
            /**
             * 事件控制函数，负责绑定事件处理函数
             * 子类继承并改写
             *
             * @private
             * @param {Object} element 需要绑定事件处理函数的元素
             * @param {Object} elementControled 被事件处理函数控制的元素
             */
            enable: function(element, elementControled) {
                throw new Error("Unsupported operation on an abstract class");
            },
            /**
             * 获得事件发生时的目标元素
             *
             * @private
             * @return {Object} 返回事件发生时的目标元素
             */
            getTarget: function(event) {
                return event.target || event.srcElement;
            },
            /**
             * 获得事件对象
             *
             * @private
             * @return {Object} 返回事件对象
             */
            getEvent: function(event) {
                return event ? event : window.event;
            },
            /**
             * 阻止事件发生时浏览器的默认行为
             *
             * @private
             * @param {Object} event 事件对象
             */
            preventDefault: function(event) {
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
            },
            /**
             * 为元素添加事件处理函数
             *
             * @private
             * @param {Object} element 需要绑定事件处理函数的元素
             * @param {string} event 事件类型
             * @param {Function} listener 事件处理函数
             */
            addEvent: function(element, event, listener) {
                if (element.addEventListener) {
                    element.addEventListener(event, listener, false);
                } else if (element.attachEvent) {
                    element.attachEvent("on" + event, listener);
                } else {
                    element["on" + event] = listener;
                }
            },
            /**
             * 获得元素的offset相关值
             *
             * @private
             * @param {Object} element 需要获得offset相关值的元素
             * @return {Objcet} actual 元素的offset相关值对象
             *                  actual.left 元素左偏移量
             *                  actual.top 元素上偏移量
             *                  actual.width 元素水平方向上占用的空间大小
             *                  actual.height 元素垂直方向上占用的空间大小
             */
            getElementOffset: function(element) {
                var actual = {
                    left: element.offsetLeft,
                    top: element.offsetTop,
                    width: element.offsetWidth,
                    height: element.offsetHeight
                }
                var current = element.offsetParent;
                while (current !== null) {
                    actual.left += current.offsetLeft;
                    actual.top += current.offsetTop;
                    current = current.offsetParent;
                }
                return actual;
            },
            /**
             * 获得元素计算的样式
             * 因为只需获取width、height、top、left，够用即可
             *
             * @private
             * @param {Object} element 需要获得计算样式的元素
             * @param {string} propert 样式的名字
             * @return {number} 所需样式的数值
             */
            getElementCurrentStyle: function(element, property) {
                if (document.defaultView.getComputedStyle) {
                    var value = document.defaultView.getComputedStyle(element, null)[property];
                    return parseInt(value, "10");
                } else {
                    var value = element.currentStyle[property];
                    return parseInt(value, "10");
                }
            },
            /**
             * 函数节流
             * 避免因事件频繁触发而引起的浏览器卡顿
             * @private
             * @param {Function} method 被节流的函数
             * @param {number} delay 间隔
             * @param context 上下文
             */
            throttle: function(medthod, delay, context) {
                clearTimeout(medthod.tId);
                medthod.tId = setTimeout(function() {
                    medthod.call(context);
                }, delay);
            }
        }

        /**
         * 利用原型继承
         * 因为PhotoViewer子类可以共享para对象
         * 以此来实现control实例与dragdrop实例的交流
         *
         * @class
         * @extends EventTarget
         */

        function PhotoViewer() {}
        PhotoViewer.prototype = new EventTarget();

        var dragdrop = new PhotoViewer();
        var control = new PhotoViewer();


        /**
         * 点击处理
         *
         * @override
         */
        control.handler = function(event, elementControled) {
            var that = this;
            this.throttle(function() {
                event = that.getEvent(event);
                that.preventDefault(event);
                var target = that.getTarget(event);
                // 保存elementControled的宽度与高度的比值，便于放大、缩小时使用
                var scale = that.para.config[0] / that.para.config[1];

                if (elementControled.style.position != "absolute") {
                    elementControled.style.position = "absolute";
                }

                switch (event.type) {
                    case "click":
                        {
                            switch (target.id) {
                                case "control-up":
                                    {
                                        that.para.targetPostionTop = that.para.targetPostionTop - 60;
                                        elementControled.style.top = that.para.targetPostionTop + "px";
                                        break;
                                    }
                                case "control-down":
                                    {
                                        that.para.targetPostionTop = that.para.targetPostionTop + 60;
                                        elementControled.style.top = that.para.targetPostionTop + "px";
                                        break;
                                    }
                                case "control-left":
                                    {
                                        that.para.targetPostionLeft = that.para.targetPostionLeft - 60;
                                        elementControled.style.left = that.para.targetPostionLeft + "px";
                                        break;
                                    }
                                case "control-right":
                                    {
                                        that.para.targetPostionLeft = that.para.targetPostionLeft + 60;
                                        elementControled.style.left = that.para.targetPostionLeft + "px";
                                        break;
                                    }
                                case "control-increase":
                                    {
                                        that.para.targetOffsetWidth = that.para.targetOffsetWidth + 100 * scale;
                                        that.para.targetOffsetHeight = that.para.targetOffsetHeight + 100;
                                        elementControled.style.width = that.para.targetOffsetWidth + "px";
                                        elementControled.style.height = that.para.targetOffsetHeight + "px";
                                        break;
                                    }
                                case "control-reduce":
                                    {
                                        if (that.para.targetOffsetWidth < 50) {
                                            alert("The target too small to reduce;");
                                            break;
                                        }
                                        that.para.targetOffsetWidth = that.para.targetOffsetWidth - 100 * scale;
                                        that.para.targetOffsetHeight = that.para.targetOffsetHeight - 100;
                                        elementControled.style.width = that.para.targetOffsetWidth + "px";
                                        elementControled.style.height = that.para.targetOffsetHeight + "px";
                                        break;
                                    }
                                case "control-back":
                                    {
                                        //将elementControled初始化
                                        elementControled.style.width = that.para.config[0] + "px";
                                        elementControled.style.height = that.para.config[1] + "px";
                                        elementControled.style.top = 0 + "px";
                                        elementControled.style.left = 0 + "px";

                                        //将that.para初始化
                                        that.para.targetOffsetWidth = that.para.config[0];
                                        that.para.targetOffsetHeight = that.para.config[1];
                                        that.para.targetPostionLeft = 0;
                                        that.para.targetPostionTop = 0;
                                        break;
                                    }
                            }
                        }
                }
            }, 50);

        }


        /**
         * @override
         */
        control.enable = function(element, elementControled) {
            var that = this;
            this.addEvent(element, "click", function(event) {
                that.handler(event, elementControled);
            });
        }

        /**
         * 拖拽处理
         *
         * @override
         */
        dragdrop.handler = function(event, element) {
            var that = this;
            event = that.getEvent(event);
            var target = that.getTarget(event);
            that.preventDefault(event);


            switch (event.type) {
                case "mousedown":
                    {
                        if (that.para.dragging === false && target === element) {
                            that.para.dragging = true;
                            that.para.diffX = event.clientX - element.offsetLeft;
                            that.para.diffY = event.clientY - element.offsetTop;
                        }

                        break;
                    }
                case "mousemove":
                    {
                        if (that.para.dragging === true) {
                            that.para.targetPostionLeft = event.clientX - that.para.diffX;
                            that.para.targetPostionTop = event.clientY - that.para.diffY;

                            element.style.position = "absolute";
                            element.style.left = that.para.targetPostionLeft + "px";
                            element.style.top = that.para.targetPostionTop + "px";
                        }

                        break;
                    }
                case "mouseup":
                    {
                        that.para.dragging = false;

                        break;
                    }

            }

        }

        /**
         * @override
         */
        dragdrop.enable = function(element, elementDragdroped) {

            this.para.targetOffsetWidth = this.getElementOffset(elementDragdroped).width;
            this.para.targetOffsetHeight = this.getElementOffset(elementDragdroped).height;
            this.para.config[0] = this.para.targetOffsetWidth;
            this.para.config[1] = this.para.targetOffsetHeight;

            var that = this;
            // 在匿名函数中调用handler函数，保证其执行环境
            this.addEvent(element, "mousedown", function(event) {
                that.handler(event, elementDragdroped);
            });

            this.addEvent(element, "mousemove", function(event) {
                that.handler(event, elementDragdroped);
            });

            this.addEvent(element, "mouseup", function(event) {
                that.handler(event, elementDragdroped);
            });


        }

        var dd = document.querySelector("img.draggable");
        var cc = document.querySelector("div.controlContainer");

        dragdrop.enable(document, dd);
        control.enable(cc, dd);
    })();
};

