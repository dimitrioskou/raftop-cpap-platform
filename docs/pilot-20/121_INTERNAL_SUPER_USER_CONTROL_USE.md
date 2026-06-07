# RAFTOP CPAP CARE Pro - Internal Super User Control Use

REQUIRED_MARKER: PHASE121_INTERNAL_SUPER_USER_CONTROL_USE
REQUIRED_MARKER: STATUS_LOCK_UNLOCK_COMMANDS
REQUIRED_MARKER: DO_NOT_SHARE_CONTROL_KEY
REQUIRED_MARKER: INTERNAL_ONLY

## Internal-only usage

Set the internal control key in your current PowerShell session only.

Do not write it into a document.
Do not send it to buyer.
Do not commit it.

## Check status

.\tools\raftop_pilot20_tenant_control.ps1 -Action status

## Lock Pilot20

.\tools\raftop_pilot20_tenant_control.ps1 -Action lock -Reason "pilot_period_ended"

## Unlock Pilot20

.\tools\raftop_pilot20_tenant_control.ps1 -Action unlock -Reason "payment_confirmed"

## Buyer impact

When locked, buyer cannot use Pilot20 operational endpoints.
When unlocked, buyer access continues normally.
