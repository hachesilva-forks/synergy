import {
  ATTRIBUTE,
  ATTRIBUTE_SPREAD,
  INPUT,
  TEXT,
  LIST,
  LIST_ITEM,
} from './constants.js';

import {
  getParts,
  last,
  resolve,
  hasMustache,
  parseEachDeclaration,
  removeNodes,
} from './helpers.js';

import walk from './walk.js';

const fromTemplate = (template) =>
  new DOMParser().parseFromString(`<span>${template}</span>`, 'text/html').body
    .firstChild;

export default (rootNode) => {
  let subscribers = new Set();

  let parse = (v) => {
    let rootNode = fromTemplate(v);

    let stack = [];

    walk(rootNode, {
      openBlock(expr, args) {
        stack.push(parseEachDeclaration(expr, stack, args));
      },
      textNode(node) {
        parseTextNode(node.nodeValue, node, stack);
      },
      elementNode(node) {
        node.__bindings__ = [];
        parseElementNode(node, stack);
      },
      closeBlock(openingComment, nodes, closingComment) {
        removeNodes(nodes);

        let { key, prop } = last(stack);
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

        openingComment.__bindings__ = [
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

        nodes.forEach((node) => {
          node.__bindings__.unshift(listNodeBinding);
        });

        stack.pop();
      },
    });

    return {
      rootNode,
      subscribers: Array.from(subscribers),
    };
  };

  let parseTextNode = (value, node, context) => {
    if (!hasMustache(value)) return;

    node.__bindings__ = [
      {
        childIndex: Array.from(node.parentNode.childNodes).findIndex(
          (v) => v === node
        ),
        parts: getParts(value, context),
        type: TEXT,
        context: context.slice(),
      },
    ];
  };

  let parseElementNode = (node, context) => {
    if (!node.hasAttributes()) return;
    let attrs = node.attributes;
    let i = attrs.length;
    while (i--) {
      parseAttributeNode(attrs[i], node, context);
    }
    return context;
  };

  let parseAttributeNode = ({ name, value }, node, context) => {
    if (name.charAt(0) === '{') {
      let res = name.match(/{{\.{3}([^{}]+)}}/);
      let match = res && res[1];
      if (match) {
        node.removeAttribute(name);
        node.__bindings__.push({
          name,
          path: resolve(match, context),
          type: ATTRIBUTE_SPREAD,
        });
      }
    }

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

    if (
      name === 'name' &&
      (node.nodeName === 'INPUT' ||
        node.nodeName === 'SELECT' ||
        node.nodeName === 'TEXTAREA')
    ) {
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
        context: context.slice(),
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
  };

  return parse(rootNode);
};
