<script>
  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import LinkIcon from './components/LinkIcon.svelte';

  import CollaboratorLinks from './CollaboratorLinks.svelte';

  import {
    isApplyFilterClick,
    isAddFilterClick
  } from './shortcuts';

  export let item;

  export let ref;

  export let onSelect;

  export let hovered = false;

  export let type;

  $: number = item.number;
  $: title = item.title;
  $: repository = item.repository;
  $: pull_request = item.pull_request;
  $: state = item.state;

  $: repositoryName = `${repository.owner.login}/${repository.name}`;

  $: cardUrl = `https://github.com/${ repositoryName }/issues/${ number }${ ref || '' }`;

  $: linkTitle = ({
    CHILD_OF: 'Child of',
    DEPENDS_ON: 'Depends on',
    PARENT_OF: 'Parent of',
    CLOSED_BY: 'Closed by',
    REQUIRED_BY: 'Required by',
    CLOSES: 'Closes',
    LINKED_TO: 'Linked to',
    LINKED_BY: 'Linked by'
  })[type] || type;

  function handleSelection(qualifier, value) {

    return onSelect && function(event) {

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
    margin-top: 2px;
    padding-top: 2px;
  }

  .card-link .short-title {
    flex: 1;
  }

  :global {
    .card-link .epic {
      color: #1d76db;
    }
  }
</style>

<div class="card-link"
  class:hovered={ hovered }
  on:mouseenter={ () => hovered = true }
  on:mouseleave={ () => hovered = false }
>
  <div class="header">
    <a href={ cardUrl }
       target="_blank"
       rel="noopener noreferrer"
       class="issue-number"
       on:click={ handleSelection('ref', item.key) }
       title="{ linkTitle } { repositoryName }#{ number }"
     >
      {#if pull_request }
        <PullRequestIcon item={ item } />
      {:else}
        {#if type === 'PARENT_OF'}
          <LinkIcon name="issue" state={ state } />
        {:else if type === 'CHILD_OF'}
          <LinkIcon name="epic" />
        {:else if type === 'DEPENDS_ON' || type === 'CLOSED_BY' }
          <LinkIcon name="depends-on" state={ state } />
        {:else if type === 'REQUIRED_BY' || type === 'CLOSES' }
          {#if state === 'open'}
            <LinkIcon name="linked-to" state={ state } />
          {:else}
            <LinkIcon name="issue" state={ state } />
          {/if}
        {:else if type === 'LINKED_TO'}
          <LinkIcon name="linked-to" state={ state } />
        {:else}
          <LinkIcon name="issue" state={ state } />
        {/if}
      {/if}

      { number }
    </a>

    <span class="short-title" title={ title }>{ title }</span>

    <span class="collaborator-links">
      <CollaboratorLinks item={ item } onSelect={ onSelect } />
    </span>
  </div>

  <slot></slot>
</div>