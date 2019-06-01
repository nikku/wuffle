<script>
  function isLight(color) {
    color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));

    const r = color >> 16,
          g = (color >> 8) & 255,
          b = color & 255;

    const hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );

    return hsp > 127.5;
  }

  export let name;
  export let color = '';
  export let className = '';

  $: inverted = color && isLight(color);
</script>

<span
  class:inverted={ inverted }
  class="tag { className }"
  style="background-color: { color }"
>{ name }</span>

<style lang="scss">
  .tag {
    list-style: none;
    display: inline-block;
    height: auto;

    margin: 0 4px 4px 0;
    padding: 1px 7px;

    font-size: 12px;
    font-weight: 500;

    line-height: 20px;
    white-space: nowrap;
    cursor: default;

    color: white;
    background: #fafafa;
    border-radius: 4px;

    &.inverted {
      color: #333;
    }
  }
</style>