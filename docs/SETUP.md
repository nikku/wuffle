# Setup

Learn how to setup, configure and run your own [Wuffle board](https://wuffle.dev).

| Table of Contents |
| :--- |
| [Create GitHub App](#create-github-app) |
| [Configure GitHub App](#configure-github-app) |
| [Install GitHub App](#configure-github-app) |
| [Configure Board](#configure-board) |
| [Run Board](#run-board) |

If you accounter problems while setting up your Wuffle instance, please [file a help request](https://github.com/nikku/wuffle/issues/new?labels=question%2C+installation&template=SETUP_PROBLEM.md).


## Create GitHub App

The board is connected to GitHub as a [GitHub app](https://developer.github.com/apps/). Get started by creating a GitHub app, either via the development setup or using [manual configuration steps](#manual-steps) as documented below.


### Automatic Development Setup

Checkout, install and run the application in development mode as shown below:

```bash
git clone git@github.com:nikku/wuffle.git
cd wuffle
npm install
npm run dev
```

Access the application on [`localhost:3000`](http://localhost:3000). [Probot](https://probot.github.io/), the app framework used by Wuffle, helps you to create your GitHub app. Give your app a unique name and remember it.

Once the setup completes probot writes the basic app configuration to the `packages/app/.env` file. Go to your app page on GitHub, fetch client ID and client secret and add these properties to the `.env` file as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, respectively.

### Manual Steps

[Create your GitHub app](https://github.com/settings/apps/new) and configure it according to the [provided app mainfest](../packages/app/app.yml).

Create a `packages/app/.env` file with the required configuration variables as provided by GitHub. Use the [provided example](../packages/app/.env.example) as a starting point.


## Configure GitHub App

The board requires your visitors to login via GitHub if the would like to perform board operations or move cards around. 

To enable the login flow point the `User authorization callback URL` property on your GitHub App settings page to `$BASE_URL/wuffle/login/callback`.


## Install GitHub App

Go to your GitHub app user page on `https://github.com/apps/YOUR_APP_NAME` and install the app for all desired repositories and organizations. This sets up the required change notifications and write permissions to keep the board in sync with GitHub issues.


## Configure Board

Setup a `packages/app/wuffle.config.js` file, configuring the board:

```js
module.exports = {
  name: 'My Wuffle Board',
  columns: [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog', sorting: true },
    { name: 'Ready', label: 'ready', sorting: true },
    { name: 'In Progress', label: 'in progress' },
    { name: 'Needs Review', label: 'needs review' },
    { name: 'Done', label: null, closed: true }
  ]
};
```

Make sure that you [enabled your app](#configure-github-app) for all repositories that you would like to connect to the board.


### Mapping Special Columns

The board requires you to map a number of special columns in order to know, how to react to PR opening, issue closing and so on. The following table shows the states and their mapping to the default column names used above:

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

Column mappings enable [automatic card movement](./AUTOMATIC_CARD_MOVEMENT.md) across the board, as you develop.


### Issue Links and Automatic Sorting 

Board columns can sorted automatically, based on [sematic issue links](./ISSUE_LINKS.md). Enable this feature for individual columns by marking them as `sorting`.


## Run Board

If you started your app in development mode the board should reload automatically. If properly configured, background sync will pickup repositories, fetch issues from GitHub and populate your board.

### Run in Production

You can pass the environment variables stored in your `.env` directly when starting the app:

```
NODE_ENV=production APP_ID=YOUR_APP_ID cd packages/app && node bin/run.js
```

Read through our [configuration section](./CONFIG.md) to learn about all available configuration options.

Make sure to pass the correct `BASE_URL` and update it on your GitHub app once it changes for production.


### Run via Docker

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
