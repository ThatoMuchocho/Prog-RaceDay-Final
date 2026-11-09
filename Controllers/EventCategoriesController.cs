using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaceDay.Api.Data;
using RaceDay.Api.DTOs;
using RaceDay.Api.Models;
namespace RaceDay.Api.Controllers;
[ApiController,Route("api/events/{eventId:int}/categories"),Authorize(Roles="Organiser")]
public class EventCategoriesController(RaceDayDbContext db):ControllerBase {
 [HttpPost] public async Task<IActionResult> Add(int eventId,EventCategoryRequest r) {
  if(!await db.Events.AnyAsync(x=>x.EventID==eventId))return NotFound();
  if(!await db.Categories.AnyAsync(x=>x.CategoryID==r.CategoryID&&x.IsActive))return BadRequest(new{message="Active category not found."});
  if(await db.EventCategories.AnyAsync(x=>x.EventID==eventId&&x.CategoryID==r.CategoryID))return Conflict(new{message="Category already added."});
  var x=new EventCategory{EventID=eventId,CategoryID=r.CategoryID,EntryFee=r.EntryFee,MaxParticipants=r.MaxParticipants,DistanceKm=r.DistanceKm};db.EventCategories.Add(x);await db.SaveChangesAsync();return Ok(x);
 }
 [HttpDelete("{categoryId:int}")] public async Task<IActionResult> Remove(int eventId,int categoryId) {
  var x=await db.EventCategories.SingleOrDefaultAsync(x=>x.EventID==eventId&&x.CategoryID==categoryId);if(x is null)return NotFound();
  if(await db.Enrolments.AnyAsync(e=>e.EventCategoryID==x.EventCategoryID))return Conflict(new{message="Cannot remove a category with enrolments."});
  db.EventCategories.Remove(x);await db.SaveChangesAsync();return NoContent();
 }
}