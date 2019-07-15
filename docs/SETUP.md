# Setup

Learn how to setup, configure and run your own [Wuffle board](https://wuffle.dev).

| Table of Contents |
| :--- |
| [Create GitHub App](#create-github-app) |
| [Configure GitHub App](#configure-github-app) |
| [Configure Board](#configure-board) |
| [Run Board](#run-board) |


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

Go to your GitHub app page on `https://github.com/apps/YOUR_APP_NAME` and install the app for all desired repositories and organizations. This sets up the required change notifications and write permissions to keep the board in sync with GitHub issues.


## Configure Board

Setup a `packages/app/wuffle.config.js` file describing all repositories your board should synchronize:

```js
module.exports = {
  columns: [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog' },
    { name: 'Ready', label: 'ready' },
    { name: 'In Progress', label: 'in progress' },
    { name: 'Needs Review', label: 'needs review' },
    { name: 'Done', label: null, closed: true }
  ],
  repositories: [
    'org1/repo1',
    'org2/repo2'
  ]
};
```

Make sure that you [configured your app](#configure-github-app) for all these repositories.


## Run Board

If you started your app in development mode the board should reload automatically. If properly configured, background sync will pickup configured repositories, fetch issues from GitHub and populate your board.

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

See also: [Configuration](./CONFIG.md)
