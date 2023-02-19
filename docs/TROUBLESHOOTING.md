# Troubleshooting

This page collects common setup errors and possible solutions.

### I cannot log in on the board.

This problem may arise due to a miss-configured _User authorization callback URL_ in your board's GitHub app. Make sure you configured it correctly according to the [setup instructions](https://github.com/nikku/wuffle/blob/main/docs/SETUP.md#configure-github-app).


### The logs show `signature mismatch error`.

Double-check the webhook secret configured on the board and make sure it matches your GitHub app's secret.


### The board fails to start with `no column mapped to state <Y> or called <Y>`.

The board requires some special columns to exist by name or to be assigned to an issue state. [Read more about it](https://github.com/nikku/wuffle/blob/main/docs/SETUP.md#mapping-special-columns) and ensure you configure your board accordingly.


### I would like to persist the board's logs.

You may record board logs to a file via output redirection:

```
npx wuffle > output.log
```

You may filter an existing output log for errors or warnings, respectively:

```
cat output.log | grep ERROR
cat output.log | grep WARN
```

### I would like to monitor my application for errors in production.

You may use the [Sentry support](https://probot.github.io/docs/deployment/#error-tracking) built into Probot to capture application errors and warnings.

Alternatively, capture and send the output as shown above.


---

See also: [Setup](https://github.com/nikku/wuffle/blob/main/docs/SETUP.md)
