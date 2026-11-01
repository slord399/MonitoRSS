#!/usr/bin/env bash
set -euo pipefail

echo "=== MongoDB Feature Compatibility Version (FCV) Upgrade Sequence ==="
echo "Upgrading data volume from FCV 7.0 -> 8.0 for compatibility with MongoDB 8.0+ / 9.0..."

cleanup() {
  echo "Cleaning up any temporary containers..."
  docker rm -f mongo-fcv-upgrade-7 mongo-fcv-upgrade-8 2>/dev/null || true
}
trap cleanup EXIT

# Ensure production compose container is stopped
docker compose stop mongo 2>/dev/null || true

# Step 1: Verify database state on MongoDB 7.0 binary if needed
echo "Step 1: Starting database with MongoDB 7.0 binary to ensure clean state..."
docker run -d --name mongo-fcv-upgrade-7 \
  -v monitorss-prod_mongodb-data:/data/db \
  -p 27017:27017 \
  mongo:7.0

until docker exec mongo-fcv-upgrade-7 mongosh --quiet --eval "db.adminCommand('ping')" 2>/dev/null; do
  sleep 2
done

CURRENT_FCV=$(docker exec mongo-fcv-upgrade-7 mongosh --quiet --eval "db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 }).featureCompatibilityVersion.version")
echo "Current database FCV is: ${CURRENT_FCV}"

echo "Shutting down MongoDB 7.0 container cleanly..."
docker stop mongo-fcv-upgrade-7
docker rm -f mongo-fcv-upgrade-7

# Step 2: Start MongoDB 8.0 binary (which supports reading 7.0 data and setting FCV to 8.0)
echo "Step 2: Starting intermediate MongoDB 8.0 container..."
docker run -d --name mongo-fcv-upgrade-8 \
  -v monitorss-prod_mongodb-data:/data/db \
  -p 27017:27017 \
  mongo:8.0

echo "Waiting for MongoDB 8.0 to initialize..."
until docker exec mongo-fcv-upgrade-8 mongosh --quiet --eval "db.adminCommand('ping')" 2>/dev/null; do
  sleep 2
done

# Step 3: Upgrade FCV to 8.0
echo "Step 3: Setting featureCompatibilityVersion to '8.0'..."
docker exec mongo-fcv-upgrade-8 mongosh --eval 'db.adminCommand({ setFeatureCompatibilityVersion: "8.0" })'

UPDATED_FCV=$(docker exec mongo-fcv-upgrade-8 mongosh --quiet --eval "db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 }).featureCompatibilityVersion.version")
echo "Updated database FCV is now: ${UPDATED_FCV}"

# Step 4: Shut down MongoDB 8.0 container cleanly
echo "Step 4: Shutting down MongoDB 8.0 container cleanly..."
docker stop mongo-fcv-upgrade-8
docker rm -f mongo-fcv-upgrade-8

# Step 5: Start MongoDB via docker compose with the production image (mongo:latest / 9.0)
echo "Step 5: Starting production MongoDB container..."
docker compose up -d mongo

echo "Waiting for production MongoDB container to be ready..."
until docker exec monitorss-prod-mongo-1 mongosh --quiet --eval "db.adminCommand('ping')" 2>/dev/null; do
  sleep 2
done

FINAL_FCV=$(docker exec monitorss-prod-mongo-1 mongosh --quiet --eval "db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 }).featureCompatibilityVersion.version")
echo "Active production MongoDB FCV is: ${FINAL_FCV}"
echo "=== MongoDB FCV Upgrade Sequence Completed Successfully ==="
