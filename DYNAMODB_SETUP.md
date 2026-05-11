# DynamoDB Setup Guide

## Overview
The Crime Hotspot Analyzer now uses AWS DynamoDB for storing and querying real crime data. This guide walks you through setting up your DynamoDB tables and configuring the application.

## Prerequisites
- AWS Account with DynamoDB access
- AWS CLI configured with appropriate credentials
- Node.js environment variables properly set

## DynamoDB Table Schema

### CrimeData Table
The main table for storing crime incidents.

**Table Name:** `CrimeData`

**Primary Key:**
- Partition Key: `id` (String) - Unique crime incident ID
- Sort Key: `timestamp` (Number) - Unix timestamp of the crime

**Attributes:**
- `id` (String) - Unique identifier for the crime incident
- `timestamp` (Number) - Unix timestamp when the crime occurred
- `latitude` (Number) - Latitude coordinate
- `longitude` (Number) - Longitude coordinate
- `crimeType` (String) - Type of crime (e.g., "Theft", "Burglary", "Assault")
- `severity` (String) - Severity level: "low", "medium", "high", "critical"
- `address` (String) - Street address of the incident
- `description` (String) - Detailed description of the incident
- `precinct` (String) - Police precinct or jurisdiction
- `reportDate` (String) - Date the crime was reported

**Global Secondary Indexes (GSI):**

1. **LocationIndex**
   - Partition Key: `crimeType` (String)
   - Sort Key: `timestamp` (Number)
   - Projection: All

2. **TimestampIndex**
   - Partition Key: `timestamp` (Number)
   - Projection: All

## Setting Up DynamoDB Tables

### Option 1: Using AWS Console
1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb)
2. Click "Create table"
3. Enter table name: `CrimeData`
4. Set Partition key: `id` (String)
5. Set Sort key: `timestamp` (Number)
6. Configure billing mode (On-demand recommended for variable workloads)
7. Create the table

### Option 2: Using AWS CLI
```bash
aws dynamodb create-table \
  --table-name CrimeData \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2
```

## Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your AWS credentials:
```
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_CRIMES_TABLE=CrimeData
```

## Data Import

### Sample Crime Data Format
```json
{
  "id": "crime-001",
  "timestamp": 1715000000,
  "latitude": 47.6101,
  "longitude": -122.2015,
  "crimeType": "Theft",
  "severity": "medium",
  "address": "123 Main St, Bellevue, WA",
  "description": "Package theft from front porch",
  "precinct": "Bellevue Police Department",
  "reportDate": "2024-05-06"
}
```

### Batch Import Using AWS CLI
```bash
aws dynamodb batch-write-item \
  --request-items file://crime-data.json \
  --region us-west-2
```

## Fallback Behavior

If DynamoDB connection fails:
- The application automatically falls back to mock crime data
- A warning message is logged to the console
- Risk calculations continue using the mock dataset
- Production deployments should monitor these fallbacks

## Testing the Connection

1. Start the server:
```bash
npm run dev
```

2. Test the hotspots endpoint:
```bash
curl http://localhost:3000/api/crime/hotspots
```

3. Test the area query:
```bash
curl "http://localhost:3000/api/crime/area?lat=47.6101&lon=-122.2015&radiusKm=2"
```

## Security Best Practices

1. **Never commit credentials** - Use environment variables only
2. **Use IAM roles** - For AWS services, use IAM roles instead of access keys
3. **Enable encryption** - Enable AWS DynamoDB encryption at rest
4. **Set up VPC** - Restrict DynamoDB access to private VPC endpoints
5. **Monitor access** - Enable CloudTrail logging for all DynamoDB operations
6. **Rate limiting** - Set appropriate read/write capacity or use on-demand billing

## Troubleshooting

### Connection Errors
- Verify AWS credentials are correct
- Check AWS region matches your table's region
- Ensure AWS user has DynamoDB permissions

### Query Performance
- Check GSI configuration
- Monitor consumed capacity
- Consider partitioning data by date ranges

### Data Issues
- Verify timestamp format (Unix seconds)
- Ensure latitude/longitude are valid numbers
- Check crime type values match expected categories

## Production Considerations

1. **Geo-spatial queries** - Consider adding a geo-indexing service (e.g., DynamoDB Streams + ElasticSearch)
2. **Real-time updates** - Use DynamoDB Streams to trigger updates
3. **Caching** - Implement Redis caching for frequently accessed hotspots
4. **Archival** - Set up TTL on old records to manage costs
5. **Backup** - Enable point-in-time recovery for DynamoDB tables

## References
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
