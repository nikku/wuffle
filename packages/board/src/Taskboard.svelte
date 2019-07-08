<script>
  import BoardFilter from './BoardFilter.svelte';

  import Avatar from './components/Avatar.svelte';
  import Loader from './components/Loader.svelte';

  import Notification from './components/Notification.svelte';

  import Card from './Card.svelte';

  import Api from './Api';

  import Dragula from 'dragula';

  import {
    Id,
    createLocalStore,
    createHistory,
    isOpenPullOrMergedPull,
    periodic,
    throttle
  } from './util';

  import loaderImage from './loader.png';

  import { onMount } from 'svelte';

  const COLUMNS_COLLAPSED_KEY = 'Taskboard_columns_collapsed_state';
  const POLL_KEY = 'Taskboard_polling';

  const api = new Api();
  const localStore = createLocalStore();
  const history = createHistory();

  const navId = Id();

  let name = '';
  let columns = {};
  let items = {};

  let itemsById = {};

  let collapsed = localStore.get(COLUMNS_COLLAPSED_KEY, {});

  let loading = true;
  let updating = 0;
  let error = false;

  let filter = parseSearchFilter();
  let user = null;
  let cursor = null;

  let accessNotification = false;

  const renderCount = 25;

  let filterOptions = {};

  $: localStore.set(COLUMNS_COLLAPSED_KEY, collapsed);
  $: shownItems = Object.keys(items).reduce((shownItems, column) => {

    const columnItems = items[column];

    shownItems[column] = columnItems.filter(item => !isPRWithLinks(item));

    return shownItems;
  }, {});

  $: renderedItems = Object.keys(items).reduce((renderedItems, column) => {
    renderedItems[column] = renderCount;

    return renderedItems;
  }, {});

  onMount(() => {

    Promise.all([
      fetchCards(filter),
      loginCheck(),
      fetchBoard()
    ]).catch(() => {
      error = true;
    }).finally(() => {
      loading = false;
    });

    const poll = localStore.get(POLL_KEY, true);

    const teardownHooks = [
      // poll for issue updates every three seconds
      poll && periodic(pollUpdates, 1000 * 3),

      // check login every 1 minutes
      poll && periodic(loginCheck, 1000 * 60 * 1),

      // hook into history changes
      history.onPop(() => {
        const newFilter = parseSearchFilter();

        filterChanged(newFilter, false);
      })
    ];

    return () => teardownHooks.forEach(fn => fn && fn());
  });

  function filterChanged(value, pushHistory=true) {

    if (value === filter) {
      return;
    }

    const currentFilter = filter;

    filter = value;

    if (pushHistory) {
      history.push(`/board${buildQueryString(filter)}`);
    }

    if (currentFilter.trim() !== filter.trim()) {
      fetchCards(filter);
    }
  }

  function parseSearchFilter() {
    if (typeof window === 'undefined') {
      return '';
    }

    const queryString = window.location.search;

    const search = queryString.split(/[?&]/).find(param => /^s=/.test(param));

    if (!search) {
      return '';
    }

    return decodeURIComponent(search.split(/=/)[1]);
  }

  function buildQueryString(filter, separator='?') {
    if (filter) {
      return `${separator}s=${encodeURIComponent(filter)}`;
    } else {
      return '';
    }
  }

  function loginCheck() {
    return api.getLoggedInUser().then(newUser => {
      user = newUser;
    });
  }

  function fetchBoard() {
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
          milestone,
          assignees,
          labels,
          repository,
          requested_reviewers
        } = item;

        const repoOptions = _filterOptions['repo'] = _filterOptions['repo'] || {};

        repoOptions[repository.name] = true;

        if (milestone) {
          const milestoneOptions = _filterOptions['milestone'] = _filterOptions['milestone'] || {};

          milestoneOptions[milestone.title] = true;
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

    return api.listUpdates(currentFilter, cursor).then(updates => {

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
    });
  }

  function applyUpdates(updates, items, itemsById) {

    const cursor = updates[updates.length - 1].id;

    updates.forEach(update => {
      const {
        type,
        issue
      } = update;

      const {
        id,
        column: newColumn
      } = issue;

      const existingItem = itemsById[id];

      // update in existing column

      const oldColumn = existingItem && existingItem.column;

      // remove from existing column
      if (oldColumn && (oldColumn !== newColumn || type === 'remove')) {
        items = {
          ...items,
          [oldColumn]: (items[oldColumn] || []).filter(existingItem => existingItem.id !== id)
        };
      }

      // update in existing column
      if (oldColumn && (oldColumn === newColumn && type !== 'remove')) {
        items = {
          ...items,
          [oldColumn]: (items[oldColumn] || []).map(existingItem => existingItem.id === id ? issue : existingItem)
        };
      }

      // add to new column
      if (oldColumn !== newColumn && type !== 'remove') {
        const updatedColumn = insertIssue(issue, (items[newColumn] || []));

        items = {
          ...items,
          [newColumn]: updatedColumn
        };
      }

      if (type === 'remove') {
        const {
          [id]: removedItem,
          ...remainingItems
        } = itemsById;

        itemsById = remainingItems;
      } else {
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
      return el.matches('[data-droppable-id]');
    }
  });

  function getDraggableMetaData(el) {

    const dataset = el.dataset;

    return {
      id: dataset.draggableId,
      index: parseInt(dataset.draggableIndex, 10)
    };
  }

  function getDroppableMetaData(el) {

    const dataset = el.dataset;

    return {
      id: dataset.droppableId
    };
  }

  drake.on('drop', (el, target, source, sibling) => {
    const draggedCard = getDraggableMetaData(el);

    const droppedBeforeCard = sibling && getDraggableMetaData(sibling);

    const targetColumn = getDroppableMetaData(target);

    const sourceColumn = getDroppableMetaData(source);

    const sourceIndex = draggedCard.index;

    const dropBeforeIndex = droppedBeforeCard ? droppedBeforeCard.index : -1;

    const targetIndex = targetColumn.id === sourceColumn.id && dropBeforeIndex > sourceIndex
      ? dropBeforeIndex - 1
      : dropBeforeIndex;

    const cardId = draggedCard.id;

    const cardSource = {
      column: sourceColumn.id,
      index: sourceIndex
    };

    const cardDestination = {
      column: targetColumn.id,
      index: targetIndex
    };

    handleCardDrop(cardId, cardSource, cardDestination);
  });

  function handleCardDrop(cardId, cardSource, cardDestination) {

    return (
      moveCard(cardId, cardSource, cardDestination)
        .then(newPosition => {

          const {
            before,
            after
          } = newPosition;

          return api.moveIssue(cardId, cardDestination.column, before, after);
        }).catch(err => {
          console.warn('reverting card movement', err);

          accessNotification = user ? 'forbidden' : 'authentication-required';

          setTimeout(() => {
            accessNotification = false;
          }, 8000);

          return moveCard(cardId, cardDestination, cardSource).catch(
            err => console.warn('failed to revert card movement', err)
          );
        })
    );
  }

  function getNeightbors(column, itemIndex) {

    if (itemIndex === -1) {
      itemIndex = column.length - 1;
    }

    const after = itemIndex > 0 ? column[itemIndex - 1].id : null;
    const before = itemIndex < column.length - 1 ? column[itemIndex + 1].id : null;

    return {
      before,
      after
    };
  }

  function insertIssue(issue, column = []) {
    const { after } = issue;

    if (after === null) {
      return [ issue, ...column ];
    }

    if (after) {
      const indexAfter = column.findIndex(issue => issue.id === after);

      if (indexAfter > -1) {
        return [
          ...column.slice(0, indexAfter),
          issue,
          ...column.slice(indexAfter)
        ];
      }
    }

    return [ ...column, issue ];
  }

  function moveCard(cardId, source, destination) {

    const updatedItems = moveItem(items, source, destination);

    const {
      before,
      after
    } = getNeightbors(updatedItems[destination.column], destination.index);

    // TODO(nikku): properly update issue column
    const issue = itemsById[cardId];
    issue.column = destination.column;

    items = {
      ...items,
      ...updatedItems
    };

    return Promise.resolve({
      before,
      after
    });
  }

  function moveItem(lists, source, destination) {
    const fromList = Array.from(lists[source.column] || []);
    const toList = source.column === destination.column ? fromList : Array.from(lists[destination.column] || []);

    const fromIndex = source.index;
    const toIndex = destination.index;

    const [removed] = fromList.splice(fromIndex === -1 ? fromList.length - 1 : fromIndex, 1);

    toList.splice(toIndex === -1 ? toList.length : toIndex, 0, removed);

    return {
      [ source.column ]: fromList,
      [ destination.column ]: toList
    };
  }

  function toggleCollapse(column) {

    collapsed = {
      ...collapsed,
      [column.name]: !collapsed[column.name]
    };
  }

  function isPRWithLinks(item) {
    return isOpenPullOrMergedPull(item) && item.links.length > 0
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

        const shown = (shownItems[columnName] || []).length;

        const rendered = renderedItems[columnName] || renderCount;

        if (rendered < shown) {
          renderedItems = {
            ...renderedItems,
            [columnName]: rendered + renderCount / 5
          };
        }
      }
    }, 5);
  }

