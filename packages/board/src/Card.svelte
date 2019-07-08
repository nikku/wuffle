<script>
  import {
    autoresize,
    isClosedByLink,
    isOpenOrMergedPull
  } from './util';

  import Tag from './components/Tag.svelte';
  import PullRequestIcon from './components/PullRequestIcon.svelte';
  import EpicIcon from './components/EpicIcon.svelte';

  import CardLink from './CardLink.svelte';

  const linkOrder = {
    'PARENT_OF': 0,
    'CHILD_OF': 1,
    'REQUIRED_BY': 2,
    'DEPENDS_ON': 3,
    'LINKED_TO': 4
  };
  function isPR(issue) {
    return issue.pull_request;
  }

  export let item;

  export let className = '';

  export let shown = true;

  $: id = item.id;
  $: number = item.number;
  $: title = item.title;
  $: repository = item.repository;
  $: milestone = item.milestone;
  $: labels = item.labels.filter(l => !l.column_label);
  $: pull_request = item.pull_request;

  $: links = item.links || [];

  $: embeddedLinks = links.filter(
    (link) => !isPR(link.target)
  ).sort(
    (a, b) => {
      return linkOrder[a.type] - linkOrder[b.type];
    }
  );

  $: epic = embeddedLinks.find(l => l.type=== 'PARENT_OF');

  $: prLinks = links.filter(link => isPR(link.target) && isOpenOrMergedPull(link.target));

  $: assignees = item.assignees;

  $: requested_reviewers = item.requested_reviewers || [];

  $: repositoryName = `${repository.owner.login}/${repository.name}`;

  $: cardUrl = `https://github.com/${ repositoryName }/issues/${ number }`;

  let otherProps;

  $: {
    let {
      item,
      ...rest
    } = $$props;

    delete rest['class'];

    otherProps = rest;
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
    }
  }
</style>

{#if shown}

<div class="board-card-container { className }" { ...otherProps }>
  <div class="board-card">
    <div class="header">
    {#if epic }
        <EpicIcon item={ item } linktype="PARENT_OF" />
    {/if}
      {#if pull_request}
        <PullRequestIcon item={ item } />
      {/if}

      <a href={ cardUrl }
         target="_blank"
         rel="noopener noreferrer"
         class="issue-number"
         title="{ repositoryName }#{ number }"
      >{ number }</a>

      <span class="repository" title={ repositoryName }>{ repositoryName }</span>

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
    <div class="title">
      <textarea use:autoresize>{ title }</textarea>
    </div>
    <div class="footer">
      {#if milestone}
        <Tag class="tag milestone" name={ milestone.title } />
      {/if}

      {#each labels as { name, color }}
        <Tag class="tag label" color="#{ color }" name={ name } />
      {/each}

      <div class="links">
        <a href={ cardUrl } title="View on GitHub" target="_blank" rel="noopener noreferrer">
          <i aria-label="icon: github" class="anticon anticon-github">
            <svg viewBox="64 64 896 896" class="" data-icon="github" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9a127.5 127.5 0 0 1 38.1 91v112.5c.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z"></path>
            </svg>
          </i>
        </a>
      </div>
    </div>
    {#if embeddedLinks.length}
      <div class="board-card-links embedded">
        {#each embeddedLinks as link}
          <CardLink item={link.target} type={ link.type } />
        {/each}
      </div>
    {/if}
  </div>



  {#if prLinks.length}
    <div class="board-card-links attached">
      {#each prLinks as link}
        <CardLink item={ link.target } type={ link.type } />
      {/each}
    </div>
  {/if}

</div>

{/if}
