const Types = {
  DEFAULT: 'DEFAULT',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
  PULL_REQUEST: 'PULL_REQUEST',
  EXTERNAL_PULL_REQUEST: 'EXTERNAL_PULL_REQUEST'
};

class Columns {

  constructor(columns) {
    this.columns = columns;

    this.columnsByLabel = columns.reduce((columnsByLabel, column) => {
      if (column.label) {
        columnsByLabel[column.label] = column;
      }

      return columnsByLabel;
    }, {});

    this.columnsByName = columns.reduce((columnsByName, column) => {
      if (column.name) {
        columnsByName[column.name] = column;
      }

      return columnsByName;
    }, {});

    this._getter = columnGetter(columns);
  }

  getAll() {
    return this.columns;
  }

  getIssueColumn(issue) {
    return this._getter(issue);
  }

  findByName(columnName) {
    return this.columnsByName[columnName];
  }

  isSorting(columnName) {
    const column = this.findByName(columnName);

    return column && column.sorting;
  }

  isColumnLabel(label) {
    return label in this.columnsByLabel;
  }

}

Columns.$inject = [ 'config.columns' ];

module.exports = Columns;


function columnGetter(columns) {

  const sortedColumns = columns.slice().sort((a, b) => {
    if (a.label && !b.label) {
      return -1;
    }

    return 1;
  });


  const defaultColumn = columns.find(c => c.type === Types.DEFAULT) || columns[0];

  return function(issue) {

    const column = sortedColumns.find(column => {

      const issueClosed = issue.state === 'closed';

      const columnLabel = column.label;

      const columnClosed = column.closed === true;

      if (issueClosed !== columnClosed) {
        return false;
      }

      if (!columnLabel) {
        return true;
      }

      return issue.labels.find(l => l.name === columnLabel);
    });

    return (column || defaultColumn).name;
  };
}