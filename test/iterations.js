describe('iterations', () => {
  let view, rootNode, $$, $;
  beforeEach(() => {
    rootNode = mount(html`<div id="container"></div>`);
    $$ = (x) => Array.from(rootNode.querySelectorAll(x));
    $ = (x) => rootNode.querySelector(x);
  });

  it('should iterate over Array', () => {
    view = synergy.render(
      rootNode,
      {
        todos: [
          {
            title: 'walk the cat',
            subtitle: 'ok',
            colour: 'tomato',
          },
          {
            title: 'shampoo the dog',
            subtitle: 'thanks',
            colour: 'gold',
          },
        ],
      },
      html`
        <ul>
          <li each="todo in todos" style="background-color: {{todo.colour}}">
            <p>{{todo.title}}</p>
          </li>
        </ul>
      `
    );

    let todos = Array.from(view.todos);

    $$('#container li').forEach((li, i) => {
      assert.equal(li.querySelector('p').textContent, todos[i].title);
    });
  });

  it('should iterate over Array keys', () => {
    const view = synergy.render(
      rootNode,
      {
        colours: ['gold', 'tomato'],
      },
      html`
        <ul>
          <li each="[key, colour] in colours">
            <p>{{key}}</p>
            <p>{{colour}}</p>
          </li>
        </ul>
      `
    );

    $$('#container li').forEach((li, i) => {
      assert.equal(li.querySelector('p').textContent, i);
    });
  });

  it('should iterate over Set', () => {
    view = synergy.render(
      rootNode,
      {
        todos: new Set([
          {
            title: 'walk the cat',
            subtitle: 'ok',
            colour: 'tomato',
          },
          {
            title: 'shampoo the dog',
            subtitle: 'thanks',
            colour: 'gold',
          },
        ]),
      },
      html`
        <ul>
          <li each="todo in todos" style="background-color: {{todo.colour}}">
            <p>{{todo.title}}</p>
          </li>
        </ul>
      `
    );

    let todos = Array.from(view.todos);

    $$('#container li').forEach((li, i) => {
      assert.equal(li.querySelector('p').textContent, todos[i].title);
    });
  });

  it('should iterate over Set keys', () => {
    const view = synergy.render(
      rootNode,
      {
        todos: new Set([
          {
            title: 'walk the cat',
            subtitle: 'ok',
            colour: 'tomato',
          },
          {
            title: 'shampoo the dog',
            subtitle: 'thanks',
            colour: 'gold',
          },
        ]),
      },
      html`
        <ul>
          <li
            each="[key, todo] in todos"
            style="background-color: {{todo.colour}}"
          >
            <p>{{key}}</p>
          </li>
        </ul>
      `
    );

    let todos = Array.from(view.todos);

    $$('#container li').forEach((li, i) => {
      assert.equal(li.querySelector('p').textContent, i);
    });
  });

  it('should pass the list datum as the second argument', (done) => {
    const view = synergy.render(
      rootNode,
      {
        names: ['tim', 'john', 'kim'],
        handleClick: function (e, d) {
          assert.equal(d, 'john');
          done();
        },
      },
      html`
        <select name="chosenName">
          <option each="name in names" value="{{name}}" onclick="handleClick">
            {{name}}
          </option>
        </select>
      `
    );

    rootNode.querySelector('option[value="john"]').click();
  });

  it('should overwrite non-keyed list nodes', async () => {
    view = synergy.render(
      rootNode,
      {
        colours: [
          {
            name: 'red',
          },
          {
            name: 'green',
          },
          {
            name: 'gold',
          },
        ],
      },
      html`<p each="colour in colours">{{colour.name}}</p> `
    );

    let previousNodes = $$('p');

    view.colours = [
      {
        name: 'red',
      },
      {
        name: 'red',
      },
      {
        name: 'red',
      },
    ];

    await nextUpdate();

    let currentNodes = $$('p');

    assert.ok(previousNodes[0].isSameNode(currentNodes[0]));
    assert.ok(previousNodes[1].isSameNode(currentNodes[1]));
    assert.ok(previousNodes[2].isSameNode(currentNodes[2]));
  });

  it('should not overwrite non-keyed list nodes (default id present)', async () => {
    view = synergy.render(
      rootNode,
      {
        colours: [
          {
            name: 'red',
            id: 1,
          },
          {
            name: 'green',
            id: 2,
          },
          {
            name: 'gold',
            id: 3,
          },
        ],
      },
      html`<p each="colour in colours ">{{colour.name}}</p>`
    );

    let previousNodes = $$('p');

    view.colours = [
      {
        name: 'red',
        id: 2,
      },
      {
        name: 'red',
        id: 1,
      },
      {
        name: 'red',
        id: 3,
      },
    ];

    await nextUpdate();

    let currentNodes = $$('p');

    assert.ok(previousNodes[0].isSameNode(currentNodes[1]));
    assert.ok(previousNodes[1].isSameNode(currentNodes[0]));
    assert.ok(previousNodes[2].isSameNode(currentNodes[2]));
  });

  it('should not overwrite non-keyed list nodes (custom key)', async () => {
    view = synergy.render(
      rootNode,
      {
        colours: [
          {
            name: 'red',
            foo: 1,
          },
          {
            name: 'green',
            foo: 2,
          },
          {
            name: 'gold',
            foo: 3,
          },
        ],
      },
      html`<p each="colour in colours" key="foo">{{colour.name}}</p> `
    );

    let previousNodes = $$('p');

    view.colours = [
      {
        name: 'red',
        foo: 2,
      },
      {
        name: 'red',
        foo: 1,
      },
      {
        name: 'red',
        foo: 3,
      },
    ];

    await nextUpdate();

    let currentNodes = $$('p');

    assert.ok(previousNodes[0].isSameNode(currentNodes[1]));
    assert.ok(previousNodes[1].isSameNode(currentNodes[0]));
    assert.ok(previousNodes[2].isSameNode(currentNodes[2]));
  });
});