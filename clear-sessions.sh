#!/bin/bash

# Script to clear all active sessions
echo "Clearing all active sessions..."

# Get the current token if user is logged in
curl -X POST http://localhost:5000/api/clear-sessions \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -c cookies.txt \
  -d '{}'

echo -e "\nSessions cleared. Please log in again with your new credentials:"
echo "Username: workshop"
echo "Password: StoneFluteShop2025!"