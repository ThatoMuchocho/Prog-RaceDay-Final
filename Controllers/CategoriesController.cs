using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaceDay.Api.Data;
using RaceDay.Api.DTOs;
using RaceDay.Api.Models;
namespace RaceDay.Api.Controllers;
[ApiController,Route("api/categories"),Authorize]
public class CategoriesController(RaceDayDbContext db):ControllerBase {
 [HttpGet] public async Task<IActionResult> Get()=>Ok(await db.Categories.AsNoTracking().OrderBy(x=>x.CategoryName).ToListAsync());
 [HttpPost,Authorize(Roles="Organiser")] public async Task<IActionResult> Create(CategoryRequest r) {
  if(!ValidType(r.CategoryType))return BadRequest(new{message="Choose a supported activity type."});
  if(await db.Categories.AnyAsync(x=>x.CategoryName==r.CategoryName.Trim()))return Conflict(new{message="Category already exists."});
  var c=new Category{CategoryName=r.CategoryName.Trim(),CategoryType=r.CategoryType,Description=r.Description,IsActive=r.IsActive};db.Categories.Add(c);await db.SaveChangesAsync();return Ok(c);
 }
 [HttpPut("{id:int}"),Authorize(Roles="Organiser")] public async Task<IActionResult> Update(int id,CategoryRequest r) {
  var c=await db.Categories.FindAsync(id);if(c is null)return NotFound();if(!ValidType(r.CategoryType))return BadRequest(new{message="Choose a supported activity type."});
  c.CategoryName=r.CategoryName.Trim();c.CategoryType=r.CategoryType;c.Description=r.Description;c.IsActive=r.IsActive;await db.SaveChangesAsync();return NoContent();
 }
 [HttpDelete("{id:int}"),Authorize(Roles="Organiser")] public async Task<IActionResult> Delete(int id) {
  var c=await db.Categories.FindAsync(id);if(c is null)return NotFound();if(await db.EventCategories.AnyAsync(x=>x.CategoryID==id))return Conflict(new{message="Category is assigned to an event."});
  db.Categories.Remove(c);await db.SaveChangesAsync();return NoContent();
 }
 private static bool ValidType(string s)=>new[]{"Run","Walk","Cycle","Trail Running","Mountain Biking","Triathlon","Swimming","Community"}.Contains(s,StringComparer.OrdinalIgnoreCase);
}