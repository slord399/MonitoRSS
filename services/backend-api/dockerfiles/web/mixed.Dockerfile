FROM node:24 AS build

WORKDIR /usr/src/app

# Copy packages and service
COPY package*.json ./
COPY packages/contracts ./packages/contracts/
COPY packages/logger ./packages/logger/
COPY services/backend-api ./services/backend-api/

# Global configuration layer
RUN npm install -g npm@12.0.1

# Build packages first so they are available (each in clean separate layers)
WORKDIR /usr/src/app/packages/contracts
RUN echo "allow-scripts=true" > .npmrc && \
    mv ../../package.json ../../package.json.bak || true && \
    npm install --legacy-peer-deps --foreground-scripts && \
    mv ../../package.json.bak ../../package.json || true && \
    rm -f .npmrc && \
    npm run build

WORKDIR /usr/src/app/packages/logger
RUN echo "allow-scripts=true" > .npmrc && \
    mv ../../package.json ../../package.json.bak || true && \
    npm install --legacy-peer-deps --foreground-scripts && \
    mv ../../package.json.bak ../../package.json || true && \
    rm -f .npmrc && \
    npm run build

# Install dependencies for service and client
WORKDIR /usr/src/app/services/backend-api
RUN echo "allow-scripts=true" > .npmrc && \
    mv ../../package.json ../../package.json.bak || true && \
    npm install --legacy-peer-deps --foreground-scripts && \
    mv ../../package.json.bak ../../package.json || true && \
    rm -f .npmrc

WORKDIR /usr/src/app/services/backend-api/client
RUN echo "allow-scripts=true" > .npmrc && \
    mv ../../../package.json ../../../package.json.bak || true && \
    npm install --legacy-peer-deps --foreground-scripts && \
    mv ../../../package.json.bak ../../../package.json || true && \
    rm -f .npmrc

FROM node:24 AS build-prod

RUN npm install -g npm@12.0.1

ARG VITE_FRESHDESK_WIDGET_ID
ARG VITE_PADDLE_PW_AUTH
ARG VITE_SENTRY_DSN
ARG VITE_PADDLE_CLIENT_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE

WORKDIR /usr/src/app
# Copy the built packages and services
COPY --from=build /usr/src/app ./

ENV SKIP_PREFLIGHT_CHECK=true
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_FRESHDESK_WIDGET_ID=$VITE_FRESHDESK_WIDGET_ID
ENV VITE_PADDLE_PW_AUTH=$VITE_PADDLE_PW_AUTH
ENV VITE_PADDLE_CLIENT_TOKEN=$VITE_PADDLE_CLIENT_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV SENTRY_RELEASE=$SENTRY_RELEASE

WORKDIR /usr/src/app/services/backend-api
RUN npm run build && cd client && npm run build

RUN mv ../../package.json ../../package.json.bak || true && \
    npm prune --omit=dev --ignore-scripts && \
    mv ../../package.json.bak ../../package.json || true

# Alpine will cause the app to mysteriously exit when attempting to register @fastify/secure-session
FROM node:24-slim AS prod

# Update npm
RUN npm install -g npm@12.0.1

RUN apt-get update && apt-get install -y wget
WORKDIR /usr/src/app

COPY --from=build-prod /usr/src/app/packages /usr/src/app/packages
COPY --from=build-prod /usr/src/app/services/backend-api/package*.json ./
COPY --from=build-prod /usr/src/app/services/backend-api/node_modules node_modules
COPY --from=build-prod /usr/src/app/services/backend-api/dist dist
COPY --from=build-prod /usr/src/app/services/backend-api/client/dist /usr/src/app/services/backend-api/client/dist

# Ensure the workdir is set to backend-api inside prod so running main.js can access client/dist relatively via process.cwd()
WORKDIR /usr/src/app/services/backend-api

ENV BACKEND_API_PORT=3000
