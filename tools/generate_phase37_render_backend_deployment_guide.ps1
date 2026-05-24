# RAFTOP CPAP CARE Pro
# Phase 37.2 - Render Backend Deployment Guide

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir "phase37_render_backend_deployment_guide_$Timestamp.md"

$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$Report = @"
# RAFTOP CPAP CARE Pro — Phase 37.2 Render Backend Deployment Guide

Generated: $Now

## FINAL STATUS

**FINAL STATUS: PHASE37_RENDER_BACKEND_DEPLOYMENT_GUIDE_READY**

---

## Purpose

This guide defines the safe production deployment procedure for the RAFTOP CPAP CARE Pro backend on Render.

This phase does not deploy automatically.  
It creates the exact deployment control guide required before production deployment.

---

## Backend Service Target

| Item | Value |
|---|---|
| Platform | Render |
| Service Type | Web Service |
| Runtime | Node.js |
| Root Directory | enterprise-backend |
| Health Endpoint | /api/health |
| Production Mode | NODE_ENV=production |

---

## Required Render Backend Settings

### Service Type

Create:

**New Web Service**

### Repository

Connect the GitHub repository that contains:

```text
enterprise-backend
enterprise-frontend
tools
reports