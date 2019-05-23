const { expect } = require('chai');

const {
  Links,
  LinkTypes
} = require('../lib/links');


describe('links', function() {

  it('should retrieve self links', function() {

    // given
    const links = new Links();

    links.addLink(1, 2, LinkTypes.CLOSES);
    links.addLink(1, 3, LinkTypes.LINKED_TO);
    links.addLink(1, 4, LinkTypes.DEPENDS_ON);
    links.addLink(1, 5, LinkTypes.CHILD_OF);

    // when
    const issueLinks = links.getBySource(1);

    // then
    expect(issueLinks).to.eql([
      { targetId: 2, type: LinkTypes.CLOSES },
      { targetId: 3, type: LinkTypes.LINKED_TO },
      { targetId: 4, type: LinkTypes.DEPENDS_ON },
      { targetId: 5, type: LinkTypes.CHILD_OF }
    ]);

  });


  it('should retrieve inverse links', function() {

    // given
    const links = new Links();

    links.addLink(2, 1, LinkTypes.CLOSES);
    links.addLink(3, 1, LinkTypes.LINKED_TO);
    links.addLink(4, 1, LinkTypes.DEPENDS_ON);
    links.addLink(5, 1, LinkTypes.CHILD_OF);

    // when
    const issueLinks = links.getBySource(1);

    // then
    expect(issueLinks).to.eql([
      { targetId: 2, type: LinkTypes.CLOSED_BY },
      { targetId: 4, type: LinkTypes.REQUIRED_BY },
      { targetId: 5, type: LinkTypes.PARENT_OF }
    ]);

  });


  it('should remove self links', function() {

    // given
    const links = new Links();

    links.addLink(1, 2, LinkTypes.CLOSES);
    links.addLink(1, 3, LinkTypes.LINKED_TO);
    links.addLink(4, 1, LinkTypes.DEPENDS_ON);
    links.addLink(5, 1, LinkTypes.CHILD_OF);

    links.removeBySource(1);

    // when
    const issueLinks = links.getBySource(1);

    // then
    expect(issueLinks).to.eql([
      { targetId: 4, type: LinkTypes.REQUIRED_BY },
      { targetId: 5, type: LinkTypes.PARENT_OF }
    ]);

  });


  it('should remove inverse links', function() {

    // given
    const links = new Links();

    links.addLink(1, 2, LinkTypes.CLOSES);
    links.addLink(1, 3, LinkTypes.LINKED_TO);
    links.addLink(4, 1, LinkTypes.DEPENDS_ON);
    links.addLink(5, 1, LinkTypes.CHILD_OF);

    links.removeBySource(4);
    links.removeBySource(5);

    // when
    const issueLinks = links.getBySource(1);

    // then
    expect(issueLinks).to.eql([
      { targetId: 2, type: LinkTypes.CLOSES },
      { targetId: 3, type: LinkTypes.LINKED_TO }
    ]);

  });


  it('should JSON.stringify and restore', function() {

    // given
    const links = new Links();

    links.addLink(1, 2, LinkTypes.CLOSES);
    links.addLink(1, 3, LinkTypes.LINKED_TO);

    // when
    const data = JSON.parse(JSON.stringify(links, null, '  '));

    const clonedLinks = new Links(data);

    // when
    const issueLinks = clonedLinks.getBySource(1);

    // then
    expect(issueLinks).to.eql([
      { targetId: 2, type: LinkTypes.CLOSES },
      { targetId: 3, type: LinkTypes.LINKED_TO }
    ]);
  });

});