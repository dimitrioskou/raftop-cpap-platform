# RAFTOP CPAP CARE Pro - Credential Channel Confirmation

Purpose:

Confirm how credentials will be delivered separately from the ZIP.

Allowed credential delivery options:

- direct phone confirmation plus separate temporary password delivery
- separate controlled email per user
- secure password manager if available
- agreed controlled channel

Not allowed:

- credentials inside ZIP
- credentials in same email as ZIP
- credentials in group chat
- one shared account for all users
- database credentials
- Render secrets
- GitHub secrets

Credential delivery record:

- user:
- role:
- username/email:
- delivery channel:
- delivery date:
- first login tested: yes/no
- password change requested: yes/no

Rule:

ZIP first. Receipt second. Named users third. Credentials fourth. Login test fifth.
