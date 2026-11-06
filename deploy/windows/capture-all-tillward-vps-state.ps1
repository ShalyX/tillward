$ErrorActionPreference = 'Stop'
$workRoot = Split-Path -Parent $PSCommandPath
$failed = 0
foreach ($name in @('capture-tillward-vps-state.ps1','capture-tillward-v2-state.ps1')) {
    try { & (Join-Path $workRoot $name) } catch { $failed++; [Console]::Error.WriteLine("Tillward backup failed: $name") }
}
if ($failed -gt 0) { exit 2 }
