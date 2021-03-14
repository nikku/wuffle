<script>
  export let className = '';

  export let hints;
  export let selectedHint;

  export let onHover;
  export let onBlur;
  export let onSelect;

  export let maxElements;
</script>

<style lang="scss">

  @import "variables";

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    padding: 0 .8rem;
    line-height: 2em;

    &.selectable {
      cursor: pointer;

      &:hover,
      &.active {
        background: scale-color($primary, $alpha: -90%);
      }
    }

    &.text {
      color: $gray-600;
    }
  }

  .matched {
    background: scale-color($primary, $alpha: -80%);
    color: darken($primary, 10%);
  }
</style>

<ul class={ className }>
  {#each hints as hint, idx}
    {#if idx < maxElements || (selectedHint && selectedHint.name === hint.name) }
      <li
        class:active={ selectedHint && selectedHint.name === hint.name }
        class="selectable"
        on:mouseover={ () => onHover(hint) }
        on:mouseout={ () => onBlur(hint) }
        on:mousedown|preventDefault={ (event) => onSelect(hint) }
      >{#each hint.parts as part}<span class:matched={ part.matched }>{ part.text }</span>{/each}</li>
    {/if}
  {/each}

  {#if hints.length > maxElements}
    <li class="text">...</li>
  {/if}
</ul>