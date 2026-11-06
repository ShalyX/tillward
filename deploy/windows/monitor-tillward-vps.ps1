[CmdletBinding()]
param(
    [switch]$SimulateDown,
    [switch]$NoSend,
    [string]$StatePath
)

$ErrorActionPreference = 'Stop'
$workRoot = Split-Path -Parent $PSCommandPath
if (-not $StatePath) { $StatePath = Join-Path $workRoot 'tillward-vps-monitor-state.json' }
$logPath = Join-Path $workRoot 'tillward-vps-monitor.log'
$credentialPath = Join-Path $workRoot 'tillward-telegram.json'
$now = [DateTimeOffset]::UtcNow

function Convert-JsonTimestamp($Value) {
    if ($Value -is [DateTimeOffset]) { return $Value }
    if ($Value -is [DateTime]) { return [DateTimeOffset]::new($Value.ToUniversalTime()) }
    $parsed = [DateTimeOffset]::MinValue
    if ([DateTimeOffset]::TryParse([string]$Value, [Globalization.CultureInfo]::InvariantCulture,
        [Globalization.DateTimeStyles]::AssumeUniversal, [ref]$parsed)) { return $parsed }
    return $null
}

function Write-SafeLog([string]$Line) {
    if ((Test-Path -LiteralPath $logPath) -and (Get-Item -LiteralPath $logPath).Length -gt 1048576) {
        Move-Item -LiteralPath $logPath -Destination ($logPath + '.previous') -Force
    }
    [IO.File]::AppendAllText($logPath, $Line + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
}

function Get-RemoteHealth {
    $sshPath = 'C:\Windows\System32\OpenSSH\ssh.exe'
    if (-not (Test-Path -LiteralPath $sshPath)) { return [pscustomobject]@{ Healthy = $false; Reason = 'ssh_client_missing' } }

    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $sshPath
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    foreach ($arg in @(
        '-T', '-n',
        '-o', 'BatchMode=yes',
        '-o', 'ConnectTimeout=10',
        '-o', 'ServerAliveInterval=5',
        '-o', 'ServerAliveCountMax=2',
        '-o', 'LogLevel=ERROR',
        'caraxes-vps',
        'cd /opt/tillward-keeper-v2 && /opt/tillward-keeper/bin/node scripts/verify-all-operations.mjs'
    )) { $start.ArgumentList.Add($arg) }

    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    try {
        if (-not $process.Start()) { return [pscustomobject]@{ Healthy = $false; Reason = 'ssh_start_failed' } }
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit(45000)) {
            try { $process.Kill($true) } catch {}
            return [pscustomobject]@{ Healthy = $false; Reason = 'remote_check_timeout' }
        }
        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $null = $stderrTask.GetAwaiter().GetResult()
        if ($process.ExitCode -ne 0) { return [pscustomobject]@{ Healthy = $false; Reason = 'remote_verifier_failed' } }

        try { $proof = $stdout | ConvertFrom-Json } catch { return [pscustomobject]@{ Healthy = $false; Reason = 'remote_output_invalid' } }
        $observedAt = [DateTimeOffset]::MinValue
        if ($proof.observedAt -is [DateTimeOffset]) {
            $observedAt = $proof.observedAt
        } elseif ($proof.observedAt -is [DateTime]) {
            $observedAt = [DateTimeOffset]::new($proof.observedAt.ToUniversalTime())
        } elseif (-not [DateTimeOffset]::TryParse([string]$proof.observedAt, [ref]$observedAt)) {
            return [pscustomobject]@{ Healthy = $false; Reason = 'remote_timestamp_invalid' }
        }
        $healthAgeSeconds = ([DateTimeOffset]::UtcNow - $observedAt.ToUniversalTime()).TotalSeconds
        $fresh = $healthAgeSeconds -ge -30 -and $healthAgeSeconds -le 180
        $unitsHealthy = @($proof.keepers).Count -eq 2 -and @($proof.keepers | Where-Object {
            $_.state -ne 'healthy' -or $null -ne $_.pending -or $_.discovery.synced -ne $true -or
            @($_.units).Count -ne 3 -or @($_.units | Where-Object { $_.active -ne 'active' -or $_.enabled -ne 'enabled' }).Count -ne 0
        }).Count -eq 0
        $healthy = $proof.state -eq 'healthy' -and $fresh -and $unitsHealthy
        if ($healthy) { return [pscustomobject]@{ Healthy = $true; Reason = 'healthy' } }
        return [pscustomobject]@{ Healthy = $false; Reason = 'remote_health_gate_failed' }
    } catch {
        return [pscustomobject]@{ Healthy = $false; Reason = 'remote_check_error' }
    } finally {
        $process.Dispose()
    }
}

