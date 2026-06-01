import { useEffect, useMemo, useState } from 'react';

const assetPath = (fileName) => `${import.meta.env.BASE_URL}${fileName}`;

const liveDrivers = [
  {
    id: 1,
    driver: 'Rahul',
    route: 'Ameerpet -> BHEL',
    pickup: 'Ameerpet',
    destination: 'BHEL',
    via: ['Ameerpet', 'SR Nagar', 'Erragadda', 'BHEL', 'Patancheru'],
    pickupDistance: 300,
    vehicle: 'Bike',
    seats: 1,
    fare: 15,
    eta: 3,
    rating: 4.8,
    verified: true
  },
  {
    id: 2,
    driver: 'Kiran',
    route: 'SR Nagar -> Patancheru',
    pickup: 'SR Nagar',
    destination: 'Patancheru',
    via: ['Ameerpet', 'SR Nagar', 'Moosapet', 'BHEL', 'Patancheru'],
    pickupDistance: 450,
    vehicle: 'Car',
    seats: 3,
    fare: 25,
    eta: 5,
    rating: 4.9,
    verified: true
  },
  {
    id: 3,
    driver: 'Sandeep',
    route: 'Punjagutta -> Lingampally',
    pickup: 'Punjagutta',
    destination: 'Lingampally',
    via: ['Punjagutta', 'Ameerpet', 'Kukatpally', 'Lingampally'],
    pickupDistance: 500,
    vehicle: 'Auto',
    seats: 2,
    fare: 10,
    eta: 2,
    rating: 4.7,
    verified: false
  },
  {
    id: 4,
    driver: 'Meena',
    route: 'Madhapur -> Miyapur',
    pickup: 'Madhapur',
    destination: 'Miyapur',
    via: ['Madhapur', 'Kondapur', 'Hafeezpet', 'Miyapur'],
    pickupDistance: 650,
    vehicle: 'Car',
    seats: 2,
    fare: 30,
    eta: 7,
    rating: 4.6,
    verified: true
  },
  {
    id: 5,
    driver: 'Arjun',
    route: 'Punjagutta -> Mehdipatnam',
    pickup: 'Punjagutta',
    destination: 'Mehdipatnam',
    via: ['Punjagutta', 'Khairatabad', 'Lakdikapul', 'Masab Tank', 'Mehdipatnam'],
    pickupDistance: 380,
    vehicle: 'Auto',
    seats: 2,
    fare: 18,
    eta: 4,
    rating: 4.8,
    verified: true
  },
  {
    id: 6,
    driver: 'Naveen',
    route: 'Ameerpet -> Mehdipatnam',
    pickup: 'Ameerpet',
    destination: 'Mehdipatnam',
    via: ['Ameerpet', 'Punjagutta', 'Khairatabad', 'Lakdikapul', 'Masab Tank', 'Mehdipatnam'],
    pickupDistance: 520,
    vehicle: 'Car',
    seats: 3,
    fare: 28,
    eta: 6,
    rating: 4.7,
    verified: true
  },
  {
    id: 7,
    driver: 'Imran',
    route: 'Charminar -> Lakdikapul',
    pickup: 'Charminar',
    destination: 'Lakdikapul',
    via: ['Charminar', 'Afzalgunj', 'Nampally', 'Lakdikapul'],
    pickupDistance: 420,
    vehicle: 'Auto',
    seats: 2,
    fare: 20,
    eta: 5,
    rating: 4.8,
    verified: true
  },
  {
    id: 8,
    driver: 'Swathi',
    route: 'Lakdikapul -> KPHB',
    pickup: 'Lakdikapul',
    destination: 'KPHB',
    via: ['Lakdikapul', 'Khairatabad', 'Punjagutta', 'Ameerpet', 'SR Nagar', 'Erragadda', 'Moosapet', 'KPHB'],
    pickupDistance: 480,
    vehicle: 'Car',
    seats: 3,
    fare: 32,
    eta: 6,
    rating: 4.9,
    verified: true
  },
  {
    id: 9,
    driver: 'Prakash',
    route: 'KPHB -> Patancheru',
    pickup: 'KPHB',
    destination: 'Patancheru',
    via: ['KPHB', 'Kukatpally', 'Miyapur', 'BHEL', 'Patancheru'],
    pickupDistance: 350,
    vehicle: 'Car',
    seats: 3,
    fare: 30,
    eta: 4,
    rating: 4.7,
    verified: true
  },
  {
    id: 10,
    driver: 'Farha',
    route: 'LB Nagar -> Lakdikapul',
    pickup: 'LB Nagar',
    destination: 'Lakdikapul',
    via: ['LB Nagar', 'Dilsukhnagar', 'Malakpet', 'Koti', 'Nampally', 'Lakdikapul'],
    pickupDistance: 460,
    vehicle: 'Car',
    seats: 3,
    fare: 34,
    eta: 5,
    rating: 4.8,
    verified: true
  },
  {
    id: 11,
    driver: 'Vikram',
    route: 'Uppal -> Lakdikapul',
    pickup: 'Uppal',
    destination: 'Lakdikapul',
    via: ['Uppal', 'Habsiguda', 'Tarnaka', 'Secunderabad', 'Paradise', 'Tank Bund', 'Lakdikapul'],
    pickupDistance: 520,
    vehicle: 'Car',
    seats: 2,
    fare: 36,
    eta: 7,
    rating: 4.7,
    verified: true
  },
  {
    id: 12,
    driver: 'Harika',
    route: 'Lakdikapul -> Gachibowli',
    pickup: 'Lakdikapul',
    destination: 'Gachibowli',
    via: ['Lakdikapul', 'Masab Tank', 'Mehdipatnam', 'Tolichowki', 'Shaikpet', 'Gachibowli'],
    pickupDistance: 410,
    vehicle: 'Car',
    seats: 3,
    fare: 38,
    eta: 6,
    rating: 4.9,
    verified: true
  },
  {
    id: 13,
    driver: 'Suhas',
    route: 'Gachibowli -> Airport',
    pickup: 'Gachibowli',
    destination: 'Shamshabad Airport',
    via: ['Gachibowli', 'Nanakramguda', 'Financial District', 'Narsingi', 'Aramghar', 'Shamshabad Airport'],
    pickupDistance: 600,
    vehicle: 'Car',
    seats: 3,
    fare: 55,
    eta: 8,
    rating: 4.8,
    verified: true
  },
  {
    id: 14,
    driver: 'Mounika',
    route: 'Lakdikapul -> Secunderabad',
    pickup: 'Lakdikapul',
    destination: 'Secunderabad',
    via: ['Lakdikapul', 'Tank Bund', 'Paradise', 'Secunderabad'],
    pickupDistance: 390,
    vehicle: 'Auto',
    seats: 2,
    fare: 22,
    eta: 4,
    rating: 4.6,
    verified: true
  },
  {
    id: 15,
    driver: 'Rohit',
    route: 'Secunderabad -> Kompally',
    pickup: 'Secunderabad',
    destination: 'Kompally',
    via: ['Secunderabad', 'Paradise', 'Bowenpally', 'Suchitra', 'Kompally'],
    pickupDistance: 450,
    vehicle: 'Car',
    seats: 3,
    fare: 33,
    eta: 5,
    rating: 4.7,
    verified: true
  },
  {
    id: 16,
    driver: 'Sameer',
    route: 'Kompally -> Medchal',
    pickup: 'Kompally',
    destination: 'Medchal',
    via: ['Kompally', 'Suchitra', 'Medchal'],
    pickupDistance: 700,
    vehicle: 'Car',
    seats: 4,
    fare: 28,
    eta: 6,
    rating: 4.6,
    verified: true
  },
  {
    id: 17,
    driver: 'Yamini',
    route: 'LB Nagar -> Pahadi Shareef',
    pickup: 'LB Nagar',
    destination: 'Pahadi Shareef',
    via: ['LB Nagar', 'Karmanghat', 'Chandrayangutta', 'Pahadi Shareef'],
    pickupDistance: 430,
    vehicle: 'Car',
    seats: 3,
    fare: 26,
    eta: 5,
    rating: 4.8,
    verified: true
  },
  {
    id: 18,
    driver: 'Danish',
    route: 'Pahadi Shareef -> Shamshabad Airport',
    pickup: 'Pahadi Shareef',
    destination: 'Shamshabad Airport',
    via: ['Pahadi Shareef', 'Mamidipally', 'Shamshabad Airport'],
    pickupDistance: 500,
    vehicle: 'Car',
    seats: 3,
    fare: 22,
    eta: 4,
    rating: 4.7,
    verified: true
  },
  {
    id: 19,
    driver: 'Irfan',
    route: 'LB Nagar -> Mallapur',
    pickup: 'LB Nagar',
    destination: 'Mallapur',
    via: ['LB Nagar', 'Nagole', 'Uppal', 'Mallapur'],
    pickupDistance: 620,
    vehicle: 'Bike',
    seats: 1,
    fare: 18,
    eta: 6,
    rating: 4.6,
    verified: true
  },
  {
    id: 20,
    driver: 'Mohammad',
    route: 'Lakdikapul -> Secunderabad',
    pickup: 'Lakdikapul',
    destination: 'Secunderabad',
    via: ['Lakdikapul', 'Tank Bund', 'Paradise', 'Secunderabad'],
    pickupDistance: 390,
    vehicle: 'Auto',
    seats: 2,
    fare: 22,
    eta: 4,
    rating: 4.6,
    verified: true
  },
  {
    id: 21,
    driver: 'Keerthi',
    route: 'Mallapur -> Pahadi Shareef',
    pickup: 'Mallapur',
    destination: 'Pahadi Shareef',
    via: ['Mallapur', 'Uppal', 'LB Nagar', 'Karmanghat', 'Chandrayangutta', 'Pahadi Shareef'],
    pickupDistance: 700,
    vehicle: 'Car',
    seats: 3,
    fare: 34,
    eta: 8,
    rating: 4.6,
    verified: true
  }
];

const quickRoutes = [
  ['Ameerpet', 'Patancheru'],
  ['Punjagutta', 'Lingampally'],
  ['Madhapur', 'Miyapur'],
  ['Punjagutta', 'Mehdipatnam'],
  ['Charminar', 'Patancheru'],
  ['LB Nagar', 'Airport'],
  ['Uppal', 'Gachibowli'],
  ['Maisammaguda', 'Miyapur'],
  ['Birla Mandir', 'NALSAR University']
];

const vehicles = ['Any', 'Bike', 'Car'];
const paymentMethods = ['UPI', 'Card', 'Wallet', 'Cash'];
const locationCategories = ['All', 'Commute', 'Tourist', 'Divine', 'Park', 'Amusement', 'Mall', 'Food', 'Office', 'College', 'Institution', 'Hospital', 'Junction', 'Airport'];
const hydMapBounds = {
  minLat: 17.23,
  maxLat: 17.65,
  minLng: 78.25,
  maxLng: 78.59
};
const relayHubs = [
  'Lakdikapul',
  'Ameerpet',
  'KPHB',
  'Miyapur',
  'Gachibowli',
  'Secunderabad',
  'LB Nagar',
  'Uppal',
  'Mehdipatnam',
  'Charminar',
  'Patancheru',
  'Pahadi Shareef',
  'Shamshabad Airport'
];
const roadDistanceKm = {
  'lb nagar->lakdikapul': 11.8,
  'lakdikapul->lb nagar': 11.8,
  'lakdikapul->gachibowli': 15.2,
  'gachibowli->lakdikapul': 15.2,
  'gachibowli->shamshabad airport': 28.5,
  'shamshabad airport->gachibowli': 28.5,
  'charminar->lakdikapul': 6.7,
  'lakdikapul->charminar': 6.7,
  'lakdikapul->kphb': 16.4,
  'kphb->lakdikapul': 16.4,
  'kphb->miyapur': 3.2,
  'miyapur->kphb': 3.2,
  'maisammaguda->kphb': 10.8,
  'kphb->maisammaguda': 10.8,
  'maisammaguda->miyapur': 13.5,
  'miyapur->maisammaguda': 13.5,
  'kphb->patancheru': 20.2,
  'patancheru->kphb': 20.2,
  'ameerpet->bhel': 17.6,
  'bhel->ameerpet': 17.6,
  'sr nagar->patancheru': 24.5,
  'patancheru->sr nagar': 24.5,
  'punjagutta->mehdipatnam': 8.3,
  'mehdipatnam->punjagutta': 8.3,
  'ameerpet->mehdipatnam': 9.4,
  'mehdipatnam->ameerpet': 9.4,
  'madhapur->miyapur': 11.6,
  'miyapur->madhapur': 11.6,
  'uppal->lakdikapul': 12.9,
  'lakdikapul->uppal': 12.9,
  'lakdikapul->secunderabad': 7.1,
  'secunderabad->lakdikapul': 7.1,
  'secunderabad->kompally': 14.8,
  'kompally->secunderabad': 14.8,
  'kompally->medchal': 18.5,
  'medchal->kompally': 18.5,
  'birla mandir->lakdikapul': 1.6,
  'lakdikapul->birla mandir': 1.6,
  'lakdikapul->nalsar university': 31.4,
  'nalsar university->lakdikapul': 31.4,
  'ameerpet->patancheru': 25.8,
  'patancheru->ameerpet': 25.8,
  'uppal->gachibowli': 26.7,
  'gachibowli->uppal': 26.7,
  'ameerpet->sr nagar': 0.85,
  'sr nagar->ameerpet': 0.85,
  'lb nagar->shamshabad airport': 23.0,
  'shamshabad airport->lb nagar': 23.0,
  'lb nagar->shamshabad': 23.0,
  'shamshabad->lb nagar': 23.0,
  'lb nagar->airport': 23.0,
  'airport->lb nagar': 23.0,
  'lb nagar->pahadi shareef': 14.5,
  'pahadi shareef->lb nagar': 14.5,
  'pahadi shareef->shamshabad airport': 8.5,
  'shamshabad airport->pahadi shareef': 8.5,
  'pahadi shareef->airport': 8.5,
  'airport->pahadi shareef': 8.5,
  'lb nagar->mallapur': 13.2,
  'mallapur->lb nagar': 13.2,
  'mallapur->pahadi shareef': 28.4,
  'pahadi shareef->mallapur': 28.4
};

