<script>
  import { fly } from 'svelte/transition';

  export let message;

  export let type = 'info';
</script>

<style lang="scss">

  @import "variables";

  .notification {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: $gray-600;
    font-size: 14px;
    font-variant: tabular-nums;
    line-height: 1.5;
    list-style: none;
    width: 384px;
    max-width: calc(100vw - 32px);
    padding: 16px 24px;
    overflow: hidden;
    line-height: 1.5;
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: solid 4px $info;

    &.error {
      border-left-color: $danger;
    }

    &.warning {
      border-left-color: $warning;
    }
  }

  .notification + .notification {
    margin-top: 16px;
  }

  .heading {
    color: $gray-900;
    font-weight: normal;
    font-size: 1.2em;
    margin-bottom: 5px;
  }
</style>

<div
  class="notification"
  class:error={ type === 'error' }
  class:warning={ type === 'warning' }
  class:info={ type === 'info' }
  transition:fly
>
  <div class="heading">{ message }</div>
  <div class="detail">
    <slot></slot>
  </div>
</div>