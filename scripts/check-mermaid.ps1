param(
    [Parameter(Mandatory = $true)][string[]]$Files
)

$ErrorActionPreference = 'Stop'
$tmp = Join-Path $env:TEMP ("mmd-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

$blocks = @()
foreach ($file in $Files) {
    $lines = Get-Content -LiteralPath $file
    $inBlock = $false
    $buf = New-Object System.Collections.Generic.List[string]
    $idx = 0
    $tag = [IO.Path]::GetFileNameWithoutExtension($file) + '-' + (Split-Path (Split-Path $file -Parent) -Leaf)
    foreach ($line in $lines) {
        if (-not $inBlock -and $line -match '^```mermaid\s*$') { $inBlock = $true; $buf.Clear(); continue }
        if ($inBlock -and $line -match '^```\s*$') {
            $inBlock = $false
            $idx++
            $path = Join-Path $tmp "$tag-$idx.mmd"
            Set-Content -LiteralPath $path -Value ($buf -join "`n") -Encoding utf8
            $blocks += $path
            continue
        }
        if ($inBlock) { $buf.Add($line) }
    }
    Write-Host "$file -> $idx mermaid block(s)"
}

if ($blocks.Count -eq 0) { Write-Host 'No mermaid blocks found.'; exit 0 }

$failed = 0
foreach ($b in $blocks) {
    $svg = [IO.Path]::ChangeExtension($b, '.svg')
    & npx --yes @mermaid-js/mermaid-cli@latest -i $b -o $svg -e svg -q 2>&1 | Out-String | Write-Host
    if (Test-Path $svg) {
        Write-Host "OK   $b"
        Remove-Item $svg -Force
    }
    else {
        Write-Host "FAIL $b"
        $failed++
    }
}

Remove-Item $tmp -Recurse -Force
if ($failed -gt 0) { exit 1 }
Write-Host 'All mermaid diagrams rendered successfully.'
