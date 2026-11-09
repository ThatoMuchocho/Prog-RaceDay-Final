using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaceDay.Api.Data;
using RaceDay.Api.DTOs;
using RaceDay.Api.Models;
namespace RaceDay.Api.Controllers;
[ApiController,Route("api/events/{eventId:int}/time-slots")]
public class EventTimeSlotsController(RaceDayDbContext db):ControllerBase {
 [HttpGet,AllowAnonymous] public async Task<IActionResult> Get(int eventId) {
  if(!await db.Events.AnyAsync(e=>e.EventID==eventId))return NotFound();
  return Ok(await db.EventTimeSlots.AsNoTracking().Where(x=>x.EventID==eventId).OrderBy(x=>x.StartTime).Select(x=>new{x.TimeSlotID,x.EventID,x.StartTime,x.EndTime,x.MaxParticipants,Booked=x.Enrolments.Count(e=>e.Status!="Cancelled"),Available=x.MaxParticipants-x.Enrolments.Count(e=>e.Status!="Cancelled")}).ToListAsync());
 }
 [HttpPost,Authorize(Roles="Organiser")] public async Task<IActionResult> Create(int eventId,EventTimeSlotRequest r) {
  if(r.MaxParticipants<1)return BadRequest(new{message="Capacity must be at least one."});
  if(r.EndTime.HasValue&&r.EndTime.Value<=r.StartTime)return BadRequest(new{message="End time must be later than start time."});
  if(!await db.Events.AnyAsync(e=>e.EventID==eventId))return NotFound();
  if(await db.EventTimeSlots.AnyAsync(x=>x.EventID==eventId&&x.StartTime==r.StartTime))return Conflict(new{message="A time slot already starts at this time."});
  var slot=new EventTimeSlot{EventID=eventId,StartTime=r.StartTime,EndTime=r.EndTime,MaxParticipants=r.MaxParticipants};db.EventTimeSlots.Add(slot);await db.SaveChangesAsync();return Ok(slot);
 }
 [HttpDelete("{timeSlotId:int}"),Authorize(Roles="Organiser")] public async Task<IActionResult> Delete(int eventId,int timeSlotId) {
  var slot=await db.EventTimeSlots.SingleOrDefaultAsync(x=>x.EventID==eventId&&x.TimeSlotID==timeSlotId);if(slot is null)return NotFound();
  if(await db.Enrolments.AnyAsync(x=>x.TimeSlotID==timeSlotId))return Conflict(new{message="This time slot has participant entries and cannot be removed."});
  db.EventTimeSlots.Remove(slot);await db.SaveChangesAsync();return NoContent();
 }
}
