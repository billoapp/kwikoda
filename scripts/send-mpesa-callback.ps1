# send-mpesa-callback.ps1 - send sample MPesa callback to local or deployed endpoint
param(
  [string]$url = "http://localhost:3000/api/payments/mpesa/callback"
)

Write-Host "Sending sample callback to $url"
Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' -Body (Get-Content -Raw "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\mpesa-sample.json")
Write-Host "Done"