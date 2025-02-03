import { Booking, Room, DailyStats, Guest, Notification } from '../types';

export const guests: Guest[] = [
  {
    id: 'g1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1 234-567-8901',
    address: '123 Main St',
    city: 'New York',
    country: 'USA',
    notes: 'VIP guest, prefers high floor',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'g2',
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma.w@example.com',
    phone: '+1 234-567-8902',
    address: '456 Park Ave',
    city: 'Los Angeles',
    country: 'USA',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  // Generate more random guests
  ...Array.from({ length: 48 }, (_, i) => {
    const firstNames = ['Michael', 'Sarah', 'David', 'Lisa', 'James', 'Jennifer', 'Robert', 'Maria', 'William', 'Linda'];
    const lastNames = ['Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White'];
    const cities = ['Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    return {
      id: `g${i + 3}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+1 ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      address: `${Math.floor(Math.random() * 999 + 1)} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine'][Math.floor(Math.random() * 5)]} St`,
      city,
      country: 'USA',
      createdAt: new Date(2024, Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1),
      updatedAt: new Date(2024, Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1),
    };
  }),
];

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'booking_created',
    title: 'New Booking',
    message: 'John Smith has booked Room 001 for March 15-18',
    read: false,
    createdAt: new Date('2024-03-10T10:30:00'),
    metadata: {
      bookingId: 'b1',
      guestId: 'g1',
    },
  },
  {
    id: 'n2',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Payment of $600 received from John Smith',
    read: true,
    createdAt: new Date('2024-03-10T10:35:00'),
    metadata: {
      bookingId: 'b1',
      guestId: 'g1',
      amount: 600,
    },
  },
  // Generate more random notifications
  ...Array.from({ length: 8 }, (_, i) => {
    const types: Notification['type'][] = ['booking_created', 'booking_modified', 'booking_cancelled', 'guest_created', 'payment_received'];
    const type = types[Math.floor(Math.random() * types.length)];
    const guest = guests[Math.floor(Math.random() * guests.length)];
    const amount = Math.floor(Math.random() * 1000) + 200;
    
    let title = '';
    let message = '';
    
    switch (type) {
      case 'booking_created':
        title = 'New Booking';
        message = `${guest.firstName} ${guest.lastName} has made a new booking`;
        break;
      case 'booking_modified':
        title = 'Booking Modified';
        message = `Booking for ${guest.firstName} ${guest.lastName} has been updated`;
        break;
      case 'booking_cancelled':
        title = 'Booking Cancelled';
        message = `${guest.firstName} ${guest.lastName} has cancelled their booking`;
        break;
      case 'guest_created':
        title = 'New Guest';
        message = `${guest.firstName} ${guest.lastName} has registered as a new guest`;
        break;
      case 'payment_received':
        title = 'Payment Received';
        message = `Payment of $${amount} received from ${guest.firstName} ${guest.lastName}`;
        break;
    }

    return {
      id: `n${i + 3}`,
      type,
      title,
      message,
      read: Math.random() > 0.5,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)), // Random time in last 3 days
      metadata: {
        bookingId: `b${Math.floor(Math.random() * 50) + 1}`,
        guestId: guest.id,
        amount: type === 'payment_received' ? amount : undefined,
      },
    };
  }),
];


export const rooms: Room[] = [
  {
    id: '1',
    number: '001',
    type: 'Deluxe',
    capacity: 2,
    pricePerNight: 200,
    status: 'available',
    amenities: ['Ocean View', 'King Bed', 'Mini Bar'],
  },
  {
    id: '2',
    number: '002',
    type: 'Suite',
    capacity: 4,
    pricePerNight: 350,
    status: 'occupied',
    amenities: ['Balcony', '2 Queen Beds', 'Kitchenette'],
  },
  {
    id: '3',
    number: '003',
    type: 'Standard',
    capacity: 2,
    pricePerNight: 150,
    status: 'available',
    amenities: ['City View', 'Queen Bed'],
  },
  {
    id: '4',
    number: '004',
    type: 'Penthouse',
    capacity: 6,
    pricePerNight: 800,
    status: 'maintenance',
    amenities: ['Panoramic View', 'Kitchen', 'Private Pool'],
  },
  // Generate more rooms for demo
  ...Array.from({ length: 46 }, (_, i) => ({
    id: `${i + 5}`,
    number: `${String(i + 5).padStart(3, '0')}`,
    type: ['Standard', 'Deluxe', 'Suite', 'Penthouse'][Math.floor(Math.random() * 4)],
    capacity: [2, 4, 6][Math.floor(Math.random() * 3)],
    pricePerNight: [150, 200, 350, 800][Math.floor(Math.random() * 4)],
    status: ['available', 'occupied', 'maintenance'][Math.floor(Math.random() * 3)],
    amenities: [
      ['City View', 'Queen Bed'],
      ['Ocean View', 'King Bed', 'Mini Bar'],
      ['Balcony', '2 Queen Beds', 'Kitchenette'],
      ['Panoramic View', 'Kitchen', 'Private Pool'],
    ][Math.floor(Math.random() * 4)],
  })),
];

