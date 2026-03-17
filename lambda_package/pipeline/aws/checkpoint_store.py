import os
import boto3

STATE_TABLE = os.environ.get("STATE_TABLE", "CrimeIngestionState")
dynamodb = boto3.resource("dynamodb")
state_table = dynamodb.Table(STATE_TABLE)

def get_checkpoint(source_name: str):
    resp = state_table.get_item(Key={"source_name": source_name})
    item = resp.get("Item")
    if not item:
        return None
    return item.get("last_seen_value")

def set_checkpoint(source_name: str, last_seen_value):
    state_table.put_item(
        Item={
            "source_name": source_name,
            "last_seen_value": str(last_seen_value)
        }
    )