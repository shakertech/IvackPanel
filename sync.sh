#!/bin/bash

# Exit immediately if a command fails
set -e

echo "Fetching latest changes from origin..."
git fetch origin

echo "Resetting local branch to origin/main..."
git reset --hard origin/main

echo "Done. Your branch is now synced with origin/main."