/// <reference types="animejs"/>
/// <reference types="jquery"/>
/// <reference path="./anime-helper.d.ts"/>

// Define timelines here.

defineAnimeTimelineHelper('timelineBasics', (el, options) => {
    const tl = anime.timeline({
        easing: 'easeOutExpo',
        duration: options.duration ? +options.duration : 750,
    });
    // Add children
    tl
    .add({
        targets: el.querySelectorAll('.el.square'),
        opacity: [0, 1],
        translateX: 250,
    })
    .add({
        targets: el.querySelectorAll('.el.circle'),
        translateX: 250,
    })
    .add({
        targets: el.querySelectorAll('.el.triangle'),
        translateX: 250,
    });
    return tl;
});

defineAnimeTimelineHelper('TLParamsInheritance', (el, options) => {
    const tl = anime.timeline({
        targets: el.querySelectorAll('.el'),
        delay: function(el, i) { return i * 200 },
        duration: 500, // Can be inherited
        easing: 'easeOutExpo', // Can be inherited
        direction: 'alternate', // Is not inherited
        loop: true // Is not inherited
    });

    tl
    .add({
        translateX: 250,
        // override the easing parameter
        easing: 'spring',
    })
    .add({
        opacity: .5,
        scale: 2
    })
    .add({
        // override the targets parameter
        targets: el.querySelectorAll('.el.triangle'),
        rotate: 180
    })
    .add({
        translateX: 0,
        scale: 1
    });
    return tl;
});
