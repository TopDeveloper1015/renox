// @ts-check
/// <reference types="jquery"/>

{
    /** @type {typeof import('swiper').default} */
    // @ts-ignore
    const Swiper = window.Swiper;
    /** @type {Record<string, { test: (value: string) => boolean, convert: (value: string) => any, items: string[] }>} */
    const swiperOptionsTypes = {
        boolean: {
            test: value => value === 'true' || value === 'false',
            convert: value => value !== 'false',
            items: [
                'centeredSlides', 'pagination-clickable', 'observer', 'observeParents', 'freeMode',
                'watchSlidesVisibility', 'watchSlidesProgress', 'loop', 'centeredSlidesBounds',
                'autoplay-disableOnInteraction', 'autoHeight', 'fraction-zeros', 'cssMode', 'fadeEffect-crossFade',
                'mousewheel', 'allowTouchMove',
            ]
        },
        number: {
            test: value => !isNaN(parseFloat(value)),
            convert: value => parseFloat(value),
            items: [
                'spaceBetween', 'autoplay-delay', 'initialSlide', 'slidesPerView', 'speed', 'touchRatio',
            ]
        },
        string: {
            test: () => true,
            convert: value => value,
            items: []
        },
    };
    /** @type {Record<string, string>} */
    const aliases = {
        items: 'slidesPerView',
        sets: 'slidesPerGroup',
        center: 'centeredSlides',
        'center-bounds': 'centeredSlidesBounds',
        gap: 'spaceBetween',
        next: 'navigation-nextEl',
        prev: 'navigation-prevEl',
        'disable-class': 'navigation-disabledClass',
        active: 'initialSlide',
        connect: 'thumbs-connect',
        offset: 'slidesOffsetAfter',
        dots: 'pagination-el',
        'dots-type': 'pagination-type',
        'dots-click': 'pagination-clickable',
        'auto-height': 'autoHeight',
        'autoplay': 'autoplay-delay',
        'autoplay-int': 'autoplay-disableOnInteraction',
        'fade': 'fadeEffect-crossFade',
    };
    const defaultOptions = `
        gap: 48;
        next: .swiper-next;
        prev: .swiper-prev;
        disable-class: uk-opacity-40;
        dots: .swiper-dotnav;
        dots-click: true;
        fraction-zeros: true;
        observer: true;
        observeParents: true;
        watchSlidesVisibility: true;
        watchSlidesProgress: true;
    `;
    /**
     * Parse data-swiper options
     *
     * @param {string} attr - attribute value
     * @param {HTMLElement} el - element that has data-swiper
     * @param {boolean} useDefaults - use default options
     */
    const parseOptions = (attr, el, useDefaults = false) => {
        /** @type {any} */
        const options = {};
        ((useDefaults ? defaultOptions + ';' : '') + attr)
            .split(';')
            .filter(item => item.trim())
            .map(item => item.split(':').map(w => w.trim()))
            .forEach(([key, value]) => {
                if (aliases[key]) {
                    key = aliases[key];
                }
                changeType: {
                    for (const type in swiperOptionsTypes) {
                        if (swiperOptionsTypes[type].items.includes(key)) {
                            if (!swiperOptionsTypes[type].test || swiperOptionsTypes[type].test(value)) {
                                value = swiperOptionsTypes[type].convert(value);
                                break changeType;
                            }
                        }
                    }
                }
                const parts = key.split('-');
                /** @type {any} */
                let opts = options;
                parts.forEach((part, i) => {
                    if (i < parts.length - 1) {
                        opts[part] = opts[part] || {};
                        opts = opts[part];
                    } else {
                        opts[part] = value;
                    }
                });
            });
        {
            let parent = el.closest(options.parent || '.swiper-parent');
            if (!parent) parent = el;
            if (options.navigation) {
                if (options.navigation.nextEl) {
                    options.navigation.nextEl = [...parent.querySelectorAll(options.navigation.nextEl)];
                }
                if (options.navigation.prevEl) {
                    options.navigation.prevEl = [...parent.querySelectorAll(options.navigation.prevEl)];
                }
            }
            if (options.pagination) {
                if (options.pagination.el) {
                    options.pagination.el = [...parent.querySelectorAll(options.pagination.el)];
                }
            }
            if (options.thumbs) {
                if (options.thumbs.connect) {
                    options.thumbs.connect = [...parent.querySelectorAll(options.thumbs.connect)];
                }
            }
            if (options.progress) {
                if (options.progress.bar) {
                    options.progress.bar = [...parent.querySelectorAll(options.progress.bar)];
                }
            }
            delete options.parent;
        }
        if (options.progress && options.progress.bar) {
            const bar = $(options.progress.bar);
            delete options.progress;
            options.on = {
                init() {
                    bar.removeClass("animate");
                    bar.removeClass("active");
                    bar.eq(0).addClass("animate");
                    bar.eq(0).addClass("active");
                },
                slideChangeTransitionStart() {
                    bar.removeClass("animate");
                    bar.removeClass("active");
                    bar.eq(0).addClass("active");
                },
                slideChangeTransitionEnd() {
                    bar.eq(0).addClass("animate");
                }
            };
        }
        if (options.fraction && options.fraction.zeros) {
            const fractionPadding = 2;
            const fractionFill = '0';
            delete options.fraction;
            Object.assign(options.pagination, {
                /** @param {number} number */
                formatFractionCurrent(number) {
                    return String(number).padStart(fractionPadding, fractionFill);
                },
                /** @param {number} number */
                formatFractionTotal(number) {
                    return String(number).padStart(fractionPadding, fractionFill);
                },
            });
        }
        return options;
    };
    /** @type {Record<string, number>} */
    const breakpoints = {
        xs: 480,
        s: 640,
        m: 960,
        l: 1200,
        xl: 1600,
    };
    const initSwiper = (div, optionsAttr = 'data-swiper') => {
        /** @type {any} */
        let options = {};
        try {
            // @ts-ignore
            options = parseOptions(div.getAttribute(optionsAttr), div, true);
            for (const bp in breakpoints) {
                const attr = div.getAttribute('data-swiper-' + bp);
                if (attr) {
                    options.breakpoints = options.breakpoints || {};
                    const bpSize = breakpoints[bp];
                    options.breakpoints[bpSize] = parseOptions(attr, div);
                }
            }
        } catch (err) {console.warn(err); }
        const ready = () => {
            const swiper = new Swiper(div, options);
            swiper.update();
            document.addEventListener('DOMContentLoaded', () => swiper.update(), { once: true });
            window.addEventListener('load', () => swiper.update(), { once: true });
        };
        if (options.thumbs && options.thumbs.connect) {
            const connect = options.thumbs.connect;
            delete options.thumbs.connect;
            setTimeout(() => {
                /** @type {HTMLElement & { swiper?: Swiper }} */
                const el = connect[0];
                if (!el) {
                    console.warn(`thumbs connect with selector "${connect}" not exist!`);
                    return;
                }
                options.thumbs.swiper = el.swiper;
                if (options.thumbs.swiper) {
                    ready();
                } else {
                    console.warn(`thumbs connect with selector "${connect}" not setup!`);
                }
            });
        } else {
            ready();
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-swiper]:not([data-uk-swiper])').forEach((div) => initSwiper(div, 'data-swiper'));
    });
    Object.assign(window, { initSwiper });
}
