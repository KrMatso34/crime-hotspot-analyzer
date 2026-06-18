
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class MyReporter {

	constructor() {
		this.filePath = path.join(__dirname, 'test-report.csv');
		if (!fs.existsSync(this.filePath)) {
			const header = "testCaseId,requirement,precondition,procedure,testData,expectedResult,actualResult,pass/fail,tester,date\n";
			fs.writeFileSync(this.filePath, header);
		}
	}

	onTestEnd(test, result) {
		const getAnnotation = (type, defaultVal='N/A') => test.annotations.find(a => a.type === type)?.description || defaultVal;

		const testCaseId = getAnnotation('testCaseId');

		if (!testCaseId) {
			console.error('Test case ID not defined!');
			return;
		}

		const procedure = result.steps
			.filter(step => step.category === 'test.step') 
			.map(step => step.title)
			.join(' -> ');

		const actualResult = 
			result.errors.length > 0 
				? `Failed at: ${result.errors[0].message.split('\n')[0]}` 
				: "All assertions passed successfully";
			
		const passFail = result.status.toUpperCase();
		const requirement = getAnnotation('requirement')
		const testData = getAnnotation('testData');

		// Formatting the output array
		const reportRow = [
			testCaseId,
			requirement,
			getAnnotation('precondition', 'App is reachable'),
			procedure,
			testData,
			getAnnotation('expectedResult', `Success with ${requirement}`),
			actualResult,
			passFail,
			"AUTOMATIC",
			new Date().toLocaleDateString()
		];

		console.log(`Logged row (${testCaseId}): ${passFail}`)
		fs.appendFileSync(this.filePath, reportRow.join(';') + "\n");
		//console.log("\n--- TEST LOG ENTRY ---");
		//console.table([reportRow]);
	}
}
