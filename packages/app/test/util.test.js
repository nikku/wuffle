const {
  expect
} = require('chai');

const sinon = require('sinon');

const {
  findLinks,
  linkTypes,
  parseSearch,
  parseTemporalFilter
} = require('../lib/util');

const {
  PARENT_OF,
  CHILD_OF,
  DEPENDS_ON,
  REQUIRED_BY,
  LINKED_TO,
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
        'requires: foo/bar#6, ' +
        'requires https://github.com/foo/bar/issues/7\n' +
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
          type: DEPENDS_ON, number: 1
        },
        {
          type: DEPENDS_ON, number: 2
        },
        {
          type: DEPENDS_ON, number: 3
        },
        {
          type: DEPENDS_ON, number: 4
        },
        {
          type: DEPENDS_ON, number: 5,
          owner: 'foo', repo: 'bar'
        },
        {
          type: DEPENDS_ON, number: 6,
          owner: 'foo', repo: 'bar'
        },
        {
          type: DEPENDS_ON, number: 7,
          owner: 'foo', repo: 'bar'
        },
        {
          type: DEPENDS_ON, number: 1828,
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
        'required by: foo/bar#6, ' +
        'required by https://github.com/foo/bar/issues/7\n' +
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
          type: REQUIRED_BY, number: 7,
          owner: 'foo', repo: 'bar'
        },
        {
          type: REQUIRED_BY, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize connects to', function() {

      // given
      const issue = createIssue(
        'FOO (connects to #1)',
        'Fixes #2, connected to #3' +
        'connect to foo/bar#5, ' +
        'connects to foo/bar#6, ' +
        'connected to foo/bar#7, ' +
        'connect to: foo/bar#8, ' +
        'connect to https://github.com/foo/bar/issues/9\n' +
        'connect to https://github.com/foo/bar/pull/1828\n' +
        'connect to https://github.com/foo/bar/issues/new ' +
        'connect to https://github.com/foo ' +
        'connect to https://github.com/foo/bar'
      );

      // when
      const links = findLinks(issue);

      // then
      expect(links).to.eql([
        {
          type: CHILD_OF, number: 1
        },
        {
          type: CLOSES, number: 2
        },
        {
          type: CHILD_OF, number: 3
        },
        {
          type: CHILD_OF, number: 5,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CHILD_OF, number: 6,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CHILD_OF, number: 7,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CHILD_OF, number: 8,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CHILD_OF, number: 9,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CHILD_OF, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize closes', function() {

      // given
      const issue = createIssue(
        'FOO (closes #1)',
        'Fixes #2, closes #3' +
        'close foo/bar#5, ' +
        'closes foo/bar#6, ' +
        'closed foo/bar#7, ' +
        'close: foo/bar#8, ' +
        'closes https://github.com/foo/bar/issues/9\n' +
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
          type: CLOSES, number: 7,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 8,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 9,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize fixes', function() {

      // given
      const issue = createIssue(
        'FOO (fixes #1)',
        'Fixes #2, closes #3' +
        'fix foo/bar#5, ' +
        'fixes foo/bar#6, ' +
        'fixed foo/bar#7, ' +
        'fix: foo/bar#8, ' +
        'fixes https://github.com/foo/bar/issues/9\n' +
        'fixes https://github.com/foo/bar/pull/1828\n' +
        'fixes https://github.com/foo/bar/issues/new ' +
        'fixes https://github.com/foo ' +
        'fixes https://github.com/foo/bar'
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
          type: CLOSES, number: 7,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 8,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 9,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize resolves', function() {

      // given
      const issue = createIssue(
        'FOO (resolves #1)',
        'resolves #2, resolves #3' +
        'resolve foo/bar#5, ' +
        'resolves foo/bar#6, ' +
        'resolved foo/bar#7, ' +
        'resolve: foo/bar#8, ' +
        'resolves https://github.com/foo/bar/issues/9\n' +
        'resolves https://github.com/foo/bar/pull/1828\n' +
        'resolves https://github.com/foo/bar/issues/new ' +
        'resolves https://github.com/foo ' +
        'resolves https://github.com/foo/bar'
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
          type: CLOSES, number: 7,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 8,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 9,
          owner: 'foo', repo: 'bar'
        },
        {
          type: CLOSES, number: 1828,
          owner: 'foo', repo: 'bar'
        }
      ]);
    });


    it('should recognize related to', function() {

      // given
      const issue = createIssue(
        'FOO',
        'Related to #2, related to https://github.com/foo/bar/pull/1828\n' +
        'Related to: #3\n' +
        'Related to https://github.com/foo/bar/pull/1828#some-comment\n' +
        'Related to https://github.com/foo/bar/pull/1828#some-comment?'
      );

      // when
      const links = findLinks(issue);

      // then
      expect(links).to.eql([
        {
          type: LINKED_TO, number: 2
        },
        {
          type: LINKED_TO, number: 1828,
          owner: 'foo', repo: 'bar'
        },
        {
          type: LINKED_TO, number: 3
        },
        {
          type: LINKED_TO, number: 1828,
          owner: 'foo', repo: 'bar',
          ref: '#some-comment'
        },
        {
          type: LINKED_TO, number: 1828,
          owner: 'foo', repo: 'bar',
          ref: '#some-comment'
        }
      ]);
    });


    it('should recognize parent / child of', function() {

      // given
      const issue = createIssue(
        'FOO (child of #1)',
        'Parent of #2, parent of https://github.com/foo/bar/pull/1828\n ' +
        'Parent of: #3' +
        'Child of: #4'
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
        },
        {
          type: PARENT_OF, number: 3
        },
        {
          type: CHILD_OF, number: 4
        }
      ]);
    });


    describe('should recognize issue list', function() {

      it('comma separated', function() {

        // given
        const issue = createIssue(
          'FOO',
          'Closes #2, #5, https://github.com/foo/bar/issues/1828, #10\n ' +
          'Closes: #3, #4, https://github.com/foo/bar/issues/1829, #11'
        );

        // when
        const links = findLinks(issue);

        // then
        expect(links).to.eql([
          {
            type: CLOSES, number: 2
          },
          {
            type: CLOSES, number: 5
          },
          {
            type: CLOSES, number: 1828,
            owner: 'foo', repo: 'bar'
          },
          {
            type: CLOSES, number: 10
          },
          {
            type: CLOSES, number: 3
          },
          {
            type: CLOSES, number: 4
          },
          {
            type: CLOSES, number: 1829,
            owner: 'foo', repo: 'bar'
          },
          {
            type: CLOSES, number: 11
          }
        ]);
      });


      it('space separated', function() {

        // given
        const issue = createIssue(
          'FOO',
          'Closes #2  https://github.com/foo/bar/issues/1828 #10\n' +
          'Closes: #3  https://github.com/foo/bar/issues/1829 #11'
        );

        // when
        const links = findLinks(issue);

        // then
        expect(links).to.eql([
          {
            type: CLOSES, number: 2
          },
          {
            type: CLOSES, number: 1828,
            owner: 'foo', repo: 'bar'
          },
          {
            type: CLOSES, number: 10
          },
          {
            type: CLOSES, number: 3
          },
          {
            type: CLOSES, number: 1829,
            owner: 'foo', repo: 'bar'
          },
          {
            type: CLOSES, number: 11
          }
        ]);
      });


      it('and separated', function() {

        // given
        const issue = createIssue(
          'FOO',
          'Closes https://github.com/foo/bar/issues/1 and #5, and #10, and, #12\n' +
          'Closes: https://github.com/foo/bar/issues/101 and #105, and #110, and, #112'
        );

        // when
        const links = findLinks(issue);

        // then
        expect(links).to.eql([
          {
            type: CLOSES, number: 1,
            owner: 'foo', repo: 'bar'
          },
          {
            type: CLOSES, number: 5
          },
          {
            type: CLOSES, number: 10
          },
          {
            type: CLOSES, number: 12
          },
          {
            type: CLOSES, number: 101,
            owner: 'foo', repo: 'bar'
          },
          {
            type: CLOSES, number: 105
          },
          {
            type: CLOSES, number: 110
          },
          {
            type: CLOSES, number: 112
          }
        ]);
      });


      it('break on unrecognized separator', function() {

        // given
        const issue = createIssue(
          'FOO',
          'Closes #2, #5, what about https://github.com/foo/bar/issues/1828?'
        );

        // when
        const links = findLinks(issue);

        // then
        expect(links).to.eql([
          {
            type: CLOSES, number: 2
          },
          {
            type: CLOSES, number: 5
          }
        ]);
      });


      it('parse deep ref', function() {

        // given
        const issue = createIssue(
          'FOO',
          'Closes https://github.com/foo/bar/issues/2#foop, https://github.com/foo/bar/issues/5?woop=1'
        );

        // when
        const links = findLinks(issue);

        // then
        expect(links).to.eql([
          {
            owner: 'foo',
            repo: 'bar',
            type: CLOSES,
            number: 2,
            ref: '#foop'
          },
          {
            owner: 'foo',
            repo: 'bar',
            type: CLOSES,
            number: 5,
            ref: '?woop=1'
          }
        ]);
      });

    });


    it('should recognize task lists', function() {

      // given
      const issue = createIssue(
        'FOO',
        `
        Some things to do:

          * [ ] A https://github.com/foo/bar/issues/200
          * [ ] B #1, #11
          * [ ] #2
          * [ ] Other issue (#5)
          * [ ] [Nicely linked issue](#6)
          * [ ] Related to be verified: https://github.com/foo/bar/issues/200#deeplink-foo
          * [ ] Check out https://github.com/nikku/testtest/issues/118#issuecomment-1271223336
          * [ ] Is  https://github.com/nikku/testtest/pull/82/commits/ff859a123b95377186900829eeebd1a6dd7ee1ee#r989781035 still valid?
          * [ ] Maybe https://github.com/foo/bar/issues/200#deeplink-foo?
          * [ ] Check out https://github.com/foo/bar/issues/200#deeplink-foo: Makes it happen
          * [ ] See https://github.com/foo/bar/issues/200?a=1&b=3#deeplink-foo
        `
      );

      // when
      const links = findLinks(issue);

      // then
      expect(links).to.eql([
        { type: 'PARENT_OF', number: 200, owner: 'foo', repo: 'bar' },
        { type: 'PARENT_OF', number: 1 },
        { type: 'PARENT_OF', number: 11 },
        { type: 'PARENT_OF', number: 2 },
        { type: 'PARENT_OF', number: 5 },
        { type: 'PARENT_OF', number: 6 },
        { type: 'PARENT_OF', number: 200, owner: 'foo', repo: 'bar', ref: '#deeplink-foo' },
        { type: 'PARENT_OF', number: 118, owner: 'nikku', repo: 'testtest', ref: '#issuecomment-1271223336' },
        { type: 'PARENT_OF', number: 82, owner: 'nikku', repo: 'testtest', ref: '/commits/ff859a123b95377186900829eeebd1a6dd7ee1ee#r989781035' },
        { type: 'PARENT_OF', number: 200, owner: 'foo', repo: 'bar', ref: '#deeplink-foo' },
        { type: 'PARENT_OF', number: 200, owner: 'foo', repo: 'bar', ref: '#deeplink-foo' },
        { type: 'PARENT_OF', number: 200, owner: 'foo', repo: 'bar', ref: '?a=1&b=3#deeplink-foo' }
      ]);
    });

  });


  describe('parseSearch', function() {

    it('should parse terms', function() {

      const searchString = [
        '"Copy& Paste"',
        'is:open',
        'asdsad',
        'milestone:"FOO BAR"',
        '"FOO BAR"',
        'milestone:12asd',
        'milestone:',
        'author:walt',
        'label:"in progress"',
        'ref:foo/bar#80',
        'assignee:@me',
        'label:"some,stuff;yea"'
      ].join(' ');

      // when
      const search = parseSearch(searchString);

      // then
      expect(search).to.eql([
        { qualifier: 'text', value: 'Copy& Paste', exact: true },
        { qualifier: 'is', value: 'open', negated: false, exact: false },
        { qualifier: 'text', value: 'asdsad', exact: false },
        { qualifier: 'milestone', value: 'FOO BAR', negated: false, exact: true },
        { qualifier: 'text', value: 'FOO BAR', exact: true },
        { qualifier: 'milestone', value: '12asd', negated: false, exact: false },
        { qualifier: 'milestone', value: undefined, negated: false, exact: false },
        { qualifier: 'author', value: 'walt', negated: false, exact: false },
        { qualifier: 'label', value: 'in progress', negated: false, exact: true },
        { qualifier: 'ref', value: 'foo/bar#80', negated: false, exact: false },
        { qualifier: 'assignee', value: '@me', negated: false, exact: false },
        { qualifier: 'label', value: 'some,stuff;yea', negated: false, exact: true }
      ]);

    });


    it('should parse value with colon', function() {

      // when
      const search = parseSearch('is:"open:b"');

      // then
      expect(search).to.eql([
        { qualifier: 'is', value: 'open:b', negated: false, exact: true }
      ]);

    });


    it('should parse negated (-) value', function() {

      // when
      const search = parseSearch([
        '-is:"open:b"',
        '-is:FOO',
        '!is:FOO'
      ].join(' '));

      // then
      expect(search).to.eql([
        { qualifier: 'is', value: 'open:b', negated: true, exact: true },
        { qualifier: 'is', value: 'FOO', negated: true, exact: false },
        { qualifier: 'is', value: 'FOO', negated: true, exact: false }
      ]);

    });


    it('should parse dash in value', function() {

      // when
      const search = parseSearch([
        'is:open-bar',
        'is:"open-bar"'
      ].join(' '));

      // then
      expect(search).to.eql([
        { qualifier: 'is', value: 'open-bar', negated: false, exact: false },
        { qualifier: 'is', value: 'open-bar', negated: false, exact: true }
      ]);

    });


    it('should parse dot in value', function() {

      // when
      const search = parseSearch([
        'is:open.bar',
        'is:"open.bar"'
      ].join(' '));

      // then
      expect(search).to.eql([
        { qualifier: 'is', value: 'open.bar', negated: false, exact: false },
        { qualifier: 'is', value: 'open.bar', negated: false, exact: true }
      ]);

    });


    it('should parse underscore in value', function() {

      // when
      const search = parseSearch([
        'is:open_bar',
        'is:"open_bar"'
      ].join(' '));

      // then
      expect(search).to.eql([
        { qualifier: 'is', value: 'open_bar', negated: false, exact: false },
        { qualifier: 'is', value: 'open_bar', negated: false, exact: true }
      ]);

    });


    it('should parse temporal filter in value', function() {

      // when
      const search = parseSearch([
        'created:<2020-09-14',
        'updated:>=2020-09-14'
      ].join(' '));

      // then
      expect(search).to.eql([
        { qualifier: 'created', value: '<2020-09-14', negated: false, exact: false },
        { qualifier: 'updated', value: '>=2020-09-14', negated: false, exact: false }
      ]);
    });

  });


  describe('parseTemporalFilter', function() {

    it('should parse greater than', function() {

      // when
      const filter = parseTemporalFilter('>2020-09-15');

      // then
      expect(filter).to.eql({
        date: 1600128000000,
        qualifier: '>'
      });
    });


    it('should parse greater than or equal', function() {

      // when
      const filter = parseTemporalFilter('>=2020-09-15');

      // then
      expect(filter).to.eql({
        date: 1600128000000,
        qualifier: '>='
      });
    });


    it('should parse smaller than', function() {

      // when
      const filter = parseTemporalFilter('<2020-09-15');

      // then
      expect(filter).to.eql({
        date: 1600128000000,
        qualifier: '<'
      });
    });


    it('should parse smaller than or equal', function() {

      // when
      const filter = parseTemporalFilter('<=2020-09-15');

      // then
      expect(filter).to.eql({
        date: 1600128000000,
        qualifier: '<='
      });
    });


    describe('should parse logical qualifiers', function() {

      let clock;

      afterEach(function() {
        clock.restore();
      });


      it('@today', function() {

        // given
        clock = sinon.useFakeTimers(new Date(2015, 9, 15, 10, 5, 15, 3));

        // when
        const filter = parseTemporalFilter('@today');

        const expected = new Date(2015, 9, 15, 0, 0, 0, 0);

        // then
        expect(filter).to.eql({
          date: expected.getTime(),
          qualifier: '>='
        });
      });


      it('@last_week', function() {

        // given
        clock = sinon.useFakeTimers(new Date(2015, 9, 15, 10, 5, 15, 3));

        // when
        const filter = parseTemporalFilter('@last_week');

        const expected = new Date(2015, 9, 8, 0, 0, 0, 0);

        // then
        expect(filter).to.eql({
          date: expected.getTime(),
          qualifier: '>='
        });
      });


      it('@last_month', function() {

        // given
        clock = sinon.useFakeTimers(new Date(2015, 9, 15, 10, 5, 15, 3));

        // when
        const filter = parseTemporalFilter('@last_month');

        const expected = new Date(2015, 8, 15, 0, 0, 0, 0);

        // then
        expect(filter).to.eql({
          date: expected.getTime(),
          qualifier: '>='
        });
      });

    });


    it('should ignore invalid', function() {

      // when
      const filter = parseTemporalFilter('<=2020-15');

      // then
      expect(filter).not.to.exist;
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
