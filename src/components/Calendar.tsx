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

    // Get view start and end dates
    const viewStart = startOfDay(dates[0]);
    const viewEnd = startOfDay(dates[dates.length - 1]);

    console.log('Calendar view dates:', {
      viewStart: viewStart.toISOString(),
      viewEnd: viewEnd.toISOString(),
      totalBookings: processedBookings.length
    });

    // Filter bookings that overlap with the current view
    processedBookings = processedBookings.filter(booking => {
      // Basic validation
      if (!booking.check_in_date || !booking.check_out_date || booking.status === 'cancelled') {
        return false;
      }

      // Convert dates
      const bookingStart = startOfDay(new Date(booking.check_in_date));
      const bookingEnd = startOfDay(new Date(booking.check_out_date));

      // Check if booking overlaps with view period
      const overlapsView = bookingStart <= viewEnd && bookingEnd >= viewStart;

      if (!overlapsView) {
        console.log('Booking outside view:', {
          id: booking.id,
          checkIn: bookingStart.toISOString(),
          checkOut: bookingEnd.toISOString()
        });
      }

      return overlapsView;
    }).map(booking => ({
      ...booking,
      check_in_date: new Date(booking.check_in_date).toISOString(),
      check_out_date: new Date(booking.check_out_date).toISOString()
    }));

    console.log('Filtered bookings:', {
      total: processedBookings.length,
      sample: processedBookings[0],
      dateRange: {
        start: viewStart.toISOString(),
        end: viewEnd.toISOString()
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

  // Update getRoomBookings to return unique bookings instead of per-day bookings
  const getRoomBookings = React.useCallback((roomNumber: string) => {
    if (!roomNumber || !Array.isArray(safeBookings)) {
      return [];
    }

    return safeBookings.filter(booking => {
      if (!booking || typeof booking !== 'object') return false;

      // Get room number from all possible fields
      const bookingRoomNumber = booking.room_number || 
                               (booking.room && booking.room.room_number) ||
                               (booking.room_details && booking.room_details.room_number) ||
                               (booking.raw_data?.bookingDetail?.BookingTran?.[0]?.RoomName);

      return bookingRoomNumber === roomNumber;
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
    const bookingStart = new Date(booking.check_in_date);
    const bookingEnd = new Date(booking.check_out_date);
    const viewStart = dates[0];
    const viewEnd = dates[dates.length - 1];
    
    // Find the visible start and end dates within the current view
    const visibleStart = Math.max(0, dates.findIndex(day => 
      startOfDay(day).getTime() === startOfDay(bookingStart).getTime()
    ));
    
    const visibleEnd = dates.findIndex(day => 
      startOfDay(day).getTime() === startOfDay(bookingEnd).getTime()
    );
    
    // Calculate position and width
    const cellWidth = 100 / dates.length;
    
    // Check if booking extends beyond view boundaries
    const startsBeforeView = startOfDay(bookingStart).getTime() < startOfDay(viewStart).getTime();
    const endsAfterView = startOfDay(bookingEnd).getTime() > startOfDay(viewEnd).getTime();
    
    // Calculate left position
    const left = startsBeforeView ? 0 : (visibleStart * cellWidth) + (cellWidth / 2);
    
    // Calculate width based on visibility
    let width;
    if (startsBeforeView && endsAfterView) {
      // Booking spans entire view
      width = 100;
    } else if (startsBeforeView) {
      // Booking starts before view and ends within view
      width = ((visibleEnd + 0.5) * cellWidth);
    } else if (endsAfterView) {
      // Booking starts within view and ends after view
      width = (100 - left);
    } else {
      // Booking starts and ends within view
      width = ((visibleEnd === -1 ? dates.length - 0.5 : visibleEnd + 0.5) - (visibleStart + 0.5)) * cellWidth;
    }

    // Determine booking status color
    const now = new Date();
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    
    let baseColor;
    if (now < checkIn) {
      // Future booking (confirmed but not checked in)
      baseColor = '#2596be';
    } else if (now >= checkIn && now < checkOut) {
      // Active booking (checked in)
      baseColor = '#16a34a';
    } else {
      // Past booking (checked out)
      baseColor = '#6b7280';
    }

    // Create gradient effect
    const gradient = `linear-gradient(90deg, 
      ${baseColor}99 0%, 
      ${baseColor} 40%, 
      ${baseColor} 60%,
      ${baseColor}cc 100%
    )`;

    return {
      position: 'absolute' as const,
      left: `${left}%`,
      width: `${width}%`,
      height: '32px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: gradient,
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      whiteSpace: 'nowrap' as const,
      textOverflow: 'ellipsis',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 8px',
      color: 'white',
      fontSize: '12px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      zIndex: 1
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
    return (
      <div
        style={getBookingStyle(booking)}
        onClick={() => setSelectedBooking(booking)}
        className="hover:brightness-110"
        title={`${booking.first_name} ${booking.last_name} (${booking.booking_number})`}
      >
        <div className="flex items-center gap-1.5 min-w-0 justify-center">
          {getBookingSourceIcon(booking.source)}
          <span className="truncate">{booking.first_name} {booking.last_name}</span>
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
    <div className="bg-white rounded-lg shadow flex flex-col">
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

      <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Header with dates - make it sticky */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="grid" style={{ gridTemplateColumns: `150px repeat(${parseInt(viewType)}, minmax(60px, 1fr))` }}>
            <div className="p-1 font-medium bg-gray-100 text-sm">Room</div>
            {dates.map((date) => (
              <div key={date.toString()} className="px-1 py-2 font-medium bg-gray-100 text-center text-xs">
                <div>{format(date, 'MMM')}</div>
                <div className="font-bold">{format(date, 'd')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-auto flex-1">
          <div className="w-full">
            {/* Room types and their rooms */}
            {displayRoomTypes.map((type) => {
              const typeRooms = roomsByType[type.id] || [];
              return (
                <React.Fragment key={type.id}>
                  {/* Room type header */}
                  <div 
                    className="grid cursor-pointer hover:bg-gray-100/50 transition-colors" 
                    style={{ gridTemplateColumns: `150px repeat(${parseInt(viewType)}, minmax(60px, 1fr))` }}
                    onClick={() => toggleRoomType(type.id)}
                  >
                    <div className="p-1 font-medium bg-gray-50 flex items-center justify-between">
                      <div className="truncate text-sm">{type.name} ({typeRooms.length})</div>
                      <div className={`transform transition-transform ${collapsedTypes[type.id] ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>
                    {dates.map((date) => (
                      <div key={date.toString()} className="p-1 bg-gray-50 relative">
                        {getRoomBookings(type.id.toString()).length > 0 && (
                          <div className="absolute inset-1 bg-[#2596be]/10 rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-[#2596be]">
                              {getRoomBookings(type.id.toString()).length}
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
                        style={{ gridTemplateColumns: `150px repeat(${parseInt(viewType)}, minmax(60px, 1fr))` }}
                      >
                        <div className="p-1">
                          <div className="font-medium truncate text-sm">{room.room_number}</div>
                          <div className="text-xs text-gray-500">Floor {room.floor}</div>
                        </div>
                        <div className="relative" style={{ gridColumn: `2 / span ${dates.length}` }}>
                          {getRoomBookings(room.room_number).map(booking => (
                            <BookingCell key={booking.id} booking={booking} />
                          ))}
                        </div>
                      </div>
                    ))}
                </React.Fragment>
              );
            })}
          </div>
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