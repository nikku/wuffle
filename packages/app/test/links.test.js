const { expect } = require('chai');

const {
  Links,
  LinkTypes
} = require('../lib/links');


describe('links', function() {

  it('should add link', function() {

    // given
    const links = new Links();

    const link = links.createLink(1, 2, LinkTypes.CLOSES);

    // when
    links.addLink(link);

    // then
    expect(links.getDirect(1)).to.eql({
      [ `2-${LinkTypes.CLOSES}` ]: {
        key: `2-${LinkTypes.CLOSES}`,
        sourceId: 1,
        targetId: 2,
        type: LinkTypes.CLOSES
      }
    });

    expect(links.getInverse(2)).to.eql({
      [ `1-${LinkTypes.CLOSED_BY}` ]: {
        key: `1-${LinkTypes.CLOSED_BY}`,
        sourceId: 2,
        targetId: 1,
        type: LinkTypes.CLOSED_BY
      }
    });
  });


  it('should create link', function() {

    // given
    const links = new Links();

    // when
    const link = links.createLink(1, 2, LinkTypes.CLOSES);

    // then
    expect(link).to.eql({
      key: `2-${LinkTypes.CLOSES}`,
      sourceId: 1,
      targetId: 2,
      type: LinkTypes.CLOSES
    });

  });


  it('should create link + attach meta-data', function() {

    // given
    const links = new Links();

    // when
    const link = links.createLink(1, 2, LinkTypes.CLOSES, { ref: '#foo' });

    // then
    expect(link).to.eql({
      key: `2-${LinkTypes.CLOSES}`,
      sourceId: 1,
      targetId: 2,
      type: LinkTypes.CLOSES,
      ref: '#foo'
    });
  });


  it('should retrieve self links', function() {

    // given
    const links = new Links();

    links.addLink(links.createLink(1, 2, LinkTypes.CLOSES));
    links.addLink(links.createLink(1, 3, LinkTypes.LINKED_TO));
    links.addLink(links.createLink(1, 4, LinkTypes.DEPENDS_ON));
    links.addLink(links.createLink(1, 5, LinkTypes.CHILD_OF));

    // when
    const issueLinks = links.getBySource(1);

    // then
    expectLinked(issueLinks, {
      '2-CLOSES': { targetId: 2, type: LinkTypes.CLOSES },
      '3-LINKED_TO': { targetId: 3, type: LinkTypes.LINKED_TO },
      '4-DEPENDS_ON': { targetId: 4, type: LinkTypes.DEPENDS_ON },
      '5-CHILD_OF': { targetId: 5, type: LinkTypes.CHILD_OF }
    });

  });


  it('should retrieve inverse links', function() {

    // given
    const links = new Links();

    links.addLink(links.createLink(2, 1, LinkTypes.CLOSES));
    links.addLink(links.createLink(3, 1, LinkTypes.LINKED_TO));
    links.addLink(links.createLink(4, 1, LinkTypes.DEPENDS_ON));
    links.addLink(links.createLink(5, 1, LinkTypes.CHILD_OF));

    // when
    const issueLinks = links.getBySource(1);

    // then
    expectLinked(issueLinks, {
      '2-CLOSED_BY': { targetId: 2, type: LinkTypes.CLOSED_BY },
      '3-LINKED_BY': { targetId: 3, type: LinkTypes.LINKED_BY },
      '4-REQUIRED_BY': { targetId: 4, type: LinkTypes.REQUIRED_BY },
      '5-PARENT_OF': { targetId: 5, type: LinkTypes.PARENT_OF }
    });

  });


  it('should remove self links', function() {

    // given
    const links = new Links();

    links.addLink(links.createLink(1, 2, LinkTypes.CLOSES));
    links.addLink(links.createLink(1, 3, LinkTypes.LINKED_TO));
    links.addLink(links.createLink(4, 1, LinkTypes.DEPENDS_ON));
    links.addLink(links.createLink(5, 1, LinkTypes.CHILD_OF));

    // when
    const removed = links.removeBySource(1);

    const issueLinks = links.getBySource(1);

    // then
    expect(removed).to.have.keys([ '2-CLOSES', '3-LINKED_TO' ]);

    expectLinked(issueLinks, {
      '4-REQUIRED_BY': { targetId: 4, type: LinkTypes.REQUIRED_BY },
      '5-PARENT_OF': { targetId: 5, type: LinkTypes.PARENT_OF }
    });

  });


  it('should remove inverse links', function() {

    // given
    const links = new Links();

    links.addLink(links.createLink(1, 2, LinkTypes.CLOSES));
    links.addLink(links.createLink(1, 3, LinkTypes.LINKED_TO));
    links.addLink(links.createLink(4, 1, LinkTypes.DEPENDS_ON));
    links.addLink(links.createLink(5, 1, LinkTypes.CHILD_OF));

    links.removeBySource(4);
    links.removeBySource(5);

    // when
    const issueLinks = links.getBySource(1);

    // then
    expectLinked(issueLinks, {
      '2-CLOSES': { targetId: 2, type: LinkTypes.CLOSES },
      '3-LINKED_TO': { targetId: 3, type: LinkTypes.LINKED_TO }
    });

  });


  it('should export to JSON and restore', function() {

    // given
    const links = new Links();

    links.addLink(links.createLink(1, 2, LinkTypes.CLOSES));
    links.addLink(links.createLink(1, 3, LinkTypes.LINKED_TO));

    // when
    const data = links.asJSON();

    const clonedLinks = new Links();
    clonedLinks.loadJSON(data);

    // when
    const issueLinks = clonedLinks.getBySource(1);

    // then
    expectLinked(issueLinks, {
      '2-CLOSES': { targetId: 2, type: LinkTypes.CLOSES },
      '3-LINKED_TO': { targetId: 3, type: LinkTypes.LINKED_TO }
    });
  });

});


function expectLinked(actualLinks, expectedLinks) {

  const strippedLinks = Object.entries(actualLinks).reduce((links, entry) => {

    const [ key, value ] = entry;

    const {
      targetId,
      type
    } = value;

    links[key] = {
      targetId,
      type
    };

    return links;
  }, {});

  expect(strippedLinks).to.eql(expectedLinks);
}