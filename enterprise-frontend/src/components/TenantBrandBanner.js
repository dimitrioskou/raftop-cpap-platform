// enterprise-frontend/src/components/TenantBrandBanner.js
// RAFTOP CPAP CARE Pro
// Safe tenant brand banner component
// Purpose: prevents production build failure when App.js imports ./components/TenantBrandBanner

import React from "react";

function safeGetLocalStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function parseUser() {
  const raw =
    safeGetLocalStorage("raftop_auth_user") ||
    safeGetLocalStorage("user") ||
    "";

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function getTenantId() {
  const user = parseUser();

  return (
    safeGetLocalStorage("tenant_id") ||
    safeGetLocalStorage("tenantId") ||
    user?.tenant_id ||
    user?.tenantId ||
    "raftopoulos-live"
  );
}

function getDisplayName() {
  const user = parseUser();

  return (
    user?.name ||
    user?.full_name ||
    user?.email ||
    "RAFTOP Admin"
  );
}

export default function TenantBrandBanner({
  title = "RAFTOP CPAP CARE Pro",
  subtitle = "Enterprise CPAP monitoring, ATLAS follow-up and pilot operations",
  variant = "default"
}) {
  const tenantId = getTenantId();
  const displayName = getDisplayName();

  return (
    <div style={styles.wrapper}>
      <div style={styles.left}>
        <div style={styles.kicker}>Production Tenant</div>
        <div style={styles.title}>{title}</div>
        <div style={styles.subtitle}>{subtitle}</div>
      </div>

      <div style={styles.right}>
        <div style={styles.badge}>{tenantId}</div>
        <div style={styles.user}>{displayName}</div>
        <div style={styles.status}>
          {variant === "demo" ? "Pilot demo mode" : "Secure access"}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "18px 22px",
    marginBottom: "18px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(15,118,110,0.96), rgba(15,23,42,0.96))",
    color: "#ffffff",
    boxShadow: "0 18px 55px rgba(15, 23, 42, 0.22)"
  },
  left: {
    minWidth: 0
  },
  kicker: {
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#99f6e4",
    marginBottom: "6px"
  },
  title: {
    fontSize: "22px",
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: "-0.03em"
  },
  subtitle: {
    marginTop: "6px",
    fontSize: "13px",
    lineHeight: 1.4,
    color: "#d1fae5",
    fontWeight: 700
  },
  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "5px",
    flexShrink: 0
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "4px 11px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 950
  },
  user: {
    fontSize: "13px",
    fontWeight: 850,
    color: "#ffffff"
  },
  status: {
    fontSize: "11px",
    fontWeight: 850,
    color: "#99f6e4"
  }
};