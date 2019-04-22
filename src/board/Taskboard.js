import React from 'react';

import {
  Button,
  Icon,
  Input,
  Drawer,
  Select,
  Avatar,
  Divider
} from 'antd';

import {
  createLocalStore,
  createHistory,
  periodic,
  delay,
  debounce
} from './util';

import {
  Loader
} from './primitives';

import {
  IssueCreateForm,
  IssueUpdateForm
} from './forms';

import Card from './Card';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import classNames from 'classnames';

import css from './Taskboard.less';

import loaderImg from './loader.png';
import errorImg from './error.png';

const COLUMNS_COLLAPSED_KEY = 'Taskboard_columns_collapsed_state';

const localStore = createLocalStore();

const history = createHistory();


class Taskboard extends React.Component {

  teardownHooks = [];

  state = {
    loading: true,
    columns: [],
    items: {},
    issues: {},
    collapsed: localStore.get(COLUMNS_COLLAPSED_KEY, {}),
    cursor: null,
    user: null,
    filter: parseSearchFilter()
  };

  componentDidUpdate(prevProps, prevState) {

    const {
      collapsed,
      filter
    } = this.state;

    if (prevState.collapsed !== collapsed) {
      localStore.set(COLUMNS_COLLAPSED_KEY, collapsed);
    }

    if (prevState.filter !== filter) {
      this.filterBoard(filter);
    }
  }

  componentWillUnmount() {
    this.teardownHooks.forEach(fn => fn());
  }

  fetchCards(filter) {

    return (
      fetchJSON(appURL(`/cards${buildQueryString(filter)}`)).then(board => {

          const {
            items,
            cursor
          } = board;

          this.setState({
            items,
            issues: Object.values(items).reduce((issues, columnIssues) => {

              columnIssues.forEach(function(issue) {
                issues[issue.id] = issue;
              });

              return issues;
            }, {}),
            cursor
          })
        })
    );
  }

  fetchBoard() {

    return (
      fetchJSON(appURL('/board')).then(board => {

        const {
          columns,
          name
        } = board;

        this.setState({
          columns,
          name
        });
      })
    );
  }

  componentDidMount() {

    const {
      filter
    } = this.state;

    return Promise.all([
      this.fetchBoard(),
      this.loginCheck(),
      this.fetchCards(filter)
    ]).then((res) => {

      // loading would otherwise happen too quick *GG*
      delay(() => {
        this.setState({
          loading: false
        });
      }, 300);

      this.teardownHooks = [
        // poll for issue updates every three seconds
        periodic(this.pollIssues, 1000 * 3),

        // check login every 10 minutes
        periodic(this.loginCheck, 1000 * 60 * 10),

        // hook into history changes
        history.onPop(this.onPopState)
      ];

    }).catch((err) => {

      this.setState({
        loading: false,
        error: 'Ooops, failed to load board.'
      });

    });
  }

  loginCheck = () => {
    return (
      fetchJSON(appURL('/login_check')).then(user => {
        this.setState({
          user
        });
      })
    );
  };

  pollIssues = () => {

    const {
      filter,
      cursor
    } = this.state;

    const url = appURL(`/updates?cursor=${cursor}${buildQueryString(filter, '&')}`);

    return (
      fetchJSON(url).then(updates => {

        if (updates.length === 0) {
          return;
        }

        this.setState(state => {

          const {
            issues,
            items
          } = state;

          return applyUpdates(updates, { issues, items });
        });
      })
    );
  };

  openCreateNew = () => {
    this.setState({
      createNew: true
    });
  }

  closeIssueCreateDrawer = () => {
    this.setState({
      createNew: false
    });
  }

  createIssue = (values) => {
    console.log(values);
  }

  showIssueUpdateDrawer = (issue) => {
    this.setState({
      showIssue: issue.id
    });
  }

  closeIssueUpdateDrawer = (issueId) => {
    this.setState({
      showIssue: null
    });
  }

  onDragEnd = result => {
    const {
      source,
      destination,
      draggableId
    } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }

    const cardId = draggableId;

