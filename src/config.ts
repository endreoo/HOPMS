export const API_CONFIG = {
  BASE_URL: '',  // Empty base URL to use proxy
  API_KEY: 'c6c17b4a2d7b409f9a3e3ea830a48c28',
  HOTEL_ID: '40642'
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  BOOKINGS: '/api/bookings',
  ROOMS: '/api/rooms',
  ROOM_TYPES: '/api/hotel-room-types',
  ROOM_CATEGORIES: '/api/room-categories',
  ASSIGNED_BOOKINGS: '/api/bookings?assigned=true',
  UNASSIGNED_BOOKINGS: '/api/bookings?assigned=false'
}; 