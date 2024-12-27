<script>
  let {
    className = '',
    children,
    name
  } = $props();
</script>

<i class="icon { className }" aria-label="icon: { name }">
  {@render children?.() }
</i>

<style>
  .icon {
    vertical-align: initial;
  }
</style>