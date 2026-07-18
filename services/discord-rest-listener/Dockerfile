FROM node:24 AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g npm@12.0.1

RUN npm install --foreground-scripts --allow-scripts

COPY . ./

FROM build AS build-prod

WORKDIR /usr/src/app
COPY --from=build /usr/src/app ./

RUN npm run build

RUN npm prune --omit=dev --ignore-scripts

FROM node:24-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build-prod /usr/src/app/package*.json ./
COPY --from=build-prod /usr/src/app/node_modules node_modules
COPY --from=build-prod /usr/src/app/build build

CMD [ "node", "./build/app" ]
