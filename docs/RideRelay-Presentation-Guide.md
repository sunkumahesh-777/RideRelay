# RideRelay Presentation Guide

## 1. Project Title

**RideRelay**

**Tagline:** Save Fuel. Save Money. Share Empty Seats.

RideRelay is a low-cost community ride-sharing platform. It is not a taxi app like Rapido, Ola, or Uber. RideRelay connects riders with nearby captains who are already travelling on the same route, so empty seats can be shared and fuel cost can be reduced.

## 2. Main Motive

In cities like Hyderabad, many people travel every day from home to office, colleges, metro stations, bus stops, IT areas, and main junctions. At the same time, many private vehicles travel with empty seats.

RideRelay’s motive is to:

- Reduce travel cost for riders.
- Help captains recover fuel expenses.
- Reduce traffic and pollution.
- Promote fixed pickup hubs instead of doorstep pickup.
- Make daily travel safer, cleaner, and more affordable.

## 3. Problem We Are Solving

Daily commuters face many problems:

- Taxi and bike taxi fares are high.
- Public transport may not cover the exact final point.
- Riders may stand anywhere on roads, which creates safety issues.
- Captains may enter home or office locations only, which can create wrong matching.
- Empty seats in private vehicles are wasted.
- Long-distance travel becomes costly when only one person pays.

RideRelay solves this by using fixed pickup hubs, route-based matching, shared fuel pricing, and captain/rider verification.

## 4. RideRelay Concept

RideRelay works on a simple idea:

If a captain is already travelling from one place to another, riders going in the same direction can join from fixed pickup points.

Example:

Captain route: Ameerpet to BHEL  
Rider route: Ameerpet to Patancheru  

If the captain passes through useful hubs, the rider can join one leg and then continue with another captain if needed.

This creates direct rides and multi-hop rides.

## 5. Important Difference From Taxi Apps

RideRelay is not based on doorstep pickup.

Taxi apps:

- Pick rider from exact location.
- Drop rider at exact destination.
- Charge high commercial fare.
- Captain changes route for rider.

RideRelay:

- Uses fixed pickup hubs.
- Captain should not take unnecessary detours.
- Fare is fuel-sharing based.
- Rider may walk a short distance to a safe pickup point.
- Empty seats are shared with multiple riders.

## 6. Fixed Pickup Hub System

RideRelay uses fixed pickup and drop points such as:

- Metro stations
- Metro entry and exit gates
- Bus stops
- Railway stations
- Main junctions
- Colleges and institutions
- IT hubs
- Famous public places

The rider selects the nearest hub instead of standing randomly on the road.

Benefits:

- Captains can identify riders easily.
- Pickup becomes safer.
- Route matching becomes accurate.
- Captains do not need to enter small lanes.
- Riders get proper boarding points.

## 7. Rider Flow

### Step 1: Login or Signup

Rider opens RideRelay and logs in or creates an account with valid details.

Required rider details:

- Full name
- Email
- Phone number
- Gender
- Home or primary stop
- Emergency contact

### Step 2: Select Pickup and Destination

Rider enters:

- Pickup location
- Destination location
- Required seats

RideRelay suggests nearest official pickup hubs.

### Step 3: Route Validation

The system checks:

- Distance between pickup and destination
- Whether route is direct or needs multi-hop
- Nearby captains passing through the route
- Available seats

### Step 4: Direct Ride or Multi-Hop Ride

If direct captain is available:

- Show direct captain options.
- Rider selects captain.
- Request goes to captain.

If direct captain is not available:

- RideRelay creates multi-hop route.
- Example: Charminar to Lakdikapul, Lakdikapul to KPHB, KPHB to Patancheru.
- Each leg shows only required captain information.

### Step 5: Captain Approval

Rider request is sent to captain.

Captain can:

- Accept request
- Decline request
- Send alert message
- Confirm pickup presence
- Start ride
- End ride

### Step 6: Ride Starts

Start Ride button is available only on captain side.

Once captain starts the ride:

- Rider receives ride started alert.
- Current leg becomes locked.
- Rider cannot go back and change the selected route.

### Step 7: Leg Completion

When one leg ends:

- Rider pays for that leg.
- Captain ends ride.
- Rider moves to next pickup hub.
- Next leg captain confirms availability.

### Step 8: Payment and Review

After journey completion:

- Rider pays through linked payment method.
- Rider gives captain review.
- Website review appears after full journey.

## 8. Captain Flow

