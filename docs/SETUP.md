# Setup

Learn how to set up, configure and run your own [Wuffle board](https://wuffle.dev).

| Table of Contents |
| :--- |
| [Install and Run](#install-and-run) |
| [Configure the GitHub App](#configure-the-github-app) |
| [Connect GitHub Repositories](#connect-github-repositories) |
| [Configure the Board](#configure-the-board) |
| [Run in Production](#run-in-production) |
| [Run via Docker](#run-via-docker) |

If you accounter problems during the setup, please [file a help request](https://github.com/nikku/wuffle/issues/new?labels=question%2C+installation&template=SETUP_PROBLEM.md).


## Install and Run

Start from an empty folder:

```sh
# initialize a new app
npm init

# if you plan to check-in your board app,
# do not check-in node_modules
echo "node_modules" >> .gitignore

# do not check-in environment file, too
echo ".env" >> .gitignore
```

Install [wuffle](https://wuffle.dev) via `npm`:

```sh
npm install wuffle
```

Starting the board by using the `wuffle` executable:

```sh
npx wuffle
```

Open the app on [`localhost:3000`](http://localhost:3000).

The first time setup guides you through the installation process and helps you to [create a GitHub app](#configure-the-github-app). It also creates several assets in your local working directory: The `.env` file contains all environment variables required to run the app. The `wuffle.config.js` contains the [board configuration](#configure-board).

Once re-started and properly configured, [connect your GitHub repositories](#connect-github-repositories). Periodic background sync will pickup repositories, fetch issues from GitHub, and populate your board.

As a post-installation activity [configure the user login flow](#configure-user-login-flow). That allows users to log in to your board via GitHub to see their private repositories.

When [going into production](#run-in-production), run `wuffle` with strict validation and production tweaks turned on:

```sh
NODE_ENV=production npx wuffle
```


## Configure the GitHub App

The board connects to GitHub as a [GitHub app](https://developer.github.com/apps/). As part of the first-time setup, you create that GitHub app or import it into your environment.

You can [setup the app manually](#manual-github-app-setup), too.


### Configure User Login Flow

The board requires your visitors to login via GitHub if they want to perform board operations or move cards around.

To enable the login flow, configure the `User authorization callback URL` in your GitHub App settings page to point to `$BASE_URL/wuffle/login/callback`.


### Manual GitHub App Setup

[Create your GitHub app](https://github.com/settings/apps/new) and configure it according to the [provided app mainfest](../packages/app/app.yml).

In your current working directory, create a `.env` file-based on [our example](../packages/app/.env.example). Fill in the configuration provided to you by GitHub.


## Connect GitHub Repositories

Go to `https://github.com/apps/{APP_NAME}/installations/new` to install the app for all desired repositories and organizations. That sets up the required change notifications and write permissions to keep the board in sync with GitHub issues.


## Configure the Board

The board is configured via a local `wuffle.config.js` file:

```js
module.exports = {
  name: 'My Wuffle Board',
  columns: [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog', sorting: true },
    { name: 'Ready', label: 'ready', sorting: true },
    { name: 'In Progress', label: 'in progress', sorting: true },
    { name: 'Needs Review', label: 'needs review', sorting: true, fifo: true },
    { name: 'Done', label: null, closed: true }
  ]
};
```

Checkout a [full example](../packages/app/wuffle.config.example.js) for all available options.

Connect repositories that should appear on the board [via GitHub](#connect-github-repositories).


### Mapping Special Columns

The board requires you to map some special columns to know how to react to PR opening, issue closing, and so on. The following table shows the states and their mapping to the default column names used above:

| State | Default Column |
| :--- | :--- |
| `DEFAULT` / `EXTERNAL_CONTRIBUTION` | Inbox |
| `IN_PROGRESS` | In Progress |
| `IN_REVIEW` | Needs Review |
| `DONE` | Done |

If you would like to use custom-named columns, attach their special state via the `states` property:

```js
module.exports = {
  name: 'My Wuffle Board',
  columns: [
    { name: 'New', label: null, states: [ 'DEFAULT', 'EXTERNAL_CONTRIBUTION' ] },
    { name: 'Doing it', label: 'doing it', states: [ 'IN_PROGRESS' ] },
    { name: 'Review', label: 'review', states: [ 'IN_REVIEW' ] },
    { name: 'Finished', label: null, closed: true, states: [ 'DONE' ] }
  ]
};
```

Column mappings enable [automatic card movement](./AUTOMATIC_CARD_MOVEMENT.md) across the board as you develop.


### Column Ordering

Per default issues in a column will be ordered _last in, first out_. This means that, unless they are explicitly sorted into a column, new issues are added on top of existing ones in a column.

To change this to _first in, first out_ mark a column as `fifo`. New items will now end up at the bottom of a column. Useful, i.e. for review columns.


### Issue Links and Semantic Sorting

In addition to [default ordering](#column-ordering) board columns can be sorted based on [semantic issue links](./ISSUE_LINKS.md). Enable this feature for a column by marking it as `sorting`.


## Run in Production

Run the app with `NODE_ENV=production` to enable strict validation and certain production tweaks.

Instead of relying on a `.env` file, you can also  pass environment variables directly when starting the app:

```
NODE_ENV=production APP_ID=YOUR_APP_ID npx wuffle
```

Pass the [board configuration](#configure-the-board) as a JSON encoded string via the `BOARD_CONFIG` environment variable.

Hook up [Sentry](https://sentry.io/welcome/) to track errors at run-time.

Read through our [configuration section](./CONFIG.md) to learn about all available configuration options.

As you move to production, make sure to pass the correct `BASE_URL`. Update it on your GitHub app setting page if it changes.


## Run via Docker

If you use the [docker distribution](https://hub.docker.com/r/nrehwaldt/wuffle), pass your app configuration via environment variables:

```
docker run -p 3000:3000 \
  -e APP_ID=YOUR_APP_ID \
  -e BOARD_CONFIG="{JSON ENCODED BOARD CONFIGURATION}"
  -e ... \
  nrehwaldt/wuffle:latest
```

---

See also: [Configuration](./CONFIG.md), [Troubleshooting](./TROUBLESHOOTING.md)
