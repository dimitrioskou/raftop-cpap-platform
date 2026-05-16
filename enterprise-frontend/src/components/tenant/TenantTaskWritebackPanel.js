import React from 'react';

function safeLower(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
}

function formatDateTime(value) {
  if (!value) return '—';

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat('el-GR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  } catch (_error) {
    return String(value);
  }
}

function normalizeEvents(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.events)) return parsed.events;
      if (parsed && Array.isArray(parsed.logs)) return parsed.logs;
      if (parsed && Array.isArray(parsed.history)) return parsed.history;
      return [];
    } catch (_error) {
      return [];
    }
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.events)) return value.events;
    if (Array.isArray(value.logs)) return value.logs;
    if (Array.isArray(value.history)) return value.history;
  }

  return [];
}

export function normalizeTaskWriteback(input) {
  const task = input || {};

  const writeback =
    task.writeback ||
    task.writeback_state ||
    task.writebackState ||
    task.action_writeback ||
    task.actionWriteback ||
    task.sync ||
    task.sync_state ||
    task.syncState ||
    {};

  const linkedSignalId = firstValue(
    task.linked_signal_id,
    task.linkedSignalId,
    task.signal_id,
    task.signalId,
    task.atlas_signal_id,
    task.atlasSignalId,
    writeback.linked_signal_id,
    writeback.linkedSignalId,
    writeback.signal_id,
    writeback.signalId
  );

  const coachingContextId = firstValue(
    task.coaching_context_id,
    task.coachingContextId,
    task.linked_coaching_context_id,
    task.linkedCoachingContextId,
    task.patient_coaching_context_id,
    task.patientCoachingContextId,
    writeback.coaching_context_id,
    writeback.coachingContextId,
    writeback.linked_coaching_context_id,
    writeback.linkedCoachingContextId
  );

  const rawStatus = firstValue(
    task.writeback_status,
    task.writebackStatus,
    task.action_writeback_status,
    task.actionWritebackStatus,
    task.sync_status,
    task.syncStatus,
    writeback.status,
    writeback.writeback_status,
    writeback.writebackStatus,
    writeback.sync_status,
    writeback.syncStatus
  );

  const signalStatus = safeLower(
    firstValue(
      task.signal_writeback_status,
      task.signalWritebackStatus,
      writeback.signal_status,
      writeback.signalStatus,
      writeback.signal_writeback_status,
      writeback.signalWritebackStatus
    )
  );

  const coachingStatus = safeLower(
    firstValue(
      task.coaching_writeback_status,
      task.coachingWritebackStatus,
      writeback.coaching_status,
      writeback.coachingStatus,
      writeback.coaching_writeback_status,
      writeback.coachingWritebackStatus
    )
  );

  const errorMessage = firstValue(
    task.writeback_error,
    task.writebackError,
    task.sync_error,
    task.syncError,
    task.last_writeback_error,
    task.lastWritebackError,
    writeback.error,
    writeback.error_message,
    writeback.errorMessage,
    writeback.writeback_error,
    writeback.writebackError
  );

  const syncedAt = firstValue(
    task.writeback_synced_at,
    task.writebackSyncedAt,
    task.synced_at,
    task.syncedAt,
    task.last_writeback_at,
    task.lastWritebackAt,
    writeback.synced_at,
    writeback.syncedAt,
    writeback.writeback_synced_at,
    writeback.writebackSyncedAt,
    writeback.last_writeback_at,
    writeback.lastWritebackAt
  );

  const events = normalizeEvents(
    firstValue(
      task.writeback_events,
      task.writebackEvents,
      task.sync_events,
      task.syncEvents,
      writeback.events,
      writeback.logs,
      writeback.history
    )
  );

  let status = safeLower(rawStatus);

  if (!status) {
    const hasLinkedContext = Boolean(linkedSignalId || coachingContextId);
    const hasError = Boolean(errorMessage);

    if (hasError) {
      status = 'failed';
    } else if (
      signalStatus === 'synced' &&
      (coachingStatus === 'synced' || !coachingContextId)
    ) {
      status = 'synced';
    } else if (signalStatus === 'synced' || coachingStatus === 'synced') {
      status = 'partial';
    } else if (hasLinkedContext) {
      status = 'pending';
    } else {
      status = 'not_applicable';
    }
  }

  return {
    status,
    linkedSignalId,
    coachingContextId,
    signalStatus,
    coachingStatus,
    syncedAt,
    errorMessage,
    events
  };
}

function getStatusMeta(status) {
  const normalized = safeLower(status);

  if (['synced', 'success', 'completed', 'complete', 'ok'].includes(normalized)) {
    return {
      label: 'Synced',
      tone: 'success',
      description:
        'Το task έγραψε πίσω επιτυχώς στο συνδεδεμένο operational context.'
    };
  }

  if (['partial', 'partially_synced', 'partial_success'].includes(normalized)) {
    return {
      label: 'Partial sync',
      tone: 'warning',
      description:
        'Έγινε μερικός συγχρονισμός. Κάποιο linked context ενημερώθηκε, κάποιο όχι.'
    };
  }

  if (['failed', 'error', 'writeback_failed', 'sync_failed'].includes(normalized)) {
    return {
      label: 'Failed',
      tone: 'danger',
      description:
        'Το task action ολοκληρώθηκε, αλλά το writeback απέτυχε ή χρειάζεται έλεγχο.'
    };
  }

  if (['pending', 'queued', 'processing', 'in_progress'].includes(normalized)) {
    return {
      label: 'Pending',
      tone: 'info',
      description:
        'Υπάρχει linked context, αλλά δεν έχει επιβεβαιωθεί ακόμα writeback.'
    };
  }

  if (['skipped', 'not_applicable', 'none', 'no_context'].includes(normalized)) {
    return {
      label: 'No writeback',
      tone: 'neutral',
      description:
        'Δεν βρέθηκε linked signal ή coaching context για ενημέρωση.'
    };
  }

  return {
    label: status || 'Unknown',
    tone: 'neutral',
    description: 'Το σύστημα δεν επέστρεψε καθαρή κατάσταση writeback.'
  };
}

