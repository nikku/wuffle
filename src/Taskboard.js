import React from 'react';

import {
  Button,
  Icon,
  Input,
  Tag,
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

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import classNames from 'classnames';

import './Taskboard.less';


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

const getItemStyle = (isDragging) => ({
  userSelect: 'none'
});

const getListStyle = isDraggingOver => ({});


class Taskboard extends React.Component {

  state = {
    loading: true,
    columns: [],
    items: {},
    collapsed: {}
  };

  getList = id => this.state.items[id] || [];

  async componentDidMount() {

    const loadingPromise = Promise.all([
      fetch('http://localhost:3000/wuffle/columns').then(r => r.text()).then(t => JSON.parse(t)),
      fetch('http://localhost:3000/wuffle/board').then(r => r.text()).then(t => JSON.parse(t))
    ]);

    const [
      columns,
      board
    ] = await loadingPromise;

    console.log({
      columns,
      board
    });

    this.setState({
      loading: false,
      columns,
      items: board
    });
  }

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

  render() {

    const {
      items,
      columns,
      loading
    } = this.state;


    return (

      <React.Fragment>

        <Loader shown={ loading }>
          <img src="/favicon.png" alt="Loading" />
        </Loader>

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
                              ? <Icon type="left-square" />
                              : <Icon type="left-square" />
                          }
                        </a>

                        {column.name} <span className="Taskboard-column-issue-count">{column.count}</span>
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
                                      {(provided, snapshot) => (
                                        <div className="Taskboard-item"
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={
                                            provided.draggableProps.style
                                          }
                                        >
                                          <div
                                            className="Taskboard-item-card"
                                            style={getItemStyle(
                                              snapshot.isDragging
                                            )}
                                          >

                                            <div className="Taskboard-item-header">
                                              <a
                                                href={ `https://github.com/${item.repository}/issues/${item.number}` }
                                                className="Taskboard-item-issue-number"
                                                onClick={ (e) => {

                                                  if (hasModifier(e)) {
                                                    return;
                                                  }

                                                  this.showIssueUpdateDrawer(item.id);

                                                  e.preventDefault();
                                                } }
                                              >{ item.number }</a>
                                              <span className="Taskboard-item-repository">{ item.repository }</span>
                                              <span className="spacer"></span>
                                              <a className="Taskboard-item-assignee"><Icon type="user" /></a>
                                            </div>

                                            <div className="Taskboard-item-title">
                                              <Input.TextArea autosize defaultValue={item.name} onChange={ console.log }/>
                                            </div>

                                            <div className="Taskboard-item-labels">
                                              {
                                                (item.labels || []).map((label) => {

                                                  const {
                                                    name,
                                                    color
                                                  } = label;

                                                  return (
                                                    <Tag className="Taskboard-item-label" key={ name } color={ color }>{ name }</Tag>
                                                  );
                                                })
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      )}
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
      <span>Issue <a><strong>1231</strong></a></span>

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



function hasModifier(event) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}