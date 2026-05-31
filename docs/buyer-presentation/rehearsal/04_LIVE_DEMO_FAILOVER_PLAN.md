# RAFTOP CPAP CARE Pro - Live Demo Failover Plan

Purpose:

Use this plan if something fails during the live demo.

If Render is waking up:

- Say: Render may need a few seconds to wake up.
- Continue with screenshots.
- Return to live route later.

If login is slow:

- Do not panic.
- Refresh once.
- If still slow, use screenshot backup.

If a buyer route does not load:

- Use screenshot backup.
- Say: The route is part of the buyer-ready package and has been verified in the release gate.
- Do not debug live.

If backend health fails:

- Do not open code.
- Do not open Render secrets.
- Move to delivery pack and explain that technical review can verify backend health separately.

If buyer asks for code:

- Say: We can schedule a structured technical review with agreed scope.
- Do not open source code during business demo.

If buyer asks for real patient data:

- Say: Real patient data requires written data scope, DPA/legal review, secure transfer, and authorized users.

Golden rule:

Never turn a buyer presentation into live debugging.
