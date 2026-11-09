# Part 3 final checklist and demonstration plan

## Before running

- [ ] Open the solution and confirm `RaceDay.Api` is the startup project.
- [ ] Run the SQL script in SSMS on a test/development database. It drops and recreates the RaceDay tables.
- [ ] Update the SQL Server connection string.
- [ ] Replace the development JWT key with a private key of at least 32 bytes.
- [ ] Restore packages and build the solution.
- [ ] Run all tests and resolve failures.

## Website walkthrough

1. Open the RaceDay home page and show the updated blue/red glassmorphism design.
2. Browse the events listed from the API.
3. Open Sign Up and create a participant account.
4. Log in and show the participant dashboard.
5. Browse an event, open details and enter an available category.
6. Open My Enrolments and show the entry.
7. Open My Results and show the recorded results returned by the API.
8. Log out.
9. Promote a separate test account to the Organiser role in the development database, then sign in with it.
10. Show the organiser dashboard.
11. Create an event, update it and show it in the event list.
12. Create a category and link it to the event.
13. Open Event Entries and view participant entries.
14. Capture or update a result for an event whose date is today or in the past.
15. Add or update route information for an event.
16. Open `/swagger` to demonstrate the API documentation.
17. Resize the browser to demonstrate the responsive layout.

## Evidence to capture yourself

- [ ] Home page screenshot.
- [ ] Login page screenshot showing the blue glass animation.
- [ ] Sign-up page screenshot.
- [ ] Participant overview and My Enrolments screenshots.
- [ ] Organiser dashboard and event management screenshots.
- [ ] Category management and event-entry screenshots.
- [ ] Results capture screenshot.
- [ ] Swagger screenshot.
- [ ] Green GitHub Actions screenshot, only after the workflow passes.
- [ ] Your own unlisted demonstration video URL.

## Suggested Git workflow

Create a dedicated Part 3 branch and commit real, incremental work as you review and test it. Do not create empty or fabricated commits. Follow the exact number and format required by your lecturer's rubric.


## National event discovery and time-slot walkthrough

- [ ] Search events using each of the nine provinces.
- [ ] Filter by town/city and activity (running, trail running, walking, cycling, mountain biking, triathlon, swimming, multisport, community fitness).
- [ ] Filter by Race, Awareness, Charity, Community, Training or Special event purpose.
- [ ] Test date range and min/max distance filters.
- [ ] As Organiser, publish an event with the correct province, location, activity, purpose, distance and organiser URL.
- [ ] Add multiple official start-time slots and capacities.
- [ ] As Participant, choose a category and one available slot; verify full slots are not offered.
- [ ] Check My Enrolments to confirm the chosen slot is displayed.
- [ ] Review the external calendar directory and confirm external links open in a new tab.
- [ ] Review the GBV-awareness special-event spotlight and confirm the official organiser link is used.
