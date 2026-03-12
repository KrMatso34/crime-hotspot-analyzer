import * as funcs from './navigation.controller.js';
import express from 'express';

const router = express.Router();

/** Make optimized navigation route
 * @route	POST /
 * @access	Public
 * 
 * @param	{Object}	body.origin
 * @param	{Float}		body.origin.lat
 * @param	{Float}		body.origin.lon
 * 
 * @param	{Object}	body.destination
 * @param	{Float}		body.destination.lat
 * @param	{Float}		body.destination.lon
 * 
 * @param	{String}	body.preference
 * 
 * @param	{Object}	body.context
 * @param	{String}	body.context.time
 * 
 * @returns {RouteNavigationData}
 */
router.post('/', funcs.getRoute);

export default router;