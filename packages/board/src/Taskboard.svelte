<script>
  import { onMount } from 'svelte';

  import Dragula from '@bpmn-io/draggle';


  import BoardFilter from './BoardFilter.svelte';

  import Avatar from './components/Avatar.svelte';
  import Loader from './components/Loader.svelte';

  import PoweredBy from './PoweredBy.svelte';

  import Notifications from './components/Notifications.svelte';
  import Notification from './components/Notification.svelte';

  import Card from './Card.svelte';

  import CreateIssue from './CreateIssue.svelte';

  import Api from './Api';

  import {
    isNewIssueShortcut,
    isLoginShortcut
  } from './shortcuts';

  import {
    Id,
    createLocalStore,
    createHistory,
    isClosingLink,
    isOpenOrMerged,
    isPull,
    periodic,
    throttle
  } from './util';

  import loaderImage from './logo-gray.svg';
  import errorImage from './error.svg';

  const DEFAULT_PER_COLUMN_RENDER_COUNT = 15;

  const POLL_KEY = 'Taskboard_polling';

  const api = new Api();
  const localStore = createLocalStore();
  const history = createHistory();

  const navId = Id();

  let name = $state('');
  let columns = $state([]);
  let items = $state({});

  let itemsById = $state({});

  let loading = $state(true);
  let updating = $state(0);
  let error = $state(null);
  let warnings = $state([]);

  let user = $state(null);
  let cursor = $state(null);

  let accessNotification = $state(false);

  let showCreate = $state(false);

  let renderCountByColumn = $state({});

  let filterOptions = $state({});

  const defaultCollapsed = $derived(
    columns.reduce((defaultCollapsed, column) => {
      defaultCollapsed[column.name] = column.collapsed;

      return defaultCollapsed;
    }, {})
  );

  let filter = $state(parseSearchFilter());

  let localCollapsed = $state(parseCollapsedColumns());

  const collapsed = $derived(
    {
      ...defaultCollapsed,
      ...localCollapsed
    }
  );

  $effect(() => updateBoardLocation(filter, localCollapsed));

  // shown items
  const shownItems = $derived(
    Object.keys(items).reduce((shownItems, column) => {

      const columnItems = items[column];

      shownItems[column] = columnItems.filter(item => !isClosingPull(item));

      return shownItems;
    }, {})
  );

  // actually rendered items
  const renderedItems = $derived(
    Object.keys(shownItems).reduce((renderedItems, column) => {

      const renderCount = renderCountByColumn[column] || DEFAULT_PER_COLUMN_RENDER_COUNT;
      const items = shownItems[column];

      renderedItems[column] = items.slice(0, renderCount);

      return renderedItems;
    }, {})
  );

  function action(name, options = {}) {

    return fn => {

      return fn()
        .then(result => {
          discardWarning(name);

          return result;
        })
        .catch(err => {
          return handleWarning(name, err, options);
        });
    };
  }

  function handleWarning(action, error, options) {
    console.error(`[action] [${action}] failed`, error);

    if (options.verbose === false) {
      return;
    }

    const index = warnings.findIndex(w => w.action === action);

    const warning = {
      action,
      error
    };

    if (index !== -1) {
      warnings = [
        ...warnings.slice(0, index),
        warning,
        ...warnings.slice(index + 1)
      ];
    } else {
      warnings = [
        ...warnings,
        warning
      ];
    }
  }

  function discardWarnings() {
    warnings = [];
  }

  function discardWarning(action) {
    warnings = warnings.filter(w => w.action !== action);
  }

  function handleError(_error) {
    console.error(_error);

    error = _error;
  }

  function discardError() {
    error = null;
  }

  function loadBoard() {
    discardError();
    discardWarnings();

    loading = true;

    return Promise.all([
      fetchBoard(),
      loginCheck(),
      fetchCards(filter)
    ]).then(_ => {
      discardError();
    }).catch(error => {
      handleError(error);
    }).finally(() => {
      loading = false;
    });
  }

  function setupHooks() {

    const poll = localStore.get(POLL_KEY, true);

    const teardownHooks = [

      // poll for issue updates every three seconds
      poll && periodic(pollUpdates, 1000 * 3),

      // check login every 1 minutes
      poll && periodic(loginCheck, 1000 * 60 * 1),

      // hook into history changes
      history.onPop(() => {
        const newFilter = parseSearchFilter();

        localCollapsed = parseCollapsedColumns();

        filterChanged(newFilter);
      })
    ];

    return () => teardownHooks.forEach(fn => fn && fn());
  }

  onMount(() => {
    loadBoard();
    setupHooks();
  });

  function applyFilter(qualifier, value, add) {

    if (!value.startsWith('"')) {
      value = '"' + value + '"';
    }

    const criteria = value && `${qualifier}:${value}`;

    if (!criteria) {
      return;
    }

    let newFilter;

    const criteriaIndex = filter.indexOf(criteria);

    if (criteriaIndex === 0) {
      newFilter = filter.substring(criteria.length + 1);
    } else if (criteriaIndex > 0) {
      newFilter = filter.substring(0, criteriaIndex - 1) + filter.substring(criteriaIndex + criteria.length);
    } else {
      if (add && filter.trim()) {
        newFilter = `${filter} ${qualifier}:${value}`;
      } else {
        newFilter = criteria;
      }
    }

    return filterChanged(newFilter);
  }

  function filterChanged(value) {

    if (value === filter) {
      return;
    }

    if (value.trim() !== filter.trim()) {

      action('Fetching cards')(
        () => fetchCards(value)
      );
    }

    filter = value;
  }

  function parseSearchFilter() {
    if (typeof window === 'undefined') {
      return '';
    }

    const url = new URL(window.location.href);

    return url.searchParams.get('s') || '';
  }

  function parseCollapsedColumns() {
    if (typeof window === 'undefined') {
      return '';
    }

    const url = new URL(window.location.href);

    const collapsed = url.searchParams.get('c');

    if (!collapsed) {
      return {};
    }

    return collapsed.split(',').filter(c => c).reduce((collapsed, column) => {

      const split = column.split('!');

      collapsed[split[1] || split[0]] = split.length === 1;

      return collapsed;
    }, {});
  }

  function updateBoardLocation(filter, collapsed) {
    const ref = buildBoardLink(filter, collapsed);

    if (ref !== window.location.href) {
      history.push(ref);
    }
  }

  function buildBoardLink(filter, collapsed) {

    const url = new URL(window.location.href);

    const searchParams = url.searchParams;

    const searchParam = filter;
    const collapsedParam = Object.entries(collapsed).filter(([ key, value ]) => {
      return defaultCollapsed[key] !== value;
    }).map(
      ([ key, value ]) => (value ? '' : '!') + key
    ).join(',');

    if (searchParam) {
      searchParams.set('s', searchParam);
    } else {
      searchParams.delete('s');
    }

    if (collapsedParam) {
      searchParams.set('c', collapsedParam);
    } else {
      searchParams.delete('c');
    }

    return url.toString();
  }

  function loginCheck() {
    return action('Login check')(
      () => api.getLoggedInUser().then(newUser => {

        if (user && !newUser) {
          window.location.reload();
        } else {
          user = newUser;
        }
      })
    );
  }

  function fetchBoard() {
    const boardEl = document.querySelector('script[type="application/json+config"]');

    if (boardEl) {
      const text = boardEl.textContent;

      if (text) {
        const result = JSON.parse(text);

        columns = result.columns;
        name = result.name;
      }
    }

    return api.getBoard().then(result => {
      columns = result.columns;
      name = result.name;
    });
  }

  function updateCards(_items, _cursor) {
    console.time('Taskboard#updateCards');

    const _itemsById = {};
    const _filterOptions = {};

    for (const columnItems of Object.values(_items)) {

      for (const item of columnItems) {
        const {
          id,
          user,
          milestone,
          assignees,
          labels,
          repository,
          requested_reviewers
        } = item;

        const repoOptions = _filterOptions['repo'] = _filterOptions['repo'] || {};

        repoOptions[repository.owner.login + '/' + repository.name] = true;

        if (milestone) {
          const milestoneOptions = _filterOptions['milestone'] = _filterOptions['milestone'] || {};

          milestoneOptions[milestone.title] = true;
        }

        if (user) {
          const authorOptions = _filterOptions['author'] = _filterOptions['author'] || {};

          authorOptions[user.login] = true;
        }

        assignees.forEach(assignee => {
          const assigneeOptions = _filterOptions['assignee'] = _filterOptions['assignee'] || {};

          assigneeOptions[assignee.login] = true;
        });

        if (requested_reviewers) {
          requested_reviewers.forEach(reviewer => {
            const reviewerOptions = _filterOptions['reviewer'] = _filterOptions['reviewer'] || {};

            reviewerOptions[reviewer.login] = true;
          });
        }

        labels.forEach(label => {

          if (!label.column_label) {
            const labelOptions = _filterOptions['label'] = _filterOptions['label'] || {};

            labelOptions[label.name] = true;
          }
        });

        _itemsById[id] = item;
      }

    }

    items = _items;
    itemsById = _itemsById;
    filterOptions = Object.entries(_filterOptions).reduce((opts, entry) => {

      const [ key, value ] = entry;

      opts[key] = Object.keys(value);

      return opts;
    }, {});

    cursor = _cursor;
    console.timeEnd('Taskboard#updateCards');
  }

  function fetchCards(newFilter) {

    updating++;

    return api.listCards(newFilter).then(result => {

      // do not apply updates for outdated filters
      if (newFilter !== filter) {
        return;
      }

      const {
        items,
        cursor
      } = result;

      updateCards(items, cursor);
    }).finally(() => updating--);
  }


  function pollUpdates() {

    if (updating) {
      return;
    }

    const currentFilter = filter;

    return action('Update check')(
      () => api.listUpdates(currentFilter, cursor).then(updates => {

        if (!updates.length) {
          return;
        }

        if (currentFilter !== filter) {
          return;
        }

        const {
          items: _items,
          itemsById: _itemsById,
          cursor: _cursor
        } = applyUpdates(updates, items, itemsById);

        items = _items;
        itemsById = _itemsById;
        cursor = _cursor;
      })
    );
  }

  function applyUpdates(updates, items, itemsById) {

    const cursor = updates[updates.length - 1].id;

    updates.forEach(update => {
      const {
        type,
        issue
      } = update;

      const {
        id
      } = issue;

      const from = itemsById[id];

      const to = type !== 'remove' && issue;

      items = {
        ...items,
        ...moveItem(items, issue, from, to)
      };

      // remove from index
      if (type === 'remove') {
        const {
          [id]: removedItem,
          ...remainingItems
        } = itemsById;

        itemsById = remainingItems;
      } else {

        // update in index
        itemsById = {
          ...itemsById,
          [id]: issue
        };
      }
    });

    return {
      cursor,
      itemsById,
      items
    };
  }

  const drake = Dragula({
    isContainer: (el) => {
      return el.matches('[data-column-id]');
    }
  });

  function getCardId(el) {
    const dataset = el.dataset;
    return dataset.cardId;
  }

  function getCardOrder(el) {
    const dataset = el.dataset;
    return parseFloat(dataset.cardOrder);
  }

  function getColumnId(el) {
    const dataset = el.dataset;
    return dataset.columnId;
  }

  function checkCancel(event) {
    if (event.key === 'Escape') {
      drake.cancel(true);
    }
  }

  drake.on('drag', () => {
    document.addEventListener('keydown', checkCancel);
  });

  drake.on('dragend', () => {
    document.removeEventListener('keydown', checkCancel);
  });

  drake.on('drop', (el, target, source, nextEl) => {
    const cardId = getCardId(el);
    const cardOrder = getCardOrder(el);

    const previousEl = el.previousElementSibling;

    const nextOrder = nextEl && getCardOrder(nextEl);
    const previousOrder = previousEl && getCardOrder(previousEl);

    const newOrder =
      previousOrder && nextOrder
        ? (previousOrder + nextOrder) / 2
        : previousOrder
          ? previousOrder + 731241.218
          : nextOrder
            ? nextOrder - 811231.691
            : -71271.88455;

    drake.cancel(true);

    handleCardDrop(
      itemsById[cardId],
      {
        order: cardOrder,
        column: getColumnId(source)
      },
      {
        order: newOrder,
        column: getColumnId(target)
      }
    );

  });

  function handleCardDrop(card, from, to) {

    const { before, after } = moveCard(card, from, to);

    return api.moveIssue(
      card.id,
      to.column,
      before && before.id,
      after && after.id
    ).catch(err => {
      console.warn('reverting card movement', err);

      accessNotification = user ? 'forbidden' : 'authentication-required';

      setTimeout(() => {
        accessNotification = false;
      }, 8000);

      moveCard(card, to, from);
    });
  }

  function removeItem(item, list = []) {
    const { id } = item;

    return list.filter(existing => existing.id !== id);
  }

  function insertItem(item, order, list = []) {
    const insertIdx = list.findIndex(existing => existing.order > order);

    if (insertIdx === -1) {
      return [ ...list, item ];
    }

    return [
      ...list.slice(0, insertIdx),
      item,
      ...list.slice(insertIdx)
    ];

  }

  function moveCard(card, from, to) {

    // temporarily update card with new column and ordering
    card.column = to.column;
    card.order = to.order;

    const updatedItems = moveItem(items, card, from, to);

    items = {
      ...items,
      ...updatedItems
    };

    const targetColumn = updatedItems[to.column];

    const cardIndex = targetColumn.findIndex(el => el.id === card.id);

    return {
      after: targetColumn[cardIndex - 1],
      before: targetColumn[cardIndex + 1]
    };
  }

  function moveItem(items, item, from, to) {

    const oldColumn = from && from.column;

    const newColumn = to && to.column;
    const newOrder = to && to.order;

    // remove from old column
    if (oldColumn) {
      const updatedColumn = removeItem(item, items[oldColumn]);

      items = {
        ...items,
        [oldColumn]: updatedColumn
      };
    }

    // add to new column
    if (newColumn) {
      const updatedColumn = insertItem(item, newOrder, items[newColumn]);

      items = {
        ...items,
        [newColumn]: updatedColumn
      };
    }

    return items;
  }

  function toggleCollapse(column) {

    localCollapsed = {
      ...localCollapsed,
      [column.name]: !collapsed[column.name]
    };
  }

  function isClosingPull(item) {
    return isPull(item) && isOpenOrMerged(item) && item.links.some(link => {
      return isClosingLink(link) && itemsById[link.target.id];
    });
  }

  function checkRender(columnName) {

    return throttle(function(event) {

      const node = event.target;

      const {
        scrollHeight,
        scrollTop,
        offsetHeight
      } = node;

      if (scrollTop + offsetHeight > scrollHeight * .95) {

        const columnItems = shownItems[columnName] || [];

        const columnRenderedCount = renderCountByColumn[columnName] || DEFAULT_PER_COLUMN_RENDER_COUNT;

        if (columnRenderedCount < columnItems.length) {

          renderCountByColumn = {
            ...renderCountByColumn,
            [columnName]: columnRenderedCount + DEFAULT_PER_COLUMN_RENDER_COUNT / 5
          };
        }
      }
    }, 5);
  }

  function openCreateIssue() {
    showCreate = true;
  }

  function closeCreateIssue() {
    showCreate = false;
  }

  function createIssue(owner, repo) {
    closeCreateIssue();

    window.open(
      `https://github.com/${owner}/${repo}/issues/new/choose`,
      '_blank'
    );
  }

  function handleGlobalKey(event) {

    if (isNewIssueShortcut(event)) {
      openCreateIssue();

      event.preventDefault();
    }

    if (isLoginShortcut(event)) {
      window.location.href = user ? '/wuffle/logout' : '/wuffle/login';

      event.preventDefault();
    }
  }
