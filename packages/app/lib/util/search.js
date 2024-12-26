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
 * @param {string} str
 *
 * @return { {
 *   qualifier: string,
 *   value: string|undefined,
 *   exact: boolean,
 *   negated?: boolean
 * }[] }
 */
export function parseSearch(str) {

  const regexp = /(?:([\w#/&]+)|"([\w#/&\s-.]+)"|([-!]?)([\w]+):(?:([\w-#/&@<>=.]+)|"([\w-#/&@:.,; ]+)")?)(?:\s|$)/g;

  const terms = [];

  let match;

  while ((match = regexp.exec(str))) {

    const [
      _,
      text,
      textEscaped,
      negated,
      qualifier,
      qualifierText,
      qualifierTextEscaped
    ] = match;


    const textValue = text || textEscaped;

    if (textValue) {
      terms.push({
        qualifier: 'text',
        value: textValue,
        exact: !!textEscaped
      });
    }

    const qualifierValue = qualifierText || qualifierTextEscaped;

    if (qualifier) {
      terms.push({
        qualifier,
        value: qualifierValue,
        negated: !!negated,
        exact: !!qualifierTextEscaped
      });
    }
  }

  return terms;
}