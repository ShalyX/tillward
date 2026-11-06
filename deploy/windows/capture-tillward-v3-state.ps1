$ErrorActionPreference = 'Stop'
$workRoot = Split-Path -Parent $PSCommandPath
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmssZ')
$outputPath = Join-Path $workRoot "tillward-vps-v3-state-$stamp.dpapi"
$proofPath = Join-Path $workRoot "tillward-vps-v3-state-$stamp.json"
if ((Resolve-Path -LiteralPath $workRoot).Path -ne $workRoot) { throw 'Unexpected backup workspace.' }
if ((Test-Path -LiteralPath $outputPath) -or (Test-Path -LiteralPath $proofPath)) { throw 'Refusing to overwrite an existing backup.' }

$startInfo = [System.Diagnostics.ProcessStartInfo]::new()
$startInfo.FileName = 'C:\Windows\System32\OpenSSH\ssh.exe'
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.ArgumentList.Add('-n')
$startInfo.ArgumentList.Add('-o')
$startInfo.ArgumentList.Add('BatchMode=yes')
$startInfo.ArgumentList.Add('-o')
$startInfo.ArgumentList.Add('ConnectTimeout=20')
$startInfo.ArgumentList.Add('caraxes-vps')
$startInfo.ArgumentList.Add('cat /var/backups/tillward-keeper-v3/snapshot-1.tar.gz')
$process = [System.Diagnostics.Process]::new()
$process.StartInfo = $startInfo
if (-not $process.Start()) { throw 'Could not start SSH.' }
$archiveStream = [System.IO.MemoryStream]::new()
$process.StandardOutput.BaseStream.CopyTo($archiveStream)
$process.WaitForExit()
$errorText = $process.StandardError.ReadToEnd()
if ($process.ExitCode -ne 0) { throw "Remote archive retrieval failed (exit $($process.ExitCode))." }
$archiveBytes = $archiveStream.ToArray()
$compressedStream = [System.IO.MemoryStream]::new($archiveBytes)
$gzipStream = [System.IO.Compression.GZipStream]::new($compressedStream, [System.IO.Compression.CompressionMode]::Decompress)
$tarStream = [System.IO.MemoryStream]::new()
$gzipStream.CopyTo($tarStream)
$tarBytes = $tarStream.ToArray()
if ($tarBytes.Length -lt 512 -or $tarBytes[257] -ne 0x75 -or $tarBytes[258] -ne 0x73 -or $tarBytes[259] -ne 0x74 -or $tarBytes[260] -ne 0x61 -or $tarBytes[261] -ne 0x72) { throw 'Remote snapshot is not a valid gzip-compressed tar archive.' }
$archiveMembers = [System.Collections.Generic.List[string]]::new()
$offset = 0
while ($offset + 512 -le $tarBytes.Length) {
    $isZeroBlock = $true
    for ($i = 0; $i -lt 512; $i++) { if ($tarBytes[$offset + $i] -ne 0) { $isZeroBlock = $false; break } }
    if ($isZeroBlock) { break }
    $name = [System.Text.Encoding]::UTF8.GetString($tarBytes, $offset, 100).Trim([char]0)
    $prefix = [System.Text.Encoding]::UTF8.GetString($tarBytes, $offset + 345, 155).Trim([char]0)
    $member = if ($prefix) { "$prefix/$name" } else { $name }
    $member = $member -replace '^\./', ''
    if ($member -and $tarBytes[$offset + 156] -notin @(120, 103, 76, 75)) { $archiveMembers.Add($member) }
    $sizeText = [System.Text.Encoding]::ASCII.GetString($tarBytes, $offset + 124, 12).Trim([char[]]@([char]0, ' '))
    if (-not $sizeText) { $size = 0L } else { $size = [Convert]::ToInt64($sizeText, 8) }
    if ($size -lt 0) { throw 'Archive contains an invalid member size.' }
    $offset += 512 + ([long][Math]::Ceiling($size / 512) * 512)
}
$requiredMembers = @('wallet.json', 'paydown-keeper-journal.json', 'keeper-registry.json')
$missingMembers = @($requiredMembers | Where-Object { $_ -notin $archiveMembers })
if ($missingMembers.Count -gt 0) { throw 'Remote snapshot is missing required state members.' }

$entropy = [System.Text.Encoding]::UTF8.GetBytes('Tillward private VPS state backup v3')
$protected = [System.Security.Cryptography.ProtectedData]::Protect($archiveBytes, $entropy, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
$restored = [System.Security.Cryptography.ProtectedData]::Unprotect($protected, $entropy, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
$archiveHash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($archiveBytes))
$restoredHash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($restored))
if ($archiveHash -ne $restoredHash) { throw 'Encrypted backup round-trip failed.' }

$backupFile = [System.IO.File]::Open($outputPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
try { $backupFile.Write($protected); $backupFile.Flush($true) } finally { $backupFile.Dispose() }
$proof = [ordered]@{
    capturedAt = (Get-Date).ToUniversalTime().ToString('o')
    source = 'caraxes-vps:/var/backups/tillward-keeper-v3/snapshot-1.tar.gz'
    protectedFile = [System.IO.Path]::GetFileName($outputPath)
    protection = 'Windows DPAPI CurrentUser'
    encryptedBytes = $protected.Length
    archiveSha256 = $archiveHash
    roundTripVerified = $true
    contains = $archiveMembers.ToArray()
    recoveryBoundary = 'Decrypt with this Windows user profile before chain nonce reconciliation; never restore a journal blindly.'
}
[System.IO.File]::WriteAllText($proofPath, ($proof | ConvertTo-Json -Depth 4), [System.Text.UTF8Encoding]::new($false))
[pscustomobject]@{ Backup = $outputPath; Proof = $proofPath; Bytes = $protected.Length; RoundTripVerified = $true } | ConvertTo-Json -Compress
