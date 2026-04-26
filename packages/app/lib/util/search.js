export function parseTemporalFilter(str) {

  const regexp = /^(?:(>|>=|<|<=)?(\d{4}-\d{1,2}-\d{1,2})|@(today|last_week|last_month))$/;

  const match = regexp.exec(str);

  if (!match) {
    return null;
  }

  const [
    _,
    qualifier,
    dateString,
    range
  ] = match;

  if (range) {

    const rangeMap = {
      'today': startOfDay(Date.now()),
      'last_week': startOfDay(Date.now() - 1000 * 60 * 60 * 24 * 7),
      'last_month': startOfDay(Date.now() - 1000 * 60 * 60 * 24 * 30)
    };

    return {
      qualifier: '>=',
      date: rangeMap[range]
    };
  }

  const date = Date.parse(dateString);

  if (isNaN(date)) {
    return null;
  }

  return {
    qualifier,
    date
  };
}

/**
 * @param {number} time
 *
 * @return {number}
 */
function startOfDay(time) {
  const date = new Date(time);

  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

/**
 * @typedef { {
 *   qualifier: string,
 *   exact?: boolean,
 *   negated?: boolean,
 *   value?: string|SearchTerm[],
 * } } SearchTerm
 */

/**
 * @param {string} str
 *
 * @return {SearchTerm}
 */
export function parseSearch(str) {

  const regexp = /(\()|(\))|(OR)\s*|(AND)\s|([-!]|NOT\s+)?(?:"([^"]+)"|([\w#/&]+)(?:(:)(?:([\w-#/&@<>=.]+)|"([^"]+)")?)?)/g;

  const stack = [ {
    qualifier: 'and',
    value: /** @type {SearchTerm[]} */ ([])
  } ];

  let match;

  while ((match = regexp.exec(str))) {

    const term = stack[stack.length - 1];

    const [
      _,
      openGroup,
      closeGroup,
      or,
      and,
      negated,
      textEscaped,
      text,
      qualifier,
      qualifierText,
      qualifierTextEscaped
    ] = match;

    if (openGroup) {
      const groupTerm = {
        qualifier: 'and',
        value: [],
        group: true
      };

      stack.push(groupTerm);
      term.value.push(groupTerm);

      continue;
    }

    if (closeGroup) {

      let lastTerm;

      do {
        lastTerm = stack.pop();
      } while (!lastTerm.group);

      continue;
    }

    if (and) {

      // default semantics
      continue;
    }

    if (or) {
      const nextTerm = {
        qualifier: 'and',
        value: []
      };

      const groupTerm = {
        qualifier: 'or',
        value: [
          {
            qualifier: 'and',
            value: term.value.slice()
          },
          nextTerm
        ]
      };

      // replace existing terms with <OR> term
      term.value.length = 0;
      term.value.push(groupTerm);

      stack.push(nextTerm);

      continue;
    }

    const textValue = text || textEscaped;
    const qualifierValue = qualifierText || qualifierTextEscaped;

    if (qualifier) {
      term.value.push({
        qualifier: textValue,
        value: qualifierValue,
        negated: !!negated,
        exact: !!qualifierTextEscaped
      });
    } else {
      term.value.push({
        qualifier: 'text',
        value: textValue,
        exact: !!textEscaped,
        negated: !!negated
      });
    }
  }

  return collapseSearch(stack[0]);
}

/**
 * @param {SearchTerm} term
 *
 * @return {SearchTerm}
 */
export function collapseSearch(term) {

  if (![ 'and', 'or' ].includes(term.qualifier)) {
    return term;
  }

  const nestedTerms = /** @type {SearchTerm[]} */ (term.value);

  const nestedTermsCollapsed = nestedTerms.map(collapseSearch);

  if (term.qualifier === 'and' && nestedTermsCollapsed.length === 1) {
    return nestedTermsCollapsed[0];
  }

  return {
    ...term,
    value: nestedTermsCollapsed
  };
}