import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ApiStatusNotice from './ApiStatusNotice';
import MetricCard from './MetricCard';
import PageStateCard from './PageStateCard';
import useTenantResource from '../hooks/useTenantResource';
import { extractArray, resolveBasePath } from '../utils/tenantDataHelpers';

function cardStyle() {
  return {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 1px 2px rgba(16,24,40,0.04)'
  };
}

export default function CollectionWorkspacePage({
  title,
  subtitle,
  entityLabel,
  endpointGroups,
  preferredKeys = ['items', 'data', 'results', 'rows'],
  fallbackRows = [],
  normalizeRow = (row) => row,
  searchPlaceholder = 'Search...',
  searchIndex = (row) => JSON.stringify(row || {}),
  filters = [],
  statsBuilder = () => [],
  columns = [],
  rowKey = (row, index) => row?.id || index,
  onRowClick = null,
  rowAction = null,
  emptyTitle = 'No records found',
  emptyMessage = 'Try clearing filters or refreshing the page.'
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = useMemo(() => resolveBasePath(location.pathname), [location.pathname]);

  const initialFilterState = useMemo(() => {
    return filters.reduce((acc, filter) => {
      acc[filter.key] = 'all';
      return acc;
    }, {});
  }, [filters]);

  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState(initialFilterState);

  useEffect(() => {
    setFilterState(initialFilterState);
  }, [initialFilterState]);

  const {
    data,
    loading,
    apiNotice,
    refresh
  } = useTenantResource({
    endpointGroups,
    extractData: (payload) => extractArray(payload, preferredKeys),
    normalizeData: (rows) => (rows || []).map(normalizeRow),
    fallbackData: fallbackRows,
    entityLabel
  });

  const rows = Array.isArray(data) ? data : [];

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const haystack = String(
        typeof searchIndex === 'function' ? searchIndex(row) : ''
      ).toLowerCase();

      const matchesSearch = !q || haystack.includes(q);

      const matchesFilters = filters.every((filter) => {
        const selected = filterState[filter.key] || 'all';
        if (selected === 'all') return true;

        const actualValue =
          typeof filter.getValue === 'function' ? filter.getValue(row) : row?.[filter.key];

        return String(actualValue || '').toLowerCase() === String(selected).toLowerCase();
      });

      return matchesSearch && matchesFilters;
    });
  }, [rows, search, searchIndex, filters, filterState]);

  const stats = useMemo(() => {
    return typeof statsBuilder === 'function' ? statsBuilder(rows) : [];
  }, [rows, statsBuilder]);

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{title}</h1>
          <div style={{ color: '#667085', marginTop: 6 }}>{subtitle}</div>
        </div>

        <button
          type="button"
          onClick={refresh}
          style={{
            border: '1px solid #d0d5dd',
            background: '#fff',
            padding: '10px 14px',
            borderRadius: 10,
            fontWeight: 700,
            cursor: 'pointer'
          }}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        {stats.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
          />
        ))}
      </div>

      <div style={{ ...cardStyle(), marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `2fr ${filters.map(() => '1fr').join(' ')} auto`,
            gap: 12
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%',
              border: '1px solid #d0d5dd',
              borderRadius: 10,
              padding: '12px 14px',
              outline: 'none'
            }}
          />

          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filterState[filter.key] || 'all'}
              onChange={(event) =>
                setFilterState((prev) => ({
                  ...prev,
                  [filter.key]: event.target.value
                }))
              }
              style={{
                width: '100%',
                border: '1px solid #d0d5dd',
                borderRadius: 10,
                padding: '12px 14px',
                outline: 'none',
                background: '#fff'
              }}
            >
              <option value="all">{filter.label}</option>
              {(filter.options || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilterState(initialFilterState);
            }}
            style={{
              border: '1px solid #d0d5dd',
              background: '#fff',
              padding: '12px 14px',
              borderRadius: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={cardStyle()}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 14 }}>{title} List</div>

        {loading ? (
          <PageStateCard
            title={`Loading ${entityLabel}`}
            message={`Fetching ${entityLabel} from the active tenant endpoints.`}
          />
        ) : filteredRows.length === 0 ? (
          <PageStateCard
            title={emptyTitle}
            message={emptyMessage}
            actionLabel="Refresh"
            onAction={refresh}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: Math.max(980, columns.length * 150)
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eaecf0' }}>
                  {columns.map((column) => (
                    <th key={column.label} style={{ padding: '12px 10px' }}>
                      {column.label}
                    </th>
                  ))}
                  {rowAction ? <th style={{ padding: '12px 10px' }}>Actions</th> : null}
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, index) => (
                  <tr
                    key={rowKey(row, index)}
                    style={{
                      borderBottom: '1px solid #f2f4f7',
                      cursor: onRowClick ? 'pointer' : 'default'
                    }}
                    onClick={() =>
                      typeof onRowClick === 'function'
                        ? onRowClick(row, { navigate, location, basePath })
                        : undefined
                    }
                  >
                    {columns.map((column) => (
                      <td
                        key={column.label}
                        style={{ padding: '14px 10px', verticalAlign: 'top' }}
                      >
                        {typeof column.render === 'function'
                          ? column.render(row, { navigate, location, basePath })
                          : row?.[column.key]}
                      </td>
                    ))}

                    {rowAction ? (
                      <td
                        style={{ padding: '14px 10px', verticalAlign: 'top' }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            rowAction.onClick(row, { navigate, location, basePath })
                          }
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            padding: '8px 12px',
                            borderRadius: 8,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {rowAction.label}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}