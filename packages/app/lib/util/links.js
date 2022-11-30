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
  'connect to': CHILD_OF,
  'connected to': CHILD_OF,
  'connects to': CHILD_OF,
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

  const typePart = '(close|closes|closed|connect to|connected to|connects to|fix|fixes|fixed|resolve|resolves|resolved|child of|parent of|depends on|needs|requires|required by|needed by|related to):?\\s+';
  const issueShortHandPart = `(?:(${namePart})\\/(${namePart}))?#(\\d+)`;
  const issueUrlPart = `https:\\/\\/github.com\\/(${namePart})\\/(${namePart})\\/(?:issues|pull)\\/(\\d+)((?:[/][\\w-/]+)?(?:[?][\\w-=&]+)?(?:[#][\\w-]+)?)`;
  const issuePart = `(?:${issueShortHandPart}|${issueUrlPart})`;
  const separatorPart = '(?:[\\s,]+(?:and[\\s,]+)?)';
  const taskPart = '[-*]{1}\\s*\\[[x ]{1}\\]\\s+.*';

  const pattern = new RegExp(`${typePart}${issuePart}`, 'ig');
  const continuationPattern = new RegExp(`^${separatorPart}${issuePart}`, 'i');
  const taskPattern = new RegExp(`${taskPart}`, 'img');

  const links = [];

  let match, continuationMatch;

  const issueMatches = [];

  /*
   * match = [
   *   short_org, short_repo, short_number,
   *   long_org, long_repo, long_number,
   *   ref
   * ]
   */

  while ((match = pattern.exec(text))) {

    const type = phrasesToTypes[match[1]];

    issueMatches.push([ type, match.slice(2) ]);

    let continuationIdx = match.index + match[0].length;

    /*
     * continuationMatch = [
     *   short_org, short_repo, short_number,
     *   long_org, long_repo, long_number,
     *   ref
     * ]
     */

    do {
      continuationMatch = continuationPattern.exec(text.slice(continuationIdx));

      if (continuationMatch) {
        issueMatches.push([ type, continuationMatch.slice(1) ]);

        continuationIdx += continuationMatch[0].length;
      }

    } while (continuationMatch);

  }

  while ((match = taskPattern.exec(text))) {

    const text = match[0];

    let issueMatch;

    const issuePattern = new RegExp(`${issuePart}`, 'ig');

    while ((issueMatch = issuePattern.exec(text))) {
      issueMatches.push([ PARENT_OF, issueMatch.slice(1) ]);
    }
  }

  for (const issueMatch of issueMatches) {

    const [ type, issueParts ] = issueMatch;

    const owner = issueParts[0] || issueParts[3];
    const repo = issueParts[1] || issueParts[4];
    const number = parseInt(issueParts[2] || issueParts[5], 10);

    const ref = issueParts[6];

    const link = {
      type,
      number,
      ...(owner
        ? {
          owner,
          repo
        }
        : { }
      ),
      ...(ref
        ? { ref }
        : { }
      )
    };

    links.push(link);
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
