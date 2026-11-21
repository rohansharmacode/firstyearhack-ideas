#!/usr/bin/env bash
# End-to-end API check. Usage: BASE_URL=http://localhost:3001 ./test-api.sh   (or pass URL as $1)
BASE_URL="${1:-${BASE_URL:-http://localhost:3001}}"
BASE_URL="${BASE_URL%/}"
FAILS=0; BODY=""; CODE=""

# jget <json> <python-expr over d>  -> prints value (empty on error)
jget() { python3 -c 'import sys,json
d=json.loads(sys.argv[1])
try:
    v=eval(sys.argv[2])
    print("" if v is None else (json.dumps(v) if isinstance(v,(dict,list,bool)) else v))
except Exception:
    print("")' "$1" "$2"; }

req() { # method path [data]
  local out
  if [ -n "${3:-}" ]; then
    out=$(curl -s -m 30 -w $'\n%{http_code}' -X "$1" -H 'Content-Type: application/json' -d "$3" "$BASE_URL$2")
  else
    out=$(curl -s -m 30 -w $'\n%{http_code}' -X "$1" "$BASE_URL$2")
  fi
  CODE="${out##*$'\n'}"; BODY="${out%$'\n'*}"
}
check() { # label ok(0/1)
  if [ "$2" = "1" ]; then echo "PASS  $1"; else echo "FAIL  $1  (http=$CODE body=${BODY:0:200})"; FAILS=$((FAILS+1)); fi
}
code_is() { [ "$CODE" = "$1" ] && echo 1 || echo 0; }
nonempty() { [ -n "$1" ] && echo 1 || echo 0; }

echo "Testing $BASE_URL"
req GET /api/health
check "GET /api/health 200" "$(code_is 200)"
check "health ok=true" "$([ "$(jget "$BODY" 'd["ok"]')" = "true" ] && echo 1 || echo 0)"
check "health has mode" "$(nonempty "$(jget "$BODY" 'd["mode"]')")"

req POST /api/players '{"name":"E2E Tester"}'
check "POST /api/players 2xx" "$([[ "$CODE" =~ ^20[01]$ ]] && echo 1 || echo 0)"
PID=$(jget "$BODY" 'd["player_id"]')
check "player_id returned" "$(nonempty "$PID")"

req POST /api/session/start "{\"player_id\":\"$PID\",\"sport\":\"boxing\"}"
check "POST /api/session/start 2xx" "$([[ "$CODE" =~ ^20[01]$ ]] && echo 1 || echo 0)"
SID=$(jget "$BODY" 'd["session_id"]')
check "session_id returned" "$(nonempty "$SID")"

NOW=$(python3 -c 'import datetime as D;print(D.datetime.now(D.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"))')
EVENTS=$(python3 - "$SID" "$PID" "$NOW" <<'PY'
import sys, json, datetime as D
sid, pid, now = sys.argv[1:4]
t0 = D.datetime.strptime(now, "%Y-%m-%dT%H:%M:%S.000Z")
types = ["jab","cross","hook","uppercut","block"]
ev = []
for i in range(25):
    t = types[i % 5]
    blk = t == "block"
    ev.append({"session_id": sid, "player_id": pid, "sport": "boxing",
      "event_ts": (t0 + D.timedelta(milliseconds=500*i)).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
      "event_type": t, "hand": "L" if i % 2 else "R",
      "speed_mps": 0 if blk else round(9 - (i % 4) * 0.7 - i * 0.03, 2),
      "accuracy": None if blk else 0.7, "reaction_ms": 250 + i,
      "guard_up": i % 3 != 0, "points": 2 if blk else 10})
print(json.dumps(ev))
PY
)
req POST /api/events "$EVENTS"
check "POST /api/events 202" "$(code_is 202)"
check "events accepted=25" "$([ "$(jget "$BODY" 'd["accepted"]')" = "25" ] && echo 1 || echo 0)"

req POST /api/events '{"not":"an array"}'
check "POST /api/events rejects bad body (4xx)" "$([[ "$CODE" =~ ^4 ]] && echo 1 || echo 0)"

sleep 1
req POST /api/session/end "{\"session_id\":\"$SID\"}"
check "POST /api/session/end 200" "$(code_is 200)"
check "end has stats.total_punches" "$(nonempty "$(jget "$BODY" 'd["stats"]["total_punches"]')")"
check "end stats.score > 0" "$([ "$(jget "$BODY" '1 if d["stats"]["score"]>0 else 0')" = "1" ] && echo 1 || echo 0)"
check "end coach has 3 tips" "$([ "$(jget "$BODY" 'len(d["coach"]["tips"])')" = "3" ] && echo 1 || echo 0)"
check "end coach has drill+badge+summary" "$(nonempty "$(jget "$BODY" 'd["coach"]["drill"] and d["coach"]["badge"] and d["coach"]["summary"]')")"
check "end has fallback flag" "$(nonempty "$(jget "$BODY" 'd["fallback"]')")"

req GET /api/leaderboard
check "GET /api/leaderboard 200" "$(code_is 200)"
check "leaderboard is list, <=10" "$([ "$(jget "$BODY" '1 if isinstance(d,list) and len(d)<=10 else 0')" = "1" ] && echo 1 || echo 0)"
check "leaderboard row has rank/name/score" "$([ "$(jget "$BODY" '1 if (len(d)==0 or all(k in d[0] for k in ("rank","player_id","name","score"))) else 0')" = "1" ] && echo 1 || echo 0)"

req GET "/api/player/$PID/stats"
check "GET /api/player/:id/stats 200" "$(code_is 200)"
check "stats player.player_id matches" "$([ "$(jget "$BODY" 'd["player"]["player_id"]')" = "$PID" ] && echo 1 || echo 0)"
check "stats has >=1 session" "$([ "$(jget "$BODY" '1 if len(d["sessions"])>=1 else 0')" = "1" ] && echo 1 || echo 0)"
check "stats has 6 percentiles" "$([ "$(jget "$BODY" 'len(d["percentiles"])')" = "6" ] && echo 1 || echo 0)"

req POST /api/ask "{\"player_id\":\"$PID\",\"question\":\"How fast are my punches?\"}"
if [ "$CODE" = "404" ]; then
  echo "SKIP  /api/ask not implemented (404)"
else
  check "POST /api/ask 200" "$(code_is 200)"
  check "ask has answer" "$(nonempty "$(jget "$BODY" 'd["answer"]')")"
fi

echo
if [ "$FAILS" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "$FAILS CHECK(S) FAILED"; exit 1; fi
