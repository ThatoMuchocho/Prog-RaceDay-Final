using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaceDay.Api.Data;
using RaceDay.Api.DTOs;
using RaceDay.Api.Models;
namespace RaceDay.Api.Controllers;
[ApiController,Route("api/events/{eventId:int}/route"),Authorize]
public class RouteInformationController(RaceDayDbContext db):ControllerBase {
 [HttpGet] public async Task<IActionResult> Get(int eventId) {var x=await db.RouteInformation.AsNoTracking().SingleOrDefaultAsync(x=>x.EventID==eventId);return x is null?NotFound():Ok(x);}
 [HttpPost,Authorize(Roles="Organiser")] public async Task<IActionResult> Create(int eventId,RouteRequest r) {
  if(!await db.Events.AnyAsync(x=>x.EventID==eventId))return NotFound();if(await db.RouteInformation.AnyAsync(x=>x.EventID==eventId))return Conflict(new{message="Route already exists."});
  var x=new RouteInformation{EventID=eventId,RouteName=r.RouteName.Trim(),RouteUrl=r.RouteUrl,RouteDescription=r.RouteDescription};db.RouteInformation.Add(x);await db.SaveChangesAsync();return Ok(x);
 }
 [HttpPut,Authorize(Roles="Organiser")] public async Task<IActionResult> Update(int eventId,RouteRequest r) {
  var x=await db.RouteInformation.SingleOrDefaultAsync(x=>x.EventID==eventId);if(x is null)return NotFound();x.RouteName=r.RouteName.Trim();x.RouteUrl=r.RouteUrl;x.RouteDescription=r.RouteDescription;await db.SaveChangesAsync();return NoContent();
 }
 [HttpDelete,Authorize(Roles="Organiser")] public async Task<IActionResult> Delete(int eventId) {var x=await db.RouteInformation.SingleOrDefaultAsync(x=>x.EventID==eventId);if(x is null)return NotFound();db.RouteInformation.Remove(x);await db.SaveChangesAsync();return NoContent();}
}