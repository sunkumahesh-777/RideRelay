# RideRelay Admin Process

## Purpose

The admin process protects RideRelay from fake users, unsafe rides, offline deals, fake routes, and wrong seat counts.

RideRelay is a fuel-sharing and empty-seat sharing platform, so admin work must focus on trust, verification, route safety, and payment transparency.

## Admin Responsibilities

Admin should manage:

- Rider verification
- Captain verification
- Vehicle verification
- Pickup hub approval
- Route mismatch complaints
- Fake seat count reports
- Payment disputes
- Review moderation
- Suspicious activity
- Account blocking or warning

## Captain Verification Process

Captain signup should collect:

- Full name
- Phone number
- Email
- Gender
- Vehicle type
- Vehicle number
- Driving license number
- UPI ID or bank details
- QR code if available

Admin verification steps:

1. Check captain profile details.
2. Check vehicle number format.
3. Check driving license document or number.
4. Mark captain as `kyc_pending`, `verified`, `rejected`, or `blocked`.
5. Allow captain route creation only after minimum verification.

## Rider Verification Process

Rider signup should collect:

- Full name
- Phone number
- Email
- Gender
- Home or primary stop
- Emergency contact

Admin verification steps:

1. Verify phone number.
2. Verify email.
3. Check emergency contact.
4. Mark rider as `phone_pending`, `verified`, `restricted`, or `blocked`.

## Fixed Pickup Hub Approval

RideRelay should not allow random road pickup.

Admin should approve hubs such as:

- Metro stations
- Bus stops
- Railway stations
- Public junctions
- IT corridor pickup points
- College and institution gates

Hub approval checks:

- Safe waiting space
- Public visibility
- No dangerous road crossing
- Captain can identify point easily
- Rider can walk safely
- GPS radius is clear

## Route Matching Review

Admin should monitor:

- Captains entering fake start location
- Captains entering home or office location only
- Riders requesting doorstep pickup
- Routes that force captain detour
- Backward hop suggestions

Admin rule:

Captain should see only assigned hop pickup and hop destination, not the rider full journey.

## Fake Seat Count Reports

Rider can report:

- Captain declared more vacant seats than actually available.
- Captain accepted request but vehicle was full.
- Captain refused after accepting.

Admin actions:

1. Check ride request record.
2. Check captain declared seats.
3. Check accepted rider count.
4. Warn captain for first issue.
5. Restrict or block for repeated misuse.

## Payment Dispute Process

Admin should check:

- Ride completed status.
- Payment status.
- Rider payment method.
- Captain bank or UPI details.
- Payment amount.

Important rule:

Only app-confirmed payments should count in captain earnings. Offline deals should not count in RideRelay dashboard.

## Review and Rating Moderation

Riders can submit:

- Rating from 1 to 5
- Mood: happy, moderate, sad
- Comment

Admin should remove or flag reviews only when:

- Abusive language is used.
- Fake review is detected.
- Review is unrelated to the ride.

## Safety Reports

Safety reports should be high priority.

Examples:

- Captain not at pickup location.
- Captain route mismatch.
- Rider harassment report.
- Unsafe pickup point.
- Fake identity.

Admin actions:

1. Freeze ride or user if needed.
2. Contact rider/captain.
3. Review GPS and status events.
4. Block serious unsafe accounts.

## Admin Dashboard Sections

Future admin dashboard should include:

- User verification
- Captain verification
- Vehicle verification
- Pickup hubs
- Active rides
- Ride reports
- Payment disputes
- Reviews
- Audit logs
- Blocked users

## Admin API Ideas

Future admin APIs:

- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId/status`
- `GET /api/admin/captains/pending`
- `PATCH /api/admin/captains/:captainId/verification`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:reportId`
- `POST /api/admin/hubs`
- `PATCH /api/admin/hubs/:hubId`
- `GET /api/admin/audit-logs`

## Final Admin Goal

Admin process should keep RideRelay:

- Safe
- Affordable
- Transparent
- Hub-based
- Free from offline misuse
- Useful for both riders and captains

