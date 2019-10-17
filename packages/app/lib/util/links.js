const CHILD_OF = 'CHILD_OF';
const PARENT_OF = 'PARENT_OF';
const DEPENDS_ON = 'DEPENDS_ON';
const REQUIRED_BY = 'REQUIRED_BY';
const LINKED_TO = 'LINKED_TO';
const CLOSES = 'CLOSES';

const phrasesToTypes = {
  'close': CLOSES,
  'closes': CLOSES,
  'closed': CLOSES,
  'fix': CLOSES,
  'fixes': CLOSES,
  'fixed': CLOSES,
  'resolve': CLOSES,
  'resolves': CLOSES,
  'resolved': CLOSES,
  'child of': CHILD_OF,
  'parent of': PARENT_OF,
  'depends on': DEPENDS_ON,
  'needs': DEPENDS_ON,
  'requires': DEPENDS_ON,
  'required by': REQUIRED_BY,
  'needed by': REQUIRED_BY,
  'related to': LINKED_TO
};

const linkTypes = {
  CHILD_OF,
  PARENT_OF,
  DEPENDS_ON,
  REQUIRED_BY,
  LINKED_TO,
  CLOSES
};


function findLinks(issue, types) {

  const {
    title,
    body
  } = issue;

  const text = [ title, body ].join('\n --- \n').toLowerCase();

  const namePart = '[a-z0-9-]+';

  const typePart = '(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved|child of|parent of|depends on|needs|requires|required by|needed by|related to)\\s+';
  const issueShortHandPart = `(?:(${namePart})\\/(${namePart}))?#(\\d+)`;
  const issueUrlPart = `https:\\/\\/github.com\\/(${namePart})\\/(${namePart})\\/(?:issues|pull)\\/(\\d+)`;
  const issuePart = `(?:${issueShortHandPart}|${issueUrlPart})`;
  const separatorPart = '(?:[\\s,]+(?:and[\\s,]+)?)';

  const pattern = new RegExp(`${typePart}${issuePart}`, 'ig');
  const continuationPattern = new RegExp(`^${separatorPart}${issuePart}`, 'i');

  const links = [];

  let match, continuationMatch;

  // find all links with the given types

  while ((match = pattern.exec(text))) {

    const type = phrasesToTypes[match[1]];

    let issueMatches = match.slice(2);

    let continuationIdx = match.index + match[0].length;

    do {
      continuationMatch = continuationPattern.exec(text.slice(continuationIdx));

      if (continuationMatch) {
        issueMatches = [
          ...issueMatches,
          ...continuationMatch.slice(1)
        ];

        continuationIdx += continuationMatch[0].length;
      }

    } while (continuationMatch);


    for (let i = 0; i < issueMatches.length / 3; i++) {

      const offset = i * 3;

      if (typeof issueMatches[offset + 2] === 'undefined') {
        continue;
      }

      const owner = issueMatches[offset];
      const repo = issueMatches[offset + 1];
      const number = parseInt(issueMatches[offset + 2], 10);

      const link = owner ? {
        type,
        number,
        owner,
        repo
      } : {
        type,
        number
      };

      links.push(link);
    }
  }

  if (typeof types !== 'undefined') {
    return filterLinks(links, types);
  }

  return links;
}

function filterLinks(links, filterMap) {

  if (typeof filterMap === 'string') {
    filterMap = {
      [ filterMap ] : true
    };
  }

  return links.filter(l => l.type in filterMap);
}

module.exports.findLinks = findLinks;

module.exports.linkTypes = linkTypes;