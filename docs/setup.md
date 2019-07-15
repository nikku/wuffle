## Setup Notes


To get started you will need to clone the Wuffle project from:
```
git clone https://github.com/nikku/wuffle.git
```

Then run `npm install` and `npm run dev`. This will register the new app with an appropriatev name `<app_name>` name and  generate a `.env` file. 
You will also need to link the app to specific repositories that will be displayed on the board and updated in the `wuffle.config.js` as shown below

The repositories associated with an app can be updated if required via the app installation page via `https://github.com/apps/<app_name>`. Then select `Configure` and `sky-uk` settings to add or remove repositories
[![https://github.com/joannnenolan-sky/wuffle/blob/setup-notes/docs/images/repos.png)](https://github.com/joannnenolan-sky/wuffle/blob/setup-notes/docs/images/repos.png)

- This file will also require the `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. These can be obtained from the app settings via `https://github.com/settings/apps/<app_name>`
[![App Settings](https://github.com/joannnenolan-sky/wuffle/blob/setup-notes/docs/images/app-page.png)](https://github.com/joannnenolan-sky/wuffle/blob/setup-notes/docs/images/app-page.png)

The `.env` should be formatted so it looks like the below 
```dotenv
# This is the .env file for  <TEAM>

# ID of your GitHub app
APP_ID=<APPID>

# Go to https://smee.io/new set this to the URL that you are redirected to.
WEBHOOK_PROXY_URL=<WEBHOOK_PROXY_URL>
WEBHOOK_SECRET=<WEBHOOK_SECRET>

# The client config of your GitHub app, used for OAuth flow
GITHUB_CLIENT_ID=<GITHUB_CLIENT_ID>
GITHUB_CLIENT_SECRET=<GITHUB_CLIENT_SECRET>

# Secret secret, used to encrypt session cookies
PRIVATE_KEY=<PRIVATE_KEY>

# Use `trace` to get verbose logging or `info` to show less
LOG_LEVEL=info

BASE_URL=https://<deployed_location>

``` 
Important Note: the `BASE_URL` will be used for authorisation callback with Github and will also be the url for the Wuffle board.
The following URL must be set the app settings in `https://github.com/settings/apps/<app_name>` to allow sign in to be successful.
`https://github.com/settings/apps/<app_name>/wuffle/login/callback`
[![Callback Url](https://github.com/joannnenolan-sky/wuffle/blob/setup-notes/docs/images/callback.png)](https://github.com/joannnenolan-sky/wuffle/blob/setup-notes/docs/images/callback.png)

Any changes to the hostname/BASE_URL for an application **must** be replicated at `https://github.com/settings/apps/<app_name>` for the `User authorization callback URL` field or the Wuffle callback after a successful authorisation will not work at all

It is important that the permissions of the app are correct. You must set the following permissions in `https://github.com/settings/apps/<app_name>/permissions` or you will not be able to access or update the issues
[![Permissions](https://github.com/joannnenolan-sky/wuffle/blob/setup-notes/docs/images/permissions.png)](permissions.png)


A `wuffle.config.js` will also need to be created and the `metadata.name` will need to be set to whatever team name is being used
This should contain the columns you want to see and a `backlog` columns to store all issues that are not matching the specified label in the other columns, ie `next`, or `in progress`
The repositories listed in the `repositories` block should match the repositories you added to the app during creation in the initial setup 

```js
  module.exports = {
      columns: [
          { name: 'Backlog', label: null },
          { name: 'To Do', label: 'next' },
          { name: 'In Progress', label: 'in progress' },
          { name: 'Needs Review', label: 'review' },
          { name: 'Done', closed: true,  merged: true }
      ],
      repositories: [
          'org/repo1',
          'org/repo2',
          'org/repo3'
      ]
  };
```
### Adding/Removing repos to your Wuffle
If a repo is added/removed for Wuffle, the `wuffle.config.js` file needs to be updated. This is required so that the `background-sync` task keeps up to date with any changes.

You also need to update the Github App permission by going to https://github.com/settings/apps/<app_name>/installations and clickign the cog to add/remove the repo so that the GithubApp has permission set start/stop reading repo information