# Troubleshooting

This collects common setup errors and possible solutions.

### I cannot login on the board.

This may be due to a miss-configured _User authorization callback URL_ in your boards GitHub app. Make sure you configured it correctly according to the [setup instructions](https://github.com/nikku/wuffle/blob/master/docs/SETUP.md#configure-github-app).


### The logs show `signature mismatch error`.

Double check the webhook secret configured on the board and make sure it matches the secret of your GitHub app.


### The board failst to start with `no column mapped to state <Y> or called <Y>`

The board requires some special columsn to exist by name or to be assigned to an issue state. [Read more about it](https://github.com/nikku/wuffle/blob/master/docs/SETUP.md#mapping-special-columns) and ensure you configure your board accordingly.


---

See also: [Setup](https://github.com/nikku/wuffle/blob/master/docs/SETUP.md)
