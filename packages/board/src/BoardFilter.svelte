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

        &:hover,
        &.active {
          background: scale-color($primary, $alpha: -90%);
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

  export let onChange;

  let keyboardSelectedHint = '';
  let mouseSelectedHint = '';

  $: selectedHint = mouseSelectedHint || keyboardSelectedHint;

  let focussed = false;
  let match;
  let allHints;

  const categories = [
    {
      name: 'Operators',
      values: [
        'label',
        'assignee',
        'repo',
        'reviewer',
        'milestone',
        'is:assigned',
        'is:unassigned',
        'is:closed',
        'is:open',
        'is:issue',
        'is:pull'
      ]
    }
  ];

  $: expanded = focussed || value;
  $: {
    let opts = computeMatch(value);

    match = opts.match;
    keyboardSelectedHint = opts.keyboardSelectedHint;
    allHints = opts.allHints;
  };

  const searchId = Id();

  function computeMatch(value) {

    value = value || '';

    value = value.toLowerCase();

    if (value.lastIndexOf(' ') !== -1) {
      value = value.substring(value.lastIndexOf(' ') + 1);
    }

    value = value.replace(/^[-!]{1}/, '');

    if (!value) {
      return {};
    }

    const allHints = [];

    const matchedCategories = categories.reduce((matchedCategories, category) => {

      const matchedValues = category.values.reduce((matchedValues, categoryValue) => {

        categoryValue = categoryValue.toLowerCase();

        if (categoryValue.startsWith(value)) {

          const hint = {
            name: categoryValue,
            parts: [
              {
                text: value,
                matched: true
              },
              {
                text: categoryValue.substring(value.length)
              }
            ]
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
        })
      }

      return matchedCategories;
    }, []);

    if (matchedCategories.length) {

      return {
        match: { categories: matchedCategories },
        keyboardSelectedHint: matchedCategories[0].values[0].name,
        allHints
      };
    }

    return {
      match: null,
      keyboardSelectedHint: '',
      allHints: []
    };
  }

  function applyHint(hint) {

    const spaceIdx = value.lastIndexOf(' ');

    const currentValue = spaceIdx !== -1 ? value.substring(spaceIdx + 1) : value;

    const existingValue = spaceIdx !== -1 ? value.substring(0, spaceIdx + 1) : '';

    const [ _, negationPrefix, actualValue ] = /^([-!]?)(.*)$/.exec(currentValue);

    value = existingValue + (negationPrefix || '') + hint + (hint.includes(':') ? ' ' : ':');

    triggerChanged(value);
  }

  function handleInput(event) {
    value = event.target.value;

    triggerChanged(value);
  }

  function nextHint(currentHint, direction) {

    const hints = (allHints || []);

    const currentIndex = hints.findIndex(h => h.name === currentHint) || 0;

    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) {
      nextIndex = hints.length - 1;
    }

    if (nextIndex === hints.length) {
      nextIndex = 0;
    }

    const hint = hints[nextIndex];

    return hint && hint.name;
  }

  function handleKey(event) {

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
  }

  const triggerChanged = debounce((value) => {
    onChange && onChange(value);
  }, 500);

</script>

<div class="input-prefixed board-filter { className } { expanded && 'expanded' }">
  <label class="prefix" for={searchId}>
    <Icon class="icon" className="BOO">
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
    bind:value={ value }
    on:input={ handleInput }
    on:keydown={ handleKey }
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
          {#each category.values as value}
            <li
              class:active={ mouseSelectedHint ? value.name === mouseSelectedHint : value.name === keyboardSelectedHint }
              on:mouseover={ () => mouseSelectedHint = value.name }
              on:mouseout={ () => mouseSelectedHint = '' }
              on:mousedown={ (event) => { event.preventDefault(); applyHint(mouseSelectedHint) } }
            >{#each value.parts as part}<span class:matched={ part.matched }>{ part.text }</span>{/each}</li>
          {/each}
        </ul>
      {/each}
    </div>
  {:else if focussed && !value}
    <div class="help">
      <div class="note">
        Filter cards by title and description or refine your search with operators such as <span>milestone</span>, <span>repo</span>, <span>assignee</span>, and <span>label</span> or <span>is</span>.
      </div>
    </div>
  {/if}
</div>