
type AnimeTimelineHelperCallback = (el: Element, options?: any) => anime.AnimeTimelineInstance;

declare const defineAnimeTimelineHelper: (
    name: string,
    fn: AnimeTimelineHelperCallback
) => void;

type AnimeHelperRunOptions = {
    onclick?: boolean | string;
    onhover?: boolean;
    onview?: boolean | number;
    autoplay?: boolean;
};

type AnimeHelperOptions = AnimeHelperRunOptions & {
    targets?: string;
};

type AnimeTimelineHelperOptions = AnimeHelperRunOptions & {
    timeline?: string;
};
