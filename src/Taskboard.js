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
  IssueCreateForm,
  IssueUpdateForm
} from './forms';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import classNames from 'classnames';

import './Taskboard.less';

const columns = [
  { name: 'Inbox', count: 19 },
  { name: 'Backlog', count: 300 },
  { name: 'Ready', count: 4 },
  { name: 'In Progress', count: 2 },
  { name: 'Review', count: 3 },
  { name: 'Done', count: 10 }
];

const labelFoo = {
  name: 'FOO', color: 'red'
};

const labelBar = {
  name: 'BAR', color: 'green'
};


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
    collapsed: {
      'Inbox': true
    },
    items: {
      'Inbox': [
        { id: 1, name: 'Do this', repository: 'bpmn-io/bpmn-js', labels: [] },
        { id: 2, name: 'ASDSAD SADSA DSAD SAD SAD ASD SAD SAD ASDASDASDASDSAD', repository: 'bpmn-io/bpmn-js', labels: [] },
        { id: 3, name: 'Do this 3', repository: 'bpmn-io/bpmn-js', labels: [ labelFoo ] },
        { id: 4, name: 'Do this 5', repository: 'bpmn-io/bpmn-js', labels: [ labelFoo ] },
        { id: 5, name: 'Do this 7', repository: 'bpmn-io/bpmn-js', labels: [ labelBar, labelFoo ] }
      ],
      'Backlog': [
        { id: 6, name: 'COOO this 5', repository: 'bpmn-io/bpmn-js', labels: [ labelFoo ] },
        { id: 7, name: 'Do this 7', repository: 'bpmn-io/bpmn-js', labels: [ labelBar, labelFoo ] },
        { id: 8, name: 'COOO this 5', repository: 'bpmn-io/bpmn-js', labels: [ labelFoo ] },
        { id: 9, name: 'Do this 7', repository: 'bpmn-io/bpmn-js', labels: [ labelBar, labelFoo ] },
        { id: 10, name: 'COOO this 5', repository: 'bpmn-io/bpmn-js', labels: [ labelFoo ] },
        { id: 11, name: 'ASDSAD SADSA DSAD SAD SAD ASD SAD SAD ASDASDASDASDSAD', repository: 'bpmn-io/bpmn-js', labels: [ labelBar, labelFoo ] },
        { id: 12, name: 'COOO this 5', repository: 'bpmn-io/bpmn-js', labels: [ labelFoo ] },
        { id: 13, name: 'Do this 7', repository: 'bpmn-io/bpmn-js', labels: [ labelBar, labelFoo ] },
        { id: 14, name: 'Do this', repository: 'bpmn-io/bpmn-js', labels: [] },
        { id: 15, name: 'COOO this 2', repository: 'bpmn-io/bpmn-js', labels: [] },
        { id: 16, name: 'COOO this 3', repository: 'bpmn-io/bpmn-js', labels: [ labelFoo ] },
      ],
      'Ready': [
        { id: 17, name: 'Do this 7', repository: 'bpmn-io/bpmn-js', labels: [ labelBar ] }
      ]
    }
  };

  getList = id => this.state.items[id] || [];

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

  toggleCollapsed = (column) => () => {

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
      items
    } = this.state;

    return (

      <React.Fragment>

        <IssueCreateDrawer
          visible={ this.state.createNew }
          onCreate={ this.createIssue }
          onClose={ this.closeIssueCreateDrawer }
        />

        <IssueUpdateDrawer
          visible={ !isNaN(this.state.showIssue) }
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
                        <a className="Taskboard-column-collapse" onClick={ this.toggleCollapsed(column) }>
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
                                                href={ `https://github.com/${item.repository}/issues/${item.id}` }
                                                className="Taskboard-item-issue-number"
                                                onClick={ (e) => {

                                                  if (hasModifier(e)) {
                                                    return;
                                                  }

                                                  this.showIssueUpdateDrawer(item.id);

                                                  e.preventDefault();
                                                } }
                                              >{ item.id }</a>
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
      visible={visible}
      width={ 500 }
    >
      <IssueUpdateForm onSubmit={ onUpdate } onCancel={ onClose } />
    </Drawer>
  );
}



function hasModifier(event) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}