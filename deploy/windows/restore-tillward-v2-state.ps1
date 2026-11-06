[CmdletBinding()]
param([string]$BackupPath)

$ErrorActionPreference = 'Stop'
$workRoot = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent $workRoot
$expectedKeeper = '0x7C93C575bE5ceD60F388D2866991d68aE23e3D42'
$requiredMembers = @('wallet.json', 'paydown-keeper-journal.json', 'keeper-registry.json')
$entropy = [Text.Encoding]::UTF8.GetBytes('Tillward private VPS state backup v2')

function Read-TarOctal([byte[]]$Bytes, [int]$Offset, [int]$Length) {
    $text = [Text.Encoding]::ASCII.GetString($Bytes, $Offset, $Length).Trim([char[]]@([char]0, ' '))
    if (-not $text) { return 0L }
    return [Convert]::ToInt64($text, 8)
}

if (-not $BackupPath) {
    $latest = Get-ChildItem -LiteralPath $workRoot -File -Filter 'tillward-vps-v2-state-*.dpapi' |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latest) { throw 'No encrypted VPS snapshot is available.' }
    $BackupPath = $latest.FullName
}
$BackupPath = (Resolve-Path -LiteralPath $BackupPath).Path
$metadataPath = [IO.Path]::ChangeExtension($BackupPath, '.json')
$metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
$protected = [IO.File]::ReadAllBytes($BackupPath)
$archive = [Security.Cryptography.ProtectedData]::Unprotect($protected, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
$archiveHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($archive))
if ($archiveHash -ne $metadata.archiveSha256) { throw 'Restored snapshot hash does not match its capture proof.' }

$compressed = [IO.MemoryStream]::new($archive)
$gzip = [IO.Compression.GZipStream]::new($compressed, [IO.Compression.CompressionMode]::Decompress)
$tarStream = [IO.MemoryStream]::new()
$gzip.CopyTo($tarStream)
$tar = $tarStream.ToArray()
if ($tar.Length -lt 1024) { throw 'Restored tar archive is too short.' }

