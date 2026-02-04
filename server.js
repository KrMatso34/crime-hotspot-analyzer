// server.js - Node.js + Express prototype for Crime Hotspot Analyzer API

// Import required modules
const express = require('express');
const turf = require('@turf/turf'); // For geospatial calculations (e.g., distance, points)

// Create the Express app
const app = express();
const port = 3000; // Port to run on (you can change this)

// Middleware to parse JSON bodies (if you need POST requests later)
app.use(express.json());

// Endpoint 1: Welcome / Root
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Crime Hotspot Analyzer API (Node.js + Express version)',
    status: 'running',
    endpoints: [
      { path: '/api/graph/:city', description: 'Get mocked graph data for a city' }
    ]
  });
});

// Endpoint 2: Get mocked graph data with geospatial example
app.get('/api/graph/:city', (req, res) => {
  const city = req.params.city; // Get city from URL path

  // Mocked data (in real app, this could come from MongoDB or OSMnx-like service)
  const mockedGraph = {
    city: city,
    nodes: 159, // Number of graph nodes (e.g., intersections)
    edges: 323, // Number of graph edges (e.g., streets)
    message: 'This is mocked data. In a real app, integrate with OpenStreetMap or crime DB.'
  };

  // Example geospatial calculation using Turf.js (distance between two points)
  const point1 = turf.point([-122.4194, 37.7749]); // Example: San Francisco coord
  const point2 = turf.point([-118.2437, 34.0522]); // Example: Los Angeles coord
  const distance = turf.distance(point1, point2, { units: 'kilometers' });

  // Add geospatial example to response
  mockedGraph.geospatial_example = {
    point1: 'San Francisco',
    point2: 'Los Angeles',
    distance_km: Math.round(distance)
  };

  res.json(mockedGraph);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Test it by visiting http://localhost:3000/ or http://localhost:3000/api/graph/Chicago');
});
