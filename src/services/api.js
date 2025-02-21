import axios from 'axios';
import { API_CONFIG } from '../config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Authorization': `Bearer ${API_CONFIG.API_KEY}`
  },
  withCredentials: false
});

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

const waitForInterval = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

const login = async () => {
  try {
    console.log('Attempting login...');
    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/login`, 
      { 
        email: 'endre@hotelonline.co', 
        password: 'S@ccess900', 
        auth_key: API_CONFIG.API_KEY 
      }
    );
    
    if (!response.data || !response.data.token) {
      throw new Error('Invalid login response');
    }
    
    const { token } = response.data;
    console.log('Login successful, setting token');
    
    // Set token in localStorage and axios defaults
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return token;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    localStorage.removeItem('token');
    throw error;
  }
};

// Initialize auth on module load
(async () => {
  try {
    await login();
  } catch (error) {
    console.error('Initial auth failed:', error.message);
  }
})();

// Update request interceptor
api.interceptors.request.use(
  async (config) => {
    await waitForInterval();
    
    try {
      // Get token from localStorage
      let token = localStorage.getItem('token');
      
      // If no token, try to login
      if (!token) {
        token = await login();
      }
      
      // Add required params and headers
      config.params = {
        ...config.params,
        auth_key: API_CONFIG.API_KEY,
        hotel_id: API_CONFIG.HOTEL_ID
      };

      // Set Authorization header
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('Token expired, attempting login...');
      try {
        const token = await login();
        error.config.headers['Authorization'] = `Bearer ${token}`;
        return axios(error.config);
      } catch (loginError) {
        console.error('Login retry failed:', loginError);
        return Promise.reject(loginError);
      }
    }
    return Promise.reject(error);
  }
);

const getUnassignedBookings = async (params = {}) => {
  try {
    const response = await api.get('/api/bookings', {
      params: {
        ...params,
        assigned: false,
        hotel_id: API_CONFIG.HOTEL_ID,
        auth_key: API_CONFIG.API_KEY,
        include: 'room,guest',
        limit: 3500 // Increased limit to get all bookings
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching unassigned bookings:', error);
    throw error;
  }
};

const getRooms = async (params = {}) => {
  try {
    const response = await api.get('/api/rooms', {
      params: {
        ...params,
        hotel_id: API_CONFIG.HOTEL_ID,
        auth_key: API_CONFIG.API_KEY,
        include: 'room_type'
      }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

const assignRoom = async (bookingId, roomNumber) => {
  try {
    const response = await api.patch(
      `/api/bookings/${bookingId}/assign-room`,
      { 
        hotel_id: API_CONFIG.HOTEL_ID,
        room_number: roomNumber,
        force: true
      },
      {
        params: {
          auth_key: API_CONFIG.API_KEY
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error assigning room ${roomNumber} to booking ${bookingId}:`, error);
    throw error;
  }
};

const isRoomAvailableForDates = (room, checkIn, checkOut, existingAssignments) => {
  // Check if room is available
  if (room.status !== 'available') {
    return false;
  }

  // Convert dates to timestamps for comparison
  const bookingStart = new Date(checkIn).getTime();
  const bookingEnd = new Date(checkOut).getTime();

  // Check if room is already assigned for any overlapping dates
  return !existingAssignments.some(assignment => {
    const assignmentStart = new Date(assignment.check_in_date).getTime();
    const assignmentEnd = new Date(assignment.check_out_date).getTime();
    
    // Check for date overlap
    return (bookingStart < assignmentEnd && bookingEnd > assignmentStart);
  });
};

