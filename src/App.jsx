import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const assetPath = (fileName) => `${import.meta.env.BASE_URL}${fileName}`;
const SESSION_STORAGE_KEY = 'riderelay-session';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ACTIVE_CAPTAIN_REQUEST_STATUSES = ['accepted', 'present-at-pickup', 'ride-started'];
const CAPTAIN_SHARE_RATE_PER_KM = 9;
const PLATFORM_FEE = 5;
const RAPIDO_STYLE_RATE_PER_KM = 16;
const WALKING_MINUTES_PER_KM = 12;
const CALORIES_PER_WALKING_KM = 50;
const CO2_KG_PER_KM_SHARED = 0.12;

function getStoredSession() {
  try {
    return window.localStorage?.getItem(SESSION_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function setStoredSession(session) {
  try {
    window.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Some embedded browsers restrict local storage; keep the app usable without it.
  }
}

function clearStoredSession() {
  try {
    window.localStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

const mapTileModes = {
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | OpenTopoMap'
  },
  traffic: {
    label: 'Traffic',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

function isActiveCaptainRequest(request) {
  return ACTIVE_CAPTAIN_REQUEST_STATUSES.includes(request.status);
}

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
const locationCategories = ['All', 'Commute', 'Tourist', 'Divine', 'Park', 'Amusement', 'Mall', 'Food', 'Office', 'College', 'Institution', 'Hospital', 'Junction', 'Metro Exit', 'Airport'];
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
  'Shamshabad Airport',
  'Manikonda',
  'Narsingi',
  'Kokapet',
  'Nanakramguda',
  'Financial District',
  'HITEC City',
  'Madhapur',
  'Kondapur'
];
const highDemandCorridors = [
  {
    id: 'west-growth-loop',
    title: 'West City Growth Loop',
    demand: 'Very high office and residential movement',
    hubs: ['Mehdipatnam', 'Tolichowki', 'Manikonda', 'Narsingi', 'Kokapet', 'Financial District', 'Nanakramguda', 'Gachibowli'],
    note: 'Best for riders moving toward IT offices, villas, colleges, and evening return flow.'
  },
  {
    id: 'it-core-loop',
    title: 'IT Core Interlink',
    demand: 'Peak morning and evening demand',
    hubs: ['Miyapur', 'Kondapur', 'HITEC City', 'Madhapur', 'Gachibowli', 'Financial District', 'Nanakramguda'],
    note: 'Connects metro-side riders to office corridors without Captain detours.'
  },
  {
    id: 'central-to-west',
    title: 'Central City to West Jobs',
    demand: 'Strong daily commute flow',
    hubs: ['Ameerpet', 'Punjagutta', 'Jubilee Hills', 'Madhapur', 'Gachibowli', 'Nanakramguda', 'Kokapet'],
    note: 'Useful when Captains start from central city and pass through west Hyderabad.'
  },
  {
    id: 'south-west-connect',
    title: 'Mehdipatnam to Airport-West Link',
    demand: 'Good long-route sharing potential',
    hubs: ['Mehdipatnam', 'Tolichowki', 'Shaikpet', 'Manikonda', 'Narsingi', 'Kokapet', 'Shamshabad Airport'],
    note: 'Keeps pickup pins fixed while connecting long routes through safer public points.'
  }
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
  'pahadi shareef->mallapur': 28.4,
  'mehdipatnam->tolichowki': 4.8,
  'tolichowki->mehdipatnam': 4.8,
  'tolichowki->manikonda': 6.2,
  'manikonda->tolichowki': 6.2,
  'manikonda->narsingi': 6.1,
  'narsingi->manikonda': 6.1,
  'narsingi->kokapet': 4.2,
  'kokapet->narsingi': 4.2,
  'kokapet->financial district': 4.8,
  'financial district->kokapet': 4.8,
  'financial district->nanakramguda': 2.4,
  'nanakramguda->financial district': 2.4,
  'nanakramguda->gachibowli': 4.1,
  'gachibowli->nanakramguda': 4.1,
  'miyapur->kondapur': 8.7,
  'kondapur->miyapur': 8.7,
  'kondapur->hitec city': 5.9,
  'hitec city->kondapur': 5.9,
  'hitec city->madhapur': 2.1,
  'madhapur->hitec city': 2.1,
  'madhapur->gachibowli': 7.6,
  'gachibowli->madhapur': 7.6,
  'ameerpet->punjagutta': 3.1,
  'punjagutta->ameerpet': 3.1,
  'punjagutta->jubilee hills': 6.4,
  'jubilee hills->punjagutta': 6.4,
  'jubilee hills->madhapur': 7.2,
  'madhapur->jubilee hills': 7.2,
  'gachibowli->financial district': 5.3,
  'financial district->gachibowli': 5.3,
  'kokapet->shamshabad airport': 23.4,
  'shamshabad airport->kokapet': 23.4
};

let locationLibrary = [
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
  'Walk 100m to pickup hub = 1 Eco Point',
  'Walk 100m from drop hub = 1 Eco Point',
  'Use shared RideRelay trip = 2 Eco Points',
  'Choose official pickup hub = 3 bonus Eco Points',
  'Refer friend after first successful ride = 25 Eco Points'
];

const signupFields = {
  fullName: '',
  email: '',
  phone: '',
  gender: 'Female',
  city: 'Hyderabad',
  homeStop: 'Ameerpet',
  password: '',
  emergencyContact: '',
  vehicleType: 'Bike',
  vehicleNumber: '',
  licenseNumber: '',
  preferredRider: 'Any verified rider'
};

const initialCaptainRequests = [
  {
    id: 'CR-208',
    rider: 'Arvind Reddy',
    pickup: 'LB Nagar',
    destination: 'Lakdikapul',
    leg: 'Leg Step 1',
    fare: 120,
    eta: 6,
    distanceMeters: 360,
    status: 'pending',
    presence: 'not-confirmed'
  },
  {
    id: 'CR-209',
    rider: 'Fatima Begum',
    pickup: 'Lakdikapul',
    destination: 'Ameerpet',
    leg: 'Leg Step 2',
    fare: 90,
    eta: 5,
    distanceMeters: 410,
    status: 'pending',
    presence: 'not-confirmed'
  },
  {
    id: 'CR-210',
    rider: 'Rohit Varma',
    pickup: 'Ameerpet',
    destination: 'BHEL',
    leg: 'Leg Step 3',
    fare: 150,
    eta: 5,
    distanceMeters: 450,
    status: 'pending',
    presence: 'not-confirmed'
  },
  {
    id: 'CR-204',
    rider: 'Ananya Rao',
    pickup: 'Ameerpet',
    destination: 'BHEL',
    leg: 'Leg Step 1',
    fare: 18,
    eta: 4,
    distanceMeters: 320,
    status: 'pending',
    presence: 'not-confirmed'
  },
  {
    id: 'CR-206',
    rider: 'Suresh Kumar',
    pickup: 'Ameerpet',
    destination: 'BHEL',
    leg: 'Leg Step 1',
    fare: 80,
    eta: 5,
    distanceMeters: 420,
    status: 'pending',
    presence: 'not-confirmed'
  },
  {
    id: 'CR-207',
    rider: 'Neha Reddy',
    pickup: 'Ameerpet',
    destination: 'BHEL',
    leg: 'Leg Step 1',
    fare: 82,
    eta: 6,
    distanceMeters: 480,
    status: 'pending',
    presence: 'not-confirmed'
  },
  {
    id: 'CR-205',
    rider: 'Priya Menon',
    pickup: 'Lakdikapul',
    destination: 'KPHB',
    leg: 'Leg Step 2',
    fare: 26,
    eta: 7,
    distanceMeters: 760,
    status: 'pending',
    presence: 'not-confirmed'
  }
];

const apiPreview = {
  signup: 'POST /api/auth/signup',
  login: 'POST /api/auth/login',
  gmail: 'POST /api/auth/google',
  captainRequests: 'GET /api/captain/requests',
  captainDecision: 'PATCH /api/captain/requests/:id',
  presence: 'POST /api/captain/presence',
  rideStatus: 'PATCH /api/rides/:id/status'
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || `API request failed with ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function getCaptainTargetMoney(distanceKm) {
  return Math.max(20, Math.round(distanceKm * CAPTAIN_SHARE_RATE_PER_KM));
}

function getCaptainRoutePricing(distanceKm, vacantSeats) {
  const safeVacantSeats = Math.max(1, Number(vacantSeats) || 1);
  const fuelCost = Math.max(0, distanceKm * CAPTAIN_SHARE_RATE_PER_KM);
  const sharedFuelFare = fuelCost / safeVacantSeats;
  const perRiderFare = Math.max(8, Math.ceil(sharedFuelFare + PLATFORM_FEE));
  const targetMoney = Math.max(20, Math.ceil(fuelCost));
  const rapidoPrice = Math.ceil(distanceKm * RAPIDO_STYLE_RATE_PER_KM);
  const rideRelayPrice = perRiderFare;

  return {
    targetMoney,
    fuelCost,
    platformFee: PLATFORM_FEE,
    perRiderKm: perRiderFare / Math.max(1, distanceKm),
    perRiderFare,
    rapidoPrice,
    rideRelayPrice,
    amountSaved: Math.max(0, rapidoPrice - rideRelayPrice),
    vacantSeats: safeVacantSeats
  };
}

function getCaptainSharedFare(distanceKm, vacantSeats) {
  const safeVacantSeats = Math.max(1, Number(vacantSeats) || 1);

  return getCaptainRoutePricing(distanceKm, safeVacantSeats).perRiderFare;
}

function getOfficialHubLocations() {
  return locationLibrary.filter((location) => ['Metro', 'Metro Exit', 'Bus', 'Rail'].includes(location.type));
}

function getNearestHub(area) {
  const areaPoint = getLocationPoint(area);
  const officialHubs = getOfficialHubLocations();

  if (!officialHubs.length) {
    return null;
  }

  return officialHubs
    .map((hub) => ({
      ...hub,
      distanceMeters: areaPoint ? getDistanceMeters(areaPoint, hub) : 0
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
}

function getWalkingMetrics(distanceMeters = 0) {
  const walkingKm = Math.max(0, distanceMeters / 1000);

  return {
    distanceMeters: Math.round(distanceMeters),
    distanceKm: walkingKm,
    minutes: Math.max(1, Math.round(walkingKm * WALKING_MINUTES_PER_KM)),
    calories: Math.round(walkingKm * CALORIES_PER_WALKING_KM),
    ecoPoints: Math.floor(distanceMeters / 100)
  };
}

function getRideRelayEcoPoints(pickupWalkMeters, dropWalkMeters, hasSharedTrip = true, usesOfficialHub = true, referredFriend = false) {
  return Math.floor(pickupWalkMeters / 100)
    + Math.floor(dropWalkMeters / 100)
    + (hasSharedTrip ? 2 : 0)
    + (usesOfficialHub ? 3 : 0)
    + (referredFriend ? 25 : 0);
}

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

function getCoordinateDistanceKm(from, to) {
  return getDistanceKm(from, to) ?? 0;
}

function getDistanceMeters(from, to) {
  const distanceKm = getDistanceKm(from, to);

  return distanceKm === null ? 0 : Math.round(distanceKm * 1000);
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

function getNativeMapUrl(location) {
  const label = encodeURIComponent(`${location.name}, ${location.area}`);

  return `geo:${location.lat},${location.lng}?q=${location.lat},${location.lng}(${label})`;
}

function getGoogleDirectionsUrl(origin, destination) {
  const originQuery = origin ? `${origin.lat},${origin.lng}` : '';
  const destinationQuery = destination ? `${destination.lat},${destination.lng}` : '';

  return `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destinationQuery}&travelmode=driving`;
}

function RideRelayMapPanel({
  title,
  subtitle,
  pickup,
  destination,
  nearbyPoints = [],
  livePoint,
  liveLabel = 'Live location',
  mapMode,
  setMapMode,
  onUseLiveLocation,
  safetyNote
}) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const pickupPoint = getLocationPoint(pickup);
  const destinationPoint = getLocationPoint(destination);
  const trafficUrl = getGoogleDirectionsUrl(pickupPoint, destinationPoint);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    mapRef.current = L.map(mapNodeRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([17.4375, 78.4483], 12);
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    L.control.attribution({ position: 'bottomleft' }).addTo(mapRef.current);
    markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
    routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
    const resizeMap = () => mapRef.current?.invalidateSize();
    const resizeTimer = window.setTimeout(resizeMap, 250);
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resizeMap) : null;
    resizeObserver?.observe(mapNodeRef.current);

    return () => {
      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const tileMode = mapTileModes[mapMode] || mapTileModes.street;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(tileMode.url, {
      attribution: tileMode.attribution,
      maxZoom: mapMode === 'terrain' ? 17 : 19
    }).addTo(mapRef.current);
  }, [mapMode]);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current || !routeLayerRef.current) {
      return;
    }

    markerLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    const makeIcon = (label, className) => L.divIcon({
      className: `leaflet-ride-pin ${className}`,
      html: `<span>${label}</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    const bounds = [];

    const addMarker = (point, label, className, popup) => {
      if (!point) {
        return;
      }

      const latLng = [point.lat, point.lng];
      bounds.push(latLng);
      L.marker(latLng, { icon: makeIcon(label, className) })
        .bindPopup(popup)
        .addTo(markerLayerRef.current);
    };

    addMarker(pickupPoint, 'P', 'pickup', `Pickup: ${pickup}`);
    addMarker(destinationPoint, 'D', 'drop', `Drop: ${destination}`);

    nearbyPoints.slice(0, 12).forEach((location, index) => {
      addMarker(location, String(index + 1), 'relay', `${location.name}<br>${location.pickupHint}`);
    });

    if (livePoint) {
      addMarker(livePoint, 'L', 'live', liveLabel);
    }

    if (pickupPoint && destinationPoint) {
      L.polyline([[pickupPoint.lat, pickupPoint.lng], [destinationPoint.lat, destinationPoint.lng]], {
        color: mapMode === 'traffic' ? '#f97316' : '#5eead4',
        weight: 5,
        opacity: 0.82,
        dashArray: mapMode === 'traffic' ? '8 8' : ''
      }).addTo(routeLayerRef.current);
    }

    if (bounds.length) {
      mapRef.current.fitBounds(bounds, { padding: [34, 34], maxZoom: 15 });
    }

    window.setTimeout(() => mapRef.current?.invalidateSize(), 80);
  }, [pickup, destination, nearbyPoints, livePoint, liveLabel, mapMode, pickupPoint, destinationPoint]);

  return (
    <div className="live-map-panel">
      <div className="live-map-heading">
        <div>
          <span>Map Library</span>
          <h4>{title}</h4>
          <p>{subtitle}</p>
        </div>
        <a href={trafficUrl} target="_blank" rel="noreferrer">
          Navigate
        </a>
      </div>

      <div className="map-mode-tabs">
        {Object.entries(mapTileModes).map(([key, item]) => (
          <button
            type="button"
            className={mapMode === key ? 'active' : ''}
            key={key}
            onClick={() => setMapMode(key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="leaflet-map-shell" ref={mapNodeRef} />

      <div className="live-map-footer">
        <button type="button" onClick={onUseLiveLocation}>Use Live GPS</button>
        <span>{safetyNote}</span>
      </div>

      {mapMode === 'traffic' && (
        <div className="traffic-note">
          Traffic mode highlights the route in RideRelay. For exact live traffic, open Navigate or connect Google Routes/Traffic API key.
        </div>
      )}
    </div>
  );
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

function isCaptainHopAligned(request, captainSource, captainDestination) {
  const normalizedSource = normalize(captainSource);
  const normalizedDestination = normalize(captainDestination);
  const normalizedPickup = normalize(request.pickup);
  const normalizedHopDestination = normalize(request.destination);

  if (normalizedPickup === normalizedHopDestination) {
    return false;
  }

  const captainDistance = getLegDistanceKm(captainSource, captainDestination);
  const fullLegDistance = getLegDistanceKm(captainSource, request.pickup)
    + getLegDistanceKm(request.pickup, request.destination)
    + getLegDistanceKm(request.destination, captainDestination);
  const captainBearing = getBearingDegrees(getLocationPoint(captainSource), getLocationPoint(captainDestination));
  const hopBearing = getBearingDegrees(getLocationPoint(request.pickup), getLocationPoint(request.destination));
  const pickupBearing = getBearingDegrees(getLocationPoint(captainSource), getLocationPoint(request.pickup));
  const directionAligned = getBearingDiff(captainBearing, hopBearing) <= 75;
  const pickupIsStart = normalizedPickup === normalizedSource;
  const destinationIsCaptainEnd = normalizedHopDestination === normalizedDestination;
  const pickupIsAhead = pickupIsStart || getBearingDiff(captainBearing, pickupBearing) <= 90;
  const pickupMovesForward = pickupIsStart || movesTowardDestination(captainSource, request.pickup, captainDestination);
  const hopMovesForward = destinationIsCaptainEnd || movesTowardDestination(request.pickup, request.destination, captainDestination);
  const avoidsBackwardDetour = fullLegDistance <= captainDistance * 1.35 + 2;

  return directionAligned && pickupIsAhead && pickupMovesForward && hopMovesForward && avoidsBackwardDetour;
}

function getCaptainLastCompletedPin(requests, captainSource) {
  const completedRequests = requests.filter((request) => request.status === 'ride-completed');

  if (!completedRequests.length) {
    return captainSource;
  }

  return completedRequests
    .map((request) => ({
      pin: request.destination,
      progress: getLegDistanceKm(captainSource, request.destination)
    }))
    .sort((a, b) => b.progress - a.progress)[0].pin;
}

function getTargetFitRiders(requests, targetMoney) {
  const openRequests = requests
    .filter((request) => request.status !== 'declined' && request.status !== 'ride-completed')
    .sort((a, b) => b.fare - a.fare);
  let runningTotal = 0;

  return openRequests.filter((request) => {
    if (runningTotal >= targetMoney) {
      return false;
    }

    runningTotal += request.fare;
    return true;
  });
}

function getArrangedCaptainRiderPlan(requests, captainSource, captainDestination, targetMoney, vacantSeats) {
  const safeVacantSeats = Math.max(1, Number(vacantSeats) || 1);
  const matchingRiders = requests
    .filter((request) => request.status !== 'declined' && request.status !== 'ride-completed')
    .map((request) => {
      const pickupProgress = getLegDistanceKm(captainSource, request.pickup);
      const dropProgress = getLegDistanceKm(captainSource, request.destination);
      const legDistance = getLegDistanceKm(request.pickup, request.destination);

      return {
        ...request,
        pickupProgress,
        dropProgress,
        legDistance
      };
    })
    .filter((request) => request.dropProgress > request.pickupProgress)
    .sort((a, b) => (
      a.pickupProgress - b.pickupProgress
      || a.dropProgress - b.dropProgress
      || b.fare - a.fare
    ));
  const groupedByHop = matchingRiders.reduce((groups, request) => {
    const key = `${normalize(request.pickup)}-${normalize(request.destination)}`;
    const group = groups.get(key) || [];

    groups.set(key, [...group, request]);
    return groups;
  }, new Map());
  let targetFare = 0;
  const targetRiders = [];
  const arrangedRiders = [...groupedByHop.values()]
    .map((group) => {
      const sortedGroup = [...group].sort((a, b) => b.fare - a.fare);
      const selectedGroup = sortedGroup.slice(0, safeVacantSeats);
      const segmentTarget = getCaptainTargetMoney(selectedGroup[0]?.legDistance || 0);
      const sharedFare = getCaptainSharedFare(selectedGroup[0]?.legDistance || 0, safeVacantSeats);

      return selectedGroup.map((request) => ({
        ...request,
        segmentTarget,
        originalFare: request.fare,
        fare: sharedFare,
        farePerKm: sharedFare / Math.max(1, request.legDistance),
        sharedRiderCount: selectedGroup.length,
        vacantShareLimit: safeVacantSeats
      }));
    })
    .flat()
    .sort((a, b) => (
      a.pickupProgress - b.pickupProgress
      || a.dropProgress - b.dropProgress
      || b.fare - a.fare
    ))
    .map((request, index) => {
      const arrangedRequest = {
        ...request,
        order: index + 1,
        coverageAfter: Math.min(targetMoney, targetFare + request.fare)
      };

      if (targetFare < targetMoney) {
        targetFare += request.fare;
        targetRiders.push(arrangedRequest);
      }

      return arrangedRequest;
    });

  return {
    matchingRiders,
    arrangedRiders,
    targetRiders,
    totalFare: arrangedRiders.reduce((total, request) => total + request.fare, 0),
    targetFare,
    targetReached: targetFare >= targetMoney
  };
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
  const [locationApiStatus, setLocationApiStatus] = useState('Using local Hyderabad location library.');
  const [locationApiVersion, setLocationApiVersion] = useState(0);
  const [riderMapMode, setRiderMapMode] = useState('street');
  const [captainMapMode, setCaptainMapMode] = useState('street');
  const [riderLiveLocation, setRiderLiveLocation] = useState(null);
  const [captainLiveLocation, setCaptainLiveLocation] = useState(null);
  const [appPage, setAppPage] = useState('auth');
  const [authMode, setAuthMode] = useState('login');
  const [signupRole, setSignupRole] = useState('Rider');
  const [signupMethod, setSignupMethod] = useState('Email');
  const [signupForm, setSignupForm] = useState(signupFields);
  const [authErrors, setAuthErrors] = useState({});
  const [signupRecords, setSignupRecords] = useState([]);
  const [authStatus, setAuthStatus] = useState('Create a Rider or Captain account. Backend API payload is prepared after submit.');
  const [apiSession, setApiSession] = useState(null);
  const [backendStatus, setBackendStatus] = useState('Backend API ready when server is running.');
  const [captainProfile, setCaptainProfile] = useState({
    name: 'Rahul Captain',
    phone: '+91 90000 12345',
    email: 'rahul.captain@riderelay.in',
    vehicleType: 'Bike',
    vehicleNumber: 'TS09 RR 2045',
    licenseNumber: 'DL-TS-2026-2045',
    verification: 'Verified',
    gender: 'Male',
    upiId: 'rahul@upi',
    bankName: 'RideRelay Partner Bank',
    accountNumber: 'XXXXXX2045',
    ifsc: 'RRLY0002045',
    accountHolder: 'Rahul Captain',
    accountLast4: '2045',
    qrFileName: 'No QR uploaded',
    qrPreviewUrl: '',
    qrFileType: ''
  });
  const [captainRequests, setCaptainRequests] = useState(initialCaptainRequests);
  const [captainPanelMessage, setCaptainPanelMessage] = useState('Captain can accept rider requests, confirm pickup presence, start ride, and complete ride.');
  const [captainRoute, setCaptainRoute] = useState({
    source: 'Ameerpet',
    destination: 'BHEL',
    vacantSeats: 2,
    vehicleType: 'Bike',
    departureTime: '08:30',
    targetMoney: 176,
    status: 'Route not submitted'
  });
  const [captainSession, setCaptainSession] = useState({
    targetMoney: 600,
    coveredMoney: 0,
    active: true,
    period: 'Day'
  });
  const [captainChatMessage, setCaptainChatMessage] = useState('I received your request. Please wait near the pickup pin.');
  const [captainPaymentStatus, setCaptainPaymentStatus] = useState('Payment receiving details are editable.');
  const [riderChatDrafts, setRiderChatDrafts] = useState({});
  const [paidCaptainRequestIds, setPaidCaptainRequestIds] = useState([]);
  const [captainRouteAlert, setCaptainRouteAlert] = useState('Submit Captain route to send route alert to matching rider dialogue boxes.');
  const [captainRouteUpdated, setCaptainRouteUpdated] = useState(false);
  const [backendRouteMatches, setBackendRouteMatches] = useState([]);
  const [backendRideRequestIds, setBackendRideRequestIds] = useState({});
  const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileStatus, setProfileStatus] = useState('Profile details are locked. Click Edit to update.');
  const [captainRatingFilter, setCaptainRatingFilter] = useState('All');
  const [isCaptainTargetEditing, setIsCaptainTargetEditing] = useState(false);
  const [captainTargetDraft, setCaptainTargetDraft] = useState({
    period: 'Day',
    targetMoney: 600
  });
  const [riderProfile, setRiderProfile] = useState({
    name: 'Ananya Rao',
    phone: '+91 98765 43210',
    email: 'ananya@riderelay.in',
    home: 'Ameerpet',
    emergency: '+91 91234 56780'
  });

  const applyBackendSession = (payload, role) => {
    const nextRole = role || (payload.user?.role === 'captain' ? 'Captain' : 'Rider');
    const profile = payload.profile || {};
    const user = payload.user || {};

    setApiSession({
      token: payload.token || '',
      user,
      profile
    });

    if (nextRole === 'Captain') {
      const bank = profile.bank || {};

      setCaptainProfile((current) => ({
        ...current,
        name: profile.fullName || user.fullName || current.name,
        phone: user.phone || current.phone,
        email: user.email || current.email,
        vehicleType: profile.vehicleType || current.vehicleType,
        vehicleNumber: profile.vehicleNumber || current.vehicleNumber,
        licenseNumber: profile.licenseNumber || current.licenseNumber,
        verification: profile.verificationStatus || current.verification,
        gender: profile.gender || current.gender,
        upiId: bank.upiId || current.upiId,
        bankName: bank.bankName || current.bankName,
        accountNumber: bank.accountNumber || current.accountNumber,
        ifsc: bank.ifsc || current.ifsc,
        accountHolder: bank.accountHolder || profile.fullName || current.accountHolder,
        accountLast4: (bank.accountNumber || '').replace(/\D/g, '').slice(-4) || current.accountLast4,
        qrFileName: bank.qrFileName || current.qrFileName,
        qrPreviewUrl: bank.qrDataUrl || current.qrPreviewUrl,
        qrFileType: bank.qrMimeType?.includes('pdf') ? 'pdf' : (bank.qrDataUrl ? 'image' : current.qrFileType)
      }));
    } else {
      setRiderProfile((current) => ({
        ...current,
        name: profile.fullName || user.fullName || current.name,
        phone: user.phone || current.phone,
        email: user.email || current.email,
        home: profile.homeStop || current.home,
        emergency: profile.emergencyContact || current.emergency
      }));
    }

    setBackendStatus(`Backend connected as ${nextRole}.`);
  };

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedSession = getStoredSession();

    if (!savedSession) {
      return;
    }

    try {
      const parsedSession = JSON.parse(savedSession);

      if (parsedSession.appPage === 'captain' || parsedSession.appPage === 'rider') {
        setSignupRole(parsedSession.role || (parsedSession.appPage === 'captain' ? 'Captain' : 'Rider'));
        setActivePanel(parsedSession.activePanel || (parsedSession.appPage === 'captain' ? 'captain-dashboard' : 'home'));
        setAppPage(parsedSession.appPage);
        setAuthStatus('Previous session restored. Login again only after logout.');
      }
    } catch {
      clearStoredSession();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadBackendLocations = async () => {
      try {
        const payload = await apiRequest('/api/locations?limit=500');
        const nextLocations = Array.isArray(payload.locations) ? payload.locations : [];

        if (!isMounted || !nextLocations.length) {
          return;
        }

        locationLibrary = nextLocations;
        setLocationApiVersion((version) => version + 1);
        setLocationApiStatus(`${nextLocations.length} backend locations loaded for Rider and Captain panels.`);
      } catch (error) {
        if (isMounted) {
          setLocationApiStatus(`Backend location API unavailable. Local locations still active. ${error.message}`);
        }
      }
    };

    loadBackendLocations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (appPage === 'auth') {
      return;
    }

    setStoredSession({
      appPage,
      activePanel,
      role: appPage === 'captain' ? 'Captain' : 'Rider',
      backendUserId: apiSession?.user?.id || ''
    });
  }, [appPage, activePanel, apiSession]);

  const availableStops = useMemo(() => {
    return [...new Set([
      ...liveDrivers.flatMap((ride) => ride.via),
      ...locationLibrary.flatMap((location) => [location.name, location.area])
    ])].sort();
  }, [locationApiVersion]);

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
  }, [locationSearch, locationCategory, locationApiVersion]);

  const nearbyRideRelayPoints = useMemo(() => {
    const pickupPoint = getLocationPoint(pickup);

    return locationLibrary
      .map((location) => ({
        ...location,
        distanceMeters: pickupPoint
          ? Math.round(getCoordinateDistanceKm(pickupPoint, location) * 1000)
          : 0
      }))
      .filter((location) => !pickupPoint || location.distanceMeters <= 1500)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 6);
  }, [pickup, locationApiVersion]);

  const visibleLocationResults = filteredLocations.slice(0, 18);

  const captainSuggestedRoutes = useMemo(() => {
    const source = resolveLocationArea(captainRoute.source);
    const destinationStop = resolveLocationArea(captainRoute.destination);
    const directRoute = {
      id: 'captain-direct-route',
      title: 'Direct captain route',
      stops: [source, destinationStop],
      distanceKm: getLegDistanceKm(source, destinationStop),
      note: 'Best when pickup and destination match rider direction.'
    };
    const matchingPlans = findConnectedPlans(source, destinationStop, liveDrivers, 2).map((option, index) => ({
      id: `captain-hop-${index}`,
      title: `Suggested hop route ${index + 1}`,
      stops: option.plan.map((leg) => leg.from).concat(option.plan[option.plan.length - 1]?.to ?? destinationStop),
      distanceKm: option.meta.distanceKm,
      note: `${option.meta.hops} Captain leg${option.meta.hops > 1 ? 's' : ''} with shared pickup pins.`
    }));

    return [directRoute, ...matchingPlans]
      .filter((route, index, routes) => routes.findIndex((item) => item.stops.join('->') === route.stops.join('->')) === index)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [captainRoute.source, captainRoute.destination]);

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

    setTimeout(async () => {
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
      try {
        const backendRoutes = await apiRequest(`/api/captain-routes?from=${encodeURIComponent(routePickup)}&to=${encodeURIComponent(routeDestination)}`);
        setBackendRouteMatches(backendRoutes);
        setBackendStatus(backendRoutes.length
          ? `${backendRoutes.length} backend Captain route${backendRoutes.length === 1 ? '' : 's'} available for this rider search.`
          : 'No backend Captain route found for this rider search yet.');
      } catch (error) {
        setBackendRouteMatches([]);
        setBackendStatus(`Backend route search not available: ${error.message}`);
      }
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

  const handleUseLiveLocation = (role) => {
    if (!navigator.geolocation) {
      const message = 'Live GPS is not available in this browser.';
      role === 'captain' ? setCaptainPanelMessage(message) : setStatusMessage(message);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const livePoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 0)
        };

        if (role === 'captain') {
          setCaptainLiveLocation(livePoint);
          setCaptainPanelMessage(`Captain live GPS updated. Accuracy ${livePoint.accuracy}m.`);
          return;
        }

        setRiderLiveLocation(livePoint);
        setStatusMessage(`Rider live GPS updated. Accuracy ${livePoint.accuracy}m.`);
      },
      () => {
        const message = 'Allow location permission to show live GPS on RideRelay map.';
        role === 'captain' ? setCaptainPanelMessage(message) : setStatusMessage(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 15000
      }
    );
  };

  const handleJoinRide = async (ride) => {
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

    await createBackendRideRequest({
      requestKey: `direct-${ride.id}`,
      from: ride.pickup,
      to: ride.destination,
      hopPickup: ride.pickup,
      hopDestination: ride.destination,
      distanceKm: getLegDistanceKm(ride.pickup, ride.destination)
    });
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

  const handlePickupRiderSelect = async (rider) => {
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

    await createBackendRideRequest({
      requestKey: selectedLeg ? `leg-${selectedLeg.step}-${rider.id}` : `direct-captain-${rider.id}`,
      from: selectedLeg?.from || rider.pickup,
      to: selectedLeg?.to || rider.destination,
      hopPickup: selectedLeg?.from || rider.pickup,
      hopDestination: selectedLeg?.to || rider.destination,
      distanceKm: getLegDistanceKm(selectedLeg?.from || rider.pickup, selectedLeg?.to || rider.destination)
    });
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

  const getBackendRiderId = async () => {
    if (apiSession?.user?.role === 'rider' && apiSession.profile?.id) {
      return apiSession.profile.id;
    }

    const bootstrap = await apiRequest('/api/bootstrap');
    return bootstrap.riders?.[0]?.id;
  };

  const getBackendRouteForRide = async (from, to) => {
    const routeMatches = await apiRequest(`/api/captain-routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    const activeRoute = routeMatches[0];

    if (activeRoute) {
      return activeRoute;
    }

    const bootstrap = await apiRequest('/api/bootstrap');
    return bootstrap.captainRoutes?.find((route) => route.status === 'active') ?? bootstrap.captainRoutes?.[0];
  };

  const createBackendRideRequest = async ({ requestKey, from, to, hopPickup, hopDestination, distanceKm }) => {
    try {
      const riderId = await getBackendRiderId();
      const route = await getBackendRouteForRide(from, to);

      if (!riderId || !route?.captainId || !route?.id) {
        setBackendStatus('Backend request could not be created because Rider or Captain route record is missing.');
        return null;
      }

      const request = await apiRequest('/api/rider-requests', {
        method: 'POST',
        body: JSON.stringify({
          riderId,
          captainId: route.captainId,
          routeId: route.id,
          pickup: from,
          destination: to,
          hopPickup: hopPickup || from,
          hopDestination: hopDestination || to,
          distanceKm
        })
      });

      setBackendRideRequestIds((current) => ({
        ...current,
        [requestKey]: request.id
      }));
      setBackendStatus(`Rider request saved in backend: ${request.id}.`);
      return request;
    } catch (error) {
      setBackendStatus(`Backend rider request not saved: ${error.message}`);
      return null;
    }
  };

  const syncCaptainRequestsFromBackend = async () => {
    const captainId = apiSession?.user?.role === 'captain' ? apiSession.profile?.id : '';

    if (!captainId) {
      return;
    }

    try {
      const backendRequests = await apiRequest(`/api/captains/${captainId}/requests`);
      const mappedRequests = backendRequests.map((request) => ({
        id: request.id,
        rider: request.riderName,
        pickup: request.hopPickup || request.pickup,
        destination: request.hopDestination || request.destination,
        fare: request.fare,
        status: request.status,
        distanceMeters: request.distanceMeters || 420,
        eta: request.eta || 5,
        presence: request.status === 'present-at-pickup' ? 'present' : 'not-confirmed',
        captainMessage: request.captainMessage || '',
        alertSentAt: request.updatedAt ? new Date(request.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      }));

      setCaptainRequests((current) => {
        const backendIds = new Set(mappedRequests.map((request) => request.id));
        const localOnly = current.filter((request) => !backendIds.has(request.id));
        return [...mappedRequests, ...localOnly];
      });
      setBackendStatus(`Synced ${mappedRequests.length} Captain request${mappedRequests.length === 1 ? '' : 's'} from backend.`);
    } catch (error) {
      setBackendStatus(`Captain request sync failed: ${error.message}`);
    }
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

  const handlePaySelectedDriver = async () => {
    if (!selectedPickupRider) {
      setPaymentStatus('Select a Captain before payment.');
      return;
    }

    if (paymentMethod === 'Wallet' && walletBalance < selectedPickupRider.fare) {
      setPaymentStatus('Wallet balance is low. Add money or choose another method.');
      return;
    }

    const requestKey = selectedLeg ? `leg-${selectedLeg.step}-${selectedPickupRider.id}` : `direct-captain-${selectedPickupRider.id}`;
    const backendRequestId = backendRideRequestIds[requestKey] || backendRideRequestIds[`direct-${bookedRideId}`];

    if (paymentMethod === 'Wallet') {
      setWalletBalance((balance) => Math.max(0, balance - selectedPickupRider.fare));
    }

    setRideStage('paid');
    if (selectedLeg) {
      setCompletedSteps((steps) => [...new Set([...steps, selectedLeg.step])]);
      setJourneyComplete(selectedLeg.step >= connectedPlan.filter((leg) => !leg.transfer).length);
    } else {
      setJourneyComplete(true);
    }
    setPaymentStatus(`Payment successful. ${selectedPickupRider.name} received Rs ${selectedPickupRider.fare}${paymentMethod === 'Wallet' ? ' from wallet' : ''}.`);

    if (backendRequestId) {
      try {
        await apiRequest('/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            requestId: backendRequestId,
            amount: selectedPickupRider.fare,
            method: paymentMethod
          })
        });
        setBackendStatus('Rider payment saved in backend.');
      } catch (error) {
        setBackendStatus(`Backend payment save skipped: ${error.message}`);
      }
    }
  };

  const handleSubmitDriverReview = async () => {
    if (!selectedPickupRider) {
      return;
    }

    setSubmittedDriverReviews((ids) => [...new Set([...ids, selectedPickupRider.id])]);
    setStatusMessage(`Captain feedback submitted for ${selectedPickupRider.name}.`);

    const requestKey = selectedLeg ? `leg-${selectedLeg.step}-${selectedPickupRider.id}` : `direct-captain-${selectedPickupRider.id}`;
    const backendRequestId = backendRideRequestIds[requestKey] || backendRideRequestIds[`direct-${bookedRideId}`];

    if (backendRequestId) {
      try {
        const bootstrap = await apiRequest('/api/bootstrap');
        const request = bootstrap.rideRequests?.find((item) => item.id === backendRequestId);

        if (request) {
          await apiRequest('/api/reviews', {
            method: 'POST',
            body: JSON.stringify({
              requestId: backendRequestId,
              riderId: request.riderId,
              captainId: request.captainId,
              rating: 5,
              mood: 'Happy',
              comment: feedback.driver || 'Ride completed safely.'
            })
          });
          setBackendStatus('Rider review saved in backend.');
        }
      } catch (error) {
        setBackendStatus(`Backend review save skipped: ${error.message}`);
      }
    }
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

  const handleProfileUpdate = () => {
    setIsProfileEditing(false);
    setProfileStatus('Profile updated successfully.');
  };

  const handleCaptainRouteChange = (field, value) => {
    setCaptainRoute((current) => {
      const nextRoute = {
        ...current,
        [field]: field === 'vacantSeats' || field === 'targetMoney' ? Number(value) : value,
        status: 'Draft route. Submit to make this route visible for rider suggestions.'
      };

      if (field === 'source' || field === 'destination') {
        const from = resolveLocationArea(field === 'source' ? value : current.source);
        const to = resolveLocationArea(field === 'destination' ? value : current.destination);
        nextRoute.targetMoney = getCaptainTargetMoney(getLegDistanceKm(from, to));
      }

      if (field === 'vacantSeats') {
        const from = resolveLocationArea(current.source);
        const to = resolveLocationArea(current.destination);
        nextRoute.vacantSeats = Math.max(1, Number(value) || 1);
        nextRoute.targetMoney = getCaptainTargetMoney(getLegDistanceKm(from, to));
      }

      return nextRoute;
    });
    setCaptainRouteAlert('Route changes are in draft. Submit to alert riders.');
    setCaptainRouteUpdated(false);
  };

  const handleCaptainPaymentChange = (field, value) => {
    setCaptainProfile((current) => {
      const nextProfile = {
        ...current,
        [field]: value
      };

      if (field === 'accountNumber') {
        const visibleDigits = value.replace(/\D/g, '').slice(-4);
        nextProfile.accountLast4 = visibleDigits || current.accountLast4;
      }

      return nextProfile;
    });
    setCaptainPaymentStatus('Unsaved payment changes. Submit to save.');
  };

  const handleCaptainQrUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isImageQr = file.type.startsWith('image/');
    const isPdfQr = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImageQr && !isPdfQr) {
      setCaptainPaymentStatus('Upload PNG, JPG, JPEG, or PDF QR only.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setCaptainProfile((current) => ({
        ...current,
        qrFileName: file.name,
        qrPreviewUrl: reader.result,
        qrFileType: isPdfQr ? 'pdf' : 'image'
      }));
      setCaptainPaymentStatus(`${file.name} selected and stored in Captain payment record. Submit to confirm.`);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptainPaymentSubmit = async (event) => {
    event.preventDefault();

    if (!captainProfile.upiId.trim() && (!captainProfile.accountNumber.trim() || !captainProfile.ifsc.trim())) {
      setCaptainPaymentStatus('Add UPI ID or complete bank account details before saving.');
      return;
    }

    const captainId = apiSession?.user?.role === 'captain' ? apiSession.profile?.id : '';

    if (captainId) {
      try {
        const savedBank = await apiRequest(`/api/captains/${captainId}/payment`, {
          method: 'PATCH',
          body: JSON.stringify({
            accountHolder: captainProfile.accountHolder,
            bankName: captainProfile.bankName,
            accountNumber: captainProfile.accountNumber,
            ifsc: captainProfile.ifsc,
            upiId: captainProfile.upiId,
            qrFileName: captainProfile.qrFileName,
            qrMimeType: captainProfile.qrFileType === 'pdf' ? 'application/pdf' : (captainProfile.qrPreviewUrl ? 'image/*' : ''),
            qrDataUrl: captainProfile.qrPreviewUrl
          })
        });

        setApiSession((current) => current ? ({
          ...current,
          profile: {
            ...current.profile,
            bank: savedBank
          }
        }) : current);
        setCaptainPaymentStatus(`Payment receiving details saved in backend. ${captainProfile.qrPreviewUrl ? 'QR record is available for rider scanning/viewing.' : 'No QR file is uploaded yet.'}`);
        return;
      } catch (error) {
        setCaptainPaymentStatus(`Saved on page, but backend save failed: ${error.message}`);
      }
    }

    setCaptainPaymentStatus(`Payment receiving details saved on this page. ${captainProfile.qrPreviewUrl ? 'QR record is available for rider scanning/viewing.' : 'No QR file is uploaded yet.'}`);
  };

  const handleCaptainRouteSubmit = async (event) => {
    event.preventDefault();

    const routeSource = resolveLocationArea(captainRoute.source);
    const routeDestination = resolveLocationArea(captainRoute.destination);
    const routeDistance = getLegDistanceKm(routeSource, routeDestination);

    if (!captainRoute.source.trim() || !captainRoute.destination.trim()) {
      setCaptainPanelMessage('Captain route needs both From and Destination locations.');
      return;
    }

    if (normalize(routeSource) === normalize(routeDestination)) {
      setCaptainPanelMessage('Captain From and Destination cannot be the same stop.');
      return;
    }

    const pricing = getCaptainRoutePricing(routeDistance, captainRoute.vacantSeats);
    const suggestedTarget = pricing.targetMoney;

    setCaptainRoute((current) => ({
      ...current,
      source: routeSource,
      destination: routeDestination,
      vacantSeats: pricing.vacantSeats,
      targetMoney: suggestedTarget,
      status: `Active fixed-hub trip submitted for ${captainRoute.departureTime}. ${routeDistance.toFixed(1)} km path. Rider fare uses fuel-share pricing.`
    }));
    setCaptainSession((current) => ({
      ...current,
      coveredMoney: current.coveredMoney,
      active: true
    }));
    const routeMessage = `Captain route ${routeSource} to ${routeDestination}: ${routeDistance.toFixed(1)} km through fixed hubs. RideRelay share rate is Rs ${CAPTAIN_SHARE_RATE_PER_KM}/km, split by ${pricing.vacantSeats} seat${pricing.vacantSeats === 1 ? '' : 's'} plus Rs ${pricing.platformFee} platform fee. Rider estimate Rs ${pricing.rideRelayPrice}.`;
    setCaptainPanelMessage(routeMessage);
    setCaptainRouteAlert(routeMessage);
    setCaptainRouteUpdated(true);

    const captainId = apiSession?.user?.role === 'captain' ? apiSession.profile?.id : '';

    if (captainId) {
      try {
        const savedRoute = await apiRequest(`/api/captains/${captainId}/routes`, {
          method: 'POST',
          body: JSON.stringify({
            fromLocation: routeSource,
            toLocation: routeDestination,
            vacantSeats: pricing.vacantSeats,
            distanceKm: routeDistance
          })
        });

        setApiSession((current) => current ? ({
          ...current,
          activeRouteId: savedRoute.id
        }) : current);
        setCaptainPanelMessage(`${routeMessage} Backend route saved as active.`);
        setCaptainRouteAlert(`${routeMessage} Backend route saved as active.`);
        await syncCaptainRequestsFromBackend();
      } catch (error) {
        setCaptainPanelMessage(`${routeMessage} Backend route save failed: ${error.message}`);
      }
    }
  };

  const handleSignupChange = (field, value) => {
    setSignupForm((current) => ({ ...current, [field]: value }));
  };

  const handleContinueWithGmail = () => {
    setSignupMethod('Gmail');
    setSignupForm((current) => ({
      ...current,
      email: current.email || (signupRole === 'Captain' ? 'captain@gmail.com' : 'rider@gmail.com')
    }));
    setAuthStatus(`Gmail selected for ${signupRole}. In backend this will call ${apiPreview.gmail}.`);
  };

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const validateAuthForm = (mode) => {
    const errors = {};

    if (!validateEmail(signupForm.email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!signupForm.password || signupForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (mode === 'signup') {
      if (!signupForm.fullName.trim()) {
        errors.fullName = 'Full name is required.';
      }

      if (!/^[+]?\d[\d\s-]{8,}$/.test(signupForm.phone.trim())) {
        errors.phone = 'Enter a valid phone number.';
      }

      if (!signupForm.homeStop.trim()) {
        errors.homeStop = 'Primary stop is required.';
      }

      if (signupRole === 'Rider' && !/^[+]?\d[\d\s-]{8,}$/.test(signupForm.emergencyContact.trim())) {
        errors.emergencyContact = 'Emergency contact is required for rider.';
      }

      if (signupRole === 'Captain') {
        if (!signupForm.vehicleNumber.trim()) {
          errors.vehicleNumber = 'Vehicle number is required for captain.';
        }

        if (!signupForm.licenseNumber.trim()) {
          errors.licenseNumber = 'Driving license is required for captain.';
        }
      }
    }

    setAuthErrors(errors);
    return !Object.keys(errors).length;
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!validateAuthForm('login')) {
      setAuthStatus('Please fix login errors before continuing.');
      return;
    }

    await handleLoginOpen(signupRole, {
      email: signupForm.email,
      password: signupForm.password
    });
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    if (!validateAuthForm('signup')) {
      setAuthStatus(`Please complete all valid ${signupRole} details before continuing.`);
      return;
    }

    const record = {
      id: `${signupRole.toUpperCase()}-${Date.now()}`,
      role: signupRole,
      method: signupMethod,
      name: signupForm.fullName,
      email: signupForm.email,
      phone: signupForm.phone,
      gender: signupForm.gender,
      city: signupForm.city,
      homeStop: signupForm.homeStop,
      verification: signupRole === 'Captain' ? 'KYC pending' : 'Phone verified',
      api: apiPreview.signup,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const payload = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          role: signupRole.toLowerCase(),
          fullName: signupForm.fullName,
          email: signupForm.email,
          phone: signupForm.phone,
          password: signupForm.password,
          gender: signupForm.gender,
          homeStop: signupForm.homeStop,
          emergencyContact: signupForm.emergencyContact,
          vehicleType: signupForm.vehicleType,
          vehicleNumber: signupForm.vehicleNumber,
          licenseNumber: signupForm.licenseNumber,
          upiId: `${normalize(signupForm.fullName).replace(/\s+/g, '') || 'captain'}@upi`
        })
      });

      applyBackendSession(payload, signupRole);
      setSignupRecords((records) => [{ ...record, api: 'Backend saved' }, ...records].slice(0, 4));
      setAuthStatus(`${signupRole} account created and stored in backend database.`);
      setActivePanel(signupRole === 'Captain' ? 'captain-dashboard' : 'home');
      setAppPage(signupRole === 'Captain' ? 'captain' : 'rider');
      return;
    } catch (error) {
      if (error.status) {
        setAuthStatus(`Backend signup stopped: ${error.message}`);
        return;
      }

      setBackendStatus('Backend is not running, so this signup is using page demo mode.');
    }

    setSignupRecords((records) => [record, ...records].slice(0, 4));

    if (signupRole === 'Rider') {
      setRiderProfile((current) => ({
        ...current,
        name: signupForm.fullName,
        phone: signupForm.phone,
        email: signupForm.email,
        home: signupForm.homeStop,
        emergency: signupForm.emergencyContact || current.emergency
      }));
    } else {
      setCaptainProfile({
        name: signupForm.fullName,
        phone: signupForm.phone,
        email: signupForm.email,
        vehicleType: signupForm.vehicleType,
        vehicleNumber: signupForm.vehicleNumber,
        licenseNumber: signupForm.licenseNumber,
        verification: 'KYC pending',
        gender: signupForm.gender,
        upiId: `${normalize(signupForm.fullName).replace(/\s+/g, '') || 'captain'}@upi`,
        bankName: 'Add bank account',
        accountNumber: '',
        ifsc: '',
        accountHolder: signupForm.fullName,
        accountLast4: signupForm.vehicleNumber.slice(-4) || '0000',
        qrFileName: 'No QR uploaded',
        qrPreviewUrl: '',
        qrFileType: ''
      });
    }

    setAuthStatus(`${signupRole} signup created locally. Ready to send payload to ${apiPreview.signup}.`);
    setActivePanel(signupRole === 'Captain' ? 'captain-dashboard' : 'home');
    setAppPage(signupRole === 'Captain' ? 'captain' : 'rider');
  };

  const handleLoginOpen = async (role, credentials = {}) => {
    setSignupRole(role);
    setAuthErrors({});
    setActivePanel(role === 'Captain' ? 'captain-dashboard' : 'home');
    const demoCredentials = role === 'Captain'
      ? { email: 'rahul.captain@riderelay.in', password: 'captain123' }
      : { email: 'ananya@riderelay.in', password: 'demo123' };
    const loginCredentials = {
      email: credentials.email || demoCredentials.email,
      password: credentials.password || demoCredentials.password
    };

    try {
      const payload = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginCredentials)
      });

      applyBackendSession(payload, role);
      setAuthStatus(`${role} login verified by backend database.`);
    } catch (error) {
      if (error.status) {
        setAuthStatus(`Backend login failed: ${error.message}. Demo page opened for testing.`);
      } else {
        setBackendStatus('Backend is not running, demo login opened.');
        setAuthStatus(`${role} login successful for demo. Start backend API to verify email/Gmail token.`);
      }
    }

    setAppPage(role === 'Captain' ? 'captain' : 'rider');
  };

  const handleLogout = () => {
    clearStoredSession();
    setApiSession(null);
    setCaptainSession((current) => ({
      ...current,
      coveredMoney: 0,
      active: true
    }));
    setAppPage('auth');
    setAuthMode('login');
    setAuthStatus('Logged out. Choose Rider or Captain to continue.');
  };

  const handleCaptainEarningTargetChange = (field, value) => {
    setCaptainTargetDraft((current) => ({
      ...current,
      [field]: field === 'targetMoney' ? Math.max(0, Number(value) || 0) : value
    }));
  };

  const handleApplyCaptainTarget = async () => {
    setCaptainSession((current) => ({
      ...current,
      period: captainTargetDraft.period,
      targetMoney: captainTargetDraft.targetMoney,
      active: true
    }));
    setIsCaptainTargetEditing(false);
    setCaptainPanelMessage(`${captainTargetDraft.period} target updated to Rs ${captainTargetDraft.targetMoney}. Rider fares remain fair-share only.`);

    const captainId = apiSession?.user?.role === 'captain' ? apiSession.profile?.id : '';

    if (captainId) {
      try {
        await apiRequest(`/api/captains/${captainId}/dashboard`, {
          method: 'PATCH',
          body: JSON.stringify({
            targetPeriod: captainTargetDraft.period.toLowerCase(),
            targetAmount: captainTargetDraft.targetMoney
          })
        });
        setBackendStatus('Captain target saved in backend dashboard.');
      } catch (error) {
        setBackendStatus(`Captain target backend save failed: ${error.message}`);
      }
    }
  };

  const handleEditCaptainTarget = () => {
    setCaptainTargetDraft({
      period: captainSession.period,
      targetMoney: captainSession.targetMoney
    });
    setIsCaptainTargetEditing(true);
  };

  const updateCaptainRequest = (requestId, updates, message) => {
    setCaptainRequests((requests) => requests.map((request) => (
      request.id === requestId ? { ...request, ...updates } : request
    )));
    setCaptainPanelMessage(message);
  };

  const handleCaptainSendAlert = async (requestId) => {
    const request = captainRequests.find((item) => item.id === requestId);
    const sentAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = riderChatDrafts[requestId] || captainChatMessage;

    updateCaptainRequest(
      requestId,
      {
        captainMessage: message,
        alertSentAt: sentAt
      },
      `Alert sent to ${request?.rider ?? 'rider'}: ${message}`
    );

    try {
      await apiRequest(`/api/captain/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: request?.status === 'pending' ? 'location-alert' : 'accepted',
          captainMessage: message
        })
      });
      setBackendStatus('Captain alert saved in backend rider request.');
    } catch (error) {
      setBackendStatus(`Backend alert save skipped: ${error.message}`);
    }
  };

  const handleCaptainAccept = async (requestId) => {
    const request = captainRequests.find((item) => item.id === requestId);

    if (!request) {
      return;
    }

    const routeSource = resolveLocationArea(captainRoute.source);
    const routeDestination = resolveLocationArea(captainRoute.destination);
    const activeVehicleSeatCount = captainRequests.filter((item) => (
      isActiveCaptainRequest(item)
      && isCaptainHopAligned(item, routeSource, routeDestination)
    )).length;
    const activePickupSeatCount = captainRequests.filter((item) => (
      isActiveCaptainRequest(item)
      && normalize(item.pickup) === normalize(request.pickup)
    )).length;
    const vacantSeatLimit = Math.max(1, Number(captainRoute.vacantSeats) || 1);

    if (activeVehicleSeatCount >= vacantSeatLimit || activePickupSeatCount >= vacantSeatLimit) {
      const fullMessage = `${request.pickup} vehicle has been full. New rider alerts are stopped until one rider ends the hop and a seat becomes free.`;

      updateCaptainRequest(
        requestId,
        {
          captainMessage: fullMessage,
          alertSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        fullMessage
      );
      setCaptainRouteAlert(fullMessage);
      return;
    }

    updateCaptainRequest(
      requestId,
      {
        status: 'accepted',
        fare: getCaptainSharedFare(getLegDistanceKm(request.pickup, request.destination), vacantSeatLimit),
        presence: 'not-confirmed',
        captainMessage: 'Captain accepted your request. Please confirm when Captain reaches your pickup location.',
        alertSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      `${captainProfile.name} accepted ${request?.rider ?? 'rider'} request. Alert sent to rider for pickup presence confirmation.`
    );

    try {
      await apiRequest(`/api/captain/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'accepted',
          captainMessage: 'Captain accepted your request. Please confirm when Captain reaches your pickup location.'
        })
      });
      setBackendStatus('Captain acceptance saved in backend.');
    } catch (error) {
      setBackendStatus(`Backend accept update skipped: ${error.message}`);
    }
  };

  const handleCaptainRiderPayment = (requestId) => {
    const request = captainRequests.find((item) => item.id === requestId);

    setPaidCaptainRequestIds((current) => (
      current.includes(requestId) ? current : [...current, requestId]
    ));
    setCaptainPanelMessage(`Payment received from ${request?.rider ?? 'rider'}. Verified app payment added to Captain ${captainSession.period.toLowerCase()} earnings.`);
  };

  const handleCaptainDecline = async (requestId) => {
    const request = captainRequests.find((item) => item.id === requestId);
    updateCaptainRequest(
      requestId,
      {
        status: 'declined',
        presence: 'not-confirmed',
        captainMessage: 'Captain declined this request. RideRelay will assign another Captain.',
        alertSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      `${captainProfile.name} declined ${request?.rider ?? 'rider'} request. Rider alert sent and RideRelay will move request to another Captain.`
    );

    try {
      await apiRequest(`/api/captain/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'declined',
          captainMessage: 'Captain declined this request. RideRelay will assign another Captain.'
        })
      });
      setBackendStatus('Captain decline saved in backend.');
    } catch (error) {
      setBackendStatus(`Backend decline update skipped: ${error.message}`);
    }
  };

  const handleCaptainPresence = async (requestId, isPresent) => {
    const request = captainRequests.find((item) => item.id === requestId);
    const withinRange = (request?.distanceMeters ?? 9999) <= 500;
    const captainMessage = isPresent
      ? 'Rider confirmed Captain is present at pickup. Captain can start the ride.'
      : withinRange
        ? 'Captain is near your pickup location and will reach you shortly. Please wait at the pickup pin.'
        : 'Captain is not at pickup location. RideRelay will help you choose another Captain.';

    updateCaptainRequest(
      requestId,
      {
        presence: isPresent ? 'present' : 'absent',
        status: isPresent ? 'present-at-pickup' : withinRange ? 'accepted' : 'location-alert',
        captainMessage,
        alertSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      isPresent
        ? `Rider confirmed Captain is present at ${request?.pickup}. Start Ride is unlocked.`
        : withinRange
          ? `Rider marked Captain not at location, but GPS is within ${request?.distanceMeters ?? 500}m. Alert sent: Captain will reach shortly.`
          : `Rider marked Captain not at location and GPS is outside 500m. Rider can choose another Captain.`
    );

    try {
      await apiRequest(`/api/rides/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'present-at-pickup' })
      });
      setBackendStatus(isPresent ? 'Pickup presence saved in backend.' : 'Pickup alert saved in backend.');
    } catch (error) {
      setBackendStatus(`Backend presence update skipped: ${error.message}`);
    }
  };

  const handleCaptainRideStatus = async (requestId, status, sharedFare) => {
    const request = captainRequests.find((item) => item.id === requestId);
    const isCompleted = status === 'ride-completed';
    const completedFare = sharedFare ?? request?.fare ?? 0;

    if (!request) {
      return;
    }

    if (status === 'ride-started') {
      const routeSource = resolveLocationArea(captainRoute.source);
      const routeDestination = resolveLocationArea(captainRoute.destination);
      const activeVehicleSeatCount = captainRequests.filter((item) => (
        item.status === 'ride-started'
        && item.id !== requestId
        && isCaptainHopAligned(item, routeSource, routeDestination)
      )).length;
      const pickupRunningRideCount = captainRequests.filter((item) => (
        item.status === 'ride-started'
        && normalize(item.pickup) === normalize(request.pickup)
        && item.id !== requestId
      )).length;
      const vacantSeatLimit = Math.max(1, Number(captainRoute.vacantSeats) || 1);

      if (activeVehicleSeatCount >= vacantSeatLimit || pickupRunningRideCount >= vacantSeatLimit) {
        const fullMessage = `${request.pickup} vehicle has been full. Start Ride is locked until one rider completes or a seat becomes free.`;

        updateCaptainRequest(
          requestId,
          {
            captainMessage: fullMessage,
            alertSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          fullMessage
        );
        setCaptainRouteAlert(fullMessage);
        return;
      }
    }

    if (isCompleted) {
      setCaptainSession((current) => ({
        ...current,
        coveredMoney: Math.min(current.targetMoney, current.coveredMoney + completedFare),
        active: current.coveredMoney + completedFare < current.targetMoney
      }));
    }

    updateCaptainRequest(
      requestId,
      {
        status,
        ...(isCompleted ? { fare: completedFare } : {}),
        captainMessage: status === 'ride-started'
          ? 'Ride started. Share live ride safety status until drop point.'
          : 'Ride completed. Please complete payment and review.',
        alertSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      status === 'ride-started'
        ? 'Ride started by Captain. Rider alert sent.'
        : `Ride completed. Shared fare Rs ${completedFare} counted toward Captain ${captainSession.period.toLowerCase()} earnings.`
    );

    try {
      await apiRequest(`/api/rides/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setBackendStatus(status === 'ride-started' ? 'Ride start saved in backend.' : 'Ride completion saved in backend.');
      if (isCompleted) {
        await syncCaptainRequestsFromBackend();
      }
    } catch (error) {
      setBackendStatus(`Backend ride status update skipped: ${error.message}`);
    }
  };

  const handleCloseCaptainSession = () => {
    setCaptainSession((current) => ({
      ...current,
      coveredMoney: 0,
      active: true
    }));
    setCaptainPanelMessage(`Captain ${captainSession.period.toLowerCase()} earnings progress reset. Route fare sharing is not changed.`);
  };

  const scrollToSignup = () => {
    setAppPage('auth');
  };

  const handlePaymentMethod = (method) => {
    setPaymentMethod(method);
    setPaymentStatus(bookedRide ? `Rs ${bookedRide.fare} ready to pay by ${method}.` : `${method} selected for your ride.`);
  };

  const handlePayNow = async () => {
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

  useEffect(() => {
    if (appPage === 'captain' && apiSession?.user?.role === 'captain') {
      syncCaptainRequestsFromBackend();
    }
  }, [appPage, apiSession?.profile?.id]);

  const renderAuthPage = () => {
    const isSignup = authMode === 'signup';

    return (
      <div className="app auth-app">
        <nav className="navbar auth-brand-only">
          <div className="brand-lockup">
            <img className="brand-logo" src={assetPath('riderelay-logo.png')} alt="RideRelay logo mark" />
            <div className="brand-title-block">
              <h1 className="sr-only">RideRelay</h1>
              <img className="brand-title-image exact-title" src={assetPath('riderelay-name.png')} alt="RideRelay - Travel Smart and Together" />
            </div>
          </div>
        </nav>

        <section className="signup-section auth-screen" id="signup-panel">
          <div className="signup-shell auth-single-shell">
            <form className="signup-card auth-entry-card" onSubmit={isSignup ? handleSignupSubmit : handleLoginSubmit}>
              <div className="section-title compact auth-card-title">
                <h2>{isSignup ? 'Create account' : 'Welcome back!'}</h2>
                <p>{isSignup ? 'Complete valid details to open your Rider or Captain page.' : 'Login to your Rider or Captain account.'}</p>
              </div>

              <div className="form-group role-select-card">
                <label htmlFor="auth-role">Account Type</label>
                <select id="auth-role" value={signupRole} onChange={(event) => setSignupRole(event.target.value)}>
                  <option>Rider</option>
                  <option>Captain</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="auth-email">Email / Gmail</label>
                <input id="auth-email" type="email" value={signupForm.email} onChange={(event) => handleSignupChange('email', event.target.value)} placeholder="name@example.com" />
                {authErrors.email && <small className="field-error">{authErrors.email}</small>}
              </div>

              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <input id="auth-password" type="password" value={signupForm.password} onChange={(event) => handleSignupChange('password', event.target.value)} placeholder="Enter password" />
                {authErrors.password && <small className="field-error">{authErrors.password}</small>}
              </div>

              {isSignup && (
                <>
                  <div className="form-group">
                    <label htmlFor="auth-name">Full Name</label>
                    <input id="auth-name" value={signupForm.fullName} onChange={(event) => handleSignupChange('fullName', event.target.value)} placeholder="Enter valid full name" />
                    {authErrors.fullName && <small className="field-error">{authErrors.fullName}</small>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="auth-phone">Phone Number</label>
                    <input id="auth-phone" value={signupForm.phone} onChange={(event) => handleSignupChange('phone', event.target.value)} placeholder="+91 mobile number" />
                    {authErrors.phone && <small className="field-error">{authErrors.phone}</small>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="auth-gender">Gender</label>
                    <select id="auth-gender" value={signupForm.gender} onChange={(event) => handleSignupChange('gender', event.target.value)}>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="auth-home">Home / Primary Stop</label>
                    <input id="auth-home" list="stops" value={signupForm.homeStop} onChange={(event) => handleSignupChange('homeStop', event.target.value)} placeholder="Ameerpet, KPHB, Charminar..." />
                    {authErrors.homeStop && <small className="field-error">{authErrors.homeStop}</small>}
                  </div>

                  {signupRole === 'Rider' && (
                    <div className="form-group">
                      <label htmlFor="auth-emergency">Emergency Contact</label>
                      <input id="auth-emergency" value={signupForm.emergencyContact} onChange={(event) => handleSignupChange('emergencyContact', event.target.value)} placeholder="Family member phone number" />
                      {authErrors.emergencyContact && <small className="field-error">{authErrors.emergencyContact}</small>}
                    </div>
                  )}

                  {signupRole === 'Captain' && (
                    <div className="captain-doc-fields">
                      <div className="form-group">
                        <label htmlFor="auth-vehicle">Vehicle Type</label>
                        <select id="auth-vehicle" value={signupForm.vehicleType} onChange={(event) => handleSignupChange('vehicleType', event.target.value)}>
                          <option>Bike</option>
                          <option>Car</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="auth-vehicle-number">Vehicle Number</label>
                        <input id="auth-vehicle-number" value={signupForm.vehicleNumber} onChange={(event) => handleSignupChange('vehicleNumber', event.target.value)} placeholder="TS09 RR 1234" />
                        {authErrors.vehicleNumber && <small className="field-error">{authErrors.vehicleNumber}</small>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="auth-license">Driving License</label>
                        <input id="auth-license" value={signupForm.licenseNumber} onChange={(event) => handleSignupChange('licenseNumber', event.target.value)} placeholder="Valid license number" />
                        {authErrors.licenseNumber && <small className="field-error">{authErrors.licenseNumber}</small>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="auth-preference">Ride Preference</label>
                        <select id="auth-preference" value={signupForm.preferredRider} onChange={(event) => handleSignupChange('preferredRider', event.target.value)}>
                          <option>Any verified rider</option>
                          <option>Female rider only</option>
                          <option>Known route riders</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              <button className="search-btn auth-login-btn" type="submit">
                {isSignup ? `Create ${signupRole} Account` : `Login as ${signupRole}`}
              </button>

              <button className="auth-create-link" type="button" onClick={() => {
                setAuthMode(isSignup ? 'login' : 'signup');
                setAuthErrors({});
              }}>
                {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
              </button>

              <p className="auth-status-line">{authStatus}</p>
            </form>
          </div>
        </section>
      </div>
    );
  };

  if (appPage === 'auth') {
    return renderAuthPage();
  }

  const captainRouteSource = resolveLocationArea(captainRoute.source);
  const captainRouteDestination = resolveLocationArea(captainRoute.destination);
  const captainRouteDistance = getLegDistanceKm(captainRouteSource, captainRouteDestination);
  const captainRoutePricing = getCaptainRoutePricing(captainRouteDistance, captainRoute.vacantSeats);
  const pickupHub = getNearestHub(pickup);
  const dropHub = getNearestHub(destination);
  const pickupWalk = getWalkingMetrics(pickupHub?.distanceMeters ?? 0);
  const dropWalk = getWalkingMetrics(dropHub?.distanceMeters ?? 0);
  const totalWalkingKm = pickupWalk.distanceKm + dropWalk.distanceKm;
  const totalCaloriesBurned = pickupWalk.calories + dropWalk.calories;
  const ecoPointsEarned = getRideRelayEcoPoints(pickupWalk.distanceMeters, dropWalk.distanceMeters, Boolean(bookedRideId || hasSearched), Boolean(pickupHub && dropHub));
  const monthlyImpact = {
    walkingKm: totalWalkingKm + 4.8,
    calories: totalCaloriesBurned + 240,
    fuelSaved: Math.max(1.2, (validationInfo?.distanceKm || captainRouteDistance || 12) * 0.08),
    co2Reduced: Math.max(1.6, (validationInfo?.distanceKm || captainRouteDistance || 12) * CO2_KG_PER_KM_SHARED),
    ecoPoints: ecoPointsEarned + 42
  };
  const riderRouteDistance = validationInfo?.distanceKm || getLegDistanceKm(resolveLocationArea(pickup), resolveLocationArea(destination));
  const riderFuelPricing = getCaptainRoutePricing(riderRouteDistance, Math.max(requiredSeats, totalAvailableSeats > 1 ? 2 : 1));
  const captainStartPoint = getLocationPoint(captainRouteSource);
  const captainLiveDistanceMeters = captainLiveLocation && captainStartPoint ? getDistanceMeters(captainLiveLocation, captainStartPoint) : 0;
  const captainStartTrust = captainLiveLocation
    ? captainLiveDistanceMeters <= 500
      ? 'Live start verified within 500m.'
      : `Warning: Captain live location is ${captainLiveDistanceMeters}m away from declared start.`
    : 'Use Live GPS to verify Captain start location before matching.';
  const captainVisibleRequests = captainRequests.filter((request) => isCaptainHopAligned(request, captainRouteSource, captainRouteDestination));
  const captainCurrentPin = getCaptainLastCompletedPin(captainVisibleRequests, captainRouteSource);
  const captainCurrentPendingRequests = captainVisibleRequests.filter((request) => (
    request.status !== 'pending'
    || isCaptainHopAligned(request, captainCurrentPin, captainRouteDestination)
  ));
  const pickupSeatLimit = Math.max(1, Number(captainRoute.vacantSeats) || 1);
  const activeCaptainRequests = captainCurrentPendingRequests.filter((request) => isActiveCaptainRequest(request));
  const currentVacantSeats = Math.max(0, pickupSeatLimit - activeCaptainRequests.length);
  const fullPickupPins = captainCurrentPendingRequests.reduce((pins, request) => {
    if (!isActiveCaptainRequest(request)) {
      return pins;
    }

    const pickupKey = normalize(request.pickup);
    const activePickupSeats = captainCurrentPendingRequests.filter((item) => (
      isActiveCaptainRequest(item)
      && normalize(item.pickup) === pickupKey
    )).length;

    return activePickupSeats >= pickupSeatLimit ? [...new Set([...pins, request.pickup])] : pins;
  }, []);
  const stoppedPickupRequests = captainCurrentPendingRequests.filter((request) => (
    request.status === 'pending'
    && (
      currentVacantSeats === 0
      || fullPickupPins.some((pickupPin) => normalize(pickupPin) === normalize(request.pickup))
    )
  ));
  const captainFeedRequests = captainCurrentPendingRequests.filter((request) => (
    request.status !== 'pending'
    || (
      currentVacantSeats > 0
      && !fullPickupPins.some((pickupPin) => normalize(pickupPin) === normalize(request.pickup))
    )
  ));
  const sameDestinationCount = captainVisibleRequests.filter((request) => normalize(request.destination) === normalize(captainRouteDestination)).length;
  const captainPendingCount = captainFeedRequests.filter((request) => request.status === 'pending').length;
  const captainAcceptedCount = activeCaptainRequests.length;
  const captainDeclinedCount = captainVisibleRequests.filter((request) => request.status === 'declined').length;
  const acceptedCaptainRequests = captainVisibleRequests.filter((request) => ['accepted', 'present-at-pickup', 'ride-started', 'ride-completed'].includes(request.status));
  const declinedCaptainRequests = captainVisibleRequests.filter((request) => request.status === 'declined');
  const completedCaptainRequests = captainVisibleRequests.filter((request) => request.status === 'ride-completed');
  const completedRiderTotalAmount = captainSession.coveredMoney;
  const sessionTargetRemaining = Math.max(0, captainSession.targetMoney - captainSession.coveredMoney);
  const arrangedRiderPlan = getArrangedCaptainRiderPlan(
    captainFeedRequests,
    captainCurrentPin,
    captainRouteDestination,
    sessionTargetRemaining || captainRoute.targetMoney,
    captainRoute.vacantSeats
  );
  const arrangedFareByRequestId = new Map(arrangedRiderPlan.arrangedRiders.map((request) => [request.id, request.fare]));
  const captainControlRequests = captainCurrentPendingRequests
    .filter((request) => request.status !== 'declined')
    .map((request, index) => ({
      ...request,
      order: index + 1,
      leg: request.status === 'ride-completed' ? 'Completed Leg' : `Leg Step ${index + 1}`,
      fare: arrangedFareByRequestId.get(request.id) ?? request.fare
    }));
  const targetFitRiders = arrangedRiderPlan.targetRiders;
  const targetFitAmount = arrangedRiderPlan.targetFare;
  const targetGap = sessionTargetRemaining;
  const targetCanBeCovered = arrangedRiderPlan.targetReached || targetGap === 0;
  const captainWholeRideCompleted = completedCaptainRequests.length > 0
    && sessionTargetRemaining === 0;
  const verifiedEarningsAmount = Math.min(captainSession.targetMoney, completedRiderTotalAmount);
  const remainingTargetMoney = sessionTargetRemaining;
  const riderHopPins = [...new Set(arrangedRiderPlan.arrangedRiders.map((request) => `${request.pickup} -> ${request.destination}`))];
  const allMatchingRidersAreDirect = arrangedRiderPlan.matchingRiders.length > 0
    && arrangedRiderPlan.matchingRiders.every((request) => (
      normalize(request.pickup) === normalize(captainCurrentPin)
      && normalize(request.destination) === normalize(captainRouteDestination)
    ));
  const captainTotalRideCount = captainRequests.filter((request) => (
    ['accepted', 'present-at-pickup', 'ride-started', 'ride-completed'].includes(request.status)
  )).length;
  const captainCompletedRideCount = captainRequests.filter((request) => request.status === 'ride-completed').length;
  const captainDashboardReviews = [
    { id: 'RV-1', rider: 'Ananya Rao', mood: 'Happy', emoji: '😊', note: 'Captain reached pickup and completed the hop safely.' },
    { id: 'RV-2', rider: 'Priya Menon', mood: 'Moderate', emoji: '🙂', note: 'Ride was okay, pickup alert was useful.' },
    { id: 'RV-3', rider: 'Suresh Kumar', mood: 'Sad', emoji: '☹️', note: 'Captain delayed at pickup, needs better timing.' }
  ];
  const visibleCaptainReviews = captainRatingFilter === 'All'
    ? captainDashboardReviews
    : captainDashboardReviews.filter((review) => review.mood === captainRatingFilter);
  const happyReviewCount = captainDashboardReviews.filter((review) => review.mood === 'Happy').length;
  const captainRatingScore = Math.max(1, Math.min(5, (4 + happyReviewCount * 0.2).toFixed(1)));
  const hasCaptainQrRecord = Boolean(captainProfile.qrPreviewUrl);
  const isCaptainQrPdf = captainProfile.qrFileType === 'pdf';
  const renderCaptainQrPreview = (className = '') => {
    if (!hasCaptainQrRecord) {
      return <span className={`qr-box ${className}`.trim()}>QR</span>;
    }

    if (isCaptainQrPdf) {
      return (
        <div className={`qr-pdf-preview ${className}`.trim()}>
          <strong>PDF</strong>
          <span>{captainProfile.qrFileName}</span>
        </div>
      );
    }

    return (
      <img
        className={`qr-image-preview ${className}`.trim()}
        src={captainProfile.qrPreviewUrl}
        alt="Captain uploaded payment QR"
      />
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
          <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {appPage === 'rider' && (
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
            <button onClick={() => setActivePanel('eco-points')}>RideRelay Points</button>
          </div>

          <div className="relay-point-strip">
            <div className="relay-point-heading">
              <span>GPS safe pickup points near {pickup}</span>
              <strong>Captain receives selected pin only</strong>
            </div>
            <div className="relay-point-grid">
              {nearbyRideRelayPoints.map((location) => (
                <div
                  className={normalize(pickup) === normalize(location.area) ? 'relay-point-card selected' : 'relay-point-card'}
                  key={`nearby-${location.id}`}
                >
                  <button type="button" onClick={() => handleUseLocation(location, 'pickup')}>
                    <span>{location.type}</span>
                    <strong>{location.area}</strong>
                    <small>{location.pickupHint} . {location.distanceMeters}m</small>
                  </button>
                  <a href={getNativeMapUrl(location)} rel="noreferrer" target="_blank">Navigate</a>
                </div>
              ))}
            </div>
          </div>

          <RideRelayMapPanel
            title="Rider live route map"
            subtitle="Street, satellite, terrain, and route traffic view with safe RideRelay pickup pins."
            pickup={pickup}
            destination={destination}
            nearbyPoints={nearbyRideRelayPoints}
            livePoint={riderLiveLocation}
            liveLabel="Rider live GPS"
            mapMode={riderMapMode}
            setMapMode={setRiderMapMode}
            onUseLiveLocation={() => handleUseLiveLocation('rider')}
            safetyNote="Captain receives assigned pickup pin, not unnecessary full rider journey."
          />

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
      )}

      {false && (
      <section className="signup-section" id="signup-panel">
        <div className="section-title compact">
          <h2>
            Create <span>RideRelay Account</span>
          </h2>
          <p>One signup page for Rider and Captain. The form is API-ready for email or Gmail login.</p>
        </div>

        <div className="signup-shell">
          <form className="signup-card" onSubmit={handleSignupSubmit}>
            <div className="mode-switch" aria-label="Choose account role">
              {['Rider', 'Captain'].map((role) => (
                <button
                  className={signupRole === role ? 'active' : ''}
                  key={role}
                  onClick={() => setSignupRole(role)}
                  type="button"
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="auth-actions">
              <button className={signupMethod === 'Email' ? 'active' : ''} onClick={() => setSignupMethod('Email')} type="button">Email Signup</button>
              <button className={signupMethod === 'Gmail' ? 'active' : ''} onClick={handleContinueWithGmail} type="button">Continue with Gmail</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input id="signup-name" value={signupForm.fullName} onChange={(event) => handleSignupChange('fullName', event.target.value)} placeholder="Enter valid full name" />
              </div>
              <div className="form-group">
                <label htmlFor="signup-phone">Phone Number</label>
                <input id="signup-phone" value={signupForm.phone} onChange={(event) => handleSignupChange('phone', event.target.value)} placeholder="+91 mobile number" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-email">Email / Gmail</label>
                <input id="signup-email" type="email" value={signupForm.email} onChange={(event) => handleSignupChange('email', event.target.value)} placeholder="name@example.com" />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input id="signup-password" type="password" value={signupForm.password} onChange={(event) => handleSignupChange('password', event.target.value)} placeholder={signupMethod === 'Gmail' ? 'Handled by Gmail login' : 'Create password'} disabled={signupMethod === 'Gmail'} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-gender">Gender</label>
                <select id="signup-gender" value={signupForm.gender} onChange={(event) => handleSignupChange('gender', event.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="signup-home">Home / Primary Stop</label>
                <input id="signup-home" list="stops" value={signupForm.homeStop} onChange={(event) => handleSignupChange('homeStop', event.target.value)} placeholder="Ameerpet, KPHB, Charminar..." />
              </div>
            </div>

            {signupRole === 'Rider' && (
              <div className="form-group">
                <label htmlFor="signup-emergency">Emergency Contact</label>
                <input id="signup-emergency" value={signupForm.emergencyContact} onChange={(event) => handleSignupChange('emergencyContact', event.target.value)} placeholder="Family member phone number" />
              </div>
            )}

            {signupRole === 'Captain' && (
              <div className="captain-doc-fields">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="captain-vehicle">Vehicle Type</label>
                    <select id="captain-vehicle" value={signupForm.vehicleType} onChange={(event) => handleSignupChange('vehicleType', event.target.value)}>
                      <option>Bike</option>
                      <option>Car</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="captain-number">Vehicle Number</label>
                    <input id="captain-number" value={signupForm.vehicleNumber} onChange={(event) => handleSignupChange('vehicleNumber', event.target.value)} placeholder="TS09 RR 1234" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="captain-license">Driving License</label>
                    <input id="captain-license" value={signupForm.licenseNumber} onChange={(event) => handleSignupChange('licenseNumber', event.target.value)} placeholder="Valid license number" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="captain-preference">Ride Preference</label>
                    <select id="captain-preference" value={signupForm.preferredRider} onChange={(event) => handleSignupChange('preferredRider', event.target.value)}>
                      <option>Any verified rider</option>
                      <option>Female rider only</option>
                      <option>Known route riders</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button className="search-btn" type="submit">Create {signupRole} Account</button>
          </form>

            <div className="api-card hidden-api-card">
              <span>Dynamic API Flow</span>
              <h3>{apiPreview.signup}</h3>
              <p>{authStatus}</p>
            <div className="api-list">
              <code>{apiPreview.gmail}</code>
              <code>{apiPreview.captainRequests}</code>
              <code>{apiPreview.presence}</code>
            </div>
            <div className="signup-records">
              {signupRecords.map((record) => (
                <div className="signup-record" key={record.id}>
                  <strong>{record.name}</strong>
                  <span>{record.role} . {record.method} . {record.verification}</span>
                </div>
              ))}
              {!signupRecords.length && <p>No signup submitted yet.</p>}
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="rider-dashboard" id="rider-panel">
        <div className="section-title">
          <h2>
            {appPage === 'captain' ? 'Captain' : 'Rider'} <span>Control Panel</span>
          </h2>
          <p>{appPage === 'captain' ? 'Manage rider requests, pickup presence, start ride, and completion from one Captain page.' : 'Manage profile, payment, safety, offers, and trip activity in one place.'}</p>
        </div>

        <div className="dashboard-shell">
          <aside className="panel-tabs" aria-label="Rider panels">
            {(appPage === 'captain'
              ? [['captain-dashboard', 'Dashboard'], ['captain', 'Route Setup'], ['captain-riders', 'Rider Section'], ['captain-bank', 'Bank Details']]
              : [
                ['home', 'Home'],
                ['rider-search', 'Rider Search'],
                ['fixed-hubs', 'Fixed Pickup Hubs'],
                ['eco-points', 'RideRelay Points'],
                ['monthly-impact', 'Monthly Impact'],
                ['rewards', 'Rewards'],
                ['trust', 'Safety & Trust'],
                ['profile', 'Profile'],
                ['payments', 'Payments'],
                ['trips', 'Trips'],
                ['locations', 'Locations'],
                ['offers', 'Offers']
              ]).map(([key, label]) => (
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
            {activePanel === 'home' && (
              <div className="panel-grid platform-grid">
                <div className="panel-card platform-hero-card">
                  <span>Save Fuel . Save Money . Share Empty Seats</span>
                  <h3>RideRelay is fixed-hub fuel sharing, not taxi booking.</h3>
                  <p>Riders walk to safe pickup hubs like metro stations, bus stops, and railway stations. Captains share unused seats only when their route already passes through those hubs.</p>
                  <button className="panel-action" type="button" onClick={() => setActivePanel('rider-search')}>Start Rider Search</button>
                </div>

                <div className="platform-card-list">
                  <div className="platform-mini-card">
                    <span>Pickup Hub</span>
                    <strong>{pickupHub?.name ?? pickup}</strong>
                    <small>{pickupWalk.distanceMeters}m walk . {pickupWalk.minutes} min</small>
                  </div>
                  <div className="platform-mini-card">
                    <span>Fuel Share</span>
                    <strong>Rs {riderFuelPricing.rideRelayPrice}</strong>
                    <small>Saved Rs {riderFuelPricing.amountSaved} vs Rapido style price</small>
                  </div>
                  <div className="platform-mini-card">
                    <span>RideRelay Points</span>
                    <strong>{ecoPointsEarned}</strong>
                    <small>Earn Eco Points from walking, hub pickup, and shared rides</small>
                  </div>
                </div>

                <div className="panel-card corridor-panel">
                  <h3>Saved High-Demand Corridors</h3>
                  <p>RideRelay marks these city flows as strong rider and Captain zones. Captains should pass through these fixed hubs instead of taking doorstep detours.</p>
                  <div className="corridor-grid">
                    {highDemandCorridors.map((corridor) => (
                      <div className="corridor-card" key={corridor.id}>
                        <span>{corridor.demand}</span>
                        <strong>{corridor.title}</strong>
                        <p>{corridor.hubs.join(' -> ')}</p>
                        <small>{corridor.note}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'rider-search' && (
              <div className="panel-grid platform-grid">
                <div className="panel-card">
                  <h3>Rider Search</h3>
                  <p>Select fixed pickup and drop hubs. RideRelay matches only Captains already passing through those hubs.</p>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="hub-pickup">Pickup Hub</label>
                      <input id="hub-pickup" list="stops" value={pickup} onChange={(event) => setPickup(event.target.value)} />
                      <small className="input-help">Nearest official hub: {pickupHub?.name ?? 'Select pickup'}</small>
                    </div>
                    <div className="form-group">
                      <label htmlFor="hub-drop">Drop Hub</label>
                      <input id="hub-drop" list="stops" value={destination} onChange={(event) => setDestination(event.target.value)} />
                      <small className="input-help">Nearest official hub: {dropHub?.name ?? 'Select drop'}</small>
                    </div>
                  </div>

                  <div className="hub-metric-grid">
                    <div>
                      <span>Walk to pickup hub</span>
                      <strong>{pickupWalk.distanceKm.toFixed(1)} km</strong>
                      <small>{pickupWalk.minutes} min walk</small>
                    </div>
                    <div>
                      <span>Walk from drop hub</span>
                      <strong>{dropWalk.distanceKm.toFixed(1)} km</strong>
                      <small>{dropWalk.minutes} min walk</small>
                    </div>
                    <div>
                      <span>Route match rule</span>
                      <strong>No detour</strong>
                      <small>Captain must pass through both hubs</small>
                    </div>
                  </div>

                  <button className="panel-action" type="button" onClick={handleFindRide}>Find Hub Match</button>
                </div>

                <div className="panel-card">
                  <h3>Fuel Sharing Price</h3>
                  <div className="price-comparison-grid">
                    <div>
                      <span>Rapido style price</span>
                      <strong>Rs {riderFuelPricing.rapidoPrice}</strong>
                    </div>
                    <div>
                      <span>RideRelay price</span>
                      <strong>Rs {riderFuelPricing.rideRelayPrice}</strong>
                    </div>
                    <div>
                      <span>Amount saved</span>
                      <strong>Rs {riderFuelPricing.amountSaved}</strong>
                    </div>
                  </div>
                  <p className="calorie-line">RideRelay share rate is Rs {CAPTAIN_SHARE_RATE_PER_KM}/km. It is split by seats plus Rs {riderFuelPricing.platformFee} platform fee.</p>
                </div>
              </div>
            )}

            {activePanel === 'fixed-hubs' && (
              <div className="panel-grid platform-grid">
                <div className="panel-card">
                  <h3>Fixed Pickup Hubs</h3>
                  <p>Doorstep pickup is avoided. Riders select official public hubs for safety, lower cost, and easy Captain identification.</p>
                  <div className="hub-metric-grid">
                    {[pickupHub, dropHub, ...nearbyRideRelayPoints.slice(0, 4)].filter(Boolean).map((hub) => (
                      <div key={`hub-module-${hub.id}`}>
                        <span>{hub.type}</span>
                        <strong>{hub.name}</strong>
                        <small>{hub.pickupHint} . {hub.distanceMeters ?? 0}m</small>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-card corridor-panel">
                  <h3>Interconnected Far-City Hubs</h3>
                  <p>Kokapet, Nanakramguda, Manikonda, Narsingi, Financial District, Gachibowli, Madhapur, Kondapur, and HITEC City are treated as connected high-flow RideRelay points.</p>
                  <div className="corridor-grid compact">
                    {highDemandCorridors.map((corridor) => (
                      <div className="corridor-card" key={`fixed-${corridor.id}`}>
                        <strong>{corridor.title}</strong>
                        <p>{corridor.hubs.join(' -> ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <RideRelayMapPanel
                  title="Fixed hub map"
                  subtitle="Official pickup/drop hubs with satellite, terrain, street, and traffic mode."
                  pickup={pickupHub?.area || pickup}
                  destination={dropHub?.area || destination}
                  nearbyPoints={nearbyRideRelayPoints}
                  livePoint={riderLiveLocation}
                  liveLabel="Rider live GPS"
                  mapMode={riderMapMode}
                  setMapMode={setRiderMapMode}
                  onUseLiveLocation={() => handleUseLiveLocation('rider')}
                  safetyNote="Fixed hubs reduce fake pickup points and keep Captain route matching clean."
                />
              </div>
            )}

            {activePanel === 'eco-points' && (
              <div className="panel-grid platform-grid">
                <div className="panel-card">
                  <h3>RideRelay Points System</h3>
                  <p>Rewards are based only on valid RideRelay actions. No daily streaks or fake completion points.</p>
                  <div className="eco-rule-list">
                    <span>Walk 100m to pickup hub = 1 Eco Point</span>
                    <span>Walk 100m from drop hub = 1 Eco Point</span>
                    <span>Use shared RideRelay trip = 2 Eco Points</span>
                    <span>Choose official pickup hub = 3 bonus Eco Points</span>
                    <span>Refer friend after first successful ride = 25 Eco Points</span>
                  </div>
                </div>

                <div className="panel-card">
                  <h3>Calories Tracker</h3>
                  <strong className="impact-number">{totalCaloriesBurned} kcal</strong>
                  <p className="calorie-line">You walked {totalWalkingKm.toFixed(1)} km and burned approx {totalCaloriesBurned} kcal.</p>
                  <div className="hub-metric-grid">
                    <div>
                      <span>Pickup walk points</span>
                      <strong>{pickupWalk.ecoPoints}</strong>
                    </div>
                    <div>
                      <span>Drop walk points</span>
                      <strong>{dropWalk.ecoPoints}</strong>
                    </div>
                    <div>
                      <span>Total RideRelay Points</span>
                      <strong>{ecoPointsEarned}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'monthly-impact' && (
              <div className="panel-card">
                <h3>Monthly Impact Dashboard</h3>
                <p>RideRelay shows real impact from hub walking and shared empty-seat rides.</p>
                <div className="impact-grid">
                  <div>
                    <span>Total walking distance</span>
                    <strong>{monthlyImpact.walkingKm.toFixed(1)} km</strong>
                  </div>
                  <div>
                    <span>Calories burned</span>
                    <strong>{monthlyImpact.calories} kcal</strong>
                  </div>
                  <div>
                    <span>Fuel saved</span>
                    <strong>{monthlyImpact.fuelSaved.toFixed(1)} L</strong>
                  </div>
                  <div>
                    <span>CO2 reduced</span>
                    <strong>{monthlyImpact.co2Reduced.toFixed(1)} kg</strong>
                  </div>
                  <div>
                    <span>RideRelay Points earned</span>
                    <strong>{monthlyImpact.ecoPoints}</strong>
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'rewards' && (
              <div className="panel-card">
                <h3>Rewards</h3>
                <p>RideRelay rewards are simple and clean: walking to hubs, shared trips, official hub usage, and referral after first successful ride.</p>
                <div className="reward-grid">
                  <div>
                    <strong>{ecoPointsEarned}</strong>
                    <span>Current RideRelay Points</span>
                  </div>
                  <div>
                    <strong>25</strong>
                    <span>Referral after first successful ride</span>
                  </div>
                  <div>
                    <strong>3</strong>
                    <span>Official hub bonus</span>
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'trust' && (
              <div className="panel-grid platform-grid">
                <div className="panel-card safety-list">
                  <h3>Safety & Trust</h3>
                  <span>Captain cannot fake start location.</span>
                  <span>If live location is far from declared start, RideRelay shows warning.</span>
                  <span>Captain must declare available seats before trip.</span>
                  <span>Riders can report fake seat count or route mismatch.</span>
                  <span>Captain sees only assigned hop pickup and hop destination.</span>
                </div>

                <div className="panel-card">
                  <h3>Captain Live Start Check</h3>
                  <p>{captainStartTrust}</p>
                  <button className="panel-action" type="button" onClick={() => handleUseLiveLocation('captain')}>Verify Captain Live Start</button>
                </div>
              </div>
            )}

            {activePanel === 'profile' && (
              <div className="panel-grid">
                <div className="panel-card profile-card">
                  <div className="avatar">{riderProfile.name.slice(0, 1)}</div>
                  <div>
                    <h3>{riderProfile.name}</h3>
                    <p>Verified rider. 34 shared trips completed.</p>
                  </div>
                  <button className="btn-mini profile-edit-btn" onClick={() => {
                    setIsProfileEditing((editing) => !editing);
                    setProfileStatus(isProfileEditing ? 'Profile edit cancelled.' : 'Edit mode enabled. Details are now mutable.');
                  }}>
                    {isProfileEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="panel-card">
                  <div className="profile-panel-heading">
                    <div>
                      <h3>{isProfileEditing ? 'Update Profile' : 'Profile Details'}</h3>
                      <p>{profileStatus}</p>
                    </div>
                    {!isProfileEditing && <span className="locked-pill">Locked</span>}
                  </div>

                  {isProfileEditing ? (
                    <>
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
                      <button className="panel-action" onClick={handleProfileUpdate}>Update Profile</button>
                    </>
                  ) : (
                    <div className="profile-readonly-grid">
                      <div>
                        <span>Full Name</span>
                        <strong>{riderProfile.name}</strong>
                      </div>
                      <div>
                        <span>Phone</span>
                        <strong>{riderProfile.phone}</strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{riderProfile.email}</strong>
                      </div>
                      <div>
                        <span>Home Stop</span>
                        <strong>{riderProfile.home}</strong>
                      </div>
                    </div>
                  )}
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
              <div className="panel-grid location-panel-grid">
                <div className="panel-card location-hub-card">
                  <div className="location-panel-heading">
                    <div>
                      <h3>RideRelay Pickup Points</h3>
                      <p>Use GPS-safe public pins like bus stops, metro gates, junctions, and campus gates. Captain sees only the assigned pickup pin.</p>
                      <small>{locationApiStatus}</small>
                    </div>
                    <strong>{nearbyRideRelayPoints.length} nearby</strong>
                  </div>

                  <div className="nearby-pin-panel">
                    {nearbyRideRelayPoints.map((location) => (
                      <div
                        className={selectedLocationId === location.id ? 'nearby-pin selected' : 'nearby-pin'}
                        key={`safe-${location.id}`}
                      >
                        <button type="button" onClick={() => handleUseLocation(location, 'pickup')}>
                          <span>{location.distanceMeters}m</span>
                          <strong>{location.area}</strong>
                          <small>{location.name} . {location.pickupHint}</small>
                        </button>
                        <a href={getNativeMapUrl(location)} rel="noreferrer" target="_blank">Navigate</a>
                      </div>
                    ))}
                  </div>

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
                  <div className="location-result-meta">
                    <span>{filteredLocations.length} matching places</span>
                    <strong>Showing best {visibleLocationResults.length}</strong>
                  </div>
                  <div className="location-list compact-location-list">
                    {visibleLocationResults.map((location) => (
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

                <div className="panel-card safety-list pickup-safety-card">
                  <h3>Pickup Safety Flow</h3>
                  <p>RideRelay points behave like safe bus-stop pickup pins. They help Captain identify the rider without exposing unnecessary full journey details.</p>
                  <span>Pickup pin: {pickup}</span>
                  <span>Drop point: {destination}</span>
                  <span>Home stop: {riderProfile.home}</span>
                  <span>GPS check: within 500m</span>
                  <span>Shared to Captain: pickup pin only</span>
                  <button className="panel-action" onClick={() => setPickup(riderProfile.home)}>Use Home As Pickup</button>
                </div>
              </div>
            )}

            {activePanel === 'captain-dashboard' && (
              <div className="panel-grid captain-dashboard-grid">
                <div className="panel-card captain-dashboard-hero">
                  <div>
                    <span>Captain Dashboard</span>
                    <h3>{captainProfile.name}</h3>
                    <p>Daily target counts from 00:00 to 23:59. Week and month views are Captain choice.</p>
                  </div>
                  <strong>{captainRatingScore} / 5</strong>
                </div>

                <div className="panel-card captain-target-card">
                  <div className="target-card-heading">
                    <div>
                      <h3>Target Money</h3>
                      <p>{captainSession.period === 'Day' ? 'Day target runs 00:00 to 23:59.' : `Shows this ${captainSession.period.toLowerCase()} earning goal.`}</p>
                    </div>
                    <button className="mini-action" type="button" onClick={handleEditCaptainTarget}>
                      Edit Target
                    </button>
                  </div>

                  <div className="target-readout">
                    <span>{captainSession.period} target value</span>
                    <strong>Rs {captainSession.targetMoney}</strong>
                    <small>Captain earning goal only. Rider fare stays shared and low.</small>
                  </div>

                  {isCaptainTargetEditing && (
                    <div className="target-edit-box">
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="dashboard-target-period">Target Period</label>
                          <select
                            id="dashboard-target-period"
                            value={captainTargetDraft.period}
                            onChange={(event) => handleCaptainEarningTargetChange('period', event.target.value)}
                          >
                            <option>Day</option>
                            <option>Week</option>
                            <option>Month</option>
                          </select>
                          <small className="input-help">{captainTargetDraft.period === 'Day' ? 'Day target runs 00:00 to 23:59.' : `Shows this ${captainTargetDraft.period.toLowerCase()} earning goal.`}</small>
                        </div>
                        <div className="form-group">
                          <label htmlFor="dashboard-target-money">{captainTargetDraft.period} Target Amount</label>
                          <input
                            id="dashboard-target-money"
                            type="number"
                            min="0"
                            value={captainTargetDraft.targetMoney}
                            onChange={(event) => handleCaptainEarningTargetChange('targetMoney', event.target.value)}
                          />
                          <small className="input-help">Update applies only after clicking Update Target.</small>
                        </div>
                      </div>
                      <div className="target-edit-actions">
                        <button className="panel-action target-update-action" type="button" onClick={handleApplyCaptainTarget}>
                          Update Target
                        </button>
                        <button className="mini-action" type="button" onClick={() => setIsCaptainTargetEditing(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="panel-card captain-dashboard-payment">
                  <div>
                    <span>Payment QR / UPI</span>
                    <h3>{captainProfile.upiId}</h3>
                    <p>{captainProfile.accountHolder} . {captainProfile.bankName}</p>
                    <small>{hasCaptainQrRecord ? `Saved file: ${captainProfile.qrFileName}` : 'No QR file uploaded yet.'}</small>
                  </div>
                  <button className="dashboard-qr-button" type="button" onClick={() => setIsQrPreviewOpen(true)}>
                    {renderCaptainQrPreview('dashboard-qr-preview')}
                    <small>View QR</small>
                  </button>
                </div>

                <div className="panel-card dashboard-stat-card">
                  <span>Total Rides</span>
                  <strong>{captainTotalRideCount}</strong>
                  <small>Accepted, active, and completed app rides.</small>
                </div>
                <div className="panel-card dashboard-stat-card">
                  <span>Completed Riders</span>
                  <strong>{captainCompletedRideCount}</strong>
                  <small>Only riders completed inside RideRelay.</small>
                </div>
                <div className="panel-card dashboard-stat-card">
                  <span>{captainSession.period} Earned</span>
                  <strong>Rs {verifiedEarningsAmount}</strong>
                  <small>Verified app payment only.</small>
                </div>
                <div className="panel-card dashboard-stat-card">
                  <span>Remaining Target</span>
                  <strong>Rs {remainingTargetMoney}</strong>
                  <small>Offline deals are not counted.</small>
                </div>

                <div className="panel-card captain-rating-panel">
                  <div className="request-card-heading">
                    <div>
                      <h3>Rider Rating Dialogue</h3>
                      <p>Riders can review Captain with mood faces after payment and ride completion.</p>
                    </div>
                    <div className="rating-filter">
                      {['All', 'Happy', 'Moderate', 'Sad'].map((mood) => (
                        <button
                          type="button"
                          className={captainRatingFilter === mood ? 'active' : ''}
                          key={mood}
                          onClick={() => setCaptainRatingFilter(mood)}
                        >
                          {mood === 'Happy' ? '😊' : mood === 'Moderate' ? '🙂' : mood === 'Sad' ? '☹️' : 'All'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rating-dialogue-grid">
                    {visibleCaptainReviews.map((review) => (
                      <div className="rating-dialogue-card" key={review.id}>
                        <strong>{review.emoji}</strong>
                        <span>{review.rider}</span>
                        <small>{review.mood}</small>
                        <p>{review.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'captain' && (
              <div className="panel-grid captain-panel-grid">
                <div className="panel-card profile-card captain-profile-card">
                  <div className="avatar captain-avatar">{captainProfile.name.slice(0, 1)}</div>
                  <div className="captain-profile-copy">
                    <h3>{captainProfile.name}</h3>
                    <p>{captainProfile.verification} Captain . {captainProfile.vehicleType} . {captainProfile.vehicleNumber}</p>
                    <span>{captainProfile.email}</span>
                    <span>{captainProfile.phone}</span>
                  </div>
                </div>

                <form className="panel-card captain-route-card" onSubmit={handleCaptainRouteSubmit}>
                  <div className="route-card-heading">
                    <div>
                      <h3>Captain Route Setup</h3>
                      <p>Enter the Captain travel path. RideRelay uses this route to suggest suitable rider requests.</p>
                      <small>{locationApiStatus}</small>
                    </div>
                    <strong>{captainRouteDistance.toFixed(1)} km</strong>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="captain-source">From Location</label>
                      <input
                        id="captain-source"
                        list="captain-stops"
                        value={captainRoute.source}
                        onChange={(event) => handleCaptainRouteChange('source', event.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                        placeholder="Captain starting location"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="captain-destination">Destination</label>
                      <input
                        id="captain-destination"
                        list="captain-stops"
                        value={captainRoute.destination}
                        onChange={(event) => handleCaptainRouteChange('destination', event.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                        placeholder="Captain destination"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="captain-vacant">Vacant Count</label>
                      <input
                        id="captain-vacant"
                        type="number"
                        min="1"
                        value={captainRoute.vacantSeats}
                        onChange={(event) => handleCaptainRouteChange('vacantSeats', event.target.value)}
                        placeholder="Available seats"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="captain-route-vehicle">Vehicle Type</label>
                      <select
                        id="captain-route-vehicle"
                        value={captainRoute.vehicleType}
                        onChange={(event) => handleCaptainRouteChange('vehicleType', event.target.value)}
                      >
                        <option>Bike</option>
                        <option>Car</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="captain-route-time">Departure Time</label>
                      <input
                        id="captain-route-time"
                        type="time"
                        value={captainRoute.departureTime}
                        onChange={(event) => handleCaptainRouteChange('departureTime', event.target.value)}
                      />
                      <small className="input-help">Rider matching prioritizes nearest departure time.</small>
                    </div>
                    <div className="form-group trust-warning-box">
                      <label>Live Start Trust</label>
                      <strong>{captainStartTrust}</strong>
                      <small>Captain route matching uses current start location, not home or office address.</small>
                    </div>
                  </div>

                  <RideRelayMapPanel
                    title="Captain route map"
                    subtitle="Captain route with safe rider pickup pins. Traffic mode is route-aware; exact live traffic needs Google API key."
                    pickup={captainRouteSource}
                    destination={captainRouteDestination}
                    nearbyPoints={captainVisibleRequests.slice(0, 8).map((request, index) => {
                      const requestPoint = getLocationPoint(request.pickup) || getLocationPoint(captainRouteSource) || { lat: 17.4375, lng: 78.4483 };

                      return {
                        ...requestPoint,
                        id: `request-${request.id}`,
                        name: `${request.rider} pickup`,
                        area: request.pickup,
                        type: 'Rider Pin',
                        pickupHint: request.destination ? `Hop destination: ${request.destination}` : 'Assigned pickup',
                        distanceMeters: index + 1
                      };
                    })}
                    livePoint={captainLiveLocation}
                    liveLabel="Captain live GPS"
                    mapMode={captainMapMode}
                    setMapMode={setCaptainMapMode}
                    onUseLiveLocation={() => handleUseLiveLocation('captain')}
                    safetyNote="Captain map shows assigned hop pickup/drop only for rider safety."
                  />

                  <datalist id="captain-stops">
                    {availableStops.map((stop) => (
                      <option value={stop} key={`captain-${stop}`} />
                    ))}
                  </datalist>

                  <div className="suggested-route-list">
                    <span>Suggested route for Captain</span>
                    {captainSuggestedRoutes.map((route) => (
                      <button
                        type="button"
                        key={route.id}
                        onClick={() => setCaptainRoute({
                          source: route.stops[0],
                          destination: route.stops[route.stops.length - 1],
                          vacantSeats: captainRoute.vacantSeats,
                          vehicleType: captainRoute.vehicleType,
                          departureTime: captainRoute.departureTime,
                          targetMoney: getCaptainTargetMoney(route.distanceKm),
                          status: `${route.title} selected. Submit to publish this route.`
                        })}
                      >
                        <strong>{route.title}</strong>
                        <small>{route.stops.join(' -> ')} . {route.distanceKm.toFixed(1)} km</small>
                        <small>{route.note}</small>
                      </button>
                    ))}
                  </div>

                  <div className="route-form-actions">
                    <button className="panel-action" type="submit">Update Captain Route</button>
                    <button
                      className="mini-action"
                      type="button"
                      onClick={() => setCaptainRoute((current) => ({
                        ...current,
                        source: '',
                        destination: '',
                        status: 'Enter From and Destination again.'
                      }))}
                    >
                      Clear From / To
                    </button>
                  </div>

                  {captainRouteUpdated && (
                    <div className="post-update-dialogues">
                      <div className="captain-route-preview">
                        <div>
                          <span>Active route</span>
                          <strong>{captainRouteSource} {'->'} {captainRouteDestination}</strong>
                        </div>
                        <div>
                          <span>Same destination riders</span>
                          <strong>{sameDestinationCount} rider{sameDestinationCount === 1 ? '' : 's'} to {captainRouteDestination}</strong>
                        </div>
                        <div>
                          <span>Vacant count</span>
                          <strong>{captainRoute.vacantSeats} seat{Number(captainRoute.vacantSeats) === 1 ? '' : 's'} available</strong>
                        </div>
                        <div>
                          <span>Rider split</span>
                          <strong>Rs {captainRoutePricing.perRiderKm.toFixed(1)}/km each</strong>
                        </div>
                      </div>

                      <div className="route-alert-box route-update-inline updated">
                        <span>Updated route dialogue</span>
                        <strong>{captainRouteAlert}</strong>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            {activePanel === 'captain-riders' && (
              <div className="panel-grid rider-section-grid">
                <div className="panel-card captain-requests-card">
                  <div className="request-card-heading">
                    <div>
                      <h3>Rider Requests</h3>
                      <p>Captain can accept, alert rider, confirm pickup presence, and start ride.</p>
                    </div>
                    <div className="request-count-bar">
                      <span>{captainPendingCount} rider request{captainPendingCount === 1 ? '' : 's'} open</span>
                      <span>{captainAcceptedCount} active</span>
                      <span>{captainDeclinedCount} declined</span>
                      <span>{currentVacantSeats} vacant now</span>
                      {stoppedPickupRequests.length > 0 && (
                        <span>{stoppedPickupRequests.length} stopped alert{stoppedPickupRequests.length === 1 ? '' : 's'}</span>
                      )}
                    </div>
                  </div>

                  <div className="accepted-money-summary">
                    <div>
                      <span>Accepted riders count</span>
                      <strong>{acceptedCaptainRequests.length} rider{acceptedCaptainRequests.length === 1 ? '' : 's'}</strong>
                    </div>
                    <div>
                      <span>{captainSession.period} earning target</span>
                      <strong>Rs {captainSession.targetMoney}</strong>
                    </div>
                    <div>
                      <span>{captainSession.period} earned</span>
                      <strong>Rs {verifiedEarningsAmount}</strong>
                    </div>
                    <div>
                      <span>Remaining</span>
                      <strong>Rs {remainingTargetMoney}</strong>
                    </div>
                    <div className={captainWholeRideCompleted ? 'target-complete' : ''}>
                      <span>Target status</span>
                      <strong>{captainWholeRideCompleted ? 'Target covered' : `Need Rs ${targetGap}`}</strong>
                    </div>
                  </div>

                  {!allMatchingRidersAreDirect && (
                  <div className={`route-alert-box target-fit-box ${targetCanBeCovered ? 'target-ready' : 'target-gap'}`}>
                    <span>RideRelay arranged rider chain</span>
                    <strong>
                      {targetGap === 0
                        ? `Captain ${captainSession.period.toLowerCase()} earning target is covered.`
                        : targetCanBeCovered
                        ? `${targetFitRiders.length} arranged rider${targetFitRiders.length === 1 ? '' : 's'} can contribute Rs ${targetFitAmount} toward the Captain ${captainSession.period.toLowerCase()} earnings target.`
                        : `Arranged riders can contribute Rs ${targetFitAmount}. Need Rs ${Math.max(0, targetGap - targetFitAmount)} more in verified RideRelay payments.`}
                    </strong>
                    <small>
                      Route chain: {targetGap === 0
                        ? 'Captain can reset the earning progress or continue taking verified rides.'
                        : targetFitRiders.length
                        ? targetFitRiders.map((request) => `${request.pickup} to ${request.destination}: ${request.rider} pays Rs ${request.fare}`).join(' | ')
                        : 'No suitable rider chain yet.'}
                    </small>
                    <small>Safety rule: only app-confirmed payments count. Offline deals are not counted in Captain earnings.</small>
                  </div>
                  )}

                  {!allMatchingRidersAreDirect && (
                  <div className="arranged-chain-panel">
                    <div>
                      <span>Captain journey coverage</span>
                      <strong>{captainRouteSource} {'->'} {captainRouteDestination}</strong>
                      <small>{arrangedRiderPlan.arrangedRiders.length} rider hop{arrangedRiderPlan.arrangedRiders.length === 1 ? '' : 's'} arranged in route order.</small>
                    </div>
                    <div>
                      <span>Expected total from arranged riders</span>
                      <strong>Rs {arrangedRiderPlan.totalFare}</strong>
                      <small>Each hop fare is split by available seats. This is not the Captain's full route amount.</small>
                    </div>
                  </div>
                  )}

                  {!allMatchingRidersAreDirect && (
                  <div className="route-chain-list">
                    {arrangedRiderPlan.arrangedRiders.length ? arrangedRiderPlan.arrangedRiders.map((request) => (
                      <div className={targetFitRiders.some((targetRequest) => targetRequest.id === request.id) ? 'chain-step selected' : 'chain-step'} key={`chain-${request.id}`}>
                        <span>Step {request.order}</span>
                        <strong>{request.pickup} {'->'} {request.destination}</strong>
                        <small>{request.rider} pays Rs {request.fare} . {request.legDistance.toFixed(1)} km . Rs {request.farePerKm.toFixed(1)}/km . Shared by {request.sharedRiderCount}/{request.vacantShareLimit} seats</small>
                      </div>
                    )) : (
                      <div className="chain-step">
                        <strong>No arranged rider chain for this Captain route.</strong>
                        <small>RideRelay needs riders whose hop pickup and hop destination move in the same route direction.</small>
                      </div>
                    )}
                  </div>
                  )}

                  <div className="route-alert-box session-status-box">
                    <span>Captain session status</span>
                    <strong>
                      {remainingTargetMoney === 0
                        ? `${captainSession.period} earning target reached. Captain can reset this progress.`
                        : `${captainSession.period} earnings continue through app payments. Need Rs ${remainingTargetMoney} more.`}
                    </strong>
                    <button className="mini-action" onClick={handleCloseCaptainSession} disabled={remainingTargetMoney > 0}>
                      Close Session
                    </button>
                  </div>

                  <div className="captain-route-preview rider-route-summary">
                    <div>
                      <span>Active route</span>
                      <strong>{captainRouteSource} {'->'} {captainRouteDestination}</strong>
                    </div>
                    <div>
                      <span>Current Captain pin</span>
                      <strong>{captainCurrentPin}</strong>
                    </div>
                    <div>
                      <span>Same destination riders</span>
                      <strong>{sameDestinationCount} rider{sameDestinationCount === 1 ? '' : 's'} to {captainRouteDestination}</strong>
                    </div>
                    <div>
                      <span>Vacant count</span>
                          <strong>{currentVacantSeats} of {captainRoute.vacantSeats} seat{Number(captainRoute.vacantSeats) === 1 ? '' : 's'} available</strong>
                    </div>
                    <div>
                      <span>Per rider estimate</span>
                      <strong>Rs {Math.ceil(captainRoutePricing.perRiderFare)} total</strong>
                    </div>
                  </div>

                  <div className="rider-request-bar">
                    <div>
                      <span>Multi-hop leg pins only</span>
                      <strong>{riderHopPins.length ? riderHopPins.join(' | ') : 'No route-matching rider hops'}</strong>
                      <small>Safety mode: Captain sees only assigned hop pickup and hop destination, not the rider's full journey.</small>
                      {allMatchingRidersAreDirect && <small>Direct rider route is available, so extra multi-hop chain is hidden.</small>}
                    </div>
                    <div>
                      <span>Captain message / alert</span>
                      <input
                        value={captainChatMessage}
                        onChange={(event) => setCaptainChatMessage(event.target.value)}
                        placeholder="Message to rider after request"
                      />
                    </div>
                  </div>

                  {stoppedPickupRequests.length > 0 && (
                    <div className="route-alert-box vehicle-full-alert">
                      <span>Vehicle full alert</span>
                      <strong>
                        Vehicle has been full. New rider alerts are stopped until one rider ends a hop.
                      </strong>
                      <small>
                        Hidden pending riders: {stoppedPickupRequests.map((request) => request.rider).join(', ')}.
                        They will reappear after a seat becomes free or the Captain completes a ride.
                      </small>
                    </div>
                  )}

                  <div className="captain-decision-grid">
                    <div className="captain-decision-box">
                      <h4>Details Of Riders</h4>
                      {arrangedRiderPlan.matchingRiders.length ? arrangedRiderPlan.matchingRiders.map((request, index) => (
                        <div className="decision-row" key={`decision-${request.id}`}>
                          <span>{index + 1}. {request.rider}</span>
                          <strong>Hop pickup: {request.pickup}</strong>
                          <strong>Hop destination: {request.destination}</strong>
                          <small>{request.status} . Matching rider {index + 1} of {arrangedRiderPlan.matchingRiders.length}. Full rider journey hidden for safety.</small>
                        </div>
                      )) : <p>No route-matching rider hops for this Captain route.</p>}
                    </div>
                    <div className="captain-decision-box">
                      <h4>Accepted Riders</h4>
                      {acceptedCaptainRequests.length ? acceptedCaptainRequests.map((request) => {
                        const displayFare = arrangedFareByRequestId.get(request.id) ?? request.fare;

                        return (
                          <div className="decision-row accepted" key={`accepted-${request.id}`}>
                            <span>{request.rider}</span>
                            <strong>Hop pickup: {request.pickup}</strong>
                            <strong>Hop destination: {request.destination} . Rs {displayFare}</strong>
                            <small>{request.status === 'ride-completed' ? 'Ride completed. This fair seat-share fare is counted as verified Captain earnings.' : 'Verified earnings update only after the ride is completed and paid in the app.'} Full rider journey hidden.</small>
                          </div>
                        );
                      }) : <p>No accepted riders yet.</p>}
                    </div>
                    <div className="captain-decision-box">
                      <h4>Declined Riders</h4>
                      {declinedCaptainRequests.length ? declinedCaptainRequests.map((request) => (
                        <div className="decision-row declined" key={`declined-${request.id}`}>
                          <span>{request.rider}</span>
                          <strong>Hop pickup: {request.pickup}</strong>
                          <strong>Hop destination: {request.destination}</strong>
                          <small>RideRelay can move this rider to another Captain.</small>
                        </div>
                      )) : <p>No declined riders yet.</p>}
                    </div>
                  </div>

                  <div className="route-alert-box">
                    <span>Route alert sent to rider dialogue boxes</span>
                    <strong>{captainRouteAlert}</strong>
                  </div>

                  <div className="captain-request-list">
                    {captainControlRequests.length ? captainControlRequests.map((request) => (
                      <div className="captain-request" key={request.id}>
                        <div className="match-header">
                          <div>
                            <span className="route-label">{request.leg} . Chain Step {request.order}</span>
                            <h5>{request.rider}</h5>
                            <p>Hop pickup: {request.pickup}. Hop destination: {request.destination}. Full rider journey hidden.</p>
                          </div>
                          <div className="fare-box">
                            <span>{request.status}</span>
                            <strong>Rs {request.fare}</strong>
                          </div>
                        </div>

                        <div className="ride-info compact-info">
                          <div>
                            <span>ETA</span>
                            <strong>{request.eta} min</strong>
                          </div>
                          <div>
                            <span>GPS</span>
                            <strong>{request.distanceMeters}m</strong>
                          </div>
                          <div>
                            <span>Presence</span>
                            <strong>{request.presence.replace('-', ' ')}</strong>
                          </div>
                        </div>

                        <div className="captain-message-bar">
                          <span>Rider alert bar</span>
                          <strong>{request.captainMessage ?? 'No Captain alert sent yet.'}</strong>
                          {request.alertSentAt && <small>Sent at {request.alertSentAt}</small>}
                        </div>

                        <div className="individual-chat-box">
                          <label htmlFor={`chat-${request.id}`}>Individual chat to {request.rider}</label>
                          <div>
                            <input
                              id={`chat-${request.id}`}
                              value={riderChatDrafts[request.id] ?? ''}
                              onChange={(event) => setRiderChatDrafts((current) => ({ ...current, [request.id]: event.target.value }))}
                              placeholder={`Message only to ${request.rider}`}
                            />
                            <button onClick={() => handleCaptainSendAlert(request.id)}>Submit Chat</button>
                          </div>
                        </div>

                        <div className="captain-actions">
                          <button
                            onClick={() => handleCaptainAccept(request.id)}
                            disabled={request.status !== 'pending' || fullPickupPins.some((pickupPin) => normalize(pickupPin) === normalize(request.pickup))}
                          >
                            {fullPickupPins.some((pickupPin) => normalize(pickupPin) === normalize(request.pickup)) ? 'Vehicle Full' : 'Accept Request'}
                          </button>
                          <button onClick={() => handleCaptainDecline(request.id)} disabled={request.status !== 'pending'}>Decline</button>
                          <button onClick={() => handleCaptainSendAlert(request.id)}>Send Alert</button>
                          <button onClick={() => handleCaptainPresence(request.id, true)} disabled={!['accepted', 'location-alert'].includes(request.status)}>Rider Confirms Present</button>
                          <button onClick={() => handleCaptainPresence(request.id, false)} disabled={!['accepted', 'present-at-pickup'].includes(request.status)}>Rider Says Not At Location</button>
                          <button
                            onClick={() => handleCaptainRideStatus(request.id, 'ride-started')}
                            disabled={
                              request.status !== 'present-at-pickup'
                              || captainVisibleRequests.filter((item) => (
                                item.status === 'ride-started'
                                && item.id !== request.id
                              )).length >= pickupSeatLimit
                              || captainVisibleRequests.filter((item) => (
                                item.status === 'ride-started'
                                && normalize(item.pickup) === normalize(request.pickup)
                                && item.id !== request.id
                              )).length >= pickupSeatLimit
                            }
                          >
                            {captainVisibleRequests.filter((item) => (
                              item.status === 'ride-started'
                              && item.id !== request.id
                            )).length >= pickupSeatLimit || captainVisibleRequests.filter((item) => (
                              item.status === 'ride-started'
                              && normalize(item.pickup) === normalize(request.pickup)
                              && item.id !== request.id
                            )).length >= pickupSeatLimit ? 'Seats Full' : 'Start Ride'}
                          </button>
                          <button onClick={() => handleCaptainRideStatus(request.id, 'ride-completed', request.fare)} disabled={request.status !== 'ride-started'}>End Ride</button>
                        </div>
                      </div>
                    )) : (
                      <div className="captain-request">
                        <h5>No rider control records yet</h5>
                        <p>Captain controls will stay visible here after accept, start, end ride, and completion.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel-card safety-list">
                  <h3>Captain Process</h3>
                  <p>This panel matches the real backend flow we discussed.</p>
                  <span>1. Rider sends request</span>
                  <span>2. Captain accepts or declines</span>
                  <span>3. Rider verifies Captain at pickup using GPS within 500m</span>
                  <span>4. Captain starts ride only after pickup</span>
                  <span>5. Captain ends ride, then rider pays and reviews</span>
                </div>
              </div>
            )}

            {activePanel === 'captain-bank' && (
              <div className="panel-grid bank-panel-grid">
                <form className="panel-card captain-payment-section" onSubmit={handleCaptainPaymentSubmit}>
                  <div className="route-card-heading">
                    <div>
                      <h3>Captain Payment Details</h3>
                      <p>Add bank account, UPI ID, or upload QR code. Riders will use this after ride completion.</p>
                    </div>
                    <button className="qr-preview-button" type="button" onClick={() => setIsQrPreviewOpen(true)}>
                      {renderCaptainQrPreview('large-qr')}
                      <small>View QR</small>
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="captain-account-holder">Account Holder Name</label>
                      <input
                        id="captain-account-holder"
                        value={captainProfile.accountHolder}
                        onChange={(event) => handleCaptainPaymentChange('accountHolder', event.target.value)}
                        placeholder="Name as per bank"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="captain-account-number">Account Number</label>
                      <input
                        id="captain-account-number"
                        value={captainProfile.accountNumber}
                        onChange={(event) => handleCaptainPaymentChange('accountNumber', event.target.value)}
                        placeholder="Enter account number"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="captain-ifsc">IFSC Code</label>
                      <input
                        id="captain-ifsc"
                        value={captainProfile.ifsc}
                        onChange={(event) => handleCaptainPaymentChange('ifsc', event.target.value.toUpperCase())}
                        placeholder="IFSC code"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="captain-upi">UPI ID</label>
                      <input
                        id="captain-upi"
                        value={captainProfile.upiId}
                        onChange={(event) => handleCaptainPaymentChange('upiId', event.target.value)}
                        placeholder="name@upi"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="captain-qr">Upload QR Code</label>
                    <input id="captain-qr" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg,.pdf" onChange={handleCaptainQrUpload} />
                    <small className="input-help">Selected file: {captainProfile.qrFileName}</small>
                  </div>

                  <div className="qr-upload-preview">
                    <span>QR preview record</span>
                    {hasCaptainQrRecord ? (
                      <button type="button" onClick={() => setIsQrPreviewOpen(true)}>
                        {renderCaptainQrPreview('')}
                      </button>
                    ) : (
                      <strong>No QR file saved yet.</strong>
                    )}
                    <small>QR image or PDF is stored in this Captain payment record for rider scanning/viewing after completion.</small>
                  </div>

                  <div className="captain-message-bar">
                    <span>Payment status</span>
                    <strong>{captainPaymentStatus}</strong>
                  </div>

                  <button className="panel-action" type="submit">Submit Payment Details</button>
                </form>

                <div className="panel-card bank-summary-card">
                  <h3>Saved Payment View</h3>
                  <div className="payment-summary-grid">
                    <div>
                      <span>UPI ID</span>
                      <strong>{captainProfile.upiId}</strong>
                    </div>
                    <div>
                      <span>Bank</span>
                      <strong>{captainProfile.bankName}</strong>
                    </div>
                    <div>
                      <span>Account</span>
                      <strong>Ending {captainProfile.accountLast4}</strong>
                    </div>
                    <div>
                      <span>QR file</span>
                      <strong>{captainProfile.qrFileName}</strong>
                    </div>
                    <div className="saved-qr-summary">
                      <span>Saved QR preview</span>
                      {hasCaptainQrRecord ? (
                        <button type="button" onClick={() => setIsQrPreviewOpen(true)}>
                          {renderCaptainQrPreview('')}
                        </button>
                      ) : (
                        <strong>No QR file saved</strong>
                      )}
                    </div>
                  </div>
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

      {appPage === 'rider' && (
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
      )}

      {isQrPreviewOpen && (
        <div className="qr-modal-backdrop" role="presentation" onClick={() => setIsQrPreviewOpen(false)}>
          <div className="qr-modal" role="dialog" aria-modal="true" aria-label="Captain QR preview" onClick={(event) => event.stopPropagation()}>
            <button className="qr-modal-close" type="button" onClick={() => setIsQrPreviewOpen(false)}>Close</button>
            {hasCaptainQrRecord && isCaptainQrPdf ? (
              <object className="qr-pdf-viewer" data={captainProfile.qrPreviewUrl} type="application/pdf">
                <a href={captainProfile.qrPreviewUrl} download={captainProfile.qrFileName}>Open uploaded QR PDF</a>
              </object>
            ) : hasCaptainQrRecord ? (
              <img className="qr-scan-image" src={captainProfile.qrPreviewUrl} alt="Captain QR code for rider payment" />
            ) : (
              <div className="qr-box qr-scan-box">QR</div>
            )}
            <h3>{captainProfile.upiId}</h3>
            <p>{captainProfile.accountHolder} . {captainProfile.bankName}</p>
            <small>{hasCaptainQrRecord ? `Saved QR file: ${captainProfile.qrFileName}` : 'Upload PNG, JPG, JPEG, or PDF QR to display it here.'}</small>
          </div>
        </div>
      )}

      <footer className="footer">
        <img className="footer-logo" src={assetPath('riderelay-logo.png')} alt="RideRelay logo mark" />
        <img className="footer-title-image" src={assetPath('riderelay-name.png')} alt="RideRelay - Travel Smart and Together" />
        <p>Affordable eco-friendly ride sharing platform</p>
        <small>2026 RideRelay. Built with React and CSS.</small>
      </footer>
    </div>
  );
}
