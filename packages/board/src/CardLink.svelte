<script>
  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import LinkIcon from './components/LinkIcon.svelte';

  import CollaboratorLinks from './CollaboratorLinks.svelte';

  import {
    isApplyFilterClick,
    isAddFilterClick
  } from './shortcuts';

  export let item;

  export let className = '';

  export let onSelect;

  export let type;

  $: id = item.id;
  $: number = item.number;
  $: title = item.title;
  $: repository = item.repository;
  $: pull_request = item.pull_request;
  $: state = item.state;

  $: assignees = item.assignees || [];

  $: requested_reviewers = item.requested_reviewers || [];

  $: repositoryName = `${repository.owner.login}/${repository.name}`;

  $: cardUrl = `https://github.com/${ repositoryName }/issues/${ number }`;

  $: linkTitle = ({
    CHILD_OF: 'Part of',
    DEPENDS_ON: 'Depends on',
    PARENT_OF: 'Depends on',
    CLOSED_BY: 'Closed by',
    REQUIRED_BY: 'Required by',
    CLOSES: 'Closes',
    LINKED_TO: 'Related to',
    LINKED_BY: 'Related to'
  })[type] || type;

  function handleSelection(qualifier, value) {

    return function(event) {

      if (!isApplyFilterClick(event)) {
        return;
      }

      event.preventDefault();

      onSelect(qualifier, value, isAddFilterClick(event));
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

  :global(.card-link) .assignee {
    height: 16px !important;
  }

  :global(.card-link) .epic {
    color: #1d76db;
  }
</style>

<div class="card-link">
  <div class="header">
    <a href={ cardUrl }
       target="_blank"
       rel="noopener noreferrer"
       class="issue-number"
       on:click={ onSelect && handleSelection('ref', item.key) }
       title="{ linkTitle } { repositoryName }#{ number }"
     >
      {#if pull_request}
        <PullRequestIcon item={ item } />
      {:else}
        {#if type === 'PARENT_OF'}
          <LinkIcon name="issue" state={ state } />
        {/if}

        {#if type === 'CHILD_OF'}
          <LinkIcon name="epic" />
        {/if}

        {#if type === 'DEPENDS_ON' || type === 'CLOSED_BY'}
          <LinkIcon name="depends-on" state={ state } />
        {/if}

        {#if type === 'REQUIRED_BY' || type === 'CLOSES' }
          {#if state === 'open'}
            <LinkIcon name="linked-to" />
          {:else}
            <LinkIcon name="issue" state={ state } />
          {/if}
        {/if}

        {#if type === 'LINKED_TO'}
          <LinkIcon name="linked-to" />
        {/if}
      {/if}

      { number }
    </a>

    <span class="short-title" title={ title }>{ title }</span>

    <span class="collaborator-links">
      <CollaboratorLinks item={ item } />
    </span>
  </div>
</div>