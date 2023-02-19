function hasModifier(event) {
  const {
    ctrlKey,
    shiftKey,
    altKey,
    metaKey
  } = event;

  return ctrlKey || altKey || shiftKey || metaKey;
}

function isGlobal(event) {
  return event.target === document.body;
}

export function isFindShortcut(event) {

  if (event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'k') {
    return true;
  }

  if (!isGlobal(event) || hasModifier(event)) {
    return false;
  }

  return event.key === 'f';
}

export function isNewIssueShortcut(event) {

  if (!isGlobal(event) || hasModifier(event)) {
    return false;
  }

  return event.key === 'n';
}

export function isLoginShortcut(event) {

  if (!isGlobal(event) || hasModifier(event)) {
    return false;
  }

  return event.key === 'l';
}

export function isApplyFilterClick(event) {

  const {
    shiftKey,
    altKey
  } = event;

  return shiftKey || altKey;
}

export function isAddFilterClick(event) {

  const {
    shiftKey
  } = event;

  return shiftKey;
}