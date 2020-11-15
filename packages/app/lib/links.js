const LinkTypes = {
  CLOSES: 'CLOSES',
  CLOSED_BY: 'CLOSED_BY',
  LINKED_TO: 'LINKED_TO',
  LINKED_BY: 'LINKED_BY',
  DEPENDS_ON: 'DEPENDS_ON',
  REQUIRED_BY: 'REQUIRED_BY',
  CHILD_OF: 'CHILD_OF',
  PARENT_OF: 'PARENT_OF'
};

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

  createLink(sourceId, targetId, linkType) {

    const key = `${targetId}-${linkType}`;

    const link = {
      key,
      sourceId,
      targetId,
      type: linkType
    };

    return link;
  }

  /**
   * Establish a link between source and target with the given type.
   *
   * @param {Object} link
   */
  addLink(link) {

    const {
      sourceId,
      targetId,
      type
    } = link;

    if (!LinkTypes[type]) {
      throw new Error(`unrecognized link type <${type}>`);
    }

    const links = this.links[sourceId] = (this.links[sourceId] || {});

    const key = `${targetId}-${type}`;

    links[key] = {
      key,
      sourceId,
      targetId,
      type
    };

    const inverseLinkType = InverseLinkTypes[type];

    if (inverseLinkType) {

      const inverseLinks = this.inverseLinks[targetId] = (this.inverseLinks[targetId] || {});

      const inverseKey = `${sourceId}-${inverseLinkType}`;

      inverseLinks[inverseKey] = {
        key: inverseKey,
        sourceId: targetId,
        targetId: sourceId,
        type: inverseLinkType
      };
    }
  }

  /**
   * Get all links that have the issue as the source.
   *
   * @param {number} sourceId
   *
   * @return {Array<Object>} links
   */
  getBySource(sourceId) {
    const links = this.getDirect(sourceId);

    const inverseLinks = this.getInverse(sourceId);

    return {
      ...links,
      ...inverseLinks
    };
  }

  getDirect(sourceId) {
    return this.links[sourceId] || {};
  }

  getInverse(sourceId) {
    return this.inverseLinks[sourceId] || {};
  }

  /**
   * Remove primary links that have the issue as the source.
   *
   * @param {number} sourceId
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