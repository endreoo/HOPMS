import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grid, Globe, Home } from 'lucide-react';
import { Booking, Room, Guest } from '../types';
import { BookingDetails } from './BookingDetails';
import { DatePicker } from './DatePicker';

interface CalendarProps {
  bookings: Booking[];
  rooms: Room[];
  guests: Guest[];
  onDateSelect: (date: Date) => void;
}

export function Calendar({ bookings, rooms, guests, onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [viewType, setViewType] = React.useState<'7' | '14' | '30'>('7');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Update getDays to handle different view types
  const getDays = () => {
    const days: Date[] = [];
    const start = new Date(currentMonth);
    const daysToShow = parseInt(viewType);
    
    for (let i = 0; i < daysToShow; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  React.useEffect(() => {
    // Reset scroll position when view type changes
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      setScrollPosition(0);
    }
  }, [viewType]);

  const days = getDays();

  const getBookingsForRoom = (roomNumber: string) => {
    return bookings.filter(booking => 
      booking.roomNumber === roomNumber && 
      booking.status !== 'cancelled'
    );
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollTo({
        left: Math.max(0, container.scrollLeft + scrollAmount),
        behavior: 'smooth'
      });
      setScrollPosition(prev => Math.max(0, prev + scrollAmount));
    }
  };

  const handleDateSelect = (date: Date) => {
    setCurrentMonth(new Date(date));
    setShowDatePicker(false);
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

  const getBookingSourceIcon = (source: Booking['source']) => {
    switch (source) {
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

  const getBookingStyle = (booking: Booking) => {
    const startDate = days[0];
    const endDate = days[days.length - 1];
    const bookingStart = new Date(booking.checkIn);
    const bookingEnd = new Date(booking.checkOut);
    
    // Calculate the day index for start and end
    let startIndex = Math.max(0, days.findIndex(day => 
      day.toDateString() === bookingStart.toDateString()
    ));
    
    let endIndex = days.findIndex(day => 
      day.toDateString() === bookingEnd.toDateString()
    );
    
    if (endIndex === -1) endIndex = days.length - 1;
    
    const left = (startIndex / days.length) * 100;
    const width = ((endIndex - startIndex + 1) / days.length) * 100;

    return {
      left: `${left}%`,
      width: `${Math.max(width, 5)}%`, // Ensure minimum width for very short stays
    };
  };

  const getStatusColor = (booking: Booking) => {
    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);

    switch (booking.status) {
      case 'confirmed':
        if (now < checkIn) {
          return 'bg-[#2596be]'; // Booked but not checked in yet
        } else if (now >= checkIn && now < checkOut) {
          return 'bg-green-600'; // Currently checked in
        } else {
          return 'bg-gray-500'; // Checked out
        }
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
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

  const sortedRooms = [...rooms].sort((a, b) => {
    const aNum = parseInt(a.number);
    const bNum = parseInt(b.number);
    return aNum - bNum;
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-[#2596be]" />
          Room Availability
        </h2>
        <div className="flex items-center gap-4">
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
          <div className="flex gap-2">
            <button
              onClick={() => handleScroll('left')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={scrollPosition <= 0}
              title="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title="Scroll Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scroll-smooth" ref={containerRef}>
        <div className="inline-flex min-w-full flex-col">
          {/* Days header */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            <div className="w-[200px] min-w-[200px] p-4 font-medium text-gray-700 border-r">
              Room
            </div>
            <div className="flex flex-1" style={{ minWidth: `${days.length * 100}px` }}>
              {days.map((date, index) => (
                <div 
                  key={index} 
                  className={`${getDateClass(date)} flex-1`}
                  style={{ minWidth: '100px' }}
                >
                  <div className="p-2">
                    <div className="text-xs text-gray-500 font-medium">
                      {date.toLocaleDateString('default', { weekday: 'short' })}
                    </div>
                    <div className="text-sm mt-1">{date.getDate()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room rows */}
          <div className="relative">
            {sortedRooms.map(room => {
              const roomBookings = getBookingsForRoom(room.number);
              return (
                <div key={room.id} className="flex border-b hover:bg-gray-50">
                  <div className="w-[200px] min-w-[200px] p-4 border-r flex items-center justify-between">
                    <div>
                      <div className="font-medium">Room {room.number}</div>
                      <div className="text-sm text-gray-500">{room.type}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      room.status === 'available' ? 'bg-green-500' :
                      room.status === 'occupied' ? 'bg-[#2596be]' : 'bg-yellow-500'
                    }`} />
                  </div>
                  <div className="flex-1 relative h-[72px]" style={{ minWidth: `${days.length * 100}px` }}>
                    {roomBookings.map(booking => {
                      const style = getBookingStyle(booking);
                      const guest = guests.find(g => g.id === booking.guestId);
                      const bookingDuration = Math.ceil(
                        (booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const now = new Date();
                      const checkIn = new Date(booking.checkIn);
                      const checkOut = new Date(booking.checkOut);
                      
                      let statusText = '';
                      if (booking.status === 'confirmed') {
                        if (now < checkIn) {
                          statusText = 'Booked';
                        } else if (now >= checkIn && now < checkOut) {
                          statusText = 'Checked In';
                        } else {
                          statusText = 'Checked Out';
                        }
                      } else {
                        statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
                      }
                      
                      return (
                        <div
                          key={booking.id}
                          className={`absolute top-2 bottom-2 rounded-md shadow-sm ${getStatusColor(booking)} 
                            text-white text-sm flex items-center px-3 cursor-pointer hover:opacity-90
                            transition-all hover:shadow-md whitespace-nowrap overflow-hidden gap-2`}
                          style={style}
                          onClick={() => setSelectedBooking(booking)}
                          title={`${guest?.firstName} ${guest?.lastName}
Check-in: ${booking.checkIn.toLocaleDateString()} ${booking.checkIn.toLocaleTimeString()}
Check-out: ${booking.checkOut.toLocaleDateString()} ${booking.checkOut.toLocaleTimeString()}
Duration: ${bookingDuration} ${bookingDuration === 1 ? 'day' : 'days'}
Status: ${statusText}
Payment: ${booking.paymentStatus}
Source: ${booking.source}`}
                        >
                          {getBookingSourceIcon(booking.source)}
                          <div className="flex items-center gap-2">
                            {style.width !== '5%' && <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">
                              {guest?.firstName[0]}{guest?.lastName[0]}</div>}
                            <span>{guest?.firstName} {guest?.lastName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
          guest={guests.find(g => g.id === selectedBooking.guestId)!}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}