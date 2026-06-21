/**
 * City and State Level Departments for Smart City Complaint Routing
 */

export const CITY_DEPARTMENTS = [
  { 
    id: 'pwd', 
    name: 'Public Works Department', 
    head: 'Chief Engineer, PWD', 
    contact: 'pwd@delhi.gov.in',
    jurisdiction: 'Roads, Bridges, Flyovers, and Public Infrastructure', 
    phone: '011-23381530' 
  },
  { 
    id: 'jal_board', 
    name: 'Jal Board', 
    head: 'Chief Executive Officer, Jal Board', 
    contact: 'jalboard@delhi.gov.in',
    jurisdiction: 'Water pipelines, Drinking water supply, Water quality, and Tankers', 
    phone: '011-23890100' 
  },
  { 
    id: 'mcd', 
    name: 'Municipal Corporation', 
    head: 'MCD Commissioner', 
    contact: 'mcd@delhi.gov.in',
    jurisdiction: 'Street lighting, Public parks, Local sanitation, and Civic amenities', 
    phone: '011-23225487' 
  },
  { 
    id: 'san', 
    name: 'Sanitation Department', 
    head: 'Chief Sanitation Officer', 
    contact: 'sanitation@delhi.gov.in',
    jurisdiction: 'Garbage collection, Dumpster management, and Street sweeping', 
    phone: '011-23227600' 
  },
  { 
    id: 'dsb', 
    name: 'Drainage & Sewerage Board', 
    head: 'Chief Engineer (Drainage)', 
    contact: 'drainage@delhi.gov.in',
    jurisdiction: 'Sewage lines, Stormwater drains, Waterlogging, and Manhole repairs', 
    phone: '011-23381800' 
  },
  {
    id: 'fire_dept',
    name: 'Fire Department',
    head: 'Chief Fire Officer',
    contact: 'fire.control@state.gov.in',
    jurisdiction: 'Fire safety audits, Fire fighting operations, Emergency rescue, and Fire hazards',
    phone: '101'
  }
];

export const STATE_DEPARTMENTS = [
  { 
    id: 'electricity_board', 
    name: 'Electricity Board', 
    head: 'MD, Electricity Board', 
    contact: 'power@state.gov.in',
    jurisdiction: 'High voltage lines, Power substations, Transformers, and Outages', 
    phone: '1912' 
  },
  { 
    id: 'dma', 
    name: 'Disaster Management Authority', 
    head: 'DMA Commissioner', 
    contact: 'disaster@state.gov.in',
    jurisdiction: 'Floods, Earthquakes, Severe Weather Alerts, and Emergency response', 
    phone: '112' 
  },
  { 
    id: 'pcb', 
    name: 'Pollution Control Board', 
    head: 'Chairman, PCB', 
    contact: 'pollution@state.gov.in',
    jurisdiction: 'Industrial pollution, Noise control, Air quality index monitoring, and Waste compliance', 
    phone: '011-22307233' 
  }
];

export const ALL_DEPARTMENTS = [...CITY_DEPARTMENTS, ...STATE_DEPARTMENTS];
