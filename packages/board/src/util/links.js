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