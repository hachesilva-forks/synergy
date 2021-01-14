import synergy from './index.js';
import mergeSlots from './mergeSlots.js';
import {
  templateFromString,
  applyAttribute,
  attributeToProp,
} from './helpers.js';

const initialAttributes = (node) => {
  const o = {};
  for (let { name, value } of node.attributes) {
    let x = attributeToProp(name, value);
    o[x.name] = x.value;
  }
  return o;
};

const forwards = [
  'connectedCallback',
  'disconnectedCallback',
  'adoptedCallback',
];

const isPrimitive = (v) =>
  v === null || typeof v !== 'object';

const define = (name, factory, template, options = {}) => {
  let { observedAttributes = [] } = options;

  template =
    typeof template === 'string'
      ? templateFromString(template)
      : template;

  let observedProps = observedAttributes.map(
    (v) => attributeToProp(v).name
  );

  let X = class extends HTMLElement {
    static get observedAttributes() {
      return observedAttributes;
    }
    constructor() {
      super();

      let viewmodel = factory(
        initialAttributes(this),
        this
      );

      // observedAttributes.forEach((name) => {
      //   let property = attributeToProp(name).name;

      //   let value =
      //     this.getAttribute(name) || this[property]; // || false?

      //   Object.defineProperty(this, property, {
      //     get: (k) => {
      //       return this.viewmodel[k];
      //     },
      //     set: (k, v) => {
      //       console.log('?', this.viewmodel);
      //       this.viewmodel[k] = v;
      //       if (isPrimitive(v)) applyAttribute(this, k, v);
      //       /*
      //       @TODO: combine prop/attribute set into single function (also happens in the updateCallback wrapper below)
      //       */
      //     },
      //   });

      //   this[property] = value;
      // });

      if (options.shadowRoot) {
        this.attachShadow({
          mode: options.shadowRoot,
        });
      } else {
        viewmodel.beforeMountCallback = (frag) =>
          mergeSlots(this, frag);
      }

      this.viewmodel = synergy.render(
        this.shadowRoot || this,
        viewmodel,
        template
      );

      let puc = viewmodel.updatedCallback || function () {};

      viewmodel.updatedCallback = (prev) => {
        observedProps
          .map((k) => [k, prev[k], viewmodel[k]])
          .filter(([_, a, b]) => a !== b)
          .forEach(([k, _, v]) =>
            applyAttribute(this, k, v)
          );

        puc.call(this.viewmodel, prev);
      };
    }
    attributeChangedCallback(k, _, v) {
      if (this.viewmodel) {
        let { name, value } = attributeToProp(k, v);
        this.viewmodel[name] = value;
      }
    }
  };

  forwards.forEach((k) =>
    Object.assign(X.prototype, {
      [k]() {
        if (this.viewmodel && this.viewmodel[k])
          this.viewmodel[k]();
      },
    })
  );

  customElements.define(name, X);
};

export default define;
