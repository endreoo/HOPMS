import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Home } from 'lucide-react';
import { APIBooking, APIRoom, Guest, HotelRoomType } from '../types';
import { BookingDetails } from './BookingDetails';
import { DatePicker } from './DatePicker';
import { format, addDays, startOfDay } from 'date-fns';
import { guests } from '../data/mockData';
import { updateBooking, assignRoom } from '../services/api';
import axios from 'axios';
import api from '../services/api';

interface SimpleBooking {
  booking: string;
  room: string;
  guest: string;
}

interface CalendarProps {
  rooms: APIRoom[];
  roomTypes: HotelRoomType[];
  startDate: Date;
  numDays: 7 | 14 | 30;
  onDateSelect: (date: Date) => void;
  onBookingUpdate: (booking: APIBooking) => void;
  bookings: APIBooking[] | { data: APIBooking[]; pagination?: { total: number } } | { bookings: APIBooking[]; total: number };
}

interface BookingDetailsProps {
  booking: APIBooking;
  guest?: Guest;
  rooms: APIRoom[];
  showDifferentTypeWarning?: boolean;
  onClose: () => void;
  onUpdate: (booking: APIBooking) => void;
}

function isSimpleBooking(booking: any): booking is SimpleBooking {
  return (
    typeof booking === 'object' &&
    'booking' in booking &&
    'room' in booking &&
    'guest' in booking
  );
}

