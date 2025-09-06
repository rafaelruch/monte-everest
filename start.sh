#!/bin/bash

# Build the application
echo "Building Monte Everest..."
npm run build

# Build production server
echo "Building production server..."
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js

# Start the application
echo "Starting Monte Everest..."
exec node dist/server.js