const locationLibrary = [
  { id: 1, name: 'Ameerpet Metro', area: 'Ameerpet', type: 'Metro', pickupHint: 'Gate 2', lat: 17.4375, lng: 78.4483 },
  { id: 2, name: 'SR Nagar Metro', area: 'SR Nagar', type: 'Metro', pickupHint: 'Gate 3', lat: 17.4418, lng: 78.4444 },
  { id: 3, name: 'Punjagutta Junction', area: 'Punjagutta', type: 'Junction', pickupHint: 'Central mall side', lat: 17.4267, lng: 78.4520 },
  { id: 4, name: 'Mehdipatnam Bus Depot', area: 'Mehdipatnam', type: 'Bus', pickupHint: 'Depot entrance', lat: 17.3949, lng: 78.4372 },
  { id: 5, name: 'Khairatabad Metro', area: 'Khairatabad', type: 'Metro', pickupHint: 'Gate 1', lat: 17.4108, lng: 78.4658 },
  { id: 6, name: 'Lakdikapul Stop', area: 'Lakdikapul', type: 'Bus', pickupHint: 'Hotel side', lat: 17.4030, lng: 78.4659 },
  { id: 7, name: 'Masab Tank', area: 'Masab Tank', type: 'Landmark', pickupHint: 'Flyover point', lat: 17.3990, lng: 78.4517 },
  { id: 8, name: 'Banjara Hills Road No 1', area: 'Banjara Hills', type: 'Landmark', pickupHint: 'City center side', lat: 17.4126, lng: 78.4482 },
  { id: 9, name: 'Jubilee Hills Check Post', area: 'Jubilee Hills', type: 'Junction', pickupHint: 'Check post signal', lat: 17.4315, lng: 78.4070 },
  { id: 10, name: 'Madhapur IT Park', area: 'Madhapur', type: 'Office', pickupHint: 'Tower A', lat: 17.4483, lng: 78.3915 },
  { id: 11, name: 'HITEC City Metro', area: 'HITEC City', type: 'Metro', pickupHint: 'Cyber towers side', lat: 17.4484, lng: 78.3830 },
  { id: 12, name: 'Gachibowli Circle', area: 'Gachibowli', type: 'Junction', pickupHint: 'Flyover circle', lat: 17.4401, lng: 78.3489 },
  { id: 13, name: 'Kondapur Botanical Garden', area: 'Kondapur', type: 'Landmark', pickupHint: 'Main gate', lat: 17.4617, lng: 78.3570 },
  { id: 14, name: 'Kothaguda Junction', area: 'Kothaguda', type: 'Junction', pickupHint: 'Signal point', lat: 17.4656, lng: 78.3722 },
  { id: 15, name: 'Miyapur Metro', area: 'Miyapur', type: 'Metro', pickupHint: 'Pillar 642', lat: 17.4933, lng: 78.3915 },
  { id: 16, name: 'Hafeezpet Station', area: 'Hafeezpet', type: 'Rail', pickupHint: 'Station entry', lat: 17.4847, lng: 78.3608 },
  { id: 17, name: 'Lingampally Station', area: 'Lingampally', type: 'Rail', pickupHint: 'East entry', lat: 17.4865, lng: 78.3170 },
  { id: 18, name: 'Kukatpally Bus Stop', area: 'Kukatpally', type: 'Bus', pickupHint: 'KPHB road', lat: 17.4948, lng: 78.3996 },
  { id: 19, name: 'KPHB Metro', area: 'KPHB', type: 'Metro', pickupHint: 'Forum mall side', lat: 17.4851, lng: 78.4120 },
  { id: 20, name: 'Moosapet Metro', area: 'Moosapet', type: 'Metro', pickupHint: 'Pillar 831', lat: 17.4668, lng: 78.4260 },
  { id: 21, name: 'Erragadda Junction', area: 'Erragadda', type: 'Junction', pickupHint: 'Main road', lat: 17.4564, lng: 78.4317 },
  { id: 22, name: 'Bharat Nagar Metro', area: 'Bharat Nagar', type: 'Metro', pickupHint: 'Station entry', lat: 17.4574, lng: 78.4514 },
  { id: 23, name: 'BHEL Township', area: 'BHEL', type: 'Work', pickupHint: 'Main circle', lat: 17.4957, lng: 78.3058 },
  { id: 24, name: 'Patancheru Bus Stop', area: 'Patancheru', type: 'Bus', pickupHint: 'Platform 1', lat: 17.5334, lng: 78.2645 },
  { id: 25, name: 'Secunderabad Railway Station', area: 'Secunderabad', type: 'Rail', pickupHint: 'Main entrance', lat: 17.4344, lng: 78.5013 },
  { id: 26, name: 'Paradise Circle', area: 'Paradise', type: 'Junction', pickupHint: 'Circle pickup', lat: 17.4410, lng: 78.4873 },
  { id: 27, name: 'Begumpet Airport Road', area: 'Begumpet', type: 'Landmark', pickupHint: 'Old airport road', lat: 17.4474, lng: 78.4663 },
  { id: 28, name: 'Rasoolpura Metro', area: 'Rasoolpura', type: 'Metro', pickupHint: 'Metro exit', lat: 17.4435, lng: 78.4756 },
  { id: 29, name: 'Tarnaka Metro', area: 'Tarnaka', type: 'Metro', pickupHint: 'University side', lat: 17.4286, lng: 78.5388 },
  { id: 30, name: 'Uppal Metro', area: 'Uppal', type: 'Metro', pickupHint: 'Depot side', lat: 17.4017, lng: 78.5600 },
  { id: 31, name: 'Nagole Metro', area: 'Nagole', type: 'Metro', pickupHint: 'Station exit', lat: 17.3918, lng: 78.5583 },
  { id: 32, name: 'LB Nagar Metro', area: 'LB Nagar', type: 'Metro', pickupHint: 'Ring road side', lat: 17.3457, lng: 78.5522 },
  { id: 33, name: 'Dilsukhnagar Bus Stop', area: 'Dilsukhnagar', type: 'Bus', pickupHint: 'Main road', lat: 17.3688, lng: 78.5247 },
  { id: 34, name: 'Malakpet Metro', area: 'Malakpet', type: 'Metro', pickupHint: 'Race course side', lat: 17.3748, lng: 78.4995 },
  { id: 35, name: 'Koti Womens College', area: 'Koti', type: 'Landmark', pickupHint: 'College gate', lat: 17.3850, lng: 78.4867 },
  { id: 36, name: 'Abids GPO', area: 'Abids', type: 'Landmark', pickupHint: 'GPO signal', lat: 17.3898, lng: 78.4766 },
  { id: 37, name: 'Nampally Station', area: 'Nampally', type: 'Rail', pickupHint: 'Station entrance', lat: 17.3920, lng: 78.4701 },
  { id: 38, name: 'Charminar', area: 'Charminar', type: 'Landmark', pickupHint: 'Laad bazaar side', lat: 17.3616, lng: 78.4747 },
  { id: 39, name: 'Afzalgunj Bus Station', area: 'Afzalgunj', type: 'Bus', pickupHint: 'CBS side', lat: 17.3714, lng: 78.4738 },
  { id: 40, name: 'Salar Jung Museum', area: 'Darulshifa', type: 'Landmark', pickupHint: 'Museum gate', lat: 17.3713, lng: 78.4804 },
  { id: 41, name: 'Tolichowki', area: 'Tolichowki', type: 'Junction', pickupHint: 'Main signal', lat: 17.3983, lng: 78.4101 },
  { id: 42, name: 'Shaikpet', area: 'Shaikpet', type: 'Junction', pickupHint: 'Dargah road', lat: 17.4087, lng: 78.3892 },
  { id: 43, name: 'Manikonda', area: 'Manikonda', type: 'Residential', pickupHint: 'Main road', lat: 17.4056, lng: 78.3763 },
  { id: 44, name: 'Narsingi Circle', area: 'Narsingi', type: 'Junction', pickupHint: 'ORR service road', lat: 17.3856, lng: 78.3573 },
  { id: 45, name: 'Kokapet', area: 'Kokapet', type: 'Residential', pickupHint: 'Financial district road', lat: 17.3947, lng: 78.3372 },
  { id: 46, name: 'Financial District', area: 'Financial District', type: 'Office', pickupHint: 'ICICI towers side', lat: 17.4149, lng: 78.3427 },
  { id: 47, name: 'Nanakramguda', area: 'Nanakramguda', type: 'Office', pickupHint: 'Wipro circle', lat: 17.4216, lng: 78.3414 },
  { id: 48, name: 'Raidurg Metro', area: 'Raidurg', type: 'Metro', pickupHint: 'Mindspace side', lat: 17.4422, lng: 78.3770 },
  { id: 49, name: 'Mindspace Junction', area: 'Mindspace', type: 'Office', pickupHint: 'Main gate', lat: 17.4414, lng: 78.3819 },
  { id: 50, name: 'Shamshabad Airport', area: 'Shamshabad', type: 'Airport', pickupHint: 'Arrivals pickup', lat: 17.2403, lng: 78.4294 },
  { id: 51, name: 'Aramghar Cross Roads', area: 'Aramghar', type: 'Junction', pickupHint: 'PVNR expressway side', lat: 17.3346, lng: 78.4539 },
  { id: 52, name: 'Attapur Pillar 143', area: 'Attapur', type: 'Landmark', pickupHint: 'Pillar 143', lat: 17.3681, lng: 78.4301 },
  { id: 53, name: 'Rajendranagar', area: 'Rajendranagar', type: 'Residential', pickupHint: 'Main road', lat: 17.3200, lng: 78.4020 },
  { id: 54, name: 'Himayat Nagar', area: 'Himayat Nagar', type: 'Commercial', pickupHint: 'Liberty road', lat: 17.4035, lng: 78.4895 },
  { id: 55, name: 'Narayanaguda Metro', area: 'Narayanaguda', type: 'Metro', pickupHint: 'YMCA side', lat: 17.3970, lng: 78.4919 },
  { id: 56, name: 'RTC X Roads', area: 'RTC X Roads', type: 'Junction', pickupHint: 'Theatre side', lat: 17.4075, lng: 78.4960 },
  { id: 57, name: 'Musheerabad', area: 'Musheerabad', type: 'Junction', pickupHint: 'Main signal', lat: 17.4168, lng: 78.4990 },
  { id: 58, name: 'Chikkadpally', area: 'Chikkadpally', type: 'Commercial', pickupHint: 'Metro road', lat: 17.4048, lng: 78.4973 },
  { id: 59, name: 'Malkajgiri Station', area: 'Malkajgiri', type: 'Rail', pickupHint: 'Station road', lat: 17.4475, lng: 78.5362 },
  { id: 60, name: 'Sainikpuri', area: 'Sainikpuri', type: 'Residential', pickupHint: 'Main circle', lat: 17.4997, lng: 78.5522 },
  { id: 61, name: 'ECIL X Roads', area: 'ECIL', type: 'Junction', pickupHint: 'Bus stop side', lat: 17.4697, lng: 78.5776 },
  { id: 62, name: 'Kompally', area: 'Kompally', type: 'Residential', pickupHint: 'Highway point', lat: 17.5403, lng: 78.4850 },
  { id: 63, name: 'Suchitra Circle', area: 'Suchitra', type: 'Junction', pickupHint: 'Circle pickup', lat: 17.5087, lng: 78.4806 },
  { id: 64, name: 'Bowenpally', area: 'Bowenpally', type: 'Residential', pickupHint: 'Market road', lat: 17.4656, lng: 78.4818 },
  { id: 65, name: 'Alwal', area: 'Alwal', type: 'Residential', pickupHint: 'Bus depot side', lat: 17.5043, lng: 78.5036 },
  { id: 66, name: 'Medchal', area: 'Medchal', type: 'Town', pickupHint: 'Highway bus stop', lat: 17.6319, lng: 78.4814 },
  { id: 67, name: 'Gandimaisamma', area: 'Gandimaisamma', type: 'Junction', pickupHint: 'ORR side', lat: 17.5760, lng: 78.4131 },
  { id: 68, name: 'Bachupally', area: 'Bachupally', type: 'Residential', pickupHint: 'Main road', lat: 17.5510, lng: 78.3867 },
  { id: 69, name: 'Nizampet', area: 'Nizampet', type: 'Residential', pickupHint: 'Village road', lat: 17.5189, lng: 78.3849 },
  { id: 70, name: 'Pragathi Nagar', area: 'Pragathi Nagar', type: 'Residential', pickupHint: 'Lake road', lat: 17.5183, lng: 78.4027 },
  { id: 71, name: 'Beeramguda', area: 'Beeramguda', type: 'Residential', pickupHint: 'Kaman road', lat: 17.5147, lng: 78.2988 },
  { id: 72, name: 'Tellapur', area: 'Tellapur', type: 'Residential', pickupHint: 'Main circle', lat: 17.4669, lng: 78.2779 },
  { id: 73, name: 'Osman Nagar', area: 'Osman Nagar', type: 'Residential', pickupHint: 'Village road', lat: 17.4497, lng: 78.2870 },
  { id: 74, name: 'Chandanagar', area: 'Chandanagar', type: 'Residential', pickupHint: 'Railway station road', lat: 17.4931, lng: 78.3327 },
  { id: 75, name: 'Serilingampally', area: 'Serilingampally', type: 'Residential', pickupHint: 'Municipal office side', lat: 17.4837, lng: 78.3158 },
  { id: 76, name: 'Quthbullapur', area: 'Quthbullapur', type: 'Residential', pickupHint: 'Main road', lat: 17.4982, lng: 78.4580 },
  { id: 77, name: 'Jeedimetla', area: 'Jeedimetla', type: 'Industrial', pickupHint: 'Industrial road', lat: 17.5151, lng: 78.4556 },
  { id: 78, name: 'Balanagar', area: 'Balanagar', type: 'Industrial', pickupHint: 'Metro side road', lat: 17.4769, lng: 78.4481 },
  { id: 79, name: 'Shapur Nagar', area: 'Shapur Nagar', type: 'Industrial', pickupHint: 'Bus stop side', lat: 17.5072, lng: 78.4455 },
  { id: 80, name: 'Amberpet', area: 'Amberpet', type: 'Residential', pickupHint: 'Main road', lat: 17.3901, lng: 78.5165 },
  { id: 81, name: 'Habsiguda Metro', area: 'Habsiguda', type: 'Metro', pickupHint: 'Station gate', lat: 17.4186, lng: 78.5435 },
  { id: 82, name: 'Nacharam', area: 'Nacharam', type: 'Industrial', pickupHint: 'IDA road', lat: 17.4292, lng: 78.5585 },
  { id: 83, name: 'Karmanghat', area: 'Karmanghat', type: 'Residential', pickupHint: 'Hanuman temple road', lat: 17.3410, lng: 78.5322 },
  { id: 84, name: 'Santoshnagar', area: 'Santoshnagar', type: 'Residential', pickupHint: 'Main road', lat: 17.3485, lng: 78.5077 },
  { id: 85, name: 'Chandrayangutta', area: 'Chandrayangutta', type: 'Junction', pickupHint: 'Flyover side', lat: 17.3186, lng: 78.4785 },
  { id: 86, name: 'Falaknuma', area: 'Falaknuma', type: 'Rail', pickupHint: 'Station road', lat: 17.3317, lng: 78.4698 },
  { id: 87, name: 'Zoo Park', area: 'Bahadurpura', type: 'Landmark', pickupHint: 'Main gate', lat: 17.3492, lng: 78.4517 },
  { id: 88, name: 'Golkonda Fort', area: 'Golkonda', type: 'Landmark', pickupHint: 'Fort entrance', lat: 17.3833, lng: 78.4011 },
  { id: 89, name: 'Film Nagar', area: 'Film Nagar', type: 'Commercial', pickupHint: 'Main road', lat: 17.4136, lng: 78.4120 },
  { id: 90, name: 'Yousufguda', area: 'Yousufguda', type: 'Residential', pickupHint: 'Check post road', lat: 17.4354, lng: 78.4273 },
  { id: 91, name: 'Birla Mandir', area: 'Naubat Pahad', type: 'Divine', pickupHint: 'Temple entrance road', lat: 17.4062, lng: 78.4691 },
  { id: 92, name: 'Tank Bund', area: 'Hussain Sagar', type: 'Tourist', pickupHint: 'Buddha statue view point', lat: 17.4239, lng: 78.4738 },
  { id: 93, name: 'Hussain Sagar Lake', area: 'Hussain Sagar', type: 'Tourist', pickupHint: 'Lake side road', lat: 17.4230, lng: 78.4730 },
  { id: 94, name: 'Necklace Road', area: 'Necklace Road', type: 'Tourist', pickupHint: 'Eat street side', lat: 17.4210, lng: 78.4656 },
  { id: 95, name: 'Lumbini Park', area: 'Lumbini Park', type: 'Park', pickupHint: 'Main ticket gate', lat: 17.4100, lng: 78.4736 },
  { id: 96, name: 'NTR Gardens', area: 'NTR Gardens', type: 'Park', pickupHint: 'Main gate', lat: 17.4121, lng: 78.4676 },
  { id: 97, name: 'Snow World', area: 'Lower Tank Bund', type: 'Amusement', pickupHint: 'Entrance gate', lat: 17.4156, lng: 78.4809 },
  { id: 98, name: 'Jalavihar Water Park', area: 'Necklace Road', type: 'Amusement', pickupHint: 'Main entrance', lat: 17.4324, lng: 78.4652 },
  { id: 99, name: 'Wonderla Hyderabad', area: 'Ravirala', type: 'Amusement', pickupHint: 'Main gate', lat: 17.2173, lng: 78.5285 },
  { id: 100, name: 'Ramoji Film City', area: 'Abdullapurmet', type: 'Tourist', pickupHint: 'Main entry plaza', lat: 17.2543, lng: 78.6808 },
  { id: 101, name: 'Chowmahalla Palace', area: 'Khilwat', type: 'Tourist', pickupHint: 'Palace entrance', lat: 17.3578, lng: 78.4717 },
  { id: 102, name: 'Mecca Masjid', area: 'Charminar', type: 'Divine', pickupHint: 'Masjid entrance', lat: 17.3605, lng: 78.4735 },
  { id: 103, name: 'Qutb Shahi Tombs', area: 'Ibrahim Bagh', type: 'Tourist', pickupHint: 'Ticket counter', lat: 17.3951, lng: 78.3968 },
  { id: 104, name: 'Taramati Baradari', area: 'Ibrahim Bagh', type: 'Tourist', pickupHint: 'Auditorium road', lat: 17.3753, lng: 78.3787 },
  { id: 105, name: 'Durgam Cheruvu Cable Bridge', area: 'Durgam Cheruvu', type: 'Tourist', pickupHint: 'Bridge viewpoint', lat: 17.4307, lng: 78.3899 },
  { id: 106, name: 'Shilparamam', area: 'HITEC City', type: 'Tourist', pickupHint: 'Craft village gate', lat: 17.4526, lng: 78.3802 },
  { id: 107, name: 'KBR National Park', area: 'Jubilee Hills', type: 'Park', pickupHint: 'Main gate', lat: 17.4239, lng: 78.4237 },
  { id: 108, name: 'Hyderabad Botanical Garden', area: 'Kondapur', type: 'Park', pickupHint: 'Main gate', lat: 17.4582, lng: 78.3578 },
  { id: 109, name: 'Sanjeevaiah Park', area: 'Hussain Sagar', type: 'Park', pickupHint: 'Park entrance', lat: 17.4320, lng: 78.4808 },
  { id: 110, name: 'Indira Park', area: 'Lower Tank Bund', type: 'Park', pickupHint: 'Main gate', lat: 17.4109, lng: 78.4833 },
  { id: 111, name: 'Mrugavani National Park', area: 'Chilkur', type: 'Park', pickupHint: 'Forest entry', lat: 17.3528, lng: 78.3360 },
  { id: 112, name: 'Chilkur Balaji Temple', area: 'Chilkur', type: 'Divine', pickupHint: 'Temple road', lat: 17.3587, lng: 78.2988 },
  { id: 113, name: 'Peddamma Temple', area: 'Jubilee Hills', type: 'Divine', pickupHint: 'Temple arch', lat: 17.4305, lng: 78.4085 },
  { id: 114, name: 'Jagannath Temple', area: 'Banjara Hills', type: 'Divine', pickupHint: 'Temple steps', lat: 17.4156, lng: 78.4266 },
  { id: 115, name: 'Ujjaini Mahankali Temple', area: 'Secunderabad', type: 'Divine', pickupHint: 'Temple street', lat: 17.4387, lng: 78.4988 },
  { id: 116, name: 'ISKCON Hyderabad', area: 'Abids', type: 'Divine', pickupHint: 'Temple entrance', lat: 17.3868, lng: 78.4802 },
  { id: 117, name: 'Spanish Mosque', area: 'Begumpet', type: 'Divine', pickupHint: 'Mosque lane', lat: 17.4448, lng: 78.4662 },
  { id: 118, name: 'Moula Ali Dargah', area: 'Moula Ali', type: 'Divine', pickupHint: 'Hill entrance', lat: 17.4668, lng: 78.5605 },
  { id: 119, name: 'St Joseph Cathedral', area: 'Abids', type: 'Divine', pickupHint: 'Cathedral gate', lat: 17.3893, lng: 78.4780 },
  { id: 120, name: 'Inorbit Mall', area: 'Madhapur', type: 'Mall', pickupHint: 'Main entrance', lat: 17.4347, lng: 78.3866 },
  { id: 121, name: 'Forum Sujana Mall', area: 'Kukatpally', type: 'Mall', pickupHint: 'Front gate', lat: 17.4848, lng: 78.3898 },
  { id: 122, name: 'GVK One Mall', area: 'Banjara Hills', type: 'Mall', pickupHint: 'Mall entrance', lat: 17.4190, lng: 78.4487 },
  { id: 123, name: 'IKEA Hyderabad', area: 'HITEC City', type: 'Mall', pickupHint: 'Pickup bay', lat: 17.4386, lng: 78.3756 },
  { id: 124, name: 'Sarath City Capital Mall', area: 'Kondapur', type: 'Mall', pickupHint: 'Main entry', lat: 17.4575, lng: 78.3635 },
  { id: 125, name: 'Laad Bazaar', area: 'Charminar', type: 'Food', pickupHint: 'Market entry', lat: 17.3612, lng: 78.4725 },
  { id: 126, name: 'Shah Ghouse Tolichowki', area: 'Tolichowki', type: 'Food', pickupHint: 'Restaurant front', lat: 17.3987, lng: 78.4204 },
  { id: 127, name: 'Paradise Restaurant', area: 'Paradise', type: 'Food', pickupHint: 'Restaurant entrance', lat: 17.4417, lng: 78.4871 },
  { id: 128, name: 'Durgam Cheruvu Park', area: 'Durgam Cheruvu', type: 'Park', pickupHint: 'Lake park gate', lat: 17.4319, lng: 78.3914 },
  { id: 129, name: 'Ocean Park', area: 'Gandipet', type: 'Amusement', pickupHint: 'Main gate', lat: 17.3914, lng: 78.3288 },
  { id: 130, name: 'Treasure Island Resort', area: 'Gandipet', type: 'Amusement', pickupHint: 'Resort entry', lat: 17.3947, lng: 78.3077 },
  { id: 131, name: 'Osmania University', area: 'Tarnaka', type: 'College', pickupHint: 'Arts college gate', lat: 17.4135, lng: 78.5288 },
  { id: 132, name: 'University College of Engineering OU', area: 'Tarnaka', type: 'College', pickupHint: 'Engineering college gate', lat: 17.4157, lng: 78.5289 },
  { id: 133, name: 'Hyderabad Central University', area: 'Gachibowli', type: 'College', pickupHint: 'Main gate', lat: 17.4576, lng: 78.3324 },
  { id: 134, name: 'IIIT Hyderabad', area: 'Gachibowli', type: 'College', pickupHint: 'Main gate', lat: 17.4451, lng: 78.3499 },
  { id: 135, name: 'ISB Hyderabad', area: 'Gachibowli', type: 'College', pickupHint: 'Campus gate', lat: 17.4344, lng: 78.3406 },
  { id: 136, name: 'JNTU Hyderabad', area: 'Kukatpally', type: 'College', pickupHint: 'Main gate', lat: 17.4933, lng: 78.3915 },
  { id: 137, name: 'NALSAR University', area: 'Shamirpet', type: 'College', pickupHint: 'University gate', lat: 17.5972, lng: 78.5453 },
  { id: 138, name: 'English and Foreign Languages University', area: 'Tarnaka', type: 'College', pickupHint: 'EFLU gate', lat: 17.4210, lng: 78.5275 },
  { id: 139, name: 'Maulana Azad National Urdu University', area: 'Gachibowli', type: 'College', pickupHint: 'MANUU gate', lat: 17.4264, lng: 78.3315 },
  { id: 140, name: 'BITS Pilani Hyderabad Campus', area: 'Shamirpet', type: 'College', pickupHint: 'Campus gate', lat: 17.5449, lng: 78.5725 },
  { id: 141, name: 'ICFAI Foundation for Higher Education', area: 'Dontanpally', type: 'College', pickupHint: 'Campus entry', lat: 17.3890, lng: 78.2244 },
  { id: 142, name: 'CBIT Hyderabad', area: 'Gandipet', type: 'College', pickupHint: 'College gate', lat: 17.3915, lng: 78.3193 },
  { id: 143, name: 'MGIT Hyderabad', area: 'Gandipet', type: 'College', pickupHint: 'College gate', lat: 17.3901, lng: 78.3199 },
  { id: 144, name: 'VNR VJIET', area: 'Bachupally', type: 'College', pickupHint: 'Main gate', lat: 17.5381, lng: 78.3867 },
  { id: 145, name: 'Gokaraju Rangaraju Institute of Engineering', area: 'Bachupally', type: 'College', pickupHint: 'Main gate', lat: 17.5208, lng: 78.3670 },
  { id: 146, name: 'Malla Reddy University', area: 'Maisammaguda', type: 'College', pickupHint: 'University entrance', lat: 17.5947, lng: 78.4432 },
  { id: 147, name: 'CMR College of Engineering', area: 'Kandlakoya', type: 'College', pickupHint: 'Main gate', lat: 17.6062, lng: 78.4867 },
  { id: 148, name: 'St Francis College for Women', area: 'Begumpet', type: 'College', pickupHint: 'College gate', lat: 17.4374, lng: 78.4600 },
  { id: 149, name: 'Villa Marie College', area: 'Somajiguda', type: 'College', pickupHint: 'College front', lat: 17.4230, lng: 78.4599 },
  { id: 150, name: 'Nizam College', area: 'Basheerbagh', type: 'College', pickupHint: 'College gate', lat: 17.3992, lng: 78.4766 },
  { id: 151, name: 'St Anns College for Women', area: 'Mehdipatnam', type: 'College', pickupHint: 'College entrance', lat: 17.3944, lng: 78.4337 },
  { id: 152, name: 'Loyola Academy', area: 'Alwal', type: 'College', pickupHint: 'Academy gate', lat: 17.5058, lng: 78.4887 },
  { id: 153, name: 'Badruka College', area: 'Kachiguda', type: 'College', pickupHint: 'College lane', lat: 17.3908, lng: 78.4962 },
  { id: 154, name: 'Bhavans Vivekananda College', area: 'Sainikpuri', type: 'College', pickupHint: 'College gate', lat: 17.4961, lng: 78.5512 },
  { id: 155, name: 'Avinash College of Commerce', area: 'Kukatpally', type: 'College', pickupHint: 'Main entrance', lat: 17.4938, lng: 78.3998 },
  { id: 156, name: 'Anurag University', area: 'Ghatkesar', type: 'College', pickupHint: 'University gate', lat: 17.4205, lng: 78.6554 },
  { id: 157, name: 'CVR College of Engineering', area: 'Ibrahimpatnam', type: 'College', pickupHint: 'College gate', lat: 17.1961, lng: 78.5970 },
  { id: 158, name: 'Vasavi College of Engineering', area: 'Ibrahim Bagh', type: 'College', pickupHint: 'College entrance', lat: 17.3829, lng: 78.3826 },
  { id: 159, name: 'Muffakham Jah College', area: 'Banjara Hills', type: 'College', pickupHint: 'College gate', lat: 17.4167, lng: 78.4398 },
  { id: 160, name: 'Deccan College of Engineering', area: 'Darussalam', type: 'College', pickupHint: 'College gate', lat: 17.3896, lng: 78.4627 },
  { id: 161, name: 'IIT Hyderabad City Office', area: 'Kukatpally', type: 'Institution', pickupHint: 'City office road', lat: 17.4930, lng: 78.4000 },
  { id: 162, name: 'CCMB Hyderabad', area: 'Habsiguda', type: 'Institution', pickupHint: 'Research centre gate', lat: 17.4216, lng: 78.5496 },
  { id: 163, name: 'NGRI Hyderabad', area: 'Uppal Road', type: 'Institution', pickupHint: 'Institute gate', lat: 17.4169, lng: 78.5524 },
  { id: 164, name: 'IICT Hyderabad', area: 'Tarnaka', type: 'Institution', pickupHint: 'Institute entrance', lat: 17.4228, lng: 78.5410 },
  { id: 165, name: 'NIN Hyderabad', area: 'Tarnaka', type: 'Institution', pickupHint: 'Institute gate', lat: 17.4241, lng: 78.5296 },
  { id: 166, name: 'CDAC Hyderabad', area: 'Gachibowli', type: 'Institution', pickupHint: 'Knowledge city side', lat: 17.4448, lng: 78.3497 },
  { id: 167, name: 'T-Hub', area: 'Raidurg', type: 'Institution', pickupHint: 'Innovation hub entrance', lat: 17.4384, lng: 78.3811 },
  { id: 168, name: 'T-Works', area: 'Raidurg', type: 'Institution', pickupHint: 'Main entry', lat: 17.4388, lng: 78.3799 },
  { id: 169, name: 'TSRTC Rathifile Bus Station', area: 'Secunderabad', type: 'Institution', pickupHint: 'Bus station entry', lat: 17.4340, lng: 78.5028 },
  { id: 170, name: 'Hyderabad High Court', area: 'Afzalgunj', type: 'Institution', pickupHint: 'High court road', lat: 17.3718, lng: 78.4755 },
  { id: 171, name: 'Telangana Secretariat', area: 'Hussain Sagar', type: 'Institution', pickupHint: 'Secretariat gate', lat: 17.4127, lng: 78.4702 },
  { id: 172, name: 'Assembly Metro', area: 'Assembly', type: 'Institution', pickupHint: 'Assembly road', lat: 17.3985, lng: 78.4739 },
  { id: 173, name: 'Ravindra Bharathi', area: 'Lakdikapul', type: 'Institution', pickupHint: 'Auditorium entrance', lat: 17.4039, lng: 78.4695 },
  { id: 174, name: 'Apollo Hospitals Jubilee Hills', area: 'Jubilee Hills', type: 'Hospital', pickupHint: 'Emergency gate', lat: 17.4202, lng: 78.4120 },
  { id: 175, name: 'Yashoda Hospitals Secunderabad', area: 'Secunderabad', type: 'Hospital', pickupHint: 'Hospital entrance', lat: 17.4429, lng: 78.4982 },
  { id: 176, name: 'KIMS Hospital Secunderabad', area: 'Begumpet', type: 'Hospital', pickupHint: 'Main block entrance', lat: 17.4399, lng: 78.4842 },
  { id: 177, name: 'AIG Hospitals', area: 'Gachibowli', type: 'Hospital', pickupHint: 'Main entry', lat: 17.4408, lng: 78.3682 },
  { id: 178, name: 'Care Hospitals Banjara Hills', area: 'Banjara Hills', type: 'Hospital', pickupHint: 'Care entrance', lat: 17.4128, lng: 78.4509 },
  { id: 179, name: 'NIMS Hospital', area: 'Punjagutta', type: 'Hospital', pickupHint: 'Main gate', lat: 17.4258, lng: 78.4511 },
  { id: 180, name: 'Osmania General Hospital', area: 'Afzalgunj', type: 'Hospital', pickupHint: 'Hospital gate', lat: 17.3715, lng: 78.4743 },
  { id: 181, name: 'Gandhi Hospital', area: 'Musheerabad', type: 'Hospital', pickupHint: 'Emergency block', lat: 17.4245, lng: 78.5026 },
  { id: 182, name: 'Continental Hospitals', area: 'Gachibowli', type: 'Hospital', pickupHint: 'Hospital entrance', lat: 17.4189, lng: 78.3446 },
  { id: 183, name: 'Sunshine Hospitals Gachibowli', area: 'Gachibowli', type: 'Hospital', pickupHint: 'Front gate', lat: 17.4435, lng: 78.3564 },
  { id: 184, name: 'Biodiversity Junction', area: 'Gachibowli', type: 'Junction', pickupHint: 'Flyover signal', lat: 17.4423, lng: 78.3570 },
  { id: 185, name: 'Cyber Towers Junction', area: 'HITEC City', type: 'Junction', pickupHint: 'Cyber towers signal', lat: 17.4494, lng: 78.3808 },
  { id: 186, name: 'IKEA Junction', area: 'Raidurg', type: 'Junction', pickupHint: 'IKEA signal', lat: 17.4389, lng: 78.3759 },
  { id: 187, name: 'Madhapur Police Station Junction', area: 'Madhapur', type: 'Junction', pickupHint: 'Signal point', lat: 17.4470, lng: 78.3919 },
  { id: 188, name: 'Kothaguda X Roads', area: 'Kothaguda', type: 'Junction', pickupHint: 'X roads signal', lat: 17.4658, lng: 78.3733 },
  { id: 189, name: 'Miyapur X Roads', area: 'Miyapur', type: 'Junction', pickupHint: 'Metro signal', lat: 17.4934, lng: 78.3912 },
  { id: 190, name: 'JNTU Junction', area: 'Kukatpally', type: 'Junction', pickupHint: 'University signal', lat: 17.4936, lng: 78.3919 },
  { id: 191, name: 'Kukatpally Y Junction', area: 'Kukatpally', type: 'Junction', pickupHint: 'Y junction road', lat: 17.4877, lng: 78.4138 },
  { id: 192, name: 'Moosapet Y Junction', area: 'Moosapet', type: 'Junction', pickupHint: 'Y junction signal', lat: 17.4672, lng: 78.4269 },
  { id: 193, name: 'Erragadda ESI Junction', area: 'Erragadda', type: 'Junction', pickupHint: 'ESI metro side', lat: 17.4577, lng: 78.4356 },
  { id: 194, name: 'Ameerpet X Roads', area: 'Ameerpet', type: 'Junction', pickupHint: 'Metro junction', lat: 17.4373, lng: 78.4488 },
  { id: 195, name: 'Somajiguda Circle', area: 'Somajiguda', type: 'Junction', pickupHint: 'Circle point', lat: 17.4235, lng: 78.4595 },
  { id: 196, name: 'Basheerbagh Junction', area: 'Basheerbagh', type: 'Junction', pickupHint: 'Signal point', lat: 17.3994, lng: 78.4769 },
  { id: 197, name: 'Liberty Junction', area: 'Himayat Nagar', type: 'Junction', pickupHint: 'Liberty signal', lat: 17.4056, lng: 78.4818 },
  { id: 198, name: 'Narayanguda Junction', area: 'Narayanaguda', type: 'Junction', pickupHint: 'YMCA signal', lat: 17.3968, lng: 78.4915 },
  { id: 199, name: 'Dilsukhnagar X Roads', area: 'Dilsukhnagar', type: 'Junction', pickupHint: 'Metro signal', lat: 17.3687, lng: 78.5246 },
  { id: 200, name: 'LB Nagar Ring Road Junction', area: 'LB Nagar', type: 'Junction', pickupHint: 'Ring road signal', lat: 17.3456, lng: 78.5521 },
  { id: 201, name: 'Aramghar Junction', area: 'Aramghar', type: 'Junction', pickupHint: 'PVNR pillar side', lat: 17.3348, lng: 78.4535 },
  { id: 202, name: 'Shamshabad Junction', area: 'Shamshabad', type: 'Junction', pickupHint: 'Airport road', lat: 17.2603, lng: 78.3969 },
  { id: 203, name: 'Tolichowki X Roads', area: 'Tolichowki', type: 'Junction', pickupHint: 'Main signal', lat: 17.3984, lng: 78.4105 },
  { id: 204, name: 'Nanakramguda Circle', area: 'Nanakramguda', type: 'Junction', pickupHint: 'Wipro circle', lat: 17.4217, lng: 78.3416 },
  { id: 205, name: 'Financial District Junction', area: 'Financial District', type: 'Junction', pickupHint: 'ISB road signal', lat: 17.4151, lng: 78.3429 },
  { id: 206, name: 'Kompally Junction', area: 'Kompally', type: 'Junction', pickupHint: 'Highway signal', lat: 17.5401, lng: 78.4847 },
  { id: 207, name: 'Suchitra Junction', area: 'Suchitra', type: 'Junction', pickupHint: 'Circle signal', lat: 17.5089, lng: 78.4807 },
  { id: 208, name: 'ECIL X Roads', area: 'ECIL', type: 'Junction', pickupHint: 'Main signal', lat: 17.4698, lng: 78.5778 },
  { id: 209, name: 'Uppal X Roads', area: 'Uppal', type: 'Junction', pickupHint: 'Metro side signal', lat: 17.4018, lng: 78.5601 },
  { id: 210, name: 'Nagole X Roads', area: 'Nagole', type: 'Junction', pickupHint: 'Metro junction', lat: 17.3919, lng: 78.5581 },
  { id: 211, name: 'Pahadi Shareef', area: 'Pahadi Shareef', type: 'Junction', pickupHint: 'Airport road side', lat: 17.2767, lng: 78.4722 },
  { id: 212, name: 'Mamidipally', area: 'Mamidipally', type: 'Residential', pickupHint: 'Airport approach road', lat: 17.2539, lng: 78.4500 },
  { id: 213, name: 'Mallapur', area: 'Mallapur', type: 'Residential', pickupHint: 'Main road', lat: 17.4404, lng: 78.5783 }
];

