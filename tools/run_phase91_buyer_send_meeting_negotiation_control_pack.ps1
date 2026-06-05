# RAFTOP CPAP CARE Pro
# Phase 91 - Buyer Send / Meeting / Negotiation Control Pack
# Creates final send confirmation, meeting agenda, negotiation guardrails, and follow-up plan.
# Does not include secrets, source code, reports, tools, or real patient data.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\commercial-sale-pack"
$ClientDeliveryDir = Join-Path $Root "client-delivery"

$SendFolder = Join-Path $Desktop "RAFTOP_SEND_TO_BUYER_FINAL"
$SendZip = Join-Path $SendFolder "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"
$SendMessage = Join-Path $SendFolder "01_MESSAGE_TO_SEND_GR.txt"

$SendConfirmation = Join-Path $DocsDir "91_SEND_CONFIRMATION_CHECKLIST_GR.md"
$MeetingAgenda = Join-Path $DocsDir "91_BUYER_MEETING_AGENDA_GR.md"
$NegotiationGuardrails = Join-Path $DocsDir "91_NEGOTIATION_GUARDRAILS_GR.md"
$BuyerQuestions = Join-Path $DocsDir "91_BUYER_QA_RESPONSES_GR.md"
$AfterSendFollowup = Join-Path $DocsDir "91_AFTER_SEND_FOLLOWUP_PLAN_GR.md"
$FinalActionCard = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_ACTION_CARD_GR.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDeliveryDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase91_buyer_send_meeting_negotiation_control_pack_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

