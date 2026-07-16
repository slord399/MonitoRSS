FROM node:24 AS build

# Update npm
RUN npm install -g npm@12.0.1

WORKDIR /usr/src/app

# Copy packages and service
COPY package*.json ./
COPY packages/contracts ./packages/contracts/
COPY packages/logger ./packages/logger/
COPY services/user-feeds-next ./services/user-feeds-next/

# Build packages first so they are available
WORKDIR /usr/src/app/packages/contracts
RUN npm install && npm run build

WORKDIR /usr/src/app/packages/logger
RUN npm install && npm run build

# Install and build the service
WORKDIR /usr/src/app/services/user-feeds-next
RUN npm install
RUN npm run build

FROM build AS build-prod
WORKDIR /usr/src/app/services/user-feeds-next
RUN npm prune --production

FROM node:24-alpine AS prod
WORKDIR /usr/src/app

# Update npm in the prod image too
RUN npm install -g npm@12.0.1

COPY --from=build-prod /usr/src/app/packages /usr/src/app/packages
COPY --from=build-prod /usr/src/app/services/user-feeds-next/package*.json ./
COPY --from=build-prod /usr/src/app/services/user-feeds-next/node_modules node_modules
COPY --from=build-prod /usr/src/app/services/user-feeds-next/dist dist
ENV NODE_ENV=production
CMD [ "node", "./dist/index.js" ]
