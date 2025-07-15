#!/bin/bash

echo "Starting HMI Agent..."
echo

echo "Starting Backend Server..."
cd backend && npm start &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

echo "Starting Frontend Server..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo
echo "✅ Both servers are starting!"
echo
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 