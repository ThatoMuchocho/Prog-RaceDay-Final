# RaceDay — Final Submission Folder (PROG6212)

This is the consolidated RaceDay solution folder. Open **`RaceDay.sln`** in Visual Studio 2022. The folder includes the ASP.NET Core API, SQL Server setup script, automated validation tests, and the Part 3 frontend.

## Included functionality

**Participant:** public event discovery, event details and route information, registration and login, participant dashboard, event category entry, enrolment history and personal results.

**Organiser:** organiser dashboard, create/update/delete events, create/update/delete categories, link categories to events, view participant entries, capture/update results, and add/update/remove route information.

**Design:** responsive blue/navy/red theme, animated glass-style login and sign-up screens, responsive workspace, and matching Swagger UI theme.

## 1. Requirements

- Visual Studio 2022
- .NET 8 SDK
- SQL Server or SQL Server LocalDB
- SQL Server Management Studio (SSMS), or another SQL client

## 2. Set up or upgrade the database

**Choose only one path:**

- **Existing Part 2 RaceDayDB with data you want to keep:** back up the database, then run `docs/UPGRADE_NATIONAL_EVENTS.sql`. This adds province/activity/purpose fields, category distances and the time-slot table without dropping existing users, events, enrolments or results.
- **New or disposable coursework database:** run `docs/RaceDay_Database_script.sql`. This is a full reset/setup script: it drops and recreates the RaceDay tables and deletes existing data in those tables.

Both scripts create/use `RaceDayDB`. The setup script seeds roles and event category choices (including GBV awareness categories); it does not add invented public race dates or placeholder demo accounts.

The default connection string is configured for LocalDB in `RaceDay.Api/appsettings.json`. Change it to your SQL Server instance if necessary.

## 3. Run the application

1. Open `RaceDay.sln` in Visual Studio.
2. Set `RaceDay.Api` as the startup project.
3. Restore NuGet packages.
4. Build the solution.
5. Run the project. Open the HTTPS address displayed by Visual Studio.
6. The RaceDay home page is at `/`. API documentation is at `/swagger` in Development mode.

You can also run the solution from a terminal opened in this folder:

```bash
dotnet restore RaceDay.sln
dotnet build RaceDay.sln --configuration Release
dotnet test RaceDay.sln --configuration Release
```

## 4. Create your accounts

1. Open the RaceDay website and use **Create account** to register the account you want to use for organiser testing. Public sign-up creates a Participant account initially.
2. Promote that test account in SSMS by replacing the email below with the address you registered:

```sql
USE RaceDayDB;
GO
UPDATE dbo.Users
SET RoleID = (SELECT RoleID FROM dbo.Roles WHERE RoleName = 'Organiser')
WHERE Email = 'your-organiser-email@example.com';
GO
```

3. Log out and sign in again so the new role is included in the JWT token.
4. Register a second account to demonstrate the Participant workflow separately.

## 5. Submission demonstration checklist

- [ ] Build the solution successfully.
- [ ] Run all automated tests successfully.
- [ ] Show the RaceDay home page and event listing.
- [ ] Register and log in as a Participant.
- [ ] View event details and enter an available category.
- [ ] Show My Enrolments and My Results.
- [ ] Log in as an Organiser.
- [ ] Create and update an event.
- [ ] Create a category and link it to an event.
- [ ] Show event participant entries.
- [ ] Capture or update an event result (the event date must be today or earlier).
- [ ] Add or update event route information.
- [ ] Open Swagger and show the API endpoints.
- [ ] Capture your own screenshots and any required demonstration video.

## Important scope note

The uploaded Part 2 API does not provide enrolment cancellation, profile-photo upload or event-banner upload endpoints. Those unsupported features are not represented as functioning buttons in this frontend. The UI uses the actual authentication, event, category, enrolment, results and route endpoints in this solution.

## Verification status

