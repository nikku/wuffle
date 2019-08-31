# Changelog

All notable changes to [wuffle](https://github.com/nikku/wuffle) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 0.22.0

* `FEAT(search)`: include login/org in repository search
* `FEAT(search)`: use includes to filter labels and repositories
* `FEAT(board)`: deep link milestone to GitHub
* `FIX(board)`: correct icon sizes displaying wrong in Firefox ([#48](https://github.com/nikku/wuffle/pull/48))

## 0.21.0

* `FEAT(app)`: reduce re-ordering noise on the board by card order, if possible ([`62bea58d`](https://github.com/nikku/wuffle/commit/62bea58d447fcab6a5e64479e768f22828051c32)
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
