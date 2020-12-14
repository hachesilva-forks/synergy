# synergy

## [![npm](https://img.shields.io/npm/v/synergy.svg)](http://npm.im/synergy) [![Build Status](https://travis-ci.com/defx/synergy.svg?branch=master)](https://travis-ci.com/defx/synergy) [![Coverage Status](https://coveralls.io/repos/github/defx/synergy/badge.svg?branch=master)](https://coveralls.io/github/defx/synergy?branch=master) [![gzip size](https://img.badgesize.io/https://unpkg.com/synergy/dist/synergy.min.js?compression=gzip&label=gzip)]()

Simple and declarative data binding for the DOM.

## Table of Contents

- [Features](#features)
- [Browser Support](#browser-support)
- [Install](#install)
- [Render](#render)
- [Data Binding](#data-binding)
  - [Attributes & Booleans](#attributes-&-booleans)
  - [CSS Classes](#css-classes)
  - [Conditional Classes](#conditional-classes)
  - [Inline Styles](#inline-styles)
  - [Getters](#getters)
- [JavaScript Expressions](#javascript-expressions)
  - [Logical Not](#logical-not)
  - [Object Spread](#object-spread)
- [Repeated Blocks](#repeated-blocks)
  - [Keyed Arrays](#keyed-arrays)
- [Events](#events)
- [Forms](#forms)
  - [Submitting Form Data](#submitting-form-data)
  - [Select](#select)
  - [Radio](#radio)
- [Side Effects](#side-effects)
- [Web Components](#web-components)
- [Pre-rendering](#pre-rendering)

## Features

- Simple and declarative way to bind data, events, and markup
- Small footprint (~3.6k)
- No special tooling required (e.g., compilers, plugins)
- Minimal learning curve (almost entirely standard HTML, JS, and CSS!)

## Browser Support

Works in any [modern browser](https://caniuse.com/mdn-javascript_builtins_proxy_proxy) that supports JavaScript Proxy.

## Install

Using npm:

```bash
$ npm i synergy
```

Using unpkg CDN:

```
<script type="module">
  import synergy from 'https://unpkg.com/synergy';
</script>
```

## Render

The `render()` method combines an HTML template with a JavaScript object and then mounts the rendered HTML into an existing DOM node.

### Syntax

```js
let view = synergy.render(targetNode, viewmodel, template);
```

### Parameters

- `targetNode` An existing HTML element node where the rendered HTML should be mounted.

- `viewmodel` A plain JavaScript object that contains the data for your view.

- `template` Either an HTML string or a `<template>` node.

### Return value

A proxied version of your JavaScript object that will automatically update the UI whenever any of its values change

```js
let view = synergy.render(
  document.getElementById('app'),
  { message: 'Hello World!' },
  `<p>{{ message }}</p>`
);

view.message = '¡Hola Mundo!';
```

In the example above, we initialise the view with a paragraph that reads "Hello World!". We then change the value of message to '¡Hola Mundo!' and Synergy updates the DOM automatically.

## Data binding {{ ... }}

Use the double curly braces to bind named properties from your JavaScript object to text or attribute values within your HTML template.

```html
<p style="background-color: {{ bgColor }}">{{ message }}</p>
```

As far as text nodes are concerned, the values you bind to them should always be primitives, and will always be cast to strings unless the value is `null` or `undefined`, in which case the text node will be empty.

Attributes, on the other hand, support binding to different data types in order to achieve different goals...

### Attributes & Booleans

Any attribute that is bound to a boolean value will be treated as a [boolean attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes#Boolean_Attributes), unless it is an ARIA attribute, in which case the boolean value will be cast to a string.

### CSS Classes

You can bind multiple values to an attribute with an array.

```js
{
  classes: ['bg-white', 'rounded', 'p-6'];
}
```

```html
<section class="{{ classes }}">
  <!-- class="bg-white rounded p-6" -->
</section>
```

> You can use an array to bind multiple values to any attribute that accepts them

### Conditional Classes

You may wish to _conditionally_ apply CSS classes to an element. You can do this by binding to a an object. Only the keys with truthy values will be applied.

```js
{
  classes: {
      'bg-white': true,
      'rounded', false,
      'p-6': true
    },
}
```

```html
<section class="{{ classes }}">
  <!-- class="bg-white p-6" -->
</section>
```

### Inline Styles

As well as binding the style attribute to a string or an array, you can also bind this attribute to an object representing a dictionary of CSS properties and values.

```js
{
  goldenBox: {
    backgroundColor: 'gold',
    width: '100px',
    height: '100px'
  }
}
// -> "background-color: gold; width: 100px; height: 100px;"
```

### Getters

Define any property as a standard JavaScript [getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) in order to derive a value from _other_ values within your viewmodel.

```js
{
  width: 100,
  height: 100,
  get styles() {
    return {
      backgroundColor: 'gold',
      color: 'tomato',
      width: this.width + 'px',
      height: this.height + 'px',
    }
  }
}
```

```html
<section style="{{ styles }}"><!-- ... --></section>
```

## JavaScript Expressions

Synergy doesn't allow you to write arbitrary JavaScript expressions inside your templates. This helps to keep a clearer separation of concerns between your JavaScript and your HTML. That being said, there are a couple of simple expressions that are supported to make working with attributes a little easier...

### Logical Not ( ! )

You can prefix a property name with an exclamation mark in order to negate it.

```html
<h3>
  <button id="{{ id }}" aria-expanded="{{ expanded }}">{{ title }}</button>
</h3>
<div aria-labelledby="{{ id }}" hidden="{{ !expanded }}">
  <!-- ... -->
</div>
```

### Object Spread ( ... )

You can prefix a property name with an ellipsis to spread all of the keys and values of an object onto an element as individual attributes.

```js
      {
        slider: {
          name: 'slider',
          type: 'range',
          min: '0',
          max: '360',
        },
      }
```

```html
<input {{...slider}} />
```

## Repeated Blocks

Repeat a block of HTML for each item in an Array by
surrounding it with the `each` opening (`#`) and closing (`/`) comments.

```js
{
  names: ['kate', 'kevin', 'randall'];
}
```

```html
<ul>
  <!-- #each name in names -->
  <li>Hello {{ name }}</li>
  <!-- /each -->
</ul>
```

Access the current index with the dot character

```html
<ul>
  <!-- #each todo in todos -->
  <li>
    <p>todo {{ . }} of {{ todos.length }}</p>
  </li>
  <!-- /each -->
</ul>
```

Repeated blocks can have multiple top-level nodes

```html
<!-- #each drawer in accordion.drawers -->
<h3>
  <button id="{{ id }}" aria-expanded="{{ expanded }}">{{ title }}</button>
</h3>
<div aria-labelledby="{{ id }}" hidden="{{ !expanded }}">
  <!-- ... -->
</div>
<!-- /each -->
```

### Keyed Arrays

Keys help Synergy identify which items in an Array have changed. Using keys improves performance and avoids unexpected behaviour when re-rendering.

The key can be any primitive value, as long as it is unique to that item within the Array.

By default, if the Array item is an object, then Synergy will look for an `id` property and assume that to be the key if you haven't said otherwise.

Set the `key` parameter if you need to override the default behaviour...

```html
<ul>
  <!-- #each person in people (key=whatever) -->
  <li>Hello {{ person.name }}</li>
  <!-- /each -->
</ul>
```

## Events

Use standard DOM Event names to bind directly to named methods on your data.

```js
{
  sayHello: function() {
    alert("hi!");
  }
};
```

```html
<button onclick="sayHello">Say hello</button>
```

The first argument to your event handler is always a native DOM Event object

```js
{
  handleClick: function(event) {
    event.preventDefault();
    console.log("the link was clicked");
  }
};
```

If the target of the event is within a repeated block, then the second argument to your handler will be the datum for that particular item.

```js
{
  todos: [
    /* ... */
  ],
  todoClicked: function(event, todo) {
    /*... */
  };
}
```

```html
<ul>
  <!-- #each todo in todos -->
  <li>
    <h3 onclick="todoClicked">{{ todo.title }}</h3>
  </li>
  <!-- /each -->
</ul>
```

## Forms

Named inputs are automatically bound to properties of the same name on your data.

```html
<input name="color" type="color" />
```

```js
{
  color: '#4287f5';
}
```

### Submitting Form Data

By default, a HTML form will browse to a new page when the user submits the form. Submission happens when the user actives either a) an input[type="submit"], or b) a button[type="submit"].

> In some browsers, a button _without_ a [type] will be assumed to be [type="submit"] if it resides within a form element, so you should _always_ set a buttons `type` attribute when it lives within a form.

If you wish to override the browsers default behaviour, perhaps to execute some JavaScript before submitting the form data, then you would do that by binding to the forms submit event, and calling `preventDefault` on the event object inside your handler function to stop the browser from submitting the form.

```html
<form onsubmit="handleForm">
  <input name="formData.name" />
  <input name="formData.email" type="email" />
  <input type="submit" value="Submit" />
</form>
```

```js
{
  formData: {},
  handleForm: function(event) {
    console.log(this.formData);
    event.preventDefault();
  }
};
```

### Select

Simply name the `<select>`...

```html
<label for="pet-select">Choose a pet:</label>
<select name="pets" id="pet-select">
  <option value="">--Please choose an option--</option>
  <option value="dog">Dog</option>
  <option value="cat">Cat</option>
  <option value="hamster">Hamster</option>
  <option value="parrot">Parrot</option>
  <option value="spider">Spider</option>
  <option value="goldfish">Goldfish</option>
</select>
```

...and the value of the property will reflect the value of the currently selected `<option>`:

```js
{
  pets: 'hamster';
}
```

The standard HTML `<select>` element also supports the ability to select multiple options, using the **multiple** attribute:

```html
<select name="pets" id="pet-select" multiple></select>
```

A `<select>` with `[multiple]` binds to an Array on your data:

```js
{
  pets: ['hamster', 'spider'];
}
```

### Radio Buttons

Add a name to each radio button to indicate which _group_ it belongs to.

```html
<input type="radio" name="filter" value="all" id="filter.all" />
<input type="radio" name="filter" value="active" id="filter.active" />
<input type="radio" name="filter" value="complete" id="filter.complete" />
```

As with `<select>`, the value of the named property will reflect the value of the selected `<input type="radio">`.

```js
{
  filter: 'active';
}
```

## Side Effects

### propertyChangedCallback

Synergy updates the DOM once per animation frame if there are any changes in the viewmodel to reflect.

If you implement a `propertyChangedCallback` method on your viewmodel, then this method will be invoked once for each property that has changed since the last update.

```js
{
  todos: [],
  propertyChangedCallback(path) {
    if (path.match(/^todos.?/)) {
      localStorage.setItem('todos', JSON.stringify(this.todos));
    }
  }
}
```

> Invocations of `propertyChangedCallback` are already debounced with [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame), so you'll only get one invocation per property _per_ animation frame.

## Web Components

Synergy plays well with the Web Component APIs. I've written a Custom Element wrapper ([@defx/elementary](https://github.com/defx/elementary)) that you can take a look at, or even use as a starting point to writing your own wrapper to suit your specific requirements.

## Pre-rendering

Pre-rendering is useful when you need to get content rendered immediately as part of the initial page load, without having to wait for JavaScript to build the page first.

Synergy supports pre-rendering and hydration and doesn't care where or how you pre-render your content. In order to pre-render your page, you only need to load it in a browser (or within a synthetic DOM environment) and then save the rendered page. Load that same page again and Synergy will hydrate the bindings without modifying the DOM.