    const cardSource = {
      column: source.droppableId,
      index: source.index
    };

    const cardDestination = {
      column: destination.droppableId,
      index: destination.index
    }

    return (
      this.moveCard(cardId, cardSource, cardDestination)
        .then(newPosition => {

          const {
            before,
            after
          } = newPosition;

          return this.moveIssue(cardId, cardDestination.column, before, after);
        }).catch(err => {
          console.warn('reverting card movement', err);

          return this.moveCard(cardId, cardDestination, cardSource).catch(
            err => console.warn('failed to revert card movement', err)
          );
        })
    );
  }

  moveCard(cardId, source, destination) {

    const {
      items
    } = this.state;

    const updatedItems = moveItem(items, source, destination);

    const {
      before,
      after
    } = getNeightbors(updatedItems[destination.column], destination.index);

    this.setState({
      items: {
        ...items,
        ...updatedItems
      }
    });

    return Promise.resolve({
      before,
      after
    });
  }

  moveIssue(id, column, before, after) {
    const body = JSON.stringify({
      id,
      before,
      after,
      column
    });

    return fetchJSON(appURL('/issues/move'), {
      method: 'POST',
      body
    });
  }

  isColumnCollapsed(column) {
    const { collapsed } = this.state;

    return collapsed[column.name];
  }

  toggleCollapsed = (column) => (event) => {

    event.preventDefault();

    const { collapsed } = this.state;

    const columnCollapsed = !this.isColumnCollapsed(column);


    this.setState({
      collapsed: {
        ...collapsed,
        [column.name]: columnCollapsed
      }
    });
  }

  onPopState = (event) => {
    this.setState({
      filter: parseSearchFilter()
    });
  }

  filterBoard(filter) {

    this.setState({
      loading: true
    });

    return this.fetchCards(filter).then(() => {

      this.setState({
        loading: false
      });
    });
  }

  onFilterChange = (filterText) => {

    history.push(`/board${buildQueryString(filterText)}`);

    this.setState({
      filter: filterText
    });
  }

  render() {

    const {
      name,
      filter,
      items,
      columns,
      loading,
      user,
      error
    } = this.state;

    return (

      <React.Fragment>

        <IssueCreateDrawer
          visible={ this.state.createNew }
          onCreate={ this.createIssue }
          onClose={ this.closeIssueCreateDrawer }
        />

        <IssueUpdateDrawer
          visible={ this.state.showIssue }
          onUpdate={ this.updateIssue }
          onClose={ this.closeIssueUpdateDrawer }
        />

        <DragDropContext onDragEnd={this.onDragEnd}>
          <div className="Taskboard">
            <div className="Taskboard-header">
              <div className="Taskboard-header-title">
                <Button.Group>
                  <Button>
                    { name }
                  </Button>
                  <Button icon="setting" title="Configure Board" />
                </Button.Group>
              </div>
              <div className="Taskboard-header-tools">
                { user &&
                  <Button
                    type="primary"
                    icon="plus"
                    title="Create new Issue"
                    onClick={ this.openCreateNew }
                  />
                }
              </div>
              <div className="Taskboard-header-spacer"></div>
              <div className="Taskboard-header-filter">
                <BoardFilter onChange={ this.onFilterChange } value={ filter } />
              </div>
              <Divider type="vertical" />
              <div className="Taskboard-header-login">
                {
                  user
                    ? <ProfileHandle user={ user } />
                    : <a href={ appURL('/login') }>
                        <Avatar icon="login" title="Login with GitHub" />
                      </a>
                }
              </div>
            </div>
            <div className="Taskboard-board">

              { error && <TaskboardError message={ error } />}

              <Loader shown={ loading }>
                <img src={ loaderImg } width="64" alt="Loading" />
              </Loader>

              {
                columns.map((column) => {

                  const collapsed = this.isColumnCollapsed(column);

                  return (

                    <div className={
                      classNames('Taskboard-column', { 'Taskboard-column-collapsed': collapsed })
                    } key={ column.name }>
                      <div className="Taskboard-column-header">
                        <a className="Taskboard-column-collapse" href="#" onClick={ this.toggleCollapsed(column) }>
                          {
                            collapsed
                              ? <Icon type="arrows-alt" rotate="45" />
                              : <Icon type="shrink" rotate="45" />
                          }
                        </a>

                        {column.name} <span className="Taskboard-column-issue-count">{(items[column.name] || []).length}</span>
                      </div>

                      {
                        !collapsed && <Droppable droppableId={ column.name }>
                        {
                          (provided, snapshot) => (
                            <div
                              className="Taskboard-column-items"
                              ref={provided.innerRef}
                            >
                              {
                                (items[column.name] || []).map((item, index) => {

                                  return (
                                    <Draggable
                                      key={item.id}
                                      draggableId={item.id}
                                      index={index}
                                    >
                                      { (provided, snapshot) => (
                                        <Card
                                          { ...{ item, provided, snapshot } }
                                          onEdit={ this.showIssueUpdateDrawer }
                                          connected={ [] ||
                                            [
                                              { type: 'pull-request', number: 23 },
                                              { type: 'depends-on', number: 41 },
                                              { type: 'depends-on', number: 21 },
                                              { type: 'required-by', number: 23 },
                                              { type: 'related-to', number: 123 },
                                              { type: 'part-of', number: 111 }
                                            ]
                                          }
                                        />
                                      ) }
                                    </Draggable>
                                  );
                                })
                              }

                              { provided.placeholder }
                            </div>
                          )
                        }
                      </Droppable>
                    }
                    </div>
                  );
                })
              }
            </div>
          </div>
        </DragDropContext>
      </React.Fragment>
    );
  }
}

