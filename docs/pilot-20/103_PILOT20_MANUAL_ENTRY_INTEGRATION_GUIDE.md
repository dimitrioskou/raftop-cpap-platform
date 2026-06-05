# RAFTOP CPAP CARE Pro - Pilot 20 Manual Entry Integration Guide

REQUIRED_MARKER: PHASE103_INTEGRATION_GUIDE
REQUIRED_MARKER: BACKEND_ROUTE_TO_MOUNT
REQUIRED_MARKER: FRONTEND_ROUTE_TO_ADD
REQUIRED_MARKER: MENU_LINK_TO_ADD

## Backend integration

Mount this backend route:

File:
enterprise-backend/routes/pilot20ManualEntryRoutes.js

Expected mount:
app.use("/api/pilot20", require("./routes/pilot20ManualEntryRoutes"));

Common target file:
enterprise-backend/server.js
or
enterprise-backend/src/server.js
or
enterprise-backend/app.js

## Frontend integration

Page file:
enterprise-frontend/src/pages/Pilot20ManualEntryPage.js

Suggested route:
<Route path="/pilot20/manual-entry" element={<Pilot20ManualEntryPage />} />

Suggested menu label:
Pilot 20 Entry

## Required after integration

1. Restart backend.
2. Rebuild/redeploy frontend.
3. Test:
   - GET /api/pilot20/health
   - GET /api/pilot20/summary
   - POST /api/pilot20/patients
4. Confirm hard limit 20.
5. Confirm no direct identifiers.
