<script>
  export let item;
  export let linktype;
  $: child = linktype === 'CHILD_OF';
  $: parent = linktype === 'PARENT_OF';
</script>

<style lang="scss">

  .epic-icon {
    margin-right: 3px;

    &.child {
      color: #ffffff;
    }

    &.parent {
      color: #1d76db;
    }

  }
</style>
{#if parent}

<svg class="epic-icon"  class:child={ child } class:parent={ parent }  width="12" height="1rem" viewBox="0 0 12 16" version="1.1" aria-hidden="true">

  <path fill="currentColor" stroke="#1d76db" transform="rotate(-89.89169311523438 5.963454723358154,7.855281829833984)"
  d="m-1.079501,2.743426l10.564429,0l3.521483,5.111845l-3.521483,5.111868l-10.564429,0l3.521482,-5.111868l-3.521482,-5.111845z"
  stroke-opacity="null" stroke-width="1.5" />

</svg>


{:else}
<svg class="epic-icon"  class:child={ child } class:parent={ parent }  width="12" height="1rem" viewBox="0 0 12 16" version="1.1" aria-hidden="true">

  <path fill="currentColor" stroke="#1d76db" transform="rotate(-89.89169311523438 5.963454723358154,7.855281829833984)"
  d="m-1.079501,2.743426l10.564429,0l3.521483,5.111845l-3.521483,5.111868l-10.564429,0l3.521482,-5.111868l-3.521482,-5.111845z"
  stroke-opacity="null" stroke-width="1.5" />

</svg>
{/if}