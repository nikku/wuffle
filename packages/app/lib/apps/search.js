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

  function fuzzyMatches(actual, pattern) {
    return pattern && actual.toLowerCase().startsWith(pattern.toLowerCase());
  }

  const filters = {

    text: function textFilter(text) {

      text = text.toLowerCase();

      return function filterText(issue) {
        const issueText = `#${issue.number} ${issue.title}\n\n${issue.body}`.toLowerCase();

        return issueText.includes(text.toLowerCase());
      };

    },

    is: function isFilter(value) {

      switch (value) {
      case 'assigned':
        return function filterAssigned(issue) {
          return issue.assignees.length;
        };
      case 'unassigned':
        return function filterUnassigned(issue) {
          return issue.assignees.length === 0;
        };
      case 'closed':
        return function filterClosed(issue) {
          return issue.state === 'closed';
        };
      case 'open':
        return function filterOpen(issue) {
          return issue.state === 'open';
        };
      case 'issue':
        return function filterIssue(issue) {
          return !issue.pull_request;
        };
      case 'pull':
        return function filterPull(issue) {
          return issue.pull_request;
        };
      default:
        return filterNoop;
      }
    },

    label: function labelFilter(name) {
      return function filterLabel(issue) {

        const { labels } = issue;

        return labels && labels.some(label => fuzzyMatches(label.name, name));
      };
    },

    repo: function repoFilter(name) {
      return function filterRepo(issue) {

        const { repository } = issue;

        return fuzzyMatches(repository.name, name);
      };
    },

    milestone: function milestoneFilter(name) {

      return function filterMilestone(issue) {

        const {
          milestone
        } = issue;

        return milestone && fuzzyMatches(milestone.title, name);
      };
    },

    assignee: function assigneeFilter(name) {

      return function filterAssignee(issue) {

        const {
          assignees
        } = issue;

        return assignees.some(assignee => fuzzyMatches(assignee.login, name));
      };
    },

    reviewer: function reviewerFilter(name) {

      return function filterReviewer(issue) {

        const {
          requested_reviewers
        } = issue;

        // issues do not have reviewers
        if (!requested_reviewers) {
          return false;
        }

        return requested_reviewers.some(reviewer => fuzzyMatches(reviewer.login, name));
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
        value,
        negated
      } = term;

      if (!value) {
        return noopFilter();
      }

      const factoryFn = filters[qualifier];

      if (!factoryFn) {
        return noopFilter();
      }

      const fn = factoryFn(value);

      if (negated) {
        return function(arg) {
          return !fn(arg);
        };
      }

      return fn;
    });

    return function(issue) {
      return filterFns.every(fn => fn(issue));
    };
  }


  // public API ///////////////////////

  app.getSearchFilter = getSearchFilter;
};