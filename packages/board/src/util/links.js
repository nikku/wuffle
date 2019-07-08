export function isOpenOrMergedPull(issue) {

  const {
    state,
    merged
  } = issue;

  return (state === 'open') || merged;
}

export function isOpenPullOrMergedPull(issue) {
  const {
    state,
    merged,
    pull_request
  } = issue;

  return (pull_request && (state === 'open')) || merged;
}

export function isClosingLink(link) {
  const {
    type,
  } = link;

  return type === 'CLOSES';
}

export function isClosedByLink(link) {
  const {
    type
  } = link;

  return type === 'CLOSED_BY';
}