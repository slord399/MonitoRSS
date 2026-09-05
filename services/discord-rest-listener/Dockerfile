FROM node:24 AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g npm@12.0.2

RUN echo "allow-scripts=true" > .npmrc && \
    npm install --legacy-peer-deps --foreground-scripts && \
    rm -f .npmrc

COPY . ./

# docker-compose.base.yml runs this target directly, so it must contain build/app.js.
RUN npm run build

FROM build AS build-prod

WORKDIR /usr/src/app

RUN npm install -g npm@12.0.2

RUN npm prune --legacy-peer-deps --omit=dev --ignore-scripts

FROM node:24-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build-prod /usr/src/app/package*.json ./
COPY --from=build-prod /usr/src/app/node_modules node_modules
COPY --from=build-prod /usr/src/app/build build

CMD [ "node", "./build/app" ]