export function Calendar({ 
  rooms = [], 
  roomTypes = [], 
  startDate = new Date(), 
  numDays = 7,
  onDateSelect,
  onBookingUpdate,
  bookings = [] as APIBooking[]
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(startDate);
  const [viewType, setViewType] = React.useState<'7' | '14' | '30'>(numDays.toString() as '7' | '14' | '30');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<APIBooking | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [collapsedTypes, setCollapsedTypes] = React.useState<Record<number, boolean>>({});
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Generate array of dates based on viewType
  const dates = React.useMemo(() => {
    const dateArray = [];
    const numDays = parseInt(viewType || '7');
    for (let i = 0; i < numDays; i++) {
      dateArray.push(addDays(currentMonth || new Date(), i));
    }
    return dateArray;
  }, [currentMonth, viewType]);

  // Update the normalizedBookings memo with more robust handling
  const normalizedBookings = React.useMemo(() => {
    let processedBookings: APIBooking[] = [];
    
    if (Array.isArray(bookings)) {
      processedBookings = bookings;
    } else if (bookings && typeof bookings === 'object') {
      if ('data' in bookings) {
        processedBookings = bookings.data;
      } else if ('bookings' in bookings) {
        processedBookings = bookings.bookings;
      }
    }

    // Filter out cancelled bookings and ensure dates are properly formatted
    processedBookings = processedBookings.filter(booking => 
      booking.status !== 'cancelled' && 
      booking.check_in_date && 
      booking.check_out_date &&
      booking.room_number // Only show assigned bookings
    ).map(booking => ({
      ...booking,
      check_in_date: new Date(booking.check_in_date).toISOString(),
      check_out_date: new Date(booking.check_out_date).toISOString()
    }));

    console.log('Calendar bookings:', {
      total: processedBookings.length,
      sample: processedBookings[0],
      dateRange: {
        start: dates[0]?.toISOString(),
        end: dates[dates.length - 1]?.toISOString()
      }
    });

    return {
      bookings: processedBookings,
      total: processedBookings.length
    };
  }, [bookings, dates]);

  // Ensure safeBookings is always an array
  const safeBookings = React.useMemo(() => {
    const result = normalizedBookings.bookings;
    console.log('Safe bookings processing:', {
      resultIsArray: Array.isArray(result),
      resultLength: result?.length || 0,
      sample: result?.[0]
    });
    return Array.isArray(result) ? result : [];
  }, [normalizedBookings]);

  // Add debug logging for bookings state changes
  React.useEffect(() => {
    console.log('Bookings state updated:', {
      raw: bookings,
      normalized: {
        bookings: normalizedBookings.bookings?.length,
        total: normalizedBookings.total
      },
      safe: {
        length: safeBookings.length,
        isArray: Array.isArray(safeBookings),
        sample: safeBookings[0]
      }
    });
  }, [bookings, normalizedBookings, safeBookings]);

  // Group rooms by room type
  const roomsByType = React.useMemo(() => {
    if (!Array.isArray(rooms)) {
      console.warn('Rooms is not an array:', rooms);
      return {};
    }
    
    console.log('Processing rooms by type:', {
      totalRooms: rooms.length,
      sample: rooms[0]
    });
    
    return rooms.reduce((acc, room) => {
      const typeId = room.room_type_id || room.hotel_room_type_id || 0;
      if (!acc[typeId]) {
        acc[typeId] = [];
      }
      acc[typeId].push(room);
      return acc;
    }, {} as Record<number, APIRoom[]>);
  }, [rooms]);

  // Group room types for display
  const displayRoomTypes = React.useMemo(() => {
    const types = new Map();
    rooms.forEach(room => {
      const typeId = room.room_type_id || room.hotel_room_type_id || 0;
      if (typeId && !types.has(typeId)) {
        types.set(typeId, {
          id: typeId,
          name: room.room_type_name || 'Unknown Room Type'
        });
      }
    });
    return Array.from(types.values());
  }, [rooms]);

  // Update the bookingsByType to use safeBookings
  const bookingsByType = React.useMemo(() => {
    if (!Array.isArray(safeBookings)) {
      console.warn('SafeBookings is not an array:', safeBookings);
      return {};
    }
    
    console.log('Processing bookings by type:', {
      totalBookings: safeBookings.length,
      sample: safeBookings[0]
    });
    
    return safeBookings.reduce((acc, booking) => {
      if (booking?.room_type_id) {
        if (!acc[booking.room_type_id]) {
          acc[booking.room_type_id] = [];
        }
        acc[booking.room_type_id].push(booking);
      }
      return acc;
    }, {} as Record<number, APIBooking[]>);
  }, [safeBookings]);

  // Update getRoomBookings with more robust handling
  const getRoomBookings = React.useCallback((roomNumber: string, date: Date) => {
    if (!roomNumber || !date || !Array.isArray(safeBookings)) {
      return [];
    }

    const currentDate = startOfDay(date);
    return safeBookings.filter(booking => {
      if (!booking || typeof booking !== 'object') return false;

      // Get room number from booking
      const bookingRoomNumber = booking.room_number;
      if (!bookingRoomNumber) return false;

      try {
        const checkIn = startOfDay(new Date(booking.check_in_date));
        const checkOut = startOfDay(new Date(booking.check_out_date));
        
        return (
          bookingRoomNumber === roomNumber &&
          currentDate >= checkIn &&
          currentDate < checkOut
        );
      } catch (error) {
        console.error('Error processing booking dates:', error);
        return false;
      }
    });
  }, [safeBookings]);

  // Update parent when date changes
  React.useEffect(() => {
    console.log('Current view date range:', {
      start: dates[0]?.toISOString(),
      end: dates[dates.length - 1]?.toISOString(),
      currentMonth: currentMonth.toISOString()
    });
    onDateSelect(currentMonth);
  }, [currentMonth]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollTo({
        left: Math.max(0, container.scrollLeft + scrollAmount),
        behavior: 'smooth'
      });
    }
  };

  const handleDateSelect = (date: Date) => {
    setCurrentMonth(date);
    setShowDatePicker(false);
    onDateSelect(date);
  };

  const handleQuickNav = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 3);
    } else {
      newDate.setMonth(newDate.getMonth() + 3);
    }
    setCurrentMonth(newDate);
  };

  const getBookingSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'booking.com':
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            B
          </div>
        );
      case 'expedia':
        return (
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            E
          </div>
        );
      case 'airbnb':
        return <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>;
      default:
        return <Home className="w-5 h-5 text-white/80" />;
    }
  };

  const getBookingStyle = (booking: APIBooking) => {
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    const bookingStart = new Date(booking.check_in_date);
    const bookingEnd = new Date(booking.check_out_date);
    
    // Calculate the day index for start and end
    let startIndex = Math.max(0, dates.findIndex(day => 
      day.toDateString() === bookingStart.toDateString()
    ));
    
    let endIndex = dates.findIndex(day => 
      day.toDateString() === bookingEnd.toDateString()
    );
    
    if (endIndex === -1) endIndex = dates.length - 1;
    
    // Calculate position and width
    const cellWidth = 100 / dates.length;
    const left = startIndex * cellWidth;
    const width = (endIndex - startIndex + 1) * cellWidth;

    const isFirstDay = startIndex === Math.max(0, dates.findIndex(day => 
      day.toDateString() === bookingStart.toDateString()
    ));
    const isLastDay = endIndex === dates.findIndex(day => 
      day.toDateString() === bookingEnd.toDateString()
    );

    // Create a polygon that starts from the middle of the left side if it's the first day
    // and/or ends at the middle of the right side if it's the last day
    const polygonPoints = [
      isFirstDay ? '50% 0,' : '0 0,',
      '100% 0,',
      isLastDay ? '50% 100%,' : '100% 100%,',
      isFirstDay ? '50% 100%' : '0 100%'
    ].join(' ');

    return {
      left: `${left}%`,
      width: `${width}%`,
      height: '32px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      position: 'absolute' as const,
      clipPath: `polygon(${polygonPoints})`
    };
  };

  const getStatusColor = (booking: APIBooking) => {
    const now = new Date();
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);

    if (booking.status.includes('confirmed')) {
      return 'bg-[#2596be]'; // Use the exact blue color from the screenshot
    } else if (booking.status === 'pending') {
      return 'bg-yellow-500';
    } else if (booking.status === 'cancelled') {
      return 'bg-red-500';
    } else if (booking.status === 'maintenance') {
      return 'bg-blue-900';
    } else {
      return 'bg-gray-500';
    }
  };

  const getDateClass = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    return `text-center border-r border-gray-200 ${
      isToday ? 'bg-[#2596be]/5 font-bold text-[#2596be]' :
      isWeekend ? 'bg-gray-50/50' : ''
    }`;
  };

  const BookingCell = ({ booking }: { booking: APIBooking }) => {
    console.log('Rendering booking cell:', {
      bookingId: booking.id,
      roomNumber: booking.room_number,
      checkIn: booking.check_in_date,
      checkOut: booking.check_out_date
    });

    const bookingStart = new Date(booking.check_in_date);
    const bookingEnd = new Date(booking.check_out_date);
    bookingStart.setHours(0, 0, 0, 0);
    bookingEnd.setHours(0, 0, 0, 0);
    
    // Create separate elements for check-in, middle days, and check-out
    const elements = dates.map((date, index) => {
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);
      
      const isCheckIn = currentDate.getTime() === bookingStart.getTime();
      const isCheckOut = currentDate.getTime() === bookingEnd.getTime();
      const isMiddleDay = currentDate > bookingStart && currentDate < bookingEnd;

      if (!isCheckIn && !isCheckOut && !isMiddleDay) return null;

      const cellWidth = 100 / dates.length;
      const style = {
        position: 'absolute' as const,
        height: '32px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        width: `${cellWidth}%`,
        left: `${index * cellWidth}%`,
      };

      if (isCheckIn) {
        return (
          <div
            key={`checkin-${date}`}
            className={`${getStatusColor(booking)}`}
            style={{
              ...style,
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
            }}
          />
        );
      }

      if (isMiddleDay) {
        return (
          <div
            key={`middle-${date}`}
            className={`${getStatusColor(booking)}`}
            style={{
              ...style,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            }}
          />
        );
      }

      if (isCheckOut) {
        return (
          <div
            key={`checkout-${date}`}
            className={`${getStatusColor(booking)}`}
            style={{
              ...style,
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
            }}
          />
        );
      }
    });

    return (
      <div
        onClick={() => setSelectedBooking(booking)}
        className="absolute inset-0 cursor-pointer group hover:brightness-110"
      >
        {elements}
        <div className="absolute inset-0 flex items-center px-2 py-1 overflow-hidden pointer-events-none">
          <div className="flex-1 overflow-hidden">
            <div className="text-white font-medium text-sm truncate flex items-center gap-1">
              {booking.status === 'maintenance' ? 'MAINTENANCE BLOCK' : (
                <>
                  <span className="bg-white/20 text-xs px-1 rounded">B</span>
                  {booking.first_name} {booking.last_name}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleBookingUpdate = (updatedBooking: APIBooking) => {
    onBookingUpdate(updatedBooking);
    setSelectedBooking(null);
  };

  const toggleRoomType = (typeId: number) => {
    setCollapsedTypes(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  // Function to check if a room is available for a booking period
  const isRoomAvailable = (room: APIRoom, checkIn: Date, checkOut: Date) => {
    console.log('Checking room availability:', {
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      booking_type_id: selectedBooking?.room_type_id,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0]
    });

    // Cache the room bookings
    const roomBookings = safeBookings.filter((b: APIBooking) => 
      b.room_number === room.room_number && 
      b.status !== 'cancelled' && 
      b.status !== 'no_show' &&
      b.id !== selectedBooking?.id  // Exclude current booking from check
    );

    if (roomBookings.length === 0) {
      console.log('No existing bookings for room:', room.room_number);
      return true;
    }

    // Normalize dates to start of day for comparison
    const normalizedCheckIn = new Date(checkIn);
    normalizedCheckIn.setHours(0, 0, 0, 0);
    const normalizedCheckOut = new Date(checkOut);
    normalizedCheckOut.setHours(0, 0, 0, 0);

    // Check for overlaps
    const hasOverlap = roomBookings.some((booking: APIBooking) => {
      const bookingStart = new Date(booking.check_in_date);
      bookingStart.setHours(0, 0, 0, 0);
      const bookingEnd = new Date(booking.check_out_date);
      bookingEnd.setHours(0, 0, 0, 0);
      
      const overlap = (
        (normalizedCheckIn < bookingEnd && normalizedCheckOut > bookingStart)
      );

      if (overlap) {
        console.log('Found overlap with booking:', {
          room: room.room_number,
          booking_id: booking.id,
          booking_dates: {
            start: booking.check_in_date,
            end: booking.check_out_date
          },
          requested_dates: {
            start: normalizedCheckIn.toISOString(),
            end: normalizedCheckOut.toISOString()
          }
        });
      }

      return overlap;
    });

    const isAvailable = !hasOverlap;
    if (isAvailable) {
      console.log(`Room ${room.room_number} is available`);
    }
    return isAvailable;
  };

  // Auto assign rooms to unassigned bookings
  const handleAutoAssign = async () => {
    if (isAssigning) return;
    setIsAssigning(true);

    try {
      console.log('🚀 Starting auto assign process');
      
      const unassignedBookings = safeBookings.filter((b: APIBooking) => !b.room_number && b.status !== 'cancelled');
      console.log('📋 Found unassigned bookings:', {
        total: unassignedBookings.length,
        bookings: unassignedBookings.map((b: APIBooking) => ({
          id: b.id,
          name: `${b.first_name} ${b.last_name}`,
          checkIn: b.check_in_date,
          checkOut: b.check_out_date
        }))
      });
      
      if (unassignedBookings.length === 0) {
        console.log('ℹ️ No unassigned bookings found');
        return;
      }

      // Get the first unassigned booking
      const booking = unassignedBookings[0];
      console.log('🎯 Selected booking for assignment:', {
        id: booking.id,
        guest: `${booking.first_name} ${booking.last_name}`,
        roomTypeId: booking.room_type_id,
        dates: {
          checkIn: booking.check_in_date,
          checkOut: booking.check_out_date
        }
      });

      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      
      // Find available rooms for this booking
      const availableRooms = rooms.filter(room => {
        const isAvailable = isRoomAvailable(room, checkIn, checkOut);
        if (isAvailable) {
          console.log('✅ Found available room:', {
            number: room.room_number,
            typeId: room.room_type_id
          });
        }
        return isAvailable;
      });

      console.log('📊 Available rooms summary:', {
        total: availableRooms.length,
        rooms: availableRooms.map(r => ({
          number: r.room_number,
          typeId: r.room_type_id
        }))
      });

      setSelectedBooking(booking);
      
    } catch (error) {
      console.error('❌ Error in auto assign:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Add room assignment helper
  const getBookingRoom = React.useCallback((booking: APIBooking) => {
    if (booking.room_id) {
      return rooms.find(room => room.id === booking.room_id);
    }
    return null;
  }, [rooms]);

  // Update booking display logic
  const renderBooking = React.useCallback((booking: APIBooking) => {
    const room = getBookingRoom(booking);
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    
    return (
      <div
        key={booking.id}
        className={`booking-block ${booking.status.toLowerCase()} ${room ? 'assigned' : 'unassigned'}`}
        style={{
          backgroundColor: room ? '#4CAF50' : '#FFA726',
          color: '#fff',
          padding: '4px',
          borderRadius: '4px',
          marginBottom: '2px'
        }}
      >
        <div className="booking-info">
          <span>{booking.first_name} {booking.last_name}</span>
          <span>{room ? `Room ${room.room_number}` : 'Unassigned'}</span>
        </div>
      </div>
    );
  }, [getBookingRoom]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-[#2596be]" />
          Room Availability
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAutoAssign}
            disabled={isAssigning}
            className="px-4 py-2 bg-[#2596be] text-white rounded-lg hover:bg-[#2596be]/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isAssigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              <>Assign</>
            )}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickNav('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title="Previous Period"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setDate(newDate.getDate() - parseInt(viewType));
                setCurrentMonth(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title="Previous Period"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDatePicker(true)}
              className="font-medium text-lg min-w-[200px] text-center hover:bg-gray-100 rounded-lg px-4"
            >
              {currentMonth.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
            </button>
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setDate(newDate.getDate() + parseInt(viewType));
                setCurrentMonth(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title="Next Period"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleQuickNav('next')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title="Next Period"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setViewType('7')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewType === '7'
                  ? 'bg-[#2596be] text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewType('14')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewType === '14'
                  ? 'bg-[#2596be] text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setViewType('30')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewType === '30'
                  ? 'bg-[#2596be] text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with dates */}
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(${parseInt(viewType)}, minmax(120px, 1fr))` }}>
            <div className="p-2 font-medium bg-gray-100">Room</div>
            {dates.map((date) => (
              <div key={date.toString()} className="p-2 font-medium bg-gray-100 text-center">
                {format(date, 'MMM d')}
              </div>
            ))}
          </div>

          {/* Room types and their rooms */}
          {displayRoomTypes.map((type) => {
            const typeRooms = roomsByType[type.id] || [];
            return (
              <React.Fragment key={type.id}>
                {/* Room type header */}
                <div 
                  className="grid cursor-pointer hover:bg-gray-100/50 transition-colors" 
                  style={{ gridTemplateColumns: `200px repeat(${parseInt(viewType)}, minmax(120px, 1fr))` }}
                  onClick={() => toggleRoomType(type.id)}
                >
                  <div className="p-2 font-medium bg-gray-50 flex items-center justify-between">
                    <div>{type.name} ({typeRooms.length})</div>
                    <div className={`transform transition-transform ${collapsedTypes[type.id] ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>
                  {dates.map((date) => (
                    <div key={date.toString()} className="p-2 bg-gray-50 relative">
                      {getRoomBookings(type.id.toString(), date).length > 0 && (
                        <div className="absolute inset-1 bg-[#2596be]/10 rounded flex items-center justify-center">
                          <span className="text-sm font-medium text-[#2596be]">
                            {getRoomBookings(type.id.toString(), date).length} booking{getRoomBookings(type.id.toString(), date).length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rooms */}
                {!collapsedTypes[type.id] && typeRooms
                  .sort((a, b) => a.room_number.localeCompare(b.room_number))
                  .map((room) => (
                    <div
                      key={room.id}
                      className="grid hover:bg-gray-50"
                      style={{ gridTemplateColumns: `200px repeat(${parseInt(viewType)}, minmax(120px, 1fr))` }}
                    >
                      <div className="p-2">
                        <div className="font-medium">{room.room_number}</div>
                        <div className="text-sm text-gray-500">Floor {room.floor}</div>
                      </div>
                      {dates.map((date) => {
                        const roomBookings = getRoomBookings(room.room_number, date);
                        return (
                          <div key={date.toString()} className="p-2 relative">
                            {roomBookings.map(booking => (
                              <BookingCell key={booking.id} booking={booking} />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2596be]" />
            <span className="text-sm text-gray-600">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-sm text-gray-600">Checked In</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-sm text-gray-600">Checked Out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
        </div>
      </div>
      {showDatePicker && (
        <DatePicker
          currentDate={currentMonth}
          onSelect={handleDateSelect}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      {selectedBooking && (
        <BookingDetails
          booking={selectedBooking}
          rooms={(() => {
            // Get all available rooms
            const checkIn = new Date(selectedBooking.check_in_date);
            const checkOut = new Date(selectedBooking.check_out_date);
            return rooms.filter(r => isRoomAvailable(r, checkIn, checkOut));
          })()}
          showDifferentTypeWarning={true}
          onClose={() => setSelectedBooking(null)}
          onUpdate={handleBookingUpdate}
        />
      )}
    </div>
  );
}