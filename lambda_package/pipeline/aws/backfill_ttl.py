from datetime import datetime, timezone, timedelta
import boto3

TABLE_NAME = "CrimeEvents"
REGION = "us-east-2"

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def parse_iso_utc(value: str):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def main():
    updated = 0
    skipped = 0

    scan_kwargs = {}

    while True:
        resp = table.scan(**scan_kwargs)
        items = resp.get("Items", [])

        for item in items:
            event_id = item.get("event_id")
            occurred_at_utc = item.get("occurred_at_utc")

            if not event_id or not occurred_at_utc:
                skipped += 1
                continue

            occurred_dt = parse_iso_utc(occurred_at_utc)
            if not occurred_dt:
                skipped += 1
                continue

            expires_dt = occurred_dt + timedelta(days=90)
            expires_at = int(expires_dt.timestamp())

            table.update_item(
                Key={"event_id": event_id},
                UpdateExpression="SET expires_at = :e",
                ExpressionAttributeValues={":e": expires_at}
            )
            updated += 1

        if "LastEvaluatedKey" not in resp:
            break

        scan_kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]

    print(f"updated={updated}, skipped={skipped}")


if __name__ == "__main__":
    main()