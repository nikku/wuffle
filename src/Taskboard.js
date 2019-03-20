import React from 'react';

import { Card, Button, Icon, Input, Tag, Typography } from 'antd';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import classNames from 'classnames';

import './Taskboard.css';

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
        { id: 2, name: 'Do this 2', repository: 'bpmn-io/bpmn-js', labels: [] },
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
        { id: 11, name: 'Do this 7', repository: 'bpmn-io/bpmn-js', labels: [ labelBar, labelFoo ] },
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
      <DragDropContext onDragEnd={this.onDragEnd}>
        <div className="Taskboard">
          <div className="Taskboard-header">
            <div className="Taskboard-header-title">
              bpmn-io/tasks
            </div>
            <div className="Taskboard-header-tools">
              <Button type="primary" icon="plus" title="Create new Issue" />
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
                                            >{ item.id }</a>
                                            <span className="Taskboard-item-repository">{ item.repository }</span>
                                            <span className="spacer"></span>
                                            <a className="Taskboard-item-assignee"><Icon type="user" /></a>
                                          </div>

                                          <div className="Taskboard-item-title">
                                            <textarea defaultValue={item.name} onChange={ console.log }/>
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
    );
  }
}

export default Taskboard;