function toneStyles(tone) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.2,
    border: '1px solid transparent'
  };

  if (tone === 'success') {
    return {
      ...base,
      background: '#ecfdf3',
      color: '#027a48',
      borderColor: '#abefc6'
    };
  }

  if (tone === 'warning') {
    return {
      ...base,
      background: '#fffaeb',
      color: '#b54708',
      borderColor: '#fedf89'
    };
  }

  if (tone === 'danger') {
    return {
      ...base,
      background: '#fef3f2',
      color: '#b42318',
      borderColor: '#fecdca'
    };
  }

  if (tone === 'info') {
    return {
      ...base,
      background: '#eff8ff',
      color: '#175cd3',
      borderColor: '#b2ddff'
    };
  }

  return {
    ...base,
    background: '#f8fafc',
    color: '#475467',
    borderColor: '#e4e7ec'
  };
}

function Dot({ tone }) {
  const color =
    tone === 'success'
      ? '#12b76a'
      : tone === 'warning'
        ? '#f79009'
        : tone === 'danger'
          ? '#f04438'
          : tone === 'info'
            ? '#2e90fa'
            : '#98a2b3';

  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
        display: 'inline-block'
      }}
    />
  );
}

function InfoRow({ label, value, danger }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        gap: 10,
        alignItems: 'start',
        fontSize: 13,
        padding: '6px 0',
        borderBottom: '1px solid #f2f4f7'
      }}
    >
      <div style={{ color: '#667085', fontWeight: 700 }}>{label}</div>
      <div
        style={{
          color: danger ? '#b42318' : '#101828',
          fontWeight: danger ? 700 : 600,
          wordBreak: 'break-word'
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

function EventLine({ event }) {
  const message = firstValue(
    event.message,
    event.label,
    event.action,
    event.type,
    event.status,
    JSON.stringify(event)
  );

  const createdAt = firstValue(
    event.created_at,
    event.createdAt,
    event.timestamp,
    event.time,
    event.date
  );

  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 10,
        background: '#f9fafb',
        border: '1px solid #eaecf0',
        marginTop: 8
      }}
    >
      <div style={{ fontSize: 13, color: '#101828', fontWeight: 700 }}>
        {message}
      </div>
      <div style={{ fontSize: 12, color: '#667085', marginTop: 3 }}>
        {formatDateTime(createdAt)}
      </div>
    </div>
  );
}

export default function TenantTaskWritebackPanel({
  task,
  action,
  compact = false,
  showTitle = true
}) {
  const source = task || action || {};
  const state = normalizeTaskWriteback(source);
  const meta = getStatusMeta(state.status);

  const panelStyle = {
    border: '1px solid #e4e7ec',
    borderRadius: 16,
    background: '#ffffff',
    boxShadow: compact ? 'none' : '0 8px 24px rgba(16, 24, 40, 0.06)',
    padding: compact ? 12 : 16,
    marginTop: compact ? 8 : 14
  };

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 10
        }}
      >
        <div>
          {showTitle && (
            <div
              style={{
                color: '#101828',
                fontSize: compact ? 14 : 16,
                fontWeight: 900,
                marginBottom: 4
              }}
            >
              Writeback state
            </div>
          )}

          {!compact && (
            <div style={{ color: '#667085', fontSize: 13, lineHeight: 1.45 }}>
              {meta.description}
            </div>
          )}
        </div>

        <span style={toneStyles(meta.tone)}>
          <Dot tone={meta.tone} />
          {meta.label}
        </span>
      </div>

      {!compact && (
        <div style={{ marginTop: 10 }}>
          <InfoRow label="Linked signal" value={state.linkedSignalId} />
          <InfoRow label="Coaching context" value={state.coachingContextId} />
          <InfoRow label="Signal sync" value={state.signalStatus || '—'} />
          <InfoRow label="Coaching sync" value={state.coachingStatus || '—'} />
          <InfoRow label="Last writeback" value={formatDateTime(state.syncedAt)} />

          {state.errorMessage && (
            <InfoRow label="Error" value={state.errorMessage} danger />
          )}

          {state.events.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: '#344054',
                  marginBottom: 4
                }}
              >
                Writeback events
              </div>

              {state.events.slice(0, 5).map((event, index) => (
                <EventLine
                  key={`${index}-${firstValue(
                    event.id,
                    event.created_at,
                    event.message,
                    index
                  )}`}
                  event={event}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {compact && (
        <div style={{ color: '#667085', fontSize: 12, marginTop: 6 }}>
          Signal: <strong>{state.signalStatus || '—'}</strong>
          {' · '}
          Coaching: <strong>{state.coachingStatus || '—'}</strong>
          {' · '}
          Last: <strong>{formatDateTime(state.syncedAt)}</strong>
        </div>
      )}
    </div>
  );
}