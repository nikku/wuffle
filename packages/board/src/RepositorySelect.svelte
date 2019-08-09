<script>

  import { onMount } from 'svelte';

  import { HintList } from './components';

  import { Id } from './util';

  const inputId = Id();

  export let onClose;

  export let repositories;

  export let onSelect;

  let matchedHints;

  let allHints;

  let keyboardSelectedHint;
  let mouseSelectedHint;

  let value = '';

  let input;

  $: {
    console.time('RepositorySelect#computeMatch');

    let opts = computeMatch(value, repositories);

    console.timeEnd('RepositorySelect#computeMatch');

    matchedHints = opts.matchedHints;
    allHints = opts.allHints;

    keyboardSelectedHint = (
      matchedHints && keyboardSelectedHint && matchedHints.find(
        hint => hint.name === keyboardSelectedHint.name
      ) || opts.keyboardSelectedHint
    );
  }

  $: selectedHint = mouseSelectedHint || keyboardSelectedHint;

  function computeMatch(search, repositories) {
    const allHints = repositories.map(name => {
      return {
        name,
        apply() {
          return {
            val: name,
            idx: 0
          };
        }
      };
    });

    const matchedHints = repositories.reduce((matchedHints, name) => {

      if (!name.toLowerCase().includes(search)) {
        return matchedHints;
      }

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

          return {
            val: name,
            idx: 0
          };
        }
      };

      matchedHints.push(hint);

      return matchedHints;
    }, []);

    return {
      keyboardSelectedHint: matchedHints[0],
      matchedHints,
      allHints
    };
  }

  function applyHint(hint) {

    const {
      val,
      idx
    } = hint.apply(value);

    input.value = value = val;
    input.selectionEnd = input.selectionStart = idx;
  }

  function handleInput(event) {
    value = event.target.value;
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

  onMount(() => {
    input.focus();
  });

  function checkClose(event) {

    if (event.key === 'Escape') {
      event.preventDefault();

      onClose();
    }
  }

  function checkSubmit(event) {
    event.preventDefault();

    if (!value) {
      return;
    }

    const [ owner, repo ] = value.split('/');

    if (!repo || !owner) {
      return;
    }

    return onSelect(owner, repo);
  }
</script>

<style lang="scss">

  @import './InputPrefixed';

  .repository-select {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    z-index: 10;
  }

  .overlay {
    width: 100%;
    height: 100%;

    background: rgba(30, 30, 30, .30);
  }

  .issue-creator {
    position: absolute;
    z-index: 2;
    width: 500px;
    max-width: 100%;

    background: white;
    top: 30%;
    left: 50%;
    transform: translate(-50%);

    line-height: 1.5;

    border-radius: 3px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

</style>

<svelte:window on:keydown={ checkClose } />

<div class="repository-select">
  <div class="overlay" on:click={ onClose }></div>

  <form class="form-inline issue-creator p-4" on:submit={ checkSubmit }>

    <slot name="header"></slot>

    <div class="input-prefixed input-prefixed-lg">

      <label class="prefix" for={ inputId }>
        <svg height="1em" viewBox="0 0 12 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z"></path></svg>
      </label>

      <input
        id={ inputId }
        bind:this={input}
        value={ value }
        on:input={ handleInput }
        on:keydown={ handleInputKey }
        placeholder="Choose org/repo"
        autocomplete="off"
        spellcheck="false"
        aria-label="Repository name input"
        class="form-control form-control-lg"
        type="text"
      />

      {#if value && matchedHints.length }
        <div class="help">
          <HintList
            hints={ matchedHints }
            selectedHint={ selectedHint }
            onHover={ hint => mouseSelectedHint = hint }
            onBlur={ () => mouseSelectedHint = null }
            onSelect={ applyHint }
            maxElements= { 7 }
          />
        </div>
      {/if}
    </div>
  </form>

</div>