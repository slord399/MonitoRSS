FROM node:24 AS build

# Update npm
RUN npm install -g npm@12.0.1

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-workspaces

COPY . ./

FROM node:24 AS build-prod
WORKDIR /usr/src/app
COPY --from=build /usr/src/app ./

RUN npm run build

RUN npm prune --omit=dev --ignore-scripts --no-workspaces

# Alpine will cause the app to mysteriously exit when attempting to register @fastify/secure-session
FROM node:24-slim AS prod

# Update npm
RUN npm install -g npm@12.0.1

RUN apt-get update && apt-get install -y wget
WORKDIR /usr/src/app

COPY --from=build-prod /usr/src/app/package*.json ./
COPY --from=build-prod /usr/src/app/node_modules node_modules
COPY --from=build-prod /usr/src/app/dist dist

ENV BACKEND_API_PORT=3000
