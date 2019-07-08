<style lang="scss">

  @import "variables";

  .board-filter {

    &.expanded {
      width: 500px;
      max-width: 100%;
    }

    width: 300px;

    transition: width;
  }

  .input-prefixed {

    position: relative;

    .prefix {
      position: absolute;
      line-height: 1.5;
      vertical-align: middle;
      display: inline-block;
      left: 0;
      top: 1px;
      padding: 0.375rem 0.75rem;
      height: calc(1.5em + 0.75rem + 2px);
    }

    input {
      padding-left: 33px;
      width: 100%;
    }

    .help {

      border-radius: 4px;
      margin: 6px 0 0;
      text-align: left;
      height: auto;
      position: relative;
      background: transparent;
      border: none;
      z-index: 999;
      max-width: 600px;
      min-width: 500px;

      width: 100%;
      min-width: 0!important;
      max-width: none!important;
      padding: .75rem 0!important;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid rgba(0,0,0,.1);
      box-shadow: 0 0.5rem 1rem rgba(0,0,0,.175);

      position: absolute;
      top: 100%;
      z-index: 100;
      left: 0px;
      right: auto;
      display: block;

      .category {
        color: $primary;
        font-weight: bold;
        padding: 0 .8rem;
      }

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      li {
        padding: 0 .8rem;
        line-height: 2em;

        &:not(.text) {
          &:hover,
          &.active {
            background: scale-color($primary, $alpha: -90%);
          }
        }

        &.text {
          color: $gray-600;
        }
      }

      .note {
        padding: 0 .8rem;
        color: $gray-600;

        span {
          font-style: italic;
        }
      }

      .matched {
        background: scale-color($primary, $alpha: -80%);
        color: darken($primary, 10%);
      }
    }

    .icon {
      color: $gray-300;
    }
  }
</style>


<script>
  import { Id } from './util';

  import { Icon } from './components';

  import {
    debounce
  } from './util';

  import SearchIcon from './components/SearchIcon.svelte';

  export let className = '';
  export let value = '';

  export let completionOptions = {};

  export let onChange;

  const maxElements = 7;

  let staticValues = {
    is: [
      'assigned',
      'unassigned',
      'closed',
      'open',
      'issue',
      'pull'
    ].map(name => {
      return { name, value: `${name} ` };
    })
  };

  $: dynamicValues = Object.entries(completionOptions).reduce((values, entry) => {

    const [ key, value ] = entry;

    values[key] = value.slice().sort().map(name => {

      const separator = /[: ]/.test(name) ? '"' : '';

      return { name, value: `${separator}${name}${separator} ` };
    });

    return values;
  }, {});

  const qualifierCategories = [
    {
      name: 'Operators',
      options: [
        'label',
        'assignee',
        'repo',
        'reviewer',
        'milestone',
        'is'
      ].map(name => {
        return {
          name,
          value: `${name}:`
        };
      })
    }
  ];

  let keyboardSelectedHint;
  let mouseSelectedHint;

  $: categoryValues = {
    ...staticValues,
    ...dynamicValues
  };

  $: selectedHint = mouseSelectedHint || keyboardSelectedHint;

  let input;

  let focussed = false;
  let match;
  let allHints;

  let position = 0;

  $: expanded = focussed || value;
  $: {
    console.time('BoardFilter#computeMatch');

    let opts = computeMatch(value, position, categoryValues);

    console.timeEnd('BoardFilter#computeMatch');

    match = opts.match;
    allHints = opts.allHints;

    keyboardSelectedHint = (
      allHints && keyboardSelectedHint && allHints.find(
        hint => hint.name === keyboardSelectedHint.name
      ) || opts.keyboardSelectedHint
    );
  }

  const searchId = Id();

  function computeMatch(value, searchEnd, categoryValues) {

    const beforeCursor = value.substring(0, searchEnd);

    const searchStart = beforeCursor.lastIndexOf(' ') + 1;

    value = value.substring(searchStart, searchEnd).toLowerCase();

    const match = /^([-!]?)(?:([\w]+)(?:(:)(?:"([\w-]+)"?|([\w-]+))?)?)$/.exec(value);

    if (!match) {
      return {};
    }

    let [ _, negator, qualifier, sep, qualifierText, qualifierTextEscaped ] = match;

    const search = sep ? (qualifierText || qualifierTextEscaped || '') : qualifier;

    const allHints = [];

    const categories = sep ? [
      {
        name: 'Values',
        options: categoryValues[qualifier] || []
      }
    ] : qualifierCategories;

    const matchedCategories = categories.reduce((matchedCategories, category) => {

      const matchedValues = category.options.reduce((matchedValues, categoryOption) => {

        const {
          name,
          value
        } = categoryOption;

        if (name.toLowerCase().startsWith(search)) {

          const hint = {
            name: name,
            parts: [
              {
                text: name.substring(0, search.length),
                matched: true
              },
              {
                text: name.substring(search.length)
              }
            ],
            apply: (currentValue) => {

              const before = currentValue.substring(0, searchStart);
              const fix = (negator || '') + (sep ? qualifier + sep : '') + value;
              const after = currentValue.substring(searchEnd);

              return {
                val: `${before}${fix}${after}`,
                idx: before.length + fix.length
              };
            }
          };

          matchedValues.push(hint);
          allHints.push(hint);
        }

        return matchedValues;
      }, []);


      if (matchedValues.length) {
        matchedCategories.push({
          name: category.name,
          values: matchedValues
        });
      }

      return matchedCategories;
    }, []);

    if (matchedCategories.length) {

      return {
        match: { categories: matchedCategories },
        keyboardSelectedHint: matchedCategories[0].values[0],
        allHints
      };
    }

    return {
      match: null,
      keyboardSelectedHint: null,
      allHints: []
    };
  }

  function applyHint(hint) {

    const {
      val,
      idx
    } = hint.apply(value);

    input.value = value = val;
    input.selectionEnd = input.selectionStart = position = idx;

    triggerChanged(value);
  }

  function handleInput(event) {

    const target = event.target;

    value = target.value;
    position = target.selectionStart;

    triggerChanged(value);
  }

  function nextHint(currentHint, direction) {

    const hints = (allHints || []);

    const currentIndex = hints.findIndex(hint => hint.name === currentHint.name);

    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) {
      nextIndex = hints.length - 1;
    }

    if (nextIndex === hints.length) {
      nextIndex = 0;
    }

    return hints[nextIndex];
  }

  function handleInputKey(event) {

    const key = event.key;

    if (key === 'Enter') {
      if (keyboardSelectedHint) {
        applyHint(keyboardSelectedHint);
      }

      event.preventDefault();
    }

    if (key === 'ArrowUp') {
      keyboardSelectedHint = nextHint(keyboardSelectedHint, -1);
      event.preventDefault();
    }

    if (key === 'ArrowDown') {
      keyboardSelectedHint = nextHint(keyboardSelectedHint, 1);
      event.preventDefault();
    }

    if (key === 'Escape' && !value) {
      input.blur();

      event.preventDefault();
    }
  }

  const triggerChanged = debounce((value) => {
    onChange && onChange(value);
  }, 500);

  function isInputTarget(event) {
    const {
      target
    } = event;

    return target === input;
  }

  function isFind(event) {

    const {
      ctrlKey,
      metaKey,
      key
    } = event;

    return (ctrlKey || metaKey) && key === 'f';
  }

  function handleGlobalKey(event) {

    if (isFind(event)) {
      event.preventDefault();

      if (!isInputTarget(event)) {
        input.focus();
      }
    }
  }
