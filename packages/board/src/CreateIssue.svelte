<script>
  import RepositorySelect from './RepositorySelect.svelte';

  let {
    repositories,
    open,
    onCreate,
    onClose
  } = $props();
</script>

{#if open}
  <RepositorySelect
    repositories={ repositories }
    onClose={ onClose }
    onSelect={ onCreate }
  >
    {#snippet header()}
      <h4 class="chooser-header my-3">
        Create new Issue
      </h4>
    {/snippet}
  </RepositorySelect>
{/if}