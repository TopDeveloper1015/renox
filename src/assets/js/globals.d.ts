
declare const UIkit: typeof import('uikit').UIkit & {
    util: typeof import('uikit/src/js/util'),
    component: (<T>(name: string, options?: T) => { options: T }),
    _initialized: boolean,
    getComponents: (el: Element) => object,
};

type ExtractComputedReturns<T extends any> = {
    [key in keyof T]: T[key] extends { get: (...args: any[]) => infer TReturn }
      ? TReturn
      : T[key] extends (...args: any[]) => infer TReturn ? TReturn : never
}

type uikitComputedType<T_this> = Record<string, (this: T_this) => unknown>;

type ComputedGetter<T> = (...args: any[]) => T

type ComputedOptions = Record<
  string,
  ComputedGetter<any>
>;

declare function uikitComponentTypeTS<
    T_update_read,
    T_props,
    T_data,
    T_computed extends ComputedOptions = {},
    T_this = T_data & ExtractComputedReturns<T_computed> & { $el: HTMLElement },
    T_update extends {
        read?: (this: T_this, args: T_this) => T_update_read,
        write?: (this: T_this, args: T_update_read) => void,
        events?: string[]
    } = {},
    T_options = {
        mixins?: any[],
        props?: T_props,
        data?: T_data,
        computed?: Record<string, (this: T_this) => unknown>,
        update?: T_update,
    },
>(
    options: T_options
): T_options;
