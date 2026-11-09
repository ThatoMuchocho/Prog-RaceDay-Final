using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaceDay.Api.Data;
using RaceDay.Api.DTOs;
using RaceDay.Api.Models;
namespace RaceDay.Api.Controllers;
[ApiController,Route("api/results"),Authorize]
public class ResultsController(RaceDayDbContext db):ControllerBase {
 [HttpPost,Authorize(Roles="Organiser")] public async Task<IActionResult> Create(ResultRequest r) {
  var enrol=await db.Enrolments.Include(x=>x.EventCategory).ThenInclude(x=>x!.Event).SingleOrDefaultAsync(x=>x.EnrolmentID==r.EnrolmentID);
  if(enrol is null)return NotFound(new{message="Enrolment not found."});
  if(enrol.EventCategory!.Event!.EventDate>DateOnly.FromDateTime(DateTime.Today))return BadRequest(new{message="Results can only be entered after the event date."});
  if(await db.Results.AnyAsync(x=>x.EnrolmentID==r.EnrolmentID))return Conflict(new{message="Result already exists."});
  var result=new Result{EnrolmentID=r.EnrolmentID,Position=r.Position,FinishTime=r.FinishTime,ChipTime=r.ChipTime,Pace=r.Pace,IsOfficial=r.IsOfficial};
  db.Results.Add(result);await db.SaveChangesAsync();return Ok(result);
 }
 [HttpPut("{id:int}"),Authorize(Roles="Organiser")] public async Task<IActionResult> Update(int id,ResultRequest r) {
  var result=await db.Results.FindAsync(id);if(result is null)return NotFound();if(result.EnrolmentID!=r.EnrolmentID)return BadRequest(new{message="Cannot change the enrolment linked to a result."});
  result.Position=r.Position;result.FinishTime=r.FinishTime;result.ChipTime=r.ChipTime;result.Pace=r.Pace;result.IsOfficial=r.IsOfficial;await db.SaveChangesAsync();return NoContent();
 }
 [HttpGet("my"),Authorize(Roles="Participant")] public async Task<IActionResult> Mine() {
  var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
  return Ok(await db.Results.AsNoTracking().Where(x=>x.Enrolment!.ParticipantID==uid).Include(x=>x.Enrolment).ThenInclude(x=>x!.EventCategory).ThenInclude(x=>x!.Event)
   .Select(x=>new{x.ResultID,x.Position,x.FinishTime,x.ChipTime,x.Pace,x.IsOfficial,EventName=x.Enrolment!.EventCategory!.Event!.EventName,EventDate=x.Enrolment.EventCategory.Event!.EventDate}).ToListAsync());
 }
 [HttpGet("event/{eventId:int}"),Authorize(Roles="Organiser")] public async Task<IActionResult> ForEvent(int eventId) =>
  Ok(await db.Results.AsNoTracking().Where(x=>x.Enrolment!.EventCategory!.EventID==eventId).Include(x=>x.Enrolment).ThenInclude(x=>x!.Participant)
   .Select(x=>new{x.ResultID,x.EnrolmentID,x.Position,x.FinishTime,x.ChipTime,x.Pace,x.IsOfficial,ParticipantName=x.Enrolment!.Participant!.FirstName+" "+x.Enrolment.Participant.LastName}).ToListAsync());
}