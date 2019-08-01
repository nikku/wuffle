const {
  groupBy
} = require('min-dash');

const {
  issueIdent
} = require('./util');

const {
  findLinks
} = require('./util/links');

const { Links } = require('./links');


class Store {

  constructor(columns, logger) {
    this.log = logger.child({
      name: 'wuffle:store'
    });

    this.columns = columns;

    this.issues = [];
    this.issueOrder = {};
    this.issueColumn = {};

    this.updates = new Updates();
    this.links = new Links();

    this.issuesByKey = {};
    this.issuesById = {};

    this.linkedCache = {};
    this.boardCache = null;
  }

  computeIssueColumn(issue) {
    return this.columns.getIssueColumn(issue);
  }

  async updateIssue(issue, newColumn, newOrder) {

    const t = Date.now();

    const {
      id,
      key,
      repository
    } = issue;

    if (!id) {
      throw new Error('{ id } required');
    }

    if (!key) {
      throw new Error('{ key } required');
    }

    if (!repository) {
      throw new Error('{ repository } required');
    }

    const ident = issueIdent(issue);

    this.log.debug({
      issue: ident,
      newColumn,
      newOrder
    }, 'issue update');

    const {
      touchedIssues,
      links
    } = this.updateLinks(issue);

    const column = newColumn || this.computeIssueColumn(issue).name;

    // automatically compute desired order unless
    // the order is provided by the user
    //
    // this ensures the board is automatically pre-sorted
    // as links are being created and removed on GitHub
    const order = newOrder || this.computeLinkedOrder(
      issue,
      column,
      links
    );

    issue = this.insertOrUpdateIssue({
      ...issue,
      order,
      column
    });

    const updatedIssues = [ ...touchedIssues, issue ];

    for (const issue of updatedIssues) {
      this.updates.add(issue.id, {
        type: 'update',
        issue: {
          ...issue,
          links: this.getIssueLinks(issue)
        }
      });
    }

    this.log.info({ issue: ident, column, order, t: Date.now() - t }, 'issue updated');

    return issue;
  }

  updateIssueOrder(issue, before, after, newColumn) {

    const {
      id,
      key
    } = issue;

    const newOrder = this.computeOrder(before, after, this.getIssueOrder(id));

    this.log.debug({
      issue: key,
      newOrder,
      newColumn
    }, 'update issue order');

    return this.updateIssue(issue, newColumn, newOrder);
  }

  computeLinkedOrder(issue, column, links) {

    const {
      id
    } = issue;

    const beforeTypes = {
      REQUIRED_BY: 1,
      CLOSES: 1,
      CHILD_OF: 1
    };

    const afterTypes = {
      DEPENDS_ON: 1,
      CLOSED_BY: 1,
      PARENT_OF: 1
    };

    let before, after;

    if (this.columns.isSorting(column)) {
      for (const link of Object.values(links)) {

        const {
          type,
          targetId
        } = link;

        const target = this.getIssueById(targetId);

        if (target && target.column === column) {

          if (beforeTypes[type]) {
            before = before && before.order < target.order ? before : target;
          }

          if (afterTypes[type]) {
            after = after && after.order > target.order ? after : target;
          }
        }
      }
    }

    const currentOrder = this.getIssueOrder(id);
    const currentColumn = this.getIssueColumn(id);

    if (!before && !after) {

      // keep order if issue stays within column
      if (column === currentColumn) {
        return currentOrder;
      }

      // insert on top of column
      before = this.issues[0];
    }

    return this.computeOrder(before && before.id, after && after.id, currentOrder);
  }

  updateLinks(issue) {

    const { id } = issue;

    const repoAndOwner = {
      repo: issue.repository.name,
      owner: issue.repository.owner.login
    };

    const removedLinks = this.links.removeBySource(id);

    const inverseLinks = this.links.getBySource(id);

    const createdLinks = findLinks(issue).reduce((map, link) => {

      // add repository meta-data, if missing
      link = {
        ...repoAndOwner,
        ...link
      };

      const {
        owner,
        repo,
        number,
        type: linkType
      } = link;

      const key = `${owner}/${repo}#${number}`;

      const linkedIssue = this.getIssueByKey(key);

      if (linkedIssue) {

        const { id: linkedId } = linkedIssue;

        const { key, link } = this.links.addLink(id, linkedId, linkType);

        map[key] = link;
      }

      return map;
    }, {});

    const newLinks = {
      ...inverseLinks,
      ...createdLinks
    };

    const allLinks = {
      ...newLinks,
      ...removedLinks
    };

    const touchedIssues = Object.keys(allLinks).reduce((issues, linkId) => {

      const { targetId } = allLinks[linkId];

      const linkedIssue = this.getIssueById(targetId);

      if (!linkedIssue) {
        return issues;
      }

      issues.push(linkedIssue);

      return issues;
    }, []);

    if (touchedIssues.length) {
      touchedIssues.forEach(changed => {
        delete this.linkedCache[changed.id];
      });

      delete this.linkedCache[id];
    }

    this.boardCache = null;

    return {
      touchedIssues,
      links: newLinks
    };
  }

