FROM node:24-alpine as builder
WORKDIR /build

# install dependencies + cache them
COPY packages/*/package*.json package*.json lerna.json ./
COPY packages/app/package*.json ./packages/app/
COPY packages/board/package*.json ./packages/board/
RUN npm ci --unsafe-perm

# copy + build project
COPY . /build
RUN npm run build


FROM node:24-alpine as prod-builder
WORKDIR /prod-build

# copy production assets
COPY --from=builder /build/packages/app ./packages/app

# install production dependencies
RUN (cd packages/app && npm prune --omit=dev)


FROM node:24-alpine
WORKDIR /app
EXPOSE 3000
ENV NODE_ENV=production

CMD (cd packages/app && node ./bin/wuffle)

COPY --from=prod-builder /prod-build .

RUN addgroup -S app && \
    adduser -S -g app app && \
    chown -R app:app .

USER app