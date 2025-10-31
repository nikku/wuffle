<script>
  import { Id } from './util';

  import {
    HintList
  } from './components';

  import {
    isFindShortcut
  } from './shortcuts';

  import {
    debounce
  } from './util';

  let {
    className,
    value,
    placeholder,
    completionOptions = {},
    onChange
  } = $props();

  const userPresets = [
    [ '@me', '@me' ]
  ].map(([ name, value ]) => {
    return { name, value };
  });

  const temporalPresets = [
    [ 'today', '@today' ],
    [ 'last week', '@last_week' ],
    [ 'last month', '@last_month' ]
  ].map(([ name, value ]) => {
    return { name, value };
  });

  const staticValues = {
    is: [
      'assigned',
      'unassigned',
      'approved',
      'reviewed',
      'epic',
      'milestoned',
      'open',
      'closed',
      'issue',
      'pull'
    ].map(name => {
      return { name, value: `${name} ` };
    }),
    created: temporalPresets,
    updated: temporalPresets,
    assignee: userPresets,
    author: userPresets,
    reviewer: userPresets,
    commented: userPresets,
    involves: userPresets
  };

  const dynamicValues = $derived(
    Object.entries(completionOptions).reduce((values, entry) => {

      const [ key, value ] = entry;

      values[key] = value.slice().sort().map(name => {

        const separator = !name.startsWith('"') ? '"' : '';

        return { name, value: `${separator}${name}${separator} ` };
      });

      return values;
    }, {})
  );

  const qualifierCategories = [
    {
      name: 'Operators',
      options: [
        'label',
        'assignee',
        'author',
        'repo',
        'reviewer',
        'commented',
        'milestone',
        'created',
        'updated',
        'involves',
        'is'
      ].map(name => {
        return {
          name,
          value: `${name}:`
        };
      })
    }
  ];

  let input;

  let focussed = $state(false);

  let position = $state(0);

  let keyboardSelectedHint = $state.raw(null);
  let mouseSelectedHint = $state.raw(null);

  const selectedHint = $derived(
    mouseSelectedHint || keyboardSelectedHint
  );

  const categoryValues = $derived(
    Object.keys({
      ...staticValues,
      ...dynamicValues
    }).reduce((values, key) => {
      values[key] = [].concat(staticValues[key] || [], dynamicValues[key] || []);

      return values;
    }, {})
  );

  const expanded = $derived(focussed || value);

  const {
    match,
    allHints
  } = $derived(computeMatch(value, position, categoryValues));

  $effect(() => {
    keyboardSelectedHint = keyboardSelectedHint && allHints.find(
      hint => hint.name === keyboardSelectedHint.name
    ) || allHints[0];

    mouseSelectedHint = null;
  });

  const searchId = Id();

  function computeMatch(value, searchEnd, categoryValues) {

    console.time('BoardFilter#computeMatch');

    const beforeCursor = value.substring(0, searchEnd);

    const searchStart = beforeCursor.lastIndexOf(' ') + 1;

    value = value.substring(searchStart, searchEnd).toLowerCase();

    const match = /^([-!]?)(?:([\w]+)(?:(:)(?:"([\w-]+)"?|([\w-]+))?)?)$/.exec(value);

    if (!match) {
      console.timeEnd('BoardFilter#computeMatch');

      return {
        allHints: [],
        match: null
      };
    }

    let [
      _,
      negator,
      qualifier,
      sep,
      qualifierText,
      qualifierTextEscaped
    ] = match;

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

    console.timeEnd('BoardFilter#computeMatch');

    if (matchedCategories.length) {

      return {
        match: {
          categories: matchedCategories
        },
        allHints
      };
    }

    return {
      match: null,
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

<svelte:window onkeydown={ handleGlobalKey } />

<div class="board-filter { className } dropdown-parent { expanded && 'expanded' }">
  <input
    class="form-control"
    type="search"
    placeholder={ placeholder }
    id={searchId}
    autocomplete="off"
    spellcheck="false"
    title={ placeholder + ' (ctrl + k, f)'}
    bind:this={ input }
    bind:value={ value }
    oninput={ handleInput }
    onkeydown={ handleInputKey }
    onfocus={ () => focussed = true }
    onblur={ () => focussed = false }
  />

  {#if focussed && value && match}
    <div class="help-dropdown">
      {#each match.categories as category, idx (category)}
        {#if idx > 0}
        <hr />
        {/if}

        <h3 class="category">{ category.name }</h3>

        <HintList
          hints={ category.values }
          selectedHint={ selectedHint }
          onHover={ hint => mouseSelectedHint = hint }
          onBlur={ () => mouseSelectedHint = null }
          onSelect={ applyHint }
        />

      {/each}
    </div>
  {:else if focussed && !value}
    <div class="help-dropdown">
      <p class="note">
        Filter cards by title and description.
      </p>

      <p class="note">
        Use additional operator such as <code>created</code>, <code>updated</code>, <code>milestone</code>, <code>repo</code>, <code>assignee</code>, <code>label</code> and <code>is</code> to refine your search.
      </p>
    </div>
  {/if}
</div>

<style lang="scss">

  @import "variables";

  @import "./HelpDropdown";

  .board-filter {
    &.expanded {
      width: 500px;
      max-width: 100%;
    }

    > input {
      width: 100%;
    }

    width: 300px;
  }

  .icon {
    color: $gray-300;
  }

  @media (prefers-color-scheme: dark) {
    .board-filter input {
      background-color: $darker;
      border-color: $dark;
      color: $light;
    }
  }
</style>