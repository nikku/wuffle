<script>
  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import LinkIcon from './components/LinkIcon.svelte';

  import CollaboratorLinks from './CollaboratorLinks.svelte';

  import {
    isApplyFilterClick,
    isAddFilterClick
  } from './shortcuts';

  let {
    children,
    item,
    ref,
    onSelect,
    hovered = false,
    type
  } = $props();

  const number = $derived(item.number);
  const title = $derived(item.title);
  const repository = $derived(item.repository);
  const pull_request = $derived(item.pull_request);
  const state = $derived(item.state);
  const state_reason = $derived(item.state_reason);

  const repositoryName = $derived(`${repository.owner.login}/${repository.name}`);

  const cardUrl = $derived(`https://github.com/${ repositoryName }/issues/${ number }${ ref || '' }`);

  const linkTitle = $derived(({
    CHILD_OF: 'Child of',
    DEPENDS_ON: 'Depends on',
    PARENT_OF: 'Parent of',
    CLOSED_BY: 'Closed by',
    REQUIRED_BY: 'Required by',
    CLOSES: 'Closes',
    LINKED_TO: 'Linked to',
    LINKED_BY: 'Linked by'
  })[type] || type);

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

<div class="card-link"
  class:hovered={ hovered }
  onmouseenter={ () => hovered = true }
  onmouseleave={ () => hovered = false }
  role="paragraph"
>
  <div class="header">
    <a href={ cardUrl }
       target="_blank"
       rel="noopener noreferrer"
       class="issue-number"
       onclick={ handleSelection('ref', item.key) }
       title="{ linkTitle } { repositoryName }#{ number }"
     >
      {#if pull_request }
        <PullRequestIcon item={ item } />
      {:else}
        {#if type === 'PARENT_OF'}
          <LinkIcon name="issue" state={ state } state_reason={ state_reason } />
        {:else if type === 'CHILD_OF'}
          <LinkIcon name="epic" state_reason={ state_reason } />
        {:else if type === 'DEPENDS_ON' || type === 'CLOSED_BY' }
          <LinkIcon name="depends-on" state={ state } state_reason={ state_reason } />
        {:else if type === 'REQUIRED_BY' || type === 'CLOSES' }
          {#if state === 'open'}
            <LinkIcon name="linked-to" state={ state } state_reason={ state_reason } />
          {:else}
            <LinkIcon name="issue" state={ state } state_reason={ state_reason } />
          {/if}
        {:else if type === 'LINKED_TO'}
          <LinkIcon name="linked-to" state={ state } state_reason={ state_reason } />
        {:else}
          <LinkIcon name="issue" state={ state } state_reason={ state_reason } />
        {/if}
      {/if}

      { number }
    </a>

    <span class="short-title" title={ title }>{ title }</span>

    <span class="collaborator-links">
      <CollaboratorLinks item={ item } onSelect={ onSelect } />
    </span>
  </div>

  {@render children?.()}
</div>

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