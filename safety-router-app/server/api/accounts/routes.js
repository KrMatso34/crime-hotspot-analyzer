import * as funcs from './accounts.controller.js';
import express from 'express';

const router = express.Router();

router.post('/login', funcs.validateLogin);

router.post('/signup', funcs.signUp);

router.put('/:id/address', funcs.updateSavedAddress);

export default router;