#!/bin/bash

# Build the application
echo "Building Monte Everest..."
npm run build

# Start the application
echo "Starting Monte Everest..."
exec npm start