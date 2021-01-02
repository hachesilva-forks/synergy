export const isWhitespace = (node) =>
  node.nodeType === node.TEXT_NODE && node.nodeValue.match(/^\s+$/);

export function walk(node, callback, path = [0]) {
  if (callback(node, path) === false) return;

  let i = 0;
  node = node.firstChild;

  while (node) {
    if (!isWhitespace(node)) walk(node, callback, path.concat(++i));
    node = node.nextSibling;
  }
}

export const last = (v = []) => v[v.length - 1];

export const resolve = (path, context) => {
  let i = context.length;
  while (i--) {
    let { valueIdentifier, prop } = context[i];

    path = path
      .split(".")
      .map((v) => {
        if (v === valueIdentifier) return `${prop}.*`;

        return v;
      })
      .join(".");
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
          type: "key",
          value: resolve(match[1].trim(), context),
        };

      return {
        type: "value",
        value: v,
      };
    });

export const typeOf = (v) =>
  Object.prototype.toString.call(v).match(/\s(.+[^\]])/)[1];

export const copy = (v) => v && JSON.parse(JSON.stringify(v));

const parseEach = (str) => {
  let [left, prop] = str.split(/\s+in\s+/).map((v) => v.trim());
  return { valueIdentifier: left, prop };
};

const parseArgs = (args) =>
  args
    ? args
        .split(",")
        .map((v) => v.split("="))
        .reduce((a, [k, v]) => {
          a[k] = v;
          return a;
        }, {})
    : {};

export const parseEachDeclaration = (str, context, args) => {
  let v = parseEach(str);

  return {
    ...parseArgs(args),
    ...v,
    prop: resolve(v.prop, context),
  };
};

export const getValueAtPath = (path, target) =>
  path.split(".").reduce((o, k) => o && o[k], target);

export const setValueAtPath = (path, value, target) => {
  let parts = path.split(".");
  if (parts.length === 1) return (target[path] = value);
  target = getValueAtPath(parts.slice(0, -1).join("."), target);
  target[last(parts)] = value;
};

export const removeNodes = (nodes) =>
  nodes.forEach((node) => node.parentNode.removeChild(node));

export function templateFromString(v = "") {
  let tpl = document.createElement("template");
  tpl.innerHTML = v;
  return tpl;
}

export const pascalToKebab = (string) =>
  string.replace(/[\w]([A-Z])/g, function (m) {
    return m[0] + "-" + m[1].toLowerCase();
  });

export const kebabToPascal = (string) =>
  string.replace(/[\w]-([\w])/g, function (m) {
    return m[0] + m[2].toUpperCase();
  });

export const attributeToProp = (k, v) => {
  let name = kebabToPascal(k);
  if (v === "") v = true;
  if (k.startsWith("aria-")) {
    if (v === "true") v = true;
    if (v === "false") v = false;
  }
  return {
    name,
    value: v,
  };
};

export const propToAttribute = (k, v) => {
  let name = pascalToKebab(k);
  if (typeof v === "boolean" && name.startsWith("aria-")) {
    v = v.toString();
  }
  return { name, value: v };
};
