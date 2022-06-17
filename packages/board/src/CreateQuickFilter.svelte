<script>
  import CreateFilterDialog from './CreateQuickFilterDialog.svelte';

  export let onSubmit= () => {};
  export let onClose = () => {};

  let open;

  const handleClose = (e) => {
    onClose(e);
    open = false;
  };

  const handleSubmit = (e) => {
    onSubmit(e);
    open = false;
  };
</script>

<button class="btn btn-outline-primary ml-1" on:click={() => {open = true}}>🖫</button>

{#if open}
  <CreateFilterDialog
    onClose={ handleClose }
    onSubmit={ handleSubmit }
  >
    <h4 slot="header" class="chooser-header my-3">
      Create new Quickfilter
    </h4>
  </CreateFilterDialog>
{/if}