</script>

<svelte:window on:keydown={ handleGlobalKey } />

<div class="input-prefixed board-filter { className } { expanded && 'expanded' }">
  <label class="prefix" for={searchId}>
    <Icon class="icon">
      <SearchIcon />
    </Icon>
  </label>

  <input
    class="form-control"
    type="search"
    placeholder="Filter board"
    id={searchId}
    autocomplete="off"
    spellcheck="false"
    aria-label="Filter"
    bind:this={ input }
    bind:value={ value }
    on:input={ handleInput }
    on:keydown={ handleInputKey }
    on:focus={ () => focussed = true }
    on:blur={ () => focussed = false }
  />

  {#if value && match}
    <div class="help">
      {#each match.categories as category, idx}
        {#if idx > 0}
        <hr />
        {/if}

        <div class="category">{ category.name }</div>
        <ul>
          {#each category.values as value, idx}
            {#if idx < maxElements || (selectedHint && selectedHint.name === value.name) }
              <li
                class:active={ selectedHint && selectedHint.name === value.name }
                on:mouseover={ () => mouseSelectedHint = value }
                on:mouseout={ () => mouseSelectedHint = null }
                on:mousedown={ (event) => { event.preventDefault(); applyHint(mouseSelectedHint); } }
              >{#each value.parts as part}<span class:matched={ part.matched }>{ part.text }</span>{/each}</li>
            {/if}
          {/each}

          {#if category.values.length > maxElements}
            <li class="text">...</li>
          {/if}
        </ul>
      {/each}
    </div>
  {:else if focussed && !value}
    <div class="help">
      <div class="note">
        Filter cards by title and description or refine your search with operators such as <span>milestone</span>, <span>repo</span>, <span>assignee</span>, <span>label</span> and <span>is</span>.
      </div>
    </div>
  {/if}
</div>