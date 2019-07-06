# Docker

Run the board via our pre-built [Docker image](https://hub.docker.com/r/nrehwaldt/wuffle), [configured via environment variables](https://github.com/nikku/wuffle/blob/master/docs/CONFIG.md):

```sh
docker run -p 3000:3000 -e APP_ID=YOUR_APP_ID -e ... nrehwaldt/wuffle:latest
```


## Roll Your Own

Build your own image via the provided [`Dockerfile`](./Dockerfile):

```sh
docker build -f support/docker/Dockerfile -t local/wuffle:latest .
```

Run the local image, configured via environment variables:

```sh
docker run -p 3000:3000 -e APP_ID=YOUR_APP_ID -e ... local/wuffle:latest
```
