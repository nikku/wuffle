<style lang="scss">
  .icon {
    margin-right: 3px;

    &.closed {
      color: #8250df;
    }

    &.open {
      color: #1a7f37;
    }

    &.not-planned {
      color: #6e7781
    }
  }
</style>

<script>
  export let name;
  export let state = '';
  export let state_reason = '';
  export let className = '';
</script>

{#if name === 'issue' || name === 'linked-to' }

  {#if state === 'closed'}

    {#if state_reason === 'not_planned' }
      <svg class="icon depends-on closed not-planned { className }" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm3.28 5.78a.75.75 0 00-1.06-1.06l-5.5 5.5a.75.75 0 101.06 1.06l5.5-5.5z"></path>
      </svg>
    {:else}
      <svg class="icon issue closed { className }" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
        <path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z"></path><path fill-rule="evenodd" d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"></path>
      </svg>
    {/if}

  {:else}
    <svg class="icon issue { className }" class:open={ state === 'open' } viewBox="0 0 16 16" width="1em" height="1em" version="1.1" aria-hidden="true" fill="currentColor">
      <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path><path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"></path>
    </svg>
  {/if}

{/if}

{#if name === 'depends-on'}

  {#if state === 'closed'}
    {#if state_reason === 'not_planned' }
      <svg class="icon depends-on closed not-planned { className }" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm3.28 5.78a.75.75 0 00-1.06-1.06l-5.5 5.5a.75.75 0 101.06 1.06l5.5-5.5z"></path>
      </svg>
    {:else}
      <svg class="icon depends-on closed not-planned { className }" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
        <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path><path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"></path>
      </svg>
    {/if}
  {:else}
    <svg class="icon depends-on { className } open" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
      <path d="M1.5 8a6.5 6.5 0 0113 0A.75.75 0 0016 8a8 8 0 10-8 8 .75.75 0 000-1.5A6.5 6.5 0 011.5 8z"></path><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm3.573 5.823l-2.896-2.896a.25.25 0 010-.354l2.896-2.896a.25.25 0 01.427.177V11.5h3.25a.75.75 0 010 1.5H12v2.146a.25.25 0 01-.427.177z"></path>
    </svg>
  {/if}

{/if}


{#if name === 'epic'}
  <svg class="icon epic { state_reason === 'not_planned' ? 'not-planned' : '' } { className }" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
    <path d="M8.006 1.078a.748.748 0 0 0-.477.172L3.64 4.36l-.002.002-.088.07h.012c-.344.32-.561.773-.561 1.28v8.538a.75.75 0 0 0 1.227.578L8 11.723l3.773 3.105A.75.75 0 0 0 13 14.25V5.711c0-.527-.234-1-.604-1.32h-.002l-.01-.008a1.76 1.76 0 0 0-.075-.062L8.482 1.25a.748.748 0 0 0-.476-.173Zm0 1.723.002.002L11.4 5.516h.002a.246.246 0 0 1 .098.195v6.95l-3.023-2.49a.749.749 0 0 0-.954 0L4.5 12.662V5.71c0-.082.04-.152.102-.197h.002c1.135-.903 3.402-2.713 3.402-2.713Z"/>
  </svg>
{/if}

