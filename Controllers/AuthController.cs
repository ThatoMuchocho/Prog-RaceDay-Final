using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RaceDay.Api.Data;
using RaceDay.Api.DTOs;
using RaceDay.Api.Models;
namespace RaceDay.Api.Controllers;
[ApiController,Route("api/auth")]
public class AuthController(RaceDayDbContext db,IConfiguration config):ControllerBase {
 [HttpPost("register")] public async Task<IActionResult> Register(RegisterRequest r) {
  var email=r.Email.Trim().ToLowerInvariant();
  if(await db.Users.AnyAsync(x=>x.Email==email)) return Conflict(new{message="Email already registered."});
  var role=await db.Roles.SingleOrDefaultAsync(x=>x.RoleName=="Participant");
  if(role is null) return Problem("Participant role is missing.");
  var user=new User{FirstName=r.FirstName.Trim(),LastName=r.LastName.Trim(),Email=email,PasswordHash=BCrypt.Net.BCrypt.HashPassword(r.Password),RoleID=role.RoleID,Role=role};
  db.Users.Add(user); await db.SaveChangesAsync(); return Ok(Respond(user));
 }
 [HttpPost("login")] public async Task<IActionResult> Login(LoginRequest r) {
  var user=await db.Users.Include(x=>x.Role).SingleOrDefaultAsync(x=>x.Email==r.Email.Trim().ToLowerInvariant()&&x.IsActive);
  if(user is null||!BCrypt.Net.BCrypt.Verify(r.Password,user.PasswordHash)) return Unauthorized(new{message="Invalid email or password."});
  return Ok(Respond(user));
 }
 private AuthResponse Respond(User u) {
  var role=u.Role?.RoleName??"Participant";
  var claims=new[]{new Claim(ClaimTypes.NameIdentifier,u.UserID.ToString()),new Claim(ClaimTypes.Name,u.Email),new Claim(ClaimTypes.Role,role)};
  var key=new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
  var token=new JwtSecurityToken(config["Jwt:Issuer"],config["Jwt:Audience"],claims,expires:DateTime.UtcNow.AddHours(2),signingCredentials:new SigningCredentials(key,SecurityAlgorithms.HmacSha256));
  return new AuthResponse(u.UserID,u.FirstName,u.LastName,u.Email,role,new JwtSecurityTokenHandler().WriteToken(token));
 }
}