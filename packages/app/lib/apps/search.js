const {
  parseSearch
} = require('../util');


/**
 * This app allows you to create a search filter from a given term.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  function filterNoop(issue) {
    return true;
  }

  function noopFilter(value) {
    return filterNoop;
  }

  const filters = {

    text: function textFilter(text) {

      text = text.toLowerCase();

      return function filterText(issue) {
        const issueText = `#${issue.number} ${issue.title}\n\n${issue.body}`.toLowerCase();

        return issueText.includes(text);
      };

    },

    is: function isFilter(value) {

      switch (value) {
      case 'assigned':
        return function filterAssigned(issue) {
          return issue.assignees.length;
        };
      case 'unassigned':
        return function filterAssigned(issue) {
          return issue.assignees.length === 0;
        };
      default:
        return filterNoop;
      }
    },

    label: function labelFilter(name) {
      return function filterLabel(issue) {

        const { labels } = issue;

        return labels && labels.some(label => label.name === name);
      };
    },

    milestone: function milestoneFilter(name) {

      return function filterMilestone(issue) {

        const {
          milestone
        } = issue;

        return milestone && milestone.title === name;
      };
    },

    assignee: function assigneeFilter(name) {

      return function filterAssignee(issue) {

        const {
          assignees
        } = issue;

        return assignees.some(assignee => assignee.login === name);
      };
    }
  };

  /**
   * Retrieve a filter function from the given search string.
   *
   * @param {string} search
   *
   * @return {Function}
   */
  function getSearchFilter(search) {

    const terms = parseSearch(search);

    const filterFns = terms.map(term => {
      const {
        qualifier,
        value
      } = term;

      return (filters[qualifier] || noopFilter)(value);
    });

    return function(issue) {
      return filterFns.every(fn => fn(issue));
    };
  }


  // public API ///////////////////////

  app.getSearchFilter = getSearchFilter;
};