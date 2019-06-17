export function isOpenOrMergedPull(issue) {

  const {
    state,
    merged
  } = issue;

  return (state === 'open') || merged;
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

export function isLinkedTo(link) {
  const {
    type,
  } = link;

  return type === 'LINKED_TO';
}

export function isRequiredBy(link) {
  const {
    type,
  } = link;

  return type === 'REQUIRED_BY';
}
export function isDependentOn(link) {
  const {
    type,
  } = link;

  return type === 'DEPENDS_ON';
}

export function isParentOf(link) {
  const {
    type,
  } = link;

  return type === 'PARENT_OF';
}

export function isChildOf(link) {
  const {
    type,
  } = link;

  return type === 'CHILD_OF';
}

