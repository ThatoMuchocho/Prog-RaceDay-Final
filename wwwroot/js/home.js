(() => {
  "use strict";
  const RD = window.RaceDay;
  const grid = document.getElementById("homeEventGrid");
  const form = document.getElementById("eventFilterForm");
  const session = RD.getSession();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  if (session) {
    document.getElementById("navLogin")?.classList.add("hidden");
    document.getElementById("navSignup")?.classList.add("hidden");
    document.getElementById("navPortal")?.classList.remove("hidden");
    document.getElementById("navLogout")?.classList.remove("hidden");
  }
  document.getElementById("navLogout")?.addEventListener("click", () => { RD.clearSession(); location.reload(); });

  function fmtTime(value) {
    if (!value) return "Time TBC";
    const text = String(value);
    return text.length >= 5 ? text.slice(0, 5) : text;
  }
  function safeExternalUrl(value) {
    if (!value) return null;
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
    catch { return null; }
  }
  function eventCard(event) {
    const id = RD.read(event, "eventID");
    const name = RD.read(event, "eventName") || "RaceDay event";
    const date = RD.formatDate(RD.read(event, "eventDate"));
    const place = [RD.read(event, "location"), RD.read(event, "province")].filter(Boolean).join(", ");
    const distance = RD.read(event, "distanceKm");
    const sport = RD.read(event, "sportType") || "Activity TBC";
    const kind = RD.read(event, "eventKind") || "Race";
    const status = RD.read(event, "status") || "Upcoming";
    const slots = RD.read(event, "timeSlots") || [];
    const available = Number(RD.read(event, "availableTimeSlots") || 0);
    const hasSlots = Array.isArray(slots) && slots.length > 0;
    const timeText = hasSlots ? `${available} time slot${available === 1 ? "" : "s"} available` : `${fmtTime(RD.read(event,"startTime"))}${RD.read(event,"endTime") ? " – " + fmtTime(RD.read(event,"endTime")) : ""}`;
    const desc = RD.read(event, "description") || "Open the event to view categories, available time slots and entry information.";
    const external = safeExternalUrl(RD.read(event, "externalUrl"));
    const kindClass = String(kind).toLowerCase() === "awareness" || String(kind).toLowerCase() === "charity" ? "kind-special" : "";
    const statusClass = String(status).toLowerCase() === "completed" ? "completed" : ["closed", "cancelled"].includes(String(status).toLowerCase()) ? "closed" : "";
    return `<article class="event-card"><div class="event-card-banner"><span class="event-type ${kindClass}">${RD.esc(kind)}</span><span class="event-activity">${RD.esc(sport)}</span></div><div class="event-card-body"><h3>${RD.esc(name)}</h3><div class="event-meta"><span>◷ ${RD.esc(date)}</span><span>⌖ ${RD.esc(place || "Location TBC")}</span><span>↗ ${RD.esc(distance ?? "—")} km</span><span>◴ ${RD.esc(timeText)}</span></div><p>${RD.esc(desc).slice(0,140)}${String(desc).length>140?"…":""}</p><div class="card-footer"><span class="status-pill ${statusClass}">${RD.esc(status)}</span><a class="button button-outline" href="event.html?id=${encodeURIComponent(id)}">View details →</a></div>${external ? `<a class="external-entry-link" href="${RD.esc(external)}" target="_blank" rel="noopener">Organiser's website ↗</a>` : ""}</div></article>`;
  }

  async function searchEvents() {
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(form).entries()) {
      const cleaned = String(value).trim();
      if (!cleaned || (name === "province" && cleaned === "All") || (["sportType","eventKind"].includes(name) && cleaned === "All")) continue;
      params.set(name, cleaned);
    }
    grid.innerHTML = `<div class="loading-card glass-panel">Searching events across South Africa…</div>`;
    document.getElementById("eventResultCount").textContent = "Searching…";
    try {
      const events = await RD.api(`/api/events${params.size ? `?${params.toString()}` : ""}`);
      const list = Array.isArray(events) ? events : [];
      document.getElementById("eventResultCount").textContent = `${list.length} matching RaceDay event${list.length === 1 ? "" : "s"}`;
      if (!list.length) {
        grid.innerHTML = `<div class="empty-card glass-panel"><strong>No RaceDay listings match those filters.</strong><span>Try another province, activity or distance. You can also use the national calendars above to discover events that have not been added to RaceDay by an organiser.</span></div>`;
        return;
      }
      grid.innerHTML = list.map(eventCard).join("");
    } catch (error) {
      document.getElementById("eventResultCount").textContent = "Event search unavailable";
      grid.innerHTML = `<div class="empty-card glass-panel">${RD.esc(error.message)}</div>`;
    }
  }
  form?.addEventListener("submit", event => { event.preventDefault(); searchEvents(); });
  document.getElementById("clearEventFilters")?.addEventListener("click", () => { form.reset(); searchEvents(); });
  searchEvents();
})();