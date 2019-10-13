export default class Api {

  moveIssue(id, column, before, after) {
    const body = JSON.stringify({
      id,
      before,
      after,
      column
    });

    const url = this.appURL('/board/issues/move');

    return fetchJSON(url, {
      method: 'POST',
      body
    });
  }

  listCards(filter) {
    const url = this.appURL(`/board/cards${buildQueryString(filter)}`);

    return fetchJSON(url);
  }

  getBoard() {
    const url = this.appURL('/board');

    return fetchJSON(url);
  }

  getLoggedInUser() {
    const url = this.appURL('/login_check');

    return fetchJSON(url).catch(err => null);
  }

  listUpdates(filter, cursor) {
    const url = this.appURL(`/board/updates?cursor=${cursor}${buildQueryString(filter, '&')}`);

    return fetchJSON(url);
  }

  appURL(location) {
    const appBase = '/wuffle';

    return `${appBase}${location}`;
  }

}


// helpers ////////////////////

function fetchJSON(url, options) {
  return fetch(url, {
    ...options,
    credentials: 'include'
  }).then(response => {
    const {
      ok,
      status
    } = response;

    if (!ok) {
      const error = new Error('HTTP ' + status);

      error.status = status;
      error.response = response;

      throw error;
    }

    return response;
  }).then(r => r.text()).then(t => JSON.parse(t));
}


function buildQueryString(filter, separator='?') {
  if (filter) {
    return `${separator}s=${encodeURIComponent(filter)}`;
  } else {
    return '';
  }
}