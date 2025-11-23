#!/bin/bash

# Database Initialization Script for Vercel Deployment
# This script initializes the Prisma database with the required schema

set -e

echo "🗄️  Database Initialization Script"
echo "=================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set DATABASE_URL before running this script:"
    echo "  export DATABASE_URL='your-database-url'"
    echo ""
    echo "Or pull from Vercel:"
    echo "  vercel env pull .env.local"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Check if migrations directory exists
if [ ! -d "prisma/migrations" ]; then
    echo "⚠️  No migrations found. Creating initial migration..."
    echo ""

    # Create initial migration
    echo "Creating migration from schema..."
    npx prisma migrate dev --name init

    echo "✅ Initial migration created"
else
    echo "📋 Migrations directory exists"
    echo ""

    # Show migration status
    echo "Checking migration status..."
    npx prisma migrate status || true
    echo ""

    # Deploy migrations
    echo "Deploying migrations..."
    npx prisma migrate deploy
    echo "✅ Migrations deployed"
fi

echo ""
echo "🎉 Database initialization complete!"
echo ""
echo "You can now:"
echo "  - View your database: npx prisma studio"
echo "  - Check status: npx prisma migrate status"
echo "  - Deploy to production: vercel --prod"
