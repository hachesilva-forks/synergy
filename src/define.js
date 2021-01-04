import synergy from './index.js';
import prefixSelectors from './prefixSelectors.js';
import mergeSlots from './mergeSlots.js';
import {
  templateFromString,
  propToAttribute,
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

function stylesExistInDoc(name) {
  return document.querySelector(`head style[id="synergy-${name}"]`);
}

function mountStyles(name, css) {
  let el = document.createElement('style');
  el.textContent = css;
  el.id = `synergy-${name}`;
  document.head.appendChild(el);
}

const define = (name, factory, template, { observedAttributes = [] } = {}) => {
  template =
    typeof template === 'string' ? templateFromString(template) : template;

  let styleNode = template.content.querySelector('style[scoped]');

  if (styleNode && !stylesExistInDoc(name)) {
    mountStyles(name, prefixSelectors(name, styleNode.textContent));
    styleNode.remove();
  }

  let observedProps = observedAttributes.map((v) => attributeToProp(v).name);

  let X = class extends HTMLElement {
    static get observedAttributes() {
      return observedAttributes;
    }
    constructor() {
      super();

      let viewmodel = factory(initialAttributes(this), this);

      viewmodel.beforeMountCallback = (frag) => mergeSlots(this, frag);

      let watch = observedProps.reduce((o, k) => {
        o[k] = (value) => this.updateAttribute(k, value);
        return o;
      }, {});

      this.viewmodel = synergy.render(this, viewmodel, template, {
        watch,
      });
    }
    updateAttribute(k, v) {
      let { name, value } = propToAttribute(k, v);
      if (value) {
        this.setAttribute(name, value);
      } else {
        this.removeAttribute(name);
      }
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
        if (this.viewmodel && this.viewmodel[k]) this.viewmodel[k]();
      },
    })
  );

  customElements.define(name, X);
};

export default define;
