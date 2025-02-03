import React from 'react';
import { Users, Search, ChevronRight } from 'lucide-react';
import { Guest, Booking } from '../types';

interface GuestListProps {
  guests: Guest[];
  bookings: Booking[];
}

export function GuestList({ guests, bookings }: GuestListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedGuest, setSelectedGuest] = React.useState<Guest | null>(null);

  const filteredGuests = guests.filter(guest => 
    `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone.includes(searchTerm)
  );

  const getGuestBookings = (guestId: string) => {
    return bookings.filter(booking => booking.guestId === guestId);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6 text-[#2596be]" />
          Guest Directory
        </h2>
        <div className="mt-4 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2596be]"
          />
        </div>
      </div>

      <div className="divide-y">
        {filteredGuests.map(guest => (
          <div
            key={guest.id}
            className="p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedGuest(guest === selectedGuest ? null : guest)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{guest.firstName} {guest.lastName}</h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>{guest.email}</div>
                  <div>{guest.phone}</div>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                selectedGuest?.id === guest.id ? 'rotate-90' : ''
              }`} />
            </div>

            {selectedGuest?.id === guest.id && (
              <div className="mt-4 pl-4 border-l-2 border-[#2596be]">
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {guest.address && <div>Address: {guest.address}</div>}
                    {guest.city && <div>City: {guest.city}</div>}
                    {guest.country && <div>Country: {guest.country}</div>}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Booking History</h4>
                  <div className="space-y-2">
                    {getGuestBookings(guest.id).map(booking => (
                      <div
                        key={booking.id}
                        className="text-sm bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">Room {booking.roomNumber}</div>
                            <div className="text-gray-500">
                              {booking.checkIn.toLocaleDateString()} - {booking.checkOut.toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === 'confirmed' ? 'bg-[#2596be] text-white' :
                            booking.status === 'pending' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-gray-600">
                          <span>Total: ${booking.totalAmount}</span>
                          <span className={`
                            ${booking.paymentStatus === 'paid' ? 'text-green-600' :
                              booking.paymentStatus === 'partial' ? 'text-orange-600' :
                              'text-red-600'
                            }
                          `}>
                            {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {guest.notes && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {guest.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}