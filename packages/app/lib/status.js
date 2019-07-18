/**
 * A utility to maintain status
 */
class Status {

  constructor(data) {
    this.statuses = (data && data.statuses) || {};
  }

  addMultipleStatus(combinedStatusesForIssues) {
    const {
      sha,
      statuses
    } = combinedStatusesForIssues;

    const existingStatus = this.statuses[sha] || {};
    let contexts ={};

    statuses.forEach(function(status) {
      const {
        context,
        state,
        target_url
      } = status;

      return contexts[context.toUpperCase()] = {
        target_url,
        state
      };
    });

    if (existingStatus) {
      Object.keys(existingStatus).forEach(function(existingContextKey) {
        if (existingStatus[existingContextKey]) {
          delete existingStatus[existingContextKey];
        }
        existingStatus[existingContextKey] = contexts[existingContextKey];
      });
      this.statuses[sha] = existingStatus;
    } else {
      this.statuses[sha] = contexts;
    }
    const context = this.statuses[sha];

    return {
      sha,
      context
    };
  }

  addStatusEvent(status) {
    const {
      sha,
      key,
      contexts
    } = status;

    const existingStatus = this.statuses[sha] || {};

    if (existingStatus) {
      const existingContext = Object.keys(existingStatus).find(contextKey => contextKey === key);
      if (existingContext) {
        delete existingContext[key];
      }
      existingStatus[key] = contexts[key];
      this.statuses[sha] = existingStatus;
    } else {
      this.statuses[sha] = contexts;
    }
    return this.statuses[sha];
  }


  getStatus(status) {
    return Object.keys(status).map(function (key) {
      const {
        state,
        target_url
      } = status[key];

      return {
        key: key,
        state,
        target_url
      };
    });
  }


  /**
     * Serialize data to JSON so that it can
     * later be loaded via #loadJSON.
     */
  asJSON() {
    const {
      statuses
    } = this;

    return JSON.stringify({
      statuses
    });
  }

  /**
     * Load a JSON object, previously serialized via Links#toJSON.
     */
  loadJSON(json) {
    const {
      statuses
    } = JSON.parse(json);

    this.statuses = statuses || {};
  }

}

module.exports.Status = Status;
