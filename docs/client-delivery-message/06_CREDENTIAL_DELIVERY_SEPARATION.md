# RAFTOP CPAP CARE Pro - Credential Delivery Separation

Purpose:

Define how credentials are delivered after the client start pack.

Rules:

- do not include credentials in the ZIP
- do not send passwords in the same email as the ZIP
- do not send admin passwords in group chats
- do not share one account across users
- do not send database credentials
- do not send Render or GitHub secrets

Preferred flow:

1. send client delivery ZIP
2. confirm receipt
3. confirm named users
4. create or activate user accounts
5. deliver credentials separately
6. complete first login test
7. request password change where applicable

Rule:

Delivery package first. Credentials second. Login test third.
