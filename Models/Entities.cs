namespace RaceDay.Api.Models;

public class Role { public int RoleID { get; set; } public string RoleName { get; set; } = ""; public string? Description { get; set; } }
public class User {
 public int UserID { get; set; } public string FirstName { get; set; } = ""; public string LastName { get; set; } = "";
 public string Email { get; set; } = ""; public string PasswordHash { get; set; } = ""; public int RoleID { get; set; }
 public Role? Role { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; public bool IsActive { get; set; } = true;
 public ICollection<Enrolment> Enrolments { get; set; } = new List<Enrolment>();
}
public class Event {
 public int EventID { get; set; } public string EventName { get; set; } = ""; public string? Description { get; set; }
 public DateOnly EventDate { get; set; } public string Location { get; set; } = ""; public string Province { get; set; } = "";
 public string SportType { get; set; } = "Run"; public string EventKind { get; set; } = "Race"; public string? ExternalUrl { get; set; } public decimal DistanceKm { get; set; }
 public TimeOnly? StartTime { get; set; } public TimeOnly? EndTime { get; set; } public string Status { get; set; } = "Upcoming";
 public int CreatedBy { get; set; } public User? Organiser { get; set; } public DateTime DateCreated { get; set; } = DateTime.UtcNow;
 public ICollection<EventCategory> EventCategories { get; set; } = new List<EventCategory>(); public ICollection<EventTimeSlot> TimeSlots { get; set; } = new List<EventTimeSlot>(); public RouteInformation? RouteInformation { get; set; }
}
public class Category {
 public int CategoryID { get; set; } public string CategoryName { get; set; } = ""; public string CategoryType { get; set; } = "Run";
 public string? Description { get; set; } public bool IsActive { get; set; } = true;
 public ICollection<EventCategory> EventCategories { get; set; } = new List<EventCategory>();
}
public class EventCategory {
 public int EventCategoryID { get; set; } public int EventID { get; set; } public Event? Event { get; set; }
 public int CategoryID { get; set; } public Category? Category { get; set; } public decimal EntryFee { get; set; }
 public int MaxParticipants { get; set; } public decimal? DistanceKm { get; set; } public ICollection<Enrolment> Enrolments { get; set; } = new List<Enrolment>();
}
public class Enrolment {
 public int EnrolmentID { get; set; } public int ParticipantID { get; set; } public User? Participant { get; set; }
 public int? TimeSlotID { get; set; } public EventTimeSlot? TimeSlot { get; set; }
 public int EventCategoryID { get; set; } public EventCategory? EventCategory { get; set; }
 public DateTime EnrolmentDate { get; set; } = DateTime.UtcNow; public string Status { get; set; } = "Confirmed";
 public string PaymentStatus { get; set; } = "Pending"; public Result? Result { get; set; }
}
public class Result {
 public int ResultID { get; set; } public int EnrolmentID { get; set; } public Enrolment? Enrolment { get; set; }
 public int? Position { get; set; } public TimeOnly? FinishTime { get; set; } public TimeOnly? ChipTime { get; set; }
 public decimal? Pace { get; set; } public bool IsOfficial { get; set; } = true; public DateTime DateCaptured { get; set; } = DateTime.UtcNow;
}

public class EventTimeSlot {
 public int TimeSlotID { get; set; } public int EventID { get; set; } public Event? Event { get; set; }
 public TimeOnly StartTime { get; set; } public TimeOnly? EndTime { get; set; } public int MaxParticipants { get; set; } = 100;
 public ICollection<Enrolment> Enrolments { get; set; } = new List<Enrolment>();
}
public class RouteInformation {
 public int RouteID { get; set; } public int EventID { get; set; } public Event? Event { get; set; }
 public string RouteName { get; set; } = ""; public string? RouteUrl { get; set; } public string? RouteDescription { get; set; }
}