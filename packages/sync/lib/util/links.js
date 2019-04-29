const CHILD_OF = 'CHILD_OF';
const PARENT_OF = 'PARENT_OF';
const REQUIRES = 'REQUIRES';
const REQUIRED_BY = 'REQUIRED_BY';
const RELATED_TO = 'RELATED_TO';
const CLOSES = 'CLOSES';

const phrasesToTypes = {
  'closes': CLOSES,
  'fixes': CLOSES,
  'child of': CHILD_OF,
  'parent of': PARENT_OF,
  'depends on': REQUIRES,
  'needs': REQUIRES,
  'requires': REQUIRES,
  'required by': REQUIRED_BY,
  'needed by': REQUIRED_BY,
  'related to': RELATED_TO
};

const linkTypes = {
  CHILD_OF,
  PARENT_OF,
  REQUIRES,
  REQUIRED_BY,
  RELATED_TO,
  CLOSES
};


function findLinks(issue, types) {

  const {
    title,
    body
  } = issue;

  const text = [ title, body ].join('\n --- \n').toLowerCase();

  const pattern = /(closes|fixes|child of|parent of|depends on|needs|requires|required by|needed by|related to)\s+(?:(?:([a-z0-9-]+)\/([a-z0-9-]+))?#(\d+)|https:\/\/github.com\/([a-z0-9-]+)\/([a-z0-9-]+)\/(?:issues|pull)\/(\d+))/g;

  const links = [];

  let match;

  // find all links with the given types

  while ((match = pattern.exec(text))) {

    const type = phrasesToTypes[match[1]];
    const number = parseInt(match[4] || match[7], 10);
    const owner = match[2] || match[5];
    const repo = match[3] || match[6];

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