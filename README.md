> :construction: This project is currently in an _alpha_ state. Put your :rescue_worker_helmet: on and acknowledge that certain features [may still be missing](https://github.com/nikku/wuffle/issues).


# Wuffle

[![Build Status](https://travis-ci.com/nikku/wuffle.svg?branch=master)](https://travis-ci.com/nikku/wuffle)

A task board for [GitHub](https://github.com) issues.

![Wuffle Screenshot](./docs/screenshot.png)


## Features

* Multi-repository / organization support
* Private repository support (you only see the issues you'd see on GitHub, too)
* Only contributors can move/reorder issues on the board
* Configure columns and GitHub label to column mappings
* Automatically moves your issues across columns, as you develop
* Filter issues by name, issue label, and more


## Resources

* [Issues](https://github.com/nikku/wuffle/issues)
* [Changelog](./CHANGELOG.md)


## Philosophy

Some key aspects separate [Wuffle](https://github.com/nikku/wuffle) from the GitHub task board competition:

* __[GitHub issues](https://guides.github.com/features/issues/) are the source of truth.__ We read and store columns, relationships and everything else directly on GitHub. The only exception is issue order (not supported by GitHub, so far).

* __Tight integration with the [GitHub flow](https://guides.github.com/introduction/flow/).__ Your issues move automatically across the board. The board is always up to date with things going on in development.

* __Publicly accessible.__ You can share your project status without restrictions. Applied board filters are shareable deep links. We do, however, only display those issues to a visitor that she sees on GitHub, too. You'd like to see cards of your private repositories? Log-in with your GitHub identity and see them pop up in the mapped column.

* __Hackable.__ Wuffle is open source, MIT licensed. Contribute to it to make it even better. Self-host it and stay the owner of your data.


## Run it

```
npm install
npm run dev
```

#### First Time Setup

Go to [`localhost:3000`](http://localhost:3000) to register your GitHub app.

#### Inspect the Board

Jump to [`localhost:3001/board`](http://localhost:3001/board) to inspect your task board.


## Components

* [board](./packages/board) - the task board front-end
* [sync](./packages/sync) - the back-end and board API


## License

[MIT](LICENSE)
