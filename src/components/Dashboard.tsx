import React, { useEffect, useState } from 'react';
import { Calendar } from './Calendar';
import { ConfigPanel } from './ConfigPanel';
import { GuestList } from './GuestList';
import { Notifications } from './Notifications';
import { BookingOverview } from './BookingOverview';
import { guests, notifications } from '../data/mockData';
import { login, getAssignedBookings, getRoomCategories, getRooms, getHotelRoomTypes, getUnassignedBookings } from '../services/api';
import { APIBooking, APIRoom, RoomCategory, HotelRoomType } from '../types';
import { API_CONFIG } from '../config';
import { 
  Hotel, 
  Users, 
  DollarSign, 
  TrendingUp
} from 'lucide-react';

interface DashboardProps {
  roomTypes: HotelRoomType[];
}

export function Dashboard({ roomTypes: initialRoomTypes = [] }: DashboardProps) {
  const [propertyRooms, setPropertyRooms] = useState<APIRoom[]>([]);
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);
  const [notificationsList, setNotificationsList] = useState(notifications);
  const [periodType, setPeriodType] = useState<'day' | 'month'>('day');
  const [bookings, setBookings] = useState<APIBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'overview' | 'guests' | 'reports'>('calendar');
  const [startDate, setStartDate] = useState(new Date());
  const [numDays, setNumDays] = useState<7 | 14 | 30>(7);
  const [roomTypes, setRoomTypes] = useState<HotelRoomType[]>(initialRoomTypes);
  const [viewDateRange, setViewDateRange] = useState<{start: Date, end: Date}>({
    start: new Date(),
    end: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookingsForRange = async (viewStart: Date, viewEnd: Date) => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      console.log('Fetching bookings for calendar view:', {
        start: viewStart.toISOString(),
        end: viewEnd.toISOString()
      });

      const [assignedBookings, unassignedBookings] = await Promise.all([
        getAssignedBookings({ 
          check_in_from: viewStart.toISOString().split('T')[0],
          check_in_to: viewEnd.toISOString().split('T')[0]
        }),
        getUnassignedBookings({
          check_in_from: viewStart.toISOString().split('T')[0],
          check_in_to: viewEnd.toISOString().split('T')[0]
        })
      ]);

      const allBookings = [...assignedBookings, ...unassignedBookings];
      console.log('Calendar view bookings loaded:', {
        total: allBookings.length,
        assigned: assignedBookings.length,
        unassigned: unassignedBookings.length,
        dateRange: { viewStart, viewEnd }
      });

      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching calendar bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      // Fetch rooms and room types
      const [rooms, types] = await Promise.all([
        getRooms({
          hotel_id: API_CONFIG.HOTEL_ID
        }),
        getHotelRoomTypes(API_CONFIG.HOTEL_ID)
      ]);
      console.log('Loaded data:', {
        rooms: rooms.length,
        types: types.length
      });
      setPropertyRooms(rooms);
      setRoomTypes(types);

      // Fetch room categories
      const categories = await getRoomCategories(API_CONFIG.HOTEL_ID);
      console.log('Loaded room categories:', categories);
      setRoomCategories(categories);

      // Fetch initial bookings
      await fetchBookingsForRange(viewDateRange.start, viewDateRange.end);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update view date range when calendar date changes
  const handleDateSelect = (date: Date) => {
    const end = new Date(date);
    end.setDate(end.getDate() + parseInt(numDays.toString()));
    setViewDateRange({ start: date, end });
    fetchBookingsForRange(date, end);
  };

  const handleDateChange = async (date: Date) => {
    setStartDate(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + numDays);
    await fetchBookingsForRange(date, endDate);
  };

  const handleNumDaysChange = async (days: 7 | 14 | 30) => {
    setNumDays(days);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    await fetchBookingsForRange(startDate, endDate);
  };

  const calculateStats = () => {
    const now = new Date();
    const currentPeriodStart = periodType === 'day' 
      ? new Date(now.setHours(0, 0, 0, 0))
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const lastPeriodStart = periodType === 'day'
      ? new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentPeriodBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.check_in_date);
      return periodType === 'day'
        ? bookingDate.toDateString() === currentPeriodStart.toDateString()
        : bookingDate.getMonth() === currentPeriodStart.getMonth() &&
          bookingDate.getFullYear() === currentPeriodStart.getFullYear();
    });

    const lastPeriodBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.check_in_date);
      return periodType === 'day'
        ? bookingDate.toDateString() === lastPeriodStart.toDateString()
        : bookingDate.getMonth() === lastPeriodStart.getMonth() &&
          bookingDate.getFullYear() === lastPeriodStart.getFullYear();
    });

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return '+100%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const currentOccupancy = (currentPeriodBookings.length / propertyRooms.length) * 100;
    const lastOccupancy = (lastPeriodBookings.length / propertyRooms.length) * 100;

    const calculateTotalAmount = (bookings: APIBooking[]) => 
      bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || '0'), 0);

    return [
      {
        title: 'Total Rooms',
        value: propertyRooms.length.toString(),
        icon: Hotel,
        change: '0%',
        color: 'bg-[#2596be]',
      },
      {
        title: 'Occupancy Rate',
        value: `${currentOccupancy.toFixed(1)}%`,
        icon: Users,
        change: calculateChange(currentOccupancy, lastOccupancy),
        color: 'bg-[#2596be]/90',
      },
      {
        title: 'Revenue',
        value: `$${calculateTotalAmount(currentPeriodBookings).toLocaleString()}`,
        icon: DollarSign,
        change: calculateChange(
          calculateTotalAmount(currentPeriodBookings),
          calculateTotalAmount(lastPeriodBookings)
        ),
        color: 'bg-[#2596be]/80',
      },
      {
        title: 'Bookings',
        value: currentPeriodBookings.length.toString(),
        icon: TrendingUp,
        change: calculateChange(currentPeriodBookings.length, lastPeriodBookings.length),
        color: 'bg-[#2596be]/70',
      },
    ];
  };

  const handleMarkAsRead = (id: string) => {
    setNotificationsList(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleBookingUpdate = async (updatedBooking: APIBooking) => {
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Management Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your properties and bookings efficiently</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white rounded-lg shadow p-1">
              <button
                onClick={() => setPeriodType('day')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  periodType === 'day'
                    ? 'bg-[#2596be] text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setPeriodType('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  periodType === 'month'
                    ? 'bg-[#2596be] text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                Month
              </button>
            </div>
            <Notifications
              notifications={notificationsList}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      parseFloat(stat.change) > 0 ? 'text-green-500' :
                      parseFloat(stat.change) < 0 ? 'text-red-500' :
                      'text-gray-500'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">
                      vs last {periodType}
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'calendar'
                ? 'text-[#2596be] border-b-2 border-[#2596be]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'overview'
                ? 'text-[#2596be] border-b-2 border-[#2596be]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'guests'
                ? 'text-[#2596be] border-b-2 border-[#2596be]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Guest Database
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'reports'
                ? 'text-[#2596be] border-b-2 border-[#2596be]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reports
          </button>
        </div>

        {activeTab === 'calendar' && (
          <div className="p-4">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex rounded-lg border bg-white p-1 shadow-sm">
                <button
                  onClick={() => handleNumDaysChange(7)}
                  className={`px-4 py-2 rounded-md ${
                    numDays === 7 ? 'bg-[#2596be] text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => handleNumDaysChange(14)}
                  className={`px-4 py-2 rounded-md ${
                    numDays === 14 ? 'bg-[#2596be] text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  14 Days
                </button>
                <button
                  onClick={() => handleNumDaysChange(30)}
                  className={`px-4 py-2 rounded-md ${
                    numDays === 30 ? 'bg-[#2596be] text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            <Calendar
              rooms={propertyRooms}
              roomTypes={roomTypes}
              startDate={startDate}
              numDays={numDays}
              onDateSelect={handleDateSelect}
              onBookingUpdate={handleBookingUpdate}
              bookings={bookings}
            />

            <ConfigPanel
              rooms={propertyRooms}
              onUpdateRooms={setPropertyRooms}
            />
          </div>
        )}
        
        {activeTab === 'overview' && (
          <BookingOverview bookings={bookings} />
        )}
        
        {activeTab === 'guests' && (
          <GuestList guests={guests} bookings={bookings} />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h3 className="text-lg font-medium">Occupancy Rate</h3>
                <div className="text-3xl font-bold text-[#2596be]">
                  {((bookings.filter(b => 
                    new Date(b.check_in_date) <= new Date() && 
                    new Date(b.check_out_date) >= new Date() &&
                    !b.status.includes('cancelled')
                  ).length / propertyRooms.length) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Current Occupancy</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h3 className="text-lg font-medium">Monthly Revenue</h3>
                <div className="text-3xl font-bold text-[#2596be]">
                  ${bookings.filter(b => {
                    const date = new Date(b.check_in_date);
                    return date.getMonth() === new Date().getMonth() &&
                           date.getFullYear() === new Date().getFullYear();
                  }).reduce((sum, b) => sum + parseFloat(b.total_amount), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">This month</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h3 className="text-lg font-medium">Average Daily Rate</h3>
                <div className="text-3xl font-bold text-[#2596be]">
                  ${(bookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0) / 
                     Math.max(1, bookings.length)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">All bookings</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-semibold">Room Categories</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {roomCategories.map(category => {
                      const roomsInCategory = propertyRooms.filter(r => r.room_category_id === category.id);
                      const bookingsInCategory = bookings.filter(b => 
                        roomsInCategory.some(r => r.category_name === b.room_type_name)
                      );
                      return (
                        <div key={category.id} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-gray-500">
                              {roomsInCategory.length} rooms, {bookingsInCategory.length} bookings
                            </div>
                          </div>
                          <div className="text-lg font-medium">
                            ${category.base_price}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-semibold">Room Status</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {Object.entries(propertyRooms.reduce((acc, room) => ({
                      ...acc,
                      [room.status]: (acc[room.status] || 0) + 1
                    }), {} as Record<string, number>)).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
                          <div className="text-sm text-gray-500">
                            {((count / propertyRooms.length) * 100).toFixed(1)}% of rooms
                          </div>
                        </div>
                        <div className="text-lg font-medium">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}