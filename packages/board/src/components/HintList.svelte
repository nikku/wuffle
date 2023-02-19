<script>
  export let className = '';

  export let hints;
  export let selectedHint;

  export let onHover;
  export let onBlur;
  export let onSelect;

  function handleMousedown(event, hint) {

    if (event.button === 0) {
      event.preventDefault();

      return onSelect(hint);
    }
  }

  function scrollIntoView(node, [ hint, selectedHint ]) {

    let lastSelectedHint = null;

    const hook = {
      update([ hint, selectedHint ]) {
        if (hint === selectedHint && hint !== lastSelectedHint) {
          lastSelectedHint = hint;

          node.scrollIntoView({ block: 'nearest' });
        }
      }
    };

    hook.update([ hint, selectedHint ]);

    return hook;
  }
</script>

<style lang="scss">

  @import "variables";

  .hint-list {
    list-style: none;

    max-height: 200px;
    overflow-y: auto;

    margin: 0.25rem 3px .8rem;
    padding: 0 3px 0 7px;
  }

  .hint-list li {
    margin: 0;
    margin-left: -.35rem;
    padding: .25rem .35rem;

    border-radius: 5px;

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

<ul class={ [ className, 'hint-list' ].join(' ') }>
  {#each hints as hint, idx}
    <li
      class:active={ selectedHint === hint }
      class="selectable"
      use:scrollIntoView={ [ hint, selectedHint ] }
      on:mouseover={ () => onHover(hint) }
      on:mouseout={ () => onBlur(hint) }
      on:mousedown|preventDefault={ (event) => onSelect(hint) }
    >{#each hint.parts as part}<span class:matched={ part.matched }>{ part.text }</span>{/each}</li>
  {/each}
</ul>