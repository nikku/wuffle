const LinkTypes = [
  'CLOSES',
  'CLOSED_BY',
  'LINKED_TO',
  'DEPENDS_ON',
  'REQUIRED_BY',
  'CHILD_OF',
  'PARENT_OF'
].reduce((map, el) => {
  map[el] = el;

  return map;
}, {});

const InverseLinkTypes = {
  CLOSES: LinkTypes.CLOSED_BY,
  CLOSED_BY: LinkTypes.CLOSES,
  DEPENDS_ON: LinkTypes.REQUIRED_BY,
  REQUIRED_BY: LinkTypes.DEPENDS_ON,
  CHILD_OF: LinkTypes.PARENT_OF,
  PARENT_OF: LinkTypes.CHILD_OF
};


/**
 * A utility to maintain links
 */
class Links {

  constructor(data) {
    this.links = (data && data.links) || {};
    this.inverseLinks = (data && data.inverseLinks) || {};
  }

  /**
   * Establish a link between source and target with the given type.
   *
   * @param {Number} sourceId
   * @param {Number} targetId
   * @param {string} linkType
   */
  addLink(sourceId, targetId, linkType) {

    if (!LinkTypes[linkType]) {
      throw new Error('unrecognized link type');
    }

    const links = this.links[sourceId] = (this.links[sourceId] || {});

    links[`${targetId}-${linkType}`] = {
      targetId,
      type: linkType
    };

    const inverseLinkType = InverseLinkTypes[linkType];

    if (inverseLinkType) {

      const inverseLinks = this.inverseLinks[targetId] = (this.inverseLinks[targetId] || {});

      inverseLinks[`${sourceId}-${inverseLinkType}`] = {
        targetId: sourceId,
        type: inverseLinkType
      };
    }

  }

  /**
   * Get all links that have the issue as the source.
   *
   * @param {Number} sourceId
   */
  getBySource(sourceId) {
    const links = this.links[sourceId] || {};

    const inverseLinks = this.inverseLinks[sourceId] || {};

    return Object.values({
      ...links,
      ...inverseLinks
    });
  }

  /**
   * Remove primary links that have the issue as the source.
   *
   * @param {Number} sourceId
   *
   * @return {Object} removedLinks
   */
  removeBySource(sourceId) {

    const links = this.links[sourceId] || {};

    for (const [_, link] of Object.entries(links)) {

      const {
        targetId,
        type
      } = link;

      const inverseLinkType = InverseLinkTypes[type];

      if (inverseLinkType) {
        const targetLinks = this.inverseLinks[targetId] || {};

        delete targetLinks[`${sourceId}-${inverseLinkType}`];
      }
    }

    this.links[sourceId] = {};

    return Object.values(links);
  }

  /**
   * Serialize data to JSON so that it can
   * later be loaded via #loadJSON.
   */
  asJSON() {
    const {
      links,
      inverseLinks
    } = this;

    return JSON.stringify({
      links,
      inverseLinks
    });
  }

  /**
   * Load a JSON object, previously serialized via Links#toJSON.
   */
  loadJSON(json) {
    const {
      links,
      inverseLinks
    } = JSON.parse(json);

    this.links = links || {};
    this.inverseLinks = inverseLinks || {};
  }
}


module.exports.Links = Links;

module.exports.LinkTypes = LinkTypes;