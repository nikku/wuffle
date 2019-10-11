<script>

  export let item;

  $: check_runs = item.check_runs || [];

  const resultMap = {
    failure: 'failed',
    success: 'succeeded',
    in_progress: 'in progress',
    queued: 'queued'
  };
</script>

<style lang="scss">

  @import "variables";

  .card-status {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    height: 4px;

    width: auto;
    margin: 3px -8px -4px;
  }

  .state {
    flex: 1;

    background: $gray-500;

    > span {
      display: none;
    }

    &.striped {
      background-image: linear-gradient(
        45deg,
        rgba(255,255,255,.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255,255,255,.15) 50%,
        rgba(255,255,255,.15) 75%,
        transparent 75%,
        transparent
      );

      animation: progress-bar-stripes 1s linear infinite;

      background-size: 1rem 1rem;
    }

    &.success {
      background: $background-green;
    }

    &.failure {
      background: $background-red;
    }
  }

  .state + .state {
    margin-left: 1px;
  }

  @keyframes progress-bar-stripes {
    from { background-position: $progress-height 0; }
    to { background-position: 0 0; }
  }
</style>

{#if check_runs.length}
  <div class="card-status">

    {#each check_runs as check_run}
      <a
        class="state"
        class:success={ check_run.conclusion === 'success' || check_run.status === 'in_progress' }
        class:failure={ check_run.conclusion === 'failure' }
        class:action_required={ check_run.conclusion === 'action_required' }
        class:striped={ check_run.status === 'in_progress' || check_run.status === 'queued' }
        target="_blank"
        rel="noopener noreferrer"
        title={ `${ check_run.name } ${resultMap[check_run.conclusion] || resultMap[check_run.status] }` }
        href={ check_run.html_url }
      ><span>{check_run.name} {resultMap[check_run.conclusion] || resultMap[check_run.status] }</span></a>
    {/each}
  </div>
{/if}