const PILOT20_TENANT = "raftopoulos-pilot-20";
const PILOT20_PATH = "/pilot20/manual-entry";
const LOGIN_PATH = "/login";

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

function isPilot20Payload(payload) {
  if (!payload) return false;

  const tenant = extractTenant(payload);
  const email = extractEmail(payload);

  if (tenant === PILOT20_TENANT) return true;
  if (String(email).toLowerCase().includes("raftopoulos.pilot")) return true;

  return false;
}

function isPilot20User() {
  const token = getStoredToken();
  const decoded = decodeJwt(token);

  if (isPilot20Payload(decoded)) return true;

  const storedObjects = readPossibleUserObjects();
  return storedObjects.some(isPilot20Payload);
}

function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname.startsWith(LOGIN_PATH);
}

function enforcePilot20Isolation() {
  if (!isPilot20User()) return;

  const currentPath = window.location.pathname;

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

if (typeof window !== "undefined") {
  installHistoryHooks();

  window.addEventListener("load", enforcePilot20Isolation);
  window.addEventListener("popstate", enforcePilot20Isolation);
  window.addEventListener("storage", enforcePilot20Isolation);

  setTimeout(enforcePilot20Isolation, 0);
  setInterval(enforcePilot20Isolation, 750);
}
