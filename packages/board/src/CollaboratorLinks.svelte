<script>
  export let item;

  $: number = item.number;
  $: repository = item.repository;
  $: repositoryName = `${repository.owner.login}/${repository.name}`;
  $: repoUrl = `https://github.com/${ repositoryName }`;

  $: assignees = item.assignees;

  $: requested_reviewers = item.requested_reviewers || [];

  $: reviews = Object.values(
    (item.reviews || [])
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
    commented: 'commented'
  };
</script>

<style lang="scss">
  @import "variables";

  @mixin review-badge($color) {

    &:before {
      content: '';
      display: block;
      background: $color;
      width: .7em;
      height: .7em;
      border: solid 1px white;
      border-radius: 50%;
      position: absolute;
      top: -2px;
      right: -2px;
    }
  }

  .assignee {
    box-sizing: border-box;
    margin: 0;
    font-size: 14px;
    position: relative;
    display: inline-block;
    text-align: center;
    border-radius: 3px;

    margin-left: 3px;

    height: 18px;

    img {
      height: 100%;
      border-radius: 2px;
      vertical-align: unset;
    }

    .icon-shadow {
      position: absolute;
      display: block;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      box-shadow: inset 0 0 2px 0 rgba(0, 0, 0, .1);
      border-radius: 2px;
    }

    &.requested-reviewer {
      @include review-badge($gray-600);
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
</style>

{#each assignees as assignee}
  <span class="assignee" title="{ assignee.login } assigned">
    <img src="{ assignee.avatar_url }&s=40" alt="{ assignee.login } avatar" />
    <div class="icon-shadow"></div>
  </span>
{/each}

{#each requested_reviewers as reviewer}
  <span class="assignee requested-reviewer" title="{ reviewer.login } requested for review">
    <img src="{ reviewer.avatar_url }&s=40" alt="{ reviewer.login } avatar" />
    <div class="icon-shadow"></div>
  </span>
{/each}

{#each reviews as review}
  <a
    class="assignee reviewer"
    class:approved={ review.state === 'approved' }
    class:requested-changes={ review.state === 'changes_requested' }
    class:commented={ review.state === 'commented' }
    title="{ review.user.login } { stateToVerb[review.state] }"
    href={ `${repoUrl}/pull/${number}#pullrequestreview-${review.id}` }
    target="_blank"
    rel="noopener noreferrer"
  >
    <img src="{ review.user.avatar_url }&s=40" alt="{ review.user.login } avatar" />
    <div class="icon-shadow"></div>
  </a>
{/each}