</script>

<style lang="scss">
  @import "variables";

  @import "./Taskboard";

  .logo {
    margin-right: 7px;
  }

  .vertical-divider {
    position: relative;
    top: -0.06em;
    display: inline-block;
    width: 1px;
    height: 0.9em;
    margin: 0 8px;
    vertical-align: middle;

    background: $gray-300;
  }

  .muted {
    color:  $gray-600;
  }
</style>

<svelte:head>
  {#if !loading}
  <title>{ name } on Wuffle</title>
  {/if}
</svelte:head>

<div class="taskboard">

  <Loader shown={ loading }>
    <img src={ loaderImage } width="64" alt="Loading" />
  </Loader>

  {#if accessNotification}
    <Notification message="Failed to move card">
      {#if accessNotification === 'forbidden'}
        It seems like you do not have write access to the underlying GitHub repository.
      {:else}
        Please <a href="/wuffle/login">login via GitHub</a> to interact with cards.
      {/if}
    </Notification>
  {/if}

  <nav class="navbar navbar-expand navbar-light taskboard-header">
    <a class="navbar-brand mb-0 h1" href="/">
      <img src="./logo.svg" width="20" height="20" alt="" class="logo">
      { name }
    </a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#{navId}" aria-controls={navId} aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id={navId}>
      <ul class="navbar-nav mr-auto">
      </ul>

      <form class="form-inline my-2 my-lg-0" on:submit={ (e) => e.preventDefault() }>
        <BoardFilter value={ filter } completionOptions={ filterOptions } onChange={ filterChanged } />
      </form>

      <div class="vertical-divider"></div>

      <div class="taskboard-header-login">
        {#if user}
          <a href="/wuffle/logout">
            <Avatar title={ `Logout ${user.login}` } rounded>
              <img src="{ user.avatar_url }&s=40" style="max-width: 100%" alt="Logged in user avatar" />
            </Avatar>
          </a>
        {:else}
          <a href="/wuffle/login">
            <Avatar title="Login with GitHub" rounded>
              <svg viewBox="64 64 896 896" height="1em" fill="currentColor" aria-hidden="true" focusable="false"><path d="M858.5 763.6a374 374 0 0 0-80.6-119.5 375.63 375.63 0 0 0-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 0 0-80.6 119.5A371.7 371.7 0 0 0 136 901.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 0 0 8-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path></svg>
            </Avatar>
          </a>
        {/if}
      </div>
    </div>
  </nav>

  <div class="taskboard-board">

    {#each columns as column }
      <div class="taskboard-column" class:collapsed={ collapsed[column.name] }>
        <div class="taskboard-column-header">
          <button class="taskboard-column-collapse btn btn-link" on:click={ (e) => e.preventDefault() || toggleCollapse(column) }>
            {#if collapsed[column.name] }
              <svg viewBox="64 64 896 896" height="1em" fill="currentColor" aria-hidden="true" focusable="false" style="transform: rotate(45deg);"><path d="M855 160.1l-189.2 23.5c-6.6.8-9.3 8.8-4.7 13.5l54.7 54.7-153.5 153.5a8.03 8.03 0 0 0 0 11.3l45.1 45.1c3.1 3.1 8.2 3.1 11.3 0l153.6-153.6 54.7 54.7a7.94 7.94 0 0 0 13.5-4.7L863.9 169a7.9 7.9 0 0 0-8.9-8.9zM416.6 562.3a8.03 8.03 0 0 0-11.3 0L251.8 715.9l-54.7-54.7a7.94 7.94 0 0 0-13.5 4.7L160.1 855c-.6 5.2 3.7 9.5 8.9 8.9l189.2-23.5c6.6-.8 9.3-8.8 4.7-13.5l-54.7-54.7 153.6-153.6c3.1-3.1 3.1-8.2 0-11.3l-45.2-45z"></path></svg>
            {:else}
              <svg viewBox="64 64 896 896" height="1em" fill="currentColor" aria-hidden="true" focusable="false" style="transform: rotate(45deg);">
                <path d="M881.7 187.4l-45.1-45.1a8.03 8.03 0 0 0-11.3 0L667.8 299.9l-54.7-54.7a7.94 7.94 0 0 0-13.5 4.7L576.1 439c-.6 5.2 3.7 9.5 8.9 8.9l189.2-23.5c6.6-.8 9.3-8.8 4.7-13.5l-54.7-54.7 157.6-157.6c3-3 3-8.1-.1-11.2zM439 576.1l-189.2 23.5c-6.6.8-9.3 8.9-4.7 13.5l54.7 54.7-157.5 157.5a8.03 8.03 0 0 0 0 11.3l45.1 45.1c3.1 3.1 8.2 3.1 11.3 0l157.6-157.6 54.7 54.7a7.94 7.94 0 0 0 13.5-4.7L447.9 585a7.9 7.9 0 0 0-8.9-8.9z"></path>
              </svg>
            {/if}
          </button>
          { column.name }
          <span class="taskboard-column-issue-count">
            { (shownItems[column.name] || []).length }
          </span>
        </div>

        {#if !collapsed[column.name] }
          <div class="taskboard-column-items"
               data-droppable-id={ column.name }
               on:scroll={ checkRender(column.name) }>
            {#each (shownItems[column.name] || []) as item, index (item.id) }

              <Card
                item={item}
                shown={ index <= (renderedItems[column.name] || renderCount) }
                data-draggable-id={ item.id }
                data-draggable-index={ index }
              />
            {/each}
          </div>
        {/if}
      </div>
    {/each}

  </div>
</div>