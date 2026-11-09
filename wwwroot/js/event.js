(() => {
  "use strict";
  const RD = window.RaceDay;
  const target = document.getElementById("publicEventDetails");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  function v(obj,key,fallback=""){const x=RD.read(obj,key);return x===undefined||x===null?fallback:x;}
  function safeUrl(value){try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)?u.href:null;}catch{return null;}}
  function fmtTime(value){return value?String(value).slice(0,5):"Time TBC";}
  async function load(){
    if(!id||!/^[0-9]+$/.test(id)){target.innerHTML="<div class='panel empty-state'><strong>Event not found</strong>The event link is missing or invalid.</div>";return;}
    try{
      const e=await RD.api(`/api/events/${encodeURIComponent(id)}`);
      const categories=Array.isArray(v(e,"eventCategories",[]))?v(e,"eventCategories",[]):[];
      const slots=Array.isArray(v(e,"timeSlots",[]))?v(e,"timeSlots",[]):[];
      const route=v(e,"routeInformation",null);
      const session=RD.getSession();
      const returnTo=`/portal.html?event=${encodeURIComponent(id)}`;
      const signInUrl=`/login.html?returnTo=${encodeURIComponent(returnTo)}`;
      const categoryRows=categories.length?categories.map(ec=>{
        const c=v(ec,"category",{});
        return `<article class="public-category glass-panel"><div><span class="eyebrow">${RD.esc(v(c,"categoryType","EVENT CATEGORY"))}</span><h3>${RD.esc(v(c,"categoryName","Category"))}</h3><p>${RD.esc(v(ec,"distanceKm",v(e,"distanceKm")))} km · Maximum ${RD.esc(v(ec,"maxParticipants","—"))} participants</p></div><strong>${RD.esc(RD.money(v(ec,"entryFee",0)))}</strong></article>`;
      }).join(""):`<div class="panel empty-state">No categories are linked to this event yet.</div>`;
      const slotRows=slots.length?slots.map(slot=>{
        const available=Number(v(slot,"available",0));
        return `<div class="category-row"><div><strong>${RD.esc(fmtTime(v(slot,"startTime")))}${v(slot,"endTime")?" – "+RD.esc(fmtTime(v(slot,"endTime"))):""}</strong><small>${RD.esc(v(slot,"booked",0))} booked of ${RD.esc(v(slot,"maxParticipants",0))}</small></div><span class="status-pill ${available>0?"":"closed"}">${available} places available</span></div>`;
      }).join(""):`<p class="small-muted">No separate booking slots published. General start time: ${RD.esc(fmtTime(v(e,"startTime")))}${v(e,"endTime")?" – "+RD.esc(fmtTime(v(e,"endTime"))):""}.</p>`;
      const routeUrl=safeUrl(v(route,"routeUrl"));
      const externalUrl=safeUrl(v(e,"externalUrl"));
      const accepting=!["closed","completed","cancelled"].includes(String(v(e,"status")).toLowerCase());
      target.innerHTML=`<section class="public-event-hero"><div class="event-card-banner"><span class="event-type">${RD.esc(v(e,"eventKind","Race"))}</span><span class="public-event-number">RD / ${RD.esc(v(e,"eventID",id))}</span></div><div class="public-event-copy"><span class="eyebrow">${RD.esc(v(e,"province","SOUTH AFRICA"))} · ${RD.esc(v(e,"sportType","EVENT"))}</span><h1>${RD.esc(v(e,"eventName","RaceDay event"))}</h1><div class="event-meta"><span>◷ ${RD.esc(RD.formatDate(v(e,"eventDate")))}</span><span>⌖ ${RD.esc(v(e,"location","Location TBC"))}</span><span>↗ ${RD.esc(v(e,"distanceKm","—"))} km</span><span>◴ ${RD.esc(fmtTime(v(e,"startTime")))}</span></div><p>${RD.esc(v(e,"description","No description has been added yet."))}</p><div class="hero-actions"><a class="button button-primary" href="${session?`portal.html?event=${encodeURIComponent(id)}`:signInUrl}">${session?"Open in My RaceDay":accepting?"Sign in to choose a slot":"View event details"} →</a>${externalUrl?`<a class="button button-glass" href="${RD.esc(externalUrl)}" target="_blank" rel="noopener noreferrer">Official organiser link ↗</a>`:""}<a class="button button-glass" href="index.html#events">Browse other events</a></div></div></section><section class="public-event-lower"><div><div class="section-heading"><div><span class="eyebrow">CHOOSE YOUR CHALLENGE</span><h2>Available categories</h2></div></div><div class="public-category-list">${categoryRows}</div><div class="panel"><div class="panel-header"><h2>Start-time slots</h2><span class="small-muted">Availability updates from RaceDay</span></div>${slotRows}</div></div><aside class="panel route-card"><h2>Route information</h2>${route?`<strong>${RD.esc(v(route,"routeName"))}</strong><p>${RD.esc(v(route,"routeDescription","No route description available."))}</p>${routeUrl?`<a href="${RD.esc(routeUrl)}" target="_blank" rel="noopener noreferrer">Open route map ↗</a>`:""}`:"<p>Route information has not been added yet.</p>"}</aside></section>`;
    }catch(error){target.innerHTML=`<div class="panel empty-state"><strong>Unable to load this event</strong>${RD.esc(error.message)}</div>`;}
  }
  load();
})();
