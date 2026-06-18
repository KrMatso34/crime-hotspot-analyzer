import * as funcs from './lights.controller.js';
import express from 'express';

const router = express.Router();

router.get('/:minLat/:minLon/:maxLat/:maxLon', funcs.loadData);

export default router;