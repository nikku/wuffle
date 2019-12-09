<style lang="scss">

  .icon {
    margin-right: 2px;

    color: #1d76db;
  }
</style>

<script>
  export let onClick;
</script>

<svg class:clickable={ onClick } on:click={ onClick }  class="icon" width="1em" height="1em" viewBox="0 0 12 16" version="1.1" aria-hidden="true">

  <path fill="currentColor" stroke="#1d76db" d="M1 15V4l5-3 5 3v11l-5-4-5 4z" stroke-width="1.5" />

</svg>