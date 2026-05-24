// RAFTOP CPAP CARE Pro
// Production Auth Gate
// Purpose: prevent unauthenticated access to admin/tenant frontend routes.
// This is a frontend protection layer. Backend API authorization must still be enforced separately.

(function () {
  if (typeof window === "undefined") {
    return;
  }

  var PUBLIC_PATHS = [
    /^\/login\/?$/i,
    /^\/auth\/login\/?$/i,
    /^\/forgot-password\/?$/i,
    /^\/reset-password\/?$/i,
    /^\/password-reset\/?$/i,
    /^\/patient-login\/?$/i,
    /^\/patient\/login\/?$/i
  ];

  var PUBLIC_PREFIXES = [
    "/static/",
    "/assets/",
    "/favicon",
    "/manifest.json",
    "/robots.txt"
  ];

  function getPath() {
    return window.location.pathname || "/";
  }

  function isPublicPath(path) {
    if (!path) {
      return false;
    }

    for (var i = 0; i < PUBLIC_PREFIXES.length; i++) {
      if (path.indexOf(PUBLIC_PREFIXES[i]) === 0) {
        return true;
      }
    }

    for (var j = 0; j < PUBLIC_PATHS.length; j++) {
      if (PUBLIC_PATHS[j].test(path)) {
        return true;
      }
    }

    return false;
  }

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function hasAuthToken() {
    var token =
      safeGet("raftop_auth_token") ||
      safeGet("token") ||
      safeGet("access_token") ||
      safeGet("auth_token");

    if (token && String(token).trim().length > 10) {
      return true;
    }

    return false;
  }

  function redirectToLogin() {
    var currentPath = getPath();
    var currentSearch = window.location.search || "";

    try {
      window.localStorage.setItem(
        "raftop_redirect_after_login",
        currentPath + currentSearch
      );
    } catch (err) {
      // Ignore localStorage failures.
    }

    if (currentPath !== "/login") {
      window.location.replace("/login");
    }
  }

  function enforceAuthGate() {
    var path = getPath();

    if (isPublicPath(path)) {
      return;
    }

    if (!hasAuthToken()) {
      redirectToLogin();
    }
  }

  function patchHistoryMethod(methodName) {
    var original = window.history[methodName];

    if (typeof original !== "function") {
      return;
    }

    window.history[methodName] = function () {
      var result = original.apply(this, arguments);

      setTimeout(function () {
        enforceAuthGate();
      }, 0);

      return result;
    };
  }

  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");

  window.addEventListener("popstate", function () {
    enforceAuthGate();
  });

  window.addEventListener("storage", function () {
    enforceAuthGate();
  });

  window.addEventListener("focus", function () {
    enforceAuthGate();
  });

  enforceAuthGate();
})();