$ErrorActionPreference = 'Continue'
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$root = "F:\deepseek\PROJECTS\kaoyan-app"
$dist = Join-Path $root "dist\kaoyan-408.html"
$out = Join-Path $root ".shots"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$prof = Join-Path $out "profile"
New-Item -ItemType Directory -Force -Path $prof | Out-Null
$src = [IO.File]::ReadAllText($dist, [Text.UTF8Encoding]::new($false))

function Shot([string]$name, [string]$hash, [string]$inject) {
    $html = $src
    if ($inject) { $html = $html.Replace('</body>', "<script>$inject</script></body>") }
    $f = Join-Path $out "$name.html"
    [IO.File]::WriteAllText($f, $html, [Text.UTF8Encoding]::new($false))
    $u = "file:///" + ($f.Replace('\', '/'))
    if ($hash) { $u = $u + "#" + $hash }
    $png = Join-Path $out "$name.png"
    if (Test-Path $png) { Remove-Item $png -Force }
    $line = '"' + $chrome + '" --headless=new --disable-gpu --no-sandbox --disable-crash-reporter --disable-breakpad ' +
            '--hide-scrollbars --no-first-run --allow-file-access-from-files ' +
            '--user-data-dir="' + $prof + '" --force-device-scale-factor=2 --window-size=390,844 ' +
            '--virtual-time-budget=4000 --screenshot="' + $png + '" "' + $u + '" >nul 2>nul'
    cmd /c $line
    if (Test-Path $png) {
        $kb = [math]::Round((Get-Item $png).Length / 1024, 0)
        Write-Host ("OK   {0,-18} {1} KB" -f $name, $kb)
    } else {
        Write-Host ("FAIL {0}" -f $name)
    }
}

Shot "01-home" ""
Shot "02-practice" "#/practice"
Shot "03-subject" "#/practice/co"
Shot "04-quiz" "" "setTimeout(function(){window.__startQuiz('co','co-3');},60);"
Shot "05-quiz-answered" "" "setTimeout(function(){window.__startQuiz('co','co-3');setTimeout(function(){var o=document.querySelectorAll('.opt');if(o[1])o[1].click();},150);},60);"
Shot "06-memory" "#/memory"
Shot "07-cards" "#/memory/co/co-3"
Shot "08-me" "#/me"
