<script>
  import {
    isOpenOrMerged,
    isPull,
    noDuplicates
  } from './util';

  import {
    hasModifier
  } from './shortcuts';

  import Tag from './components/Tag.svelte';
  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import EpicIcon from './components/EpicIcon.svelte';

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

  export const className = '';

  export let onSelect;

  export let hideComplete;

  let showChildren = false;

  let hovered = false;

  $: id = item.id;
  $: number = item.number;
  $: title = item.title;
  $: repository = item.repository;
  $: milestone = item.milestone;
  $: labels = item.labels.filter(l => !l.column_label);
  $: pull_request = item.pull_request;
  $: complete = hideComplete;

  $: links = item.links || [];

  $: embeddedLinks = links.filter(
    (link) => !isPull(link.target) && link.type !== 'LINKED_BY'
  ).sort(
    (a, b) => {
      return linkOrder[a.type] - linkOrder[b.type];
    }
  );

  $: shownLinks = embeddedLinks.filter(link => showChildren || link.type !== 'PARENT_OF');

  $: children = embeddedLinks.filter(l => l.type === 'PARENT_OF');
  $: completedChildren = children.filter(l => l.target.state === 'closed');

  $: prLinks = links.filter(
    link => isPull(link.target) && isOpenOrMerged(link.target)
  ).filter(noDuplicates(link => link.target.id));

  $: repositoryName = `${repository.owner.login}/${repository.name}`;

  $: repoUrl = `https://github.com/${ repositoryName }`;

  $: milestoneUrl = milestone && `${repoUrl}/milestone/${milestone.number}`;
  $: cardUrl = `${repoUrl}/issues/${ number }`;

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
  @import "variables";

  @import "./Card";

  :global(.tag).label,
  :global(.tag).tag.milestone {
    margin-right: 4px;
    margin-bottom: 4px;
  }

  :global(.tag).milestone {
    color: $gray-800 !important;
    border: solid 1px $gray-600;
  }

  .board-card-links.attached {
    background: #F9F9F9;
    border-radius: 0 0 4px 4px;
    box-shadow: inset 0 3px 5px -2px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1);
    margin-top: -6px;
    position: relative;
    padding: 7px 8px 4px 8px;

    :global(.card-link):first-child {
      border-top: none;
      margin-top: 1px;
    }
  }

  .progress {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 7px;

    cursor: pointer;

    &:hover {
      svg {
        color: $gray-600;
      }
    }

    svg {
      color: #CCC;
      transition: color .3s;
    }

    .bar {
      border-radius: 3px;
      height: 5px;
      width: 80px;
      background: #EEE;
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
         {#if children.length}
          <EpicIcon item={ item } linkType="PARENT_OF" onClick={ onSelect && handleSelection('ref', item.key) }/>
        {/if}

        {#if pull_request}
          <PullRequestIcon item={ item } onClick={ onSelect && handleSelection('ref', item.key) }/>
        {/if}
     <a href={ cardUrl }

         target="_blank"
         rel="noopener noreferrer"
         class="issue-number"
         title="{ repositoryName }#{ number }"
      >{ number }</a>

      <span class="repository" title={ repositoryName }>{ repositoryName }</span>

      <span class="collaborator-links">
        <CollaboratorLinks item={ item } />
      </span>
    </div>
    <div class="title">
      { title }
    </div>
    {#if children.length}
      <div
        class="progress"
        on:click={ () => showChildren = !showChildren }
        title="Click toggle child tasks ({ completedChildren.length } of { children.length } completed)">
        <svg class="icon issue closed" width="1em" height="1em" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
          <path fill-rule="evenodd" d="M7 10h2v2H7v-2zm2-6H7v5h2V4zm1.5 1.5l-1 1L12 9l4-4.5-1-1L12 7l-1.5-1.5zM8 13.7A5.71 5.71 0 0 1 2.3 8c0-3.14 2.56-5.7 5.7-5.7 1.83 0 3.45.88 4.5 2.2l.92-.92A6.947 6.947 0 0 0 8 1C4.14 1 1 4.14 1 8s3.14 7 7 7 7-3.14 7-7l-1.52 1.52c-.66 2.41-2.86 4.19-5.48 4.19v-.01z"></path>
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
          onClick={ onSelect && handleSelection('milestone', milestone.title, !!milestoneUrl) }
        />
      {/if}

      {#each labels as { name, color }}
        <Tag
          class="tag label"
          color="#{ color }"
          name={ name }
          onClick={ onSelect && handleSelection('label', name) }
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
          <CardLink item={link.target} type={ link.type } onSelect={ onSelect } />
        {/each}
      </div>
    {/if}

    <CardStatus item={ item } />
  </div>

  {#if prLinks.length}
    <div class="board-card-links attached">
      {#each prLinks as link}
        {#if hideComplete }
            {#if link.target.state==='open' }
                <CardLink item={ link.target } type={ link.type } onSelect={ onSelect }/>
            {/if}
        {:else}
            <CardLink item={ link.target } type={ link.type } onSelect={ onSelect }/>
        {/if}
      {/each}
    </div>
  {/if}

</div>
