const PILOT20_TENANT = "raftopoulos-pilot-20";
const PILOT20_PATH = "/pilot20/manual-entry";
const PILOT20_RESCUE_PATH = "/pilot20/rescue-monitor";
const PILOT20_UPLOAD_PATH = "/pilot20/usage-upload";
const PILOT20_IMPORT_HISTORY_PATH = "/pilot20/import-history";
const PILOT20_UNMATCHED_DEVICES_PATH = "/pilot20/unmatched-devices";
const PILOT20_MONTHLY_VALUE_REPORT_PATH = "/pilot20/monthly-value-report";
const LOGIN_PATH = "/login";
const LOCK_KEY = "RAFTOP_PILOT20_BUYER_LOCK";

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function decodeJwt(token) {
  try {
    if (!token || token.split(".").length < 2) return null;

    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

function getStoredToken() {
  const keys = ["token", "authToken", "accessToken", "access_token", "jwt"];

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && value.split(".").length >= 2) return value;
  }

  return "";
}

function readPossibleUserObjects() {
  const keys = ["user", "authUser", "currentUser", "userData", "auth", "session"];
  const objects = [];

  for (const key of keys) {
    const parsed = safeJsonParse(localStorage.getItem(key));
    if (parsed) objects.push(parsed);
  }

  return objects;
}

function extractTenant(payload) {
  return (
    payload?.tenant_id ||
    payload?.tenant_slug ||
    payload?.tenant ||
    payload?.tenantId ||
    payload?.user?.tenant_id ||
    payload?.user?.tenant_slug ||
    payload?.data?.tenant_id ||
    payload?.data?.tenant_slug ||
    ""
  );
}

function extractEmail(payload) {
  return (
    payload?.email ||
    payload?.user?.email ||
    payload?.data?.email ||
    ""
  );
}

function lockPilot20() {
  try {
    localStorage.setItem(LOCK_KEY, "1");
  } catch (error) {
    // ignore
  }
}

function unlockPilot20IfAdminLoginDetected() {
  const path = window.location.pathname;

  if (path === LOGIN_PATH || path.startsWith(LOGIN_PATH)) {
    const emailInput = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const tenantInput = document.querySelector('input[name="tenant"], input[placeholder*="tenant" i]');

    const email = String(emailInput?.value || "").toLowerCase();
    const tenant = String(tenantInput?.value || "").toLowerCase();

    if (email && !email.includes("pilot") && tenant && tenant !== PILOT20_TENANT) {
      localStorage.removeItem(LOCK_KEY);
    }
  }
}

function isPilot20Payload(payload) {
  if (!payload) return false;

  const tenant = String(extractTenant(payload)).toLowerCase();
  const email = String(extractEmail(payload)).toLowerCase();

  if (tenant === PILOT20_TENANT) return true;
  if (email.includes("raftopoulos.pilot")) return true;
  if (email.includes("pilot") && email.includes("raftopoulos")) return true;

  return false;
}

function isPilot20User() {
  if (localStorage.getItem(LOCK_KEY) === "1") return true;

  const token = getStoredToken();
  const decoded = decodeJwt(token);

  if (isPilot20Payload(decoded)) {
    lockPilot20();
    return true;
  }

  const storedObjects = readPossibleUserObjects();
  const matched = storedObjects.some(isPilot20Payload);

  if (matched) {
    lockPilot20();
    return true;
  }

  return false;
}

function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname === PILOT20_RESCUE_PATH || pathname === PILOT20_UPLOAD_PATH || pathname === PILOT20_IMPORT_HISTORY_PATH || pathname === PILOT20_UNMATCHED_DEVICES_PATH || pathname === PILOT20_MONTHLY_VALUE_REPORT_PATH || pathname.startsWith(LOGIN_PATH);
}

function detectPilotLoginFormInput() {
  const inputs = Array.from(document.querySelectorAll("input"));
  const values = inputs.map((input) => String(input.value || "").toLowerCase()).join(" ");

  if (values.includes(PILOT20_TENANT)) {
    lockPilot20();
    return;
  }

  if (values.includes("raftopoulos.pilot")) {
    lockPilot20();
    return;
  }

  if (values.includes("pilot") && values.includes("raftopoulos")) {
    lockPilot20();
  }
}

function enforcePilot20Isolation() {
  unlockPilot20IfAdminLoginDetected();

  const currentPath = window.location.pathname;

  if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH || currentPath === PILOT20_UNMATCHED_DEVICES_PATH || currentPath === PILOT20_MONTHLY_VALUE_REPORT_PATH) {
    lockPilot20();
    return;
  }

  detectPilotLoginFormInput();

  if (!isPilot20User()) return;

  if (!isAllowedPilot20Path(currentPath)) {
    window.location.replace(PILOT20_PATH);
  }
}

function installHistoryHooks() {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function pushStatePatched() {
    originalPushState.apply(window.history, arguments);
    setTimeout(enforcePilot20Isolation, 0);
  };

  window.history.replaceState = function replaceStatePatched() {
    originalReplaceState.apply(window.history, arguments);
    setTimeout(enforcePilot20Isolation, 0);
  };
}

function installFormHooks() {
  document.addEventListener("input", detectPilotLoginFormInput, true);
  document.addEventListener("change", detectPilotLoginFormInput, true);
  document.addEventListener("submit", detectPilotLoginFormInput, true);
  document.addEventListener("click", detectPilotLoginFormInput, true);
}

if (typeof window !== "undefined") {
  installHistoryHooks();
  installFormHooks();

  window.addEventListener("load", enforcePilot20Isolation);
  window.addEventListener("popstate", enforcePilot20Isolation);
  window.addEventListener("storage", enforcePilot20Isolation);

  setTimeout(enforcePilot20Isolation, 0);
  setInterval(enforcePilot20Isolation, 500);
}







