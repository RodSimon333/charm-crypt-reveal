# Helper script for creating commits with specific timestamps
param(
    [string]$Message,
    [string]$Date,
    [string]$User,
    [string]$Email
)

git config user.name $User
git config user.email $Email
$env:GIT_AUTHOR_DATE = $Date
$env:GIT_COMMITTER_DATE = $Date
git commit -m $Message
Remove-Item Env:\GIT_AUTHOR_DATE
Remove-Item Env:\GIT_COMMITTER_DATE













