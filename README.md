# Wuffle

[![Build Status](https://travis-ci.com/nikku/wuffle.svg?branch=master)](https://travis-ci.com/nikku/wuffle) ![Project Status - alpha](https://img.shields.io/badge/status-alpha-orange.svg)

A multi-repository task board for [GitHub issues](https://guides.github.com/features/issues/).

<p>
  <a target="_blank" rel="noopener noreferrer" href="https://github.com/nikku/wuffle">
    <img src="https://raw.githubusercontent.com/nikku/wuffle/master/docs/screenshot.png" width="100%" alt="Wuffle Screenshot" style="max-width:100%;" />
  </a>
</p>


## Features

* Multi-repository / organization support
* Private repository support (you only see the issues you'd see on GitHub, too)
* Only contributors can move/reorder issues on the board
* Configure columns and GitHub label to column mappings
* Automatically moves your issues across columns, as you develop
* Filter issues by name, issue label, and more


## Resources

* [Issues](https://github.com/nikku/wuffle/issues)
* [Changelog](https://github.com/nikku/wuffle/blob/master/CHANGELOG.md)


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

## Setup

Execute the following steps to initially setup the app

* Go to [`localhost:3000/probot`](http://localhost:3000/probot) to register your GitHub app
* Update the created `packages/app/.env` file with additional details based on the [`.env.example`](packages/app/.env.example)
* Create a `packages/app/wuffle.config.js` based on the [`wuffle.config.example.js`](packages/app/wuffle.config.example.js)


## Components

* [board](https://github.com/nikku/wuffle/blob/master/packages/board) - the task board front-end
* [app](https://github.com/nikku/wuffle/blob/master/packages/app) - the back-end and board API


## License

[MIT](https://github.com/nikku/wuffle/blob/master/LICENSE)
