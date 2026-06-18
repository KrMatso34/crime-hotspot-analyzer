import express from 'express';
import cors from 'cors';

import navigation from './api/navigation/routes.js';
import alerts from './api/alerts/routes.js';
import data from './api/data/routes.js';
import lights from './api/lights/routes.js';
import accounts from './api/accounts/routes.js';
import prediction from './api/prediction/routes.js';

const app = express();
app.use(cors(
/*
{
  origin: ['https://main.xxxx.amplifyapp.com', 'http://localhost:3000'] // Allow production and local testing
}
*/
));
app.use(express.json());

app.use('/api/navigation', navigation);
app.use('/api/spd-alerts', alerts);
app.use('/api/data', data);
app.use('/api/lights', lights);
app.use('/api/accounts', accounts);
app.use('/api/prediction', prediction);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Server running on port ${PORT}.`));

// Run api server with: 'node server/index.js'