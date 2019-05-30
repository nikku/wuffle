<style lang="scss">
  .loader {

    position: absolute;
    left: 50%;
    top: 40%;
    transform: translateX(-50%);
    text-align: center;

    z-index: 200;

    opacity: 0.3;
    transition: opacity 0.5s;

    &.shown {
      opacity: 1;

      animation: pulsate 1s infinite;
      animation-timing-function: ease-in-out;
    }

    &:not(.shown) {
      opacity: 0;
      pointer-events: none;
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

<script>
  import { onMount } from 'svelte';

  export let className = '';
  export let shown = false;

  let realShown = false;

  onMount(() => {
    realShown = shown;
  });

  $: realShown = shown;
</script>

<div class="loader { className }" class:shown={ shown }>
  <slot></slot>
</div>