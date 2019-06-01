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

  let focussed = false;

  $: expanded = focussed || value;

  const searchId = Id();

  const handleInput = debounce((event) => {
    onChange && onChange(event.target.value);
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
    aria-label="Filter"
    bind:value={ value }
    on:input={ handleInput }
    on:focus={ () => focussed = true }
    on:blur={ () => focussed = false }
  />
</div>