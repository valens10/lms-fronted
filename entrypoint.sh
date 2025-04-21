#!/bin/sh

# Debug: Check if the environment variable is set
echo "🔧 API_URL: $API_URL"

# Use envsubst to replace the placeholder in the template file
envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js

# Start nginx server after replacing env variable
exec "$@"