</script>

<svelte:window onkeydown={ handleGlobalKey } />

<div class="taskboard">

  <Loader shown={ loading }>
    <img src={ loaderImage } width="64" alt="Loading" />
  </Loader>

  <CreateIssue
    repositories={ filterOptions['repo'] }
    onCreate={ createIssue }
    open={ showCreate }
    onClose={ closeCreateIssue }
  />

  {#if error}
    <div class="taskboard-error">

      <img src={ errorImage } width="128" alt="An error occured" />

      <p>We could not load the board.</p>

      <button class="btn btn-primary" onclick={ () => loadBoard() }>
        Retry
      </button>
    </div>
  {/if}

  <Notifications>
    {#if !error}
      {#each warnings as warning (warning)}
        <Notification type="warning" message="{ warning.action } failed">
          Could not reach the board back-end. <a href>Reload board.</a>
        </Notification>
      {/each}
    {/if}

    {#if accessNotification}
      <Notification type="error" message="Failed to move card">
        {#if accessNotification === 'forbidden'}
          It seems like you do not have write access to the underlying GitHub repository.
        {:else}
          Please <a href="/wuffle/login" title="Login via GitHub (l)">login via GitHub</a> to interact with cards.
        {/if}
      </Notification>
    {/if}
  </Notifications>

  <PoweredBy />

  <nav class="navbar navbar-expand navbar-light taskboard-header">

    <a class="navbar-brand m-0 mr-3 my-2" href="/" title="{ name } - Wuffle board">
      <img src="./logo.svg" height="30px" alt="" class="logo" />
    </a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#{navId}" aria-controls={navId} aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id={navId}>

      <form class="form-inline board-filter-parent my-2 my-lg-0" onsubmit={ (e) => e.preventDefault() }>
        <BoardFilter
          value={ filter }
          completionOptions={ filterOptions }
          onChange={ filterChanged }
          placeholder="Filter board..."
        />
      </form>

      <form class="form-inline mx-3 my-2 my-sm-0" onsubmit={ (e) => e.preventDefault() || openCreateIssue() }>
        <button class="btn btn-outline-primary" type="submit" title="Create new issue (n)" aria-label="Create new issue (n)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"></path></svg>
        </button>
      </form>
    </div>

    <div class="taskboard-header-login ml-2">
      {#if user}
        <a href="/wuffle/logout" title={ `Logged in as ${user.login}. Logout (l)` }>
          <Avatar rounded>
            <img src="{ user.avatar_url }&s=40" style="max-width: 100%" alt="Logged in user avatar" />
          </Avatar>
        </a>
      {:else}
        <a href="/wuffle/login" title="Login with GitHub (l)">
          <Avatar rounded>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="1.3em" fill="currentColor"><path d="M4.243 4.757a3.757 3.757 0 115.851 3.119 6.006 6.006 0 013.9 5.339.75.75 0 01-.715.784H2.721a.75.75 0 01-.714-.784 6.006 6.006 0 013.9-5.34 3.753 3.753 0 01-1.664-3.118z"></path></svg>
          </Avatar>
        </a>
      {/if}
    </div>
  </nav>

  <main class="taskboard-board scroll-container-h">

    {#if !error}
      {#each columns as column(column.name)}
        <div class="taskboard-column" class:collapsed={ collapsed[column.name] }>
          <div class="taskboard-column-header">
            <button
              class="taskboard-column-collapse btn btn-link"
              title="{ collapsed[column.name] ? 'Expand' : 'Collapse' } column"
              onclick={ (e) => e.preventDefault() || toggleCollapse(column) }
            >
              {#if collapsed[column.name] }
                <svg viewBox="64 64 896 896" height="1em" aria-hidden="true" fill="currentColor"><path d="M602 548c0 4 4 8 8 8h186v74c0 6 7 9 11 6l150-120c3-3 3-8 0-11L807 386c-4-4-11-1-11 5v75H609c-4 0-7 3-7 7zM68 514l149 122c4 3 11 0 11-6v-76h186c4 0 8-2 8-6v-77c0-4-4-7-8-7H228v-75c0-6-7-9-11-5L68 503c-4 3-4 8 0 11z"/></svg>
              {:else}
                <svg viewBox="64 64 896 896" height="1em" aria-hidden="true" fill="currentColor"><path d="M605 515l149 122c5 3 12 0 12-6v-76h186c4 0 7-2 7-6v-77c0-4-3-7-7-7H766v-75c0-6-7-9-12-5L605 504c-4 3-4 8 0 11zM65 547c0 4 3 8 7 8h186v74c0 6 7 9 12 6l149-120c4-3 4-8 0-11L270 385c-5-4-12-1-12 5v75H72c-4 0-7 3-7 7z"/></svg>
              {/if}
            </button>
            <span class="taskboard-column-name">
              { column.name }
            </span>
            <span class="taskboard-column-issue-count">
              { (shownItems[column.name] || []).length }
            </span>
          </div>

          {#if !collapsed[column.name] }
            <div class="taskboard-column-items scroll-container-v"
                 data-column-id={ column.name }
                 onscroll={ checkRender(column.name) }>

              {#each (renderedItems[column.name] || []) as item, index (item.id) }
                <div
                  class="card-container"
                  data-card-id={ item.id }
                  data-card-order={ item.order }
                >
                  <Card
                    item={item}
                    onSelect={ applyFilter }
                  />
                </div>
              {/each}

            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </main>
</div>

<style lang="scss">
  @import "variables";

  @import "./Taskboard";

  .muted {
    color:  $gray-600;
  }

  .taskboard {
    position: relative;
  }
</style>