# RaceDay national event discovery — coverage and source notes

## What the updated website does

The RaceDay homepage lets visitors search RaceDay organiser listings by:

- Any of the nine provinces: Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, North West, Northern Cape and Western Cape.
- Town or city, such as Mbombela, Durban, Johannesburg or Cape Town.
- Activity: road running, trail running, walking, road cycling, mountain biking, triathlon, swimming, multisport and community fitness.
- Event purpose: race, awareness, charity, community, training or special event.
- Date range and minimum / maximum distance in kilometres.

Each event record can show its province, location, activity, event purpose, main distance, category distances, organiser URL, general start/end time and separately bookable time slots.

## How time slots work

1. An Organiser creates an event and enters its official date, province, town, activity, event purpose and measured distances.
2. On the event details page the Organiser adds one or more start-time slots and a capacity for each slot.
3. Participants open the event, select their category/distance and choose a time slot with places still available.
4. The API checks that the selected slot belongs to that event and has capacity before confirming the enrolment.
5. My Enrolments shows the selected slot. The organiser's entry list also displays it.

A single general event start time can still be entered when an event does not need separate booking slots. The website does not invent times: organisers must publish them.

## Special event purposes

Organisers can mark an event as Awareness, Charity, Community, Training or Special. This allows the event directory to include campaigns and causes as well as competitive races. The database setup preloads categories such as GBV Awareness Walk, GBV Awareness Run, Charity Walk, Cancer Awareness Run, Environmental Clean-up Walk, Family Fun Run and Youth Community Sports Day. The homepage also shows these as supported special-event themes; they are category options, not claims that an event is currently scheduled for each one.

The homepage currently highlights the public 2026 Walk For Them GBV-awareness campaign:

- Durban: 28 November 2026, Sunkist Lawns / Durban Promenade, 4 km walk or 8 km run, 06:00 start.
- Gqeberha: 12 December 2026, Hobie Beach, 4 km walk or 8 km run, 07:00 start.

These are external events. The card links to the organiser's website; RaceDay does not manage their entries or availability.

## External event calendars linked from the homepage

The following independent calendars can help visitors discover events that have not yet been added to RaceDay:

- RunningCalendar — province index for all nine South African provinces: https://runningcalendar.co.za/provinces
- RaceConnect — event list with category, province, date and distance filters: https://raceconnect.co.za/events
- Cycling South Africa — member portal event finder: https://www.cyclingsa-events.co.za/events
- Mpumalanga Cycling Union — provincial 2027 cycling calendar: https://mpumalangacycling.org/calendar
- Walk For Them — organiser information and registration: https://www.walk4them.co.za/

## Important coverage limitation

There is no single RaceDay-connected public data feed in this project that automatically imports every race, fun run, club event, school event, private event and awareness campaign from every organiser in South Africa. External calendars are linked for discovery, but they remain independently managed websites. The RaceDay filters search events entered into the RaceDay database by an Organiser. To make a verified event appear in RaceDay search, an Organiser must add it and publish its official information. This avoids inventing event dates, distances, locations or start times and avoids implying that RaceDay has confirmed an external event's availability.

The `docs/NATIONAL_EVENT_IMPORT_TEMPLATE.csv` file is a data-entry template for organisers preparing event information. It is not an automatic scraper or bulk-import tool.
