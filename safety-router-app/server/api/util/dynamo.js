import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import crypto from 'crypto';
import bcrypt from 'bcrypt';

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


// ---------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------
const TABLE_NAME = "Accounts"

export async function findAccountById(id) {
    try {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                id: String(id) 
            }
        });

        const response = await docClient.send(command);
        return response.Item || null;
    } catch (error) {
        console.error("DynamoDB Get Error:", error);
        throw error;
    }
}


// Because username isn't the Primary Key, we must look it up specifically.
// For production, we should add a Global Secondary Index (GSI) on the 'username' attribute in AWS Console.
export async function findAccountByUsername(username) {
    try {
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "username = :username",
            ExpressionAttributeValues: {
                ":username": username.toLowerCase()
            }
        });

        const response = await docClient.send(command);
        
        if (response.Items && response.Items.length > 0) {
            return response.Items[0]; 
        }

        return null;
    } catch (error) {
        console.error("DynamoDB Scan Error:", error);
        throw error;
    }
}

export async function addAccount(username, password) {
    
    const existingUser = await findAccountByUsername(username);
    if (existingUser) return { success: false, message: "Username taken" };

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID(); 

    const now = new Date().toISOString();

    const newAccount = {
        id: userId,
        displayUsername: username,
        username: username.toLowerCase(),
        password: hashedPassword,
        savedAddress: '',
        createdAt: now, 
        updatedAt: now,
    };

    try {
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: newAccount
        });

        await docClient.send(command);

        return { success: true, id: userId };
    } catch (error) {
        console.error("DynamoDB Put Error:", error);
        return { success: false, message: "Database write failed" };
    }
}


export async function updateAccountAddress(id, savedAddress) {
    try {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id: String(id) },
            UpdateExpression: "SET savedAddress = :address, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
                ":address": savedAddress,
                ":updatedAt": new Date().toISOString() 
            }
        });

        await docClient.send(command);
        return true; 
    } catch (error) {
        console.error("DynamoDB Update Error:", error);
        throw error; 
    }
}