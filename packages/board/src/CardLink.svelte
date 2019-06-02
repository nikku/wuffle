<script>
  import PullRequestIcon from './components/PullRequestIcon.svelte';

  export let item;

  export let className = '';

  export let type;

  $: id = item.id;
  $: number = item.number;
  $: title = item.title;
  $: repository = item.repository;
  $: pull_request = item.pull_request;

  $: assignees = item.assignees;

  $: requested_reviewers = item.requested_reviewers || [];

  $: repositoryName = `${repository.owner.login}/${repository.name}`;

  $: cardUrl = `https://github.com/${ repositoryName }/issues/${ number }`;
</script>

<style lang="scss">
  @import "./Card";

  .card-link {
    border-top: solid 1px #F0F0F0;
    margin-top: 1px;
    padding-top: 1px;

    .link-type {
      margin-right: 6px;
      color: #999;
    }

    .link-depends-on {
      color: red;
    }

    .link-required-by {
      color: orange;
    }

    .link-related-to {
      color: #999;
    }

    .link-part-of {
      color: lightblue;
    }
  }

  .card-impl {
    background: #F9F9F9;
    border-radius: 0 0 4px 4px;
    margin-top: -6px;
    box-shadow: inset 0 3px 5px -2px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1);
    position: relative;
    padding: 8px 8px 4px 8px;
  }

  .card-link .assignee {
    width: 1.1em;
    height: 1.1em;
    line-height: 1.1em;
  }
</style>

<div class="card-link" class:card-impl={ type === 'CLOSES' }>
  <div class="header">
    {#if pull_request}
      <PullRequestIcon item={ item } />
    {/if}

    <a href={ cardUrl }
       target="_blank"
       rel="noopener noreferrer"
       class="issue-number"
    >{ number }</a>
    <span class="repository" title={ repositoryName }>{ repositoryName }</span>
    <span class="spacer"></span>

    {#each assignees as assignee}
      <span class="assignee" title="{ assignee.login } assigned">
        <img src="{ assignee.avatar_url }&s=40" alt="{ assignee.login } avatar" />
      </span>
    {/each}

    {#each requested_reviewers as reviewer}
      <span class="assignee reviewer" title="{ reviewer.login } requested for review">
        <img src="{ reviewer.avatar_url }&s=40" alt="{ reviewer.login } avatar" />
      </span>
    {/each}
  </div>
</div>