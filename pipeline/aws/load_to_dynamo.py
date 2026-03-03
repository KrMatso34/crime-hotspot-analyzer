import json
import time
import argparse
from decimal import Decimal

import boto3


def json_loads_decimal(line: str):
    # DynamoDB needs Decimal for floats
    return json.loads(line, parse_float=Decimal)


def chunked(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", default="CrimeEvents")
    parser.add_argument("--jsonl", default="pipeline/outputs/cleaned_events.jsonl")
    parser.add_argument("--limit", type=int, default=0, help="0 = no limit")
    args = parser.parse_args()

    dynamodb = boto3.resource("dynamodb", region_name="us-east-2")
    table = dynamodb.Table(args.table)

    items = []
    with open(args.jsonl, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, start=1):
            if args.limit and idx > args.limit:
                break
            items.append(json_loads_decimal(line))

    print(f"Loaded {len(items)} items from {args.jsonl}")

    # Batch write: 25 items max per batch
    written = 0
    with table.batch_writer(overwrite_by_pkeys=["event_id"]) as batch:
        for item in items:
            # Use event_id as the DynamoDB key
            # If your event dict uses "event_id" already, we’re good.
            # If it doesn’t, then set item["event_id"] = item["case_number"] or similar.
            if "event_id" not in item:
                raise ValueError("Missing event_id in item. Check your pipeline output schema.")
            batch.put_item(Item=item)
            written += 1

    print(f"✅ Wrote {written} items into DynamoDB table {args.table}")


if __name__ == "__main__":
    main()