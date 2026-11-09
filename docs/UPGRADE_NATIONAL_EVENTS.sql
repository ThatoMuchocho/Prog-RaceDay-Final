/*
  Upgrade an EXISTING RaceDayDB to support national event discovery and event time slots.
  This is intended for an existing database created from the older Part 2 script.
  It preserves current users, events, categories, entries and results.

  Make a backup before running. Run in SSMS while connected to the correct SQL Server.
*/
USE RaceDayDB;
GO

-- Add location/activity/purpose/organiser URL columns to existing Events rows.
IF COL_LENGTH('dbo.Events','Province') IS NULL
    ALTER TABLE dbo.Events ADD Province NVARCHAR(40) NOT NULL CONSTRAINT DF_Events_Province DEFAULT 'Gauteng' WITH VALUES;
GO
IF COL_LENGTH('dbo.Events','SportType') IS NULL
    ALTER TABLE dbo.Events ADD SportType NVARCHAR(30) NOT NULL CONSTRAINT DF_Events_SportType DEFAULT 'Run' WITH VALUES;
GO
IF COL_LENGTH('dbo.Events','EventKind') IS NULL
    ALTER TABLE dbo.Events ADD EventKind NVARCHAR(40) NOT NULL CONSTRAINT DF_Events_EventKind DEFAULT 'Race' WITH VALUES;
GO
IF COL_LENGTH('dbo.Events','ExternalUrl') IS NULL
    ALTER TABLE dbo.Events ADD ExternalUrl NVARCHAR(500) NULL;
GO

-- Keep the valid values aligned with the API's dropdowns.
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name='CK_Events_Province' AND parent_object_id=OBJECT_ID('dbo.Events'))
    ALTER TABLE dbo.Events ADD CONSTRAINT CK_Events_Province CHECK(Province IN('Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'));
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name='CK_Events_SportType' AND parent_object_id=OBJECT_ID('dbo.Events'))
    ALTER TABLE dbo.Events ADD CONSTRAINT CK_Events_SportType CHECK(SportType IN('Run','Walk','Cycle','Trail Running','Mountain Biking','Triathlon','Swimming','Multisport','Community'));
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name='CK_Events_EventKind' AND parent_object_id=OBJECT_ID('dbo.Events'))
    ALTER TABLE dbo.Events ADD CONSTRAINT CK_Events_EventKind CHECK(EventKind IN('Race','Awareness','Charity','Community','Training','Special'));
GO

-- Expand existing category types for trail, MTB, triathlon, swimming and community events.
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name='CK_Categories_CategoryType' AND parent_object_id=OBJECT_ID('dbo.Categories'))
    ALTER TABLE dbo.Categories DROP CONSTRAINT CK_Categories_CategoryType;
GO
ALTER TABLE dbo.Categories ADD CONSTRAINT CK_Categories_CategoryType
CHECK(CategoryType IN('Run','Walk','Cycle','Trail Running','Mountain Biking','Triathlon','Swimming','Community'));
GO

-- Allow each event category to specify a different race distance, e.g. 4 km walk or 8 km run.
IF COL_LENGTH('dbo.EventCategories','DistanceKm') IS NULL
    ALTER TABLE dbo.EventCategories ADD DistanceKm DECIMAL(8,2) NULL;
GO

-- Add organiser-defined start-time slots. Slot capacity is tracked per slot.
IF OBJECT_ID('dbo.EventTimeSlots','U') IS NULL
BEGIN
    CREATE TABLE dbo.EventTimeSlots(
        TimeSlotID INT IDENTITY(1,1) PRIMARY KEY,
        EventID INT NOT NULL,
        StartTime TIME(0) NOT NULL,
        EndTime TIME(0) NULL,
        MaxParticipants INT NOT NULL DEFAULT 100,
        CONSTRAINT CK_EventTimeSlots_Capacity CHECK(MaxParticipants>0),
        CONSTRAINT CK_EventTimeSlots_Time CHECK(EndTime IS NULL OR EndTime>StartTime),
        CONSTRAINT FK_EventTimeSlots_Event FOREIGN KEY(EventID) REFERENCES dbo.Events(EventID) ON DELETE CASCADE,
        CONSTRAINT UQ_EventTimeSlots_Event_Start UNIQUE(EventID,StartTime)
    );
END;
GO

-- Link a participant's enrolment to a chosen time slot. Existing entries remain NULL (general event time).
IF COL_LENGTH('dbo.Enrolments','TimeSlotID') IS NULL
    ALTER TABLE dbo.Enrolments ADD TimeSlotID INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Enrolments_TimeSlot' AND parent_object_id=OBJECT_ID('dbo.Enrolments'))
    ALTER TABLE dbo.Enrolments ADD CONSTRAINT FK_Enrolments_TimeSlot FOREIGN KEY(TimeSlotID) REFERENCES dbo.EventTimeSlots(TimeSlotID);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Events_Discovery' AND object_id=OBJECT_ID('dbo.Events'))
    CREATE INDEX IX_Events_Discovery ON dbo.Events(Province,SportType,EventKind,EventDate);
GO

PRINT 'RaceDayDB national event discovery and time-slot upgrade completed.';
GO
