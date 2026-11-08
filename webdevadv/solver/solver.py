import json
import sys
from datetime import datetime

from ortools.sat.python import cp_model


def to_minutes(hhmm):
    """'13:45' -> 825 (minutes since midnight)."""
    hours, minutes = hhmm.split(":")
    return int(hours) * 60 + int(minutes)


def is_eligible(server, show, rules):
    """Can this server take this show, based only on their shift window?"""
    earliest = server["shift_start_min"] + rules["first_show_after_shift_start"]
    latest = server["shift_end_min"] - rules["no_show_before_shift_end"]
    return earliest <= show["start_min"] <= latest


def solve(data):
    rules = data["rules"]
    servers = data["servers"]
    shows = data["shows"]

    # 1. Convert every time to minutes once, up front
    for s in servers:
        s["shift_start_min"] = to_minutes(s["shift_start"])
        s["shift_end_min"] = to_minutes(s["shift_end"])
    for m in shows:
        m["start_min"] = to_minutes(m["start"])

    model = cp_model.CpModel()

    # 2. Decision variables: x[(server_id, show_id)] is 1 if that server works that show
    x = {}
    for s in servers:
        for m in shows:
            x[(s["id"], m["id"])] = model.NewBoolVar(f"x_{s['id']}_{m['id']}")

    # 3. Rule: a server can only work shows inside their eligible window
    for s in servers:
        for m in shows:
            if not is_eligible(s, m, rules):
                model.Add(x[(s["id"], m["id"])] == 0)

    # 4. Rule: every show gets between min and max servers
    for m in shows:
        assigned = sum(x[(s["id"], m["id"])] for s in servers)
        model.Add(assigned >= rules["min_servers_per_show"])
        model.Add(assigned <= rules["max_servers_per_show"])
    # 5. Rule: a server's shows must start at least N minutes apart
    min_gap = rules["min_minutes_between_show_starts"]
    conflicting_pairs = []
    for i, a in enumerate(shows):
        for b in shows[i + 1:]:
            if abs(a["start_min"] - b["start_min"]) < min_gap:
                conflicting_pairs.append((a, b))

    for s in servers:
        for a, b in conflicting_pairs:
            model.Add(x[(s["id"], a["id"])] + x[(s["id"], b["id"])] <= 1)

    # 6. Rule: every server works at least N shows
    for s in servers:
        worked = sum(x[(s["id"], m["id"])] for m in shows)
        model.Add(worked >= rules["min_shows_per_server"])

    # 7. Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "date": data["date"],
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "status": solver.StatusName(status),
            "assignments": [],
           }

    # 8. Read the answer back out
    assignments = []
    for s in servers:
        worked = [m for m in shows if solver.Value(x[(s["id"], m["id"])]) == 1]
        assignments.append({
            "server_id": s["id"],
            "name": s["name"],
            "shows": [{"show_id": m["id"], "title": m["title"], "start": m["start"]} for m in worked],
        })

    return {
            "date": data["date"],
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "status": solver.StatusName(status),
            "assignments": assignments,
        }


def main():
    data = json.load(sys.stdin)
    result = solve(data)
    json.dump(result, sys.stdout, indent=2)


if __name__ == "__main__":
    main()
