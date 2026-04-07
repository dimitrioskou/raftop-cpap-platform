const db = require('../../db');

const FALLBACK_BRANDING = {
  companyName: 'RAFTOP Enterprise',
  logoUrl: '',
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  accentColor: '#10b981',
  whiteLabel: true,
  customDomain: 'enterprise.raftop.local',
  supportEmail: 'support@raftop.local'
};

async function runQuery(sql, params = []) {
  if (typeof db.query === 'function') return db.query(sql, params);
  if (db.pool && typeof db.pool.query === 'function') return db.pool.query(sql, params);
  throw new Error('Database query function is not available.');
}

async function getTenantBranding({ tenantId }) {
  try {
    const result = await runQuery(
      `
        SELECT
          COALESCE(NULLIF(company_name, ''), 'RAFTOP Enterprise') AS company_name,
          COALESCE(NULLIF(logo_url, ''), '') AS logo_url,
          COALESCE(NULLIF(primary_color, ''), '#2563eb') AS primary_color,
          COALESCE(NULLIF(secondary_color, ''), '#0f172a') AS secondary_color,
          COALESCE(NULLIF(accent_color, ''), '#10b981') AS accent_color,
          COALESCE(white_label, FALSE) AS white_label,
          COALESCE(NULLIF(custom_domain, ''), '') AS custom_domain,
          COALESCE(NULLIF(support_email, ''), '') AS support_email
        FROM tenant_branding
        WHERE tenant_id = $1
        LIMIT 1
      `,
      [tenantId]
    );

    const row = result.rows?.[0];

    if (!row) {
      return FALLBACK_BRANDING;
    }

    return {
      companyName: row.company_name || 'RAFTOP Enterprise',
      logoUrl: row.logo_url || '',
      primaryColor: row.primary_color || '#2563eb',
      secondaryColor: row.secondary_color || '#0f172a',
      accentColor: row.accent_color || '#10b981',
      whiteLabel: Boolean(row.white_label),
      customDomain: row.custom_domain || '',
      supportEmail: row.support_email || ''
    };
  } catch (error) {
    return FALLBACK_BRANDING;
  }
}

module.exports = {
  getTenantBranding
};