The JavaScript files have been checked for syntax. A .NET build and automated test run still need to be completed locally in Visual Studio or with the .NET 8 SDK. Do not submit a screenshot or claim a successful build/test until you have run it on your machine.

## Fix included for the RouteInformation primary key error

The EF Core model explicitly maps `RouteInformation.RouteID` as its primary key in `RaceDayDbContext.OnModelCreating`. This matches the `RouteID` primary key already declared by `docs/RaceDay_Database_script.sql`. No database reset is required for this model configuration fix.

## National event discovery update

The homepage now searches RaceDay event records by province, town/city, sport activity, event purpose, date range and distance range. It includes all nine South African provinces. Race cards show the listed distance, organiser-published general times or available time-slot count. Public event details show category distances and start-time slots.

Organisers can now publish the event's province, town, activity, purpose, official organiser URL, main distance, general start/end times and individual capacity-controlled start-time slots. Participants choose an event category/distance and, where the event has slots, select a slot with places available. The API checks the slot belongs to the event and has remaining capacity.

Special event purposes include Awareness, Charity, Community, Training and Special. The fresh database script preloads category options such as GBV Awareness Walk/Run, Charity Walk, Cancer Awareness Run, Environmental Clean-up Walk, Family Fun Run and Youth Community Sports Day.

### Database instructions

- For a brand-new/test database, use `docs/RaceDay_Database_script.sql` (this setup script drops and recreates RaceDay tables, so do not run it over data you need to keep).
- For an existing RaceDayDB created from the older Part 2 database script, use `docs/UPGRADE_NATIONAL_EVENTS.sql`. This adds the new columns/time-slot table while preserving existing event and participant data. Back up the database first.
- See `docs/NATIONAL_EVENT_DISCOVERY_GUIDE.md` for the event search fields, time-slot workflow, special-event categories and source limitations.

### National calendars and verified special-event spotlight

The homepage links to RunningCalendar's all-province index (https://runningcalendar.co.za/provinces), RaceConnect's multi-activity event finder (https://raceconnect.co.za/events), Cycling South Africa's event finder (https://www.cyclingsa-events.co.za/events), and the Mpumalanga Cycling Union 2027 calendar (https://mpumalangacycling.org/calendar). It also highlights the organiser-published Walk For Them GBV-awareness events in Durban (28 November 2026, 4 km walk / 8 km run, 06:00 start) and Gqeberha (12 December 2026, 4 km walk / 8 km run, 07:00 start): https://www.walk4them.co.za/.

External calendars are not automatically imported into RaceDay and external event entries are not booked by RaceDay. The RaceDay search is for events an organiser has entered into the RaceDay database. This avoids presenting unverified third-party dates, distances or start times as RaceDay-confirmed information.


## National discovery: important coverage note

The location selector covers all nine provinces. Visitors can filter RaceDay listings by province, town/city, activity, event purpose, date range and distance range. Organisers add verified event information and start-time slots; the application does not guess start times or availability. National and provincial event calendars are provided as external discovery links. They are not automatically imported into the RaceDay database, and external event entries are completed on the organiser's site.

The homepage's Walk For Them GBV-awareness cards reflect the organiser's published 2026 Durban and Gqeberha event information. Confirm details with the organiser before travelling or entering because external schedules can change. More event types (charity, cancer awareness, environment, family and youth activities) are available as organiser-created event categories; they are not represented as scheduled events unless an organiser publishes them.

## Open your API

Run `RaceDay.Api` in Visual Studio, then open the HTTPS URL shown by Visual Studio. The homepage has an **API** link to `api.html`. From there you can open `/swagger`, `/swagger/v1/swagger.json`, and `/api/events`. The API is also available through the shortcut `/api`, which redirects to Swagger. The website's JavaScript calls the same host and port that serve the frontend. Do not open `wwwroot/index.html` directly from Windows Explorer because that does not start the ASP.NET Core API.