  insertOrUpdateIssue(issue) {

    const {
      id,
      key,
      order,
      column,
      labels
    } = issue;

    // update column and order
    this.setIssueOrder(id, order);
    this.setIssueColumn(id, column);

    // attach column label meta-data
    issue = {
      ...issue,
      labels: labels.map(label => {

        if (this.columns.isColumnLabel(label.name)) {
          return {
            ...label,
            column_label: true
          };
        }

        return label;
      })
    };

    const existingIssue = this.issuesById[id];

    if (existingIssue) {
      delete this.issuesByKey[existingIssue.key];

      // merge issue with existing data as we may receive a update
      // (i.e. issue data for a pull request) only
      issue = {
        ...existingIssue,
        ...issue
      };
    }

    this.issuesById[id] = issue;
    this.issuesByKey[key] = issue;

    const issues = this.issues;

    // ensure we do not double add issues
    const currentIdx = issues.findIndex(issue => issue.id === id);

    if (currentIdx !== -1) {
      // remove existing issue
      issues.splice(currentIdx, 1);
    }

    const insertIdx = issues.findIndex(issue => issue.order > order);

    if (insertIdx !== -1) {
      issues.splice(insertIdx, 0, issue);
    } else {
      issues.push(issue);
    }

    return issue;
  }

  getIssueLinks(issue) {
    const { id } = issue;

    let linked = this.linkedCache[id];

    if (!linked) {
      linked = this.linkedCache[id] = Object.values(this.links.getBySource(id)).map(link => {

        const {
          type,
          targetId
        } = link;

        return {
          type,
          target: this.getIssueById(targetId)
        };
      }).filter(link => link.target);
    }

    return linked;
  }

  async removeIssueById(id) {

    const issue = this.getIssueById(id);

    if (!issue) {
      return;
    }

    this.log.info({ issue: issueIdent(issue) }, 'remove');

    const {
      key,
      repository
    } = issue;

    delete this.issuesById[id];
    delete this.issuesByKey[key];
    delete this.linkedCache[id];

    delete this.issueOrder[id];
    delete this.issueColumn[id];

    this.boardCache = null;

    this.issues = this.issues.filter(issue => issue.id !== id);

    const removedLinks = this.links.removeBySource(id);

    Object.values(removedLinks).forEach(link => {
      delete this.linkedCache[link.targetId];
    });

    this.updates.add(id, {
      type: 'remove',
      // dummy placeholder for removed issues
      issue: {
        id,
        key,
        repository,
        links: []
      }
    });
  }

  getIssues() {
    return this.issues;
  }

  computeOrder(beforeId, afterId, currentOrder) {

    const beforeOrder = beforeId && this.issueOrder[beforeId];
    const afterOrder = afterId && this.issueOrder[afterId];

    if (beforeOrder && afterOrder) {
      return (
        typeof currentOrder === 'number' && currentOrder < beforeOrder && currentOrder > afterOrder
          ? currentOrder
          : (beforeOrder + afterOrder) / 2
      );
    }

    if (beforeOrder) {
      return (
        typeof currentOrder === 'number' && currentOrder < beforeOrder
          ? currentOrder
          : beforeOrder - 99999.89912
      );
    }

    if (afterOrder) {
      return (
        typeof currentOrder === 'number' && currentOrder > afterOrder
          ? currentOrder
          : afterOrder + 99999.89912
      );
    }

    // a good start :)
    return 779999.89912;
  }

  setIssueColumn(issueId, column) {
    this.issueColumn[String(issueId)] = column;
  }

  getIssueColumn(issueId) {
    return this.issueColumn[String(issueId)];
  }

  setIssueOrder(issueId, order) {
    this.issueOrder[String(issueId)] = order;
  }

  getIssueOrder(issueId) {
    return this.issueOrder[String(issueId)];
  }

  getIssueById(id) {
    return this.issuesById[id];
  }

  getIssueByKey(key) {
    return this.issuesByKey[key];
  }

  getBoard() {

    const boardCache = this.boardCache = (
      this.boardCache || groupBy(this.issues.map(issue => {
        return {
          ...issue,
          links: this.getIssueLinks(issue)
        };
      }), i => i.column)
    );

    return boardCache;
  }

  getUpdateCursor() {
    return this.updates.getHead().id;
  }

  getUpdates(cursor) {
    return this.updates.getSince(cursor);
  }

  /**
   * Serialize data to JSON so that it can
   * later be loaded via #loadJSON.
   */
  asJSON() {

    const {
      issues,
      lastSync,
      issueOrder,
      issueColumn,
      links
    } = this;

    return JSON.stringify({
      issues,
      lastSync,
      issueOrder,
      issueColumn,
      links: links.asJSON()
    });
  }

  /**
   * Load a JSON object, previously serialized via Store#toJSON.
   */
  loadJSON(json) {

    const {
      issues,
      lastSync,
      issueOrder,
      issueColumn,
      links
    } = JSON.parse(json);

    this.issues = issues || [];
    this.lastSync = lastSync;
    this.issueOrder = issueOrder || {};
    this.issueColumn = issueColumn || {};

    if (links) {
      this.links.loadJSON(links);
    }

    this.issuesById = this.issues.reduce((map, issue) => {
      map[issue.id] = issue;

      return map;
    }, {});

    this.issuesByKey = this.issues.reduce((map, issue) => {
      map[issue.key] = issue;

      return map;
    }, {});
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