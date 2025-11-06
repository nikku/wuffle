# Changelog

All notable changes to [wuffle](https://github.com/nikku/wuffle) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

_**Note:** Yet to be released changes appear here._

## 0.68.0

* `FEAT`: add a dark mode ([#254](https://github.com/nikku/wuffle/pull/254))

## 0.67.0

* `FEAT`: add `is:approved` filter ([#251](https://github.com/nikku/wuffle/pull/251))
* `FEAT`: add `is:reviewed` filter ([#251](https://github.com/nikku/wuffle/pull/251))

## 0.66.1

* `FIX`: de-duplicate displayed warnings

## 0.66.0

* `FIX`: show PRs linked to issues, if they are in separate columns ([#245](https://github.com/nikku/wuffle/issues/245))
* `CHORE`: require `node >= 20`
* `DEPS`: update to `compression@1.8.1`
* `DEPS`: update to `express-session@1.18.2`
* `DEPS`: update to `@bpmn-io/draggle@4.1.2`
* `DEPS`: update to `min-dash@4.2.3`

## 0.65.0

* `DEPS`: update to `compression@1.8.0`
* `DEPS`: update to `smee-client@3.1.1`
* `DEPS`: update to `probot@13.4.5`
* `DEPS`: update to `body-parser@2.2.0`

## 0.64.0

* `FIX`: correct scrollable container styling
* `CHORE`: migrate board to use `svelte@5`
* `CHORE`: register service worker outside of main bundle
* `DEPS`: update to `p-defer@4.0.1`
* `DEPS`: update to `probot@13.4.1`
* `DEPS`: update to `prexit@2.3.0`

## 0.63.1

* `FIX`: clean up open PRs that were not found on GitHub ([#216](https://github.com/nikku/wuffle/issues/216))
* `DEPS`: update to `compression@1.7.1`
* `DEPS`: update to `express-session@1.18.1`

## 0.63.0

* `FEAT`: suggest `@me` for all user filters ([#193](https://github.com/nikku/wuffle/pull/193))
* `FIX`: prevent double commit of filter suggestion ([#194](https://github.com/nikku/wuffle/pull/194))

## 0.62.0

* `FEAT`: suggest `assignee:@me` filter
* `FIX`: avatars get properly cached
* `FIX`: click on filter suggestion applies it again ([#190](https://github.com/nikku/wuffle/issues/190))
* `FIX`: prevent blank page after login/logout
* `FIX`: correctly handle connection errors during login check
* `FIX`: make help menu keyboard accessible
* `FIX`: turn example config into ES module

## 0.61.0

* `DEPS`: update to `probot@13.0.2`
* `DEPS`: update to `@octokit/graphql-schema@15`
* `DEPS`: update to `@aws-sdk/client-s3@3.525.0`

## 0.60.0

* `FEAT`: use native `fetch`
* `CHORE`: require `Node >= 18`

### Breaking Changes

* `Node >= 18` is required to run the board

## 0.59.0

* `FEAT`: turn into ES module
* `CHORE`: correct various type hints
* `DEPS`: update `fake-tag@5`
* `DEPS`: update `p-defer@4`
* `DEPS`: update to `prexit@2`

### Breaking Changes

* Refactoring of the code base, exposing services as ES modules

## 0.58.0

* `FEAT`: improve guided setup steps
* `FIX`: correct setup not working due to `hbs` missing ([#175](https://github.com/nikku/wuffle/issues/175))
* `FIX`: do not cache setup resources
* `DEPS`: update to `probot@13`
* `DEPS`: update dependencies

### Breaking Changes

* Webhook URL changed to `{BASE_URL}/api/github/webhooks`

## 0.57.0

* `FEAT`: add `fifo` column ordering as an alternative to the default `lifo`
* `DEPS`: update dependencies

## 0.56.1

* `FIX`: correct handling of non-http(s) requests in service worker ([#161](https://github.com/nikku/wuffle/issues/161))

## 0.56.0

* `FEAT`: support `PRIVATE_KEY_PATH` to supply key
* `DEPS`: update dependencies

## 0.55.0

* `FEAT`: various `a11y` improvements
* `DEPS`: update dependencies

## 0.54.0

* `FEAT`: move issue to `needs_review` column on review request ([#156](https://github.com/nikku/wuffle/pull/156))
* `FEAT`: filter terms in quotes strictly
* `FEAT`: add ability to provide a default board filter
* `FIX`: slightly adjust scroller padding

## 0.53.1

* `FIX`: remove unknown file from eager cache list
* `FIX`: add missing link title
* `CHORE`: pre-render 15 cards only

## 0.53.0

* `FEAT`: preload board configuration
* `CHORE`: remove unnecessary `aria-*` labels

## 0.52.0

* `FEAT`: support `issue#state_reason`

## 0.51.1

* `CHORE`: simplify board description
* `DOCS`: improve various bits of the documentation

## 0.51.0

* `FEAT`: make filter available through `ctrl + k`
* `FEAT`: show all board filter hints in scrollable container
* `FEAT`: improve scrollbars + paddings
* `FEAT`: improve column toggle
* `FIX`: clear mouse on filter change
* `FIX`: only select hint on primary mouse button click
* `FIX`: correct filters not hiding on blur
* `FIX`: correct logging of missing permissions/events ([#145](https://github.com/nikku/wuffle/issues/145))

## 0.50.2

* `FIX`: do not attach closed, unmerged PRs

## 0.50.1

* `FIX`: correct tag contrast

## 0.50.0

* `FEAT`: overhaul icons, card, and tag UI ([#144](https://github.com/nikku/wuffle/pull/144))
* `FEAT`: add ability to link issue comments from within a task breakdown ([#144](https://github.com/nikku/wuffle/pull/144))
* `FEAT`: allow PRs to be attached to task break downs ([#144](https://github.com/nikku/wuffle/pull/144))
* `FEAT`: add keyboard shortcuts documentation ([#140](https://github.com/nikku/wuffle/issues/140))
* `FIX`: prevent creation of self-referencing links ([#143](https://github.com/nikku/wuffle/issues/143))

## 0.49.0

* `FEAT`: add `l` shortcut to toggle login
* `FEAT`: do not establish `CHILD_OF` relationship through deep links ([#138](https://github.com/nikku/wuffle/issues/138))
* `FIX`: gracefully handle missing asset folder in `dev`

## 0.48.1

* `FIX`: don't necrobump closed issues on `{SOME_NUMBER}-branch` creation ([#137](https://github.com/nikku/wuffle/pull/137))

## 0.48.0

* `FEAT`: support `@me` in search to reference logged-in user ([#133](https://github.com/nikku/wuffle/pull/133))
* `FEAT`: support relative `@today`, `@last_week` and `@last_month` temporal qualifiers ([#134](https://github.com/nikku/wuffle/pull/134))
* `FIX`: recognize comma in quoted search values ([#135](https://github.com/nikku/wuffle/pull/135))

## 0.47.3

* `FIX`: mark app as Node@16 compatible, again

## 0.47.2

* `FIX`: correct first time setup ([#131](https://github.com/nikku/wuffle/pull/131))
* `DEPS`: bump dependencies

## 0.47.1

* `FIX`: gracefully handle missing assignee

## 0.47.0

* `FEAT`: move changes requested collaborator PRs back to `IN_PROGRESS` ([#128](https://github.com/nikku/wuffle/pull/128))
* `FEAT`: add ability to auto-assign collaborator PRs ([#129](https://github.com/nikku/wuffle/pull/129))
* `FEAT`: provide way to use existing `assignee` filter on PRs ([#125](https://github.com/nikku/wuffle/issues/125))
* `FIX`: react to `pull_request.converted_to_draft`
* `FIX`: correct avatar sizing

## 0.46.0

* `FEAT`: allow custom `S3_ENDPOINT` to be configured ([#127](https://github.com/nikku/wuffle/pull/127))

## 0.45.2

* `CHORE`: improve board API error logging ([`04015630`](https://github.com/nikku/wuffle/commit/04015630e3f6a1332c2297388fd228049184d75a))

## 0.45.1

* `FIX`: send `reviews` information to the board

## 0.45.0

* `FEAT`: add `is:epic` filter
* `FEAT`: persist column toggle state in query parameters

## 0.44.4

* `FIX`: gracefully handle missing `requested_reviewers`

## 0.44.3

* `FIX`: send `check_runs` and `statuses` information to the board

## 0.44.2

* `FIX`: account for absence of `user`

## 0.44.1

* `FIX`: account for `comments` being a number in the past
* `FIX`: send `order`, `column_label` and `column` information to board

## 0.44.0

* `FEAT`: reduce payload of transferred board data ([`d76db5c0`](https://github.com/nikku/wuffle/commit/d76db5c0d9b378b2ffff52123a75eaa813b5206c))

## 0.43.0

* `FEAT`: support GitHub style task breakdowns to create epics ([#118](https://github.com/nikku/wuffle/issues/118))
* `FEAT`: add and remove labels, rather than overriding ([#77](https://github.com/nikku/wuffle/issues/77))
* `FEAT`: color draft PRs differently ([`e134cb81`](https://github.com/nikku/wuffle/commit/e134cb810a04097363336b6c6c079f9aa48f0b61))
* `CHORE`: update to `probot@12`

## 0.42.2

* `FIX`: correct style overrides (milestone style, ...)
* `FIX`: correct board filter not maximizing responsively

## 0.42.1

* `FIX`: gracefully handle missing `html_url` ([`6651df27`](https://github.com/nikku/wuffle/commit/6651df276e9ec3720e3978151b170eee18e3d7a2))

## 0.42.0

* `FEAT`: synchronize issue comments ([#94](https://github.com/nikku/wuffle/issues/94))
* `FEAT`: display commented in collaborator links ([#94](https://github.com/nikku/wuffle/issues/94))
* `FEAT`: adjust _requested for review_ indicator to match GitHub ([`7c84c49a`](https://github.com/nikku/wuffle/commit/7c84c49a95ad28ae2a9971ecfd6c772403423971))
* `FEAT`: necrobump issues on commented ([`070aaffd`](https://github.com/nikku/wuffle/commit/070aaffd30bc67427623d087385bc1274e9da3cd))
* `FEAT`: fetch and use GitHub provided `html_url` for entities ([#121](https://github.com/nikku/wuffle/pull/121))
* `FEAT`: link author avatar to GitHub ([`72cf233a`](https://github.com/nikku/wuffle/commit/72cf233a02830de2f5bcb52a254f1400e9a4022b))
* `CHORE`: use `ProbotApp#onAny` ([`ed1b2248`](https://github.com/nikku/wuffle/pull/119/commits/ed1b2248fcce95e575f21365d9211c0ed7334245))
* `DEPS`: bump to `probot@11.4.1`
* `DEPS`: bump dependencies

### Breaking Changes

* Introduction of comments as well as `html_url` requires a full background sync

## 0.41.5

* `CHORE`: push `latest` and `next` tags to [docker hub](https://hub.docker.com/repository/docker/nrehwaldt/wuffle) again
* `DEPS`: patch bump dependencies

## 0.41.4

* `CHORE`: control published files via `package.json#files`

## 0.41.3

* `FIX`: distinguish requested review and commented states for PR participants

## 0.41.2

* `FIX`: correctly disable loader interaction if hidden

## 0.41.1

* `FIX`: open external project links with rel=noopener

## 0.41.0

* `FEAT`: link documentation next to powered by icon

## 0.40.1

* `FIX`: allow create issue repository hint selection via mouse
* `FIX`: correct create issue repository hints navigation via keyboard

## 0.40.0

* `FEAT`: filter board for collaborators
* `FEAT`: apply board filters with `SHIFT` / `ALT` click modifiers only
* `FEAT`: add create issue widget ([#65](https://github.com/nikku/wuffle/issues/65))
* `FEAT`: improve navigation layout
* `FIX`: workaround Chromium service worker bug ([`f6d20222`](https://github.com/nikku/wuffle/commit/f6d202227979935d3d9b62f1f2f02c43eedd9f54))
* `CHORE`: adjust board filters
* `DOCS`: document [board filters](./docs/BOARD_FILTERS.md)

### Breaking Changes

* Filtering issues on the board via click now consistently requires a `SHIFT` or `ALT` modifier

## 0.39.0

* `FIX`: do not swallow store import errors ([#114](https://github.com/nikku/wuffle/pull/114))
* `CHORE`: improve error logging with context ([#114](https://github.com/nikku/wuffle/pull/114))
* `DEPS`: bump to `probot@11.1.0`

## 0.38.1

* `FIX`: bump docker file base image to Node@14

## 0.38.0

* `FEAT`: implement first time setup
* `FIX`: add `member` permission to app manifest
* `FIX`: correct app default permmissions
* `DOCS`: rewrite setup guide

## 0.37.0

* `FEAT`: allow setup to be executed via app binary
* `FEAT`: add explicit setup command
* `FIX`: make `mkdirp` a production dependency
* `CHORE`: use leak free in memory session store

## 0.36.0

* `FEAT`: fetch user access repositories with max page size
* `FEAT`: rework S3 data dump
* `CHORE`: bump to `probot@11` ([`9e4c9339`](https://github.com/nikku/wuffle/commit/9e4c933910db82ef2e4416e2a9ea42a749d78d2b), [`cc8ad79a`](https://github.com/nikku/wuffle/commit/cc8ad79a9845e5447cc090332da96bb49c7bed3c))
* `CHORE`: require Node@14 ([`45a335a7`](https://github.com/nikku/wuffle/commit/45a335a77b700b90abf088ec426867cc69504f30))
* `DOCS`: add missing configuration entries

### Breaking Changes

* `probot@11` update changes some internal APIs as well as webhook data
* Persistent S3 task board storage requires `env.S3_REGION` to be configured
* Minimal required NodeJS version is now 14

## 0.35.5

* `CHORE`: patch bump dependency versions

## 0.35.4

* `FIX`: correct login session not being established during initial app login
* `CHORE`: add ability to disable background sync using environment variable
* `CHORE`: relax same-site cookie setting

## 0.35.3

* `FIX`: correct fetching of authenticated user repositories

## 0.35.2

* `FIX`: correct _last month_ temporal filter completion

## 0.35.1

* `FIX`: prevent long milestone labels from overflowing card
* `FIX`: relax secure cookie setting
* `CHORE`: allow to configure `TRUST_PROXY` to enable secure cookies

## 0.35.0

* `FEAT(events-sync)`: support repository renaming ([#102](https://github.com/nikku/wuffle/issues/102))
* `FEAT(events-sync)`: support issue transfer ([#92](https://github.com/nikku/wuffle/issues/92))
* `FEAT(search)`: add `is:milestoned` filter ([`f6798cf3`](https://github.com/nikku/wuffle/commit/f6798cf39b31272d3474f29a1bc028e5d8003b01))
* `FEAT(search)`: add `involves` filter ([#100](https://github.com/nikku/wuffle/issues/100))
* `FEAT(search)`: add `created` and `updated` filters ([#98](https://github.com/nikku/wuffle/issues/98))
* `FEAT(search)`: add `author` filter ([#97](https://github.com/nikku/wuffle/issues/97))
* `FEAT(app)`: harden session cookie ([`b16639b5`](https://github.com/nikku/wuffle/commit/b16639b560af0d49b3b6c17af293e12700dbc1f8))
* `FIX(background-sync)`: improve handling of removed repositories ([#101](https://github.com/nikku/wuffle/pull/101), [#93](https://github.com/nikku/wuffle/issues/93), [#90](https://github.com/nikku/wuffle/issues/90))
* `CHORE(app)`: introduce type linting and cleanup `events` API ([#96](https://github.com/nikku/wuffle/issues/96))

### Breaking Changes

* The API of the `events` service changed. For all APIs that take a priority the priority is now the optional, last argument.

## 0.34.0

* `FEAT`: support `convert_to_draft` webhook to move PR back to IN_PROGESS ([#86](https://github.com/nikku/wuffle/issues/86))
* `CHORE`: propagate user-access read errors
* `CHORE`: back-off periodic checks on error

## 0.33.1

* `FIX`: do not fail search on missing assignees
* `CHORE`: make issue search fail safe

## 0.33.0

* `FEAT`: log out user on wuffle once her GitHub access token expired
* `FIX`: correctly handle invalid issue when updating store

## 0.32.0

* `FEAT`: various performance improvements for logged in board access ([`2fe40483`](https://github.com/nikku/wuffle/commit/2fe404834c8b291335079c782dff1bbc7d2015f5), [`de5403da`](https://github.com/nikku/wuffle/commit/de5403da7eb7dc5dde71ded3add6f08e1ed7ff27))
* `FEAT`: use app APIs to determine user repository access ([`579743a9`](https://github.com/nikku/wuffle/commit/579743a9002873a2a22f6116debfbcf335f5e7ed))
* `FIX`: account for GitHub API changes breaking private repository display ([#80](https://github.com/nikku/wuffle/issues/80))
* `CHORE`: bump dependency versions

## 0.31.0

* `FEAT`: be able to specify default column collapsed state
* `FIX`: prevent collapsed columns from breaking layout
* `FIX`: correct collapsed column layout in Firefox

## 0.30.0

* `FEAT`: support `connects` to create parent -> child relationship ([#78](https://github.com/nikku/wuffle/pull/78))
* `FEAT`: add ability to whitelist enabled organizations ([#75](https://github.com/nikku/wuffle/issues/75))
* `CHORE`: add sentry support, [inherited from Probot](https://probot.github.io/docs/deployment/#error-tracking)
* `CHORE`: board update errors with context
* `CHORE`: ensure the app restores before completing startup
* `CHORE`: serialize board version on store dump
* `FIX`: do not bump `updated_at` when synchronizing issue details
* `FIX`: correct status sync failure on PR open
* `FIX`: don't swallow changes on concurrent store updates
* `FIX`: prevent accidental double background sync
* `FIX`: handle deleted forks in pull request filters ([`2b40281f`](https://github.com/nikku/wuffle/commit/2b40281f756e31e16ced2b4a644d0f20784c03d8))

## 0.29.0

* `FEAT`: improve background synchronization of pull request details ([#70](https://github.com/nikku/wuffle/issues/70))
* `FEAT`: make background synchronization configurable via environment variables

## 0.28.0

* `FEAT`: recognize full list of GitHub closes keywords ([#73](https://github.com/nikku/wuffle/pull/73))
* `FEAT`: recognize colon in issue links ([#73](https://github.com/nikku/wuffle/pull/73))
* `CHORE`: feat with maximum page size during background sync to avoid hitting GitHub rate limits

_Special thanks goes to [@mjcarroll](https://github.com/mjcarroll) for contributing [#73](https://github.com/nikku/wuffle/pull/73)._

## 0.27.0

* `FEAT`: reindex store on board configuration changes ([#69](https://github.com/nikku/wuffle/pull/69), [#49](https://github.com/nikku/wuffle/issues/49))
* `FEAT`: allow to hook into store restore and serialize

## 0.26.1

* `FIX(app)`: deduplicate check runs by name ([#66](https://github.com/nikku/wuffle/pull/66))

## 0.26.0

* `FEAT`: integrate pull request checks and statuses ([#41](https://github.com/nikku/wuffle/issues/41))
* `FEAT(board)`: provide better link titles ([`77cf5b2d`](https://github.com/nikku/wuffle/commit/77cf5b2d2374005bb6d4532d596bcb48d0129cfc))
* `FEAT(board)`: add limited offline support
* `FEAT(board)`: improve error handling and recovery
* `FEAT(board)`: cache assets in front-end
* `FEAT(board)`: make header responsive
* `FIX(app)`: correct label update ([`3ff74c22`](https://github.com/nikku/wuffle/commit/3ff74c222f7547448f7913300fcfde2abfb9bf4d))
* `FIX(app)`: update card on `pull_request.synchronize`, too

### Breaking Changes

* The app requires read access to checks and statuses as well as the connected event subscriptions in order to display pull request states ([#41](https://github.com/nikku/wuffle/issues/41)).


## 0.25.1

* `DOCS`: align app with project documentation

## 0.25.0

* `FEAT`: publish as `wuffle` to npm
* `FEAT`: validate presence of compiled board assets
* `FEAT(app)`: log working directory when starting
* `CHORE`: compile board assets to app
* `CHORE(app)`: resolve `wuffle.config.js` in working directory

## 0.24.2

* `CHORE(board)`: reduce amount of unused styles

## 0.24.1

* `CHORE(board)`: add more a11y hints
* `FIX`: correctly handle dismissed reviews

## 0.24.0

* `FIX(board)`: ensure long card titles do not kill card layout
* `FEAT(board)`: give card links full prominence
* `FEAT(board)`: show assignees collapsed and expand them as needed

## 0.23.0

* `FEAT(app)`: integrate reviews ([#22](https://github.com/nikku/wuffle/issues/22))
* `FEAT(app)`: pick up milestone edits ([#46](https://github.com/nikku/wuffle/issues/46))
* `FEAT(app)`: pick up label edits
* `FEAT(app)`: allow partial issue updates
* `FEAT(background-sync)`: add ability to hook up external behaviors
* `FEAT(background-sync)`: batch update issues ([`1958c9d3`](https://github.com/nikku/wuffle/commit/1958c9d3e8a968d93f0779d99210be7ab1538069))
* `FEAT(board)`: hide merged, non-closing PRs from cards ([`06794aa5`](https://github.com/nikku/wuffle/commit/06794aa54c745d85518473b5c1541c63512c7c57))
* `FEAT(board)`: add numerous UI hints
* `FEAT(board)`: improve assignee display
* `FEAT(board)`: slightly adjust board styles, making it more pleasent to look at
* `FEAT(store)`: serialize store updates ([`a5bdcbe5`](https://github.com/nikku/wuffle/commit/a5bdcbe5927b2e35fdd95d38463399ac5e32eea3))

## 0.22.0

* `FEAT(search)`: include login/org in repository search
* `FEAT(search)`: use includes to filter labels and repositories
* `FEAT(board)`: deep link milestone to GitHub
* `FIX(board)`: correct icon sizes displaying wrong in Firefox ([#48](https://github.com/nikku/wuffle/pull/48))

## 0.21.0

* `FEAT(app)`: reduce re-ordering noise on the board by card order, if possible ([`62bea58d`](https://github.com/nikku/wuffle/commit/62bea58d447fcab6a5e64479e768f22828051c32))
* `FEAT(app)`: do not move referenced issues via board ([`260d1e8a`](https://github.com/nikku/wuffle/commit/260d1e8a1077eaacf195a6b880fb870bd11f95c8))
* `FEAT(board)`: provide card link titles
* `FEAT(board)`: make card link icons and PR / epic icons clickable
* `FEAT(board)`: show blocking links first in list
* `FEAT(board)`: make title read-only
* `FEAT(board)`: visualize open required by / closes issues as standard link types
* `FIX(app)`: only move issues to top that move to new column

## 0.20.0

* `FEAT(board)`: make click on issue numbers open the issue on GitHub as the default interaction again ([#35](https://github.com/nikku/wuffle/issues/35))
* `FEAT(board)`: make filtering by issue reference, tag or milestone available as `SHIFT` / `CTRL` + click
* `FEAT(board)`: make consecutive click on reference, tag or milestone toggle the relevant filter
* `FEAT(board)`: escape card dragging on `ESC` key

## 0.19.1

* `DOCS`: add troubleshooting document
* `DOCS`: document column to state mappings

## 0.19.0

* `FEAT(app)`: handle PRs from external like new issues ([`8e0919d5`](https://github.com/nikku/wuffle/commit/8e0919d5358d1642bde2c08f138b4d1385bc1745))
* `FEAT(app)`: allow alternative column names and explicit state mappings ([`c2575b32`](https://github.com/nikku/wuffle/commit/c2575b3246195106a7c7a95c919cc2315c39a6fc))
* `FEAT(app)`: validate board configuration ([#39](https://github.com/nikku/wuffle/issues/39))
* `FEAT(app)`: crash on run failure ([`2d2ac864`](https://github.com/nikku/wuffle/commit/2d2ac864c31822546a7de7b25c3a375119a32048))

## 0.18.0

* `FEAT(app)`: recognize list of linked issues with the same type
* `DOCS`: document login callback url
* `FIX(auth-routes)`: gracefully handle missing cached data in auth callback

## 0.17.0

* `FEAT(background-sync)`: ignore archived repositories
* `FEAT(apps/dump-store)`: allow usage of local dump store outside dev mode
* `CHORE`: [di-ify](https://github.com/nikku/async-didi) app core

### Breaking Changes

* We restructured internals and made apps expose their own APIs. Things changed.

## 0.16.0

* `FEAT`: connect all repositories connected to GitHub app

### Breaking Changes

* `config.repositories` is now obsolete
* The board does not default to a repository for its name, configure a board name via `config.name`

## 0.15.1

* `FIX(app)`: capture requested reviewer changes

## 0.15.0

* `FEAT(app)`: mark column as `sorting=true` to incrementally sort cards based on links ([#29](https://github.com/nikku/wuffle/issues/29))
* `FIX(app)`: correct GitHub app manifest
* `FIX(board)`: correctly handle reordering updates

## 0.14.0

* `DOCS`: new setup and run guide :tada:
* `FIX`: correct various getting started / configuration glitches
* `FIX`: validate `BASE_URL` in run script

## 0.13.0

* `FEAT(board)`: filter by tags
* `FIX(board)`: de-duplicate attached PR links
* `FIX(app)`: properly update link sources if linked issue changes ([#33](https://github.com/nikku/wuffle/issues/33))
* `CHORE(app)`: improve start validation and hints

## 0.12.0

* `FEAT(board)`: add powered by link
* `FEAT(app)`: allow searching by `ref`
* `FEAT(app)`: inverse link related to issues
* `FEAT(board)`: add ability to filter by issue with dependencies
* `FEAT(board)`: show epic progress bar and completed count ([#27](https://github.com/nikku/wuffle/issues/27))
* `FIX(apps/search)`: allow more special keys in search

## 0.11.0

* `FEAT(board)`: display issue links ([#3](https://github.com/nikku/wuffle/issues/3))
* `FEAT(board)`: display full issue key on hover
* `FEAT(board)`: add epic icon and links ([#30](https://github.com/nikku/wuffle/pull/30))
* `FEAT(app)`: add new/updated issues without order to column top
* `FEAT(project)`: add [docker image](https://hub.docker.com/r/nrehwaldt/wuffle)
* `FIX(board)`: allow scrolling while dragging card

## 0.10.0

* `FEAT(app)`: add ability to force HTTPS redirect
* `FEAT(project)`: provide pre-built docker images ([#25](https://github.com/nikku/wuffle/issues/25))
* `FEAT(app)`: add run script
* `FEAT(app)`: validate environment configuration before start
* `FIX(app)`: expose required information for deleted issues
* `DOCS(project)`: document environment variables

## 0.9.0

* `FEAT(project)`: add `Procfile`
* `FIX(dump-store-s3)`: correctly handle inbound data
* `CHORE(dump-store-s3)`: set dump interval to five minutes
* `CHORE(dump-store*)`: log pre-exit actions and timings

## 0.8.2

* `FIX(search)`: recognize `_` in search values
* `FIX(automatic-dev-flow)`: correct branch issue number globbing

## 0.8.1

* `FIX(search)`: recognize dashes search values

## 0.8.0

* `FEAT(background-sync)`: update only actually changed items
* `FEAT(search)`: add `is:{ open, closed, issue, pull }` filters
* `FEAT(search)`: ignore operators with empty values
* `FEAT(board)`: focus board filter on `CTRL/CMD + F`
* `FEAT(board)`: complete board filter qualifier values

## 0.7.0

* `FEAT(background-sync)`: improve sync performance for closed issues
* `FEAT(background-sync)`: expire and remove closed issues not updated for 60 days
* `FEAT(board)`: simplify board filter
* `FEAT(board)`: add initial focus hint to board filter
* `FEAT(search)`: put negation char before operator
* `FEAT(search)`: support `!` to negate a search operator
* `FIX(dump-store)`: correct store not dumping on exit

## 0.6.0

* `FEAT(search)`: add ability to negate search using `-`
* `FEAT(links)`: unlink closed, unmerged PRs from issue
* `FEAT(board)`:  autoresize card titles on focus
* `FIX(board)`: prevent shrinking of PR and collaborator icons

## 0.5.1

* `FIX(board)`: prevent error on card filtering

## 0.5.0

* `FEAT(app)`: optimize card fetching
* `CHORE(app)`: cache board
* `FEAT(board)`: incrementally render cards
* `FIX(search)`: recognize colons in search values

## 0.4.1

* `CHORE`: numerous error handling and logging improvements
* `CHORE`: propagate board api errors
* `CHORE`: recover from background sync failures
* `FIX`: correctly handle _related to_ links
* `FIX`: update all (including already existing) links
* `FIX`: correctly reset org-auth installation cache

## 0.4.0

#### General

* `FEAT`: remove issues that failed to synchronize during background sync
* `FEAT`: parse and publish issue links

#### Board

* `FEAT`: collapse issue and closing PR into single card
* `FEAT`: add pull request icon

## 0.3.0

#### General

* `FEAT`: combine front-end and back-end into single app
* `FEAT`: migrate front-end to [Svelte](https://svelte.dev) and [Bootstrap](https://getbootstrap.com)
* `FEAT`: dump store on exit
* `FEAT`: add ability to dump and restore store to/from S3
* `FEAT`: enable response compression for public routes
* `FEAT`: add ability to configure board via `BOARD_CONFIG` environment variable
* `FEAT`: minimize amout of stored / transfered data
* `FIX`: allow moving a card to end of column

#### Search

* `FEAT`: show search hints as you type
* `FEAT`: show incremental / partial search results
* `FEAT`: add search by reviewer

#### Cards

* `FEAT`: hide column labels
* `FEAT`: display reviewers
* `FEAT`: display all assignees

## 0.2.0

_Initial version._
