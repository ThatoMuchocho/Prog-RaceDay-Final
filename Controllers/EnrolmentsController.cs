using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaceDay.Api.Data;
using RaceDay.Api.DTOs;
using RaceDay.Api.Models;
namespace RaceDay.Api.Controllers;
[ApiController,Route("api/enrolments"),Authorize]
public class EnrolmentsController(RaceDayDbContext db):ControllerBase {
 [HttpPost,Authorize(Roles="Participant")] public async Task<IActionResult> Create(EnrolmentRequest r) {
  var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
  var ec=await db.EventCategories.Include(x=>x.Event).SingleOrDefaultAsync(x=>x.EventCategoryID==r.EventCategoryID);
  if(ec is null)return NotFound(new{message="Event category not found."});
  if(ec.Event!.EventDate<DateOnly.FromDateTime(DateTime.Today)||new[]{"Closed","Completed","Cancelled"}.Contains(ec.Event.Status))return BadRequest(new{message="Event is not accepting entries."});
  if(await db.Enrolments.AnyAsync(x=>x.ParticipantID==uid&&x.EventCategoryID==r.EventCategoryID))return Conflict(new{message="Already entered."});
  if(await db.Enrolments.CountAsync(x=>x.EventCategoryID==r.EventCategoryID&&x.Status!="Cancelled")>=ec.MaxParticipants)return Conflict(new{message="Event category is full."});
  var slots=await db.EventTimeSlots.CountAsync(x=>x.EventID==ec.EventID);
  if(slots>0&&r.TimeSlotID is null)return BadRequest(new{message="Please choose an available start-time slot."});
  if(r.TimeSlotID.HasValue) {
   var slot=await db.EventTimeSlots.SingleOrDefaultAsync(x=>x.TimeSlotID==r.TimeSlotID.Value&&x.EventID==ec.EventID);
   if(slot is null)return BadRequest(new{message="That time slot does not belong to this event."});
   if(await db.Enrolments.CountAsync(x=>x.TimeSlotID==slot.TimeSlotID&&x.Status!="Cancelled")>=slot.MaxParticipants)return Conflict(new{message="That time slot is full. Choose another time."});
  }
  var e=new Enrolment{ParticipantID=uid,EventCategoryID=r.EventCategoryID,TimeSlotID=r.TimeSlotID};db.Enrolments.Add(e);await db.SaveChangesAsync();return Ok(e);
 }
 [HttpGet("my"),Authorize(Roles="Participant")] public async Task<IActionResult> Mine() {
  var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
  return Ok(await db.Enrolments.AsNoTracking().Where(x=>x.ParticipantID==uid).Include(x=>x.EventCategory).ThenInclude(x=>x!.Event).Include(x=>x.EventCategory).ThenInclude(x=>x!.Category)
   .Select(x=>new{x.EnrolmentID,x.EnrolmentDate,x.Status,x.PaymentStatus,EventName=x.EventCategory!.Event!.EventName,EventDate=x.EventCategory.Event!.EventDate,Province=x.EventCategory.Event!.Province,SportType=x.EventCategory.Event!.SportType,Category=x.EventCategory.Category!.CategoryName,DistanceKm=x.EventCategory.DistanceKm??x.EventCategory.Event.DistanceKm,TimeSlotStart=x.TimeSlot!=null?x.TimeSlot.StartTime:(TimeOnly?)null,TimeSlotEnd=x.TimeSlot!=null?x.TimeSlot.EndTime:(TimeOnly?)null}).ToListAsync());
 }
 [HttpGet("event/{eventId:int}"),Authorize(Roles="Organiser")] public async Task<IActionResult> ForEvent(int eventId) {
  if(!await db.Events.AnyAsync(x=>x.EventID==eventId))return NotFound();
  return Ok(await db.Enrolments.AsNoTracking().Where(x=>x.EventCategory!.EventID==eventId).Include(x=>x.Participant).Include(x=>x.EventCategory).ThenInclude(x=>x!.Category)
   .Select(x=>new{x.EnrolmentID,ParticipantName=x.Participant!.FirstName+" "+x.Participant.LastName,x.Participant.Email,Category=x.EventCategory!.Category!.CategoryName,x.Status,x.PaymentStatus,x.EnrolmentDate,TimeSlotStart=x.TimeSlot!=null?x.TimeSlot.StartTime:(TimeOnly?)null,TimeSlotEnd=x.TimeSlot!=null?x.TimeSlot.EndTime:(TimeOnly?)null}).ToListAsync());
 }
}