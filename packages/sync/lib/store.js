const {
  groupBy
} = require('min-dash');

const {
  issueIdent
} = require('./util');


class Store {

  constructor(columns, log) {
    this.issues = [];

    this.updates = new Updates();

    this.issueOrder = {};

    this.columns = columns;

    this.log = log;
  }

  getIssueColumn(issue) {
    return this.columns.getForIssue(issue);
  }

  updateIssue(issue, column) {

    const { id } = issue;

    let order = this.getOrder(id);

    if (!order) {
      const lastIssue = this.issues[this.issues.length - 1];

      order = this.computeOrder(id, null, lastIssue && lastIssue.id);

      this.setOrder(id, order);
    }

    column = column || this.getIssueColumn(issue);

    issue = {
      ...issue,
      order,
      column
    };

    this.log.info({ issue: issueIdent(issue), column, order }, 'update');

    this.insertOrUpdateIssue(issue);

    this.updates.add(issue.id, { type: 'update', issue });
  }

  updateOrder(issue, before, after, column) {
    const order = this.computeOrder(issue, before, after);

    this.setOrder(issue, order);

    this.updateIssue(this.getIssue({ id: issue }), column);
  }

  insertOrUpdateIssue(issue) {

    const {
      id,
      order
    } = issue;

    const issues = this.issues;

    // ensure we do not double add issues
    const currentIdx = issues.findIndex(issue => issue.id === id);

    if (currentIdx !== -1) {
      issues.splice(currentIdx, 1);
    }

    const insertIdx = issues.findIndex(issue => issue.order > order);

    if (insertIdx !== -1) {
      issues.splice(insertIdx, 0, issue);
    } else {
      issues.push(issue);
    }
  }

  removeIssue(issue) {
    const {
      id
    } = issue;

    this.log.info({ issue: issueIdent(issue) }, 'remove');

    this.issues = this.issues.filter(issue => issue.id === id);

    this.updates.add(id, { type: 'remove', issue });
  }

  getIssues(filter) {
    return this._get(this.issues, filter);
  }

  getIssue(filter) {
    const issues = this._get(this.issues, filter);

    if (issues.length > 1) {
      throw new Error('more than one issue found');
    }

    return issues[0];
  }

  computeOrder(issue, before, after) {

    const beforeOrder = before && this.issueOrder[before];
    const afterOrder = after && this.issueOrder[after];

    if (beforeOrder && afterOrder) {
      return (beforeOrder + afterOrder) / 2;
    }

    if (beforeOrder) {
      return beforeOrder - 99999.89912;
    }

    if (afterOrder) {
      return afterOrder + 99999.89912;
    }

    // a good start :)
    return -9999999999.89912;
  }

  setOrder(issue, order) {
    this.issueOrder[String(issue)] = order;
  }

  getOrder(issue) {
    return this.issueOrder[String(issue)];
  }

  _get(array, filter) {
    if (!filter) {
      return array;
    }

    return array.filter(item => match(item, filter));
  }

  getBoard() {
    return groupBy(this.issues, i => i.column);
  }

  updateIssues(openIssues) {

    openIssues.map(issue => {
      this.updateIssue(issue);
    });
  }

  getUpdateHead() {
    return this.updates.getHead();
  }

  getUpdates(cursor) {
    return this.updates.getSince(cursor);
  }
}


class Updates {

  constructor() {

    this.counter = 7841316;
    this.head = null;
    this.updateMap = {};
    this.trackedMap = {};
    this.list = [];

    // dummy update
    this.add({});
  }

  nextID() {
    return String(this.counter++);
  }

  getHead() {
    return this.head;
  }

  add(trackBy, update) {

    if (typeof update === 'undefined') {
      update = trackBy;
      trackBy = null;
    }

    const head = this.getHead();
    const id = this.nextID();

    const next = {
      id,
      next: null,
      ...update
    };

    if (trackBy) {
      const existing = this.trackedMap[trackBy];

      if (existing) {
        existing.tombstone = true;
      }

      this.trackedMap[trackBy] = next;
    }

    if (head) {
      head.next = next;
    }

    this.list.push(next);

    this.updateMap[id] = next;

    this.head = next;
  }

  getSince(id) {

    let update = (this.updateMap[id] || this.list[0]).next;

    const updates = [];

    while (update) {

      const {
        next,
        tombstone,
        ...actualUpdate
      } = update;

      if (!tombstone) {
        updates.push(actualUpdate);
      }

      update = update.next;
    }

    return updates;
  }

}

module.exports = Store;

// helpers //////////

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function match(properties, filter) {

  return Object.entries(filter).reduce((accumulator, entry) => {
    const [ key, value ] = entry;

    if (isObject(value)) {
      if (!isObject(properties[ key ])) {
        return false;
      }

      return match(properties[ key ], value);
    }

    return accumulator && (properties[ key ] === value);

  }, true);

}