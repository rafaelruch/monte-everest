#!/bin/bash

# Build the frontend
echo "Building Monte Everest frontend..."
npm run build

# Start with simple server
echo "Starting Monte Everest..."
exec node server.js