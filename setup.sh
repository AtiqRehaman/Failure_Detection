#!/bin/bash

echo '🔧 Setting up AI-Powered Product Intelligence System...'

# Setup backend
echo '📦 Installing backend dependencies...'
cd server
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo '⚠️  Please update server/.env with your database credentials'
fi

cd ..

# Setup frontend
echo '📦 Installing frontend dependencies...'
cd client
npm install
cd ..

echo '✅ Setup complete!'
echo ''
echo '🚀 To start the application:'
echo '  1. Update server/.env with your database credentials'
echo '  2. Create the database: psql -U postgres -f database/schema.sql'
echo '  3. Start backend: cd server && npm run dev'
echo '  4. Start frontend: cd client && npm run dev'
echo ''
echo '📊 Access the application at: http://localhost:5173'
