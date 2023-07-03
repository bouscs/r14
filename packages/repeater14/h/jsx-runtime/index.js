const $ELEMENT = Symbol('hyper-element');
const r = {
    insert(parent, accessor, marker, init) {
        console.log('insert', parent, accessor, marker, init);
        parent.add(accessor);
        return accessor;
    },
    spread(node, accessor, isSVG, skipChildren) {
        console.log('spread', node, accessor, isSVG, skipChildren);
        const props = accessor.props;
        for (const k in props) {
            if (k === 'children') {
                if (!skipChildren) {
                    const children = props[k];
                    if (Array.isArray(children)) {
                        for (let i = 0; i < children.length; i++) {
                            r.insert(node, children[i]);
                        }
                    }
                    else
                        r.insert(node, children);
                }
            }
            else if (k === 'style') {
                Object.assign(node.style, props[k]);
            }
            else if (k === 'ref') {
                props[k](node);
            }
            else if (k.startsWith('on') && k.toLowerCase() in window) {
                node.addEventListener(k.toLowerCase().substr(2), props[k]);
            }
            else if (k === 'dangerouslySetInnerHTML') {
                node.innerHTML = props[k].__html;
            }
            else if (k === 'key') {
                // ignore
            }
            else if (k === 'defaultValue') {
                if (node instanceof HTMLInputElement)
                    node.value = props[k];
            }
            else if (k === 'defaultChecked') {
                if (node instanceof HTMLInputElement)
                    node.checked = props[k];
            }
            else if (k === 'innerHTML') {
                node.innerHTML = props[k];
            }
            else if (k === 'textContent') {
                node.textContent = props[k];
            }
            else if (k === 'className') {
                node.setAttribute('class', props[k]);
            }
            else if (k === 'htmlFor') {
                node.setAttribute('for', props[k]);
            }
            else if (k === 'suppressContentEditableWarning') {
                // ignore
            }
            else if (k === 'suppressHydrationWarning') {
                // ignore
            }
            else if (k === 'autoFocus') {
                // ignore
            }
            else if (k === 'autoPlay') {
                // ignore
            }
            else if (k === 'controls') {
                // ignore
            }
            else if (k === 'loop') {
                // ignore
            }
        }
    },
    assign(node, props, isSVG, skipChildren) { },
    createComponent(Comp, props) {
        return new Comp(props);
    },
    dynamicProperty(props, key) {
        const src = props[key];
        Object.defineProperty(props, key, {
            get() {
                return src();
            },
            enumerable: true
        });
        return props;
    }
};
export const Fragment = function (props) {
    return props.children;
};
function h() {
    let args = [].slice.call(arguments), e, multiExpression = false;
    while (Array.isArray(args[0]))
        args = args[0];
    if (args[0][$ELEMENT])
        args.unshift(Fragment);
    typeof args[0] === 'string' && detectMultiExpression(args);
    const ret = () => {
        while (args.length)
            item(args.shift());
        return e;
    };
    ret[$ELEMENT] = true;
    return ret;
    function item(l) {
        const type = typeof l;
        if (l == null)
            void 0;
        else if (Array.isArray(l)) {
            for (let i = 0; i < l.length; i++)
                item(l[i]);
        }
        else if ('object' === type) {
            let dynamic = false;
            const d = Object.getOwnPropertyDescriptors(l);
            for (const k in d) {
                if (k !== 'ref' &&
                    k.slice(0, 2) !== 'on' &&
                    typeof d[k].value === 'function') {
                    r.dynamicProperty(l, k);
                    dynamic = true;
                }
                else if (d[k].get)
                    dynamic = true;
            }
            dynamic
                ? r.spread(e, l, e instanceof SVGElement, !!args.length)
                : r.assign(e, l, e instanceof SVGElement, !!args.length);
        }
        else if ('function' === type) {
            if (!e) {
                let props;
                const next = args[0];
                if (next == null ||
                    (typeof next === 'object' &&
                        !Array.isArray(next) &&
                        !(next instanceof Element)))
                    props = args.shift();
                props || (props = {});
                if (args.length) {
                    props.children = args.length > 1 ? args : args[0];
                }
                const d = Object.getOwnPropertyDescriptors(props);
                for (const k in d) {
                    if (Array.isArray(d[k].value)) {
                        const list = d[k].value;
                        props[k] = () => {
                            for (let i = 0; i < list.length; i++) {
                                while (list[i][$ELEMENT])
                                    list[i] = list[i]();
                            }
                            return list;
                        };
                        r.dynamicProperty(props, k);
                    }
                    else if (typeof d[k].value === 'function' && !d[k].value.length)
                        r.dynamicProperty(props, k);
                }
                e = r.createComponent(l, props);
                args = [];
            }
            else {
                while (l[$ELEMENT])
                    l = l();
                r.insert(e, l, multiExpression ? null : undefined);
            }
        }
    }
    function detectMultiExpression(list) {
        for (let i = 1; i < list.length; i++) {
            if (typeof list[i] === 'function') {
                multiExpression = true;
                return;
            }
            else if (Array.isArray(list[i])) {
                detectMultiExpression(list[i]);
            }
        }
    }
}
export const jsx = h;
export const jsxs = h;
