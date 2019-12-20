<script>
  import {
    hasModifier
  } from './util';

  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import LinkIcon from './components/LinkIcon.svelte';

  import CollaboratorLinks from './CollaboratorLinks.svelte';
  import CardStatus from './CardStatus.svelte';

  export let item;

  export const className = '';

  export let onSelect;

  export let hovered = false;

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
    CHILD_OF: 'Parent of',
    DEPENDS_ON: 'Required by',
    PARENT_OF: 'Child of',
    CLOSED_BY: 'Closes',
    REQUIRED_BY: 'Depends on',
    CLOSES: 'Closed by',
    LINKED_TO: 'Linked to',
    LINKED_BY: 'Linked to'
  })[type] || type;

  function handleSelection(qualifier, value) {

    return function(event) {

      if (hasModifier(event)) {
        return;
      }

      event.preventDefault();

      onSelect(qualifier, value);
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

  :global(.card-link) .epic {
    color: #1d76db;
  }
</style>

<div class="card-link"
  class:hovered={ hovered }
  on:mouseenter={ () => hovered = true }
  on:mouseleave={ () => hovered = false }
>
  <div class="header">
        {#if pull_request}
        <PullRequestIcon item={ item } onClick={ onSelect && handleSelection('ref', item.key) } />
      {:else}
        {#if type === 'PARENT_OF'}
          <LinkIcon name="issue" state={ state } onClick={ onSelect && handleSelection('ref', item.key) }/>
        {/if}

        {#if type === 'CHILD_OF'}
          <LinkIcon name="epic" onClick={ onSelect && handleSelection('ref', item.key) }/>
        {/if}

        {#if type === 'DEPENDS_ON' || type === 'CLOSED_BY'}
          <LinkIcon name="depends-on" state={ state } onClick={ onSelect && handleSelection('ref', item.key) }/>
        {/if}

        {#if type === 'REQUIRED_BY' || type === 'CLOSES' }
          {#if state === 'open'}
            <LinkIcon name="linked-to" onClick={ onSelect && handleSelection('ref', item.key) }/>
          {:else}
            <LinkIcon name="issue" state={ state } onClick={ onSelect && handleSelection('ref', item.key) }/>
          {/if}
        {/if}

        {#if type === 'LINKED_TO'}
          <LinkIcon name="linked-to" onClick={ onSelect && handleSelection('ref', item.key) }/>
        {/if}
      {/if}

  <a href={ cardUrl }
       target="_blank"
       rel="noopener noreferrer"
       class="issue-number"
       title="{ repositoryName }#{ number } · { linkTitle } this issue"
     >{ number }</a>


    <span class="short-title" title={ title }>{ title }</span>

    <span class="collaborator-links">
      <CollaboratorLinks item={ item } />
    </span>
  </div>

  <CardStatus item={ item } />
</div>