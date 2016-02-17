/*!
* tingle.js
* @author  robin_parisi
* @version 0.5.0
* @url
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.tingle = factory();
    }
}(this, function () {

    /* ----------------------------------------------------------- */
    /* == modal */
    /* ----------------------------------------------------------- */

    var body = document.querySelector('body');

    /**
    * Modal constructor
    */
    function Modal(options) {
        this.modal;
        this.modalCloseBtn;
        this.modalWrapper;
        this.modalBox;
        this.modalBoxContent
        this.modalBoxFooter;
        this.modalContent;
        var defaults = {
            onClose: null,
            stickyFooter: false,
            footer: false
        }

        // extends config
        this.opts = extend({}, defaults, options);

    }

    /**
    * Init modal
    */
    Modal.prototype.init = function() {
        _build.call(this);
        _bindEvents.call(this);
        _insertInDom.call(this);

        if(this.opts.footer) {
            this.addFooter();
        }
    };

    /**
    * Open modal
    */
    Modal.prototype.open = function(options) {

        this.modal.style.display = 'block';

        // prevent double scroll
        body.classList.add('tingle-enabled');

        // sticky footer
        this.setStickyFooter(this.opts.stickyFooter);

        // show modal
        this.modal.classList.add('tingle-modal--visible');

        /**
        * Handle offset. Need to be called at last since there is a strange behavior
        * with fixed position for the footer, probably due to the scrollbar and
        * the body/viewport width. Just call this.modalBox.style.['property'] will
        * correct the position and the width calculation.
        */
        _offset.call(this);

    };

    /**
    * Close modal
    */
    Modal.prototype.close = function(e) {

        this.modal.style.display = 'none';
        body.classList.remove('tingle-enabled');

        // on close callback
        if(typeof this.opts.onClose === "function") {
            this.opts.onClose();
        }

        this.modal.classList.remove('tingle-modal--visible');
    };

    /**
    * Destroy modal: unbind events and remove from dom
    */
    Modal.prototype.destroy = function() {
        if(this.modal === null) {
            return;
        }
        _unbindEvents.call(this);
        _removeFromDom.call(this);
        this.modal = null;
    };

    /**
    * Set content
    */
    Modal.prototype.setContent = function(content) {
        this.modalBoxContent.innerHTML = content;

        // prefetch pictures before showing tingle so we can get the real height
        _prefetchPictures(this.modalBoxContent);
    };

    Modal.prototype.addFooter = function() {
        // add footer to modal
        _buildFooter.call(this);
    }

    Modal.prototype.setFooterContent = function(content) {
        // set footer content
        this.modalBoxFooter.innerHTML = content;
    };


    Modal.prototype.setStickyFooter = function(isSticky) {

        // if the modal is smaller than the viewport height, we don't need sticky
        if(!this.isOverflow()) {
            isSticky = false;
        }

        if(isSticky) {
            if(this.modalBox.contains(this.modalBoxFooter)) {
                this.modalBox.removeChild(this.modalBoxFooter);
                this.modal.appendChild(this.modalBoxFooter);
                this.modalBoxFooter.classList.add('tingle-modal-box__footer--sticky');
                _recalculateFooterPosition.call(this);
                this.modalBoxContent.style['padding-bottom'] = this.modalBoxFooter.clientHeight + 20 + 'px';
                bind(this.modalBoxFooter, 'click', _catchEvent);
            }
        } else {
            if(!this.modalBox.contains(this.modalBoxFooter)) {
                this.modal.removeChild(this.modalBoxFooter);
                this.modalBox.appendChild(this.modalBoxFooter);
                this.modalBoxFooter.style.width = 'auto';
                this.modalBoxFooter.style.left = '';
                this.modalBoxContent.style['padding-bottom'] = '';
                this.modalBoxFooter.classList.remove('tingle-modal-box__footer--sticky');
            }
        }
    }

    Modal.prototype.addFooterBtn = function(label, cssClass, callback) {
        var btn = document.createElement("button");

        // set label
        btn.innerHTML = label;

        // bind callback
        btn.addEventListener('click', callback);

        // add classes to btn
        cssClass.split(" ").forEach(function (item) {
            btn.classList.add(item);
        });

        this.modalBoxFooter.appendChild(btn);

        return btn;
    }

    Modal.prototype.onResize = function() {
        // only if the modal is currently shown
        if(this.modal.classList.contains('tingle-modal--visible')) {
            _offset.call(this);
            _recalculateFooterPosition.call(this);
            if(!this.isOverflow() && this.opts.stickyFooter) {
                this.setStickyFooter(false);
            } else if(this.isOverflow() && this.opts.stickyFooter) {
                this.setStickyFooter(true);
            }
        }
    };

    Modal.prototype.isOverflow = function() {
        var viewportHeight = window.innerHeight;
        var modalHeight = this.modalBox.clientHeight;

        //console.log(viewportHeight + '/' + modalHeight)
        var isOverflow = modalHeight < viewportHeight ? false : true;
        return isOverflow;
    }


    function _recalculateFooterPosition() {
        this.modalBoxFooter.style.width = this.modalBox.clientWidth + 'px';
        this.modalBoxFooter.style.left = this.modalBox.offsetLeft + 'px';
    }

    function _offset() {
        if(!this.isOverflow()) {
            var offset = window.innerHeight / 2 - this.modalBox.clientHeight / 2;
            this.modalBox.style.top = offset + 'px';
        }
    }

    function _insertInDom() {
        insertInDom(this.modal);
    };

    function _build() {
        this.modal = create('div', 'tingle-modal');
        this.modal.style.display = 'none';

        this.modalCloseBtn = create('button', 'tingle-modal__close');
        this.modalCloseBtn.innerHTML = '×';

        //modalWrapper = create('div', 'tingle-modal__wrapper');

        this.modalBox = create('div', 'tingle-modal-box');
        this.modalBoxContent = create('div', 'tingle-modal-box__content');
        this.modalBox.appendChild(this.modalBoxContent);

        this.modal.appendChild(this.modalCloseBtn);
        this.modal.appendChild(this.modalBox);

    };

    function _buildFooter() {
        this.modalBoxFooter = create('div', 'tingle-modal-box__footer');
        this.modalBox.appendChild(this.modalBoxFooter);
    }

    function _prefetchPictures(target) {
        var images = target.getElementsByTagName('img');
        var srcList = [];
        for(var i = 0; i < images.length; i++) {
            srcList.push(images[i].src);
        }
    }

    function _removeFromDom() {
        if(document.querySelector('.tingle-modal')) {
            removeFromDom(this.modal);
        }
    };

    function _bindEvents() {
        bind(this.modalCloseBtn, 'click', this.close.bind(this));
        bind(this.modal, 'click', this.close.bind(this));
        bind(this.modalBox, 'click', _catchEvent);
        window.addEventListener('resize', this.onResize.bind(this));
    };


    function _catchEvent(e) {
        e.stopPropagation();
    };

    function _unbindEvents() {
        unbind(this.modalCloseBtn, 'click', this.close.bind(this));
        unbind(this.modal, 'click', this.close.bind(this));
        unbind(this.modalBox, 'click', _catchEvent);

    };

    function extend() {
        for(var i=1; i<arguments.length; i++) {
            for(var key in arguments[i]) {
                if(arguments[i].hasOwnProperty(key)) {
                    arguments[0][key] = arguments[i][key];
                }
            }
        }
        return arguments[0];
    }

    /* ----------------------------------------------------------- */
    /* == confirm */
    /* ----------------------------------------------------------- */

    // coming soon

    /* ----------------------------------------------------------- */
    /* == alert */
    /* ----------------------------------------------------------- */

    // coming soon

    /* ----------------------------------------------------------- */
    /* == helpers */
    /* ----------------------------------------------------------- */

    function isNodeList(el) {
        return (typeof el.length != 'undefined' && typeof el.item != 'undefined');
    }

    function insertInDom(el) {
        document.body.insertBefore(el, document.body.firstChild);
    };

    function removeFromDom(el) {
        el.parentNode.removeChild(el);
    };

    function bind(el, event, callback) {

        if(isNodeList(el)) {
            [].forEach.call(el, function(el) {
                el.addEventListener(event, callback);
            })
        } else {
            el.addEventListener(event, callback);
        }
    }

    function unbind(el, event, callback) {
        if(isNodeList(el)) {
            [].forEach.call(el, function(el) {
                el.removeEventListener(event, callback);
            })
        } else {
            el.removeEventListener(event, callback);
        }
    }

    function create(element, cssClass) {
        var element = document.createElement(element);
        if(cssClass) {
            element.classList.add(cssClass);
        }
        return element;
    }

    /* ----------------------------------------------------------- */
    /* == return */
    /* ----------------------------------------------------------- */

    return {
        modal: Modal
    };

}));