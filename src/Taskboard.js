import React from 'react';

import {
  Button,
  Icon,
  Input,
  Drawer,
  Select
} from 'antd';

import {
  Loader
} from './primitives';

import {
  IssueCreateForm,
  IssueUpdateForm
} from './forms';

import {
  Task
} from './Task';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import classNames from 'classnames';

import css from './Taskboard.less';

import loaderImg from './loader.png';
import errorImg from './error.png';


// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};

const getListStyle = isDraggingOver => ({});


class Taskboard extends React.Component {

  state = {
    banner: true,
    loading: true,
    columns: [],
    items: {},
    issues: {},
    collapsed: {},
    cursor: null
  };

  getList = id => this.state.items[id] || [];

  async componentDidMount() {

    const loadingPromise = Promise.all([
      fetchJSON('http://localhost:3000/wuffle/columns'),
      fetchJSON('http://localhost:3000/wuffle/board')
    ]);

    try {
      const [
        columns,
        board
      ] = await loadingPromise;

      const {
        items,
        cursor
      } = board;

      this.setState({
        loading: false,
        columns,
        items,
        issues: Object.values(items).reduce((issues, columnIssues) => {

          columnIssues.forEach(function(issue) {
            issues[issue.id] = issue;
          });

          return issues;
        }, {}),
        cursor
      });

      setInterval(this.pollIssues, 3000);
    } catch (err) {
      this.setState({
        loading: false,
        error: 'Ooops, failed to load board.'
      });
    }
  }

  pollIssues = async () => {

    let {
      cursor,
      issues,
      items
    } = this.state;

    const updates = await fetchJSON(`http://localhost:3000/wuffle/updates?cursor=${cursor}`);

    if (!updates.length) {
      return;
    }

    const head = updates[updates.length - 1];

    if (head) {
      cursor = head.id;
    }

    updates.forEach((update) => {
      const { type, issue } = update;

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
        items = {
          ...items,
          [newColumn]: [
            ...(items[newColumn] || []),
            issue
          ]
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

    this.setState({
      cursor,
      issues,
      items
    });

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

  showIssueUpdateDrawer = (issueId) => {
    this.setState({
      showIssue: issueId
    });
  }

  closeIssueUpdateDrawer = (issueId) => {
    this.setState({
      showIssue: null
    });
  }

  onDragEnd = result => {
    const { source, destination } = result;

    const {
      items: oldItems
    } = this.state;

    // dropped outside the list
    if (!destination) {
        return;
    }

    if (source.droppableId === destination.droppableId) {
      if (source.index === destination.index) {
        return;
      }

      const items = reorder(
        this.getList(source.droppableId),
        source.index,
        destination.index
      );

      this.setState({
        items: {
          ...oldItems,
          [source.droppableId]: items
        }
      });
    } else {
      const result = move(
        this.getList(source.droppableId),
        this.getList(destination.droppableId),
        source,
        destination
      );

      this.setState({
        items: {
          ...oldItems,
          ...result
        }
      });
    }
  };

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

  hideBanner = () => {
    this.setState({
      banner: false
    });
  }

  getIssueTypeIcon = (item) => {
    const isPullRequest = item.type === 'pull-request';

    if (isPullRequest) {
      return <Icon className="Taskboard-item-issue-type Taskboard-item-issue-type-pull-request" type="branches" rotate="180" />;
    }

    return null;
  }

  render() {

    const {
      banner,
      items,
      columns,
      loading,
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
          <div className={ classNames('Taskboard', { 'banner': banner }) }>
            {
              banner && (
                <div className="Banner">
                  Wuffle is <span className="Banner-highlight">opening its doors</span> in a month.
                  <Button className="Banner-button" shape="round" onClick={this.hideBanner}>
                    Got it!
                  </Button>
                </div>
              )
            }
            <div className="Taskboard-header">
              <div className="Taskboard-header-title">
                <Button.Group>
                  <Button>
                    bpmn-io/tasks
                  </Button>
                  <Button icon="setting" title="Configure Board" />
                </Button.Group>
              </div>
              <div className="Taskboard-header-tools">
                <Button type="primary" icon="plus" title="Create new Issue" onClick={ this.openCreateNew } />
              </div>
              <div className="Taskboard-header-spacer"></div>
              <div className="Taskboard-header-filter">
                <Input.Group compact>
                  <Input placeholder="Filter Board" style={{ width: 200 }} />
                  <Button icon="filter" type="primary"></Button>
                </Input.Group>
              </div>
            </div>
            <div className="Taskboard-board">

              { error && <Error message={ error } />}

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
                              style={getListStyle(snapshot.isDraggingOver)}
                            >
                              {
                                (items[column.name] || []).map((item, index) => {
                                  return (
                                    <Draggable
                                      key={item.id}
                                      draggableId={item.id}
                                      index={index}
                                    >
                                      {(provided, snapshot) => <Task { ...{ item, provided, snapshot } } />}
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
  return fetch(url, options).then(r => r.text()).then(t => JSON.parse(t));
}

function Error(props) {

  return (
    <div className={ css.TaskboardError }>
      <img src={ errorImg } width="64" alt="Error" />
      <h2>{ props.message }</h2>
    </div>
  );
}
