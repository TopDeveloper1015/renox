// @ts-check
/// <reference types="typed.js"/>

{
    /** @type {typeof import('typed.js').default} */
    // @ts-ignore
    const Typed = window.Typed;
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
                if (types[type].includes(key)) {
                    value = typesParsers[type](value);
                    break;
                }
            }
            options[key] = value;
        }
        return options;
    };
    /** @type {Record<string, string[]>} */
    const dataTypedAttrType = {
        string: [
            "stringsElement",
            "fadeOutClass",
            "cursorChar",
            "attr",
            "contentType"
        ],
        number: [
            "typeSpeed",
            "startDelay",
            "backSpeed",
            "backDelay",
            "loopCount"
        ],
        boolean: [
            "smartBackspace",
            "shuffle",
            "fadeOut",
            "fadeOutDelay",
            "loop",
            "showCursor",
            "autoInsertCss",
            "bindInputFocusEvents"
        ]
    };
    document.querySelectorAll('[data-typed]').forEach(el => {
        const content = el.cloneNode(true);
        if (!(content instanceof Element)) return;
        el.innerHTML = '';
        const options = parseDataAttr(el.getAttribute('data-typed'), dataTypedAttrType);
        const typed = new Typed(el, {
            stringsElement: content,
            ...options
        });
    })
}
