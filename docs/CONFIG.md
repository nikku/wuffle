# Config

Several aspects of the board application are configured via environment variables:


### GitHub App

| Parameter | Required? | Description |
| :--- | :---: |:--- |
| `APP_ID` | :ballot_box_with_check: | Your GitHub app ID |
| `WEBHOOK_SECRET` | :ballot_box_with_check: | Your GitHub webhook secret |
| `GITHUB_CLIENT_ID` | :ballot_box_with_check: | Your GitHub app client id |
| `GITHUB_CLIENT_SECRET` | :ballot_box_with_check: | Your GitHub client secret |


### Back-End

| Parameter | Required? | Description |
| :--- | :---: |:--- |
| `BASE_URL` | :ballot_box_with_check: | Base URL of your board `*` |
| `SESSION_SECRET` | :ballot_box_with_check: | Session secret for encrypting app cookies |
| `FORCE_HTTPS` | | Whether to enforce HTTPS on all routes |
| `BOARD_CONFIG` | | JSON encoded board configuration `**` |
| `TRUST_PROXY` | | Whether to trust the proxy settings provided via an `X-Forwarded-*` header |

`*` This must match the webhook URL that you configured for your GitHub app.

`**` Use this property instead of configuring your board via a `package/app/wuffle.config.js` file.


### Persistence

| Parameter | Required? | Description |
| :--- | :---: |:--- |
| `S3_BUCKET` |  | Name of S3 bucket to load and dump task board to |
| `AWS_ACCESS_KEY_ID` |  | Your AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` |  | Your AWS secret access key |


---

See also: [Setup](./SETUP.md)
