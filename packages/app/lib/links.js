const LinkTypes = [
  'CLOSES',
  'CLOSED_BY',
  'LINKED_TO',
  'LINKED_BY',
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
  PARENT_OF: LinkTypes.CHILD_OF,
  LINKED_TO: LinkTypes.LINKED_BY
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
      throw new Error(`unrecognized link type <${linkType}>`);
    }

    const key = `${targetId}-${linkType}`;

    const links = this.links[sourceId] = (this.links[sourceId] || {});

    const link = {
      targetId,
      type: linkType
    };

    links[key] = link;

    const inverseLinkType = InverseLinkTypes[linkType];

    if (inverseLinkType) {

      const inverseLinks = this.inverseLinks[targetId] = (this.inverseLinks[targetId] || {});

      inverseLinks[`${sourceId}-${inverseLinkType}`] = {
        targetId: sourceId,
        type: inverseLinkType
      };
    }

    return {
      key,
      link
    };
  }

  /**
   * Get all links that have the issue as the source.
   *
   * @param {Number} sourceId
   *
   * @return {Array<Object>} links
   */
  getBySource(sourceId) {
    const links = this.links[sourceId] || {};

    const inverseLinks = this.inverseLinks[sourceId] || {};

    return {
      ...links,
      ...inverseLinks
    };
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

    for (const link of Object.values(links)) {

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

    return links;
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