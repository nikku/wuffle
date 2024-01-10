const States = {
  DEFAULT: 'DEFAULT',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  IN_REVIEW: 'IN_REVIEW',
  EXTERNAL_CONTRIBUTION: 'EXTERNAL_CONTRIBUTION'
};

const StateToNames = {
  DEFAULT: 'Inbox',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  IN_REVIEW: 'Needs Review',
  EXTERNAL_CONTRIBUTION: 'Inbox'
};

/**
 * @typedef { { name: string, label?: string|null, closed?: boolean } } ColumnDefinition
 */

class Columns {

  /**
   * @param { ColumnDefinition[] } columns
   */
  constructor(columns) {
    this.columns = columns;

    this.columnsByState = groupByStates(columns);

    this.columnsByLabel = groupByLabel(columns);

    this.columnsByName = groupByName(columns);

    this._getter = createColumnGetter(columns);
  }

  getAll() {
    return this.columns;
  }

  getIssueColumn(issue) {
    return this._getter(issue);
  }

  getByName(columnName) {
    return this.columnsByName[columnName];
  }

  getByState(state) {
    if (state in States) {
      const column = this.columnsByState[state];

      if (!column) {
        throw new Error('no column mapped to state <' + state + '>');
      }

      return column;
    }

    throw new Error('invalid state <' + state + '>');
  }

  isSorting(columnName) {
    const column = this.getByName(columnName);

    return column && column.sorting;
  }

  isFifo(columnName) {
    const column = this.getByName(columnName);

    return column && column.fifo;
  }

  isColumnLabel(label) {
    return label in this.columnsByLabel;
  }

}

Columns.$inject = [ 'config.columns' ];

module.exports = Columns;


// helpers //////////////////

function createColumnGetter(columns) {

  const sortedColumns = columns.slice().sort((a, b) => {
    if (a.label && !b.label) {
      return -1;
    }

    return 1;
  });


  const defaultColumn = columns.find(c => c.type === States.DEFAULT) || columns[0];

  return function(issue) {

    const {
      column: issueColumn
    } = issue;

    const columns = sortedColumns.filter(column => {

      const issueClosed = issue.state === 'closed';

      const columnLabel = column.label;

      const columnClosed = column.closed === true;

      if (issueClosed !== columnClosed) {
        return false;
      }

      if (!columnLabel && defaultColumn !== column) {
        return true;
      }

      return issue.labels.find(l => l.name === columnLabel);
    });

    // ensure that column is stable; it only changes
    // if the given configuration doesn't match the
    // existing column
    return columns.find(c => c.name === issueColumn) || columns[0] || defaultColumn;
  };
}

function groupByStates(columns) {
  return Object.keys(States).reduce((columnsByState, state) => {

    const defaultName = StateToNames[state];

    const column = (
      columns.find(c => c.states && c.states.includes(state)) ||
      columns.find(c => c.name === defaultName)
    );

    if (!column) {
      throw new Error('no column mapped to state ' + state + ' or called ' + StateToNames[state]);
    }

    columnsByState[state] = column;

    return columnsByState;
  }, {});
}

function groupByLabel(columns) {
  return columns.reduce((columnsByLabel, column) => {

    const { label } = column;

    if (label) {
      if (columnsByLabel[label]) {
        throw new Error('label already mapped to column: ' + label);
      }

      columnsByLabel[label] = column;
    }

    return columnsByLabel;
  }, {});
}

function groupByName(columns) {
  return columns.reduce((columnsByName, column) => {

    const { name } = column;

    if (name) {

      if (columnsByName[name]) {
        throw new Error('name already used: ' + name);
      }

      columnsByName[name] = column;
    }

    return columnsByName;
  }, {});
}