import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiStatusNotice from './ApiStatusNotice';
import MetricCard from './MetricCard';
import PageStateCard from './PageStateCard';
import { buildApiNotice, fetchJson, formatDateTime } from '../utils/tenantDataHelpers';
import {
  buttonStyle,
  panelStyle,
  softFieldCardStyle,
  toolbarCardStyle
} from '../utils/uiStyles';

function isIsoLikeDate(value) {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
}

function formatDisplayValue(value) {
  if (value == null || value === '') return '—';

  if (typeof value === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toLocaleString('en-US') : value.toFixed(1);
  }

  if (typeof value === 'string') {
    if (isIsoLikeDate(value)) return formatDateTime(value);
    return value;
  }

  if (Array.isArray(value)) {
    if (!value.length) return '—';

    const flattened = value
      .map((item) => {
        if (item == null) return null;
        if (typeof item === 'string' || typeof item === 'number') return String(item);
        if (typeof item === 'boolean') return item ? 'Enabled' : 'Disabled';
        if (typeof item === 'object') {
          if (item.name) return String(item.name);
          if (item.key) return String(item.key);
          if (item.label) return String(item.label);
          return JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean);

    return flattened.length ? flattened.join(', ') : '—';
  }

  if (typeof value === 'object') {
    const preferredKeys = ['name', 'label', 'title', 'status', 'message'];
    for (const key of preferredKeys) {
      if (value[key] != null) {
        return formatDisplayValue(value[key]);
      }
    }

    const entries = Object.entries(value)
      .slice(0, 4)
      .map(([key, val]) => `${key}: ${formatDisplayValue(val)}`);

    return entries.length ? entries.join(' | ') : '—';
  }

  return String(value);
}

function resolveMetricValue(metric, data) {
  if (!metric?.key || !data || typeof data !== 'object') {
    return metric?.value;
  }

  if (Object.prototype.hasOwnProperty.call(data, metric.key)) {
    return data[metric.key];
  }

  return metric?.value;
}

function normalizeMetric(metric, data) {
  const rawValue = resolveMetricValue(metric, data);

  return {
    ...metric,
    value: formatDisplayValue(rawValue)
  };
}

export default function WorkspaceShellPage({
  title,
  subtitle,
  endpoint,
  entityLabel,
  fallbackStatus = 'ready',
  fallbackSummary = 'Workspace shell is active.',
  fallbackMetrics = [],
  sections = []
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(!endpoint);

  const loadData = useCallback(
    async (signal) => {
      if (!endpoint) {
        setLoading(false);
        setUsingFallback(true);
        setData(null);
        return;
      }

      setLoading(true);
      setApiError('');
      setUsingFallback(false);

      try {
        const payload = await fetchJson(endpoint, { signal });
        setData(payload);
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setData(null);
        setUsingFallback(true);
        setApiError(error.message || `Failed to load ${entityLabel}.`);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [endpoint, entityLabel]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const apiNotice = useMemo(() => {
    return buildApiNotice({
      apiError,
      usingFallback,
      entityLabel
    });
  }, [apiError, usingFallback, entityLabel]);

  const effectiveMetrics = useMemo(() => {
    return fallbackMetrics.map((metric) => normalizeMetric(metric, data));
  }, [data, fallbackMetrics]);

  const effectiveSections = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      fields: (section.fields || []).map((field) => {
        if (field.key && data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, field.key)) {
          return {
            ...field,
            value: formatDisplayValue(data[field.key])
          };
        }

        return {
          ...field,
          value: formatDisplayValue(field.value)
        };
      })
    }));
  }, [sections, data]);

  const summaryText = useMemo(() => {
    if (!data || typeof data !== 'object') return fallbackSummary;

    const summaryParts = [];

    if (data.plan) summaryParts.push(`Plan: ${formatDisplayValue(data.plan)}`);
    if (data.provider) summaryParts.push(`Provider: ${formatDisplayValue(data.provider)}`);
    if (data.brandName) summaryParts.push(`Brand: ${formatDisplayValue(data.brandName)}`);
    if (data.timestamp || data.updated_at || data.created_at) {
      summaryParts.push(
        `Last Sync: ${formatDisplayValue(data.timestamp || data.updated_at || data.created_at)}`
      );
    }

    return summaryParts.length ? summaryParts.join(' • ') : fallbackSummary;
  }, [data, fallbackSummary]);

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          ...panelStyle(true),
          marginBottom: 18,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#93c5fd', letterSpacing: 0.6 }}>
            WORKSPACE
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
            {title}
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>{subtitle}</div>
        </div>

        <button
          type="button"
          onClick={() => {
            const controller = new AbortController();
            loadData(controller.signal);
          }}
          style={buttonStyle('primary')}
        >
          Refresh
        </button>
      </div>

      {apiNotice ? (
        <ApiStatusNotice
          status={apiNotice.status}
          title={apiNotice.title}
          message={apiNotice.message}
          compact
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {loading ? (
        <PageStateCard
          title={`Loading ${entityLabel}`}
          message={`Fetching ${entityLabel} from the active tenant endpoints.`}
        />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 16
            }}
          >
            <MetricCard
              label="Workspace State"
              value={usingFallback ? formatDisplayValue(fallbackStatus) : 'Connected'}
              tone="dark"
            />
            <MetricCard
              label="Entity"
              value={formatDisplayValue(entityLabel)}
              tone="blue"
            />

            {effectiveMetrics.map((metric, index) => (
              <MetricCard
                key={metric.label || `metric-${index}`}
                label={metric.label}
                value={metric.value ?? '—'}
                hint={metric.hint}
                tone={metric.tone || (index % 2 === 0 ? 'purple' : 'green')}
              />
            ))}
          </div>

          {effectiveSections.map((section, index) => (
            <div
              key={section.title || `section-${index}`}
              style={{ ...panelStyle(false), marginBottom: 16 }}
            >
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>
                {section.title}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12
                }}
              >
                {(section.fields || []).map((field, fieldIndex) => (
                  <div
                    key={field.label || `field-${fieldIndex}`}
                    style={softFieldCardStyle()}
                  >
                    <div style={{ color: '#667085', fontSize: 12, marginBottom: 6 }}>
                      {field.label}
                    </div>
                    <div style={{ fontWeight: 800, color: '#101828', lineHeight: 1.5 }}>
                      {field.value ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={toolbarCardStyle()}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
              Workspace Summary
            </div>
            <div style={{ color: '#667085', lineHeight: 1.6 }}>
              {summaryText}
            </div>
          </div>
        </>
      )}
    </div>
  );
}