$restored = @{}
$seen = [Collections.Generic.List[string]]::new()
$offset = 0
while ($offset + 512 -le $tar.Length) {
    $zeroBlock = $true
    for ($i = 0; $i -lt 512; $i++) {
        if ($tar[$offset + $i] -ne 0) { $zeroBlock = $false; break }
    }
    if ($zeroBlock) { break }

    $header = [byte[]]::new(512)
    [Buffer]::BlockCopy($tar, $offset, $header, 0, 512)
    $storedChecksum = Read-TarOctal $header 148 8
    $actualChecksum = 0L
    for ($i = 0; $i -lt 512; $i++) {
        if ($i -ge 148 -and $i -lt 156) { $actualChecksum += 32 } else { $actualChecksum += $header[$i] }
    }
    if ($storedChecksum -ne $actualChecksum) { throw 'Restored tar header checksum failed.' }

    $name = [Text.Encoding]::UTF8.GetString($tar, $offset, 100).Trim([char]0)
    $prefix = [Text.Encoding]::UTF8.GetString($tar, $offset + 345, 155).Trim([char]0)
    if ($prefix) { $name = "$prefix/$name" }
    $name = $name -replace '^\./', ''
    if (-not $name -or $name.StartsWith('/') -or $name.Contains('\') -or ($name.Split('/') -contains '..')) {
        throw 'Restored archive contains an unsafe member path.'
    }
    $type = [char]$tar[$offset + 156]
    $size = Read-TarOctal $header 124 12
    if ($size -lt 0 -or $size -gt 4194304 -or $offset + 512 + $size -gt $tar.Length) {
        throw 'Restored archive contains an invalid member size.'
    }
    if ($type -in @([char]0, '0') -and $name -in $requiredMembers) {
        if ($restored.ContainsKey($name)) { throw 'Restored archive contains a duplicate state member.' }
        $payload = [byte[]]::new([int]$size)
        [Buffer]::BlockCopy($tar, $offset + 512, $payload, 0, [int]$size)
        $restored[$name] = [Text.UTF8Encoding]::new($false, $true).GetString($payload)
        $seen.Add($name)
    }
    $offset += 512 + ([long][Math]::Ceiling($size / 512) * 512)
}
if (@($requiredMembers | Where-Object { -not $restored.ContainsKey($_) }).Count -gt 0) {
    throw 'Restored snapshot is missing required state files.'
}

$wallet = ConvertFrom-Json -InputObject $restored['wallet.json'] -AsHashtable
$registry = ConvertFrom-Json -InputObject $restored['keeper-registry.json'] -AsHashtable
$journal = ConvertFrom-Json -InputObject $restored['paydown-keeper-journal.json'] -AsHashtable
foreach ($key in @('address', 'privateKey')) { if ($key -notin $wallet.Keys) { throw 'Restored wallet shape is invalid.' } }
if ([string]$wallet.privateKey -notmatch '^0x[0-9a-fA-F]{64}$') { throw 'Restored wallet key shape is invalid.' }
foreach ($key in @('chainId', 'factory', 'nextBlock', 'accounts', 'anchor')) {
    if ($key -notin $registry.Keys) { throw 'Restored registry shape is invalid.' }
}
foreach ($key in @('pending', 'day', 'gasReserved', 'last', 'accounts', 'cursor')) {
    if ($key -notin $journal.Keys) { throw 'Restored journal shape is invalid.' }
}
if ([int]$registry.chainId -ne 31611 -or [string]$registry.factory -ne '0xaa5121f96502b9618156e8288e60ce1c699b9a43') { throw 'Restored registry targets an unexpected chain/factory.' }

# Derive the public signer address locally. The private key is sent to the child process via stdin only.
$node = (Get-Command node.exe -ErrorAction Stop).Source
$nodeScript = @'
import { privateKeyToAccount } from 'viem/accounts';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const wallet = JSON.parse(input);
process.stdout.write(privateKeyToAccount(wallet.privateKey).address);
'@
$start = [Diagnostics.ProcessStartInfo]::new()
$start.FileName = $node
$start.WorkingDirectory = Join-Path $repoRoot 'outputs\paydown'
$start.UseShellExecute = $false
$start.CreateNoWindow = $true
$start.RedirectStandardInput = $true
$start.RedirectStandardOutput = $true
$start.RedirectStandardError = $true
$start.StandardInputEncoding = [Text.UTF8Encoding]::new($false)
$start.ArgumentList.Add('--input-type=module')
$start.ArgumentList.Add('-e')
$start.ArgumentList.Add($nodeScript)
$process = [Diagnostics.Process]::new()
$process.StartInfo = $start
if (-not $process.Start()) { throw 'Could not start local wallet identity verification.' }
$stdoutTask = $process.StandardOutput.ReadToEndAsync()
$stderrTask = $process.StandardError.ReadToEndAsync()
$process.StandardInput.Write(($wallet | ConvertTo-Json -Compress -Depth 4))
$process.StandardInput.Close()
if (-not $process.WaitForExit(15000)) {
    try { $process.Kill($true) } catch {}
    throw 'Local wallet identity verification timed out.'
}
$derivedAddress = $stdoutTask.GetAwaiter().GetResult().Trim()
$null = $stderrTask.GetAwaiter().GetResult()
$nodeExitCode = $process.ExitCode
$process.Dispose()
if ($derivedAddress -notmatch '^0x[0-9a-fA-F]{40}$' -or $nodeExitCode -ne 0) {
    throw 'Could not validate restored wallet identity.'
}
if (-not [string]::Equals([string]$wallet.address, $derivedAddress, [StringComparison]::OrdinalIgnoreCase) -or
    -not [string]::Equals($derivedAddress, $expectedKeeper, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Restored wallet does not match the expected keeper identity.'
}

$accountCount = if ($registry.accounts -is [System.Collections.IDictionary]) {
    $registry.accounts.Count
} else {
    @($registry.accounts).Count
}
$proof = [ordered]@{
    verifiedAt = [DateTimeOffset]::UtcNow.ToString('o')
    status = 'restored_data_validated_in_memory'
    sourceFile = [IO.Path]::GetFileName($BackupPath)
    archiveSha256 = $archiveHash
    chainId = [int]$registry.chainId
    requiredMembersRestored = $requiredMembers
    walletIdentityMatchesExpectedKeeper = $true
    keeperAddress = $derivedAddress
    registryAccountCount = $accountCount
    journalParsed = $true
    journalHadPendingTransaction = ($null -ne $journal.pending)
    plaintextFilesWritten = $false
    signingOrBroadcastAttempted = $false
    liveStateChanged = $false
    runtimeServiceRestored = $false
    limitation = 'This validates encrypted data recovery and identity consistency only; it does not restore systemd/runtime on an isolated host.'
}
$proofPath = Join-Path $workRoot 'tillward-v2-restore-rehearsal.json'
[IO.File]::WriteAllText($proofPath, ($proof | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
$proof | ConvertTo-Json -Compress -Depth 5
