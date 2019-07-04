FROM node:10.16-alpine as builder
WORKDIR /build

# install dependencies + cache them
COPY packages/*/package*.json package*.json lerna.json ./
COPY packages/app/package*.json ./packages/app/
COPY packages/board/package*.json ./packages/board/
RUN npm install --unsafe-perm

# copy + build project
COPY . /build
RUN npm run build


FROM node:10.16-alpine as prod-builder
WORKDIR /prod-build

# copy production assets
COPY --from=builder /build/packages/app ./packages/app
COPY --from=builder /build/packages/board/public ./packages/board/public

# install production dependencies
RUN (cd packages/app && npm prune --production)


FROM node:10.16-alpine
WORKDIR /app
EXPOSE 3000
ENV NODE_ENV=production

CMD (cd packages/app && node ./bin/run.js)

COPY --from=prod-builder /prod-build .

RUN addgroup -S app && \
    adduser -S -g app app && \
    chown -R app:app .

USER app