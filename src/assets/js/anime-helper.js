// @ts-check
/// <reference types="animejs"/>
/// <reference types="jquery"/>
/// <reference path="anime-helper.d.ts"/>

{
    /** @type {Record<string, (value: string) => boolean>} */
    const typesTesters = {
        string: value => true,
        number: value => /^-?\d+(\.\d+)?$/.test(value),
        boolean: value => value === 'false' || value === 'true',
    };
    /** @type {Record<string, (value: string) => any>} */
    const typesParsers = {
        string: value => value,
        number: value => parseFloat(value),
        boolean: value => value !== 'false',
    };
    /**
     *
     * @param {string} dataAttr
     * @param {Record<string, string[]>} types
     */
    const parseDataAttr = (dataAttr, types) => {
        const options = {};
        for (const row of dataAttr.split(';')) {
            const match = row.trim().match(/^(.*?):([\s\S]*)$/);
            if (!match) continue;
            let [key, value] = [match[1], match[2]].map(a => a.trim());
            for (const type in types) {
                if (types[type].includes(key) && typesTesters[type](value)) {
                    value = typesParsers[type](value);
                    break;
                }
            }
            if (typeof value === 'string') {
                if (/^(\[|\{|anime\.|"|')/.test(value)) {
                    value = new Function(`return (${value})`)();
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
        }
        return options;
    };
    /** @type {Record<string, string[]>} */
    const dataAnimeAttrType = {
        string: [
            "targets",
        ],
        number: [
            "onview",
        ],
        boolean: [
            "loop",
            "onclick",
            "onview",
            "autoplay",
        ]
    };

    /**
     *
     * @param {Element & { animeToggleOpen?: boolean }} el
     * @param {anime.AnimeInstance | anime.AnimeTimelineInstance} instance
     * @param {'restart' | 'alternate'} direction
     */
    const runInstance = (el, instance, direction = 'restart') => {
        if (direction === 'alternate') {
            if (!el.animeToggleOpen) {
                if (instance.reversed) {
                    instance.reverse();
                }
            } else {
                if (!instance.reversed) {
                    instance.reverse();
                }
            }
            el.animeToggleOpen = !el.animeToggleOpen;
            instance.play();
        } else if (direction === 'restart') {
            instance.restart();
        } else {
            throw 'invalid direction';
        }
    };
    const loadingPromise = new Promise(r => {
        document.addEventListener('DOMContentLoaded', e => {
            setTimeout(() => {
                r();
            }, 1000 + 300);
        });
    });
    /**
     *
     * @param {Element} el
     * @param {AnimeHelperRunOptions} options
     * @param {anime.AnimeInstance | anime.AnimeTimelineInstance} instance
     */
    const runHelper = async (el, options, instance) => {
        /**
         *
         * @param {'restart' | 'alternate'} direction
         */
        const run = (direction = 'restart') => {
            runInstance(el, instance, direction);
        };
        let autoRun = options.autoplay !== false;
        if (options.onclick) {
            const toggle = options.onclick === 'alternate';
            el.addEventListener('click', e => {
                e.preventDefault();
                run(toggle ? 'alternate' : 'restart');
            });
            autoRun = false;
        }
        if (options.onhover) {
            $(el).on('mouseenter mouseleave', () => {
                run('alternate');
            });
            autoRun = false;
        }
        await loadingPromise;
        if (typeof options.onview !== 'undefined' && options.onview !== false) {
            const offset = typeof options.onview === 'number' ? options.onview : 0;
            const handler = () => {
                if (window.innerHeight > el.getBoundingClientRect().top - offset) {
                    window.removeEventListener('scroll', handler);
                    window.removeEventListener('resize', handler);
                    run();
                }
            };
            window.addEventListener('scroll', handler);
            window.addEventListener('resize', handler);
            handler();
            autoRun = false;
        }
        if (autoRun) {
            run();
        }
    };

    const runDataAnime = () => {
        document.querySelectorAll('[data-anime]').forEach(el => {
            /** @type {AnimeHelperOptions} */
            const options = parseDataAttr(el.getAttribute('data-anime'), dataAnimeAttrType);
            let targets;
            if (options.targets) {
                targets = [...$(options.targets, el)];
                delete options.targets;
            } else {
                targets = el;
            }
            const instance = anime({
                targets,
                ...options,
            });
            instance.pause();
            // @ts-ignore
            el.animeInstance = instance;
            runHelper(el, options, instance);
        });
    };

    /** @type {Record<string, AnimeTimelineHelperCallback>} */
    const timelines = {};

    /** @type {Record<string, Promise<AnimeTimelineHelperCallback>>} */
    const timelinesPromises = {};

    /** @type {Record<string, (value: AnimeTimelineHelperCallback) => void>} */
    const timelinesResolvers = {};

    /**
     *
     * @param {string} name
     * @param {AnimeTimelineHelperCallback} fn
     */
    const defineAnimeTimelineHelper = (name, fn) =>  {
        timelines[name] = fn;
        if (timelinesResolvers[name]) {
            timelinesResolvers[name](fn);
        }
    };

    Object.assign(window, { defineAnimeTimelineHelper });

    const runDataAnimeTimeline = () => {
        document.querySelectorAll('[data-anime-timeline]').forEach(async el => {
            if (el['animeTimelineHelper']) return;
            el['animeTimelineHelper'] = true;
            let timelineName = el.getAttribute('data-anime-timeline');
            /** @type {AnimeTimelineHelperOptions} */
            let options;
            if (timelineName.includes(':')) {
                options = parseDataAttr(timelineName, {});
                timelineName = options.timeline;
                delete options.timeline;
            } else {
                options = {};
            }
            /** @type {anime.AnimeTimelineInstance} */
            let instance;
            if (timelines[timelineName]) {
                instance = timelines[timelineName](el, options);
                instance.pause();
            } else {
                if (!timelinesPromises[timelineName]) {
                    timelinesPromises[timelineName] = new Promise(resolve => {
                        timelinesResolvers[timelineName] = resolve;
                    });
                }
                await timelinesPromises[timelineName].then(() => {
                    instance = timelines[timelineName](el, options);
                    instance.pause();
                });
            }
            // @ts-ignore
            el.animeTimelineInstance = instance;
            runHelper(el, options, instance);
        });
    };

    const runDataAnimeToggle = () => {
        document.querySelectorAll('[data-anime-toggle]').forEach(async el => {
            if (el['animeToggleHelper']) return;
            el['animeToggleHelper'] = true;
            const toggleSelector = el.getAttribute('data-anime-toggle');
            el.addEventListener('click', e => {
                e.preventDefault();
                const els = [...$(toggleSelector)];
                els.forEach(other => {
                    /** @type {anime.AnimeTimelineInstance | anime.AnimeInstance} */
                    // @ts-ignore
                    const instance = other.animeTimelineInstance || other.animeInstance;
                    if (!instance) return;
                    runInstance(other, instance, 'alternate');
                });
            });
        });
    };

    // Run all.
    runDataAnime();
    runDataAnimeTimeline();
    runDataAnimeToggle();
}
