#!/bin/bash

echo "Starting leagues data fetch..."
echo

echo "Fetching Fotmob leagues..."
node fetch-fotmob-leagues.js
if [ $? -ne 0 ]; then
    echo "Error fetching Fotmob leagues"
    exit 1
fi

echo
echo "Fetching Unibet leagues..."
node fetch-unibet-leagues.js
if [ $? -ne 0 ]; then
    echo "Error fetching Unibet leagues"
    exit 1
fi

echo
echo "All leagues data fetched successfully!"
echo "Check the generated JSON files in this directory."
