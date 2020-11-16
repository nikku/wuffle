
function parseTemporalFilter(str) {

  const regexp = /^(>|>=|<|<=)?(\d{4}-\d{1,2}-\d{1,2})$/;

  const match = regexp.exec(str);

  if (!match) {
    return null;
  }

  const [
    _, // eslint-disable-line
    qualifier,
    dateString
  ] = match;

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

function parseSearch(str) {

  const regexp = /(?:([\w#/&]+)|"([\w#/&\s-.]+)"|([-!]?)([\w]+):(?:([\w-#/&<>=.]+)|"([\w-#/&:. ]+)")?)(?:\s|$)/g;

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