# RAFTOP CPAP CARE Pro - Phase 37.6 Production Smoke Test Script

Generated: 2026-05-24 09:57:55

FINAL STATUS

FINAL STATUS: PHASE37_PRODUCTION_SMOKE_TEST_SCRIPT_READY

------------------------------------------------------------

PURPOSE

This phase creates the production smoke test script for RAFTOP CPAP CARE Pro.

Generated smoke test script:
C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\tools\run_phase37_production_smoke_test.ps1

------------------------------------------------------------

WHAT THE SMOKE TEST CHECKS

- backend health endpoint
- auth login route availability
- tenant subscription route availability
- patients route availability
- devices route availability
- ATLAS summary route availability
- optional security command center route availability
- protected route behavior
- localhost blocking for production tests

------------------------------------------------------------

HOW TO RUN AFTER PRODUCTION BACKEND EXISTS

.\tools\run_phase37_production_smoke_test.ps1 -BackendUrl https://your-backend.onrender.com -TenantId raftopoulos-live

For local preflight only:

.\tools\run_phase37_production_smoke_test.ps1 -BackendUrl http://localhost:5001 -TenantId demo-tenant -AllowLocalhost

------------------------------------------------------------

IMPORTANT

A 401 or 403 response is acceptable for protected routes.
A 404 response is not acceptable for required production routes.
A 500 response is not acceptable.
The health endpoint must return 200.

------------------------------------------------------------

FINAL VERDICT

The production smoke test script has been created.

FINAL STATUS: PHASE37_PRODUCTION_SMOKE_TEST_SCRIPT_READY
