using Microsoft.EntityFrameworkCore;
using RaceDay.Api.Models;
namespace RaceDay.Api.Data;
public class RaceDayDbContext(DbContextOptions<RaceDayDbContext> options) : DbContext(options) {
 public DbSet<Role> Roles => Set<Role>(); public DbSet<User> Users => Set<User>(); public DbSet<Event> Events => Set<Event>();
 public DbSet<Category> Categories => Set<Category>(); public DbSet<EventCategory> EventCategories => Set<EventCategory>();
 public DbSet<Enrolment> Enrolments => Set<Enrolment>(); public DbSet<EventTimeSlot> EventTimeSlots => Set<EventTimeSlot>(); public DbSet<Result> Results => Set<Result>();
 public DbSet<RouteInformation> RouteInformation => Set<RouteInformation>();
 protected override void OnModelCreating(ModelBuilder b) {
  b.Entity<RouteInformation>().HasKey(x=>x.RouteID);
  b.Entity<EventTimeSlot>().HasIndex(x=>new{x.EventID,x.StartTime}).IsUnique();
  b.Entity<EventTimeSlot>().HasOne(x=>x.Event).WithMany(x=>x.TimeSlots).HasForeignKey(x=>x.EventID).OnDelete(DeleteBehavior.Cascade);
  b.Entity<Enrolment>().HasOne(x=>x.TimeSlot).WithMany(x=>x.Enrolments).HasForeignKey(x=>x.TimeSlotID).OnDelete(DeleteBehavior.Restrict);
  b.Entity<User>().HasIndex(x=>x.Email).IsUnique(); b.Entity<Role>().HasIndex(x=>x.RoleName).IsUnique();
  b.Entity<Category>().HasIndex(x=>x.CategoryName).IsUnique();
  b.Entity<EventCategory>().HasIndex(x=>new{x.EventID,x.CategoryID}).IsUnique();
  b.Entity<Enrolment>().HasIndex(x=>new{x.ParticipantID,x.EventCategoryID}).IsUnique();
  b.Entity<Result>().HasIndex(x=>x.EnrolmentID).IsUnique(); b.Entity<RouteInformation>().HasIndex(x=>x.EventID).IsUnique();
  b.Entity<Event>().HasOne(x=>x.Organiser).WithMany().HasForeignKey(x=>x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
  b.Entity<EventCategory>().HasOne(x=>x.Event).WithMany(x=>x.EventCategories).HasForeignKey(x=>x.EventID).OnDelete(DeleteBehavior.Cascade);
  b.Entity<EventCategory>().HasOne(x=>x.Category).WithMany(x=>x.EventCategories).HasForeignKey(x=>x.CategoryID).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Enrolment>().HasOne(x=>x.Participant).WithMany(x=>x.Enrolments).HasForeignKey(x=>x.ParticipantID).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Enrolment>().HasOne(x=>x.EventCategory).WithMany(x=>x.Enrolments).HasForeignKey(x=>x.EventCategoryID).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Result>().HasOne(x=>x.Enrolment).WithOne(x=>x.Result).HasForeignKey<Result>(x=>x.EnrolmentID).OnDelete(DeleteBehavior.Cascade);
  b.Entity<RouteInformation>().HasOne(x=>x.Event).WithOne(x=>x.RouteInformation).HasForeignKey<RouteInformation>(x=>x.EventID).OnDelete(DeleteBehavior.Cascade);
  b.Entity<Event>().Property(x=>x.DistanceKm).HasPrecision(8,2); b.Entity<EventCategory>().Property(x=>x.DistanceKm).HasPrecision(8,2); b.Entity<EventCategory>().Property(x=>x.EntryFee).HasPrecision(10,2);
  b.Entity<Result>().Property(x=>x.Pace).HasPrecision(8,2);
  b.Entity<Role>().HasData(new Role{RoleID=1,RoleName="Organiser",Description="Manages events and results."},new Role{RoleID=2,RoleName="Participant",Description="Enters events and views own results."});
 }
}