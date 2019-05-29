<script>
  export let rounded = false;
  export let title = '';
</script>

<style>
  i {
    display: inline-block;
    color: inherit;
    font-style: normal;
    line-height: 0;
    text-align: center;
    text-transform: none;
  }

  i > * {
    display: inline-block;
    line-height: 1;
  }

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

  .avatar-rounded {
    border-radius: 50%;
  }
</style>

<span class="avatar" title={ title } class:avatar-rounded={ rounded }>
  <slot></slot>
</span>