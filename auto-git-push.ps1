$repo = "C:\Users\vamsh\Music\bookitall"
$branch = "master"

Set-Location $repo

Write-Host "Bookitall automatic GitHub push is running..."
Write-Host "Watching: $repo"
Write-Host "Branch: $branch"
Write-Host "Checking for changes every 10 seconds..."
Write-Host "Press CTRL+C to stop."

$lastStatus = ""

while ($true) {

    Set-Location $repo

    # Get only tracked-file changes
    $status = git status --porcelain

    # Remove untracked files from consideration
    $trackedChanges = git diff --name-only

    if ($trackedChanges) {

        $currentStatus = $trackedChanges -join "|"

        if ($currentStatus -ne $lastStatus) {

            Write-Host ""
            Write-Host "Changes detected:"
            $trackedChanges | ForEach-Object {
                Write-Host "  $_"
            }

            Write-Host "Waiting 30 seconds for editing to settle..."
            Start-Sleep -Seconds 30

            # Check again after the delay
            $finalChanges = git diff --name-only

            if ($finalChanges) {

                Write-Host "Committing changes..."

                git add -u

                git commit -m "Auto update" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

                if ($LASTEXITCODE -eq 0) {

                    Write-Host "Pushing to GitHub..."

                    git push origin $branch

                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "Successfully pushed to GitHub."
                    }
                    else {
                        Write-Host "GitHub push failed."
                    }
                }
            }

            $lastStatus = $currentStatus
        }
    }
    else {
        $lastStatus = ""
    }

    Start-Sleep -Seconds 10
}