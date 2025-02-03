import React from 'react';
import { Calendar } from './Calendar';
import { Reports } from './Reports';
import { ConfigPanel } from './ConfigPanel';
import { GuestList } from './GuestList';
import { Notifications } from './Notifications';
import { bookings, dailyStats, rooms, guests, notifications } from '../data/mockData';
import { 
  Hotel, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar as CalendarIcon
} from 'lucide-react';

export function Dashboard() {
  const [propertyRooms, setPropertyRooms] = React.useState(rooms);
  const [notificationsList, setNotificationsList] = React.useState(notifications);
  const [periodType, setPeriodType] = React.useState<'day' | 'month'>('day');

  const calculateStats = () => {
    const now = new Date();
    const currentPeriodStart = periodType === 'day' 
      ? new Date(now.setHours(0, 0, 0, 0))
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const lastPeriodStart = periodType === 'day'
      ? new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentPeriodBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.checkIn);
      return periodType === 'day'
        ? bookingDate.toDateString() === currentPeriodStart.toDateString()
        : bookingDate.getMonth() === currentPeriodStart.getMonth() &&
          bookingDate.getFullYear() === currentPeriodStart.getFullYear();
    });

    const lastPeriodBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.checkIn);
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

    const currentOccupancy = (currentPeriodBookings.length / rooms.length) * 100;
    const lastOccupancy = (lastPeriodBookings.length / rooms.length) * 100;

    return [
      {
        title: 'Total Rooms',
        value: rooms.length.toString(),
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
        value: `$${currentPeriodBookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}`,
        icon: DollarSign,
        change: calculateChange(
          currentPeriodBookings.reduce((sum, b) => sum + b.totalAmount, 0),
          lastPeriodBookings.reduce((sum, b) => sum + b.totalAmount, 0)
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Calendar 
              bookings={bookings}
              rooms={propertyRooms}
              guests={guests}
              onDateSelect={(date) => console.log('Selected date:', date)} 
            />
          </div>
          <div>
            <div className="space-y-8">
              <Reports stats={dailyStats} />
              <GuestList guests={guests} bookings={bookings} />
            </div>
          </div>
        </div>
        <ConfigPanel rooms={propertyRooms} onUpdateRooms={setPropertyRooms} />
      </div>
    </div>
  );
}