### Step 1: Login or Signup

Captain creates account with valid details.

Required captain details:

- Full name
- Email
- Phone number
- Vehicle type
- Vehicle number
- Driving license
- Ride preference
- Gender preference if needed

### Step 2: Captain Route Setup

Captain enters:

- Current start location
- Destination
- Vehicle type
- Available seats
- Trip time

The system uses live/current location, not only home or office address.

### Step 3: Route Suggestions

RideRelay shows:

- Active route
- Route distance
- Same destination rider count
- Vacant seats
- Suggested route hubs

### Step 4: Rider Requests

Captain sees rider requests only for matching route hubs.

For safety, captain sees:

- Rider name
- Hop pickup point
- Hop destination point
- Fare
- ETA
- GPS distance

Captain does not need to see the rider’s full journey.

### Step 5: Accept or Decline

Captain can accept or decline rider requests.

When captain accepts:

- Rider receives alert.
- Seat count reduces.
- Accepted rider appears in accepted riders panel.

When captain declines:

- Rider can choose another captain.

### Step 6: Pickup Presence

At pickup point:

- Rider can confirm captain present.
- If captain is not present, alert is sent.
- GPS range within 500m is checked.

If captain is within 500m:

- Message says captain will reach shortly.

If captain is far:

- Rider can choose another captain.

### Step 7: Start and End Ride

Captain starts ride after pickup confirmation.

When rider gets down at hop destination:

- Captain ends ride for that rider.
- Seat becomes available again.
- New rider requests can be accepted from the next pickup hub.

## 9. Multi-Hop Ride System

Multi-hop is used when direct ride is not available.

Example:

Rider wants LB Nagar to Airport.

Possible route:

- LB Nagar to Lakdikapul
- Lakdikapul to Gachibowli
- Gachibowli to Airport

RideRelay arranges captains leg by leg.

Rules:

- Rider should not go backward unnecessarily.
- Hop points should face the destination direction.
- Captain sees only assigned hop pickup and hop destination.
- Rider full journey is hidden from captain for safety.
- Each completed leg becomes immutable.

## 10. Fare and Fuel Sharing Logic

RideRelay should not use high commercial pricing.

Instead of taxi-style pricing, it uses fuel-sharing logic:

- Calculate route fuel cost.
- Divide by available seats or occupied riders.
- Add small platform fee if needed.

Example:

If route fuel share is Rs 100 and 2 riders are sharing:

- Each rider pays around Rs 50.

If 3 riders are sharing:

- Each rider pays less.

This keeps RideRelay affordable and useful.

## 11. Captain Earning Dashboard

Captain dashboard can show:

- Day target
- Week target
- Month target
- Total rides
- Completed riders
- Day earned amount
- Remaining target
- Rider ratings
- Happy, moderate, and sad review indicators

Important rule:

Captain earning should count only verified app payments. Offline deals should not be counted.

## 12. Bank and Payment Section

Captain has a separate bank details section.

Captain can add:

- Account holder name
- Account number
- IFSC code
- UPI ID
- QR code upload

Rider uses this after ride completion.

Payment status should be recorded in the system.

## 13. Rider Profile Section

Rider profile contains:

- Name
- Phone
- Email
- Home stop
- Payment history
- Trip history
- Safety contacts
- Offers

Profile details should be editable only after clicking edit.

## 14. Eco Points System

RideRelay promotes walking to official hubs.

Eco Points rules:

- Walk 100m to pickup hub = 1 Eco Point
- Walk 100m from drop hub to destination = 1 Eco Point
- Use shared RideRelay trip = 2 Eco Points
- Choose official pickup hub = 3 bonus Eco Points
- Refer friend after first successful ride = 25 Eco Points

Removed unnecessary rewards:

- Daily streak
- Weekly streak
- Complete ride points

## 15. Calories Tracker

RideRelay motivates riders to walk safely to nearby hubs.

Formula:

Calories burned = walking distance in km x 50

Example:

If rider walks 0.6 km:

You walked 0.6 km and burned approx 30 kcal.

## 16. Monthly Impact Dashboard

Monthly dashboard shows:

- Total walking distance
- Calories burned
- Fuel saved
- CO2 reduced
- Eco Points earned

This helps users understand personal and environmental impact.

## 17. Safety and Trust

RideRelay safety rules:

