const {
  parseSearch,
  parseTemporalFilter
} = require('../../util');

const {
  issueIdent
} = require('../../util');


/**
 * This app allows you to create a search filter from a given term.
 *
 * @param {import("../../types").Logger} logger
 * @param {import("../../store")} store
 */
function Search(logger, store) {

  const log = logger.child({
    name: 'wuffle:search'
  });

  function filterNoop(issue) {
    return true;
  }

  function noopFilter(value) {
    return filterNoop;
  }

  function includes(actual, pattern) {
    return pattern && actual.toLowerCase().includes(pattern.toLowerCase());
  }

  function fuzzyMatches(actual, pattern) {
    return pattern && actual.toLowerCase().startsWith(pattern.toLowerCase());
  }

  const filters = {

    text: function textFilter(text) {

      text = text.toLowerCase();

      return function filterText(issue) {
        const issueText = `#${issue.number} ${issue.title}\n\n${issue.body}`;

        return includes(issueText, text);
      };

    },

    ref: function referenceFilter(text) {

      const issue = store.getIssueByKey(text);
      const links = issue && store.getIssueLinks(issue);

      const byKey = (links || []).reduce((keyed, link) => {
        keyed[link.target.key] = true;

        return keyed;
      }, {});

      return function filterReferenced(issue) {
        const { key } = issue;

        return key === text || byKey[key];
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

        return (labels || []).some(label => includes(label.name, name));
      };
    },

    repo: function repoFilter(name) {

      return function filterRepoAndOwner(issue) {

        const { repository } = issue;

        return includes(`${repository.owner.login}/${repository.name}`, name);
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

    author: function authorFilter(name) {

      return function filterAuthor(issue) {

        const {
          user
        } = issue;

        return user && fuzzyMatches(user.login, name);
      };
    },

    assignee: function assigneeFilter(name) {

      return function filterAssignee(issue) {

        const {
          assignees
        } = issue;

        return (assignees || []).some(assignee => fuzzyMatches(assignee.login, name));
      };
    },

    reviewer: function reviewerFilter(name) {

      return function filterReviewer(issue) {

        const {
          requested_reviewers,
          reviews
        } = issue;

        // issues do not have reviewers
        if (!requested_reviewers) {
          return false;
        }

        return (
          requested_reviewers.some(reviewer => fuzzyMatches(reviewer.login, name))
        ) || (
          (reviews || []).some(review => fuzzyMatches(review.user.login, name))
        );
      };
    },

    involves: function involvesFilter(name) {

      return function filterInvolves(issue) {
        return (
          filters.assignee(name)(issue) ||
          filters.author(name)(issue) ||
          filters.reviewer(name)(issue)
        );
      };
    },

    created: temporalFilter(function(matchTemporal) {
      return function filterCreated(issue) {
        return matchTemporal(issue.created_at);
      };
    }),

    updated: temporalFilter(function(matchTemporal) {
      return function filterCreated(issue) {
        return matchTemporal(issue.updated_at);
      };
    })
  };

  function temporalFilter(fn) {

    return function filterTemporal(value) {

      const filter = parseTemporalFilter(value);

      // ignore invalid temporal filters
      if (!filter) {
        return filterNoop;
      }

      const {
        date,
        qualifier
      } = filter;

      const dateString = new Date(date).toISOString();

      const matchTemporal = (otherDateString) => {

        switch (qualifier) {
        case '>': return otherDateString > dateString;
        case '>=': return otherDateString >= dateString;
        case '<': return otherDateString < dateString;
        case '<=': return otherDateString <= dateString;

        default: return true;
        }
      };

      return fn(matchTemporal);
    };
  }

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
      try {
        return filterFns.every(fn => fn(issue));
      } catch (err) {
        log.warn({ issue: issueIdent(issue) }, 'filter failed', err);

        return false;
      }
    };
  }


  // api ///////////////////////

  this.getSearchFilter = getSearchFilter;

}

module.exports = Search;