function Check-ReportStatus {
    param([string]$Name, [string]$Pattern, [string[]]$AcceptedStatuses)

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 91 Buyer Send Meeting Negotiation Control Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 91 - Buyer Send / Meeting / Negotiation Control Pack..."
Write-Host ""

Check-ReportStatus "Phase 90 final master lock latest status" "phase90_final_master_sale_ready_lock_*.md" @(
    "PHASE90_FINAL_MASTER_SALE_READY_LOCK_READY",
    "PHASE90_FINAL_MASTER_SALE_READY_LOCK_READY_WITH_WARNINGS"
)

if (Test-Path $SendFolder) {
    Add-Result "Send folder exists" "PASS" $SendFolder
} else {
    Add-Result "Send folder exists" "FAIL" $SendFolder
}

if (Test-Path $SendZip) {
    Add-Result "Final ZIP to send exists" "PASS" $SendZip
} else {
    Add-Result "Final ZIP to send exists" "FAIL" $SendZip
}

if (Test-Path $SendMessage) {
    Add-Result "Greek send message exists" "PASS" $SendMessage
} else {
    Add-Result "Greek send message exists" "WARN" $SendMessage
}

$SendConfirmationContent = @'
# RAFTOP CPAP CARE Pro - Checklist πριν την αποστολή

REQUIRED_MARKER: PHASE91_SEND_CONFIRMATION_CHECKLIST
REQUIRED_MARKER: SEND_ONLY_FINAL_ZIP
REQUIRED_MARKER: BUYER_ONLY_LINK_INCLUDED
REQUIRED_MARKER: NO_SOURCE_CODE_NO_SECRETS

## Στέλνω μόνο

[ ] RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip
[ ] Buyer-only link:
https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

## Προαιρετικά

[ ] SHA256 checksum αρχείο

## Δεν στέλνω

[ ] source code
[ ] GitHub repository
[ ] Render dashboard
[ ] database URL
[ ] .env
[ ] API keys
[ ] super admin credentials
[ ] tools
[ ] reports
[ ] παλιά ZIP
[ ] πραγματικό CSV ασθενών
[ ] παραγωγικά δεδομένα ασθενών

## Σωστή τοποθέτηση

Το στέλνω ως τελικό buyer/commercial package, όχι ως source-code παράδοση.
'@

Set-Content -Path $SendConfirmation -Value $SendConfirmationContent -Encoding UTF8

$MeetingAgendaContent = @'
# RAFTOP CPAP CARE Pro - Agenda συνάντησης με αγοραστή

REQUIRED_MARKER: PHASE91_BUYER_MEETING_AGENDA
REQUIRED_MARKER: COMMERCIAL_DISCUSSION_READY
REQUIRED_MARKER: PILOT_TO_PRODUCTION_PATH
REQUIRED_MARKER: 7000_ROLLOUT_STAGED

## Στόχος συνάντησης

Να συμφωνηθεί αν η Ραυτόπουλος θέλει:
1. Pilot activation
2. Full internal use
3. Internal use + resale rights σε ιατρούς / ιατρεία

## Δομή συνάντησης

1. Τι είναι το RAFTOP CPAP CARE Pro
2. Τι λύνει για τη Ραυτόπουλος
3. Τι κάνει το ATLAS
4. Πώς λειτουργεί το 80 Hours Compliance
5. Πώς λειτουργεί το Compliance Rescue
6. Πώς βγαίνουν reports διοίκησης
7. Πώς μπορεί να γίνει resale σε ιατρούς
8. Τι απαιτείται για 7.000 ασθενείς
9. Τιμή / μοντέλο συνεργασίας
10. Επόμενο βήμα

## Σωστή φράση

Το προϊόν είναι έτοιμο για αγορά και controlled rollout. Η παραγωγική εισαγωγή 7.000 ασθενών γίνεται σταδιακά, μετά από συμφωνία, GDPR/DPA, CSV validation και stage signoff.
'@

Set-Content -Path $MeetingAgenda -Value $MeetingAgendaContent -Encoding UTF8

$NegotiationContent = @'
# RAFTOP CPAP CARE Pro - Negotiation Guardrails

REQUIRED_MARKER: PHASE91_NEGOTIATION_GUARDRAILS
REQUIRED_MARKER: DO_NOT_GIVE_SOURCE_CODE_BY_DEFAULT
REQUIRED_MARKER: DO_NOT_SHARE_SUPER_ADMIN
REQUIRED_MARKER: DO_NOT_IMPORT_7000_WITHOUT_DPA

## Μην παραχωρήσεις εύκολα

Μην δώσεις:
- source code
- GitHub access
- Render access
- database URL
- super admin credentials
- unrestricted resale rights
- real patient import πριν GDPR/DPA

## Αν ζητήσει source code

Απάντηση:
Το default μοντέλο είναι platform license + setup + support. Source code handover είναι διαφορετικό εμπορικό αντικείμενο, με άλλη τιμολόγηση και ξεχωριστή συμφωνία.

## Αν ζητήσει super admin

Απάντηση:
Η Ραυτόπουλος παίρνει tenant admin για το δικό της περιβάλλον. Το platform super admin παραμένει στον platform owner για λόγους ασφάλειας, υποστήριξης και release control.

## Αν ζητήσει άμεσο import 7.000

Απάντηση:
Το τεχνικό rollout είναι σχεδιασμένο για 7.000 ασθενείς, αλλά γίνεται σταδιακά: 100, 500, 2.000, 7.000. Πριν από πραγματικά δεδομένα χρειάζονται GDPR/DPA, CSV validation και signoff.

## Αν πιέσει για χαμηλή τιμή

Απάντηση:
Δεν μιλάμε για ένα απλό αρχείο ή demo. Μιλάμε για πλατφόρμα CPAP portfolio monitoring, ATLAS prioritization, 80h compliance, follow-up workflow, reporting και μελλοντικό resale channel προς ιατρούς.
'@

Set-Content -Path $NegotiationGuardrails -Value $NegotiationContent -Encoding UTF8

$BuyerQuestionsContent = @'
# RAFTOP CPAP CARE Pro - Απαντήσεις σε πιθανές ερωτήσεις αγοραστή

REQUIRED_MARKER: PHASE91_BUYER_QA_RESPONSES
REQUIRED_MARKER: BUYER_OBJECTION_RESPONSES
REQUIRED_MARKER: SAFE_SCOPE_RESPONSES

## Είναι έτοιμο;

Ναι, είναι έτοιμο για buyer acceptance και controlled production rollout preparation. Για πραγματικούς 7.000 ασθενείς ακολουθούμε staged rollout με validation.

## Θα μπουν όλοι οι 7.000 ασθενείς άμεσα;

Όχι απευθείας. Το σωστό είναι staged import:
100 -> 500 -> 2.000 -> 7.000.

## Είναι σαν AirView;

Η πλατφόρμα έχει AirView-like operational monitoring λογική ως προς την παρακολούθηση CPAP χαρτοφυλακίου, αλλά δεν παρουσιάζεται ως αντίγραφο AirView.

## Είναι σαν SleepHQ;

Έχει SleepHQ-style CPAP analysis explanation, δηλαδή βοηθά να κατανοείται η πορεία χρήσης και τα σημεία που χρειάζονται follow-up. Δεν παρουσιάζεται ως αντίγραφο SleepHQ.

## Τι είναι το ATLAS;

Το ATLAS είναι το priority/action layer. Δείχνει ποιοι ασθενείς χρειάζονται προτεραιότητα με βάση no-data, κάτω από 80 ώρες, υψηλό AHI, leak και follow-up ανάγκες.

## Τι αγοράζουμε;

Αγοράζετε platform license / activation / support package. Source code και unrestricted resale δεν περιλαμβάνονται χωρίς ξεχωριστή συμφωνία.

## Πότε ξεκινάμε;

Μετά από εμπορική συμφωνία, GDPR/DPA, ορισμό χρηστών και CSV validation.
'@

Set-Content -Path $BuyerQuestions -Value $BuyerQuestionsContent -Encoding UTF8

$AfterSendContent = @'
# RAFTOP CPAP CARE Pro - Πλάνο μετά την αποστολή

REQUIRED_MARKER: PHASE91_AFTER_SEND_FOLLOWUP_PLAN
REQUIRED_MARKER: FOLLOWUP_24_48_HOURS
REQUIRED_MARKER: ASK_FOR_BUYER_DECISION

## Μετά την αποστολή

0-24 ώρες:
Επιβεβαίωσε ότι παρέλαβε το ZIP και άνοιξε το buyer-only link.

24-48 ώρες:
Ζήτησε σύντομη συνάντηση παρουσίασης.

Στη συνάντηση:
Κλείσε ποιο μοντέλο τον ενδιαφέρει:
- pilot
- full internal use
- internal use + resale rights

Μετά τη συνάντηση:
Στείλε commercial option και ζήτα απόφαση.

## Μην αφήσεις την κουβέντα ανοιχτή

Η σωστή ερώτηση:
Θέλετε να προχωρήσουμε σε pilot activation ή σε full internal use με staged rollout για τους 7.000 ασθενείς;

## Επόμενο βήμα μετά το ναι

1. Συμφωνία
2. Προκαταβολή / payment milestone
3. GDPR/DPA
4. Tenant users
5. CSV validation
6. 100-row stage
'@

Set-Content -Path $AfterSendFollowup -Value $AfterSendContent -Encoding UTF8

$FinalActionContent = @'
# RAFTOP CPAP CARE Pro - Final Action Card

REQUIRED_MARKER: PHASE91_FINAL_ACTION_CARD
REQUIRED_MARKER: SEND_NOW_READY
REQUIRED_MARKER: ONE_ZIP_ONE_LINK

## Τώρα

Στείλε μόνο:

RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip

και το link:

https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

## Μετά

Ζήτα συνάντηση.

## Στη συνάντηση

Μην παρουσιάσεις τεχνικές λεπτομέρειες πρώτα.
Πούλα το αποτέλεσμα:
- CPAP portfolio control
- 80h compliance
- ATLAS prioritization
- follow-up workflow
- management reports
- doctor resale channel

## Κόκκινη γραμμή

Πραγματικό CSV 7.000 ασθενών μπαίνει μόνο μετά από συμφωνία, GDPR/DPA, validation και staged signoff.
'@

Set-Content -Path $FinalActionCard -Value $FinalActionContent -Encoding UTF8

$CreatedDocs = @(
    $SendConfirmation,
    $MeetingAgenda,
    $NegotiationGuardrails,
    $BuyerQuestions,
    $AfterSendFollowup,
    $FinalActionCard
)

foreach ($Doc in $CreatedDocs) {
    if (Test-Path $Doc) {
        Add-Result ("Created doc: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Created doc: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

$Markers = @(
    "PHASE91_SEND_CONFIRMATION_CHECKLIST",
    "PHASE91_BUYER_MEETING_AGENDA",
    "PHASE91_NEGOTIATION_GUARDRAILS",
    "PHASE91_BUYER_QA_RESPONSES",
    "PHASE91_AFTER_SEND_FOLLOWUP_PLAN",
    "PHASE91_FINAL_ACTION_CARD"
)

foreach ($Marker in $Markers) {
    $Found = $false

    foreach ($Doc in $CreatedDocs) {
        $Content = Read-FileSafe $Doc

        if (ContainsText $Content $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Marker exists: " + $Marker) "PASS" "Found."
    } else {
        Add-Result ("Marker exists: " + $Marker) "FAIL" "Missing."
    }
}

$ForbiddenText = @(
    "give source code",
    "share super admin",
    "import 7000 immediately",
    "GDPR not needed",
    "send GitHub",
    "send .env",
    "send database URL"
)

foreach ($Doc in $CreatedDocs) {
    $Content = Read-FileSafe $Doc

    foreach ($Text in $ForbiddenText) {
        if (ContainsText $Content $Text) {
            Add-Result ("Unsafe phrase absent in " + (Split-Path $Doc -Leaf) + ": " + $Text) "FAIL" "Unsafe phrase found."
        } else {
            Add-Result ("Unsafe phrase absent in " + (Split-Path $Doc -Leaf) + ": " + $Text) "PASS" "Absent."
        }
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE91_BUYER_SEND_MEETING_NEGOTIATION_CONTROL_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE91_BUYER_SEND_MEETING_NEGOTIATION_CONTROL_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE91_BUYER_SEND_MEETING_NEGOTIATION_CONTROL_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 91 Buyer Send / Meeting / Negotiation Control Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Commercial docs folder:"
Write-Host $DocsDir
Write-Host ""
Write-Host "Final action card:"
Write-Host $FinalActionCard
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host ("PASS_COUNT: " + $script:PassCount)
Write-Host ("WARN_COUNT: " + $script:WarnCount)
Write-Host ("FAIL_COUNT: " + $script:FailCount)
Write-Host ""
Write-Host ("FINAL STATUS: " + $FinalStatus)
Write-Host ""

exit $ExitCode