export default Taskboard;


class BoardFilter extends React.Component {

  state = {
    focussed: false,
    value: null
  };

  inputRef = React.createRef();

  componentDidMount() {
    this.state.value = this.props.value;
  }

  componentDidUpdate(oldProps) {
    const propsValue = this.props.value;
    const stateValue = this.state.value;

    if (oldProps.value !== propsValue && stateValue !== propsValue) {
      this.setState({
        value: propsValue
      });
    }
  }

  handleFocus = () => {
    this.setState({
      focussed: true
    });
  }

  handleBlur = () => {
    this.setState({
      focussed: false
    });
  };

  triggerChanged = debounce((value) => {

    const {
      onChange
    } = this.props;

    onChange(value);
  }, 500);

  handleChange = (event) => {

    const value = event.target.value;

    // TODO(nikku): give hints on what to search for
    // this.inputRef.current.input.selectionStart);

    this.setState({
      value
    });

    this.triggerChanged(value);
  };

  render() {

    const {
      focussed,
      value
    } = this.state;

    return (
      <Input
        className={ classNames(css.BoardFilter, { focussed }) }
        placeholder="Filter Board"
        prefix={<Icon type="search" style={{ color: 'rgba(0,0,0,.25)' }} />}
        value={ value }
        onChange={ this.handleChange }
        onFocus={ this.handleFocus }
        onBlur={ this.handleBlur }
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        ref={ this.inputRef }
      />
    );
  }

}


class ProfileHandle extends React.Component {

  state = {
    hovered: false,
    focussed: false
  };

  handleOver = () => {
    this.setState({
      hovered: true
    });
  };

  handleOut = () => {
    this.setState({
      hovered: false
    });
  };

  handleFocus = () => {
    this.setState({
      focussed: true
    });
  };

  handleBlur = () => {
    this.setState({
      focussed: false
    });
  };

  render() {

    const {
      hovered,
      focussed
    } = this.state;

    const {
      user
    } = this.props;

    return (
      <a
        href={ appURL('/logout') }
        onMouseEnter={ this.handleOver }
        onMouseLeave={ this.handleOut }
        onFocus={ this.handleFocus }
        onBlur={ this.handleBlur }
      >
        {
          (hovered || focussed)
            ? <Avatar icon="logout" title={ `Logout ${user.login}` } />
            : <Avatar src={ user.avatar_url } title={ `Logout ${user.login}` } />
        }
      </a>
    );
  }
}


