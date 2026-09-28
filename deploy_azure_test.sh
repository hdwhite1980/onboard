#!/usr/bin/env bash
# Run in Azure Cloud Shell (Bash), beside the prepared ZIP. No resources are created.
set -euo pipefail
trap 'echo "Deployment stopped at line $LINENO. Bot endpoint is updated only after web checks pass." >&2' ERR
onboard_sub=b0da3a05-030f-417d-a8ce-a1173042049e
onboard_rg=rg-onboard-teams-test
onboard_app=onboard-teams-test-web
onboard_host=onboard-teams-test-web-f3amchf5fwaeb7hj.westus3-01.azurewebsites.net
onboard_bot=7c4cee75-a078-4b66-9392-acd0a5c7626a
onboard_tenant=aceff5a6-7694-4ee9-bcc5-ab116cdf3e5d
onboard_zip="${1:-$(dirname "$0")/Onboard-Azure-WebApp.zip}"
test -f "$onboard_zip"
python3 - "$onboard_zip" <<'PY'
import hashlib, pathlib, sys
p = pathlib.Path(sys.argv[1])
expected = 'e052cdc212e875676b34a806c4d035b22794ffa1d9d51e3e71a08a5757e5c018'
if hashlib.sha256(p.read_bytes()).hexdigest() != expected:
    raise SystemExit('ZIP differs from the verified September 27 deployment package. Nothing deployed.')
print('Deployment package verified.')
PY
az account set --subscription "$onboard_sub"
test "$(az account show --query tenantId -o tsv)" = b323be76-6b09-4d89-a139-4a3c5e4f2b82
test "$(az appservice plan show -g "$onboard_rg" -n ASP-rgonboardteamstest-b6ed --query sku.name -o tsv)" = F1
test "$(az webapp show -g "$onboard_rg" -n "$onboard_app" --query defaultHostName -o tsv)" = "$onboard_host"
test "$(az bot show -g "$onboard_rg" -n onboard-teams-test --query properties.msaAppId -o tsv)" = "$onboard_bot"
echo 'Existing subscription, free plan, site and bot verified. Configuring the web app.'
az webapp config appsettings set -g "$onboard_rg" -n "$onboard_app" --settings \
  "ONBOARD_TEAMS_BOT_ID=$onboard_bot" "ONBOARD_TEAMS_TENANT_ID=$onboard_tenant" \
  "ONBOARD_TEAMS_ORIGIN=https://$onboard_host" ONBOARD_TEAMS_CLOUD=commercial \
  BIND_ADDRESS=0.0.0.0 SCM_DO_BUILD_DURING_DEPLOYMENT=false --output none
az webapp config set -g "$onboard_rg" -n "$onboard_app" \
  --startup-file 'node server.mjs' --min-tls-version 1.2 --output none
az webapp update -g "$onboard_rg" -n "$onboard_app" --https-only true --output none
az webapp deploy -g "$onboard_rg" -n "$onboard_app" --src-path "$onboard_zip" --type zip --output none
python3 - "https://$onboard_host" <<'PY'
import json, sys, time, urllib.request, urllib.error
origin = sys.argv[1]
for attempt in range(12):
    try:
        with urllib.request.urlopen(origin + '/healthz', timeout=20) as r:
            if r.status == 200 and json.load(r) == {'status': 'ok'}:
                break
    except (OSError, ValueError):
        pass
    if attempt == 11:
        raise SystemExit('Health check failed; bot endpoint has not been changed.')
    time.sleep(10)
with urllib.request.urlopen(origin + '/teams.html', timeout=20) as r:
    assert r.status == 200 and b'Onboard' in r.read(), 'Teams interface missing'
    assert 'frame-ancestors' in r.headers.get('Content-Security-Policy', ''), 'CSP missing'
for path, method, status in [('/api/teams/actions', 'POST', 401), ('/.env', 'GET', 404), ('/server.mjs', 'GET', 404)]:
    req = urllib.request.Request(origin + path, method=method, data=b'{}' if method == 'POST' else None)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            actual = r.status
    except urllib.error.HTTPError as e:
        actual = e.code
    assert actual == status, f'{path}: expected {status}, received {actual}'
print('HTTPS, health, Teams interface, unauthenticated rejection and private-file checks passed.')
PY
az bot update -g "$onboard_rg" -n onboard-teams-test \
  --endpoint "https://$onboard_host/api/teams/actions" --output none
test "$(az bot show -g "$onboard_rg" -n onboard-teams-test --query properties.endpoint -o tsv)" = "https://$onboard_host/api/teams/actions"
echo 'DEPLOYED AND VERIFIED: web service and bot endpoint are ready.'
echo 'Still required: update the Teams catalog package, approve the hosted origin in Onboard, and verify a real Teams action and local connection.'
