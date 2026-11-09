/* RaceDay National Event Discovery - SQL Server / SSMS
   IMPORTANT: This is a reset/setup script. It drops and recreates RaceDayDB tables.
   Run only on a new/test database. Existing RaceDay data will be deleted.
   No unverified external races are inserted as bookable records. Organisers add and verify
   their own events; the website also links to national/provincial event calendars.
*/
IF DB_ID('RaceDayDB') IS NULL CREATE DATABASE RaceDayDB;
GO
USE RaceDayDB;
GO
DROP TABLE IF EXISTS Results;
DROP TABLE IF EXISTS Enrolments;
DROP TABLE IF EXISTS EventTimeSlots;
DROP TABLE IF EXISTS EventCategories;
DROP TABLE IF EXISTS RouteInformation;
DROP TABLE IF EXISTS Events;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;
GO
CREATE TABLE Roles(
 RoleID INT IDENTITY(1,1) PRIMARY KEY,
 RoleName NVARCHAR(30) NOT NULL UNIQUE,
 Description NVARCHAR(255) NULL
);
GO
CREATE TABLE Users(
 UserID INT IDENTITY(1,1) PRIMARY KEY,
 FirstName NVARCHAR(50) NOT NULL,
 LastName NVARCHAR(50) NOT NULL,
 Email NVARCHAR(150) NOT NULL UNIQUE,
 PasswordHash NVARCHAR(255) NOT NULL,
 RoleID INT NOT NULL,
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 IsActive BIT NOT NULL DEFAULT 1,
 CONSTRAINT FK_Users_Roles FOREIGN KEY(RoleID) REFERENCES Roles(RoleID)
);
GO
CREATE TABLE Categories(
 CategoryID INT IDENTITY(1,1) PRIMARY KEY,
 CategoryName NVARCHAR(100) NOT NULL UNIQUE,
 CategoryType NVARCHAR(30) NOT NULL,
 Description NVARCHAR(500) NULL,
 IsActive BIT NOT NULL DEFAULT 1,
 CONSTRAINT CK_Categories_CategoryType CHECK(CategoryType IN
  ('Run','Walk','Cycle','Trail Running','Mountain Biking','Triathlon','Swimming','Community'))
);
GO
CREATE TABLE Events(
 EventID INT IDENTITY(1,1) PRIMARY KEY,
 EventName NVARCHAR(150) NOT NULL,
 Description NVARCHAR(1000) NULL,
 EventDate DATE NOT NULL,
 Location NVARCHAR(200) NOT NULL,
 Province NVARCHAR(40) NOT NULL,
 SportType NVARCHAR(30) NOT NULL,
 EventKind NVARCHAR(40) NOT NULL DEFAULT 'Race',
 ExternalUrl NVARCHAR(500) NULL,
 DistanceKm DECIMAL(8,2) NOT NULL,
 StartTime TIME(0) NULL,
 EndTime TIME(0) NULL,
 Status NVARCHAR(20) NOT NULL DEFAULT 'Upcoming',
 CreatedBy INT NOT NULL,
 DateCreated DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT CK_Events_Distance CHECK(DistanceKm>0),
 CONSTRAINT CK_Events_Status CHECK(Status IN('Upcoming','Open','Closed','Completed','Cancelled')),
 CONSTRAINT CK_Events_Province CHECK(Province IN('Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape')),
 CONSTRAINT CK_Events_SportType CHECK(SportType IN('Run','Walk','Cycle','Trail Running','Mountain Biking','Triathlon','Swimming','Multisport','Community')),
 CONSTRAINT CK_Events_EventKind CHECK(EventKind IN('Race','Awareness','Charity','Community','Training','Special')),
 CONSTRAINT FK_Events_CreatedBy FOREIGN KEY(CreatedBy) REFERENCES Users(UserID)
);
GO
CREATE INDEX IX_Events_Discovery ON Events(Province,SportType,EventKind,EventDate);
GO
CREATE TABLE EventTimeSlots(
 TimeSlotID INT IDENTITY(1,1) PRIMARY KEY,
 EventID INT NOT NULL,
 StartTime TIME(0) NOT NULL,
 EndTime TIME(0) NULL,
 MaxParticipants INT NOT NULL DEFAULT 100,
 CONSTRAINT CK_EventTimeSlots_Capacity CHECK(MaxParticipants>0),
 CONSTRAINT CK_EventTimeSlots_Time CHECK(EndTime IS NULL OR EndTime>StartTime),
 CONSTRAINT FK_EventTimeSlots_Event FOREIGN KEY(EventID) REFERENCES Events(EventID) ON DELETE CASCADE,
 CONSTRAINT UQ_EventTimeSlots_Event_Start UNIQUE(EventID,StartTime)
);
GO
CREATE TABLE EventCategories(
 EventCategoryID INT IDENTITY(1,1) PRIMARY KEY,
 EventID INT NOT NULL,
 CategoryID INT NOT NULL,
 EntryFee DECIMAL(10,2) NOT NULL DEFAULT 0,
 MaxParticipants INT NOT NULL,
 DistanceKm DECIMAL(8,2) NULL,
 CONSTRAINT CK_EventCategories_EntryFee CHECK(EntryFee>=0),
 CONSTRAINT CK_EventCategories_MaxParticipants CHECK(MaxParticipants>0),
 CONSTRAINT CK_EventCategories_Distance CHECK(DistanceKm IS NULL OR DistanceKm>0),
 CONSTRAINT FK_EventCategories_Event FOREIGN KEY(EventID) REFERENCES Events(EventID) ON DELETE CASCADE,
 CONSTRAINT FK_EventCategories_Category FOREIGN KEY(CategoryID) REFERENCES Categories(CategoryID),
 CONSTRAINT UQ_EventCategories_Event_Category UNIQUE(EventID,CategoryID)
);
GO
CREATE TABLE Enrolments(
 EnrolmentID INT IDENTITY(1,1) PRIMARY KEY,
 ParticipantID INT NOT NULL,
 EventCategoryID INT NOT NULL,
 TimeSlotID INT NULL,
 EnrolmentDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 Status NVARCHAR(20) NOT NULL DEFAULT 'Confirmed',
 PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending',
 CONSTRAINT CK_Enrolments_Status CHECK(Status IN('Pending','Confirmed','Cancelled')),
 CONSTRAINT CK_Enrolments_PaymentStatus CHECK(PaymentStatus IN('Pending','Paid','Failed','Refunded')),
 CONSTRAINT FK_Enrolments_Participant FOREIGN KEY(ParticipantID) REFERENCES Users(UserID),
 CONSTRAINT FK_Enrolments_EventCategory FOREIGN KEY(EventCategoryID) REFERENCES EventCategories(EventCategoryID),
 CONSTRAINT FK_Enrolments_TimeSlot FOREIGN KEY(TimeSlotID) REFERENCES EventTimeSlots(TimeSlotID),
 CONSTRAINT UQ_Enrolments_Participant_EventCategory UNIQUE(ParticipantID,EventCategoryID)
);
GO
CREATE TABLE Results(
 ResultID INT IDENTITY(1,1) PRIMARY KEY,
 EnrolmentID INT NOT NULL UNIQUE,
 Position INT NULL,
 FinishTime TIME(0) NULL,
 ChipTime TIME(0) NULL,
 Pace DECIMAL(8,2) NULL,
 IsOfficial BIT NOT NULL DEFAULT 1,
 DateCaptured DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT CK_Results_Position CHECK(Position IS NULL OR Position>0),
 CONSTRAINT CK_Results_Pace CHECK(Pace IS NULL OR Pace>0),
 CONSTRAINT FK_Results_Enrolment FOREIGN KEY(EnrolmentID) REFERENCES Enrolments(EnrolmentID) ON DELETE CASCADE
);
GO
CREATE TABLE RouteInformation(
 RouteID INT IDENTITY(1,1) PRIMARY KEY,
 EventID INT NOT NULL UNIQUE,
 RouteName NVARCHAR(150) NOT NULL,
 RouteUrl NVARCHAR(500) NULL,
 RouteDescription NVARCHAR(1000) NULL,
 CONSTRAINT FK_RouteInformation_Event FOREIGN KEY(EventID) REFERENCES Events(EventID) ON DELETE CASCADE
);
GO
INSERT INTO Roles(RoleName,Description) VALUES
 ('Organiser','Manages events, time slots, categories, enrolments and results.'),
 ('Participant','Browses events, chooses time slots, enters events and views results.');
