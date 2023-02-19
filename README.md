# Wuffle

[![CI](https://github.com/nikku/wuffle/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/wuffle/actions/workflows/CI.yml)

A multi-repository / multi-organization task board for [GitHub issues](https://guides.github.com/features/issues/).

<p>
  <a target="_blank" rel="noopener noreferrer" href="https://github.com/nikku/wuffle">
    <img src="https://raw.githubusercontent.com/nikku/wuffle/main/docs/screenshot.png" width="100%" alt="Wuffle Screenshot" style="max-width:100%;" />
  </a>
</p>


## Features

* Multi-repository / organization support
* Maps issues to columns via labels or close states
* [Moves cards across columns](https://github.com/nikku/wuffle/blob/main/docs/AUTOMATIC_CARD_MOVEMENT.md) automatically, as you develop
* [Filters issues](https://github.com/nikku/wuffle/blob/main/docs/BOARD_FILTERS.md) by name, label, assignee, and more
* Visualizes reviews and pull request status/checks on a card
* Supports private repositories: Visitors only see cards for issues they see on GitHub, too
* Lets you create a new issue in _any_ connected repository
* Allows contributors to move/reorder cards
* Simple setup: Connects to GitHub as a [GitHub app](https://developer.github.com/apps/)


## Resources

* [Issues](https://github.com/nikku/wuffle/issues)
* [Roadmap](https://github.com/nikku/wuffle/issues?q=is%3Aissue+is%3Aopen+label%3Aroadmap)
* [Changelog](https://github.com/nikku/wuffle/blob/main/packages/app/CHANGELOG.md)
* [Setup and Run](https://github.com/nikku/wuffle/blob/main/docs/SETUP.md)
* [Documentation](https://github.com/nikku/wuffle/tree/main/docs#readme)


## Philosophy

Some key aspects separate [Wuffle](https://github.com/nikku/wuffle) from the GitHub task board competition:

* __[GitHub issues](https://guides.github.com/features/issues/) are the source of truth.__ We read and store columns, relationships, and everything else directly on GitHub. The only exception is issue order (not supported by GitHub, so far).

* __No [projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects), no cards.__ No secondary editing UI, no incomplete views on your backlog. Just issues, milestones, and labels, all the way.

* __Tight integration with the [GitHub flow](https://guides.github.com/introduction/flow/).__ Your issues move automatically across the board. The board is always up to date with things going on in development.

* __Publicly accessible.__ You can share your project status without restrictions. Applied board filters are shareable deep links. However, we do only display those issues to a visitor that she sees on GitHub, too. Would you like to see cards from your private repositories? Log in with your GitHub identity and see them pop up in the mapped column.

* __Hackable.__ Wuffle is open source, MIT licensed. Contribute to it to make it even better. Self-host it and stay the owner of your data.


## Setup and Run

Starting the board, including first-time setup if you have [npm](https://www.npmjs.com/) installed:

```
npx wuffle
```

Read the [setup instructions](https://github.com/nikku/wuffle/blob/main/docs/SETUP.md) for detailed explaination for the what and why.

Alternatively, run the app [via Docker](https://github.com/nikku/wuffle/tree/main/support/docker) if you already configured it.


## Components

* [board](https://github.com/nikku/wuffle/blob/main/packages/board) - the task board front-end
* [app](https://github.com/nikku/wuffle/blob/main/packages/app) - the back-end and board API


## License

[MIT](https://github.com/nikku/wuffle/blob/main/LICENSE)
