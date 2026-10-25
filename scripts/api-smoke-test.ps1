<#
.SYNOPSIS
  End-to-end smoke test for the issue API (Phase 1). See scripts/README.md.

.DESCRIPTION
  Starts the production build with DATABASE_URL replaced by TEST_DATABASE_URL,
  sends real HTTP requests, and checks status codes and response fields.
  It creates and DELETES issues, so it only runs against a separate test database.

  This is a temporary manual check, not the project's automated test suite.

.PARAMETER Port
  Port for the temporary server (default: TEST_API_PORT or 3100). Must be free.

.PARAMETER Setup
  First apply migrations and seed users in the test database, then run the checks.

.PARAMETER DatabaseDown
  Point the server at a database that does not exist and check that every
  endpoint returns a generic 500 error.
#>
param(
  [int]$Port = $(if ($env:TEST_API_PORT) { [int]$env:TEST_API_PORT } else { 3100 }),
  [switch]$Setup,
  [switch]$DatabaseDown
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

# ---------------------------------------------------------------------------
# Configuration. URLs are never printed, because they contain passwords.
# ---------------------------------------------------------------------------

# Environment variables win; otherwise read the value from .env.
function Get-Setting($name) {
  $value = [Environment]::GetEnvironmentVariable($name)
  if (-not $value -and (Test-Path .env)) {
    $line = Get-Content .env | Where-Object { $_ -match "^\s*$name\s*=" } | Select-Object -First 1
    if ($line) { $value = ($line -replace "^\s*$name\s*=\s*", '').Trim().Trim('"').Trim("'") }
  }
  return $value
}

# Returns "host:port/database" (lower case) so two URLs can be compared without the password.
function Get-DatabaseTarget($url) {
  $m = [regex]::Match($url, '^mysql://(?:[^@/]*@)?([^/:?]+)(?::(\d+))?/([^/?]+)')
  if (-not $m.Success) { return $null }
  $dbPort = if ($m.Groups[2].Value) { $m.Groups[2].Value } else { '3306' }
  return ('{0}:{1}/{2}' -f $m.Groups[1].Value, $dbPort, $m.Groups[3].Value).ToLower()
}

$testUrl = Get-Setting 'TEST_DATABASE_URL'
$devUrl = Get-Setting 'DATABASE_URL'
if (-not $testUrl) { throw 'TEST_DATABASE_URL is not set (environment variable or .env). See scripts/README.md.' }
$testTarget = Get-DatabaseTarget $testUrl
if (-not $testTarget) { throw 'TEST_DATABASE_URL must look like mysql://USER:PASSWORD@HOST:PORT/DATABASE.' }
$testDbName = $testTarget.Split('/')[-1]

# Safety: refuse anything that could be the development database.
if ($devUrl -and ($testUrl -eq $devUrl -or $testTarget -eq (Get-DatabaseTarget $devUrl))) {
  throw 'TEST_DATABASE_URL points at the same database as DATABASE_URL. Use a separate test database.'
}
if ($testDbName -notmatch 'test') {
  throw "The test database name must contain 'test' (got '$testDbName'). This guards against using a real database."
}

if ($DatabaseDown) {
  # Same server and credentials, but a database name that does not exist.
  $testUrl = $testUrl -replace '/[^/?]+(\?|$)', "/${testDbName}_does_not_exist`$1"
}

$base = "http://localhost:$Port"

# ---------------------------------------------------------------------------
# Preconditions
# ---------------------------------------------------------------------------

if (-not (Test-Path '.next/BUILD_ID')) { throw 'No production build found. Run "npm run build" first.' }

# If anything already listens on the port, our requests could reach a server
# that uses a different database, so stop instead.
$tcp = New-Object Net.Sockets.TcpClient
try { $tcp.Connect('localhost', $Port); $portInUse = $true } catch { $portInUse = $false } finally { $tcp.Dispose() }
if ($portInUse) { throw "Something is already running on port $Port. Stop it or pass -Port <free port>." }

# All child processes below (Prisma CLI, Next.js server) see the test database.
$env:DATABASE_URL = $testUrl

if ($Setup -and -not $DatabaseDown) {
  "Applying migrations and seeding $testDbName ..."
  npx prisma migrate deploy 2>&1 | Where-Object { "$_" -notmatch 'mysql://' } | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'prisma migrate deploy failed.' }
  npx prisma db seed 2>&1 | Where-Object { "$_" -notmatch 'mysql://' } | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'prisma db seed failed.' }
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