const savedTrips = [
  { id: 'T-1021', route: 'Ameerpet to BHEL', date: 'Today', fare: 15, status: 'Completed' },
  { id: 'T-1018', route: 'Madhapur to Miyapur', date: 'Yesterday', fare: 30, status: 'Completed' },
  { id: 'T-1011', route: 'Punjagutta to Lingampally', date: 'May 24', fare: 10, status: 'Shared' }
];

const riderOffers = [
  'Save Rs 10 on your shared car ride',
  'Invite a rider and earn 50 wallet points',
  'No convenience fee on UPI payments today'
];

function normalize(value) {
  return value.trim().toLowerCase();
}

function resolveLocationArea(value) {
  const normalizedValue = normalize(value);
  const exactMatch = locationLibrary.find((location) => {
    const name = normalize(location.name);
    const area = normalize(location.area);

    return name === normalizedValue || area === normalizedValue;
  });
  const airportMatch = normalizedValue.includes('airport')
    ? locationLibrary.find((location) => location.type === 'Airport')
    : null;
  const fuzzyMatch = locationLibrary.find((location) => {
    const name = normalize(location.name);
    const area = normalize(location.area);

    return name.includes(normalizedValue) || area.includes(normalizedValue);
  });
  const matchedLocation = exactMatch || airportMatch || fuzzyMatch;

  return matchedLocation?.area || value;
}

