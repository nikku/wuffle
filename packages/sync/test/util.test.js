const {
  expect
} = require('chai');

const {
  findLinks,
  linkTypes,
  parseSearch
} = require('../lib/util');

const {
  PARENT_OF,
  CHILD_OF,
  REQUIRES,
  REQUIRED_BY,
  RELATED_TO,
  CLOSES
} = linkTypes;


describe('util', function() {

  describe('findLinks', function() {

    it('should recognize requires', function() {

      // given
      const issue = createIssue(
        'FOO (needs #1)',
        'Requires #2, needs #3, depends on #4, ' +
        'requires foo/bar#5, ' +
        'requires https://github.com/foo/bar/issues/6\n' +
        'requires https://github.com/foo/bar/pull/1828\n' +
        'requires https://github.com/foo/bar/issues/new ' +
        'requires https://github.com/foo ' +
        'requires https://github.com/foo/bar'
      );

      // when
      const links = findLinks(issue);

      // then
      expect(links).to.eql([
        {
          type: REQUIRES, number: 1
        },
        {
          type: REQUIRES, number: 2
        },
        {
          type: REQUIRES, number: 3
        },
        {
          type: REQUIRES, number: 4
        },
        {
          type: REQUIRES, number: 5,
          owner: 'foo', repo: 'bar',
        },
        {
          type: REQUIRES, number: 6,
          owner: 'foo', repo: 'bar'
        },
        {
          type: REQUIRES, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize required-by', function() {

      // given
      const issue = createIssue(
        'FOO (required by #1)',
        'Required by #2, needed by #3 ' +
        'required by foo/bar#5, ' +
        'required by https://github.com/foo/bar/issues/6\n' +
        'required by https://github.com/foo/bar/pull/1828\n' +
        'required by https://github.com/foo/bar/issues/new ' +
        'required by https://github.com/foo ' +
        'required by https://github.com/foo/bar'
      );

      // when
      const links = findLinks(issue);

      // then
      expect(links).to.eql([
        {
          type: REQUIRED_BY, number: 1
        },
        {
          type: REQUIRED_BY, number: 2
        },
        {
          type: REQUIRED_BY, number: 3
        },
        {
          type: REQUIRED_BY, number: 5,
          owner: 'foo', repo: 'bar'
        },
        {
          type: REQUIRED_BY, number: 6,
          owner: 'foo', repo: 'bar'
        },
        {
          type: REQUIRED_BY, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize closes', function() {

      // given
      const issue = createIssue(
        'FOO (closes #1)',
        'Fixes #2, closes #3' +
        'closes foo/bar#5, ' +
        'closes https://github.com/foo/bar/issues/6\n' +
        'closes https://github.com/foo/bar/pull/1828\n' +
        'closes https://github.com/foo/bar/issues/new ' +
        'closes https://github.com/foo ' +
        'closes https://github.com/foo/bar'
      );

      // when
      const links = findLinks(issue);

      // then
      expect(links).to.eql([
        {
          type: CLOSES, number: 1
        },
        {
          type: CLOSES, number: 2
        },
        {
          type: CLOSES, number: 3
        },
        {
          type: CLOSES, number: 5,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 6,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize related-to', function() {

      // given
      const issue = createIssue(
        'FOO',
        'Related to #2, related to https://github.com/foo/bar/pull/1828'
      );

      // when
      const links = findLinks(issue);

      // then
      expect(links).to.eql([
        {
          type: RELATED_TO, number: 2
        },
        {
          type: RELATED_TO, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize parent / child of', function() {

      // given
      const issue = createIssue(
        'FOO (child of #1)',
        'Parent of #2, parent of https://github.com/foo/bar/pull/1828'
      );

      // when
      const links = findLinks(issue);

      // then
      expect(links).to.eql([
        {
          type: CHILD_OF, number: 1
        },
        {
          type: PARENT_OF, number: 2
        },
        {
          type: PARENT_OF, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should find by type', function() {

      // given
      const issue = createIssue(
        'FOO (child of #1)',
        'Parent of #2'
      );

      // when
      const links = findLinks(issue, PARENT_OF);

      // then
      expect(links).to.eql([
        { type: PARENT_OF, number: 2 }
      ]);

    });


    it('should find by types', function() {

      // given
      const issue = createIssue(
        'FOO (child of #1)',
        'Parent of #2\n' +
        'Related to #12'
      );

      // when
      const links = findLinks(issue, { PARENT_OF, RELATED_TO });

      // then
      expect(links).to.eql([
        { type: PARENT_OF, number: 2 },
        { type: RELATED_TO, number: 12 }
      ]);

    });

  });


  describe('parseSearch', function() {

    it('should parse terms', function() {

      const searchString = [
        'is:open',
        'asdsad',
        'milestone:"FOO BAR"',
        '"FOO BAR"',
        'milestone:12asd',
        'milestone:',
        'label:"in progress"'
      ].join(' ');

      // when
      const search = parseSearch(searchString);

      // then
      expect(search).to.eql([
        { qualifier: 'is', value: 'open' },
        { qualifier: 'text', value: 'asdsad' },
        { qualifier: 'milestone', value: 'FOO BAR' },
        { qualifier: 'text', value: 'FOO BAR' },
        { qualifier: 'milestone', value: '12asd' },
        { qualifier: 'milestone', value: undefined },
        { qualifier: 'label', value: 'in progress' }
      ]);

    });

  });

});


// helpers /////////////////////////


function createIssue(title, body) {

  return {
    title,
    body
  };

}