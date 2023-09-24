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
    padding: 0;
  }

  .hint-list:not(:first-child) {
    margin-top: 0;
  }

  .hint-list li {
    margin: 0;
  }

  .hint-list li a {
    padding: .25rem .35rem;
    width: 100%;
    display: block;
    border-radius: 5px;

    color: inherit;
    text-decoration: none;

    &:hover,
    &.active {
      background: scale-color($primary, $alpha: -90%);
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

<ul class={ [ className, 'hint-list', 'scroll-container-v' ].join(' ') }>
  {#each hints as hint, idx}
    <li
      use:scrollIntoView={ [ hint, selectedHint ] }
    >
      <a
        class:active={ selectedHint === hint }
        on:mouseenter={ () => onHover(hint) }
        on:mouseleave={ () => onBlur(hint) }
        on:click|preventDefault={ (event) => handleMousedown(event, hint) }
        href
      >{#each hint.parts as part}<span class:matched={ part.matched }>{ part.text }</span>{/each}</a>
    </li>
  {/each}
</ul>