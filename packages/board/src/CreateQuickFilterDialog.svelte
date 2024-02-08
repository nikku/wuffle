<script>

  import { onMount } from 'svelte';

  import { Id } from './util';

  const inputId = Id();

  export let onClose;

  export let onSubmit;

  let value = '';

  let input;

  function handleInput(event) {
    value = event.target.value;
  }

  function handleInputKey(event) {

    const key = event.key;

    if (key === 'Enter') {
      checkSubmit(event);
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

    return onSubmit(value);
  }
</script>

<style lang="scss">

  .filter-create {
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

  .filter-creator {
    position: absolute;
    z-index: 2;
    width: 500px;
    max-width: 100%;

    background: white;
    top: 30%;
    left: 50%;
    transform: translate(-50%);

    line-height: 1.5;

    border-radius: 5px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .form-container {
    margin-bottom: 1rem;
    display: flex;
  }

  .form-container > input {
    flex-grow: 1;
  }
</style>

<svelte:window on:keydown={ checkClose } />

<div class="filter-create">
  <div class="overlay" on:click={ onClose }></div>

  <form class="filter-creator px-4 py-2" on:submit={ checkSubmit }>

    <slot name="header"></slot>
    <div class="form-container">
      <input
        id={ inputId }
        bind:this={ input }
        value={ value }
        on:input={ handleInput }
        on:keydown={ handleInputKey }
        placeholder="Filter Name"
        autocomplete="off"
        spellcheck="false"
        aria-label="Qucikfilter name input"
        class="form-control form-control-lg"
        type="text"
      />
      <button type="submit" class="btn btn-primary btn-lg mx-1">Create</button>
    </div>
  </form>

</div>