<div class="powered-by">
  <span class="help">

    <a class="help-item" href="https://wuffle.dev/docs"
       target="_blank" rel="noopener">
      Documentation
    </a>

    <a class="help-item" href="https://wuffle.dev/docs/shortcuts-navigation"
       target="_blank" rel="noopener">
      Keyboard shortcuts
    </a>

    <span class="help-item">
      Powered by
    </span>
  </span>

  <a class="logo" href="https://wuffle.dev"
     target="_blank" rel="noopener" title="About Wuffle">

    <!-- ./logo-gray.svg with dynamic fill color -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="20" height="20">
      <path d="M12 0h56c7 0 12 5 12 12v56c0 7-5 12-12 12H12C5 80 0 75 0 68V12C0 5 5 0 12 0z" fill="currentColor"/>
      <path class="logo-boxes" d="M15 10h21c3 0 5 2 5 5v6c0 3-2 5-5 5H15c-2 0-4-2-4-5v-6c0-3 2-5 4-5zm0 20h21c3 0 5 2 5 5v6c0 2-2 4-5 4H15c-2 0-4-1-4-4v-6c0-3 2-5 4-5zm27 22h21c2 0 4 2 4 5v6c0 2-2 4-4 4H42c-2 0-4-2-4-4v-6c0-3 2-5 4-5z" />
    </svg>
  </a>
</div>

<style lang="scss">
  @import "variables";

  .powered-by {
    position: absolute;
    bottom: 10px;
    right: 10px;
    padding: 7px;
    border-radius: 4px;

    opacity: .5;
    transition: opacity .1s, background .1s;

    color: #333;

    z-index: 10;

    align-items: center;

    display: flex;

    .logo {
      display: inline-flex;
    }

    &:not(:hover, :focus-within) {
      .logo {
        color: #999;
      }

      .logo-boxes {
        fill: $light;
      }
    }

    &:hover,
    &:focus-within {
      opacity: 1;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      background: white;

      .help {
        display: block;
      }

      .logo-boxes {
        fill: $light;
      }
    }

    .help {
      font-size: .9em;
      display: none;
    }

    .logo {
      margin-left: .5em;
    }

    .help-item {
      margin-left: .5em;
    }

    .help-item + .help-item {
      margin-left: 1em;
    }

    .help-item {
      display: inline-block;
    }
  }

  @media (prefers-color-scheme: dark) {
    .powered-by {
      color: $light;

      &:not(:hover, :focus-within) .logo {
        color: lighten($dark, 30%);
      }

      &:hover,
      &:focus-within {
        background: $darker;
      }
    }
  }
</style>