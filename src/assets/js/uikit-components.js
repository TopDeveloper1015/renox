/// @ts-check
/// <reference types="uikit"/>
/// <reference path="globals.d.ts"/>

{
    const { String, Boolean, Number } = window;
    /** @type {uikitComponentTypeTS} */
    // @ts-ignore
    const uikitComponentType = options => options;

    /**
     *
     * @param {string} name
     * @param {any} options
     */
    const overwriteComponent = (name, options) => {
        const id = UIkit.util.hyphenate(name);
        name = UIkit.util.camelize(id);
        UIkit.util.$$("[uk-" + id + "],[data-uk-" + id + "]").forEach(el => {
            const components = UIkit.getComponents(el);
            if (components[name]) {
                components[name].$destroy();
            }
        });
        UIkit.component(name, options);
        UIkit.util.$$("[uk-" + id + "],[data-uk-" + id + "]").forEach(el => {
            const components = UIkit.getComponents(el);
            if (components[name]) {
                return;
            }
            UIkit[name](el);
        });
    };

    /**
     * @see https://github.com/uikit/uikit/blob/v3.7.3/src/js/mixin/media.js
     */
    const Media = (() => {
        const {getCssVar, isString, toFloat} = UIkit.util;

        return uikitComponentType({

            props: {
                media: Boolean,
                mediaMax: Boolean,
            },

            data: {
                media: false,
                mediaMax: false,
            },

            computed: {

                matchMedia() {
                    const media = toMedia(this.media);
                    const mediaMax = toMedia(this.mediaMax, 'max');
                    if (!media && !mediaMax) return true;
                    const query = !media ? mediaMax : (
                        !mediaMax ? media : media + ' and ' + mediaMax
                    );
                    return window.matchMedia(query).matches;
                }

            },
        });

        function toMedia(value, min = 'min') {

            if (isString(value)) {
                if (value[0] === '@') {
                    const name = `breakpoint-${value.substr(1)}`;
                    value = toFloat(getCssVar(name));
                } else if (isNaN(value)) {
                    return value;
                }
            }

            return value && !isNaN(value) ? `(${min}-width: ${value}px)` : false;
        }
    })();



    const HeightViewport = UIkit.component('height-viewport').options;

    /**
     * @see https://github.com/uikit/uikit/blob/v3.7.3/src/js/core/height-viewport.js
     */
    const NewHeightViewport = (() => {

        const FlexBug = HeightViewport.mixins[0];
        const {boxModelAdjust, css, dimensions, endsWith, height, isNumeric, isString, isVisible, offset, query, toFloat} = UIkit.util;

        return uikitComponentType({

            mixins: [FlexBug, Media],

            props: {
                expand: Boolean,
                offsetTop: Boolean,
                offsetBottom: Boolean,
                minHeight: Number
            },

            data: {
                expand: false,
                offsetTop: false,
                offsetBottom: false,
                minHeight: 0
            },

            update: {

                read({minHeight: prev}) {

                    this.inactive = !this.matchMedia || !isVisible(this.$el);

                    if (this.inactive) {
                        return {minHeight: 'auto', prev};
                    }

                    /** @type {number | string} */
                    let minHeight = '';
                    const box = boxModelAdjust(this.$el, 'height', 'content-box');

                    if (this.expand) {

                        minHeight = height(window) - (dimensions(document.documentElement).height - dimensions(this.$el).height) - box || '';

                    } else {

                        // on mobile devices (iOS and Android) window.innerHeight !== 100vh
                        minHeight = 'calc(100vh';

                        if (this.offsetTop) {

                            const {top} = offset(this.$el);
                            minHeight += top > 0 && top < height(window) / 2 ? ` - ${top}px` : '';

                        }

                        if (this.offsetBottom === true) {

                            minHeight += ` - ${dimensions(this.$el.nextElementSibling).height}px`;

                        } else if (isNumeric(this.offsetBottom)) {

                            minHeight += ` - ${this.offsetBottom}vh`;

                        } else if (this.offsetBottom && endsWith(this.offsetBottom, 'px')) {

                            minHeight += ` - ${toFloat(this.offsetBottom)}px`;

                        } else if (isString(this.offsetBottom)) {

                            minHeight += ` - ${dimensions(query(this.offsetBottom, this.$el)).height}px`;

                        }

                        minHeight += `${box ? ` - ${box}px` : ''})`;

                    }

                    return {minHeight, prev};
                },

                write({minHeight, prev}) {

                    css(this.$el, {minHeight});

                    if (minHeight !== prev) {
                        this.$update(this.$el, 'resize');
                    }

                    if (this.minHeight && toFloat(css(this.$el, 'minHeight')) < this.minHeight) {
                        css(this.$el, 'minHeight', this.minHeight);
                    }

                },

                events: ['resize']

            }

        });
    })();

    /**
     * @see https://github.com/uikit/uikit/blob/v3.7.3/src/js/core/sticky.js
     */
    const Sticky = UIkit.component('sticky').options;
    const NewSticky = {
        ...Sticky,
        mixins: [Sticky.mixins[0], Media],
    };
    overwriteComponent('sticky', NewSticky);

    overwriteComponent('height-viewport', NewHeightViewport);

    /**
     * @see https://github.com/uikit/uikit/blob/v3.7.3/src/js/core/svg.js
     * @see https://github.com/uikit/uikit/blob/v3.7.3/src/js/util/dom.js
     */
    const InputNumber = (() => {

        const {fragment, remove, before, after, on} = UIkit.util;

        return {
            connected() {
                const input = this.$el;
                const icons = {
                    plus: "<span data-feather='plus'></span>",
                    minus: "<span data-feather='minus'></span>",
                };
                const buttonDown = this.buttonDown = fragment(`<button class="input-number-down input-number-btn uk-button">${icons.minus}</button>`);
                const buttonUp = this.buttonUp = fragment(`<button class="input-number-up input-number-btn uk-button">${icons.plus}</button>`);
                before(input, buttonDown);
                after(input, buttonUp);
                const doStep = (input, direction) => {
                    if (direction === '+' && input.stepUp) return input.stepUp();
                    if (direction === '-' && input.stepDown) return input.stepDown();
                    const step = +(input.step || '1') * (direction === '-' ? -1 : 1);
                    const newValue = +(input.value || '0') + step;
                    if (direction === '-' && input.min && newValue < +input.min) return;
                    if (direction === '+' && input.max && newValue > +input.max) return;
                    input.value = newValue;
                };
                on(buttonDown, 'click', e => {
                    e.preventDefault();
                    doStep(input, '-');
                });
                on(buttonUp, 'click', e => {
                    e.preventDefault();
                    doStep(input, '+');
                });
                feather.replace();
            },
            disconnected() {
                remove(this.buttonDown);
                remove(this.buttonUp);
                this.buttonDown = this.buttonUp = null;
            },
        };
    })();

    UIkit.component('input-number', InputNumber);


    const Countdown = UIkit.component('countdown').options;
    /**
     * @see https://github.com/uikit/uikit/blob/v3.7.3/src/js/components/countdown.js
     */
    const NewCountdown = (() => {
        const Class = Countdown.mixins[0];
        const {$, $$, empty, html, isInView} = UIkit.util;

        const unitToSingle = {
            'days': 'day',
            'hours': 'hour',
            'minutes': 'minute',
            'seconds': 'second',
        };

        return {

            mixins: [Class],

            props: {
                date: String,
                clsWrapper: String,
                clsLabel: String,
                clsHideEnd: String,
                clsShowEnd: String,
                padZero: Boolean,
                oneUnit: Boolean,
            },

            data: {
                date: '',
                clsWrapper: '.uk-countdown-%unit%',
                clsLabel: '.uk-countdown-label',
                clsHideEnd: '.uk-countdown-hide-end',
                clsShowEnd: '.uk-countdown-show-end',
                padZero: true,
                oneUnit: false,
            },

            computed: {

                date({date}) {
                    return Date.parse(date);
                },

                days({clsWrapper}, $el) {
                    return $(clsWrapper.replace('%unit%', 'days'), $el);
                },

                hours({clsWrapper}, $el) {
                    return $(clsWrapper.replace('%unit%', 'hours'), $el);
                },

                minutes({clsWrapper}, $el) {
                    return $(clsWrapper.replace('%unit%', 'minutes'), $el);
                },

                seconds({clsWrapper}, $el) {
                    return $(clsWrapper.replace('%unit%', 'seconds'), $el);
                },

                unitValueElement({clsWrapper}, $el) {
                    return $(clsWrapper.replace('%unit%', 'unit-value'), $el);
                },

                labelElement({clsLabel}, $el) {
                    return $(clsLabel, $el);
                },

                units() {
                    const units = ['days', 'hours', 'minutes', 'seconds'];
                    if (this.oneUnit) return units;
                    return units.filter(unit => this[unit]);
                },

                hideEnd({clsHideEnd}, $el) {
                    return $$(clsHideEnd, $el);
                },

                showEnd({clsShowEnd}, $el) {
                    return $$(clsShowEnd, $el);
                },

            },

            connected() {
                this.start();
            },

            disconnected() {
                this.stop();
                if (this.oneUnit) {
                    empty(this.unitValueElement);
                    empty(this.labelElement);
                } else {
                    this.units.forEach(unit => this[unit] && empty(this[unit]));
                }
                this.showEnd.forEach(el => el.classList.remove('uk-hidden'));
                this.hideEnd.forEach(el => el.classList.remove('uk-hidden'));
            },

            events: [

                {

                    name: 'visibilitychange',

                    el() {
                        return document;
                    },

                    handler() {
                        if (document.hidden) {
                            this.stop();
                        } else {
                            this.start();
                        }
                    }

                }

            ],

            update: {

                write() {

                    const timespan = getTimeSpan(this.date);

                    if (timespan.total <= 0) {

                        this.stop();

                        timespan.days
                            = timespan.hours
                            = timespan.minutes
                            = timespan.seconds
                            = 0;

                        this.showEnd.forEach(el => el.classList.remove('uk-hidden'));
                        this.hideEnd.forEach(el => el.classList.add('uk-hidden'));
                    }

                    if (this.oneUnit) {
                        const unit = this.units.find((unit, unitIndex, unitsList) => {
                            return Math.floor(timespan[unit]) > 0 || unitIndex === unitsList.length - 1;
                        });
                        this.labelElement.textContent = Math.floor(timespan[unit]) === 1 ? unitToSingle[unit] : unit;
                        this.setUnit(unit, this.unitValueElement, timespan);
                        return;
                    }

                    this.units.forEach(unit => {
                        this.setUnit(unit, this[unit], timespan);
                    });

                }

            },

            methods: {

                setUnit(unit, el, timespan) {
                    /** @type {string | string[]} */
                    let digits = String(Math.floor(timespan[unit]));

                    digits = this.padZero && digits.length < 2 ? `0${digits}` : digits;

                    if (el.textContent !== digits) {
                        digits = digits.split('');

                        if (digits.length !== el.children.length) {
                            html(el, digits.map(() => '<span></span>').join(''));
                        }

                        digits.forEach((digit, i) => el.children[i].textContent = digit);
                    }
                },

                start() {

                    this.stop();

                    if (this.date && this.units.length) {
                        this.showEnd.forEach(el => el.classList.add('uk-hidden'));
                        this.$update();
                        this.timer = setInterval(() => {
                            if ( isInView( this.$el ) ) {
                                this.$update();
                            }
                        }, 1000);
                    }

                },

                stop() {

                    if (this.timer) {
                        clearInterval(this.timer);
                        this.timer = null;
                    }

                }

            }

        };

        function getTimeSpan(date) {

            const total = date - Date.now();

            return {
                total,
                seconds: total / 1000 % 60,
                minutes: total / 1000 / 60 % 60,
                hours: total / 1000 / 60 / 60 % 24,
                days: total / 1000 / 60 / 60 / 24
            };
        }
    })();

    overwriteComponent('countdown', NewCountdown);

    const Drop = UIkit.component('drop').options;
    /**
     * @see https://github.com/uikit/uikit/blob/v3.7.3/src/js/core/drop.js
     */
    const NewDrop = (() => {
        const [Container, Position, Togglable] = Drop.mixins;
        const {addClass, append, apply, css, hasClass, includes, isTouch, MouseTracker, offset, on, once, parent, pointerCancel, pointerDown, pointerEnter, pointerLeave, pointerUp, query, removeClass, toggleClass, within} = UIkit.util;

        let active;

        return {

            mixins: [Container, Position, Togglable],

            args: 'pos',

            props: {
                mode: 'list',
                toggle: Boolean,
                boundary: Boolean,
                boundaryAlign: Boolean,
                delayShow: Number,
                delayHide: Number,
                clsDrop: String
            },

            data: {
                mode: ['click', 'hover'],
                toggle: '- *',
                boundary: true,
                boundaryAlign: false,
                delayShow: 0,
                delayHide: 800,
                clsDrop: false,
                animation: ['uk-animation-fade'],
                cls: 'uk-open',
                container: false
            },

            computed: {

                boundary({boundary}, $el) {
                    return boundary === true ? window : query(boundary, $el);
                },

                clsDrop({clsDrop}) {
                    return clsDrop || `uk-${this.$options.name}`;
                },

                clsPos() {
                    return this.clsDrop;
                }

            },

            created() {
                this.tracker = new MouseTracker();
            },

            connected() {

                addClass(this.$el, this.clsDrop);

                if (this.toggle && !this.target) {
                    this.target = this.$create('toggle', query(this.toggle, this.$el), {
                        target: this.$el,
                        mode: this.mode
                    });
                }

            },

            disconnected() {
                if (this.isActive()) {
                    active = null;
                }
            },

            events: [

                {

                    name: 'click',

                    delegate() {
                        return `.${this.clsDrop}-close`;
                    },

                    handler(e) {
                        e.preventDefault();
                        this.hide(false);
                    }

                },

                {

                    name: 'click',

                    delegate() {
                        return 'a[href^="#"]';
                    },

                    handler({defaultPrevented, current: {hash}}) {
                        if (!defaultPrevented && hash && !within(hash, this.$el)) {
                            this.hide(false);
                        }
                    }

                },

                {

                    name: 'beforescroll',

                    handler() {
                        this.hide(false);
                    }

                },

                {

                    name: 'toggle',

                    self: true,

                    handler(e, toggle) {

                        e.preventDefault();

                        if (this.isToggled()) {
                            this.hide(false);
                        } else {
                            this.show(toggle.$el, false);
                        }
                    }

                },

                {

                    name: 'toggleshow',

                    self: true,

                    handler(e, toggle) {
                        e.preventDefault();
                        this.show(toggle.$el);
                    }

                },

                {

                    name: 'togglehide',

                    self: true,

                    handler(e) {
                        e.preventDefault();
                        this.hide();
                    }

                },

                {

                    name: `${pointerEnter} focusin`,

                    filter() {
                        return includes(this.mode, 'hover');
                    },

                    handler(e) {
                        if (!isTouch(e)) {
                            this.clearTimers();
                        }
                    }

                },

                {

                    name: `${pointerLeave} focusout`,

                    filter() {
                        return includes(this.mode, 'hover');
                    },

                    handler(e) {
                        if (!isTouch(e) && e.relatedTarget) {
                            this.hide();
                        }
                    }

                },

                {

                    name: 'toggled',

                    self: true,

                    handler(e, toggled) {

                        if (!toggled) {
                            return;
                        }

                        this.clearTimers();
                        this.position();
                    }

                },

                {

                    name: 'show',

                    self: true,

                    handler() {

                        active = this;

                        this.tracker.init();

                        once(this.$el, 'hide', on(document, pointerDown, ({target}) =>
                            !within(target, this.$el) && once(document, `${pointerUp} ${pointerCancel} scroll`, ({defaultPrevented, type, target: newTarget}) => {
                                if (!defaultPrevented && type === pointerUp && target === newTarget && !(this.target && within(target, this.target))) {
                                    this.hide(false);
                                }
                            }, true)
                        ), {self: true});

                        once(this.$el, 'hide', on(document, 'keydown', e => {
                            if (e.keyCode === 27) {
                                this.hide(false);
                            }
                        }), {self: true});

                    }

                },

                {

                    name: 'beforehide',

                    self: true,

                    handler() {
                        this.clearTimers();
                    }

                },

                {

                    name: 'hide',

                    handler({target}) {

                        if (this.$el !== target) {
                            active = active === null && within(target, this.$el) && this.isToggled() ? this : active;
                            return;
                        }

                        active = this.isActive() ? null : active;
                        this.tracker.cancel();
                    }

                }

            ],

            update: {

                write() {

                    if (this.isToggled() && !hasClass(this.$el, this.clsEnter)) {
                        this.position();
                    }

                },

                events: ['resize']

            },

            methods: {

                show(target = this.target, delay = true) {

                    if (this.isToggled() && target && this.target && target !== this.target) {
                        this.hide(false);
                    }

                    this.target = target;

                    this.clearTimers();

                    if (this.isActive()) {
                        return;
                    }

                    if (active) {

                        if (delay && active.isDelaying) {
                            this.showTimer = setTimeout(this.show, 10);
                            return;
                        }

                        let prev;
                        while (active && prev !== active && !within(this.$el, active.$el)) {
                            prev = active;
                            active.hide(false);
                        }

                    }

                    if (this.container && parent(this.$el) !== this.container) {
                        append(this.container, this.$el);
                    }

                    // fix show dropdown jump bug
                    addClass(this.$el, 'uk-open');
                    this.position();
                    removeClass(this.$el, 'uk-open');

                    this.showTimer = setTimeout(() => this.toggleElement(this.$el, true), delay && this.delayShow || 0);

                },

                hide(delay = true) {

                    const hide = () => this.toggleElement(this.$el, false, false);

                    this.clearTimers();

                    this.isDelaying = getPositionedElements(this.$el).some(el => this.tracker.movesTo(el));

                    if (delay && this.isDelaying) {
                        this.hideTimer = setTimeout(this.hide, 50);
                    } else if (delay && this.delayHide) {
                        this.hideTimer = setTimeout(hide, this.delayHide);
                    } else {
                        hide();
                    }
                },

                clearTimers() {
                    clearTimeout(this.showTimer);
                    clearTimeout(this.hideTimer);
                    this.showTimer = null;
                    this.hideTimer = null;
                    this.isDelaying = false;
                },

                isActive() {
                    return active === this;
                },

                position() {

                    removeClass(this.$el, `${this.clsDrop}-stack`);
                    toggleClass(this.$el, `${this.clsDrop}-boundary`, this.boundaryAlign);

                    const boundary = offset(this.boundary);
                    const alignTo = this.boundaryAlign ? boundary : offset(this.target);

                    if (this.align === 'justify') {
                        const prop = this.getAxis() === 'y' ? 'width' : 'height';
                        css(this.$el, prop, alignTo[prop]);
                    } else if (this.boundary && this.$el.offsetWidth > Math.max(boundary.right - alignTo.left, alignTo.right - boundary.left)) {
                        addClass(this.$el, `${this.clsDrop}-stack`);
                    }

                    this.positionAt(this.$el, this.boundaryAlign ? this.boundary : this.target, this.boundary);

                }

            }

        };

        function getPositionedElements(el) {
            const result = [];
            apply(el, el => css(el, 'position') !== 'static' && result.push(el));
            return result;
        }
    })();

    overwriteComponent('drop', NewDrop);
    overwriteComponent('dropdown', NewDrop);

    const NavbarBound = (() => {

        const {$$, isVisible, removeClass, addClass} = UIkit.util;

        return uikitComponentType({

            mixins: [],

            props: {
                
            },

            data: {
                
            },

            computed: {
                ulList({}, $el) {
                    return $$('ul', $el);
                },
            },

            update: {
                read() {
                    const el = this.$el;
                    let needUpdate = isVisible(el);
                    if (needUpdate) {
                        const { x, width } = el.getBoundingClientRect();
                        const pos = [x, width].join(',');
                        if (pos === this.lastSeenElPos) {
                            needUpdate = false;
                        }
                        this.lastSeenElPos = pos;
                    }
                    return { needUpdate };
                },
                write({ needUpdate }) {
                    if (!needUpdate) return;
                    const documentWidth = document.documentElement.clientWidth;
                    this.ulList.forEach(ul => {
                        removeClass(ul, 'reverse-submenu-open');
                        if (ul.getBoundingClientRect().right > documentWidth) {
                            addClass(ul, 'reverse-submenu-open');
                        }
                    });
                },
                events: ['resize']
            }

        });
    })();

    overwriteComponent('navbar-bound', NavbarBound);

    const nextTick = (function () {
        var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
        var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener;
        if (canSetImmediate) {
            return function (f) { return window.setImmediate(f) };
        }
        if (canPost) {
            var queue = [];
            window.addEventListener('message', function (ev) {
                var source = ev.source;
                if ((source === window || source === null) && ev.data === 'process-tick') {
                    ev.stopPropagation();
                    if (queue.length > 0) {
                        var fn = queue.shift();
                        fn();
                    }
                }
            }, true);
            return function nextTick(fn) {
                queue.push(fn);
                window.postMessage('process-tick', '*');
            };
        }
        return function nextTick(fn) {
            setTimeout(fn, 0);
        };
    })();
    
    
    const SwiperComponent = (() => {

        const {$$, isVisible, removeClass, addClass} = UIkit.util;

        return uikitComponentType({

            mixins: [],

            props: {
                
            },

            data: {
                
            },

            computed: {
                
            },

            async connected() {
                /** @type {HTMLElement} */
                // @ts-ignore
                const el = this.$el;
                while (true) {
                    /** @type {ParentNode} */
                    let parent = el;
                    while (parent && !parent.nextSibling) {
                        parent = parent.parentNode;
                    }
                    if (parent) break;
                    if (document.readyState === 'complete') break;
                    // @ts-ignore
                    window.initSwiper && window.initSwiper(el, 'data-swiper');
                    await Promise.race([
                        // @ts-ignore
                        new Promise(r => this.updateResolvePromise = r),
                        new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true })),
                    ]);
                    /** @type {import('swiper').default} */
                    // @ts-ignore
                    const swiper = el.swiper;
                    swiper.destroy(false, false);
                    console.log('reinit');
                }
                // @ts-ignore
                this.swiper = window.initSwiper && window.initSwiper(el, 'data-swiper');
            },
            update() {
                // @ts-ignore
                this.updateResolvePromise && this.updateResolvePromise();
            },
        });
    })();

    overwriteComponent('swiper', SwiperComponent);

}
