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

  constructor(columns, log) {
    this.issues = [];

    this.updates = new Updates();

    this.issueOrder = {};
    this.issuesByKey = {};
    this.issuesById = {};

    this.linkedCache = {};

    this.links = new Links();
    this.columns = columns;

    this.log = log;
  }

  getIssueColumn(issue) {
    return this.columns.getForIssue(issue);
  }

  async updateIssue(issue, column) {

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

    issue = this.insertOrUpdateIssue(issue);

    const linkedIssues = this.updateLinks(issue);

    const updatedIssues = [ issue, ...linkedIssues ];

    for (const issue of updatedIssues) {
      this.updates.add(issue.id, {
        type: 'update',
        issue: {
          ...issue,
          links: this.getIssueLinks(issue)
        }
      });
    }

    return issue;
  }

  async updateOrder(issue, before, after, column) {
    const order = this.computeOrder(issue, before, after);

    this.setOrder(issue, order);

    await this.updateIssue(this.getIssueById(issue), column);
  }

  updateLinks(issue) {

    const { id } = issue;

    const repoAndOwner = {
      repo: issue.repository.name,
      owner: issue.repository.owner.login
    };

    const removedLinks = this.links.removeBySource(id);

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

    const unlinkedIssues = Object.keys(removedLinks).reduce((issues, linkId) => {

      if (linkId in createdLinks) {
        return issues;
      }

      const link = removedLinks[linkId];

      const linkedIssue = this.getIssueById(link.targetId);

      if (!linkedIssue) {
        return issues;
      }

      issues.push(linkedIssue);

      return issues;
    }, []);


    const linkedIssues = Object.keys(createdLinks).reduce((issues, linkId) => {

      if (linkId in removedLinks) {
        return issues;
      }

      const link = createdLinks[linkId];

      const linkedIssue = this.getIssueById(link.targetId);

      if (!linkedIssue) {
        return issues;
      }

      issues.push(linkedIssue);

      return issues;
    }, []);

    const changedIssues = [
      ...unlinkedIssues,
      ...linkedIssues
    ];

    if (changedIssues.length) {
      changedIssues.forEach(changed => {
        delete this.linkedCache[changed.id];
      });

      delete this.linkedCache[id];
    }

    return changedIssues;
  }

  insertOrUpdateIssue(issue) {

    const {
      id,
      key,
      order,
      labels
    } = issue;

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
      linked = this.linkedCache[id] = this.links.getBySource(id).map(link => {

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
      key
    } = issue;

    delete this.issuesById[id];
    delete this.issuesByKey[key];
    delete this.linkedCache[id];

    this.issues = this.issues.filter(issue => issue.id !== id);

    const removedLinks = this.links.removeBySource(id);

    Object.values(removedLinks).forEach(link => {
      delete this.linkedCache[link.targetId];
    });

    this.updates.add(id, {
      type: 'remove',
      issue: { id }
    });
  }

  getIssues() {
    return this.issues;
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

  setOrder(issueId, order) {
    this.issueOrder[String(issueId)] = order;
  }

  getOrder(issueId) {
    return this.issueOrder[String(issueId)];
  }

  getIssueById(id) {
    return this.issuesById[id];
  }

  getIssueByKey(key) {
    return this.issuesByKey[key];
  }

  getBoard() {
    // TODO(nikku): cache by column
    return groupBy(this.issues.map(issue => {
      return {
        ...issue,
        links: this.getIssueLinks(issue)
      };
    }), i => i.column);
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
      links
    } = this;

    return JSON.stringify({
      issues,
      lastSync,
      issueOrder,
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
      links
    } = JSON.parse(json);

    this.issues = issues || [];
    this.lastSync = lastSync;
    this.issueOrder = issueOrder || {};

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