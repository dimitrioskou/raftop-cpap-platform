# RAFTOP CPAP CARE Pro - First Login and Route Test

Purpose:

Confirm that buyer users can access the correct screens.

First login test:

1. Open login URL.
2. Enter assigned credentials.
3. Confirm successful login.
4. Confirm correct tenant/buyer context.
5. Confirm user role.
6. Confirm accessible routes.
7. Confirm restricted routes are not accessible if role should not access them.

Routes to test:

- /login
- /sales/raftopoulos/executive-demo-home
- /sales/raftopoulos/quality-profit
- /sales/raftopoulos/pilot-walkthrough-scenario
- /sales/raftopoulos/pilot-demo
- /settings
- /compliance
- /reports
- /doctor
- /clinic

Backend health test:

https://raftop-cpap-backend.onrender.com/api/health

Issue rule:

If login or route access fails, record user, route, time, screenshot if safe, and error message.
