#!/bin/sh
set -e

# Runtime token injection for Mapbox
# This replaces the placeholder in config.js with the actual token from environment variable

CONFIG_FILE="/usr/share/nginx/html/config.js"

if [ -n "$MAPBOX_TOKEN" ]; then
    echo "Injecting Mapbox token into runtime config..."
    sed -i "s|__MAPBOX_TOKEN_PLACEHOLDER__|${MAPBOX_TOKEN}|g" "$CONFIG_FILE"
else
    echo "WARNING: MAPBOX_TOKEN environment variable not set. Map functionality will be limited."
fi

# Execute the main command (nginx)
exec "$@"
