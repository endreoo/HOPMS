export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: 'booking_created' | 'booking_modified' | 'booking_cancelled' | 'guest_created' | 'payment_received';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata: {
    bookingId?: string;
    guestId?: string;
    amount?: number;
  };
}

export interface APIBooking {
  id: number;
  hotel_id: number;
  guest_id: number;
  room_type_id: number;
  room_id?: number;
  room?: APIRoom;
  room_details?: {
    id: number;
    room_number: string;
    floor: string;
    status: string;
  };
  room_number: string;
  rate_plan_id: string;
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  status: string;
  payment_status: string;
  total_amount: string;
  paid_amount: string;
  source: string;
  source_booking_id: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  nationality?: string;
  phone?: string;
  room_type_name?: string;
  rate_plan_name?: string;
  guest_name?: string;
  assignment_error?: string;
  assigned?: boolean;
  raw_data?: {
    booking?: {
      BookingTran?: {
        RoomName?: string;
      };
    };
    bookingDetail?: {
      BookingTran?: Array<{
        RoomName?: string;
      }>;
    };
  };
}

export interface APIResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface Room {
  id: string;
  number: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  status: 'available' | 'occupied' | 'maintenance';
  amenities: string[];
}

export interface DailyStats {
  date: string;
  occupancyRate: number;
  revenue: number;
  newBookings: number;
  checkIns: number;
  checkOuts: number;
}

export interface RoomCategory {
  id: number;
  hotel_id: number;
  name: string;
  description: string;
  base_price: number;
  created_at: string;
  updated_at: string;
  source_room_type_id: string;
  booking_count: number;
}

export interface CreateRoomInput {
  hotel_id: number;
  room_category_id: number;
  room_number: string;
  floor: string;
  status: 'available' | 'occupied' | 'maintenance';
  notes?: string;
}

export interface APIRoom {
  id: number;
  hotel_id: number;
  hotel_room_type_id?: number;
  room_type_id: number;
  room_category_id: number;
  room_number: string;
  floor: string;
  status: 'available' | 'occupied' | 'maintenance';
  category_name?: string;
  base_price?: number;
  room_type_name: string;
}

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

export interface BookingsResponse {
  bookings: APIBooking[];
  total: number;
}

export interface CalendarProps {
  rooms: APIRoom[];
  roomTypes: HotelRoomType[];
  startDate: Date;
  numDays: 7 | 14 | 30;
  onDateSelect: (date: Date) => void;
  onBookingUpdate: (booking: APIBooking) => void;
  bookings: APIBooking[] | { bookings: APIBooking[]; total: number } | { data: APIBooking[]; pagination?: { total: number } } | null;
}