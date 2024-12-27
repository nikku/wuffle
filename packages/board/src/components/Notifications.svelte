<script>
  let {
    children
  } = $props();
</script>

<div class="notifications">
  {@render children?.() }
</div>

<style lang="scss">
  .notifications {
    position: fixed;
    z-index: 1010;
    top: 24px;
    right: 24px;
  }
</style>