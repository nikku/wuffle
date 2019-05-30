<script>
  import { fly } from 'svelte/transition';

  export let message;
</script>

<style lang="scss">

  @import "variables";

  .notification {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: rgba(0, 0, 0, 0.65);
    font-size: 14px;
    font-variant: tabular-nums;
    line-height: 1.5;
    list-style: none;
    position: fixed;
    z-index: 1010;
    width: 384px;
    max-width: calc(100vw - 32px);
    margin-right: 24px;

    border-left: solid 3px $danger;

    top: 24px;
    right: 0;

    margin-bottom: 16px;
    padding: 16px 24px;
    overflow: hidden;
    line-height: 1.5;
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .heading {
    color: $gray-900;
    font-weight: normal;
    font-size: 1.2em;
    margin-bottom: 5px;
  }
</style>

<div class="notification" transition:fly>
  <div class="heading">{ message }</div>
  <div class="detail">
    <slot></slot>
  </div>
</div>