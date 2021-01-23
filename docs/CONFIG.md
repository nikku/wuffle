# Config

Several aspects of [wuffle](https://wuffle.dev) are configured via environment variables:

### GitHub App

| Parameter | Required? | Description |
| :--- | :---: |:--- |
| `APP_ID` | :ballot_box_with_check: | Your GitHub app ID |
| `GITHUB_CLIENT_ID` | :ballot_box_with_check: | Your GitHub app client id |
| `GITHUB_CLIENT_SECRET` | :ballot_box_with_check: | Your GitHub client secret |
| `WEBHOOK_SECRET` | :ballot_box_with_check: | Your GitHub webhook secret |


### Back-End

| Parameter | Required? | Description |
| :--- | :---: |:--- |
| `BASE_URL` | :ballot_box_with_check: | Base URL of your board `*` |
| `BOARD_CONFIG` | | JSON encoded board configuration `**` |
| `FORCE_HTTPS` | | Whether to enforce HTTPS on all routes |
| `HOST` | | The host name to bind to |
| `PORT` | | The port to bind to |
| `SESSION_SECRET` | :ballot_box_with_check: | Session secret for encrypting app cookies |
| `TRUST_PROXY` | | Whether to trust the proxy settings provided via an `X-Forwarded-*` header |

`*` This must match the webhook URL that you configured for your GitHub app.

`**` Use this property instead of configuring your board via a local `wuffle.config.js` file or the `package/app/wuffle.config.js` file.


### Persistence

| Parameter | Required? | Description |
| :--- | :---: |:--- |
| `AWS_ACCESS_KEY_ID` |  | Your AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` |  | Your AWS secret access key |
| `S3_BUCKET` |  | Name of S3 bucket to load and dump task board to |


### Background Sync

| Parameter | Required? | Description |
| :--- | :---: | :--- |
| `BACKGROUND_SYNC_REMOVE_CLOSED_LOOKBACK` | | |
| `BACKGROUND_SYNC_SYNC_CLOSED_DETAILS` | | |
| `BACKGROUND_SYNC_SYNC_CLOSED_DETAILS_LOOKBACK` | | |
| `BACKGROUND_SYNC_SYNC_CLOSED_LOOKBACK` | | |
| `BACKGROUND_SYNC_SYNC_INTERVAL` | | |
| `BACKGROUND_SYNC_SYNC_OPEN_DETAILS_LOOKBACK` | | |
| `DISABLE_BACKGROUND_SYNC` | | |


### Misc

| Parameter | Required? | Description |
| :--- | :---: | :--- |
| `LOG_WEBHOOK_EVENTS` | | Whether to log incoming web hook events to a temporary directory. Useful for local debugging. |
| `WEBHOOK_PATH` | | |
| `WEBHOOK_PROXY_URL` | | The proxy url to use during local development. |


---

See also: [Setup](./SETUP.md)
