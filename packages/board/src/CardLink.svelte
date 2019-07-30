<script>
  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import LinkIcon from './components/LinkIcon.svelte';

  import {
    hasModifier,
    hasShiftModifier
  } from './util';

  export let item;

  export let className = '';

  export let onSelect;

  export let type;

  $: id = item.id;
  $: number = item.number;
  $: title = item.title;
  $: repository = item.repository;
  $: pull_request = item.pull_request;

  $: assignees = item.assignees || [];

  $: requested_reviewers = item.requested_reviewers || [];

  $: repositoryName = `${repository.owner.login}/${repository.name}`;

  $: cardUrl = `https://github.com/${ repositoryName }/issues/${ number }`;

  function handleSelection(qualifier, value) {

    return function(event) {

      if (!hasModifier(event)) {
        return;
      }

      event.preventDefault();

      onSelect(qualifier, value, hasShiftModifier(event));
    };
  }
</script>

<style lang="scss">
  @import "./Card";

  .card-link {
    border-top: solid 1px #F0F0F0;
    margin-top: 1px;
    padding-top: 1px;
  }

  .card-link .short-title {
    flex: 1;
  }

  .card-link .assignee {
    height: 16px;
  }

  :global(.card-link) .epic {
    color: #1d76db;
  }
</style>

<div class="card-link">
  <div class="header">
    {#if pull_request}
      <PullRequestIcon item={ item } />
    {:else}
      {#if type === 'PARENT_OF'}
        <LinkIcon
          name="issue"
          state={ item.state }
          class="child-of"
        />
      {/if}

      {#if type === 'CHILD_OF'}
        <LinkIcon class="epic" name="epic" />
      {/if}

      {#if type === 'DEPENDS_ON' || type === 'CLOSED_BY'}
        <LinkIcon
          class="depends-on"
          name="depends-on"
          state={ item.state }
        />
      {/if}

      {#if type === 'REQUIRED_BY' || type === 'CLOSES' }
        <LinkIcon
          class="issue"
          name="issue"
          state={ item.state }
        />
      {/if}

      {#if type === 'LINKED_TO'}
        <LinkIcon class="linked-to" name="linked-to" />
      {/if}
    {/if}

    <a href={ cardUrl }
       target="_blank"
       rel="noopener noreferrer"
       class="issue-number"
       title="{ repositoryName }#{ number }"
       on:click={ onSelect && handleSelection('ref', item.key) }
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