- Captain must be verified.
- Rider must be verified.
- Captain cannot fake start location.
- If captain live location is far from declared start, warning is shown.
- Captain declares available seats before trip.
- Riders can report fake seat count.
- Riders can report route mismatch.
- Full rider journey is hidden from captain.
- Captain sees only assigned pickup and drop hub.
- Emergency contact and SOS flow should be added in future.

## 18. Gender Safety Option

RideRelay can support gender preference:

- Female rider can choose female captain.
- Female captain can accept female riders.
- Family-friendly ride preference can be added.

This is useful for safety and trust.

## 19. Location and Map System

RideRelay can use:

- Google Maps
- Apple Maps
- OpenStreetMap
- Leaflet map library

Map features:

- Fixed pickup hubs
- Route hubs
- Captain live location
- Rider walking path
- Traffic mode
- Satellite mode
- Navigate button to default map app

If map library is not available, RideRelay should still work using saved hub and route database.

## 20. Backend Requirement

A backend is needed to store and manage real data.

Backend should support:

- User signup and login
- Rider profiles
- Captain profiles
- Captain trips
- Rider requests
- Ride status
- Payment status
- Reviews
- Reports
- Location hubs
- Route data
- Notifications

Recommended backend:

- Node.js
- Express.js
- PostgreSQL or MongoDB
- JWT authentication
- Cloud storage for QR codes and documents

## 21. Database Requirement

Main database tables or collections:

- Users
- Riders
- Captains
- Vehicles
- Pickup hubs
- Captain trips
- Rider ride requests
- Ride legs
- Payments
- Reviews
- Reports
- Notifications
- Eco points
- Monthly impact

## 22. APIs Required

Important APIs:

- Signup API
- Login API
- Get rider profile API
- Update rider profile API
- Get captain profile API
- Update captain profile API
- Create captain trip API
- Search rider route API
- Match captain route API
- Accept rider request API
- Decline rider request API
- Start ride API
- End ride API
- Payment update API
- Review submit API
- Location hubs API
- Route distance API

## 23. Admin Panel Requirement

Admin should manage:

- Rider verification
- Captain verification
- Vehicle verification
- Complaint reports
- Fake route reports
- Fake seat reports
- Payment disputes
- Pickup hub approval
- Route data management
- Suspicious user blocking

## 24. Government and Record Verification

For real launch, RideRelay should verify:

- Captain identity
- Driving license
- Vehicle records
- Criminal record status where legally possible
- Voluntary verification documents
- Rider identity

This improves trust before public release.

## 25. Pages in Current Website

Current and planned website pages:

- Login page
- Signup page
- Rider page
- Captain page
- Rider control panel
- Captain control panel
- Bank details panel
- Rider requests panel
- Fixed pickup hubs section
- Eco points section
- Monthly impact section
- Safety and trust section

## 26. Complete Journey Example

Example journey:

Rider wants to go from Ameerpet to Patancheru.

1. Rider logs in.
2. Rider selects pickup and destination.
3. RideRelay suggests nearest pickup hub.
4. System checks direct captain.
5. If direct captain is available, request goes to captain.
6. Captain accepts.
7. Rider reaches pickup hub.
8. Captain confirms pickup.
9. Captain starts ride.
10. Rider pays after ride completion.
11. Rider submits review.

If direct captain is not available:

1. RideRelay creates multi-hop route.
2. Rider selects first leg.
3. First captain accepts.
4. Rider completes first leg.
5. Rider pays for first leg.
6. Rider moves to next hub.
7. Next captain accepts.
8. Process continues until final destination.

## 27. Business Benefits

For riders:

- Lower fare
- Safer pickup hubs
- Better route matching
- Eco points
- Walking and health benefit

For captains:

- Fuel cost recovery
- Empty seat usage
- Daily earning support
- Rider requests on same route
- No unnecessary detours

For city:

- Less traffic
- Less fuel usage
- Less pollution
- Better use of existing vehicles

## 28. Future Enhancements

Future development can include:

- Real backend database
- Live GPS tracking
- Push notifications
- Payment gateway integration
- Admin verification panel
- Mobile app version
- SOS and emergency alerts
- Government verification integration
- AI route matching
- Real traffic-aware routing
- QR-based pickup verification

## 29. Final Summary

RideRelay is a practical community travel platform for daily commuters. It uses fixed pickup hubs, fuel-sharing fare, route matching, empty seat sharing, captain verification, rider safety, eco points, and multi-hop travel.

The goal is simple:

**Travel smart, travel together, save fuel, save money, and reduce city traffic.**

