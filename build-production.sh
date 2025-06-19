#!/bin/bash
# Load production environment
export $(cat .env.production | xargs)
# Build the application
npm run build