function Send-Telegram([string]$Message) {
    $nodePath = Join-Path $env:ProgramFiles 'nodejs\node.exe'
    $helperPath = Join-Path $workRoot 'tillward-telegram-send.mjs'
    if (-not (Test-Path -LiteralPath $nodePath) -or -not (Test-Path -LiteralPath $helperPath) -or
        -not (Test-Path -LiteralPath $credentialPath)) { return $false }

    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $nodePath
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.WorkingDirectory = $workRoot
    foreach ($arg in @($helperPath, $credentialPath, 'send')) { $start.ArgumentList.Add($arg) }

    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    try {
        if (-not $process.Start()) { return $false }
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $process.StandardInput.Write($Message)
        $process.StandardInput.Close()
        if (-not $process.WaitForExit(15000)) {
            try { $process.Kill($true) } catch {}
            return $false
        }
        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $null = $stderrTask.GetAwaiter().GetResult()
        if ($process.ExitCode -ne 0) { return $false }
        try { return (($stdout | ConvertFrom-Json).ok -eq $true) } catch { return $false }
    } catch {
        return $false
    } finally {
        $process.Dispose()
    }
}

try {
    $result = if ($SimulateDown) {
        [pscustomobject]@{ Healthy = $false; Reason = 'simulated_failure' }
    } else {
        Get-RemoteHealth
    }
    $status = if ($result.Healthy) { 'healthy' } else { 'unhealthy' }

    $state = [ordered]@{
        lastObservedState = $null
        lastObservedAt = $null
        lastReason = $null
        lastNotifiedState = $null
        lastNotificationAt = $null
        lastAttemptState = $null
        lastAttemptAt = $null
    }
    if (Test-Path -LiteralPath $StatePath) {
        $saved = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json -AsHashtable
        foreach ($key in @($state.Keys)) {
            if ($key -in $saved.Keys) { $state[$key] = $saved[$key] }
        }
    }

    $lastAttempt = Convert-JsonTimestamp $state.lastAttemptAt
    $hasRecentAttempt = $state.lastAttemptState -eq $status -and $null -ne $lastAttempt -and
        ($now - $lastAttempt.ToUniversalTime()).TotalMinutes -lt 10
    $notify = $false
    if ($status -eq 'unhealthy') {
        if ($state.lastNotifiedState -ne 'unhealthy') {
            $notify = -not $hasRecentAttempt
        } else {
            $lastNotification = Convert-JsonTimestamp $state.lastNotificationAt
            $notify = $null -eq $lastNotification -or ($now - $lastNotification.ToUniversalTime()).TotalMinutes -ge 60
        }
    } elseif ($state.lastNotifiedState -eq 'unhealthy') {
        $notify = -not $hasRecentAttempt
    }

    $delivered = $false
    if ($notify) {
        $message = if ($status -eq 'healthy') {
            "Tillward keeper monitor: VPS checks recovered at $($now.ToString('yyyy-MM-dd HH:mm:ss')) UTC."
        } else {
            "Tillward keeper monitor: VPS health check failed at $($now.ToString('yyyy-MM-dd HH:mm:ss')) UTC ($($result.Reason)). No on-chain action was taken."
        }
        if ($SimulateDown) { $message = "Tillward monitor TEST: simulated outage; live services were not stopped. Verifying alerts for V1 and V2." }
        if ($NoSend) {
            $delivered = $true
        } else {
            $delivered = Send-Telegram -Message $message
        }
        $state.lastAttemptState = $status
        $state.lastAttemptAt = $now.ToString('o')
        if ($delivered) {
            $state.lastNotifiedState = $status
            $state.lastNotificationAt = $now.ToString('o')
        }
    }

    $state.lastObservedState = $status
    $state.lastObservedAt = $now.ToString('o')
    $state.lastReason = $result.Reason
    $stateDirectory = Split-Path -Parent $StatePath
    if ($stateDirectory -and -not (Test-Path -LiteralPath $stateDirectory)) {
        $null = New-Item -ItemType Directory -Path $stateDirectory -Force
    }
    $tempPath = "$StatePath.$PID.tmp"
    [IO.File]::WriteAllText($tempPath, ($state | ConvertTo-Json -Depth 4), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $tempPath -Destination $StatePath -Force

    Write-SafeLog "$($now.ToString('o')) status=$status reason=$($result.Reason) notify=$notify delivered=$delivered"
    [pscustomobject]@{
        observedAt = $now.ToString('o')
        state = $status
        reason = $result.Reason
        notificationAttempted = $notify
        notificationDelivered = $delivered
    } | ConvertTo-Json -Compress
} catch {
    try { Write-SafeLog "$($now.ToString('o')) status=error reason=monitor_internal_error" } catch {}
    [Console]::Error.WriteLine("Tillward VPS monitor failed ($($_.Exception.GetType().Name), line $($_.InvocationInfo.ScriptLineNumber)).")
    exit 2
}
