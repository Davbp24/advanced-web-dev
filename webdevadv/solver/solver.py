import json
import sys
from initialize import add_to_table
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

    # 3. Rule (hard): a server can only work shows inside their eligible window
    for s in servers:
        for m in shows:
            if not is_eligible(s, m, rules):
                model.Add(x[(s["id"], m["id"])] == 0)

    # 4. Rule: every show gets between min and max servers (min is soft, max is hard)
    shortfall = {}
    for m in shows:
        assigned = sum(x[(s["id"], m["id"])] for s in servers)
        short = model.NewIntVar(0, rules["min_servers_per_show"], f"short_{m['id']}")
        model.Add(assigned + short >= rules["min_servers_per_show"])
        model.Add(assigned <= rules["max_servers_per_show"])
        shortfall[m["id"]] = short

    # 5. Rule (hard): a server's shows must start at least N minutes apart
    min_gap = rules["min_minutes_between_show_starts"]
    conflicting_pairs = []
    for i, a in enumerate(shows):
        for b in shows[i + 1:]:
            if abs(a["start_min"] - b["start_min"]) < min_gap:
                conflicting_pairs.append((a, b))

    for s in servers:
        for a, b in conflicting_pairs:
            model.Add(x[(s["id"], a["id"])] + x[(s["id"], b["id"])] <= 1)

    # 6. Rule (soft): every server works at least N shows
    missing = {}
    for s in servers:
        worked = sum(x[(s["id"], m["id"])] for m in shows)
        miss = model.NewIntVar(0, rules["min_shows_per_server"], f"missing_{s['id']}")
        model.Add(worked + miss >= rules["min_shows_per_server"])
        missing[s["id"]] = miss

    # ---- Objective: the score the solver tries to make as small as possible ----

    # A. Fairness: keep the busiest and least-busy server close together
    counts = []
    for s in servers:
        c = model.NewIntVar(0, len(shows), f"count_{s['id']}")
        model.Add(c == sum(x[(s["id"], m["id"])] for m in shows))
        counts.append(c)
    most = model.NewIntVar(0, len(shows), "most")
    least = model.NewIntVar(0, len(shows), "least")
    model.AddMaxEquality(most, counts)
    model.AddMinEquality(least, counts)
    imbalance = most - least

    # B. Prefer 60+ min between a server's shows (45-59 is allowed but penalized)
    preferred_gap = rules["preferred_minutes_between_show_starts"]
    tight_pairs = []
    for i, a in enumerate(shows):
        for b in shows[i + 1:]:
            gap = abs(a["start_min"] - b["start_min"])
            if min_gap <= gap < preferred_gap:
                tight_pairs.append((a, b))

    tight = []
    for s in servers:
        for a, b in tight_pairs:
            both = model.NewBoolVar(f"tight_{s['id']}_{a['id']}_{b['id']}")
            model.Add(both >= x[(s["id"], a["id"])] + x[(s["id"], b["id"])] - 1)
            tight.append(both)

    # C. Don't add a second server to a show unless it helps
    extra_servers = (sum(x.values()) + sum(shortfall.values())
                     - len(shows) * rules["min_servers_per_show"])

    model.Minimize(
        1000 * sum(shortfall.values())   # uncovered shows: worst
        + 100 * sum(missing.values())    # servers below their minimum
        + 10 * imbalance                 # unfair workload
        + 3 * sum(tight)                 # gaps under 60 min
        + 1 * extra_servers              # unnecessary second servers
    )

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
            "warnings": [],
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

    # 9. Report anything the solver couldn't satisfy
    warnings = []
    for m in shows:
        if solver.Value(shortfall[m["id"]]) > 0:
            warnings.append({
                "type": "uncovered_show",
                "show_id": m["id"],
                "title": m["title"],
                "start": m["start"],
            })
    for s in servers:
        if solver.Value(missing[s["id"]]) > 0:
            warnings.append({
                "type": "below_min_shows",
                "server_id": s["id"],
                "name": s["name"],
                "missing": solver.Value(missing[s["id"]]),
            })

    return {
        "date": data["date"],
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "status": solver.StatusName(status),
        "assignments": assignments,
        "warnings": warnings,
    }


def main():
    with open("sample_input.json", "r", encoding="utf-8") as file:
        data = json.load(file)
    # data = json.load(sys.stdin)
    result = solve(data)
    add_to_table(result)

    json.dump(result, sys.stdout, indent=2)


if __name__ == "__main__":
    main()