// Autocomplete suggestions for various form fields

export const INDIAN_CITIES = [
  'New Delhi',
  'Mumbai',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Indore',
  'Surat',
  'Kochi',
  'Visakhapatnam',
  'Bhopal',
  'Nagpur',
  'Gurgaon',
  'Noida',
  'Faridabad',
];

export const COMPLAINT_CATEGORIES = [
  'Road Damage',
  'Water Supply',
  'Electricity',
  'Garbage',
  'Noise Pollution',
  'Flooding',
  'Street Light',
  'Sewage',
  'Other',
];

export const COMPLAINT_TITLE_SUGGESTIONS = [
  'Pothole in street',
  'Water pipe burst',
  'Street light not working',
  'Garbage overflow',
  'Sewage backup',
  'Electricity cut',
  'Traffic signal broken',
  'Road blockage',
  'Stagnant water',
  'Illegal dumping',
];

export const AREA_NAMES = [
  'North Delhi',
  'South Delhi',
  'East Delhi',
  'West Delhi',
  'Central Delhi',
  'New Delhi',
  'Downtown',
  'Uptown',
  'Suburban Area',
  'Commercial Zone',
  'Residential Area',
  'Industrial Area',
];

export const getSuggestions = (type, input = '') => {
  const suggestionMap = {
    city: INDIAN_CITIES,
    category: COMPLAINT_CATEGORIES,
    title: COMPLAINT_TITLE_SUGGESTIONS,
    area: AREA_NAMES,
  };

  const suggestions = suggestionMap[type] || [];
  
  if (input.trim() === '') {
    return suggestions.slice(0, 5);
  }

  return suggestions.filter(s =>
    s.toLowerCase().includes(input.toLowerCase())
  );
};
