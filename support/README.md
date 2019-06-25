# Wuffle Docker Image

## How to build

Run the following command at the root of the Wuffle project to build the Docker image:

```
docker build -f support/Dockerfile -t local/wuffle:latest .
```

## How to run

Run the following command to run the Wuffle Docker image:

```
docker run -p3000:3000 -v/path/to/.env:/usr/src/app/packages/app/.env -v/path/to/wuffle.config.js:/usr/src/app/packages/app/wuffle.config.js local/wuffle:latest
```
