import * as funcs from './data.controller.js';
import express from 'express';

const router = express.Router();

router.get('/', funcs.loadData);

export default router;