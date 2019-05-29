<script>
  import BoardFilter from './BoardFilter.svelte';

  import Avatar from './components/Avatar.svelte';

  import Card from './Card.svelte';

  import Dragula from 'dragula';

  import {
    Id
  } from './util';

  const navId = Id();

  let count = 0;

  function item() {
    return {
      id: count++,
      repository: {
        full_name: 'foo/bar'
      },
      title: 'asdsaddas adsa d adssad sad asdsadad',
      number: count++,
      assignee: {
        avatar_url: 'https://github.com/',
        login: 'nikku'
      },
      labels: [
        {
          name: 'foo',
          color: '#123111'
        },
        {
          name: 'bar',
          color: '#8877c7'
        }
      ],
      milestone: {
        name: 'asdas asds'
      }
    };

  };

  let collapsed = { };

  let columns = [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog' },
    { name: 'Ready', label: 'ready' },
    { name: 'In Progress', label: 'in progress' },
    { name: 'Needs Review', label: 'needs review' },
    { name: 'Done', label: null, closed: true }
  ];

  let items = {
    'Inbox': [ item(), item() ],
    'Backlog': [ item() ],
    'Ready': [ item() ],
    'In Progress': [
      item(), item(), item(), item(),
      item(), item(), item(), item(),
      item(), item(), item(), item(),
      item(), item(), item()
    ],
    'Needs Review': [ item(), item(), item() ],
    'Done': [ item(), item(), item() ]
  };

  console.log(items);

  const drake = Dragula({
    isContainer: (el) => {
      return el.matches('[data-droppable-id]');
    }
  });

  drake.on('drop', (el, target, source, sibling) => {
    console.log(el, target, source, sibling);
  });

  let filterValue;

  function filterChanged(value) {
    filterValue = value;
  }

  function toggleCollapse(column) {
    collapsed = {
      ...collapsed,
      [column.name]: !collapsed[column.name]
    };
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

<div class="taskboard">

  <nav class="navbar navbar-expand navbar-light taskboard-header">
    <a class="navbar-brand mb-0 h1" href="#">
      <img src="./logo.svg" width="20" height="20" alt="" class="logo">
      bpmn-io/tasks
    </a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#{navId}" aria-controls={navId} aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id={navId}>
      <ul class="navbar-nav mr-auto">
      </ul>

      <form class="form-inline my-2 my-lg-0">
        <BoardFilter value={ filterValue } class="FWOO" onChange={ filterChanged } />
      </form>

      <div class="vertical-divider"></div>

      <div class="taskboard-header-login">
        <a href="http://localhost:3000/wuffle/login">
          <Avatar title="Login with GitHub" rounded icon="login">
            <i>
              <svg viewBox="64 64 896 896" class="" data-icon="user" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false"><path d="M858.5 763.6a374 374 0 0 0-80.6-119.5 375.63 375.63 0 0 0-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 0 0-80.6 119.5A371.7 371.7 0 0 0 136 901.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 0 0 8-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path></svg>
            </i>
          </Avatar>
        </a>
      </div>
    </div>
  </nav>

  <div class="taskboard-board">

    {#each columns as column }
      <div class="taskboard-column">
        <div class="taskboard-column-header">
          <a class="taskboard-column-collapse" href="#" on:click={ () => toggleCollapse(column) }>
            <i aria-label="icon: shrink" class="anticon anticon-shrink">
              <svg viewBox="64 64 896 896" data-icon="shrink" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" style="transform: rotate(45deg);">
                <path d="M881.7 187.4l-45.1-45.1a8.03 8.03 0 0 0-11.3 0L667.8 299.9l-54.7-54.7a7.94 7.94 0 0 0-13.5 4.7L576.1 439c-.6 5.2 3.7 9.5 8.9 8.9l189.2-23.5c6.6-.8 9.3-8.8 4.7-13.5l-54.7-54.7 157.6-157.6c3-3 3-8.1-.1-11.2zM439 576.1l-189.2 23.5c-6.6.8-9.3 8.9-4.7 13.5l54.7 54.7-157.5 157.5a8.03 8.03 0 0 0 0 11.3l45.1 45.1c3.1 3.1 8.2 3.1 11.3 0l157.6-157.6 54.7 54.7a7.94 7.94 0 0 0 13.5-4.7L447.9 585a7.9 7.9 0 0 0-8.9-8.9z"></path>
              </svg>
            </i>
          </a>
          { column.name }
          <span class="taskboard-column-issue-count">
            { items[column.name].length }
          </span>
        </div>

        <div class="taskboard-column-items" data-droppable-id={ column.name }>
          {#each items[column.name] as item, index (item.id) }
            <Card {...item}
              data-draggable-id={ item.id }
              data-draggable-index={ index }
            />
          {/each}
        </div>
      </div>
    {/each}

  </div>
</div>