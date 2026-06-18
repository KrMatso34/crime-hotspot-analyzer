import * as funcs from './alerts.controller.js';
import express from 'express';

const router = express.Router();

router.get('/', funcs.getAlerts);

export default router;