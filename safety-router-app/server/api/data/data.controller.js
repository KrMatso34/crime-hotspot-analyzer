import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(client);

async function scanTable(tableName) {
	let allItems = [];
	let lastEvaluatedKey = undefined;

	do {
		const command = new ScanCommand({
			TableName: tableName,
			ExclusiveStartKey: lastEvaluatedKey,
		});

		const response = await docClient.send(command);
		allItems.push(...(response.Items || []));
		
		// If this is present, there is more data to fetch
		lastEvaluatedKey = response.LastEvaluatedKey;
		
	} while (lastEvaluatedKey);

	return allItems;
}

function getSeverity(eventType) {
	if (eventType === 'VIOLENT_CRIME') {
		return 3;
	} else if (eventType === 'PROPERTY_CRIME') {
		return 2;
	} else {
		return 1;
	}
}

export async function loadData(req, res) {
	const data = await scanTable('CrimeEvents');
	console.log(data[0]);
	res.json(
		data.map(entry => (
			[
				entry.location.lat, 
				entry.location.lon, 
				getSeverity(entry.event_type), 
				entry.raw.offense_category,
				entry.occurred_at
			]
		))
	);
}