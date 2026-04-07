import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApiStatusNotice from './ApiStatusNotice';
import PageStateCard from './PageStateCard';
import MetricCard from './MetricCard';
import useTenantResource from '../hooks/useTenantResource';
import { buttonStyle, panelStyle, softFieldCardStyle } from '../utils/uiStyles';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function EntityProfilePage({
  title,
  subtitle,
  entityLabel,
  endpointGroups,
  extractRecord,
  normalizeRecord,
  fallbackRecord,
  metricsBuilder,
  sectionsBuilder,
  actionsBuilder
}) {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, loading, apiNotice, refresh } = useTenantResource({
    endpointGroups,
    extractData: extractRecord,
    normalizeData: normalizeRecord,
    fallbackData: fallbackRecord,
    entityLabel
  });

  const metrics = useMemo(() => {
    try {
      return asArray(typeof metricsBuilder === 'function' ? metricsBuilder(data || {}) : []);
    } catch (error) {
      return [];
    }
  }, [data, metricsBuilder]);

  const sections = useMemo(() => {
    try {
      return asArray(typeof sectionsBuilder === 'function' ? sectionsBuilder(data || {}) : []);
    } catch (error) {
      return [];
    }
  }, [data, sectionsBuilder]);

  const actions = useMemo(() => {
    try {
      return asArray(
        typeof actionsBuilder === 'function'
          ? actionsBuilder(data || {}, { navigate, id })
          : []
      );
    } catch (error) {
      return [];
    }
  }, [data, actionsBuilder, navigate, id]);

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
            PROFILE WORKSPACE
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
            {title}
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>{subtitle}</div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate(-1)} style={buttonStyle('secondary')}>
            Back
          </button>

          <button type="button" onClick={refresh} style={buttonStyle('primary')}>
            Refresh
          </button>

          {actions.map((action, index) => (
            <button
              key={action?.label || `action-${index}`}
              type="button"
              onClick={action?.onClick}
              style={buttonStyle(action?.primary ? 'primary' : 'secondary')}
            >
              {action?.label || 'Action'}
            </button>
          ))}
        </div>
      </div>

      {apiNotice ? (
        <ApiStatusNotice
          status={apiNotice.status}
          title={apiNotice.title}
          message={apiNotice.message}
          details={apiNotice.details}
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
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric?.label || `metric-${index}`}
                label={metric?.label || 'Metric'}
                value={metric?.value ?? '—'}
                hint={metric?.hint}
                tone={metric?.tone || (index % 2 === 0 ? 'blue' : 'purple')}
              />
            ))}
          </div>

          {sections.map((section, sectionIndex) => (
            <div
              key={section?.title || `section-${sectionIndex}`}
              style={{ ...panelStyle(false), marginBottom: 16 }}
            >
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>
                {section?.title || 'Section'}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12
                }}
              >
                {asArray(section?.fields).map((field, fieldIndex) => (
                  <div
                    key={field?.label || `field-${fieldIndex}`}
                    style={softFieldCardStyle()}
                  >
                    <div style={{ color: '#667085', fontSize: 12, marginBottom: 6 }}>
                      {field?.label || 'Field'}
                    </div>
                    <div style={{ fontWeight: 800, color: '#101828', lineHeight: 1.5 }}>
                      {field?.value ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}