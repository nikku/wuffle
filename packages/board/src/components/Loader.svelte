<script>
  let {
    className = '',
    shown = true,
    children
  } = $props();
</script>

<div class="loader { className }" class:shown={ shown }>
  <div class="content">
    {@render children?.() }
  </div>
</div>

<style lang="scss">
  .loader {

    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 200;
    pointer-events: none;

    > .content {
      opacity: 0.3;
      transition: opacity 0.5s;
    }

    &.shown > .content {
      opacity: 1;

      animation: pulsate 1s infinite;
      animation-timing-function: ease-in-out;
    }

    &:not(.shown) > .content {
      opacity: 0;
    }
  }

  @keyframes pulsate {
    0% {
      transform: scale(1);
      opacity: 1;
    }

    50% {
      transform: scale(0.9);
      opacity: 0.8;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>