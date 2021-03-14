<script>
  import RepositorySelect from './RepositorySelect.svelte';

  export let repositories;

  export let open;
  export let onCreate;
  export let onClose;
</script>

{#if open}
  <RepositorySelect
    repositories={ repositories }
    onClose={ onClose }
    onSelect={ onCreate }
  >
    <h4 slot="header" class="chooser-header my-3">
      Create new Issue
    </h4>
  </RepositorySelect>
{/if}