<style lang="scss">

  @import "variables";

  @import './InputPrefixed';

  .board-filter {

    &.expanded {
      width: 500px;
      max-width: 100%;
    }

    width: 300px;
  }

  .icon {
    color: $gray-300;
  }
</style>


<script>
  import { Id } from './util';

  import {
    Icon,
    HintList
  } from './components';

  import {
    isFindShortcut
  } from './shortcuts';

  import {
    debounce
  } from './util';

  import SearchIcon from './components/SearchIcon.svelte';

  export let className = '';
  export let value = '';

  export let completionOptions = {};

  export let onChange;

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
        'author',
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

        if (name.toLowerCase().includes(search)) {

          const idx = name.indexOf(search);

          const hint = {
            name: name,
            parts: [
              {
                text: name.substring(0, idx)
              },
              {
                text: name.substring(idx, idx + search.length),
                matched: true
              },
              {
                text: name.substring(idx + search.length)
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

  function handleGlobalKey(event) {

    if (isFindShortcut(event)) {
      event.preventDefault();

      if (!isInputTarget(event)) {
        input.focus();
      }
    }
  }
</script>

<svelte:window on:keydown={ handleGlobalKey } />

<div class="board-filter { className } { expanded && 'expanded' }">
  <div class="input-prefixed" class:focussed={ focussed }>

    <label class="prefix" for={searchId}>
      <Icon class="icon" name="search">
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

          <HintList
            hints={ category.values }
            selectedHint={ selectedHint }
            onHover={ hint => mouseSelectedHint = hint }
            onBlur={ () => mouseSelectedHint = null }
            onSelect={ applyHint }
            maxElements= { 7 }
          />

        {/each}
      </div>
    {:else if focussed && !value}
      <div class="help">
        <p class="note">
          Filter cards by title and description.
        </p>

        <p class="note">
          Refine your search with operators: <em>milestone</em>, <em>repo</em>, <em>assignee</em>, <em>label</em> and <em>is</em>.
        </p>
      </div>
    {/if}
  </div>
</div>