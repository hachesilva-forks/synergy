import synergy from './index.js';
import mergeSlots from './mergeSlots.js';
import {
  templateFromString,
  applyAttribute,
  attributeToProp,
  isPrimitive,
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

      this.viewmodel = factory(
        initialAttributes(this),
        this
      );

      observedAttributes.forEach((name) => {
        let property = attributeToProp(name).name;

        //@TODO

        let value = this.getAttribute(name);

        if (!value && value !== '') value = this[property]; // || false?

        Object.defineProperty(this, property, {
          get: () => {
            return this.viewmodel[property];
          },
          set: (v) => {
            this.viewmodel[property] = v;
            if (isPrimitive(v))
              applyAttribute(this, property, v);
            /*
            @TODO: combine prop/attribute set into single function (also happens in the updateCallback wrapper below)
            */
          },
        });

        this[property] = value;
      });

      if (options.shadowRoot) {
        this.attachShadow({
          mode: options.shadowRoot,
        });
      } else {
        this.viewmodel.beforeMountCallback = (frag) =>
          mergeSlots(this, frag);
      }

      this.viewmodel = synergy.render(
        this.shadowRoot || this,
        this.viewmodel,
        template
      );

      let puc =
        this.viewmodel.updatedCallback || function () {};

      this.viewmodel.updatedCallback = (prev) => {
        observedProps
          .map((k) => {
            return [k, prev[k], this.viewmodel[k]];
          })
          .filter(([, , b]) => isPrimitive(b))
          .filter(([_, a, b]) => a !== b)
          .forEach(([k, _, v]) => {
            applyAttribute(this, k, v);
          });

        puc.call(this.viewmodel, prev);
      };
    }
    attributeChangedCallback(k, _, v) {
      let { name, value } = attributeToProp(k, v);
      this.viewmodel[name] = value;
    }
  };

  forwards.forEach((k) =>
    Object.assign(X.prototype, {
      [k]() {
        if (this.viewmodel[k]) this.viewmodel[k]();
      },
    })
  );

  customElements.define(name, X);
};

export default define;
