import React from 'react';
import { BarChart, TrendingUp, Users, X, Check, Clock, CreditCard } from 'lucide-react';
import { DailyStats, Booking, Guest } from '../types';
import { bookings, guests } from '../data/mockData';

interface ReportsProps {
  stats: DailyStats[];
}

export function Reports({ stats }: ReportsProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'check-in' | 'check-out'>('check-in');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysCheckIns = bookings.filter(booking => {
    const checkIn = new Date(booking.checkIn);
    checkIn.setHours(0, 0, 0, 0);
    return checkIn.getTime() === today.getTime() && booking.status === 'confirmed';
  });

  const todaysCheckOuts = bookings.filter(booking => {
    const checkOut = new Date(booking.checkOut);
    checkOut.setHours(0, 0, 0, 0);
    return checkOut.getTime() === today.getTime() && booking.status === 'confirmed';
  });

  const getGuest = (guestId: string) => {
    return guests.find(g => g.id === guestId)!;
  };

  const handleProcessCheckIn = (bookingId: string) => {
    console.log('Processing check-in for booking:', bookingId);
    // In a real app, this would update the booking status
  };

  const handleProcessCheckOut = (bookingId: string) => {
    console.log('Processing check-out for booking:', bookingId);
    // In a real app, this would update the booking status
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart className="w-6 h-6 text-[#2596be]" />
        <h2 className="text-2xl font-semibold">Reports</h2>
      </div>

      <div className="space-y-6">
        {/* Today's Overview Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Today's Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 cursor-pointer" onClick={() => setShowModal(true)}>
            <div className="bg-[#2596be]/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#2596be]" />
                  <span className="text-gray-600">Check-ins</span>
                </div>
                <span className="font-medium text-lg">{todaysCheckIns.length}</span>
              </div>
              <div className="text-sm text-gray-500">
                Next: {todaysCheckIns[0]?.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'No check-ins'}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-gray-600">Check-outs</span>
                </div>
                <span className="font-medium text-lg">{todaysCheckOuts.length}</span>
              </div>
              <div className="text-sm text-gray-500">
                Next: {todaysCheckOuts[0]?.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'No check-outs'}
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy Trend Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Occupancy Trend</h3>
          <div className="h-40 flex items-end gap-2">
            {stats.map((stat, index) => (
              <div
                key={stat.date}
                className="flex-1 bg-[#2596be]/20 hover:bg-[#2596be]/30 transition-colors rounded-t"
                style={{ height: `${stat.occupancyRate}%` }}
                title={`${stat.date}: ${stat.occupancyRate}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            {stats.map(stat => (
              <span key={stat.date}>{new Date(stat.date).getDate()}</span>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Clock className="w-6 h-6 text-[#2596be]" />
                Today's Management
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b">
              <div className="flex">
                <button
                  className={`flex-1 px-6 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'check-in'
                      ? 'border-[#2596be] text-[#2596be]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('check-in')}
                >
                  Check-ins ({todaysCheckIns.length})
                </button>
                <button
                  className={`flex-1 px-6 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'check-out'
                      ? 'border-[#2596be] text-[#2596be]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('check-out')}
                >
                  Check-outs ({todaysCheckOuts.length})
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeTab === 'check-in' ? (
                <div className="space-y-4">
                  {todaysCheckIns.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No check-ins scheduled for today
                    </div>
                  ) : (
                    todaysCheckIns.map(booking => {
                      const guest = getGuest(booking.guestId);
                      return (
                        <div
                          key={booking.id}
                          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-[#2596be] rounded-full flex items-center justify-center text-white">
                              {guest.firstName[0]}{guest.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                              <div className="text-sm text-gray-500">Room {booking.roomNumber} ({booking.roomType})</div>
                              <div className="text-sm text-gray-500">
                                {booking.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-gray-600">
                                <CreditCard className="w-4 h-4" />
                                <span>${booking.totalAmount}</span>
                              </div>
                              <div className={`text-sm ${
                                booking.paymentStatus === 'paid' ? 'text-green-600' :
                                booking.paymentStatus === 'partial' ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleProcessCheckIn(booking.id)}
                              className="bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90 flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Check In
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysCheckOuts.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No check-outs scheduled for today
                    </div>
                  ) : (
                    todaysCheckOuts.map(booking => {
                      const guest = getGuest(booking.guestId);
                      return (
                        <div
                          key={booking.id}
                          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-[#2596be] rounded-full flex items-center justify-center text-white">
                              {guest.firstName[0]}{guest.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                              <div className="text-sm text-gray-500">Room {booking.roomNumber} ({booking.roomType})</div>
                              <div className="text-sm text-gray-500">
                                {booking.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-gray-600">
                                <CreditCard className="w-4 h-4" />
                                <span>${booking.totalAmount}</span>
                              </div>
                              <div className={`text-sm ${
                                booking.paymentStatus === 'paid' ? 'text-green-600' :
                                booking.paymentStatus === 'partial' ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleProcessCheckOut(booking.id)}
                              className="bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90 flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Check Out
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}