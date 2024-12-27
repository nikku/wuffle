<script>
  let {
    rounded = false,
    children
  } = $props();
</script>

<span class="avatar" class:avatar-rounded={ rounded }>
  {@render children?.()}

  <div class="avatar-shadow"></div>
</span>

<style lang="scss">
  .avatar {
    position: relative;
    display: inline-block;
    overflow: hidden;
    color: #fff;
    white-space: nowrap;
    text-align: center;
    vertical-align: middle;
    background: #ccc;
    width: 32px;
    height: 32px;
    line-height: 32px;
  }

  .avatar-shadow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    box-shadow: inset 0 0 2px 0 rgba(0,0,0,.1);
  }

  .avatar-rounded {
    border-radius: 50%;

    .avatar-shadow {
      border-radius: 50%;
    }
  }
</style>