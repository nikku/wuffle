# Docker

If you are using [Docker](https://www.docker.com/) you may run the app via pre-built Docker images.

Run the pre-built image, configured via environment variables:

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