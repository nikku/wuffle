<script>
  import {
    isPull,
    isOpenOrMerged,
    noDuplicates
  } from './util';

  import {
    isApplyFilterClick,
    isAddFilterClick
  } from './shortcuts';

  import Tag from './components/Tag.svelte';
  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import EpicIcon from './components/EpicIcon.svelte';
  import LinkIcon from './components/LinkIcon.svelte';

  import CardStatus from './CardStatus.svelte';
  import CollaboratorLinks from './CollaboratorLinks.svelte';

  import CardLink from './CardLink.svelte';

  const linkOrder = {
    'DEPENDS_ON': 1,
    'CLOSED_BY': 2,
    'PARENT_OF': 3,
    'REQUIRED_BY': 4,
    'LINKED_TO': 5,
    'CHILD_OF': 6
  };

  export let item;

  export let className = '';

  export let onSelect;

  function isClosingPull(link) {
    const {
      type,
      target
    } = link;

    return isPull(target) && (type === 'CLOSED_BY' || type === 'DEPENDS_ON');
  }

  let showChildren = false;

  let hovered = false;

  $: number = item.number;
  $: title = item.title;
  $: repository = item.repository;
  $: milestone = item.milestone;
  $: labels = item.labels.filter(l => !l.column_label);
  $: pull_request = item.pull_request;
  $: state_reason = item.state_reason;

  $: links = (item.links || []).sort(
    (a, b) => {
      return linkOrder[a.type] - linkOrder[b.type];
    }
  );

  $: embeddedLinks = links.filter(
    (link) => !isClosingPull(link) && link.type !== 'LINKED_BY'
  );

  $: shownLinks = embeddedLinks.filter(link => showChildren || link.type !== 'PARENT_OF');

  $: children = embeddedLinks.filter(l => l.type === 'PARENT_OF');
  $: completedChildren = children.filter(l => l.target.state === 'closed');

  $: prLinks = links.filter(
    link => isClosingPull(link) && isOpenOrMerged(link.target)
  ).filter(
    noDuplicates(link => link.target.id + link.ref)
  );

  $: repositoryName = `${repository.owner.login}/${repository.name}`;

  $: repoUrl = `https://github.com/${ repositoryName }`;
  $: milestoneUrl = milestone && (milestone.html_url || `${repoUrl}/milestone/${milestone.number}`);
  $: cardUrl = item.html_url || `${repoUrl}/issues/${number}`;

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
  @import "variables";

  @import "./Card";

  :global {
    .tag {
      &.label,
      &.milestone {
        margin-right: 4px;
        margin-bottom: 4px;
      }

      &.milestone {
        color: $gray-800 !important;
        border: solid 1px $gray-600;
      }
    }

    .card-link:first-child {
      border-top: none !important;
      margin-top: 1px !important;
    }
  }

  .board-card-links.attached {
    background: #F9F9F9;
    border-radius: 0 0 4px 4px;
    box-shadow: inset 0 3px 5px -2px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1);
    margin-top: -6px;
    position: relative;
    padding: 7px 8px 4px 8px;
  }

  .progress {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 7px;

    cursor: pointer;

    svg {
      color: $gray-600;
    }

    .bar {
      border-radius: 3px;
      height: 5px;
      width: 80px;
      background: $gray-200;
      margin: auto 6px;

      .indicator {
        border-radius: 3px;
        background: $gray-600;
        height: 100%;
      }
    }

    .text {
      margin-left: 6px;
      font-size: 0.9rem;
      color: $gray-600;
    }
  }

</style>

<div class="board-card-container { className }">
  <div class="board-card"
    class:hovered={ hovered }
    on:mouseenter={ () => hovered = true }
    on:mouseleave={ () => hovered = false }
  >
    <div class="header">
      <a href={ cardUrl }
         target="_blank"
         rel="noopener noreferrer"
         class="issue-number"
         title="{ repositoryName }#{ number }"
         on:click={ handleSelection('ref', item.key) }
      >

        {#if children.length}
          <EpicIcon />
        {:else if pull_request}
          <PullRequestIcon item={ item } />
        {:else if state_reason === 'not_planned'}
          <LinkIcon name="issue" state="closed" state_reason={ state_reason } />
        {/if}

        { number }
      </a>

      <span class="repository" title={ repositoryName }>{ repositoryName }</span>

      <span class="collaborator-links">
        <CollaboratorLinks item={ item } onSelect={ onSelect } />
      </span>
    </div>
    <div class="title">
      { title }
    </div>
    {#if children.length}
      <div
        class="progress"
        on:click={ () => showChildren = !showChildren }
        title="{ completedChildren.length } of { children.length } child tasks completed"
      >
        <svg class="icon" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
          <path fill-rule="evenodd" d="M2.5 1.75a.25.25 0 01.25-.25h8.5a.25.25 0 01.25.25v7.736a.75.75 0 101.5 0V1.75A1.75 1.75 0 0011.25 0h-8.5A1.75 1.75 0 001 1.75v11.5c0 .966.784 1.75 1.75 1.75h3.17a.75.75 0 000-1.5H2.75a.25.25 0 01-.25-.25V1.75zM4.75 4a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM4 7.75A.75.75 0 014.75 7h2a.75.75 0 010 1.5h-2A.75.75 0 014 7.75zm11.774 3.537a.75.75 0 00-1.048-1.074L10.7 14.145 9.281 12.72a.75.75 0 00-1.062 1.058l1.943 1.95a.75.75 0 001.055.008l4.557-4.45z"></path>
        </svg>
        <div class="text">
          { completedChildren.length } of { children.length }
        </div>
        <div class="bar">
          <div class="indicator" style="width: { completedChildren.length / children.length * 100 }%"></div>
        </div>
      </div>
    {/if}
    <div class="footer">
      {#if milestone}
        <Tag
          class="tag milestone"
          name={ milestone.title }
          href={ milestoneUrl }
          title={ milestone.title }
          onClick={ handleSelection('milestone', milestone.title) }
        />
      {/if}

      {#each labels as { name, color }}
        <Tag
          class="tag label"
          color="#{ color }"
          name={ name }
          title={ name }
          onClick={ handleSelection('label', name) }
        />
      {/each}

      <div class="links">
        <a href={ cardUrl } title="View on GitHub" target="_blank" rel="noopener noreferrer">
          <svg width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
        </a>
      </div>
    </div>

    {#if shownLinks.length}
      <div class="board-card-links embedded">
        {#each shownLinks as link}
          <CardLink item={ link.target } type={ link.type } ref={ link.ref } onSelect={ onSelect } />
        {/each}
      </div>
    {/if}

    <CardStatus item={ item } />
  </div>

  {#if prLinks.length}
    <div class="board-card-links attached">
      {#each prLinks as link}
        <CardLink item={ link.target } type={ link.type } ref={ link.ref } onSelect={ onSelect }>
          <CardStatus item={ link.target } />
        </CardLink>
      {/each}
    </div>
  {/if}

</div>