GO
INSERT INTO Categories(CategoryName,CategoryType,Description) VALUES
 ('5 KM Fun Run','Run','Short distance running category.'),
 ('10 KM Run','Run','Ten kilometre road running category.'),
 ('21 KM Half Marathon','Run','Half marathon road running category.'),
 ('42 KM Marathon','Run','Full marathon road running category.'),
 ('4 KM Community Walk','Walk','Community and awareness walking category.'),
 ('GBV Awareness Walk','Walk','Walk category for events raising awareness and support against gender-based violence.'),
 ('GBV Awareness Run','Run','Run category for events raising awareness and support against gender-based violence.'),
 ('Charity Walk','Walk','Walking category for charity and fundraising campaigns.'),
 ('Cancer Awareness Run','Run','Run category for cancer awareness and fundraising campaigns.'),
 ('Environmental Clean-up Walk','Walk','Community walk linked to environmental awareness and clean-up activities.'),
 ('Family Fun Run','Run','Accessible fun-run category for family and community days.'),
 ('Youth Community Sports Day','Community','Multi-activity community sports day category.'),
 ('8 KM Awareness Run','Run','Awareness and fundraising run category.'),
 ('Trail Run','Trail Running','Off-road running category.'),
 ('Road Cycling','Cycle','Road cycling category.'),
 ('Mountain Bike','Mountain Biking','Off-road cycling category.'),
 ('Triathlon','Triathlon','Swim, cycle and run combined category.'),
 ('Swimming','Swimming','Open-water or pool swimming category.'),
 ('Community Fitness','Community','Community physical activity category.');
GO
SELECT * FROM Roles ORDER BY RoleID;
SELECT * FROM Categories ORDER BY CategoryID;
GO
