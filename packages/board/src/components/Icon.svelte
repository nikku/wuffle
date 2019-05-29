<script>
  export let className = '';

  export let name;
</script>

<style>
  .icon {
    vertical-align: initial;
  }
</style>

<i class="icon { className }" aria-label="icon: { name }">
  <slot></slot>
</i>