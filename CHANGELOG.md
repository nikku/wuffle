# Changelog

All notable changes to [wuffle](https://github.com/nikku/wuffle) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

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
