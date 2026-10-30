import json
import sys

def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Invalid input JSON: {e}", file=sys.stderr)
        sys.exit(1)

    servers = data.get("servers", [])
    shows = data.get("shows", [])
    if not servers:
        print("No servers provided", file=sys.stderr)
        sys.exit(1)

    # Fake schedule: hand shows out to servers in turn (round-robin).
    assignments = []
    for i, show in enumerate(shows):
        server = servers[i % len(servers)]
        assignments.append({"show_id": show["id"], "server_ids": [server["id"]]})

    print(json.dumps({"status": "FAKE", "assignments": assignments}))

main()