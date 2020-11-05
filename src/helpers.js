import { TEXT_NODE } from './constants.js';

const isWhitespace = (node) =>
  node.nodeType === TEXT_NODE && node.nodeValue.match(/^\s+$/);

export function walk(node, callback, path = [0], rootNode = node) {
  if (!(node.isSameNode(rootNode) && node.__skip__)) callback(node, path);

  if (node.__skip__ && !node.isSameNode(rootNode)) return;

  let i = 0;
  node = node.firstChild;

  while (node) {
    if (!isWhitespace(node)) walk(node, callback, path.concat(++i), rootNode);
    node = node.nextSibling;
  }
}

export const last = (v = []) => v[v.length - 1];

export const resolve = (path, context) => {
  let i = context.length;
  while (i--) {
    let { key, identifier, prop } = context[i];
    path = path
      .split('.')
      .map((v) => {
        if (v === identifier) return `${prop}.*`;
        if (v === key) return `${prop}.*.KEY`;
        return v;
      })
      .join('.');
  }
  return path;
};

export const hasMustache = (v) => v.match(/({{[^{}]+}})/);

export const getParts = (value, context) =>
  value
    .trim()
    .split(/({{[^{}]+}})/)
    .filter((v) => v)
    .map((v) => {
      let match = v.match(/{{([^{}]+)}}/);

      if (match)
        return {
          type: 'key',
          value: resolve(match[1].trim(), context),
        };

      return {
        type: 'value',
        value: v,
      };
    });

export const debounce = (fn) => {
  let t;
  return function debounced() {
    if (t) return;
    t = requestAnimationFrame(() => {
      fn();
      t = null;
    });
  };
};

export const typeOf = (v) =>
  Object.prototype.toString.call(v).match(/\s(.+[^\]])/)[1];

const replacer = (_, v) => (typeOf(v) === 'Set' ? Array.from(v) : v);

export const copy = (v) => v && JSON.parse(JSON.stringify(v, replacer));

const parseEach = (str) => {
  let [left, prop] = str.split(/\s+in\s+/).map((v) => v.trim());

  let match = left.match(/\[([^\[\]]+)\]/);

  if (!match) return { identifier: left, prop };

  let parts = match[1].split(',').map((v) => v.trim());

  let [key, identifier] = parts;
  return {
    key,
    identifier,
    prop,
  };
};

export const parseEachDeclaration = (str, context) => {
  let v = parseEach(str);
  return {
    ...v,
    prop: resolve(v.prop, context),
  };
};

export const replaceLastArrayIndex = (path, index) => {
  let parts = path.split('.');
  let i = parts.length;
  while (i--) {
    if (parts[i] === '*') {
      parts[i] = index;
      return parts;
    }
  }
  return parts;
};

export const getValueAtPath = (path, target) =>
  path.split('.').reduce((o, k) => {
    if (k === '*') return o;
    if (Array.isArray(o) && k !== 'length' && isNaN(k)) {
      return o.map((v) => (v || {})[k]);
    }
    return o && o[k];
  }, target);

export const setValueAtPath = (path, value, target) => {
  let parts = path.split('.');
  if (parts.length === 1) return (target[path] = value);
  target = getValueAtPath(parts.slice(0, -1).join('.'), target);
  target[last(parts)] = value;
};

const negatives = [undefined, null, false];

export const negative = (v) => negatives.includes(v);

export const positive = (v) => !negative(v);