$script:pass = 0; $script:fail = 0

function Req($method, $path, $body = $null) {
  $p = @{ Uri = "$base$path"; Method = $method; UseBasicParsing = $true }
  if ($null -ne $body) { $p.ContentType = 'application/json'; $p.Body = [Text.Encoding]::UTF8.GetBytes($body) }
  try { $r = Invoke-WebRequest @p; $code = [int]$r.StatusCode; $raw = $r.Content }
  catch {
    $resp = $_.Exception.Response
    if ($null -eq $resp) { return @{ code = 0; raw = "$_"; json = $null } }
    $code = [int]$resp.StatusCode; $raw = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd()
  }
  $json = $null; if ($raw) { try { $json = $raw | ConvertFrom-Json } catch {} }
  @{ code = $code; raw = $raw; json = $json }
}
function Check($name, $cond, $info = '') {
  if ($cond) { $script:pass++; "PASS  $name" } else { $script:fail++; "FAIL  $name  $info" }
}
function Expect($name, $res, $code) { Check "$name -> $code" ($res.code -eq $code) "(got $($res.code): $($res.raw))" }

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

function Test-DatabaseDown {
  Expect 'GET /api/issues (DB missing)' (Req GET '/api/issues') 500
  Expect 'GET /api/users (DB missing)' (Req GET '/api/users') 500
  $r = Req GET '/api/issues/1'; Expect 'GET /api/issues/1 (DB missing)' $r 500
  Check 'generic 500 message, no DB details' ($r.raw -eq '{"error":"Could not load the issue. Please try again later."}') $r.raw
  Expect 'POST (DB missing)' (Req POST '/api/issues' '{"title":"t","description":"d"}') 500
  Expect 'PATCH (DB missing)' (Req PATCH '/api/issues/1' '{"status":"CLOSED"}') 500
  Expect 'DELETE (DB missing)' (Req DELETE '/api/issues/1') 500
}

