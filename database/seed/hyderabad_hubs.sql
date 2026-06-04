-- RideRelay starter Hyderabad pickup hubs

INSERT INTO pickup_hubs (
  name,
  area,
  hub_type,
  pickup_hint,
  latitude,
  longitude,
  safety_radius_meters,
  priority
) VALUES
  ('Ameerpet Metro', 'Ameerpet', 'Metro', 'Official RideRelay pickup near metro exit', 17.4375000, 78.4483000, 500, 1),
  ('SR Nagar Metro', 'SR Nagar', 'Metro', 'Official pickup near metro entry gate', 17.4415000, 78.4452000, 500, 2),
  ('Punjagutta Junction', 'Punjagutta', 'Junction', 'Pickup near main junction safe bay', 17.4261000, 78.4516000, 500, 3),
  ('Lakdikapul Bus Stop', 'Lakdikapul', 'Bus', 'Pickup near bus stop footpath side', 17.4049000, 78.4656000, 500, 4),
  ('KPHB Metro', 'KPHB', 'Metro', 'Official pickup near metro exit', 17.4933000, 78.3992000, 500, 5),
  ('Miyapur Metro', 'Miyapur', 'Metro', 'Official pickup near metro station', 17.4964000, 78.3616000, 500, 6),
  ('Raidurg Metro', 'Raidurg', 'Metro', 'Pickup for IT corridor riders', 17.4422000, 78.3772000, 500, 7),
  ('HITEC City Metro', 'HITEC City', 'Metro', 'Pickup near IT corridor', 17.4504000, 78.3837000, 500, 8),
  ('Gachibowli Junction', 'Gachibowli', 'Junction', 'Pickup near public waiting point', 17.4401000, 78.3489000, 500, 9),
  ('LB Nagar Metro', 'LB Nagar', 'Metro', 'Official pickup near metro exit', 17.3457000, 78.5522000, 500, 10),
  ('Uppal Metro', 'Uppal', 'Metro', 'Official pickup near metro exit', 17.4003000, 78.5591000, 500, 11),
  ('BHEL Township', 'BHEL', 'Work Hub', 'Pickup near township main road', 17.4957000, 78.3058000, 500, 12),
  ('Patancheru Bus Stop', 'Patancheru', 'Bus', 'Pickup near main bus stop', 17.5333000, 78.2645000, 500, 13),
  ('Kokapet SEZ', 'Kokapet', 'Work Hub', 'Pickup near SEZ approach road', 17.4012000, 78.3428000, 500, 14),
  ('Nanakramguda Circle', 'Nanakramguda', 'Junction', 'Pickup near circle safe point', 17.4199000, 78.3441000, 500, 15),
  ('Manikonda Main Road', 'Manikonda', 'Bus', 'Pickup near main road bus stop', 17.4019000, 78.3764000, 500, 16);

