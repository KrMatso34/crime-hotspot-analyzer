import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(client);

export async function scanTable(tableName, params={}) {
	let allItems = [];
	let lastEvaluatedKey = undefined;

	do {
		const command = new ScanCommand({
			TableName: tableName,
			ExclusiveStartKey: lastEvaluatedKey,
			...params
		});

		const response = await docClient.send(command);
		allItems.push(...(response.Items || []));
		
		// If this is present, there is more data to fetch
		lastEvaluatedKey = response.LastEvaluatedKey;
		
	} while (lastEvaluatedKey);

	return allItems;
}

export async function queryScanTable(tableName, column, valueList) {
	const promises = valueList.map(curValue =>
	docClient.send(new QueryCommand({
			TableName: tableName,
			KeyConditionExpression: `${column} = :g`,
			ExpressionAttributeValues: { ":g": curValue }
		}))
	);

	const results = await Promise.all(promises);
	return results.flatMap(r => r.Items);
}