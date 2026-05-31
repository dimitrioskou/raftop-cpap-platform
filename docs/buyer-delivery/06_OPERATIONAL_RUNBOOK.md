# RAFTOP CPAP CARE Pro — Operational Runbook

## Local Root

C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE

## Core Commands

Run Phase 46 audit:

cd C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE
.\tools\run_phase46_full_product_completion_audit_v2.ps1 -RunBuild

Run Phase 47 release gate:

cd C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE
.\tools\run_phase47_final_buyer_ready_release_candidate_gate.ps1 -RunBuild

Run Phase 48 buyer delivery pack:

cd C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE
.\tools\run_phase48_create_buyer_delivery_pack.ps1

Check Git status:

git status --short

Frontend build:

cd C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\enterprise-frontend
npm run build

## Production URLs

Frontend:

https://raftop-cpap-frontend.onrender.com

Backend health:

https://raftop-cpap-backend.onrender.com/api/health

## Do Not Show Buyer

- source code unless technical review is agreed
- environment variables
- database credentials
- raw secrets
- Render secret settings
- GitHub secrets
- internal logs containing sensitive values

## Change Control

- bugs are fixed in scope
- minor improvements are evaluated
- new features become change requests
- new modules require separate scope
- real patient data requires legal/DPA framework
