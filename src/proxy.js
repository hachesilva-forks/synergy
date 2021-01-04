import { typeOf } from './helpers.js';

function observe(root, callbackAny, observedProperties, callbackObserved) {
  let proxyCache = new WeakMap();

  function proxy(target, handler) {
    let proxy = proxyCache.get(target);
    if (proxy === undefined) {
      proxy = new Proxy(target, handler);
      proxyCache.set(target, proxy);
    }
    return proxy;
  }

  const handler1 = {
    get(target, property) {
      if (['Object', 'Array'].includes(typeOf(target[property]))) {
        let handler =
          target === root && observedProperties.includes(property)
            ? handler2(property)
            : handler1;

        return proxy(target[property], handler);
      } else {
        return Reflect.get(...arguments);
      }
    },
    set(target, property, value) {
      if (value === target[property]) return true;

      callbackAny();
      if (target === root && observedProperties.includes(property)) {
        callbackObserved(property, value);
      }
      return Reflect.set(...arguments);
    },
    deleteProperty(target, property) {
      callbackAny();
      return Reflect.deleteProperty(...arguments);
    },
  };

  const handler2 = (prop) => ({
    get(target, property) {
      if (['Object', 'Array'].includes(typeOf(target[property]))) {
        return proxy(target[property], handler2(prop));
      } else {
        return Reflect.get(...arguments);
      }
    },
    set(target, property, value) {
      if (value === target[property]) return true;
      callbackAny();
      callbackObserved(prop, root[prop]);
      return Reflect.set(...arguments);
    },
    deleteProperty(target, property) {
      callbackAny();
      callbackObserved(prop);
      return Reflect.deleteProperty(...arguments);
    },
  });

  return new Proxy(root, handler1);
}

export default observe;