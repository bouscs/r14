export type { JSX } from './jsx';
declare const $ELEMENT: unique symbol;
type ExpandableNode = Node & {
    [key: string]: any;
};
export declare const Fragment: (props: any) => any;
declare function h(): (() => ExpandableNode) & {
    [$ELEMENT]?: boolean | undefined;
};
export declare const jsx: typeof h;
export declare const jsxs: typeof h;
