(() => {
  "use strict";
  const RD = window.RaceDay;
  const session = RD.getSession();
  if (!session?.token) { location.replace("/login.html"); return; }

  const content = document.getElementById("portalContent");
  const title = document.getElementById("viewTitle");
  const subtitle = document.getElementById("viewSubtitle");
  const eyebrow = document.getElementById("viewEyebrow");
  const nav = document.getElementById("sideNav");
  const isOrganiser = String(session.role).toLowerCase() === "organiser";
  let currentView = "dashboard";
  let selectedEventId = null;
  let eventCache = [];

  const navItems = isOrganiser
    ? [{id:"dashboard",icon:"▦",label:"Dashboard"},{id:"events",icon:"◷",label:"Manage events"},{id:"categories",icon:"◇",label:"Categories"},{id:"entries",icon:"☷",label:"Event entries"},{id:"results",icon:"↗",label:"Capture results"}]
    : [{id:"dashboard",icon:"▦",label:"Overview"},{id:"events",icon:"◷",label:"Browse events"},{id:"entries",icon:"☷",label:"My enrolments"},{id:"my-results",icon:"↗",label:"My results"}];

  document.getElementById("portalUser").textContent = `${session.firstName} ${session.lastName}`.trim() || session.email;
  document.getElementById("roleLabel").textContent = `${session.role} workspace`;
  document.getElementById("logoutButton").addEventListener("click", () => {
    RD.clearSession();
    location.href = "/index.html";
  });

  function v(obj, key, fallback = "") { const value = RD.read(obj, key); return value === undefined || value === null ? fallback : value; }
  function safeExternalUrl(value) {
    if (!value) return null;
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
    catch { return null; }
  }
  function safeStatus(status) { const s = String(status || "Pending"); const cls = ["confirmed","open","upcoming","completed","closed","cancelled","pending","paid","failed","refunded"].includes(s.toLowerCase()) ? s.toLowerCase() : "pending"; return `<span class="status-pill ${cls === "completed" ? "completed" : ["closed","cancelled","failed"].includes(cls) ? "closed" : ""}">${RD.esc(s)}</span>`; }
  function setHeader(label, heading, description) { eyebrow.textContent = label; title.textContent = heading; subtitle.textContent = description; }
  function renderNav() {
    nav.innerHTML = navItems.map(item => `<button type="button" data-view="${item.id}" class="${item.id === currentView ? "active" : ""}"><span>${item.icon}</span>${item.label}</button>`).join("");
  }
  function empty(titleText, description) { return `<div class="panel empty-state"><strong>${RD.esc(titleText)}</strong>${RD.esc(description)}</div>`; }
  function eventCard(event, manage = false) {
    const id = v(event,"eventID",v(event,"eventId"));
    const slots = Array.isArray(v(event,"timeSlots",[])) ? v(event,"timeSlots",[]) : [];
    const start = String(v(event,"startTime","")).slice(0,5);
    const slotLabel = slots.length ? `${Number(v(event,"availableTimeSlots",0))} start-time slots available` : (start ? `Starts ${start}` : "Time TBC");
    return `<article class="event-card"><div class="event-card-banner"><span class="event-type">${RD.esc(v(event,"eventKind",v(event,"status","Upcoming")))}</span><span class="event-activity">${RD.esc(v(event,"sportType","Activity"))}</span></div><div class="event-card-body"><h3>${RD.esc(v(event,"eventName","RaceDay event"))}</h3><div class="event-meta"><span>◷ ${RD.esc(RD.formatDate(v(event,"eventDate")))}</span><span>⌖ ${RD.esc(v(event,"location","TBC"))}, ${RD.esc(v(event,"province",""))}</span><span>↗ ${RD.esc(v(event,"distanceKm","—"))} km</span><span>◴ ${RD.esc(slotLabel)}</span></div><p>${RD.esc(v(event,"description","Event details will be available soon.")).slice(0,110)}</p><div class="table-actions"><button class="mini-button" data-action="details" data-id="${RD.esc(id)}">View details</button>${manage ? `<button class="mini-button" data-action="edit-event" data-id="${RD.esc(id)}">Edit</button><button class="mini-button danger" data-action="delete-event" data-id="${RD.esc(id)}">Delete</button>` : ""}</div></div></article>`;
  }
  async function getEvents() {
    eventCache = await RD.api("/api/events");
    return Array.isArray(eventCache) ? eventCache : [];
  }

  async function renderDashboard() {
    setHeader("YOUR RACEDAY", isOrganiser ? "Organiser dashboard" : "Your overview", isOrganiser ? "Manage your events and follow participant activity." : "Your event activity and upcoming challenges.");
    const events = await getEvents();
    if (isOrganiser) {
      const enrolmentLists = await Promise.all(events.map(e => RD.api(`/api/enrolments/event/${v(e,"eventID")}`).catch(() => [])));
      const enrolmentCount = enrolmentLists.reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
      const upcoming = events.filter(e => new Date(`${String(v(e,"eventDate")).slice(0,10)}T00:00:00`) >= new Date(new Date().toDateString()));
      const completed = events.filter(e => String(v(e,"status")).toLowerCase() === "completed");
      content.innerHTML = `<div class="portal-content-grid"><div class="stat-card"><span>TOTAL EVENTS</span><strong>${events.length}</strong><i>Events in the system</i></div><div class="stat-card"><span>UPCOMING EVENTS</span><strong>${upcoming.length}</strong><i>Scheduled challenges</i></div><div class="stat-card"><span>TOTAL ENTRIES</span><strong>${enrolmentCount}</strong><i>Across your events</i></div></div><section class="panel"><div class="panel-header"><h2>Event overview</h2><button class="mini-button" data-view="events">Manage events →</button></div>${events.length ? `<div class="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Location</th><th>Status</th><th></th></tr></thead><tbody>${events.map(e=>`<tr><td><strong>${RD.esc(v(e,"eventName"))}</strong></td><td>${RD.esc(RD.formatDate(v(e,"eventDate")))}</td><td>${RD.esc(v(e,"location"))}</td><td>${safeStatus(v(e,"status"))}</td><td><button class="mini-button" data-action="details" data-id="${RD.esc(v(e,"eventID"))}">Open</button></td></tr>`).join("")}</tbody></table></div>`:empty("No events created yet","Use Manage events to add your first RaceDay event.")}</section><div class="notice">Completed events: ${completed.length}. Results can be captured from the Capture results section after the event date.</div>`;
    } else {
      const enrolments = await RD.api("/api/enrolments/my");
      const results = await RD.api("/api/results/my");
      const activeEntries = Array.isArray(enrolments) ? enrolments.filter(x => !["Cancelled"].includes(v(x,"status"))) : [];
      content.innerHTML = `<div class="portal-content-grid"><div class="stat-card"><span>MY ENTRIES</span><strong>${activeEntries.length}</strong><i>Confirmed and active</i></div><div class="stat-card"><span>MY RESULTS</span><strong>${Array.isArray(results) ? results.length : 0}</strong><i>Recorded race results</i></div><div class="stat-card"><span>EVENTS TO EXPLORE</span><strong>${events.length}</strong><i>Listed on RaceDay</i></div></div><section class="panel"><div class="panel-header"><h2>Upcoming events</h2><button class="mini-button" data-view="events">Browse all →</button></div><div class="event-grid">${events.slice(0,3).map(e=>eventCard(e)).join("") || empty("No events listed","Check back when organisers publish new events.")}</div></section><section class="panel"><div class="panel-header"><h2>My recent entries</h2><button class="mini-button" data-view="entries">View all →</button></div>${activeEntries.length ? `<div class="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Category</th><th>Status</th><th>Payment</th></tr></thead><tbody>${activeEntries.slice(0,5).map(e=>`<tr><td>${RD.esc(v(e,"eventName"))}</td><td>${RD.esc(RD.formatDate(v(e,"eventDate")))}</td><td>${RD.esc(v(e,"category"))}</td><td>${safeStatus(v(e,"status"))}</td><td>${safeStatus(v(e,"paymentStatus"))}</td></tr>`).join("")}</tbody></table></div>`:empty("No entries yet","Browse events and choose a category to enter.")}</section>`;
    }
  }

  async function renderEvents() {
    setHeader(isOrganiser ? "ORGANISER WORKSPACE" : "FIND YOUR NEXT CHALLENGE", isOrganiser ? "Manage events" : "Browse events", isOrganiser ? "Create events in any South African province and publish activity, distance and start-time details." : "Filter events by province, town, activity, purpose, date and distance.");
    const events = await getEvents();
    const provinces = ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","North West","Northern Cape","Western Cape"];
    const sports = [{v:"Run",l:"Road running"},{v:"Trail Running",l:"Trail running"},{v:"Walk",l:"Walking"},{v:"Cycle",l:"Road cycling"},{v:"Mountain Biking",l:"Mountain biking"},{v:"Triathlon",l:"Triathlon"},{v:"Swimming",l:"Swimming"},{v:"Multisport",l:"Multisport"},{v:"Community",l:"Community fitness"}];
    const kinds = ["Race","Awareness","Charity","Community","Training","Special"];
    const create = isOrganiser ? `<section class="panel"><div class="panel-header"><h2 id="eventFormHeading">Publish a new event</h2></div><form id="eventForm" data-form="event"><input type="hidden" name="eventId"><div class="form-grid">
      <div class="field"><label>Event name</label><input name="eventName" maxlength="150" required placeholder="Event name"></div>
      <div class="field"><label>Event date</label><input name="eventDate" type="date" min="${new Date().toISOString().slice(0,10)}" required></div>
      <div class="field"><label>Province</label><select name="province" required>${provinces.map(x=>`<option>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Town / venue</label><input name="location" maxlength="200" required placeholder="e.g. Mbombela, Durban, Cape Town"></div>
      <div class="field"><label>Sport activity</label><select name="sportType" required>${sports.map(x=>`<option value="${x.v}">${x.l}</option>`).join("")}</select></div>
      <div class="field"><label>Event purpose</label><select name="eventKind" required>${kinds.map(x=>`<option>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Main distance (km)</label><input name="distanceKm" type="number" min="0.01" max="100000" step="0.01" required placeholder="e.g. 10"></div>
      <div class="field"><label>Status</label><select name="status"><option>Open</option><option>Upcoming</option><option>Closed</option><option>Completed</option><option>Cancelled</option></select></div>
      <div class="field"><label>General start time (optional)</label><input name="startTime" type="time"></div>
      <div class="field"><label>General end time (optional)</label><input name="endTime" type="time"></div>
      <div class="field span-all"><label>Official organiser / registration URL (optional)</label><input name="externalUrl" type="url" maxlength="500" placeholder="https://organiser.example"></div>
      <div class="field span-all"><label>Description</label><textarea name="description" maxlength="1000" placeholder="Tell participants about the route, cause, facilities and entry requirements."></textarea></div>
    </div><div class="form-actions"><button class="button button-primary" type="submit">Publish event</button><button class="mini-button" type="reset">Clear form</button></div><p class="small-muted">Add accurate distances and official times only. Use the Time slots section on an event's details page to publish separate booking slots.</p></form></section>` : "";
    content.innerHTML = `${create}<section class="panel"><div class="panel-header"><h2>${isOrganiser ? "All published events" : "Available RaceDay events"}</h2><span class="small-muted">${events.length} listed</span></div>${events.length ? `<div class="event-grid">${events.map(e=>eventCard(e,isOrganiser)).join("")}</div>` : empty("No RaceDay events found","Choose another activity or create an event (organisers). The National Event Calendars section on the home page links to wider public calendars.")}</section>`;
  }

  async function renderEventDetails(id) {
    const event = await RD.api(`/api/events/${encodeURIComponent(id)}`);
    const cats = v(event,"eventCategories",[]);
    const route = v(event,"routeInformation",null);
    const slots = Array.isArray(v(event,"timeSlots",[])) ? v(event,"timeSlots",[]) : [];
    const eventName = v(event,"eventName","RaceDay event");
    const date = RD.formatDate(v(event,"eventDate"));
    const start = String(v(event,"startTime","")).slice(0,5);
    const end = String(v(event,"endTime","")).slice(0,5);
    const accepting = !["closed","completed","cancelled"].includes(String(v(event,"status")).toLowerCase());
    setHeader("EVENT DETAILS", eventName, "View the event location, selected activity, race distance, categories and available start times.");
    const categories = Array.isArray(cats) && cats.length ? cats.map(ec => {
      const cat = v(ec,"category",{});
      return `<div class="category-row"><div><strong>${RD.esc(v(cat,"categoryName","Category"))}</strong><small>${RD.esc(v(cat,"categoryType",""))} · ${RD.esc(v(ec,"distanceKm",v(event,"distanceKm")))} km · Capacity ${RD.esc(v(ec,"maxParticipants","—"))}</small></div><div class="price-tag">${RD.esc(RD.money(v(ec,"entryFee",0)))}</div></div>`;
    }).join("") : `<div class="empty-state">No entry categories have been added yet.</div>`;
    const slotRows = slots.length ? slots.map(slot => {
      const available = Number(v(slot,"available",0));
      return `<div class="category-row"><div><strong>${RD.esc(String(v(slot,"startTime")).slice(0,5))}${v(slot,"endTime") ? " – "+RD.esc(String(v(slot,"endTime")).slice(0,5)) : ""}</strong><small>${RD.esc(v(slot,"booked",0))} booked · Capacity ${RD.esc(v(slot,"maxParticipants"))}</small></div><span class="status-pill ${available>0?"":"closed"}">${available} available</span>${isOrganiser?`<button class="mini-button danger" data-action="delete-time-slot" data-id="${RD.esc(id)}" data-slot="${RD.esc(v(slot,"timeSlotID"))}">Remove</button>`:""}</div>`;
    }).join("") : `<p class="small-muted">No separate booking slots have been published. General event time: ${RD.esc(start || "not supplied")}${end ? " – "+RD.esc(end) : ""}. The organiser can add individual slots below.</p>`;
    const slotOptions = slots.filter(x=>Number(v(x,"available",0))>0).map(slot=>`<option value="${RD.esc(v(slot,"timeSlotID"))}">${RD.esc(String(v(slot,"startTime")).slice(0,5))}${v(slot,"endTime")?" – "+RD.esc(String(v(slot,"endTime")).slice(0,5)):""} (${RD.esc(v(slot,"available"))} places left)</option>`).join("");
    const categoryOptions = Array.isArray(cats) ? cats.map(ec=>`<option value="${RD.esc(v(ec,"eventCategoryID"))}">${RD.esc(v(v(ec,"category",{}),"categoryName","Category"))} · ${RD.esc(RD.money(v(ec,"entryFee",0)))}</option>`).join("") : "";
    const externalUrl = safeExternalUrl(v(event,"externalUrl",""));
    const categoryBooking = !isOrganiser ? `<section class="panel"><div class="panel-header"><h2>Enter this event</h2></div>${accepting && cats.length ? `<form id="portalEnrolForm" data-form="participant-enrol"><div class="form-grid"><div class="field"><label>Choose your distance / category</label><select name="eventCategoryID" required>${categoryOptions}</select></div><div class="field"><label>Choose a start-time slot</label><select name="timeSlotID" ${slots.length?"required":""}>${slots.length?`<option value="">Select available time</option>${slotOptions}`:`<option value="">No separate slots published</option>`}</select><small class="small-muted">${slots.length ? "Only slots with places available are listed." : "The event's general start time applies."}</small></div></div><div class="form-actions"><button class="button button-primary" type="submit" ${slots.length && !slotOptions?"disabled":""}>Confirm event entry →</button></div></form>` : `<div class="notice warning">This event is not currently accepting entries, or the organiser has not added categories.</div>`}</section>` : "";
    const organiserSlots = isOrganiser ? `<section class="panel"><div class="panel-header"><h2>Manage start-time slots</h2></div><form id="timeSlotForm" data-form="time-slot"><input type="hidden" name="eventId" value="${RD.esc(id)}"><div class="form-grid"><div class="field"><label>Slot start time</label><input type="time" name="startTime" required></div><div class="field"><label>Slot end time (optional)</label><input type="time" name="endTime"></div><div class="field"><label>Maximum participants</label><input type="number" name="maxParticipants" min="1" max="1000000" value="100" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Add time slot</button></div></form></section>` : "";
    const routePanel = `<section class="panel"><div class="panel-header"><h2>Route information</h2></div>${route ? `<strong>${RD.esc(v(route,"routeName"))}</strong><p>${RD.esc(v(route,"routeDescription","No route description provided."))}</p>${v(route,"routeUrl") ? `<p><a href="${RD.esc(v(route,"routeUrl"))}" target="_blank" rel="noopener">Open route map ↗</a></p>` : ""}` : `<p>No route details have been added yet.</p>`}${isOrganiser ? `<form id="routeForm" data-form="route"><input type="hidden" name="eventId" value="${RD.esc(id)}"><div class="form-grid"><div class="field"><label>Route name</label><input name="routeName" maxlength="150" required value="${RD.esc(v(route,"routeName"))}"></div><div class="field"><label>Route map URL</label><input name="routeUrl" type="url" maxlength="500" value="${RD.esc(v(route,"routeUrl"))}"></div><div class="field span-all"><label>Route description</label><textarea name="routeDescription" maxlength="1000">${RD.esc(v(route,"routeDescription"))}</textarea></div></div><div class="form-actions"><button class="button button-primary" type="submit">${route ? "Update route" : "Save route"}</button>${route ? `<button class="mini-button danger" type="button" data-action="delete-route" data-id="${RD.esc(id)}">Remove route</button>` : ""}</div></form>` : ""}</section>`;
    content.innerHTML = `<section class="panel"><div class="panel-header"><h2>Event information</h2>${isOrganiser ? `<button class="mini-button" data-action="edit-event" data-id="${RD.esc(id)}">Edit event</button>` : ""}</div><div class="detail-grid"><div><div class="event-meta"><span>◷ ${RD.esc(date)}</span><span>⌖ ${RD.esc(v(event,"location"))}, ${RD.esc(v(event,"province"))}</span><span>↗ ${RD.esc(v(event,"distanceKm"))} km</span></div><p><strong>${RD.esc(v(event,"sportType"))}</strong> · ${RD.esc(v(event,"eventKind"))}</p><p>${RD.esc(v(event,"description","No event description has been provided."))}</p>${safeStatus(v(event,"status"))}${externalUrl?`<p><a href="${RD.esc(externalUrl)}" target="_blank" rel="noopener">Official organiser website / registration ↗</a></p>`:""}</div><div class="panel"><h2>Entry categories</h2>${categories}</div></div></section><section class="panel"><div class="panel-header"><h2>Available start times</h2><span class="small-muted">Times supplied by the organiser</span></div>${slotRows}</section>${categoryBooking}${organiserSlots}${routePanel}<button class="mini-button" data-view="events">← Back to events</button>`;
    selectedEventId = Number(id);
  }

  async function renderMyEntries() {
    setHeader("PARTICIPANT AREA", "My enrolments", "View your event entries, chosen start-time slots and payment status.");
    const rows = await RD.api("/api/enrolments/my");
    const body = Array.isArray(rows) ? rows.map(r => {
      const slotStart = v(r, "timeSlotStart", null);
      const slotEnd = v(r, "timeSlotEnd", null);
      const slotText = slotStart
        ? `${String(slotStart).slice(0, 5)}${slotEnd ? " – " + String(slotEnd).slice(0, 5) : ""}`
        : "General event time";
      return `<tr>
        <td><strong>${RD.esc(v(r, "eventName"))}</strong></td>
        <td>${RD.esc(RD.formatDate(v(r, "eventDate")))}</td>
        <td>${RD.esc(v(r, "province", "—"))}</td>
        <td>${RD.esc(v(r, "sportType", ""))} · ${RD.esc(v(r, "category"))}</td>
        <td>${RD.esc(v(r, "distanceKm", "—"))} km</td>
        <td>${RD.esc(slotText)}</td>
        <td>${safeStatus(v(r, "status"))}</td>
        <td>${safeStatus(v(r, "paymentStatus"))}</td>
      </tr>`;
    }).join("") : "";
    content.innerHTML = `<section class="panel">
      <div class="panel-header"><h2>Your entries</h2><span class="small-muted">${Array.isArray(rows) ? rows.length : 0} records</span></div>
      ${body ? `<div class="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Province</th><th>Activity / category</th><th>Distance</th><th>Time slot</th><th>Status</th><th>Payment</th></tr></thead><tbody>${body}</tbody></table></div>` : empty("No enrolments yet", "Browse events, select a category and choose an available start-time slot to enter.")}
    </section>`;
  }

  async function renderMyResults() {
    setHeader("PARTICIPANT AREA","My results","Review results recorded for your RaceDay entries.");
    const rows = await RD.api("/api/results/my");
    content.innerHTML = `<section class="panel"><div class="panel-header"><h2>Race results</h2><span class="small-muted">${Array.isArray(rows)?rows.length:0} records</span></div>${Array.isArray(rows)&&rows.length ? `<div class="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Position</th><th>Finish time</th><th>Chip time</th><th>Pace</th><th>Official</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${RD.esc(v(r,"eventName"))}</td><td>${RD.esc(RD.formatDate(v(r,"eventDate")))}</td><td>${RD.esc(v(r,"position","—"))}</td><td>${RD.esc(v(r,"finishTime","—"))}</td><td>${RD.esc(v(r,"chipTime","—"))}</td><td>${RD.esc(v(r,"pace","—"))}</td><td>${v(r,"isOfficial") ? "Yes" : "No"}</td></tr>`).join("")}</tbody></table></div>`:empty("No results recorded","Your results will appear here after an organiser captures them.")}</section>`;
  }

  async function renderCategories() {
    setHeader("ORGANISER WORKSPACE","Manage categories","Create event categories and link them to events.");
    const [categories,events] = await Promise.all([RD.api("/api/categories"),getEvents()]);
    content.innerHTML = `<section class="panel"><div class="panel-header"><h2>Create a category</h2></div><form id="categoryForm" data-form="category"><input type="hidden" name="categoryId"><div class="form-grid"><div class="field"><label>Category name</label><input name="categoryName" required maxlength="100" placeholder="e.g. 10 KM Run"></div><div class="field"><label>Category type</label><select name="categoryType"><option>Run</option><option>Walk</option><option>Cycle</option><option>Trail Running</option><option>Mountain Biking</option><option>Triathlon</option><option>Swimming</option><option>Community</option></select></div><div class="field span-all"><label>Description</label><textarea name="description" maxlength="500"></textarea></div><div class="field"><label>Active</label><select name="isActive"><option value="true">Yes</option><option value="false">No</option></select></div></div><div class="form-actions"><button class="button button-primary" type="submit">Save category</button><button class="mini-button" type="reset">Clear</button></div></form></section><section class="panel"><div class="panel-header"><h2>Existing categories</h2><span class="small-muted">${Array.isArray(categories)?categories.length:0} categories</span></div>${Array.isArray(categories)&&categories.length?`<div class="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Active</th><th>Actions</th></tr></thead><tbody>${categories.map(c=>`<tr><td>${RD.esc(v(c,"categoryName"))}</td><td>${RD.esc(v(c,"categoryType"))}</td><td>${RD.esc(v(c,"description","—"))}</td><td>${v(c,"isActive")?"Yes":"No"}</td><td class="table-actions"><button class="mini-button" data-action="edit-category" data-id="${RD.esc(v(c,"categoryID"))}">Edit</button><button class="mini-button danger" data-action="delete-category" data-id="${RD.esc(v(c,"categoryID"))}">Delete</button></td></tr>`).join("")}</tbody></table></div>`:empty("No categories","Create a category above.")}</section><section class="panel"><div class="panel-header"><h2>Link a category to an event</h2></div><form id="eventCategoryForm" data-form="event-category"><div class="form-grid"><div class="field"><label>Event</label><select name="eventId" required>${events.map(e=>`<option value="${RD.esc(v(e,"eventID"))}">${RD.esc(v(e,"eventName"))}</option>`).join("")}</select></div><div class="field"><label>Category</label><select name="categoryId" required>${categories.map(c=>`<option value="${RD.esc(v(c,"categoryID"))}">${RD.esc(v(c,"categoryName"))}</option>`).join("")}</select></div><div class="field"><label>Entry fee (ZAR)</label><input name="entryFee" type="number" min="0" step="0.01" value="0" required></div><div class="field"><label>Maximum participants</label><input name="maxParticipants" type="number" min="1" step="1" value="100" required></div><div class="field"><label>Category distance (km, optional)</label><input name="distanceKm" type="number" min="0.01" step="0.01" placeholder="Uses main event distance if blank"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Link category</button></div></form><p class="small-muted">A category can be linked to an event once. The API will reject duplicate links.</p></section>`;
  }

  async function renderEntries() {
    if (!isOrganiser) {
      await renderMyEntries();
      return;
    }
    setHeader("ORGANISER WORKSPACE","Event entries","Select an event to review its registered participants.");
    const events = await getEvents();
    content.innerHTML = `<section class="panel"><div class="form-grid"><div class="field"><label>Select event</label><select id="entryEventSelect">${events.map(e=>`<option value="${RD.esc(v(e,"eventID"))}">${RD.esc(v(e,"eventName"))}</option>`).join("")}</select></div><div class="field"><label>&nbsp;</label><button class="button button-primary" id="loadEntriesButton" type="button">Load entries</button></div></div></section><div id="entryResults"></div>`;
    if (events.length) await loadEventEntries(v(events[0],"eventID"));
  }

  async function loadEventEntries(eventId) {
    const target = document.getElementById("entryResults");
    if (!target) return;
    const rows = await RD.api(`/api/enrolments/event/${encodeURIComponent(eventId)}`);
    target.innerHTML = `<section class="panel"><div class="panel-header"><h2>Participant entries</h2><span class="small-muted">${Array.isArray(rows)?rows.length:0} records</span></div>${Array.isArray(rows)&&rows.length?`<div class="table-wrap"><table><thead><tr><th>Participant</th><th>Email</th><th>Category</th><th>Start-time slot</th><th>Entry date</th><th>Status</th><th>Payment</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${RD.esc(v(r,"participantName"))}</td><td>${RD.esc(v(r,"email"))}</td><td>${RD.esc(v(r,"category"))}</td><td>${RD.esc(v(r,"timeSlotStart")?String(v(r,"timeSlotStart")).slice(0,5):"General event time")}</td><td>${RD.esc(new Date(v(r,"enrolmentDate")).toLocaleDateString("en-ZA"))}</td><td>${safeStatus(v(r,"status"))}</td><td>${safeStatus(v(r,"paymentStatus"))}</td></tr>`).join("")}</tbody></table></div>`:empty("No entries for this event","Participant entries will appear here after registration.")}</section>`;
  }

  async function renderResults() {
    setHeader("ORGANISER WORKSPACE","Capture results","Add or update finish times and positions for event participants.");
    const events = await getEvents();
    content.innerHTML = `<section class="panel"><div class="form-grid"><div class="field"><label>Select event</label><select id="resultEventSelect">${events.map(e=>`<option value="${RD.esc(v(e,"eventID"))}">${RD.esc(v(e,"eventName"))}</option>`).join("")}</select></div><div class="field"><label>&nbsp;</label><button id="loadResultsButton" class="button button-primary" type="button">Load participants</button></div></div></section><div id="resultEditor"></div>`;
    if (events.length) await loadResultEditor(v(events[0],"eventID"));
  }

  async function loadResultEditor(eventId) {
    const target = document.getElementById("resultEditor");
    if (!target) return;
    const [entries,results] = await Promise.all([RD.api(`/api/enrolments/event/${encodeURIComponent(eventId)}`),RD.api(`/api/results/event/${encodeURIComponent(eventId)}`)]);
    const resultMap = new Map((Array.isArray(results)?results:[]).map(r=>[String(v(r,"enrolmentID")),r]));
    target.innerHTML = `<section class="panel"><div class="panel-header"><h2>Participant results</h2><span class="small-muted">${entries.length} entries</span></div>${entries.length?`<div class="table-wrap"><table><thead><tr><th>Participant</th><th>Category</th><th>Position</th><th>Finish time</th><th>Chip time</th><th>Pace</th><th></th></tr></thead><tbody>${entries.map(entry=>{const result=resultMap.get(String(v(entry,"enrolmentID")));return `<tr><td>${RD.esc(v(entry,"participantName"))}<small style="display:block;color:#7188a1">#${RD.esc(v(entry,"enrolmentID"))}</small></td><td>${RD.esc(v(entry,"category"))}</td><td><input class="result-input" type="number" min="1" name="position" value="${RD.esc(v(result,"position",""))}" data-entry="${RD.esc(v(entry,"enrolmentID"))}" style="width:65px"></td><td><input class="result-input" type="time" name="finishTime" value="${RD.esc(String(v(result,"finishTime","")).slice(0,5))}" data-entry="${RD.esc(v(entry,"enrolmentID"))}"></td><td><input class="result-input" type="time" name="chipTime" value="${RD.esc(String(v(result,"chipTime","")).slice(0,5))}" data-entry="${RD.esc(v(entry,"enrolmentID"))}"></td><td><input class="result-input" type="number" min="0.01" step="0.01" name="pace" value="${RD.esc(v(result,"pace",""))}" data-entry="${RD.esc(v(entry,"enrolmentID"))}" style="width:85px"></td><td><button class="mini-button" data-action="save-result" data-entry="${RD.esc(v(entry,"enrolmentID"))}" data-result="${RD.esc(v(result,"resultID",""))}">${result?"Update":"Save"}</button></td></tr>`;}).join("")}</tbody></table></div>`:empty("No participants yet","Entries will appear here once participants enter the event.")}</section><div class="notice">Results can only be saved on or after the event date. When position and finish time are left blank, this frontend marks the result as non-official.</div>`;
  }

  async function saveResult(button) {
    const enrolmentId = Number(button.dataset.entry);
    const row = button.closest("tr");
    const val = name => row.querySelector(`[name="${name}"]`)?.value || "";
    const position = val("position"), finishTime = val("finishTime"), chipTime = val("chipTime"), pace = val("pace");
    const payload = {
      enrolmentID: enrolmentId,
      position: position ? Number(position) : null,
      finishTime: finishTime ? `${finishTime}:00` : null,
      chipTime: chipTime ? `${chipTime}:00` : null,
      pace: pace ? Number(pace) : null,
      isOfficial: Boolean(position && finishTime)
    };
    const resultId = button.dataset.result;
    await RD.api(resultId ? `/api/results/${encodeURIComponent(resultId)}` : "/api/results", {
      method: resultId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    RD.toast(resultId ? "Result updated." : "Result saved.");
    await loadResultEditor(document.getElementById("resultEventSelect").value);
  }

  async function editEvent(id) {
    const event = await RD.api(`/api/events/${encodeURIComponent(id)}`);
    await renderEvents();
    const form = document.getElementById("eventForm");
    if (!form) return;
    form.elements.eventId.value = v(event,"eventID");
    form.elements.eventName.value = v(event,"eventName");
    form.elements.eventDate.value = String(v(event,"eventDate")).slice(0,10);
    form.elements.location.value = v(event,"location");
    form.elements.province.value = v(event,"province","Gauteng");
    form.elements.sportType.value = v(event,"sportType","Run");
    form.elements.eventKind.value = v(event,"eventKind","Race");
    form.elements.externalUrl.value = v(event,"externalUrl","");
    form.elements.distanceKm.value = v(event,"distanceKm");
    form.elements.startTime.value = String(v(event,"startTime","")).slice(0,5);
    form.elements.endTime.value = String(v(event,"endTime","")).slice(0,5);
    form.elements.status.value = v(event,"status","Open");
    form.elements.description.value = v(event,"description");
    document.getElementById("eventFormHeading").textContent = "Update event";
    form.querySelector('button[type="submit"]').textContent = "Update event";
    form.scrollIntoView({behavior:"smooth",block:"center"});
  }

  async function handleForm(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const formType = form.dataset.form;
    if (formType === "event") {
      const id = data.eventId;
      const payload = {eventName:data.eventName.trim(),description:data.description||null,eventDate:data.eventDate,location:data.location.trim(),province:data.province,sportType:data.sportType,eventKind:data.eventKind,externalUrl:data.externalUrl||null,distanceKm:Number(data.distanceKm),startTime:data.startTime?`${data.startTime}:00`:null,endTime:data.endTime?`${data.endTime}:00`:null,status:data.status};
      await RD.api(id?`/api/events/${encodeURIComponent(id)}`:"/api/events",{method:id?"PUT":"POST",body:JSON.stringify(payload)});
      RD.toast(id?"Event updated.":"Event published.");
      await renderEvents();
    } else if (formType === "participant-enrol") {
      const eventCategoryID = Number(data.eventCategoryID);
      const timeSlotID = data.timeSlotID ? Number(data.timeSlotID) : null;
      await RD.api("/api/enrolments",{method:"POST",body:JSON.stringify({eventCategoryID,timeSlotID})});
      RD.toast("Your event entry has been recorded.");
      currentView="entries";renderNav();await renderMyEntries();
    } else if (formType === "time-slot") {
      const eventId=data.eventId;
      await RD.api(`/api/events/${encodeURIComponent(eventId)}/time-slots`,{method:"POST",body:JSON.stringify({startTime:`${data.startTime}:00`,endTime:data.endTime?`${data.endTime}:00`:null,maxParticipants:Number(data.maxParticipants)})});
      RD.toast("Time slot added.");
      await renderEventDetails(eventId);
    } else if (formType === "category") {
      const id = data.categoryId;
      const payload = {categoryName:data.categoryName.trim(),categoryType:data.categoryType,description:data.description||null,isActive:data.isActive==="true"};
      await RD.api(id?`/api/categories/${encodeURIComponent(id)}`:"/api/categories",{method:id?"PUT":"POST",body:JSON.stringify(payload)});
      RD.toast(id?"Category updated.":"Category created.");
      await renderCategories();
    } else if (formType === "event-category") {
      const payload = {categoryID:Number(data.categoryId),entryFee:Number(data.entryFee),maxParticipants:Number(data.maxParticipants),distanceKm:data.distanceKm?Number(data.distanceKm):null};
      await RD.api(`/api/events/${encodeURIComponent(data.eventId)}/categories`,{method:"POST",body:JSON.stringify(payload)});
      RD.toast("Category linked to event.");
      await renderCategories();
    } else if (formType === "route") {
      const eventId = data.eventId;
      const details = await RD.api(`/api/events/${encodeURIComponent(eventId)}`);
      const hasRoute = Boolean(v(details,"routeInformation",null));
      const payload = {routeName:data.routeName.trim(),routeUrl:data.routeUrl||null,routeDescription:data.routeDescription||null};
      await RD.api(`/api/events/${encodeURIComponent(eventId)}/route`,{method:hasRoute?"PUT":"POST",body:JSON.stringify(payload)});
      RD.toast(hasRoute?"Route updated.":"Route created.");
      await renderEventDetails(eventId);
    }
  }

  async function handleClick(button) {
    const action = button.dataset.action, id = button.dataset.id;
    if (action === "details") { await renderEventDetails(id); return; }
    if (action === "edit-event") { await editEvent(id); return; }
    if (action === "delete-event") {
      if (!confirm("Delete this event? The API will prevent deletion when entries already exist.")) return;
      await RD.api(`/api/events/${encodeURIComponent(id)}`,{method:"DELETE"});
      RD.toast("Event deleted.");
      await renderEvents(); return;
    }
    if (action === "edit-category") {
      const categories = await RD.api("/api/categories");
      const item = categories.find(c=>String(v(c,"categoryID"))===String(id));
      if (!item) return;
      const form = document.getElementById("categoryForm");
      form.elements.categoryId.value = v(item,"categoryID");
      form.elements.categoryName.value = v(item,"categoryName");
      form.elements.categoryType.value = v(item,"categoryType");
      form.elements.description.value = v(item,"description","");
      form.elements.isActive.value = String(Boolean(v(item,"isActive")));
      form.scrollIntoView({behavior:"smooth",block:"center"});
      return;
    }
    if (action === "delete-category") {
      if (!confirm("Delete this category? Categories already assigned to events cannot be deleted.")) return;
      await RD.api(`/api/categories/${encodeURIComponent(id)}`,{method:"DELETE"});
      RD.toast("Category deleted.");
      await renderCategories(); return;
    }
    if (action === "delete-time-slot") {
      if (!confirm("Remove this start-time slot? Slots with participant entries cannot be removed.")) return;
      await RD.api(`/api/events/${encodeURIComponent(id)}/time-slots/${encodeURIComponent(button.dataset.slot)}`,{method:"DELETE"});
      RD.toast("Time slot removed.");
      await renderEventDetails(id); return;
    }
    if (action === "delete-route") {
      if (!confirm("Remove the route information for this event?")) return;
      await RD.api(`/api/events/${encodeURIComponent(id)}/route`,{method:"DELETE"});
      RD.toast("Route information removed.");
      await renderEventDetails(id); return;
    }
    if (action === "save-result") { await saveResult(button); return; }
  }

  async function render(view) {
    currentView = view || "dashboard";
    renderNav();
    content.innerHTML = `<div class="loading-card glass-panel">Loading…</div>`;
    try {
      if (currentView === "dashboard") await renderDashboard();
      else if (currentView === "events") await renderEvents();
      else if (currentView === "entries") await renderEntries();
      else if (currentView === "my-results") await renderMyResults();
      else if (currentView === "categories" && isOrganiser) await renderCategories();
      else if (currentView === "results" && isOrganiser) await renderResults();
      else await renderDashboard();
    } catch (error) {
      content.innerHTML = `<div class="panel notice error">${RD.esc(error.message)}</div>`;
    }
  }

  nav.addEventListener("click", event => {
    const button = event.target.closest("[data-view]");
    if (button) render(button.dataset.view);
  });
  content.addEventListener("click", async event => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) { render(viewButton.dataset.view); return; }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    try { await handleClick(button); }
    catch (error) { RD.toast(error.message,true); }
  });
  content.addEventListener("submit", async event => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    try { await handleForm(form); }
    catch (error) { RD.toast(error.message,true); }
  });
  content.addEventListener("click", async event => {
    if (event.target.id === "loadEntriesButton") {
      try { await loadEventEntries(document.getElementById("entryEventSelect").value); }
      catch (error) { RD.toast(error.message,true); }
    }
    if (event.target.id === "loadResultsButton") {
      try { await loadResultEditor(document.getElementById("resultEventSelect").value); }
      catch (error) { RD.toast(error.message,true); }
    }
  });

  const params = new URLSearchParams(location.search);
  const deepEvent = params.get("event");
  if (deepEvent) {
    currentView = "events";
    renderEvents().then(() => renderEventDetails(deepEvent)).catch(err => RD.toast(err.message,true));
  } else {
    render("dashboard");
  }
})();