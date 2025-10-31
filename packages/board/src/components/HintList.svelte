<script>
  let {
    className = '',
    hints,
    selectedHint,
    onHover,
    onBlur,
    onSelect
  } = $props();

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

<ul class={ [ className, 'hint-list', 'scroll-container-v' ].join(' ') }>
  {#each hints as hint (hint) }
    <li
      use:scrollIntoView={ [ hint, selectedHint ] }
    >
      <a
        class:active={ selectedHint === hint }
        onmouseenter={ () => onHover(hint) }
        onmouseleave={ () => onBlur(hint) }
        onmousedown={ (e) => handleMousedown(e, hint) }
        onclick={ (e) => e.preventDefault() || handleMousedown(e, hint) }
        href
      >{#each hint.parts as part (part)}<span class:matched={ part.matched }>{ part.text }</span>{/each}</a>
    </li>
  {/each}
</ul>

<style lang="scss">

  @import "variables";

  .hint-list {
    list-style: none;

    max-height: 200px;
    overflow-y: auto;
    padding: 0;
    margin: 0;
  }

  .hint-list:not(:first-child) {
    margin-top: 0;
  }

  .hint-list li {
    margin: 0 var(--container-gap);
  }

  .hint-list li:first-child {
    margin-top: var(--container-gap);
  }

  .hint-list li:last-child {
    margin-bottom: var(--container-gap);
  }

  .hint-list li a {
    padding: calc(var(--container-gap) / 2) var(--container-gap);
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

  @media (prefers-color-scheme: dark) {
  .hint-list li a,
  .matched {
    color: $light
  }
}
</style>