export const bookings: Booking[] = [
  // Today's check-ins
  {
    id: 'today-checkin-1',
    guestId: 'g2',
    roomType: 'Deluxe',
    roomNumber: '001',
    checkIn: new Date('2024-03-18'),
    checkOut: new Date('2024-03-18'),
    status: 'confirmed',
    totalAmount: 600,
    source: 'direct',
    paymentStatus: 'paid',
    notes: 'Early check-in requested',
  },
  {
    id: 'today-checkin-2',
    guestId: 'g3',
    roomType: 'Standard',
    roomNumber: '105',
    checkIn: new Date('2024-03-20'),
    checkOut: new Date('2024-03-20'),
    status: 'confirmed',
    totalAmount: 1400,
    source: 'booking.com',
    paymentStatus: 'paid',
    notes: 'Late check-out requested',
  },
  {
    id: 'today-checkin-3',
    guestId: 'g4',
    roomType: 'Suite',
    roomNumber: '301',
    checkIn: new Date('2024-03-22'),
    checkOut: new Date('2024-03-22'),
    status: 'pending',
    totalAmount: 600,
    source: 'expedia',
    paymentStatus: 'pending',
  },
  {
    id: 'today-checkout-1',
    guestId: 'g5',
    roomType: 'Deluxe',
    roomNumber: '205',
    checkIn: new Date(new Date().setDate(new Date().getDate() - 2)),
    checkOut: new Date(new Date().setHours(11, 0, 0, 0)), // Today at 11 AM
    status: 'confirmed',
    source: 'airbnb',
    totalAmount: 450,
    paymentStatus: 'paid',
    notes: 'Regular guest',
  },
  {
    id: 'today-checkout-2',
    guestId: 'g6',
    roomType: 'Penthouse',
    roomNumber: '501',
    checkIn: new Date(new Date().setDate(new Date().getDate() - 5)),
    checkOut: new Date(new Date().setHours(12, 0, 0, 0)), // Today at 12 PM
    status: 'confirmed',
    totalAmount: 2500,
    paymentStatus: 'paid',
  },
  {
    id: 'today-checkout-3',
    guestId: 'g7',
    roomType: 'Standard',
    roomNumber: '102',
    checkIn: new Date(new Date().setDate(new Date().getDate() - 1)),
    checkOut: new Date(new Date().setHours(10, 0, 0, 0)), // Today at 10 AM
    status: 'confirmed',
    totalAmount: 150,
    paymentStatus: 'partial',
    notes: 'Late check-out requested',
  },
  // Generate more random bookings
  ...Array.from({ length: 47 }, (_, i) => {
    const guest = guests[Math.floor(Math.random() * guests.length)];
    const startDay = Math.floor(Math.random() * 25) + 1;
    const duration = Math.floor(Math.random() * 5) + 1;
    const roomIndex = Math.floor(Math.random() * rooms.length);
    const sources: Booking['source'][] = ['direct', 'booking.com', 'expedia', 'airbnb'];
    return {
      id: `b${i + 4}`,
      guestId: guest.id,
      roomType: rooms[roomIndex].type,
      roomNumber: rooms[roomIndex].number,
      checkIn: new Date(2024, 2, startDay),
      checkOut: new Date(2024, 2, startDay + duration),
      source: sources[Math.floor(Math.random() * sources.length)],
      status: ['confirmed', 'pending', 'cancelled'][Math.floor(Math.random() * 3)],
      totalAmount: rooms[roomIndex].pricePerNight * duration,
      paymentStatus: ['paid', 'pending', 'partial'][Math.floor(Math.random() * 3)],
    };
  }),
];

export const dailyStats: DailyStats[] = [
  {
    date: '2024-03-14',
    occupancyRate: 85,
    revenue: 2500,
    newBookings: 3,
    checkIns: 4,
    checkOuts: 2,
  },
  {
    date: '2024-03-15',
    occupancyRate: 82,
    revenue: 2800,
    newBookings: 5,
    checkIns: 3,
    checkOuts: 4,
  },
  {
    date: '2024-03-16',
    occupancyRate: 88,
    revenue: 3200,
    newBookings: 4,
    checkIns: 5,
    checkOuts: 3,
  },
  {
    date: '2024-03-17',
    occupancyRate: 90,
    revenue: 3500,
    newBookings: 6,
    checkIns: 6,
    checkOuts: 4,
  },
  {
    date: '2024-03-18',
    occupancyRate: 87,
    revenue: 3100,
    newBookings: 3,
    checkIns: 4,
    checkOuts: 5,
  },
];