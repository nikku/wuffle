# Changelog

All notable changes to [wuffle](https://github.com/nikku/wuffle) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

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
