using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaceDay.Api.Data;
using RaceDay.Api.DTOs;
using RaceDay.Api.Models;
namespace RaceDay.Api.Controllers;
[ApiController,Route("api/events")]
public class EventsController(RaceDayDbContext db):ControllerBase {
 [HttpGet,AllowAnonymous]
 public async Task<IActionResult> Get([FromQuery]string? province,[FromQuery]string? sportType,[FromQuery]string? eventKind,[FromQuery]DateOnly? dateFrom,[FromQuery]DateOnly? dateTo,[FromQuery]decimal? minDistance,[FromQuery]decimal? maxDistance,[FromQuery]string? location) {
  var q=db.Events.AsNoTracking().AsQueryable();
  if(!string.IsNullOrWhiteSpace(province)&&!province.Equals("All",StringComparison.OrdinalIgnoreCase))q=q.Where(x=>x.Province==province);
  if(!string.IsNullOrWhiteSpace(sportType)&&!sportType.Equals("All",StringComparison.OrdinalIgnoreCase))q=q.Where(x=>x.SportType==sportType);
  if(!string.IsNullOrWhiteSpace(eventKind)&&!eventKind.Equals("All",StringComparison.OrdinalIgnoreCase))q=q.Where(x=>x.EventKind==eventKind);
  if(dateFrom.HasValue)q=q.Where(x=>x.EventDate>=dateFrom.Value);
  if(dateTo.HasValue)q=q.Where(x=>x.EventDate<=dateTo.Value);
  if(minDistance.HasValue)q=q.Where(x=>x.DistanceKm>=minDistance.Value);
  if(maxDistance.HasValue)q=q.Where(x=>x.DistanceKm<=maxDistance.Value);
  if(!string.IsNullOrWhiteSpace(location))q=q.Where(x=>x.Location.Contains(location.Trim()));
  return Ok(await q.OrderBy(x=>x.EventDate).Select(x=>new {
   x.EventID,x.EventName,x.Description,x.EventDate,x.Location,x.Province,x.SportType,x.EventKind,x.ExternalUrl,
   x.DistanceKm,x.StartTime,x.EndTime,x.Status,
   AvailableTimeSlots=x.TimeSlots.Count(t=>t.MaxParticipants>t.Enrolments.Count(e=>e.Status!="Cancelled")),
   TimeSlots=x.TimeSlots.OrderBy(t=>t.StartTime).Select(t=>new {t.StartTime,t.EndTime,t.MaxParticipants,Booked=t.Enrolments.Count(e=>e.Status!="Cancelled"),Available=t.MaxParticipants-t.Enrolments.Count(e=>e.Status!="Cancelled")}),
   EventCategories=x.EventCategories.Select(ec=>new{ec.EventCategoryID,ec.CategoryID,CategoryName=ec.Category!.CategoryName,CategoryType=ec.Category.CategoryType,ec.DistanceKm,ec.EntryFee,ec.MaxParticipants})
  }).ToListAsync());
 }
 [HttpGet("{id:int}"),AllowAnonymous] public async Task<IActionResult> GetOne(int id) {
  var e=await db.Events.AsNoTracking().Include(x=>x.EventCategories).ThenInclude(x=>x.Category).Include(x=>x.RouteInformation).Include(x=>x.TimeSlots).ThenInclude(t=>t.Enrolments).SingleOrDefaultAsync(x=>x.EventID==id);
  if(e is null)return NotFound();
  return Ok(new {e.EventID,e.EventName,e.Description,e.EventDate,e.Location,e.Province,e.SportType,e.EventKind,e.ExternalUrl,e.DistanceKm,e.StartTime,e.EndTime,e.Status,e.CreatedBy,e.DateCreated,
   EventCategories=e.EventCategories.Select(ec=>new {ec.EventCategoryID,ec.EventID,ec.CategoryID,ec.EntryFee,ec.MaxParticipants,ec.DistanceKm,Category=ec.Category is null?null:new {ec.Category.CategoryID,ec.Category.CategoryName,ec.Category.CategoryType,ec.Category.Description,ec.Category.IsActive}}),
   TimeSlots=e.TimeSlots.OrderBy(t=>t.StartTime).Select(t=>new{t.TimeSlotID,t.EventID,t.StartTime,t.EndTime,t.MaxParticipants,Booked=t.Enrolments.Count(e=>e.Status!="Cancelled"),Available=t.MaxParticipants-t.Enrolments.Count(e=>e.Status!="Cancelled")}),
   RouteInformation=e.RouteInformation is null?null:new {e.RouteInformation.RouteID,e.RouteInformation.EventID,e.RouteInformation.RouteName,e.RouteInformation.RouteUrl,e.RouteInformation.RouteDescription}});
 }
 [HttpPost,Authorize(Roles="Organiser")] public async Task<IActionResult> Create(EventRequest r) {
  if(!ValidStatus(r.Status)||!ValidSport(r.SportType)||!ValidKind(r.EventKind)||!ValidProvince(r.Province))return BadRequest(new{message="Check the selected province, activity and event type."});
  if(r.EventDate<DateOnly.FromDateTime(DateTime.Today))return BadRequest(new{message="Event date cannot be in the past."});
  if(r.StartTime.HasValue&&r.EndTime.HasValue&&r.EndTime.Value<=r.StartTime.Value)return BadRequest(new{message="Event end time must be later than the start time."});
  var e=new Event{EventName=r.EventName.Trim(),Description=r.Description,EventDate=r.EventDate,Location=r.Location.Trim(),Province=r.Province,SportType=r.SportType,EventKind=r.EventKind,ExternalUrl=r.ExternalUrl,DistanceKm=r.DistanceKm,StartTime=r.StartTime,EndTime=r.EndTime,Status=r.Status,CreatedBy=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)};
  db.Events.Add(e);await db.SaveChangesAsync();return CreatedAtAction(nameof(GetOne),new{id=e.EventID},e);
 }
 [HttpPut("{id:int}"),Authorize(Roles="Organiser")] public async Task<IActionResult> Update(int id,EventRequest r) {
  var e=await db.Events.FindAsync(id);if(e is null)return NotFound();if(r.StartTime.HasValue&&r.EndTime.HasValue&&r.EndTime.Value<=r.StartTime.Value)return BadRequest(new{message="Event end time must be later than the start time."});if(!ValidStatus(r.Status)||!ValidSport(r.SportType)||!ValidKind(r.EventKind)||!ValidProvince(r.Province))return BadRequest(new{message="Check the selected province, activity and event type."});
  e.EventName=r.EventName.Trim();e.Description=r.Description;e.EventDate=r.EventDate;e.Location=r.Location.Trim();e.Province=r.Province;e.SportType=r.SportType;e.EventKind=r.EventKind;e.ExternalUrl=r.ExternalUrl;e.DistanceKm=r.DistanceKm;e.StartTime=r.StartTime;e.EndTime=r.EndTime;e.Status=r.Status;await db.SaveChangesAsync();return NoContent();
 }
 [HttpDelete("{id:int}"),Authorize(Roles="Organiser")] public async Task<IActionResult> Delete(int id) {
  var e=await db.Events.FindAsync(id);if(e is null)return NotFound();
  if(await db.Enrolments.AnyAsync(x=>x.EventCategory!.EventID==id))return Conflict(new{message="Cannot delete an event with enrolments."});
  db.Events.Remove(e);await db.SaveChangesAsync();return NoContent();
 }
 private static bool ValidStatus(string s)=>new[]{"Upcoming","Open","Closed","Completed","Cancelled"}.Contains(s,StringComparer.OrdinalIgnoreCase);
 private static bool ValidSport(string s)=>new[]{"Run","Walk","Cycle","Trail Running","Mountain Biking","Triathlon","Swimming","Multisport","Community"}.Contains(s,StringComparer.OrdinalIgnoreCase);
 private static bool ValidKind(string s)=>new[]{"Race","Awareness","Charity","Community","Training","Special"}.Contains(s,StringComparer.OrdinalIgnoreCase);
 private static bool ValidProvince(string s)=>new[]{"Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","North West","Northern Cape","Western Cape"}.Contains(s,StringComparer.OrdinalIgnoreCase);
}
