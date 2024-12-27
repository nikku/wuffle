<script>
  function isLight(color) {
    /* eslint no-bitwise: "off" */

    color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));

    const r = color >> 16,
          g = (color >> 8) & 255,
          b = color & 255;

    const hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );

    return hsp > 145;
  }

  let {
    title = '',
    name,
    color = null,
    className = '',
    onclick,
    href = null
  } = $props();

  const inverted = $derived(color && isLight(color));
</script>

{#if href}
  <a
    href={ href }
    target="_blank"
    title={ title || name }
    rel="noopener noreferrer"
    class:inverted={ inverted }
    class="tag { className }"
    style="background-color: { color }"
    onclick={ onclick }
  >{ name }</a>
{:else}
  <button
    class:inverted={ inverted }
    class="tag { className }"
    class:clickable={ onclick }
    style="background-color: { color }"
    onclick={ onclick }
    title={ title || name }
  >{ name }</button>
{/if}

<style lang="scss">
  .tag {
    list-style: none;
    display: inline-block;
    height: auto;

    margin: 0 4px 4px 0;
    padding: 2px 7px;

    font-size: 12px;
    font-weight: 400;

    white-space: nowrap;

    overflow: hidden;
    text-overflow: ellipsis;

    color: white;
    background: #fafafa;
    border-radius: 6px;
    border: none;

    text-decoration: none;

    &:not(a) {
      cursor: default;
    }

    &.inverted {
      color: #000;
    }
  }

  :not(a.tag, .tag.clickable) {
    cursor: default;
  }
</style>