function IssueCreateDrawer(props) {

  const {
    onClose,
    onCreate,
    visible
  } = props;

  const drawerTitle = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      Create New Issue

      <Select
        showSearch
        style={{ width: 200 }}
        placeholder="Select a person"
        optionFilterProp="children"
        defaultValue="bpmn-io/tasks"
        filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
      >
        <Select.Option value="bpmn-io/tasks">bpmn-io/tasks</Select.Option>
        <Select.Option value="bpmn-io/bpmn-js">bpmn-io/bpmn-js</Select.Option>
        <Select.Option value="camunda/camunda-modeler">camunda/camunda-modeler</Select.Option>
      </Select>
    </div>
  );

  return (
    <Drawer
      title={ drawerTitle }
      placement="right"
      closable={false}
      onClose={onClose}
      visible={visible}
      width={ 500 }
    >
      <IssueCreateForm onSubmit={ onCreate } onCancel={ onClose } />
    </Drawer>
  );
}



function IssueUpdateDrawer(props) {

  const {
    onClose,
    onUpdate,
    visible
  } = props;

  const drawerTitle = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span>Issue <a href="#"><strong>1231</strong></a></span>

      <span style={{ color: '#888' }}>bpmn-io/bpmn-js</span>
    </div>
  );

  return (
    <Drawer
      title={ drawerTitle }
      placement="right"
      closable={false}
      onClose={onClose}
      visible={typeof visible === 'number'}
      width={ 500 }
    >
      <IssueUpdateForm onSubmit={ onUpdate } onCancel={ onClose } />
    </Drawer>
  );
}

function fetchJSON(url, options) {
  return fetch(url, {
    ...options,
    credentials: 'include'
  }).then(r => {
    if (r.status >= 400) {
      throw new Error('HTTP error ' + r.status);
    }

    return r;
  }).then(r => r.text()).then(t => JSON.parse(t));
}

function TaskboardError(props) {

  return (
    <div className={ css.TaskboardError }>
      <div className="overlay"></div>
      <div className="content">
        <img src={ errorImg } width="64" alt="Error" />
        <h2>{ props.message }</h2>
      </div>
    </div>
  );
}

function getNeightbors(column, itemIndex) {

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
};


function appURL(location) {
  return `http://localhost:3000/wuffle${location}`;
}


function applyUpdates(updates, state) {

  let {
    items,
    issues
  } = state;

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

    const existingIssue = issues[id];

    // update in existing column

    const oldColumn = existingIssue && existingIssue.column;

    // remove from existing column
    if (oldColumn && (oldColumn !== newColumn || type === 'remove')) {
      items = {
        ...items,
        [oldColumn]: items[oldColumn].filter(existingIssue => existingIssue.id !== id)
      };
    }

    // update in existing column
    if (oldColumn && (oldColumn === newColumn && type !== 'remove')) {
      items = {
        ...items,
        [oldColumn]: items[oldColumn].map(existingIssue => existingIssue.id === id ? issue : existingIssue)
      };
    }

    // add to new column
    if (oldColumn !== newColumn && type !== 'remove') {
      const updatedColumn = insertIssue(issue, items[newColumn]);

      items = {
        ...items,
        [newColumn]: updatedColumn
      };
    }

    if (type === 'remove') {
      const {
        [id]: removedIssue,
        ...remainingIssues
      } = issues;

      issues = remainingIssues;
    } else {
      issues = {
        ...issues,
        [id]: issue
      };
    }
  });

  return {
    cursor,
    issues,
    items
  };
}

function moveItem(lists, source, destination) {
  const fromList = Array.from(lists[source.column] || []);
  const toList = source.column === destination.column ? fromList : Array.from(lists[destination.column] || []);

  const [removed] = fromList.splice(source.index, 1);

  toList.splice(destination.index, 0, removed);

  return {
    [ source.column ]: fromList,
    [ destination.column ]: toList
  };
}

function parseSearchFilter() {
  if (typeof window === 'undefined') {
    return null;
  }

  const queryString = window.location.search;

  const search = queryString.split(/[?&]/).find(param => /^s=/.test(param));

  if (!search) {
    return null;
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