function getLocationPoint(value) {
  const normalizedValue = normalize(value);

  const exactMatch = locationLibrary.find((location) => {
    const name = normalize(location.name);
    const area = normalize(location.area);

    return name === normalizedValue || area === normalizedValue;
  });
  const airportMatch = normalizedValue.includes('airport')
    ? locationLibrary.find((location) => location.type === 'Airport')
    : null;
  const fuzzyMatch = locationLibrary.find((location) => {
    const name = normalize(location.name);
    const area = normalize(location.area);

    return name.includes(normalizedValue) || area.includes(normalizedValue);
  });

  return exactMatch || airportMatch || fuzzyMatch;
}

function getDistanceKm(from, to) {
  if (!from || !to) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latDistance = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDistance = ((to.lng - from.lng) * Math.PI) / 180;
  const startLat = (from.lat * Math.PI) / 180;
  const endLat = (to.lat * Math.PI) / 180;
  const a = Math.sin(latDistance / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearingDegrees(from, to) {
  if (!from || !to) {
    return 0;
  }

  const startLat = (from.lat * Math.PI) / 180;
  const endLat = (to.lat * Math.PI) / 180;
  const lngDistance = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(lngDistance) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat)
    - Math.sin(startLat) * Math.cos(endLat) * Math.cos(lngDistance);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function getBearingDiff(a, b) {
  const diff = Math.abs(a - b) % 360;

  return diff > 180 ? 360 - diff : diff;
}

function getDirectionName(bearing) {
  if (bearing >= 337.5 || bearing < 22.5) return 'North';
  if (bearing < 67.5) return 'North East';
  if (bearing < 112.5) return 'East';
  if (bearing < 157.5) return 'South East';
  if (bearing < 202.5) return 'South';
  if (bearing < 247.5) return 'South West';
  if (bearing < 292.5) return 'West';

  return 'North West';
}

function getPickupDistanceMeters(pickup, ride) {
  const pickupPoint = getLocationPoint(pickup);
  const ridePoint = getLocationPoint(ride.pickup);
  const distanceKm = getDistanceKm(pickupPoint, ridePoint);

  return distanceKm === null ? ride.pickupDistance : Math.round(distanceKm * 1000);
}

function getLegDistanceKm(from, to) {
  const distanceKey = `${normalize(from)}->${normalize(to)}`;

  if (roadDistanceKm[distanceKey]) {
    return roadDistanceKm[distanceKey];
  }

  const straightDistanceKm = getDistanceKm(getLocationPoint(from), getLocationPoint(to)) ?? 3;

  // Local demo fallback. In production, replace this with Google Distance Matrix or Routes API.
  return straightDistanceKm * 1.35;
}

function scorePlan(plan) {
  const distanceKm = plan.reduce((total, leg) => total + getLegDistanceKm(leg.from, leg.to), 0);
  const fare = plan.reduce((total, leg) => total + (leg.ride?.fare ?? 0), 0);
  const hops = plan.filter((leg) => !leg.transfer).length;
  const startPoint = getLocationPoint(plan[0]?.from);
  const endPoint = getLocationPoint(plan[plan.length - 1]?.to);
  const targetBearing = getBearingDegrees(startPoint, endPoint);
  const directionPenalty = plan.reduce((total, leg) => {
    const legBearing = getBearingDegrees(getLocationPoint(leg.from), getLocationPoint(leg.to));
    const diff = getBearingDiff(targetBearing, legBearing);

    return total + (diff > 100 ? 18 : diff > 70 ? 8 : 0);
  }, 0);

  return {
    distanceKm,
    fare,
    hops,
    routeCount: Math.max(2, Math.min(4, hops + 1)),
    direction: getDirectionName(targetBearing),
    score: distanceKm * 10 + hops * 6 + fare * 0.1 + directionPenalty
  };
}

function getNearestRelayHub(value) {
  const point = getLocationPoint(value);
  const rankedHubs = relayHubs
    .map((hub) => {
      const hubPoint = getLocationPoint(hub);
      const distanceKm = getDistanceKm(point, hubPoint);

      return { hub, distanceKm: distanceKm ?? Number.POSITIVE_INFINITY };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return rankedHubs[0] ?? { hub: 'Lakdikapul', distanceKm: 0 };
}

function getDirectionalRelayHubs(pickup, destination) {
  const startPoint = getLocationPoint(pickup);
  const endPoint = getLocationPoint(destination);
  const targetBearing = getBearingDegrees(startPoint, endPoint);

  return relayHubs
    .map((hub) => {
      const hubPoint = getLocationPoint(hub);
      const startDistance = getDistanceKm(startPoint, hubPoint) ?? Number.POSITIVE_INFINITY;
      const endDistance = getDistanceKm(hubPoint, endPoint) ?? Number.POSITIVE_INFINITY;
      const hubBearing = getBearingDegrees(startPoint, hubPoint);
      const directionDiff = getBearingDiff(targetBearing, hubBearing);

      return {
        hub,
        score: startDistance + endDistance + directionDiff * 0.08,
        directionDiff
      };
    })
    .filter((hub) => hub.directionDiff <= 105)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((hub) => hub.hub);
}

function createRelayRide(id, from, to, vehicle, fare, eta) {
  return {
    id,
    driver: 'Shared Pool Ride',
    route: `${from} -> ${to}`,
    pickup: from,
    destination: to,
    via: [from, to],
    pickupDistance: 0,
    vehicle,
    seats: 4,
    fare,
    eta,
    rating: 4.6,
    verified: true,
    relay: true
  };
}

function getLegRiders(leg) {
  const routeKey = `${normalize(leg.from)}-${normalize(leg.to)}`;
  const names = ['Akash', 'Divya', 'Nikhil', 'Pooja', 'Sai', 'Varun'];
  const vehiclesForLeg = leg.ride.vehicle === 'Bike' ? ['Bike', 'Bike', 'Car'] : ['Car', 'Bike', 'Car'];

  return names.slice(0, 3).map((name, index) => ({
    id: `${routeKey}-${index}`,
    name,
    vehicle: vehiclesForLeg[index],
    seats: vehiclesForLeg[index] === 'Bike' ? 1 : 3,
    eta: Math.max(3, leg.ride.eta + index),
    fare: Math.max(10, leg.ride.fare - index * 2),
    rating: (4.6 + index * 0.1).toFixed(1),
    pickup: leg.from
  }));
}

function getDriverCountForLeg(leg) {
  return getLegRiders(leg).length;
}

function getRadiusLabel(distanceMeters) {
  if (distanceMeters <= 500) {
    return 'within 500m';
  }

  if (distanceMeters <= 1000) {
    return 'within 1 km';
  }

  return 'within 1.5 km';
}

function getGoogleMapsUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
}

function getPinStyle(location) {
  const left = ((location.lng - hydMapBounds.minLng) / (hydMapBounds.maxLng - hydMapBounds.minLng)) * 100;
  const top = ((hydMapBounds.maxLat - location.lat) / (hydMapBounds.maxLat - hydMapBounds.minLat)) * 100;

  return {
    left: `${Math.min(96, Math.max(4, left))}%`,
    top: `${Math.min(94, Math.max(6, top))}%`
  };
}

function matchesRoute(ride, pickup, destination) {
  const routeStops = ride.via.map(normalize);
  const pickupIndex = routeStops.findIndex((stop) => stop.includes(normalize(pickup)));
  const destinationIndex = routeStops.findIndex((stop) => stop.includes(normalize(destination)));

  if (!pickup || !destination) {
    return true;
  }

  return pickupIndex !== -1 && destinationIndex !== -1 && pickupIndex < destinationIndex;
}

function touchesRoute(ride, pickup, destination) {
  const routeStops = ride.via.map(normalize);
  const normalizedPickup = normalize(pickup);
  const normalizedDestination = normalize(destination);

  return routeStops.some((stop) => stop.includes(normalizedPickup) || stop.includes(normalizedDestination));
}

function movesTowardDestination(from, to, destination) {
  const fromDistance = getLegDistanceKm(from, destination);
  const toDistance = getLegDistanceKm(to, destination);

  return toDistance < fromDistance - 0.2;
}

function findConnectedPlans(pickup, destination, eligibleRides, limit = 3) {
  const start = resolveLocationArea(pickup);
  const end = resolveLocationArea(destination);
  const normalizedEnd = normalize(end);
  const endPoint = getLocationPoint(end);
  const queue = [{ stop: start, legs: [], visited: new Set([normalize(start)]) }];
  const plans = [];
  const nearbyStarts = eligibleRides
    .map((ride) => ({ ride, distanceMeters: getPickupDistanceMeters(start, ride) }))
    .filter(({ ride, distanceMeters }) => distanceMeters <= 1500 && normalize(ride.pickup) !== normalize(start));

  nearbyStarts.forEach(({ ride, distanceMeters }) => {
    queue.push({
      stop: ride.pickup,
      legs: [{
        ride: null,
        from: start,
        to: ride.pickup,
        transfer: true,
        distanceMeters,
        note: `Move to nearby boarding point ${getRadiusLabel(distanceMeters)}`
      }],
      visited: new Set([normalize(start), normalize(ride.pickup)])
    });
  });

  while (queue.length) {
    const current = queue.shift();
    const currentPoint = getLocationPoint(current.stop);
    const destinationDistanceKm = getDistanceKm(currentPoint, endPoint);

    if (
      normalize(current.stop) === normalizedEnd
      || normalize(current.stop).includes(normalizedEnd)
      || normalizedEnd.includes(normalize(current.stop))
      || (destinationDistanceKm !== null && destinationDistanceKm <= 1.5)
    ) {
      if (destinationDistanceKm !== null && destinationDistanceKm <= 0.1) {
        plans.push(current.legs);
        continue;
      }

      if (normalize(current.stop) !== normalizedEnd && destinationDistanceKm !== null) {
        plans.push([
          ...current.legs,
          {
            ride: null,
            from: current.stop,
            to: end,
            transfer: true,
            distanceMeters: Math.round(destinationDistanceKm * 1000),
            note: `Final stop is ${Math.round(destinationDistanceKm * 1000)}m from arrival`
          }
        ]);
        continue;
      }

      plans.push(current.legs);
      continue;
    }

    if (current.legs.length >= 7) {
      continue;
    }

    eligibleRides.forEach((ride) => {
      const stops = ride.via;
      const currentIndex = stops.findIndex((stop) => normalize(stop) === normalize(current.stop));

      if (currentIndex === -1) {
        return;
      }

      for (let nextIndex = stops.length - 1; nextIndex > currentIndex; nextIndex -= 1) {
        const nextStop = stops[nextIndex];
        const normalizedNext = normalize(nextStop);

        if (current.visited.has(normalizedNext)) {
          continue;
        }

        if (!movesTowardDestination(current.stop, nextStop, end)) {
          continue;
        }

        const nextVisited = new Set(current.visited);
        nextVisited.add(normalizedNext);
        queue.push({
          stop: nextStop,
          legs: [...current.legs, { ride, from: current.stop, to: nextStop, transfer: false }],
          visited: nextVisited
        });
      }
    });
  }

  return plans
    .map((plan) => ({ plan, meta: scorePlan(plan) }))
    .sort((a, b) => a.meta.score - b.meta.score)
    .slice(0, limit);
}

function buildUniversalRelayPlan(pickup, destination) {
  const start = resolveLocationArea(pickup);
  const end = resolveLocationArea(destination);
  const startHub = getNearestRelayHub(start);
  const endHub = getNearestRelayHub(end);
  const directionalHubs = getDirectionalRelayHubs(start, end);
  const intermediateStops = [startHub.hub, ...directionalHubs, endHub.hub]
    .filter((stop) => stop && normalize(stop) !== normalize(start) && normalize(stop) !== normalize(end))
    .filter((stop, index, allStops) => allStops.findIndex((item) => normalize(item) === normalize(stop)) === index);
  const candidateStops = [start, ...intermediateStops, end];
  const stops = candidateStops.reduce((selectedStops, stop, index) => {
    if (index === 0 || index === candidateStops.length - 1) {
      return [...selectedStops, stop];
    }

    const previousStop = selectedStops[selectedStops.length - 1];
    const previousToEnd = getLegDistanceKm(previousStop, end);
    const stopToEnd = getLegDistanceKm(stop, end);
    const previousToStop = getLegDistanceKm(previousStop, stop);
    const movesCloser = stopToEnd < previousToEnd - 0.4;
    const avoidsDetour = previousToStop + stopToEnd <= previousToEnd * 1.35;

    return movesCloser && avoidsDetour ? [...selectedStops, stop] : selectedStops;
  }, []);

  const plan = stops.slice(0, -1).map((from, index) => {
    const to = stops[index + 1];
    const distanceKm = getLegDistanceKm(from, to);
    const isFeeder = index === 0 || index === stops.length - 2;
    const fare = Math.max(12, Math.round(distanceKm * (isFeeder ? 8 : 5)));

    return {
      ride: createRelayRide(`relay-${index}-${from}-${to}`, from, to, isFeeder ? 'Bike' : 'Car', fare, Math.max(4, Math.round(distanceKm * 2))),
      from,
      to,
      transfer: false,
      relay: true,
      note: isFeeder ? 'Local feeder ride' : 'Hub connector ride'
    };
  });

  return { plan, meta: scorePlan(plan) };
}

export default function App() {
  const [pickup, setPickup] = useState('Ameerpet');
  const [destination, setDestination] = useState('Patancheru');
  const [vehicleType, setVehicleType] = useState('Any');
  const [requiredSeats, setRequiredSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [alternateMatches, setAlternateMatches] = useState([]);
  const [connectedPlan, setConnectedPlan] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedRouteOptionIndex, setSelectedRouteOptionIndex] = useState(0);
  const [selectedLeg, setSelectedLeg] = useState(null);
  const [selectedPickupRiderId, setSelectedPickupRiderId] = useState(null);
  const [selectedPickupRider, setSelectedPickupRider] = useState(null);
  const [selectedDirectRideId, setSelectedDirectRideId] = useState(null);
  const [directRideRiders, setDirectRideRiders] = useState([]);
  const [driverAlert, setDriverAlert] = useState(null);
  const [routeLocked, setRouteLocked] = useState(false);
  const [rideStage, setRideStage] = useState('idle');
  const [feedback, setFeedback] = useState({ driver: '', website: '' });
  const [rejectedRiderIds, setRejectedRiderIds] = useState([]);
  const [submittedDriverReviews, setSubmittedDriverReviews] = useState([]);
  const [websiteReviewSubmitted, setWebsiteReviewSubmitted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [nextLegRequests, setNextLegRequests] = useState({});
  const [journeyComplete, setJourneyComplete] = useState(false);
  const [validationInfo, setValidationInfo] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [bookedRideId, setBookedRideId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Set your route and find a budget ride nearby.');
  const [activePanel, setActivePanel] = useState('profile');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [walletBalance, setWalletBalance] = useState(260);
  const [paymentStatus, setPaymentStatus] = useState('Choose a ride to unlock payment.');
  const [selectedLocationId, setSelectedLocationId] = useState(1);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationCategory, setLocationCategory] = useState('All');
  const [riderProfile, setRiderProfile] = useState({
    name: 'Ananya Rao',
    phone: '+91 98765 43210',
    email: 'ananya@riderelay.in',
    home: 'Ameerpet',
    emergency: '+91 91234 56780'
  });

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const availableStops = useMemo(() => {
    return [...new Set([
      ...liveDrivers.flatMap((ride) => ride.via),
      ...locationLibrary.flatMap((location) => [location.name, location.area])
    ])].sort();
  }, []);

  const totalAvailableSeats = useMemo(() => {
    return liveDrivers.reduce((total, ride) => total + ride.seats, 0);
  }, []);

  const bookedRide = useMemo(() => {
    return liveDrivers.find((ride) => ride.id === bookedRideId);
  }, [bookedRideId]);

  const filteredLocations = useMemo(() => {
    const searchText = normalize(locationSearch);

    return locationLibrary.filter((location) => {
      const categoryMatches = locationCategory === 'All'
        || location.type === locationCategory
        || (locationCategory === 'Commute' && ['Metro', 'Bus', 'Rail', 'Junction', 'Residential', 'Town', 'Industrial'].includes(location.type));
      const textMatches = !searchText || [location.name, location.area, location.type, location.pickupHint, String(location.lat), String(location.lng)]
        .map(normalize)
        .some((value) => value.includes(searchText));

      return categoryMatches && textMatches;
    });
  }, [locationSearch, locationCategory]);

  const handleFindRide = () => {
    setLoading(true);
    setBookedRideId(null);
    setHasSearched(true);
    setAlternateMatches([]);
    setConnectedPlan([]);
    setRouteOptions([]);
    setSelectedRouteOptionIndex(0);
    setSelectedLeg(null);
    setSelectedPickupRiderId(null);
    setSelectedPickupRider(null);
    setSelectedDirectRideId(null);
    setDirectRideRiders([]);
    setDriverAlert(null);
    setRouteLocked(false);
    setRideStage('idle');
    setFeedback({ driver: '', website: '' });
    setRejectedRiderIds([]);
    setSubmittedDriverReviews([]);
    setWebsiteReviewSubmitted(false);
    setCompletedSteps([]);
    setNextLegRequests({});
    setJourneyComplete(false);
    setValidationInfo(null);
    setStatusMessage('Checking live routes near your pickup point...');

    setTimeout(() => {
      const routePickup = resolveLocationArea(pickup);
      const routeDestination = resolveLocationArea(destination);
      const eligibleRides = liveDrivers
        .filter((ride) => ride.seats >= requiredSeats)
        .filter((ride) => vehicleType === 'Any' || ride.vehicle === vehicleType);
      const filtered = eligibleRides
        .filter((ride) => matchesRoute(ride, routePickup, routeDestination))
        .map((ride) => {
          const distanceMeters = getPickupDistanceMeters(routePickup, ride);
          const routeDistance = getLegDistanceKm(ride.pickup, ride.destination);

          return {
            ...ride,
            displayDistance: distanceMeters,
            radiusLabel: getRadiusLabel(distanceMeters),
            routeDistance
          };
        })
        .filter((ride) => ride.displayDistance <= 1500)
        .sort((a, b) => a.eta - b.eta || b.rating - a.rating);
      const connectedRidePlans = filtered.length ? [] : findConnectedPlans(routePickup, routeDestination, eligibleRides);
      const relayPlan = filtered.length || connectedRidePlans.length ? null : buildUniversalRelayPlan(routePickup, routeDestination);
      const options = connectedRidePlans.length ? connectedRidePlans : relayPlan ? [relayPlan] : [];
      const plan = options[0]?.plan ?? [];
      const selectedRouteDistance = options[0]?.meta.distanceKm
        ?? (filtered.length ? filtered[0].routeDistance : 0);
      const tripDistance = getLegDistanceKm(routePickup, routeDestination);
      const isShortRide = tripDistance <= 9;
      const alternates = filtered.length
        ? []
        : eligibleRides
          .filter((ride) => touchesRoute(ride, routePickup, routeDestination))
          .filter((ride) => movesTowardDestination(routePickup, ride.destination, routeDestination))
          .map((ride) => {
            const distanceMeters = getPickupDistanceMeters(routePickup, ride);
            const routeDistance = getLegDistanceKm(routePickup, ride.destination);

            return {
              ...ride,
              displayDistance: distanceMeters,
              radiusLabel: getRadiusLabel(distanceMeters),
              routeDistance
            };
          })
          .filter((ride) => ride.displayDistance <= 1500)
          .sort((a, b) => a.eta - b.eta || b.rating - a.rating)
          .slice(0, 3);

      setMatches(filtered);
      setConnectedPlan(plan);
      setRouteOptions(options);
      setAlternateMatches(plan.length ? [] : alternates);
      setValidationInfo({
        distanceKm: tripDistance,
        routeDistanceKm: selectedRouteDistance,
        isShortRide,
        mode: filtered.length && isShortRide ? 'Direct route' : 'Multi-hop route',
        routeCount: options.length || (filtered.length ? 1 : alternates.length)
      });
      setLoading(false);
      setStatusMessage(
        filtered.length
          ? `${filtered.length} direct ride${filtered.length > 1 ? 's' : ''} found. Multi-hop is not needed.`
          : plan.length
            ? `Connected route ready with ${plan.length} ride${plan.length > 1 ? 's' : ''} to reach your destination.`
            : alternates.length
              ? 'No direct rider right now. Alternate nearby route options are available below.'
            : 'Sorry, no riders are available for this route right now.'
      );
    }, 900);
  };

  const handleQuickRoute = ([nextPickup, nextDestination]) => {
    setPickup(nextPickup);
    setDestination(nextDestination);
    setStatusMessage(`Route set from ${nextPickup} to ${nextDestination}.`);
  };

  const handleUseLocation = (location, field) => {
    setSelectedLocationId(location.id);

    if (field === 'pickup') {
      setPickup(location.area);
      setStatusMessage(`${location.name} added as pickup point.`);
      return;
    }

    setDestination(location.area);
    setStatusMessage(`${location.name} added as destination.`);
  };

  const handleJoinRide = (ride) => {
    const leg = {
      ride,
      from: ride.pickup,
      to: ride.destination,
      transfer: false
    };
    const riders = getLegRiders(leg);

    setSelectedDirectRideId(ride.id);
    setDirectRideRiders(riders);
    setSelectedPickupRiderId(riders[0]?.id ?? null);
    setSelectedPickupRider(null);
    setDriverAlert(null);
    setBookedRideId(ride.id);
    setRouteLocked(true);
    setRideStage('idle');
    setStatusMessage(`Choose one rider for ${ride.pickup} to ${ride.destination}.`);
    setPaymentStatus(`Select a Captain to prepare payment.`);
  };

  const getPrioritizedLegRiders = (leg, step) => {
    const riders = getLegRiders(leg);
    const request = nextLegRequests[getNextLegRequestKey(step, leg)];

    if (request?.status !== 'accepted' || !request.captainId) {
      return riders;
    }

    return riders
      .map((rider) => rider.id === request.captainId
        ? { ...rider, priorityLabel: 'Accepted leg Captain' }
        : rider)
      .sort((a, b) => (a.id === request.captainId ? -1 : b.id === request.captainId ? 1 : 0));
  };

  const handleSelectLeg = (leg, index) => {
    if (completedSteps.includes(index + 1)) {
      setStatusMessage(`Step ${index + 1} is locked because the rider already moved into the present leg.`);
      return;
    }

    if (index > 0 && !completedSteps.includes(index)) {
      setStatusMessage(`Complete payment for Step ${index} before moving to Step ${index + 1}.`);
      setPaymentStatus(`Step ${index + 1} is locked until previous leg payment is completed.`);
      return;
    }

    const riders = getPrioritizedLegRiders(leg, index + 1);

    setSelectedLeg({ ...leg, step: index + 1, riders });
    setSelectedPickupRiderId(riders[0]?.id ?? null);
    setSelectedPickupRider(null);
    setDriverAlert(null);
    setRideStage('idle');
    setRouteLocked(true);
    setBookedRideId(leg.ride.id);
    setStatusMessage(`${riders[0]?.name ?? leg.ride.driver} is available at ${leg.from}. Pick a Captain from the list.`);
    setPaymentStatus(`Step ${index + 1}: Rs ${riders[0]?.fare ?? leg.ride.fare} ready to pay by ${paymentMethod}.`);
  };

  const isCaptainSelectionMutable = () => {
    if (!selectedLeg) {
      return rideStage === 'idle';
    }

    const request = getLegRequest(selectedLeg.step, selectedLeg);

    if (
      request?.status === 'accepted'
      || request?.status === 'location-alert'
      || request?.presence === 'approaching'
      || request?.presence === 'present'
    ) {
      return false;
    }

    return rideStage === 'idle'
      || request?.presence === 'absent'
      || request?.status === 'missed'
      || request?.status === 'declined'
      || request?.status === 'pending';
  };

  const isCaptainChoiceDisabled = (rider) => {
    const request = selectedLeg ? getLegRequest(selectedLeg.step, selectedLeg) : null;
    const lockedToRequestCaptain = request?.captainId
      && rider.id !== request.captainId
      && !isCaptainSelectionMutable();

    return rejectedRiderIds.includes(rider.id)
      || lockedToRequestCaptain
      || (selectedPickupRider && selectedPickupRiderId !== rider.id && !isCaptainSelectionMutable());
  };

  const handlePickupRiderSelect = (rider) => {
    if (selectedPickupRider && selectedPickupRiderId !== rider.id && !isCaptainSelectionMutable()) {
      setStatusMessage('Captain already selected. You can choose another only if this Captain declines.');
      return;
    }

    setSelectedPickupRiderId(rider.id);
    setSelectedPickupRider(rider);
    setDriverAlert({
      driver: rider.name,
      pickup: rider.pickup,
      eta: rider.eta,
      fare: rider.fare,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setRideStage('waiting-driver-start');
    setStatusMessage(`${rider.name} selected at ${rider.pickup}. Waiting for Captain to start the ride.`);
    setPaymentStatus(`Rs ${rider.fare} ready to pay by ${paymentMethod}.`);
  };

  const handleCaptainRefuse = () => {
    if (!selectedPickupRider) {
      setStatusMessage('Select a Captain before marking refusal.');
      return;
    }

    setRejectedRiderIds((ids) => [...new Set([...ids, selectedPickupRider.id])]);
    setStatusMessage(`${selectedPickupRider.name} refused the ride. Please select another nearby Captain.`);
    setPaymentStatus('Captain refused. Payment is reset until another Captain accepts.');
    setSelectedPickupRiderId(null);
    setSelectedPickupRider(null);
    setDriverAlert(null);
    setRideStage('idle');
  };

  const getNextLegForCurrentStep = () => {
    if (!selectedLeg || !connectedPlan.length) {
      return null;
    }

    return connectedPlan[selectedLeg.step] ?? null;
  };

  const getNextLegRequestKey = (step, leg) => `${step}-${leg.from}-${leg.to}`;

  const getLegRequest = (step, leg) => nextLegRequests[getNextLegRequestKey(step, leg)];

  const pickNextAvailableCaptain = (leg, attemptedIds = []) => {
    const attempted = new Set(attemptedIds);
    const captains = getLegRiders(leg);

    return captains.find((captain) => !attempted.has(captain.id)) ?? captains[0];
  };

  const getCaptainDistanceStatus = (distanceMeters = 0) => {
    if (distanceMeters <= 500) {
      return { label: 'Nearby', fareNote: 'normal fare', fareDelta: 0 };
    }

    if (distanceMeters <= 1000) {
      return { label: 'Slightly far', fareNote: 'small waiting fare', fareDelta: 5 };
    }

    return { label: 'Far away', fareNote: 'choose another Captain', fareDelta: 0 };
  };

  const buildCaptainRequest = (captain, attemptedCount = 0) => {
    const distanceMeters = attemptedCount === 0 ? 280 : 620;
    const gpsStatus = getCaptainDistanceStatus(distanceMeters);

    return {
      captain: captain.name,
      captainId: captain.id,
      vehicle: captain.vehicle,
      seats: captain.seats,
      eta: captain.eta,
      fare: captain.fare + gpsStatus.fareDelta,
      rating: captain.rating,
      distanceMeters,
      gpsStatus: gpsStatus.label,
      fareNote: gpsStatus.fareNote
    };
  };

  const handleRequestNextLegCaptain = () => {
    const nextLeg = getNextLegForCurrentStep();

    if (!nextLeg || nextLeg.transfer) {
      setStatusMessage('No leg Captain is needed for this route.');
      return;
    }

    const requestKey = getNextLegRequestKey(selectedLeg.step + 1, nextLeg);
    const existingRequest = nextLegRequests[requestKey];
    const captain = pickNextAvailableCaptain(nextLeg, existingRequest?.attemptedIds);
    const requestDetails = captain ? buildCaptainRequest(captain, existingRequest?.attemptedIds?.length ?? 0) : null;

    if (!captain) {
      setStatusMessage(`No leg Captain is available near ${nextLeg.from} right now.`);
      return;
    }

    setNextLegRequests((requests) => ({
      ...requests,
      [requestKey]: {
        attemptedIds: existingRequest?.attemptedIds ?? [],
        ...requestDetails,
        status: 'pending',
        sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }));
    setStatusMessage(`Request sent to ${getDriverCountForLeg(nextLeg)} Captains near ${nextLeg.from}. Waiting for Yes or No.`);
    setPaymentStatus(`Leg Captain request is ready for ${nextLeg.from} to ${nextLeg.to}.`);
  };

  const handleNextLegCaptainResponse = (response) => {
    const nextLeg = getNextLegForCurrentStep();

    if (!nextLeg) {
      return;
    }

    const requestKey = getNextLegRequestKey(selectedLeg.step + 1, nextLeg);
    const currentRequest = nextLegRequests[requestKey];
    const accepted = response === 'accepted';
    const attemptedIds = accepted
      ? currentRequest?.attemptedIds ?? []
      : [...new Set([...(currentRequest?.attemptedIds ?? []), currentRequest?.captainId].filter(Boolean))];

    setNextLegRequests((requests) => ({
      ...requests,
      [requestKey]: {
        ...currentRequest,
        attemptedIds,
        status: response,
        respondedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }));
    setStatusMessage(accepted
      ? `${currentRequest?.captain ?? 'Captain'} accepted the leg. Continue to ${nextLeg.from}.`
      : `${currentRequest?.captain ?? 'Captain'} said no. Request another Captain near ${nextLeg.from}.`);
  };

  const handleCurrentLegCaptainResponse = (response) => {
    if (!selectedLeg) {
      return;
    }

    const requestKey = getNextLegRequestKey(selectedLeg.step, selectedLeg);
    const currentRequest = nextLegRequests[requestKey];
    const accepted = response === 'accepted';
    const attemptedIds = accepted
      ? currentRequest?.attemptedIds ?? []
      : [...new Set([...(currentRequest?.attemptedIds ?? []), currentRequest?.captainId].filter(Boolean))];

    setNextLegRequests((requests) => ({
      ...requests,
      [requestKey]: {
        ...currentRequest,
        attemptedIds,
        status: response,
        respondedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }));
    setStatusMessage(accepted
      ? `${currentRequest?.captain ?? 'Captain'} accepted this leg. Check Captain presence at ${selectedLeg.from}.`
      : `${currentRequest?.captain ?? 'Captain'} said no. Request another Captain near ${selectedLeg.from}.`);
  };

  const moveCurrentLegRequestToAnotherCaptain = (currentRequest, requestKey, attemptedIds, gpsAlert) => {
    const nextCaptain = pickNextAvailableCaptain(selectedLeg, attemptedIds);

    if (!nextCaptain || nextCaptain.id === currentRequest.captainId) {
      setNextLegRequests((requests) => ({
        ...requests,
        [requestKey]: {
          ...currentRequest,
          attemptedIds,
          presence: 'absent',
          status: 'missed',
          gpsAlert,
          checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }));
      setStatusMessage(`${currentRequest.captain} is not present at pickup location. ${gpsAlert} No alternate Captain is free right now.`);
      return;
    }

    setRejectedRiderIds((ids) => [...new Set([...ids, currentRequest.captainId].filter(Boolean))]);
    setSelectedPickupRiderId(null);
    setSelectedPickupRider(null);
    setDriverAlert(null);
    setRideStage('idle');
    setNextLegRequests((requests) => ({
      ...requests,
      [requestKey]: {
        attemptedIds,
        ...buildCaptainRequest(nextCaptain, attemptedIds.length),
        status: 'pending',
        presence: 'absent',
        gpsAlert,
        sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        alert: `${currentRequest.captain} was not present at pickup location. ${gpsAlert} Request moved to ${nextCaptain.name}.`
      }
    }));
    setStatusMessage(`${currentRequest.captain} is not present at pickup location. ${gpsAlert} Request moved to ${nextCaptain.name}.`);
  };

  const handleCurrentLegCaptainPresence = (isPresent) => {
    if (!selectedLeg) {
      return;
    }

    const requestKey = getNextLegRequestKey(selectedLeg.step, selectedLeg);
    const currentRequest = nextLegRequests[requestKey];

    if (!currentRequest) {
      return;
    }

    if (isPresent) {
      const captain = getLegRiders(selectedLeg).find((rider) => rider.id === currentRequest.captainId);
      const selectedCaptain = captain ? {
        ...captain,
        fare: currentRequest.fare ?? captain.fare,
        priorityLabel: 'GPS confirmed at pickup'
      } : null;

      setNextLegRequests((requests) => ({
        ...requests,
        [requestKey]: {
          ...currentRequest,
          presence: 'present',
          checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }));
      if (selectedCaptain) {
        setSelectedPickupRiderId(selectedCaptain.id);
        setSelectedPickupRider(selectedCaptain);
        setDriverAlert({
          driver: selectedCaptain.name,
          pickup: selectedCaptain.pickup,
          eta: selectedCaptain.eta,
          fare: selectedCaptain.fare,
          sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setRideStage('waiting-driver-start');
        setPaymentStatus(`Rs ${selectedCaptain.fare} ready to pay by ${paymentMethod}. GPS status: ${currentRequest.gpsStatus}.`);
      }
      setStatusMessage(`${currentRequest.captain} is present at ${selectedLeg.from}. Rider can start this leg.`);
      return;
    }

    const withinPickupRange = (currentRequest.distanceMeters ?? 9999) <= 500;
    const gpsAlert = withinPickupRange
      ? `GPS mismatch alert sent to rider and ${currentRequest.captain}. Captain GPS is within 500m but rider marked not present.`
      : `GPS unavailable alert sent. ${currentRequest.captain} is outside 500m pickup range.`;
    const attemptedIds = [...new Set([...(currentRequest.attemptedIds ?? []), currentRequest.captainId].filter(Boolean))];

    if (withinPickupRange) {
      setNextLegRequests((requests) => ({
        ...requests,
        [requestKey]: {
          ...currentRequest,
          presence: 'absent',
          status: 'location-alert',
          gpsAlert,
          checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }));
      setStatusMessage(`${currentRequest.captain} is not visible at pickup. ${gpsAlert} Waiting for Captain reaching/refusal response.`);
      return;
    }

    moveCurrentLegRequestToAnotherCaptain(currentRequest, requestKey, attemptedIds, gpsAlert);
  };

  const handleCurrentLegCaptainAlertResponse = (response) => {
    if (!selectedLeg) {
      return;
    }

    const requestKey = getNextLegRequestKey(selectedLeg.step, selectedLeg);
    const currentRequest = nextLegRequests[requestKey];

    if (!currentRequest) {
      return;
    }

    if (response === 'reaching') {
      setNextLegRequests((requests) => ({
        ...requests,
        [requestKey]: {
          ...currentRequest,
          status: 'accepted',
          presence: 'approaching',
          alert: `${currentRequest.captain} replied: reaching pickup location.`,
          respondedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }));
      setStatusMessage(`${currentRequest.captain} replied that they are reaching ${selectedLeg.from}. Keep this Captain as priority.`);
      return;
    }

    const attemptedIds = [...new Set([...(currentRequest.attemptedIds ?? []), currentRequest.captainId].filter(Boolean))];
    const gpsAlert = currentRequest.gpsAlert ?? `${currentRequest.captain} refused after pickup alert.`;
    moveCurrentLegRequestToAnotherCaptain(currentRequest, requestKey, attemptedIds, gpsAlert);
  };

  const handleAcceptedCaptainNotAtPickup = () => {
    const nextLeg = getNextLegForCurrentStep();

    if (!nextLeg) {
      return;
    }

    const requestKey = getNextLegRequestKey(selectedLeg.step + 1, nextLeg);
    const currentRequest = nextLegRequests[requestKey];
    const attemptedIds = [...new Set([...(currentRequest?.attemptedIds ?? []), currentRequest?.captainId].filter(Boolean))];
    const nextCaptain = pickNextAvailableCaptain(nextLeg, attemptedIds);

    if (!nextCaptain || nextCaptain.id === currentRequest?.captainId) {
      setNextLegRequests((requests) => ({
        ...requests,
        [requestKey]: {
          ...currentRequest,
          attemptedIds,
          status: 'missed',
          respondedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }));
      setStatusMessage(`${currentRequest?.captain ?? 'Accepted Captain'} is not at ${nextLeg.from}. Alert sent, but no alternate Captain is free right now.`);
      return;
    }

    setNextLegRequests((requests) => ({
      ...requests,
      [requestKey]: {
        attemptedIds,
        ...buildCaptainRequest(nextCaptain, attemptedIds.length),
        status: 'pending',
        sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        alert: `${currentRequest?.captain ?? 'Accepted Captain'} was not at pickup. Request moved to ${nextCaptain.name}.`
      }
    }));
    setStatusMessage(`${currentRequest?.captain ?? 'Accepted Captain'} was not at ${nextLeg.from}. Alert sent and request moved to ${nextCaptain.name}.`);
  };

  const handleDriverStartRide = () => {
    if (!selectedPickupRider) {
      setStatusMessage('Select a rider first, then start the ride.');
      return;
    }

    setRideStage('in-progress');
    setStatusMessage(`${selectedPickupRider.name} started the ride from Captain side.`);
  };

  const handleEndRide = () => {
    setRideStage('completed');
    setStatusMessage('Ride completed. Please pay the selected Captain.');
    setActivePanel('payments');
  };

  const handlePaySelectedDriver = () => {
    if (!selectedPickupRider) {
      setPaymentStatus('Select a Captain before payment.');
      return;
    }

    setRideStage('paid');
    if (selectedLeg) {
      setCompletedSteps((steps) => [...new Set([...steps, selectedLeg.step])]);
      setJourneyComplete(selectedLeg.step >= connectedPlan.filter((leg) => !leg.transfer).length);
    } else {
      setJourneyComplete(true);
    }
    setPaymentStatus(`Payment successful. ${selectedPickupRider.name} received Rs ${selectedPickupRider.fare}.`);
  };

  const handleSubmitDriverReview = () => {
    if (!selectedPickupRider) {
      return;
    }

    setSubmittedDriverReviews((ids) => [...new Set([...ids, selectedPickupRider.id])]);
    setStatusMessage(`Captain feedback submitted for ${selectedPickupRider.name}.`);
  };

  const handleSubmitWebsiteReview = () => {
    setWebsiteReviewSubmitted(true);
    setStatusMessage('Website review submitted. Thank you for helping improve RideRelay.');
  };

  const renderDriverAlert = () => (
    driverAlert && (
      <div className="driver-alert inline">
        <span>Captain alert sent</span>
        <strong>{driverAlert.driver}</strong>
        <p>
          Pickup: {driverAlert.pickup} . ETA: {driverAlert.eta} mins . Fare: Rs {driverAlert.fare}
        </p>
        <small>Sent at {driverAlert.sentAt}</small>
      </div>
    )
  );

  const renderLegPaymentGateway = () => {
    if (!selectedPickupRider) {
      return null;
    }

    return (
      <div className="leg-payment-gateway">
        <span>Leg Step Payment Gateway</span>
        <strong>Rs {selectedPickupRider.fare}</strong>
        <p>{paymentStatus}</p>
        <div className="payment-options compact">
          {paymentMethods.map((method) => (
            <button className={paymentMethod === method ? 'selected' : ''} key={method} onClick={() => handlePaymentMethod(method)}>
              {method}
            </button>
          ))}
        </div>
        <button className="panel-action" onClick={handlePaySelectedDriver} disabled={rideStage !== 'completed'}>
          {rideStage === 'paid' ? 'Payment Completed' : `Pay Captain by ${paymentMethod}`}
        </button>
        <small>Payment unlocks the following Leg Step.</small>
      </div>
    );
  };

  const renderRideActions = () => {
    const nextLeg = getNextLegForCurrentStep();
    const nextLegKey = nextLeg ? `${selectedLeg?.step + 1}-${nextLeg.from}-${nextLeg.to}` : '';
    const nextLegRequest = nextLegRequests[nextLegKey];
    const nextLegRequested = Boolean(nextLegRequest);
    const isLowTime = selectedLeg?.ride?.eta <= 6;

    return (
      <>
        {rideStage === 'in-progress' && selectedPickupRider && (
          <div className="live-share-panel">
            <span>Live journey sharing</span>
            <strong>{selectedPickupRider.pickup} live location active</strong>
            <p>Shared with emergency contact {riderProfile.emergency}. SOS is ready during the ride.</p>
            <button>Send SOS</button>
          </div>
        )}
        {rideStage === 'in-progress' && nextLeg && !nextLeg.transfer && (
          <div className="next-leg-panel">
            <span>{isLowTime ? 'Low time for current leg' : 'Leg planning'}</span>
            <strong>{getDriverCountForLeg(nextLeg)} Captains near {nextLeg.from}</strong>
            <p>Request goes to Captains near {nextLeg.from}. They must confirm Yes or No before you select that leg.</p>
            {nextLegRequest && (
              <div className="next-leg-response">
                <span>Sent to</span>
                <strong>{nextLegRequest.captain}</strong>
                <p>{nextLegRequest.vehicle} . {nextLegRequest.seats} seat{nextLegRequest.seats > 1 ? 's' : ''} . {nextLegRequest.eta} mins . Rs {nextLegRequest.fare}</p>
                <small>GPS: {nextLegRequest.distanceMeters}m from {nextLeg.from} . {nextLegRequest.gpsStatus} . {nextLegRequest.fareNote}</small>
                <small>Status: {nextLegRequest.status === 'pending'
                  ? 'Waiting for Captain response'
                  : nextLegRequest.status === 'accepted'
                    ? 'Captain accepted. This Captain gets main priority for this leg.'
                    : nextLegRequest.status === 'missed'
                      ? 'Accepted Captain not at pickup'
                      : 'Captain said no'}</small>
                {nextLegRequest.alert && <small>{nextLegRequest.alert}</small>}
              </div>
            )}
            {!nextLegRequest && (
              <button onClick={handleRequestNextLegCaptain}>
                Request Leg Captain
              </button>
            )}
            {nextLegRequest?.status === 'pending' && (
              <div className="captain-response-actions">
                <button onClick={() => handleNextLegCaptainResponse('accepted')}>Captain Yes</button>
                <button onClick={() => handleNextLegCaptainResponse('declined')}>Captain No</button>
              </div>
            )}
            {nextLegRequest?.status === 'declined' && (
              <button onClick={handleRequestNextLegCaptain}>Request Another Captain</button>
            )}
            {nextLegRequest?.status === 'accepted' && (
              <div className="captain-response-actions">
                <button disabled>Captain Confirmed</button>
                <button onClick={handleAcceptedCaptainNotAtPickup}>Captain Not At Pickup</button>
              </div>
            )}
            {nextLegRequest?.status === 'missed' && (
              <button onClick={handleRequestNextLegCaptain}>Try Another Captain</button>
            )}
          </div>
        )}
      <div className="ride-progress-actions">
        <button onClick={handleCaptainRefuse} disabled={!selectedPickupRider || rideStage !== 'waiting-driver-start'}>
          Captain Refused
        </button>
        <button onClick={handleDriverStartRide} disabled={!selectedPickupRider || rideStage !== 'waiting-driver-start'}>
          {rideStage === 'in-progress' || rideStage === 'completed' || rideStage === 'paid' ? 'Ride Started' : 'Captain Start'}
        </button>
        <button onClick={handleEndRide} disabled={rideStage !== 'in-progress'}>
          End Ride
        </button>
      </div>
      {renderLegPaymentGateway()}
      {rideStage === 'paid' && (
        <div className="feedback-panel">
          <h5>Captain feedback</h5>
          <label>
            Captain feedback
            <textarea
              value={feedback.driver}
              onChange={(event) => setFeedback((current) => ({ ...current, driver: event.target.value }))}
              placeholder="How was the selected Captain?"
            />
          </label>
          <button onClick={handleSubmitDriverReview} disabled={submittedDriverReviews.includes(selectedPickupRider?.id)}>
            {submittedDriverReviews.includes(selectedPickupRider?.id) ? 'Captain Review Submitted' : 'Submit Captain Review'}
          </button>
        </div>
      )}
      </>
    );
  };

  const handleRouteOptionSelect = (option, index) => {
    if (routeLocked) {
      setStatusMessage('Route is locked after rider selection. Complete this route first.');
      return;
    }

    setSelectedRouteOptionIndex(index);
    setConnectedPlan(option.plan);
    setSelectedLeg(null);
    setSelectedPickupRiderId(null);
    setSelectedPickupRider(null);
    setDriverAlert(null);
    setRideStage('idle');
    setValidationInfo((current) => current ? {
      ...current,
      routeDistanceKm: option.meta.distanceKm,
      mode: current.distanceKm <= 9 ? 'Direct route' : 'Multi-hop route'
    } : current);
    setStatusMessage(`Route ${index + 1} selected: about ${option.meta.distanceKm.toFixed(1)} km with ${option.meta.hops} ride${option.meta.hops > 1 ? 's' : ''}. More than one route is available.`);
  };

  const handleProfileChange = (field, value) => {
    setRiderProfile((current) => ({ ...current, [field]: value }));
  };

  const handlePaymentMethod = (method) => {
    setPaymentMethod(method);
    setPaymentStatus(bookedRide ? `Rs ${bookedRide.fare} ready to pay by ${method}.` : `${method} selected for your ride.`);
  };

  const handlePayNow = () => {
    if (selectedPickupRider && rideStage === 'completed') {
      handlePaySelectedDriver();
      return;
    }

    if (!bookedRide) {
      setPaymentStatus('Join a ride first, then complete payment here.');
      return;
    }

    if (paymentMethod === 'Wallet' && walletBalance < bookedRide.fare) {
      setPaymentStatus('Wallet balance is low. Add money or choose another method.');
      return;
    }

    if (paymentMethod === 'Wallet') {
      setWalletBalance((balance) => balance - bookedRide.fare);
    }

    setPaymentStatus(`Payment successful. ${bookedRide.driver} received Rs ${bookedRide.fare}.`);
  };

  const handleRecharge = () => {
    setWalletBalance((balance) => balance + 100);
    setPaymentStatus('Rs 100 added to your RideRelay wallet.');
  };

  const renderRouteMap = (legs, title = 'Route map preview', endLabel = 'Route end') => {
    if (!legs.length) {
      return null;
    }

    const totalDistance = legs.reduce((total, leg) => total + getLegDistanceKm(leg.from, leg.to), 0);
    const isSingleLeg = legs.length === 1;

    return (
      <div className="route-map-panel">
        <div className="route-map-header">
          <div>
            <span>Google-style route flow</span>
            <h5>{title}</h5>
          </div>
          <strong>{totalDistance.toFixed(1)} km</strong>
        </div>
        {isSingleLeg ? (
          <div className="route-map-single">
            <div className="route-node">
              <span>1</span>
            </div>
            <div className="route-single-track" />
            <div className="route-node destination">
              <span>2</span>
            </div>
            <div className="route-single-copy">
              <strong>{legs[0].from} {'->'} {legs[0].to}</strong>
              <small>{totalDistance.toFixed(1)} km . {legs[0].ride?.vehicle ?? 'Move'} . {legs[0].ride?.driver ?? 'Transfer'}</small>
              <p>{endLabel}</p>
            </div>
          </div>
        ) : (
        <div className="route-map-line">
          {legs.map((leg, index) => (
            <div className="route-map-leg" key={`${leg.from}-${leg.to}-${index}`}>
              <div className="route-node">
                <span>{index + 1}</span>
              </div>
              <div>
                <strong>{leg.from}</strong>
                <p>{leg.to}</p>
                <small>{getLegDistanceKm(leg.from, leg.to).toFixed(1)} km . {leg.ride?.vehicle ?? 'Move'} . {leg.ride?.driver ?? 'Transfer'}</small>
              </div>
            </div>
          ))}
          <div className="route-map-destination">
            <div className="route-node destination">
              <span>{legs.length + 1}</span>
            </div>
            <div>
              <strong>{legs[legs.length - 1].to}</strong>
              <p>{endLabel}</p>
            </div>
          </div>
        </div>
        )}
      </div>
    );
  };

  const renderLineUpRouteAlert = () => {
    if (!connectedPlan.length) {
      return null;
    }

    const firstLeg = connectedPlan[0];
    const finalLeg = connectedPlan[connectedPlan.length - 1];
    const viaStops = connectedPlan.slice(1, -1).map((leg) => leg.from);

    return (
      <div className="lineup-alert">
        <span>Route line-up alert</span>
        <h5>Direct Captain flow is not on this route</h5>
        <p>
          RideRelay found a longer multi-hop route. Follow these Leg Steps through connector locations until your path lines up toward {finalLeg.to}.
        </p>
        <div className="lineup-flow">
          <strong>{firstLeg.from}</strong>
          {viaStops.map((stop) => <small key={stop}>{stop}</small>)}
          <strong>{finalLeg.to}</strong>
        </div>
        <small>Alert sent: Long multiple-hop route available. Please take this route to continue toward your destination.</small>
      </div>
    );
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand-lockup">
          <img className="brand-logo" src={assetPath('riderelay-logo.png')} alt="RideRelay logo mark" />
          <div className="brand-title-block">
            <h1 className="sr-only">RideRelay</h1>
            <img className="brand-title-image exact-title" src={assetPath('riderelay-name.png')} alt="RideRelay - Travel Smart and Together" />
          </div>
        </div>

        <div className="nav-actions">
          <div className="time-box">
            <span>Live Time</span>
            <strong>{currentTime}</strong>
          </div>
          <button className="btn btn-outline" onClick={() => setActivePanel('profile')}>Profile</button>
          <button className="btn btn-primary">Get Started</button>
        </div>
      </nav>

      <main className="hero">
        <section className="hero-content">
          <div className="badge">Affordable community ride sharing</div>
          <h2>
            Travel Smart.
            <br />
            Travel Together.
          </h2>
          <p className="hero-text">
            Find nearby travelers moving on the same route. Share fuel costs, reduce traffic, and get help during urgent travel situations.
          </p>

          <div className="stats">
            <div className="stat-card">
              <h3>500m</h3>
              <p>Nearby pickup radius</p>
            </div>
            <div className="stat-card">
              <h3>{liveDrivers.length}</h3>
              <p>Live routes online</p>
            </div>
            <div className="stat-card">
              <h3>{totalAvailableSeats}</h3>
              <p>Seats available now</p>
            </div>
          </div>
        </section>

        <section className="ride-card">
          <div className="card-heading">
            <div>
              <h3>Find Budget Ride</h3>
              <p>{statusMessage}</p>
            </div>
            <span className={loading ? 'live-dot searching' : 'live-dot'}></span>
          </div>

          <div className="quick-routes">
            {quickRoutes.map((route) => (
              <button key={route.join('-')} onClick={() => handleQuickRoute(route)}>
                {route[0]} to {route[1]}
              </button>
            ))}
          </div>

          <div className="location-strip">
            <div>
              <span>Current route</span>
              <strong>
                {pickup} to {destination}
              </strong>
            </div>
            <button onClick={() => setActivePanel('locations')}>Open Location Library</button>
          </div>

          <div className="form-group">
            <label htmlFor="pickup">Pickup Location</label>
            <input
              id="pickup"
              list="stops"
              type="text"
              value={pickup}
              onChange={(event) => setPickup(event.target.value)}
              placeholder="Enter pickup, college, junction, hospital..."
            />
            <small className="input-help">Includes colleges, institutions, junctions, hospitals, tourist places, and local areas.</small>
          </div>

          <div className="form-group">
            <label htmlFor="destination">Destination</label>
            <input
              id="destination"
              list="stops"
              type="text"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Enter arrival location"
            />
            <small className="input-help">Choose any saved Hyderabad place as arrival or drop point.</small>
            <datalist id="stops">
              {availableStops.map((stop) => (
                <option key={stop} value={stop} />
              ))}
            </datalist>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicle">Vehicle</label>
              <select id="vehicle" value={vehicleType} onChange={(event) => setVehicleType(event.target.value)}>
                {vehicles.map((vehicle) => (
                  <option key={vehicle}>{vehicle}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="seats">Seats</label>
              <input
                id="seats"
                type="number"
                min="1"
                max="4"
                value={requiredSeats}
                onChange={(event) => setRequiredSeats(Math.max(1, Number(event.target.value)))}
              />
            </div>
          </div>

          <button className="search-btn" onClick={handleFindRide} disabled={loading}>
            {loading ? 'Searching Nearby Captains...' : 'Find Nearby Match'}
          </button>

          <div className="matches">
            <h4>Nearby Available Rides</h4>

            {validationInfo && (
              <div className="process-panel">
                <div>
                  <span>Trip distance validation</span>
                  <strong>{validationInfo.distanceKm.toFixed(1)} km</strong>
                  <small>{validationInfo.isShortRide ? 'Within 9 km direct range' : 'More than 9 km, multi-hop enabled'}</small>
                </div>
                <div>
                  <span>Selected route path</span>
                  <strong>{(validationInfo.routeDistanceKm ?? validationInfo.distanceKm).toFixed(1)} km</strong>
                  <small>{validationInfo.routeCount || 1} route option{validationInfo.routeCount > 1 ? 's' : ''}</small>
                </div>
                <div>
                  <span>Ride stage</span>
                  <strong>{rideStage.replace('-', ' ')}</strong>
                  <small>{selectedPickupRider ? `${selectedPickupRider.name} selected` : 'No Captain selected yet'}</small>
                </div>
              </div>
            )}

            {!hasSearched && !matches.length && !loading && <p className="empty-state">Search to see live route matches and fare details.</p>}
            {hasSearched && !loading && !matches.length && connectedPlan.length > 0 && (
              <div className="connected-box">
                <h5>Connected Ride Found</h5>
                <p>No single rider is covering the full route. The app linked feeder and hub rides so you can still reach your destination.</p>
              </div>
            )}
            {hasSearched && !loading && !matches.length && !connectedPlan.length && alternateMatches.length > 0 && (
              <div className="alternate-box">
                <h5>Alternate Ways</h5>
                <p>No direct rider is available within 1.5 km. You can join one of these nearby routes and continue from the closest stop.</p>
              </div>
            )}
            {hasSearched && !loading && !matches.length && !connectedPlan.length && !alternateMatches.length && (
              <div className="sorry-box">
                <h5>Sorry, no riders available</h5>
                <p>No rider is available within 500m, 1 km, or 1.5 km. Try a nearby pickup, choose Any vehicle, or check again in a few minutes.</p>
              </div>
            )}

            {matches.map((ride) => (
              <div className={bookedRideId === ride.id ? 'match-card booked' : 'match-card'} key={ride.id}>
                <div className="match-header">
                  <div>
                    <h5>{ride.driver}</h5>
                    <p>{ride.route}</p>
                  </div>
                  <div className="fare-box">
                    <span>{ride.vehicle}</span>
                    <strong>Rs {ride.fare}</strong>
                  </div>
                </div>

                <div className="ride-info">
                  <div>
                    <span>Pickup</span>
                    <strong>{ride.displayDistance ?? ride.pickupDistance}m</strong>
                    <small>{ride.radiusLabel ?? getRadiusLabel(ride.pickupDistance)}</small>
                  </div>
                  <div>
                    <span>Route</span>
                    <strong>{ride.routeDistance ? `${ride.routeDistance.toFixed(1)} km` : `${getLegDistanceKm(ride.pickup, ride.destination).toFixed(1)} km`}</strong>
                  </div>
                  <div>
                    <span>Rating</span>
                    <strong>{ride.rating}</strong>
                  </div>
                </div>

                {renderRouteMap(
                  [{ ride, from: ride.pickup, to: ride.destination }],
                  'Direct route map',
                  bookedRideId === ride.id && (rideStage === 'completed' || rideStage === 'paid') ? 'Destination reached' : 'Direct route available'
                )}

                <div className="match-footer">
                  <div>
                    <span>{ride.verified ? 'Verified Captain' : 'Community Captain'}</span>
                    <strong>{ride.seats} seat{ride.seats > 1 ? 's' : ''}</strong>
                  </div>
                  <button onClick={() => handleJoinRide(ride)}>{bookedRideId === ride.id ? 'Ride Joined' : 'Join Ride'}</button>
                </div>
                {selectedDirectRideId === ride.id && (
                  <div className="pickup-focus inline">
                    <span>Direct ride Leg Step</span>
                    <h5>{ride.pickup}</h5>
                    <p>Choose one rider for {ride.pickup} to {ride.destination}.</p>
                    <div className="pickup-riders">
                      {directRideRiders.map((rider) => (
                        <button
                          className={selectedPickupRiderId === rider.id ? 'pickup-rider selected' : 'pickup-rider'}
                          disabled={isCaptainChoiceDisabled(rider)}
                          key={rider.id}
                          onClick={() => handlePickupRiderSelect(rider)}
                        >
                          <div>
                            <strong>{rider.name}</strong>
                            <span>{rider.vehicle} . {rider.seats} seat{rider.seats > 1 ? 's' : ''} . {rider.eta} mins</span>
                          </div>
                          <div>
                            <strong>Rs {rider.fare}</strong>
                            <span>{rejectedRiderIds.includes(rider.id) ? 'Declined' : selectedPickupRiderId === rider.id ? 'Selected' : `${rider.rating} rating`}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {renderDriverAlert()}
                    {renderRideActions()}
                  </div>
                )}
              </div>
            ))}

            {connectedPlan.length > 0 && (
              <div className="connected-plan">
                {routeOptions.length > 0 && (
                  <>
                    {renderLineUpRouteAlert()}
                    <div className="route-options">
                      {routeOptions.map((option, index) => (
                        <button
                          className={selectedRouteOptionIndex === index ? 'active' : ''}
                          disabled={routeLocked}
                          key={`${option.meta.distanceKm}-${index}`}
                          onClick={() => handleRouteOptionSelect(option, index)}
                        >
                        <span>{index === 0 ? 'Shortest Route' : `Alternate ${index + 1}`}</span>
                        <strong>~{option.meta.distanceKm.toFixed(1)} km</strong>
                        <small>{option.meta.direction} . {option.meta.hops} rides . Rs {option.meta.fare} . &gt;1 routes</small>
                      </button>
                      ))}
                    </div>
                    <p className="distance-note">Routes are direction-aware and prefer hubs facing the destination. Connect Google Routes API for exact traffic-aware kilometers.</p>
                    {renderRouteMap(
                      connectedPlan,
                      'Selected connected route map',
                      journeyComplete ? 'Destination reached' : 'Final stop'
                    )}
                  </>
                )}
                {connectedPlan.map((leg, index) => {
                  const stepNumber = index + 1;
                  const isCompletedLeg = completedSteps.includes(stepNumber);
                  const isWaitingForPreviousPayment = index > 0 && !completedSteps.includes(index);
                  const legCardClass = [
                    'match-card',
                    'connected',
                    selectedLeg?.step === stepNumber ? 'active-leg' : '',
                    isCompletedLeg || isWaitingForPreviousPayment ? 'locked-leg' : ''
                  ].filter(Boolean).join(' ');

                  return (
                  <div className={legCardClass} key={`${leg.ride?.id ?? 'transfer'}-${leg.from}-${leg.to}-${index}`}>
                    <div className="match-header">
                      <div>
                        <span className="route-label">Step {stepNumber}</span>
                        <h5>{leg.transfer ? 'Nearby Transfer' : 'RideRelay Suggestion'}</h5>
                        <p>{leg.from} {'->'} {leg.to}</p>
                        {isCompletedLeg && <small className="step-complete">Leg Step immutable</small>}
                        {isWaitingForPreviousPayment && <small className="step-complete">Leg Step locked until previous payment</small>}
                      </div>
                      <div className="fare-box">
                        <span>{leg.transfer ? 'Move' : `${getDriverCountForLeg(leg)} Captains`}</span>
                        <strong>{leg.transfer ? `${leg.distanceMeters}m` : `Rs ${leg.ride.fare}`}</strong>
                      </div>
                    </div>

                    <div className="ride-info">
                      <div>
                        <span>Boarding</span>
                        <strong>{leg.from}</strong>
                      </div>
                      <div>
                        <span>Drop</span>
                        <strong>{leg.to}</strong>
                      </div>
                      <div>
                        <span>Distance</span>
                        <strong>{getLegDistanceKm(leg.from, leg.to).toFixed(1)} km</strong>
                      </div>
                    </div>
                    {connectedPlan[index + 1] && !connectedPlan[index + 1].transfer && (
                      <div className="next-leg-count">
                        <span>Leg Captains</span>
                        <strong>{getDriverCountForLeg(connectedPlan[index + 1])}</strong>
                        <small>{connectedPlan[index + 1].from} {'->'} {connectedPlan[index + 1].to}</small>
                      </div>
                    )}
                    {connectedPlan[index + 1] && getLegRequest(stepNumber + 1, connectedPlan[index + 1]) && !journeyComplete && (
                      <div className="next-leg-approved-card">
                        <span>Leg request details</span>
                        <strong>{getLegRequest(stepNumber + 1, connectedPlan[index + 1]).captain}</strong>
                        <p>
                          {getLegRequest(stepNumber + 1, connectedPlan[index + 1]).vehicle}
                          {' . '}
                          {getLegRequest(stepNumber + 1, connectedPlan[index + 1]).eta} mins
                          {' . '}
                          Rs {getLegRequest(stepNumber + 1, connectedPlan[index + 1]).fare}
                        </p>
                        <small>
                          GPS: {getLegRequest(stepNumber + 1, connectedPlan[index + 1]).distanceMeters}m from {connectedPlan[index + 1].from}
                          {' . '}
                          {getLegRequest(stepNumber + 1, connectedPlan[index + 1]).status === 'accepted'
                            ? 'Approved Captain waiting for this leg'
                            : getLegRequest(stepNumber + 1, connectedPlan[index + 1]).status === 'pending'
                              ? 'Waiting for Captain approval'
                              : 'Captain changed or unavailable'}
                        </small>
                      </div>
                    )}

                    <div className="match-footer">
                      <div>
                        <span>{leg.transfer ? leg.note : `${getDriverCountForLeg(leg)} available Captains on this route`}</span>
                        <strong>{leg.transfer ? 'No fare' : `${leg.ride.eta} mins . ${leg.ride.seats} seat${leg.ride.seats > 1 ? 's' : ''}`}</strong>
                      </div>
                      {!leg.transfer && (
                        <button onClick={() => handleSelectLeg(leg, index)} disabled={isCompletedLeg || isWaitingForPreviousPayment}>
                          {isCompletedLeg ? 'Leg Step Locked' : isWaitingForPreviousPayment ? 'Pay Previous Leg First' : selectedLeg?.step === stepNumber ? 'Leg Step Open' : index === 0 ? 'Open First Leg Step' : 'Open Leg Step'}
                        </button>
                      )}
                    </div>
                    {selectedLeg?.step === stepNumber && !isCompletedLeg && (
                      <div className="pickup-focus inline">
                        <span>Step {selectedLeg.step} Leg Step</span>
                        <h5>{selectedLeg.from}</h5>
                        <p>Choose one rider for {selectedLeg.from} to {selectedLeg.to}.</p>
                        {getLegRequest(selectedLeg.step, selectedLeg) && (
                          <div className="captain-presence-panel">
                            <span>Captain pickup presence</span>
                            <strong>{getLegRequest(selectedLeg.step, selectedLeg).captain}</strong>
                            <small>
                              GPS: {getLegRequest(selectedLeg.step, selectedLeg).distanceMeters}m from {selectedLeg.from}
                              {' . '}
                              {getLegRequest(selectedLeg.step, selectedLeg).gpsStatus}
                              {' . '}
                              Fare: Rs {getLegRequest(selectedLeg.step, selectedLeg).fare} ({getLegRequest(selectedLeg.step, selectedLeg).fareNote})
                            </small>
                            {getLegRequest(selectedLeg.step, selectedLeg).alert && (
                              <small>{getLegRequest(selectedLeg.step, selectedLeg).alert}</small>
                            )}
                            <p>
                              {getLegRequest(selectedLeg.step, selectedLeg).status === 'pending'
                                ? `Request is waiting for this Captain near ${selectedLeg.from}.`
                                : getLegRequest(selectedLeg.step, selectedLeg).status === 'location-alert'
                                  ? `Captain not present pickup location. ${getLegRequest(selectedLeg.step, selectedLeg).gpsAlert ?? ''} Waiting for Captain reaching/refusal response.`
                                : getLegRequest(selectedLeg.step, selectedLeg).presence === 'present'
                                  ? `Captain is present at ${selectedLeg.from}.`
                                  : getLegRequest(selectedLeg.step, selectedLeg).presence === 'approaching'
                                    ? `Captain replied that they are reaching ${selectedLeg.from}. Confirm again when visible.`
                                  : getLegRequest(selectedLeg.step, selectedLeg).presence === 'absent'
                                    ? `Captain not present pickup location. ${getLegRequest(selectedLeg.step, selectedLeg).gpsAlert ?? ''} ${getLegRequest(selectedLeg.step, selectedLeg).alert ?? 'Choose another Captain.'}`
                                    : `Rider reached ${selectedLeg.from}. Confirm whether Captain is present.`}
                            </p>
                            {getLegRequest(selectedLeg.step, selectedLeg).status === 'pending' && (
                              <div className="captain-response-actions">
                                <button onClick={() => handleCurrentLegCaptainResponse('accepted')}>Captain Yes</button>
                                <button onClick={() => handleCurrentLegCaptainResponse('declined')}>Captain No</button>
                              </div>
                            )}
                            {getLegRequest(selectedLeg.step, selectedLeg).status === 'location-alert' && (
                              <div className="captain-response-actions">
                                <button onClick={() => handleCurrentLegCaptainAlertResponse('reaching')}>Captain Reaching</button>
                                <button onClick={() => handleCurrentLegCaptainAlertResponse('refused')}>Captain Refuses</button>
                              </div>
                            )}
                            {getLegRequest(selectedLeg.step, selectedLeg).status === 'accepted' && getLegRequest(selectedLeg.step, selectedLeg).presence !== 'present' && (
                              <div className="captain-response-actions">
                                <button onClick={() => handleCurrentLegCaptainPresence(true)}>Captain Present</button>
                                <button onClick={() => handleCurrentLegCaptainPresence(false)}>Captain Not Present Pickup Location</button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="pickup-riders">
                          {selectedLeg.riders.map((rider) => (
                            <button
                              className={selectedPickupRiderId === rider.id ? 'pickup-rider selected' : 'pickup-rider'}
                              disabled={isCaptainChoiceDisabled(rider)}
                              key={rider.id}
                              onClick={() => handlePickupRiderSelect(rider)}
                            >
                              <div>
                                <strong>{rider.name}</strong>
                                <span>{rider.vehicle} . {rider.seats} seat{rider.seats > 1 ? 's' : ''} . {rider.eta} mins</span>
                                {rider.priorityLabel && <span>{rider.priorityLabel}</span>}
                              </div>
                              <div>
                                <strong>Rs {rider.fare}</strong>
                                <span>{rejectedRiderIds.includes(rider.id) ? 'Declined' : selectedPickupRiderId === rider.id ? 'Selected' : `${rider.rating} rating`}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        {renderDriverAlert()}
                        {renderRideActions()}
                      </div>
                    )}
                  </div>
                  );
                })}
                {journeyComplete && (
                  <div className="feedback-panel website-review">
                    <h5>Website review</h5>
                    <label>
                      Overall RideRelay experience
                      <textarea
                        value={feedback.website}
                        onChange={(event) => setFeedback((current) => ({ ...current, website: event.target.value }))}
                        placeholder="Was the complete journey helpful?"
                      />
                    </label>
                    <button onClick={handleSubmitWebsiteReview} disabled={websiteReviewSubmitted}>
                      {websiteReviewSubmitted ? 'Website Review Submitted' : 'Submit Website Review'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {alternateMatches.map((ride) => (
              <div className="match-card alternate" key={ride.id}>
                <div className="match-header">
                  <div>
                    <span className="route-label">Alternate route</span>
                    <h5>{ride.driver}</h5>
                    <p>{ride.route}</p>
                  </div>
                  <div className="fare-box">
                    <span>{ride.vehicle}</span>
                    <strong>Rs {ride.fare}</strong>
                  </div>
                </div>

                <div className="ride-info">
                  <div>
                    <span>Pickup</span>
                    <strong>{ride.displayDistance ?? ride.pickupDistance}m</strong>
                    <small>{ride.radiusLabel ?? getRadiusLabel(ride.pickupDistance)}</small>
                  </div>
                  <div>
                    <span>Route</span>
                    <strong>{ride.routeDistance ? `${ride.routeDistance.toFixed(1)} km` : `${getLegDistanceKm(ride.pickup, ride.destination).toFixed(1)} km`}</strong>
                  </div>
                  <div>
                    <span>Rating</span>
                    <strong>{ride.rating}</strong>
                  </div>
                </div>

                <div className="match-footer">
                  <div>
                    <span>Closest available route</span>
                    <strong>{ride.seats} seat{ride.seats > 1 ? 's' : ''}</strong>
                  </div>
                  <button onClick={() => handleJoinRide(ride)}>Join Alternate</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <section className="rider-dashboard" id="rider-panel">
        <div className="section-title">
          <h2>
            Rider <span>Control Panel</span>
          </h2>
          <p>Manage profile, payment, safety, offers, and trip activity in one place.</p>
        </div>

        <div className="dashboard-shell">
          <aside className="panel-tabs" aria-label="Rider panels">
            {[
              ['profile', 'Profile'],
              ['payments', 'Payments'],
              ['trips', 'Trips'],
              ['safety', 'Safety'],
              ['locations', 'Locations'],
              ['offers', 'Offers']
            ].map(([key, label]) => (
              <button
                className={activePanel === key ? 'active' : ''}
                key={key}
                onClick={() => setActivePanel(key)}
              >
                {label}
              </button>
            ))}
          </aside>

          <div className="panel-content">
            {activePanel === 'profile' && (
              <div className="panel-grid">
                <div className="panel-card profile-card">
                  <div className="avatar">{riderProfile.name.slice(0, 1)}</div>
                  <div>
                    <h3>{riderProfile.name}</h3>
                    <p>Verified rider. 34 shared trips completed.</p>
                  </div>
                </div>

                <div className="panel-card">
                  <h3>Update Profile</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="rider-name">Full Name</label>
                      <input id="rider-name" value={riderProfile.name} onChange={(event) => handleProfileChange('name', event.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="rider-phone">Phone</label>
                      <input id="rider-phone" value={riderProfile.phone} onChange={(event) => handleProfileChange('phone', event.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="rider-email">Email</label>
                      <input id="rider-email" value={riderProfile.email} onChange={(event) => handleProfileChange('email', event.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="rider-home">Home Stop</label>
                      <input id="rider-home" value={riderProfile.home} onChange={(event) => handleProfileChange('home', event.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'payments' && (
              <div className="panel-grid">
                <div className="panel-card payment-card">
                  <h3>Payment Gateway</h3>
                  <p>{paymentStatus}</p>
                  <div className="payment-options">
                    {paymentMethods.map((method) => (
                      <button className={paymentMethod === method ? 'selected' : ''} key={method} onClick={() => handlePaymentMethod(method)}>
                        {method}
                      </button>
                    ))}
                  </div>
                  <button className="panel-action" onClick={handlePayNow}>
                    {bookedRide ? `Pay Rs ${bookedRide.fare}` : 'Pay After Joining Ride'}
                  </button>
                </div>

                <div className="panel-card wallet-card">
                  <span>Wallet Balance</span>
                  <strong>Rs {walletBalance}</strong>
                  <p>Use wallet for instant shared ride checkout.</p>
                  <button className="btn-mini" onClick={handleRecharge}>Add Rs 100</button>
                </div>
              </div>
            )}

            {activePanel === 'trips' && (
              <div className="panel-card">
                <h3>My Trips</h3>
                <div className="trip-list">
                  {savedTrips.map((trip) => (
                    <div className="trip-row" key={trip.id}>
                      <div>
                        <strong>{trip.route}</strong>
                        <span>{trip.id} . {trip.date}</span>
                      </div>
                      <div>
                        <strong>Rs {trip.fare}</strong>
                        <span>{trip.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'safety' && (
              <div className="panel-grid">
                <div className="panel-card">
                  <h3>Emergency Contact</h3>
                  <div className="form-group">
                    <label htmlFor="emergency">SOS Phone Number</label>
                    <input id="emergency" value={riderProfile.emergency} onChange={(event) => handleProfileChange('emergency', event.target.value)} />
                  </div>
                  <button className="danger-action">Send SOS Alert</button>
                </div>
                <div className="panel-card safety-list">
                  <h3>Live Safety</h3>
                  <p>Captain verification, live route tracking, and emergency contact sharing are enabled for every joined ride.</p>
                  <span>Route tracking: On</span>
                  <span>Captain OTP: Required</span>
                  <span>Share trip: Ready</span>
                </div>
              </div>
            )}

            {activePanel === 'locations' && (
              <div className="panel-grid">
                <div className="panel-card">
                  <h3>Location Library</h3>
                  <p>{locationLibrary.length} Hyderabad locations loaded with map coordinates. Search, select, or open any place.</p>
                  <div className="form-group library-search">
                    <label htmlFor="location-search">Search Location</label>
                    <input
                      id="location-search"
                      value={locationSearch}
                      onChange={(event) => setLocationSearch(event.target.value)}
                      placeholder="Try Punjagutta, Mehdipatnam, metro, bus..."
                    />
                  </div>
                  <div className="category-pills">
                    {locationCategories.map((category) => (
                      <button
                        className={locationCategory === category ? 'active' : ''}
                        key={category}
                        onClick={() => setLocationCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <div className="location-list">
                    {filteredLocations.map((location) => (
                      <div className={selectedLocationId === location.id ? 'location-row selected' : 'location-row'} key={location.id}>
                        <div>
                          <strong>{location.name}</strong>
                          <span>{location.type} . {location.pickupHint}</span>
                          <span>{location.lat}, {location.lng}</span>
                        </div>
                        <div className="location-actions">
                          <a href={getGoogleMapsUrl(location)} rel="noreferrer" target="_blank">Map</a>
                          <button onClick={() => handleUseLocation(location, 'pickup')}>Pickup</button>
                          <button onClick={() => handleUseLocation(location, 'destination')}>Drop</button>
                        </div>
                      </div>
                    ))}
                    {!filteredLocations.length && <p className="empty-state">No saved place found. Try another nearby landmark.</p>}
                  </div>
                </div>

                <div className="panel-card safety-list">
                  <h3>Route Tools</h3>
                  <p>Quickly switch common routes or reuse your home stop from profile.</p>
                  <span>Pickup: {pickup}</span>
                  <span>Destination: {destination}</span>
                  <span>Home stop: {riderProfile.home}</span>
                  <button className="panel-action" onClick={() => setPickup(riderProfile.home)}>Use Home As Pickup</button>
                </div>
              </div>
            )}

            {activePanel === 'offers' && (
              <div className="panel-card">
                <h3>Rider Offers</h3>
                <div className="offer-list">
                  {riderOffers.map((offer) => (
                    <div className="offer-row" key={offer}>
                      <span>Deal</span>
                      <strong>{offer}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-title">
          <h2>
            Why Choose <span>RideRelay?</span>
          </h2>
          <p>Affordable transportation powered by community route sharing.</p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon">Route</div>
            <h3>Smart Route Matching</h3>
            <p>Find nearby vehicles moving through your route even with different final destinations.</p>
          </div>

          <div className="feature-card">
            <div className="icon">Fuel</div>
            <h3>Save Fuel & Money</h3>
            <p>Reduce travel expenses by sharing rides with nearby travelers.</p>
          </div>

          <div className="feature-card">
            <div className="icon">SOS</div>
            <h3>Live Emergency Help</h3>
            <p>Get quick travel assistance during urgent situations with real-time alerts.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <img className="footer-logo" src={assetPath('riderelay-logo.png')} alt="RideRelay logo mark" />
        <img className="footer-title-image" src={assetPath('riderelay-name.png')} alt="RideRelay - Travel Smart and Together" />
        <p>Affordable eco-friendly ride sharing platform</p>
        <small>2026 RideRelay. Built with React and CSS.</small>
      </footer>
    </div>
  );
}