function Test-Api {
  # --- users
  $r = Req GET '/api/users'; Expect 'GET /api/users' $r 200
  $users = @($r.json)
  if ($users.Count -lt 2) { throw 'The test database needs at least 2 users. Run again with -Setup.' }
  Check 'users have only id and name' (($users[0].PSObject.Properties.Name -join ',') -eq 'id,name') $r.raw
  $u1 = $users[0].id; $u2 = $users[1].id

  # --- create
  $r = Req POST '/api/issues' '{"title":"Form-style issue","description":"Only title and description"}'
  Expect 'POST title+description only (existing form)' $r 201
  $a = $r.json
  Check 'defaults: OPEN, MEDIUM, unassigned' ($a.status -eq 'OPEN' -and $a.priority -eq 'MEDIUM' -and $null -eq $a.assignee) $r.raw
  Check 'response has no raw assigneeId field' (-not ($a.PSObject.Properties.Name -contains 'assigneeId')) $r.raw
  Start-Sleep -Milliseconds 20

  $r = Req POST '/api/issues' ("{""title"":""  Full issue  "",""description"":"" body "",""status"":""IN_PROGRESS"",""priority"":""HIGH"",""assigneeId"":$u1}")
  Expect 'POST with all fields' $r 201
  $b = $r.json
  Check 'all fields saved + trimmed' ($b.title -eq 'Full issue' -and $b.description -eq 'body' -and $b.status -eq 'IN_PROGRESS' -and $b.priority -eq 'HIGH' -and $b.assignee.id -eq $u1 -and $b.assignee.name -eq $users[0].name) $r.raw

  $r = Req POST '/api/issues' '{"title":"Explicitly unassigned","description":"d","assigneeId":null}'
  Expect 'POST assigneeId null' $r 201; $c = $r.json
  Check 'null assignee saved' ($null -eq $c.assignee) $r.raw

  # --- list / detail
  $r = Req GET '/api/issues'; Expect 'GET /api/issues' $r 200
  $ids = @($r.json | ForEach-Object { $_.id })
  Check 'newest first' ($ids.IndexOf($c.id) -lt $ids.IndexOf($b.id) -and $ids.IndexOf($b.id) -lt $ids.IndexOf($a.id)) ($ids -join ',')
  $r = Req GET "/api/issues/$($b.id)"; Expect 'GET /api/issues/:id' $r 200
  Check 'detail includes assignee object' ($r.json.assignee.id -eq $u1) $r.raw

  # --- partial update keeps omitted fields
  Start-Sleep -Milliseconds 50
  $r = Req PATCH "/api/issues/$($b.id)" '{"status":"RESOLVED"}'; Expect 'PATCH status only' $r 200
  $p = $r.json
  Check 'omitted fields unchanged' ($p.title -eq $b.title -and $p.description -eq $b.description -and $p.priority -eq $b.priority -and $p.assignee.id -eq $u1) $r.raw
  Check 'createdAt preserved' ($p.createdAt -eq $b.createdAt) "$($b.createdAt) vs $($p.createdAt)"
  Check 'updatedAt advanced' ($p.updatedAt -ne $b.updatedAt) "$($b.updatedAt) vs $($p.updatedAt)"

  foreach ($s in 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') {
    $r = Req PATCH "/api/issues/$($a.id)" "{""status"":""$s""}"; Check "PATCH status $s -> 200" ($r.code -eq 200 -and $r.json.status -eq $s) $r.raw
  }
  foreach ($pr in 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') {
    $r = Req PATCH "/api/issues/$($a.id)" "{""priority"":""$pr""}"; Check "PATCH priority $pr -> 200" ($r.code -eq 200 -and $r.json.priority -eq $pr) $r.raw
  }
  Check 'status survived priority updates' ($r.json.status -eq 'CLOSED') $r.raw

  $r = Req PATCH "/api/issues/$($a.id)" "{""assigneeId"":$u2}"; Expect 'PATCH assign' $r 200
  Check 'assigned to user 2' ($r.json.assignee.id -eq $u2) $r.raw
  $r = Req PATCH "/api/issues/$($b.id)" "{""assigneeId"":$u2}"; Check 'PATCH reassign u1 -> u2' ($r.code -eq 200 -and $r.json.assignee.id -eq $u2) $r.raw
  $r = Req PATCH "/api/issues/$($a.id)" '{"assigneeId":null}'; Expect 'PATCH unassign (null)' $r 200
  Check 'unassigned, other fields kept' ($null -eq $r.json.assignee -and $r.json.status -eq 'CLOSED' -and $r.json.priority -eq 'CRITICAL' -and $r.json.title -eq $a.title) $r.raw
  $r = Req PATCH "/api/issues/$($a.id)" '{"title":"  Renamed  ","description":"  New text  ","ignoredField":true}'
  Check 'PATCH title/description trimmed, unknown field ignored' ($r.code -eq 200 -and $r.json.title -eq 'Renamed' -and $r.json.description -eq 'New text') $r.raw
  $before = (Req GET "/api/issues/$($a.id)").raw

  # --- invalid POST
  Expect 'POST malformed JSON' (Req POST '/api/issues' '{"title":') 400
  Expect 'POST empty object' (Req POST '/api/issues' '{}') 400
  Expect 'POST JSON null' (Req POST '/api/issues' 'null') 400
  Expect 'POST JSON array' (Req POST '/api/issues' '[]') 400
  Expect 'POST whitespace title' (Req POST '/api/issues' '{"title":"   ","description":"d"}') 400
  Expect 'POST missing description' (Req POST '/api/issues' '{"title":"t"}') 400
  $r = Req POST '/api/issues' '{"title":"t","description":"d","status":"DONE"}'; Expect 'POST invalid status' $r 400
  Check 'status error lists allowed values' ($r.json.details.fieldErrors.status[0] -like '*OPEN, IN_PROGRESS, RESOLVED, CLOSED*') $r.raw
  Expect 'POST lowercase status' (Req POST '/api/issues' '{"title":"t","description":"d","status":"open"}') 400
  Expect 'POST invalid priority' (Req POST '/api/issues' '{"title":"t","description":"d","priority":"URGENT"}') 400
  $r = Req POST '/api/issues' '{"title":"t","description":"d","assigneeId":999999}'; Expect 'POST unknown assignee' $r 400
  Check 'unknown assignee message' ($r.json.details.fieldErrors.assigneeId[0] -eq 'Assignee does not exist.') $r.raw
  Expect 'POST assignee beyond INT range' (Req POST '/api/issues' '{"title":"t","description":"d","assigneeId":3000000000}') 400
  Expect 'POST assignee as string' (Req POST '/api/issues' "{""title"":""t"",""description"":""d"",""assigneeId"":""$u1""}") 400
  Expect 'POST assignee decimal' (Req POST '/api/issues' '{"title":"t","description":"d","assigneeId":1.5}') 400
  Expect 'POST assignee negative' (Req POST '/api/issues' '{"title":"t","description":"d","assigneeId":-1}') 400

  # --- invalid PATCH
  Expect 'PATCH empty object' (Req PATCH "/api/issues/$($a.id)" '{}') 400
  Expect 'PATCH only unsupported fields' (Req PATCH "/api/issues/$($a.id)" '{"foo":1,"createdAt":"2020-01-01"}') 400
  Expect 'PATCH malformed JSON' (Req PATCH "/api/issues/$($a.id)" '{"status":') 400
  Expect 'PATCH title null' (Req PATCH "/api/issues/$($a.id)" '{"title":null}') 400
  Expect 'PATCH whitespace title' (Req PATCH "/api/issues/$($a.id)" '{"title":"  "}') 400
  Expect 'PATCH status null' (Req PATCH "/api/issues/$($a.id)" '{"status":null}') 400
  Expect 'PATCH invalid status' (Req PATCH "/api/issues/$($a.id)" '{"status":"DONE"}') 400
  Expect 'PATCH invalid priority' (Req PATCH "/api/issues/$($a.id)" '{"priority":"low"}') 400
  Expect 'PATCH unknown assignee' (Req PATCH "/api/issues/$($a.id)" '{"assigneeId":999999}') 400
  Check 'failed PATCHes changed nothing' ((Req GET "/api/issues/$($a.id)").raw -eq $before)

  # --- IDs
  foreach ($bad in '1abc', '-1', '1.5', '0', '01', 'abc', '1e3', '9007199254740993') {
    Expect "GET id '$bad'" (Req GET "/api/issues/$bad") 400
  }
  Expect 'PATCH id 1abc' (Req PATCH '/api/issues/1abc' '{"status":"OPEN"}') 400
  Expect 'GET missing id 99999999' (Req GET '/api/issues/99999999') 404
  Expect 'GET id beyond INT range' (Req GET '/api/issues/2147483648') 404
  Expect 'PATCH missing id' (Req PATCH '/api/issues/99999999' '{"status":"OPEN"}') 404

  # --- delete (only issues this script created)
  $r = Req DELETE "/api/issues/$($a.id)"; Expect 'DELETE existing' $r 204
  Check 'DELETE has empty body' ([string]::IsNullOrEmpty($r.raw)) $r.raw
  Expect 'GET deleted issue' (Req GET "/api/issues/$($a.id)") 404
  Expect 'DELETE again' (Req DELETE "/api/issues/$($a.id)") 404
  Expect 'DELETE id 1abc' (Req DELETE '/api/issues/1abc') 400
  Expect 'PATCH deleted issue' (Req PATCH "/api/issues/$($a.id)" '{"status":"OPEN"}') 404
  foreach ($x in $b, $c) { Expect "cleanup DELETE $($x.id)" (Req DELETE "/api/issues/$($x.id)") 204 }
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

$log = Join-Path ([IO.Path]::GetTempPath()) "issue-tracker-api-smoke-$Port.log"
"Starting server on $base (test database: $testDbName$(if ($DatabaseDown) { ', deliberately missing' })). Server log: $log"
$proc = Start-Process node -ArgumentList 'node_modules/next/dist/bin/next', 'start', '-p', "$Port" -PassThru -NoNewWindow `
  -RedirectStandardOutput $log -RedirectStandardError "$log.err"

try {
  $ready = $false
  for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
    try { Invoke-WebRequest "$base/issues" -UseBasicParsing -TimeoutSec 2 | Out-Null; $ready = $true } catch { Start-Sleep -Milliseconds 500 }
  }
  if (-not $ready) { throw "Server did not start. See $log.err" }

  if ($DatabaseDown) { Test-DatabaseDown } else { Test-Api }
} finally {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  # On Windows, `next start` can leave a child process holding the port.
  if (Get-Command Get-CimInstance -ErrorAction SilentlyContinue) {
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.ParentProcessId -eq $proc.Id } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  }
  "--- $($script:pass) passed, $($script:fail) failed"
}
if ($script:fail -gt 0) { exit 1 }
