import axios from 'axios';
import Qs from 'query-string';
import urlJoin from 'url-join';
import { cookie } from 'easy-storage';
import serialize from 'form-serialize';
import $ from 'jquery';

const defaultHeaders = {
    "Accept": 'application/json',
    "X-Requested-With": "XMLHttpRequest"
};

let fetch = (url, method, params = {}, data = {}, headers = defaultHeaders) => {
    let isGet = /^(GET|HEAD|OPTIONS|TRACE)$/.test(method.toUpperCase());

    if (typeof data !== 'string') {
        data = Qs.stringify(data);
    }

    return axios({
        url, params, data, method,
        headers: isGet ? headers : {
            ...headers,
            "X-CSRFToken": cookie.get('X-CSRFToken'),
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
    });
};

let noop = () => {
};

export default class Modal {
    version = "2.0";
    $element = undefined;
    $content = undefined;
    $close = undefined;
    $bg = undefined;
    $container = undefined;

    inline = false;
    inlineIndex = undefined;
    $inlineParent = undefined;

    options = {};

    defaultOptions = {
        classes: {
            content: 'mmodal-content',
            container: 'mmodal-container',
            background: 'mmodal-modal-bg',
            closeButton: 'mmodal-close',
            bodyClass: 'mmodal-opened'
        },
        animationTimeout: 200,
        skin: 'default',
        width: undefined,
        closeOnClick: true,
        closeOnEscape: true,
        closeOther: true,
        autoClose: false,
        autoCloseDelay: 1450,

        onBeforeStart: noop,
        onSuccess: noop,
        onBeforeOpen: noop,
        onAfterOpen: noop,
        onBeforeClose: noop,
        onAfterClose: noop,
        onSubmit: 'default',
        attachEvents: true
    };

    constructor(options) {
        this.options = {...this.defaultOptions, ...options};
    }

    getContainer() {
        if (this.$container == undefined) {
            this.renderContainer();
        }
        return this.$container;
    }

    setContent(html) {
        const { attachEvents, closeOther, classes } = this.options;

        if (closeOther && this.hasOpened()) {
            $('.' + classes.background).remove();
        }

        this.getContainer();

        let $content = this.$content;
        $content.html('<div>' + html + '</div>');

        if ($content.find('form').length > 0 && attachEvents !== false) {
            $content.find("form").off("submit").on("submit", e => {
                e.preventDefault();
                this._submitHandler(e.target);
            });
        }

        return this;
    }

    renderContainer() {
        const { classes } = this.options;
        this.$content = $('<div />').addClass(classes.content);
        this.$close = $('<a href="#">&times;</a>').addClass(classes.closeButton);

        this.$container = $('<div />')
            .addClass(classes.container + ' ' + this.options.skin)
            .append(this.$close)
            .append(this.$content);

        this.$bg = $("<div />")
            .addClass(classes.background + ' ' + this.options.skin)
            .append(this.$container)
            .appendTo('body');
    }

    element(element) {
        let $element = $(element);
        if ($element.is("a")) {
            let href = $element.attr('href');

            if (href.match(/^#/)) {
                let $targetContainer = $(href);
                $targetContainer.detach();
                this.setContent($targetContainer.html());
                this.open();
            } else {
                fetch(href, 'GET', {}, {}).then(response => {
                    this.setContent(response.data);
                    this.open();
                }).catch(response => console.log(response));
            }
        } else {
            this.setContent($element.html());
            this.open();
        }
        return this;
    }

    open() {
        this.bindEvents();

        const { width, onBeforeOpen, onAfterOpen, classes, animationTimeout } = this.options;

        let $body = $('body'),
            before = $body.outerWidth();

        onBeforeOpen();

        this.$bg.show();
        this.$container.css('width', width || this.$container.width());
        setTimeout(() => {
            this.$container.addClass('open');
        }, animationTimeout / 2);

        $body
            .css({
                'overflow': 'hidden',
                'padding-right': $body.outerWidth() - before
            })
            .addClass(classes.bodyClass);

        onAfterOpen();
    }

    url(url) {
        return fetch(url, 'GET', {}, {}).then(response => {
            this.setContent(response.data);
            this.open();
        }).catch(response => console.log(response));
    }

    html(html) {
        this.setContent(html);
        this.open();
    }

    _submitHandler(form) {
        const { onSubmit, attachEvents } = this.options;

        if (typeof onSubmit == 'function') {
            onSubmit(form);
        } else if (attachEvents !== false) {
            this._submitHandlerDefault(form);
        }
    }

    _submitHandlerDefault(form) {
        const { autoClose, autoCloseDelay, onSuccess } = this.options;

        let params = serialize(form);
        fetch(form.getAttribute('action'), 'POST', {}, params).then(response => {
            // Redirect if possible
            if ([301, 302, 278].indexOf(response.status) != -1) {
                window.location = response.getResponseHeader('location');
            }

            let data = response.data;
            try {
                data = JSON.parse(data);
                if (data.close) {
                    this.close();
                }
                this.setContent(data['content'] || data['title']);
            } catch (e) {
                onSuccess(data);
                this.setContent(data);
            }

            if (autoClose) {
                setTimeout(this.close.bind(this), autoCloseDelay);
            }
        });
    }

    hasOpened() {
        const { classes } = this.options;
        return $('.' + classes.background).length > 1;
    }

    close() {
        const { classes, onBeforeClose, onAfterClose, animationTimeout } = this.options;

        onBeforeClose();

        if (this.hasOpened() == false) {
            $('body').off('keyup').css({
                'overflow': '',
                'padding-right': ''
            }).removeClass(classes.bodyClass);
        }

        this.$close.off('click');
        this.$bg.off('click');

        if (this.inline) {
            let href = this.$element.attr('href');
            let $target = this.$inlineParent.children(":eq(" + this.inlineIndex + ")");
            let $originalContent = this.$content.children();
            if ($target > -1) {
                $target.prepend($originalContent);
            } else {
                this.$inlineParent.append($originalContent);
            }
        }

        this.$container.removeClass('open');
        setTimeout(() => {
            this.$bg.remove();
        }, animationTimeout);

        onAfterClose();
    }

    bindEvents() {
        const { closeOnClick, closeOnEscape } = this.options;

        this.$close.on('click', e => {
            e.preventDefault();
            this.close();
        });

        if (closeOnClick) {
            this.$bg.addClass('clickable').on('click', e => {
                if (e.target == e.currentTarget) {
                    e.preventDefault();
                    this.close();
                }
            });

            if (this.hasOpened()) {
                this.$bg.addClass('no-background');
            }
        }

        this.$bg
            .on('mousewheel', e => {
                var $this = $(e.currentTarget);
                $this.scrollTop($this.scrollTop() - e.originalEvent.wheelDeltaY);
            })
            .on("touchstart", e => {
                this.touches = {
                    'startingY': e.originalEvent.touches[0].pageY,
                    'startingX': e.originalEvent.touches[0].pageX
                };
            })
            .on('touchmove', e => {
                let $this = $(e.target),
                    deltaY = e.originalEvent.touches[0].pageY - this.touches.startingY,
                    deltaX = e.originalEvent.touches[0].pageX - this.touches.startingX;

                $this.scrollTop($this.scrollTop() - deltaY);
                $this.scrollLeft($this.scrollLeft() - deltaX);

                this.touches.startingY = e.originalEvent.touches[0].pageY;
                this.touches.startingX = e.originalEvent.touches[0].pageX;
            });

        if (closeOnEscape) {
            $('body').on('keyup', e => {
                if (e.which === 27) {
                    this.close();
                }
            });
        }
    }
}