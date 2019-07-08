<script>
  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import EpicIcon from './components/EpicIcon.svelte';
  import Icons from './components/Icons.svelte';

  export let item;

  export let className = '';

  export let type;

  $: id = item.id;
  $: number = item.number;
  $: title = item.title;
  $: repository = item.repository;
  $: pull_request = item.pull_request;
  $: child = type === 'CHILD_OF';
  $: link = type === 'DEPENDS_ON'||'LINKED_TO'||'REQUIRED_BY';

  $: assignees = item.assignees || [];

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

  .card-link .short-title {
    flex: 1;
  }

  .card-link .assignee {
    height: 16px;
  }
</style>

<div class="card-link">
  <div class="header">
    {#if pull_request}
      <PullRequestIcon item={ item } />
    {:else if child}
      <EpicIcon item={ item } linktype={ type }/>
    {:else if link}
      <Icons state={ item.state } linktype={ type }/>
    {/if}

    <a href={ cardUrl }
       target="_blank"
       rel="noopener noreferrer"
       class="issue-number"
       title="{ repositoryName }#{ number }"
    >{ number }</a>
    <span class="short-title" title={ title }>{ title }</span>

    <span class="collaborator-links">
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
    </span>
  </div>
</div>