const bulkAssignRooms = async () => {
  try {
    await login();
    
    const [unassignedBookings, rooms] = await Promise.all([
      getUnassignedBookings(),
      getRooms()
    ]);

    const roomAssignments = new Map();
    const results = [];
    let assignedCount = 0;
    let errorCount = 0;

    // Group rooms by type for faster lookup
    const roomsByType = rooms.reduce((acc, room) => {
      const type = room.room_type_name?.replace(/^(Two|2|Three|3)\s+Bedroom/i, match => 
        match.includes('2') ? 'Two Bedroom' : 'Three Bedroom');
      if (!acc[type]) acc[type] = [];
      acc[type].push(room);
      return acc;
    }, {});

    // Sort by check-in date
    const sortedBookings = unassignedBookings
      .filter(b => b.status !== 'cancelled')
      .sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date));

    for (const booking of sortedBookings) {
      try {
        const normalizedType = booking.room_type_name?.replace(/^(Two|2|Three|3)\s+Bedroom/i, match => 
          match.includes('2') ? 'Two Bedroom' : 'Three Bedroom');
        
        const matchingRooms = roomsByType[normalizedType] || [];
        
        // Find available room
        const availableRoom = matchingRooms.find(room => {
          const assignments = roomAssignments.get(room.room_number) || [];
          return !assignments.some(a => 
            new Date(booking.check_in_date) < new Date(a.check_out_date) && 
            new Date(booking.check_out_date) > new Date(a.check_in_date)
          );
        });

        if (availableRoom) {
          await assignRoom(booking.id, availableRoom.room_number);
          
          if (!roomAssignments.has(availableRoom.room_number)) {
            roomAssignments.set(availableRoom.room_number, []);
          }
          roomAssignments.get(availableRoom.room_number).push({
            id: booking.id,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date
          });
          
          assignedCount++;
          results.push({
            booking_id: booking.id,
            room_number: availableRoom.room_number,
            success: true
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errorCount++;
        results.push({
          booking_id: booking.id,
          error: error?.message || 'Unknown error',
          success: false
        });
      }
    }

    return {
      total: sortedBookings.length,
      assigned: assignedCount,
      errors: errorCount,
      results,
      assignments: Object.fromEntries(roomAssignments)
    };

  } catch (error) {
    console.error('Error in bulk room assignment:', error);
    throw error;
  }
};

const getAssignedBookings = async (params = {}) => {
  try {
    console.log('Fetching assigned bookings with params:', params);
    const response = await api.get('/api/bookings', {
      params: {
        ...params,
        assigned: true,
        hotel_id: API_CONFIG.HOTEL_ID,
        auth_key: API_CONFIG.API_KEY,
        include: 'room,guest',
        limit: 3500
      }
    });

    const bookings = response.data.data || [];
    console.log('Found assigned bookings:', {
      total: bookings.length,
      bookings: bookings.map(b => ({
        id: b.id,
        room: b.room_number,
        checkIn: b.check_in_date,
        checkOut: b.check_out_date,
        status: b.status
      }))
    });

    return bookings;
  } catch (error) {
    console.error('Error fetching assigned bookings:', error);
    throw error;
  }
};

const unassignRoomFromBooking = async (bookingId, roomNumber) => {
  try {
    const response = await api.patch(
      `/api/bookings/${bookingId}/unassign-room`,
      { 
        hotel_id: API_CONFIG.HOTEL_ID,
        room_number: roomNumber,
        force: true
      },
      {
        params: {
          auth_key: API_CONFIG.API_KEY
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error unassigning room ${roomNumber} from booking ${bookingId}:`, error);
    throw error;
  }
};

const autoAssignRoom = async (bookingId, roomNumber) => {
  try {
    const response = await api.patch(
      `/api/bookings/${bookingId}/auto-assign-room`,
      { 
        hotel_id: API_CONFIG.HOTEL_ID,
        room_number: roomNumber,
        force: true
      },
      {
        params: {
          auth_key: API_CONFIG.API_KEY
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error auto-assigning room ${roomNumber} to booking ${bookingId}:`, error);
    throw error;
  }
};

const getHotelRoomTypes = async () => {
  try {
    const response = await api.get('/api/hotel-room-types', {
      params: {
        hotel_id: API_CONFIG.HOTEL_ID,
        auth_key: API_CONFIG.API_KEY
      }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching hotel room types:', error);
    throw error;
  }
};

const createHotelRoomType = async (data) => {
  try {
    const response = await api.post('/api/rooms/types', {
      ...data,
      hotel_id: API_CONFIG.HOTEL_ID
    });
    return response.data;
  } catch (error) {
    console.error('Error creating hotel room type:', error);
    throw error;
  }
};

const updateHotelRoomType = async (id, data) => {
  try {
    const response = await api.put(`/api/rooms/types/${id}`, {
      ...data,
      hotel_id: API_CONFIG.HOTEL_ID
    });
    return response.data;
  } catch (error) {
    console.error('Error updating hotel room type:', error);
    throw error;
  }
};

const deleteHotelRoomType = async (id) => {
  try {
    const response = await api.delete(`/api/rooms/types/${id}`, {
      params: {
        hotel_id: API_CONFIG.HOTEL_ID
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting hotel room type:', error);
    throw error;
  }
};

const createRoom = async (data) => {
  try {
    const response = await api.post('/api/rooms', {
      ...data,
      hotel_id: API_CONFIG.HOTEL_ID
    });
    return response.data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

const deleteRoom = async (roomNumber) => {
  try {
    const response = await api.delete(`/api/rooms/${roomNumber}`, {
      params: {
        hotel_id: API_CONFIG.HOTEL_ID
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};

export const getBookings = async (params = {}) => {
  try {
    console.log('API Request Params:', {
      ...params,
      hotel_id: API_CONFIG.HOTEL_ID,
      auth_key: API_CONFIG.API_KEY
    });
    
    const response = await api.get('/api/bookings', {
      params: {
        ...params,
        hotel_id: API_CONFIG.HOTEL_ID,
        auth_key: API_CONFIG.API_KEY,
        include: 'room,guest'
      }
    });

    console.log('API Response:', {
      status: response.status,
      total: response.data.pagination?.total,
      current_page: response.data.pagination?.page,
      total_pages: response.data.pagination?.total_pages,
      bookings: response.data.data?.length
    });

    return {
      data: response.data.data || [],
      pagination: {
        total: response.data.pagination?.total || 0,
        page: response.data.pagination?.page || 1,
        total_pages: response.data.pagination?.total_pages || 1,
        limit: response.data.pagination?.limit || 50
      }
    };
  } catch (error) {
    console.error('Error in getBookings:', error.response?.data || error.message);
    throw error;
  }
};

const updateBooking = async (bookingId, data) => {
  try {
    const response = await api.put(`/api/bookings/${bookingId}`, {
      ...data,
      hotel_id: API_CONFIG.HOTEL_ID
    });
    return response.data;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

const getRoomCategories = async () => {
  try {
    const response = await api.get('/api/rooms/categories', {
      params: {
        hotel_id: API_CONFIG.HOTEL_ID
      }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching room categories:', error);
    throw error;
  }
};

export {
  login,
  getUnassignedBookings,
  getRooms,
  assignRoom,
  bulkAssignRooms,
  getAssignedBookings,
  unassignRoomFromBooking,
  autoAssignRoom,
  getHotelRoomTypes,
  createHotelRoomType,
  updateHotelRoomType,
  deleteHotelRoomType,
  createRoom,
  deleteRoom,
  updateBooking,
  getRoomCategories
};

export default api; 