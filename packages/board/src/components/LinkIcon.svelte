<style lang="scss">
  .icon {
    margin-right: 2px;

    &.issue.open,
    &.depends-on.closed {
      color: #28a745;
    }

    &.issue.closed,
    &.depends-on {
      color: #cb2431;
    }

    &.linked-to {
      color: #37ACC8;
    }
  }
</style>

<script>
  export let name;
  export let state = '';
  export let className = '';
  export let onClick;
</script>

{#if name === 'issue'}

  {#if state !== 'closed'}
    <svg  class:clickable={ onClick } on:click={ onClick } class="icon issue { className }" class:open={ state === 'open' } width="1em" height="1em" viewBox="0 0 14 16" version="1.1" aria-hidden="true" fill="currentColor">
      <path fill-rule="evenodd" d="M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"></path>
    </svg>
  {:else}
    <svg  class:clickable={ onClick } on:click={ onClick } class="icon issue closed { className }" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
      <path fill-rule="evenodd" d="M7 10h2v2H7v-2zm2-6H7v5h2V4zm1.5 1.5l-1 1L12 9l4-4.5-1-1L12 7l-1.5-1.5zM8 13.7A5.71 5.71 0 0 1 2.3 8c0-3.14 2.56-5.7 5.7-5.7 1.83 0 3.45.88 4.5 2.2l.92-.92A6.947 6.947 0 0 0 8 1C4.14 1 1 4.14 1 8s3.14 7 7 7 7-3.14 7-7l-1.52 1.52c-.66 2.41-2.86 4.19-5.48 4.19v-.01z"></path>
    </svg>
  {/if}

{/if}

{#if name === 'depends-on'}

  {#if state === 'closed'}
    <svg class:clickable={ onClick } on:click={ onClick } class="icon depends-on closed { className }" width="1em" height="1em" viewBox="0 0 12 16" version="1.1" aria-hidden="true" fill="currentColor">
      <path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5L12 5z"></path>
    </svg>
  {:else}
    <svg class:clickable={ onClick } on:click={ onClick } class="icon depends-on { className }" width="1em" height="1em" viewBox="0 0 14 16" version="1.1" aria-hidden="true" fill="currentColor">
      <path fill-rule="evenodd" d="M7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 1.3c1.3 0 2.5.44 3.47 1.17l-8 8A5.755 5.755 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zm0 11.41c-1.3 0-2.5-.44-3.47-1.17l8-8c.73.97 1.17 2.17 1.17 3.47 0 3.14-2.56 5.7-5.7 5.7z"></path>
    </svg>
  {/if}

{/if}


{#if name === 'linked-to'}
  <svg class:clickable={ onClick } on:click={ onClick } class="icon linked-to { className }" width="1em" height="1em" viewBox="0 0 14 16" version="1.1" aria-hidden="true" fill="currentColor">
    <path fill-rule="evenodd" d="M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"></path>
  </svg>
{/if}


{#if name === 'epic'}
  <svg class:clickable={ onClick } on:click={ onClick } class="icon epic { className}" width="1em" height="1em" viewBox="0 0 12 16" version="1.1" aria-hidden="true" stroke="currentColor">
    <path fill="none" fill-rule="evenodd" transform="rotate(-89.89169311523438 5.963454723358154,7.855281829833984)"
    d="m-1.079501,2.743426l10.564429,0l3.521483,5.111845l-3.521483,5.111868l-10.564429,0l3.521482,-5.111868l-3.521482,-5.111845z" stroke-width="1.5" />
  </svg>
{/if}

