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

export interface Booking {
  id: string;
  guestId: string;
  roomType: string;
  roomNumber: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  invoiceNumber?: string;
  extras?: {
    id: string;
    description: string;
    amount: number;
    quantity: number;
  }[];
  invoiceSentAt?: Date;
  invoiceSentVia?: 'email' | 'whatsapp';
  source: 'direct' | 'booking.com' | 'expedia' | 'airbnb';
  notes?: string;
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