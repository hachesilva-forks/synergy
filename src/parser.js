import { ATTRIBUTE, INPUT, TEXT, LIST, LIST_ITEM, } from './constants';
import { getParts, last, resolve, hasMustache, walk, } from './helpers';
let subscribers;
function parseElementNode(node, context) {
    let attrs = node.attributes;
    let i = attrs.length;
    while (i--) {
        parseAttributeNode(attrs[i], node, context);
    }
    return context;
}
function parseAttributeNode({ name, value }, node, context) {
    if (name.startsWith('on')) {
        node.removeAttribute(name);
        let lastContext = last(context);
        let eventName = name.split('on')[1];
        subscribers.add(eventName);
        node.__bindings__.push({
            eventName: eventName,
            type: 'call',
            method: value,
            path: lastContext && `${lastContext.prop}.*`,
        });
        return;
    }
    if (name === 'name' &&
        value &&
        (node.nodeName === 'INPUT' ||
            node.nodeName === 'SELECT' ||
            node.nodeName === 'TEXTAREA')) {
        let path = resolve(value, context);
        subscribers.add('input');
        let binding = {
            parts: [
                {
                    type: 'key',
                    value: path,
                },
            ],
            type: INPUT,
            path,
        };
        node.__bindings__.push(binding, {
            type: 'set',
            eventName: 'input',
            path,
        });
    }
    if (hasMustache(value)) {
        node.removeAttribute(name);
        node.__bindings__.push({
            name,
            parts: getParts(value, context),
            type: ATTRIBUTE,
            context: context.slice(),
        });
    }
}
function parseTextNode(value, node, context) {
    if (!hasMustache(value))
        return;
    node.__bindings__ = [
        {
            childIndex: node.parentNode
                ? Array.from(node.parentNode.childNodes).findIndex((v) => v === node)
                : 0,
            parts: getParts(value, context),
            type: TEXT,
            context: context.slice(),
        },
    ];
}
function parseRepeatedBlock(node) {
    let each = node.getAttribute('each');
    if (!each)
        return;
    let [valueIdentifier, prop] = each.split(/\s+in\s+/);
    if (valueIdentifier && prop)
        return {
            valueIdentifier,
            prop,
            key: node.getAttribute('key') || 'id',
        };
}
function dispatchTemplate(node, stack, dispatch) {
    let each = parseRepeatedBlock(node);
    if (!each)
        return;
    stack.push(each);
    walk(node.content, dispatch);
    let { key, prop } = each;
    let path = resolve(prop, stack);
    let binding = {
        parts: [
            {
                type: 'key',
                value: path,
            },
        ],
        uid: key,
        path,
    };
    let nodes = Array.from(node.content.children);
    node.__bindings__ = [
        {
            ...binding,
            type: LIST,
            nodes,
            listItems: [],
        },
    ];
    let listNodeBinding = {
        ...binding,
        type: LIST_ITEM,
    };
    nodes.forEach((child) => {
        child.__bindings__.unshift(listNodeBinding);
    });
    stack.pop();
}
export default (templateFragment, BINDING_ID) => {
    subscribers = new Set();
    let parse = () => {
        let stack = [];
        function dispatch(node) {
            node.bindingId = BINDING_ID;
            switch (node.nodeType) {
                case node.TEXT_NODE: {
                    parseTextNode(node.nodeValue, node, stack);
                    break;
                }
                case node.ELEMENT_NODE: {
                    if (node.nodeName === 'TEMPLATE') {
                        dispatchTemplate(node, stack, dispatch);
                    }
                    else {
                        node.__bindings__ = [];
                        parseElementNode(node, stack);
                    }
                }
            }
        }
        walk(templateFragment, dispatch);
        return {
            templateFragment,
            subscribers: Array.from(subscribers),
        };
    };
    return parse();
};
