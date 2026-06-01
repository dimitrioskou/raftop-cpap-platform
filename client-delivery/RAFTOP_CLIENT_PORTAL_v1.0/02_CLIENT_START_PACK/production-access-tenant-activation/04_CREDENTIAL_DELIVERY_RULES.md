# RAFTOP CPAP CARE Pro - Credential Delivery Rules

Purpose:

Prevent unsafe credential sharing.

Allowed:

- send username and temporary password through separate controlled channels
- force password change where available
- confirm user identity before providing access
- disable users who no longer need access

Not allowed:

- sending passwords in group chats
- sending admin credentials in public email thread
- sharing one account across multiple users
- sharing database credentials
- sharing tokens
- sharing secrets
- sharing GitHub or Render secret settings

Credential delivery checklist:

- user confirmed
- role confirmed
- email confirmed
- credential channel confirmed
- temporary password delivered
- login tested
- password change requested if applicable

Rule:

Credentials are operational access, not casual messages.
