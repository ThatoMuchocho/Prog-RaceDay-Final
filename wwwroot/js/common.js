(() => {
  "use strict";
  const KEY = "racedaySession";
  // RaceDay.Api hosts both the site and API on the same origin.
  const API_BASE_URL = window.location.origin;
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); }
    catch { return null; }
  }
  function saveSession(data) {
    const token = read(data, "token");
    if (!token) throw new Error("The API login response did not contain a token.");
    const session = {
      token,
      userID: read(data, "userID"),
      firstName: read(data, "firstName") || "",
      lastName: read(data, "lastName") || "",
      email: read(data, "email") || "",
      role: read(data, "role") || "Participant"
    };
    sessionStorage.setItem(KEY, JSON.stringify(session));
    return session;
  }
  function clearSession() { sessionStorage.removeItem(KEY); }
  function read(obj, name) {
    if (!obj || typeof obj !== "object") return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, name)) return obj[name];
    const key = Object.keys(obj).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? obj[key] : undefined;
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }
  function formatDate(value) {
    if (!value) return "Date to be confirmed";
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? esc(value) : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  }
  function money(value) {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 2 }).format(n);
  }
  async function api(path, options = {}) {
    if (window.location.protocol === "file:") {
      throw new Error("Run the RaceDay.Api project in Visual Studio, then open its HTTPS URL. Do not open index.html directly from Windows Explorer.");
    }
    const session = getSession();
    const headers = new Headers(options.headers || {});
    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    let response;
    try {
      const apiPath = path.startsWith("/") ? path : `/${path}`;
      response = await fetch(`${API_BASE_URL}${apiPath}`, { ...options, headers });
    } catch {
      throw new Error("The RaceDay API could not be reached. Check that the API project is running.");
    }
    if (response.status === 204) return null;
    const raw = await response.text();
    let payload = null;
    if (raw) {
      try { payload = JSON.parse(raw); } catch { payload = { message: raw }; }
    }
    if (!response.ok) {
      if (response.status === 401 && !path.includes("/api/auth/login")) {
        clearSession();
        if (!location.pathname.endsWith("/login.html")) location.href = "/login.html";
      }
      const message = read(payload, "message") || read(payload, "title") || read(payload, "detail") || `Request failed (${response.status}).`;
      throw new Error(message);
    }
    return payload;
  }
  function toast(message, isError = false) {
    const el = document.getElementById("toast");
    if (!el) { window.alert(message); return; }
    el.textContent = message;
    el.className = `toast show${isError ? " error" : ""}`;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => { el.className = "toast"; }, 3600);
  }
  window.RaceDay = { API_BASE_URL, getSession, saveSession, clearSession, read, esc, formatDate, money, api, toast };
})();