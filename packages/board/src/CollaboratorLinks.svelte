<script>

  import {
    isAddFilterClick,
    isApplyFilterClick
  } from './shortcuts';

  export let item;
  export let onSelect;

  $: assignees = item.assignees;

  $: comments = (
    Array.isArray(item.comments) ? item.comments : []
  ).map(comment => {
    const {
      user,
      html_url
    } = comment;

    return {
      state: 'commented',
      user,
      html_url
    };
  });

  $: requested_reviewers = item.requested_reviewers || [];

  $: reviews = Object.values(
    [].concat(comments, item.reviews || [])
      .filter(review => !requested_reviewers.find(reviewer => reviewer.login === review.user.login))
      .reduce((byUser, review) => {

        const existingReview = byUser[review.user.login];

        // keep last definitive review (approved, changes_requested)
        // to match GitHub display and behavior
        if (
          !existingReview ||
          existingReview.state === 'commented' ||
          review.state !== 'commented'
        ) {
          byUser[review.user.login] = review;
        }

        return byUser;
      }, {})
  );

  const stateToVerb = {
    changes_requested: 'requested changes',
    approved: 'approved',
    commented: 'commented',
    dismissed: 'dismissed his review'
  };

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

  $separatorColor: white;

  @mixin review-badge($color) {

    &:before {
      content: '';
      display: block;
      background: $color;
      box-shadow: 0 0 0 2px $separatorColor;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      position: absolute;
      top: -2px;
      left: -2px;
      z-index: 1;
    }
  }

  .assignee {
    box-sizing: border-box;
    margin: 0;
    font-size: 14px;
    position: relative;
    display: inline-block;
    text-align: center;
    border-radius: 2px;

    margin-left: 3px;
    transition: margin .1s;

    height: 18px;

    img {
      height: 100%;
      border-radius: 2px;
      vertical-align: unset;
    }

    .icon-shadow {
      position: absolute;
      display: none;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      box-shadow: inset 0 0 2px 0 rgba(20, 20, 20, 0.3);
      border-radius: 2px;
    }

    &.requested-reviewer {
      @include review-badge(#bf8700);
    }

    &.commented {
      @include review-badge($info);
    }

    &.approved {
      @include review-badge($success);
    }

    &.requested-changes {
      @include review-badge($danger);
    }

  }

  .assignee + .assignee {
    margin-left: -6px;
    box-shadow: 0 0 0 1px $separatorColor;
  }

  :global(.hovered) > .header {
    .assignee + .assignee {
      margin-left: 3px !important;
      box-shadow: none;
    }
  }
</style>

{#each requested_reviewers as reviewer}
  <span
    class="assignee requested-reviewer"
    title="{ reviewer.login } requested for review"
    on:click={ handleSelection('involves', reviewer.login) }>
    <img src="{ reviewer.avatar_url }&s=40" alt="{ reviewer.login } avatar" />
    <div class="icon-shadow"></div>
  </span>
{/each}

{#each reviews as review}
  <a
    class="assignee reviewer"
    class:approved={ review.state === 'approved' }
    class:requested-changes={ review.state === 'changes_requested' }
    class:commented={ review.state === 'commented' || review.state === 'dismissed' }
    title="{ review.user.login } { stateToVerb[review.state] }"
    href={ review.html_url }
    on:click={ handleSelection('involves', review.user.login) }
    target="_blank"
    rel="noopener noreferrer"
  >
    <img src="{ review.user.avatar_url }&s=40" alt="{ review.user.login } avatar" />
    <div class="icon-shadow"></div>
  </a>
{/each}

{#each assignees as assignee}
  <a
    class="assignee"
    title="{ assignee.login } assigned"
    on:click={ handleSelection('involves', assignee.login) }
    href={ assignee.html_url }
    target="_blank"
    rel="noopener noreferrer"
  >
    <img src="{ assignee.avatar_url }&s=40" alt="{ assignee.login } avatar" />
    <div class="icon-shadow"></div>
  </a>
{/each}