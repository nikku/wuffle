
function parseTemporalFilter(str) {

  const regexp = /^(?:(>|>=|<|<=)?(\d{4}-\d{1,2}-\d{1,2})|@(today|last_week|last_month))$/;

  const match = regexp.exec(str);

  if (!match) {
    return null;
  }

  const [
    _, // eslint-disable-line
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

module.exports.parseTemporalFilter = parseTemporalFilter;

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

function parseSearch(str) {

  const regexp = /(?:([\w#/&]+)|"([\w#/&\s-.]+)"|([-!]?)([\w]+):(?:([\w-#/&@<>=.]+)|"([\w-#/&@:.,; ]+)")?)(?:\s|$)/g;

  const terms = [];

  let match;

  while ((match = regexp.exec(str))) {

    const [
      _, // eslint-disable-line
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
        value: textValue
      });
    }

    const qualifierValue = qualifierText || qualifierTextEscaped;

    if (qualifier) {
      terms.push({
        qualifier,
        value: qualifierValue,
        negated: !!negated
      });
    }
  }

  return terms;
}

module.exports.parseSearch = parseSearch;