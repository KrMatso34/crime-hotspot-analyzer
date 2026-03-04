import express from 'express';
import cors from 'cors';

import navigation from './api/navigation/routes.js';
import alerts from './api/alerts/routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/navigation', navigation);
app.use('/api/spd-alerts', alerts);

const PORT = 4000;
app.listen(PORT, () => console.log(`API Server running on port ${PORT}.`));

// Run api server with: 'node server/index.js'