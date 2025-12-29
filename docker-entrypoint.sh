#!/bin/sh
# ============================================================================
# SpecBoard Docker Entrypoint
# Handles database migrations before starting the application
# ============================================================================

set -e

echo "🚀 Starting SpecBoard..."

# Wait for database to be ready (extra safety beyond healthcheck)
echo "⏳ Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma db push --skip-generate 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Failed to connect to database after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "⏳ Database not ready, retrying in 2 seconds... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "✅ Database schema synchronized"

# Start the application
echo "🌐 Starting Next.js server on port ${PORT:-3000}..."
exec "$@"
