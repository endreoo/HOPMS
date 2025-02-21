import axios from 'axios';
import { APIBooking, APIResponse, RoomCategory, APIRoom } from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  params: {
    auth_key: API_CONFIG.API_KEY
  },
  timeout: 30000,
  withCredentials: true  // Enable credentials
});

// Add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize auth token with retry
const initAuth = async (retryCount = 0) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // Add delay before request
      await delay(1000 * (retryCount + 1));
      
      const response = await axios.post('/auth/login', 
        { 
          email: 'endre@hotelonline.co', 
          password: 'S@ccess900', 
          auth_key: API_CONFIG.API_KEY 
        },
        {
          headers: { 
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      const { token: newToken } = response.data;
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } catch (error: any) {
    console.error('Auth initialization failed:', error);
    
    // Handle rate limiting
    if (error.response?.status === 429 && retryCount < 3) {
      console.log(`Rate limited, retrying in ${(retryCount + 1)} seconds...`);
      await delay(1000 * (retryCount + 1));
      return initAuth(retryCount + 1);
    }
    
    localStorage.removeItem('token');
    throw error;
  }
};

// Call initAuth immediately
initAuth();

// Log the base URL on initialization
console.log('[API] Using base URL:', API_CONFIG.BASE_URL);

// Add request interceptor to handle auth
api.interceptors.request.use(
  async (config) => {
    try {
      // Ensure we have a token before making requests
      if (!api.defaults.headers.common['Authorization']) {
        await initAuth();
      }
      
      // Add required params
      config.params = {
        ...config.params,
        auth_key: API_CONFIG.API_KEY,
        hotel_id: API_CONFIG.HOTEL_ID
      };
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response Details:', { 
      url: `${response.config.baseURL}${response.config.url}`,
      status: response.status,
      headers: response.headers,
      data: response.data 
    });
    return response;
  },
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 1;
      console.log(`Rate limited, retrying after ${retryAfter} seconds...`);
      await delay(retryAfter * 1000);
      return axios(error.config);
    }

    if (error.response?.status === 401) {
      console.log('Unauthorized, attempting login...');
      try {
        await initAuth();
        const config = error.config;
        config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
        return axios(config);
      } catch (e) {
        console.error('Login retry failed:', e);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  try {
    console.log('Attempting login...');
    const response = await axios.post('http://37.27.142.148:3000/auth/login', 
      { email, password, auth_key: API_CONFIG.API_KEY },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true
      }
    );
    console.log('Login successful:', response.data);
    const { token } = response.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getAllBookings = async (params: {
  hotel_id?: string;
  status?: string;
  check_in_from?: string;
  check_in_to?: string;
  include?: string;
  assigned?: boolean;
} = {}) => {
  try {
    console.log('Fetching all bookings with params:', params);
    const response = await api.get<APIResponse<APIBooking>>('/api/bookings', {
      params: {
        ...params,
        hotel_id: API_CONFIG.HOTEL_ID,
        auth_key: API_CONFIG.API_KEY,
        include: 'room,guest',
        limit: 500
      }
    });

    console.log('Bookings response:', {
      status: response.status,
      data: response.data,
      bookings: response.data.data?.length || 0
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    throw error;
  }
};

export const getAssignedBookings = async (params: {
  check_in_from?: string;
  check_in_to?: string;
}) => {
  try {
    console.log('Fetching assigned bookings with params:', params);
    const response = await api.get<APIResponse<APIBooking>>(API_ENDPOINTS.ASSIGNED_BOOKINGS, {
      params: {
        ...params,
        hotel_id: API_CONFIG.HOTEL_ID,
        auth_key: API_CONFIG.API_KEY,
        include: 'room,guest'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching assigned bookings:', error);
    throw error;
  }
};

export const getUnassignedBookings = async (params: {
  check_in_from?: string;
  check_in_to?: string;
}) => {
  try {
    console.log('Fetching unassigned bookings with params:', params);
    const response = await api.get<APIResponse<APIBooking>>(API_ENDPOINTS.UNASSIGNED_BOOKINGS, {
      params: {
        ...params,
        hotel_id: API_CONFIG.HOTEL_ID,
        auth_key: API_CONFIG.API_KEY,
        include: 'room,guest'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching unassigned bookings:', error);
    throw error;
  }
};

export const getBookings = async (params: {
  page?: number;
  limit?: number;
  hotel_id?: string;
  status?: string;
  check_in_from?: string;
  check_in_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  assigned?: boolean;
  include?: string;
}) => {
  const requestParams = {
    ...params,
    hotel_id: API_CONFIG.HOTEL_ID,
    auth_key: API_CONFIG.API_KEY
  };
  
  console.log('API Request Params:', requestParams);
  
  const response = await api.get('/api/bookings', { params: requestParams });
  console.log('API Response:', response.data);
  return response.data;
};

export const getRoomCategories = async (hotel_id: string) => {
  try {
    const response = await api.get<RoomCategory[]>(API_ENDPOINTS.ROOM_CATEGORIES, {
      params: { 
        hotel_id,
        auth_key: API_CONFIG.API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error loading room categories:', error);
    throw error;
  }
};

export const getRooms = async (params: {
  hotel_id: string;
  room_category_id?: number;
}) => {
  try {
    console.log('Fetching rooms with params:', params);
    const response = await api.get<APIRoom[]>(API_ENDPOINTS.ROOMS, {
      params: {
        ...params,
        auth_key: API_CONFIG.API_KEY,
        include: 'room_type'
      }
    });
    console.log('Rooms response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

export const getRoom = async (id: number) => {
  try {
    console.log('=== GET ROOM API CALL ===');
    console.log('Fetching room details for id:', id);
    const response = await api.get<APIRoom>(`/rooms/${id}`, {
      params: {
        hotel_id: '40642',
        auth_key: 'c6c17b4a2d7b409f9a3e3ea830a48c28'
      }
    });
    console.log('Room API Response:', {
      status: response.status,
      data: response.data,
      url: response.config.url,
      params: response.config.params
    });
    return response.data;
  } catch (error) {
    console.error('=== ROOM API ERROR ===');
    if (axios.isAxiosError(error)) {
      console.error('Room API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        params: error.config?.params
      });
    } else {
      console.error('Non-Axios error:', error);
    }
    throw error;
  }
};

export const createRoomCategory = async (data: {
  hotel_id: string;
  name: string;
  description: string;
  base_price: number;
}) => {
  const response = await api.post<APIResponse<RoomCategory>>('/room-type', data);
  return response.data.data[0];
};

export async function createRoomCategories({ hotel_id, categories }: { 
  hotel_id: string; 
  categories: Array<{
    name: string;
    description: string;
    base_price: number;
  }>;
}) {
  try {
    console.log('Creating room categories with data:', { hotel_id, categories });
    const response = await api.post('/rooms/categories/bulk', {
      hotel_id,
      categories
    });
    return response.data;
  } catch (error) {
    console.error('Error in createRoomCategories:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
}

export const updateRoomCategory = async (id: number, data: {
  name?: string;
  description?: string;
  base_price?: number;
}) => {
  const response = await api.put<APIResponse<RoomCategory>>(`/room-type/${id}`, data);
  return response.data.data[0];
};

export const createRoom = async (data: {
  hotel_id: number;
  hotel_room_type_id: number;
  room_number: string;
  floor: string;
  status: 'available' | 'occupied' | 'maintenance';
}) => {
  const response = await api.post<APIRoom>('/rooms', data);
  return response.data;
};

export const createRooms = async (data: {
  hotel_id: string;
  rooms: Array<{
    room_category_id: number;
    room_number: string;
    floor?: string;
    status?: 'available' | 'occupied' | 'maintenance';
    notes?: string;
  }>;
}) => {
  const response = await api.post<APIResponse<APIRoom>>('/room/bulk', data);
  return response.data.data;
};

export const updateRoom = async (id: number, data: Partial<{
  room_category_id: number;
  room_number: string;
  floor: string;
  status: 'available' | 'occupied' | 'maintenance';
  notes: string;
}>) => {
  const response = await api.put<APIRoom>(`/rooms/${id}`, data);
  return response.data;
};

export const updateRoomStatus = async (id: number, status: 'available' | 'occupied' | 'maintenance') => {
  const response = await api.patch<APIResponse<APIRoom>>(`/room/${id}/status`, { status });
  return response.data.data[0];
};

export const assignRoom = async (bookingId: number, roomNumber: string) => {
  try {
    console.log('=== ASSIGN ROOM API CALL ===');
    
    // Direct PATCH request with minimal data
    const response = await api.patch(
      `/bookings/${bookingId}/assign-room`,
      { room_number: roomNumber },
      {
        params: { hotel_id: '40642' }
      }
    );

    console.log('Room assigned successfully:', {
      bookingId,
      roomNumber,
      status: response.status
    });

    return response.data;
  } catch (error) {
    console.error('Error assigning room:', error);
    throw error;
  }
};

export const unassignRoomFromBooking = async (bookingId: number) => {
  const response = await api.patch<APIResponse<APIBooking>>(`/bookings/${bookingId}/unassign-room`);
  return response.data.data[0];
};

export const autoAssignRoom = async (bookingId: number, params: {
  hotel_id: string;
  category_id?: number;
  check_in_date: string;
  check_out_date: string;
}) => {
  const response = await api.post<APIResponse<APIBooking>>(`/bookings/${bookingId}/auto-assign`, params);
  return response.data.data[0];
};

export interface RoomTypeFromBookings {
  id: number;
  name: string;
  booking_count: number;
  base_price: number;
}

export const getRoomTypesFromBookings = async (hotel_id: string) => {
  const response = await api.get<APIResponse<RoomTypeFromBookings>>('/rooms/types/bookings', {
    params: { hotel_id }
  });
  return response.data.data;
};

export interface HotelRoomType {
  id: number;
  hotel_id: number;
  name: string;
  description: string;
  base_price: number;
  max_occupancy: number;
  max_adults: number;
  max_children: number;
  amenities: string[];
}

export const getHotelRoomTypes = async (hotel_id: string) => {
  try {
    const response = await api.get<HotelRoomType[]>(API_ENDPOINTS.ROOM_TYPES, {
      params: {
        hotel_id,
        auth_key: API_CONFIG.API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error loading room types:', error);
    throw error;
  }
};

export const createHotelRoomType = async (data: {
  hotel_id: number;
  name: string;
  description: string;
  base_price: number;
  max_occupancy: number;
  max_adults: number;
  max_children: number;
  amenities: string[];
}) => {
  const response = await api.post<HotelRoomType>('/hotel-room-types', data);
  return response.data;
};

export const updateHotelRoomType = async (id: number, data: Partial<{
  name: string;
  description: string;
  base_price: number;
  max_occupancy: number;
  max_adults: number;
  max_children: number;
  amenities: string[];
}>) => {
  const response = await api.put<HotelRoomType>(`/hotel-room-types/${id}`, data);
  return response.data;
};

export const deleteHotelRoomType = async (id: number) => {
  await api.delete(`/hotel-room-types/${id}`);
};

export interface RoomTypeMapping {
  id: number;
  hotel_room_type_id: number;
  room_type_id: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export const getHotelRoomTypeMappings = async (hotelRoomTypeId: number) => {
  const response = await api.get<RoomTypeMapping[]>(`/hotel-room-types/${hotelRoomTypeId}/mappings`);
  return response.data;
};

export const createHotelRoomTypeMapping = async (hotelRoomTypeId: number, data: {
  room_type_id: number;
  is_primary: boolean;
}) => {
  const response = await api.post<RoomTypeMapping>(`/hotel-room-types/${hotelRoomTypeId}/mappings`, data);
  return response.data;
};

export const deleteHotelRoomTypeMapping = async (hotelRoomTypeId: number, mappingId: number) => {
  await api.delete(`/hotel-room-types/${hotelRoomTypeId}/mappings/${mappingId}`);
};

export const deleteRoom = async (id: number) => {
  await api.delete(`/rooms/${id}`);
};

export const updateBooking = async (id: number, data: Partial<APIBooking>) => {
  const response = await api.put<APIBooking>(`/bookings/${id}`, data);
  return response.data;
};

export default api; 