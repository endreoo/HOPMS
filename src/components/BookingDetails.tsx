import React, { useState } from 'react';
import { X, Mail, Phone, CreditCard, Calendar, Home, User, Clock, Send, DollarSign, Check, Wand2 } from 'lucide-react';
import { APIBooking, Guest, APIRoom } from '../types';
import { InvoiceModal } from './InvoiceModal';
import { assignRoom, unassignRoomFromBooking, autoAssignRoom } from '../services/api';

interface BookingDetailsProps {
  booking: APIBooking;
  guest?: Guest;
  rooms: APIRoom[];
  showDifferentTypeWarning?: boolean;
  onClose: () => void;
  onUpdate: (booking: APIBooking) => void;
}

export function BookingDetails({ booking, guest, rooms, showDifferentTypeWarning, onClose, onUpdate }: BookingDetailsProps) {
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
  const [isAssigningRoom, setIsAssigningRoom] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState(booking.room_number || '');
  const [isAutoAssigning, setIsAutoAssigning] = React.useState(false);

  const availableRooms = React.useMemo(() => {
    return rooms.filter(room => 
      room.status === 'available' || room.room_number === booking.room_number
    );
  }, [rooms, booking.room_number]);

  const handleSendInvoice = async (method: 'email' | 'whatsapp') => {
    // In a real app, this would send the invoice via the selected method
    console.log(`Sending invoice via ${method} to ${method === 'email' ? guest?.email : guest?.phone}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: APIBooking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#2596be] text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPaymentStatusColor = (status: APIBooking['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'partial':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleAssignRoom = async () => {
    if (selectedRoom) {
      try {
        console.log('🎯 Manual room assignment:', {
          bookingId: booking.id,
          guest: `${booking.first_name} ${booking.last_name}`,
          selectedRoom,
          dates: {
            checkIn: booking.check_in_date,
            checkOut: booking.check_out_date
          }
        });

        const updatedBooking = await assignRoom(booking.id, selectedRoom);
        console.log('✅ Room assigned successfully:', {
          bookingId: booking.id,
          roomNumber: selectedRoom,
          updatedBooking
        });

        onUpdate(updatedBooking);
        setIsAssigningRoom(false);
      } catch (error) {
        console.error('❌ Error assigning room:', error);
      }
    }
  };

  const handleUnassignRoom = async () => {
    try {
      const updatedBooking = await unassignRoomFromBooking(booking.id);
      onUpdate(updatedBooking);
      setSelectedRoom('');
    } catch (error) {
      console.error('Error unassigning room:', error);
    }
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const updatedBooking = await autoAssignRoom(booking.id, {
        hotel_id: booking.hotel_id.toString(),
        category_id: booking.room_type_id,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date
      });
      onUpdate(updatedBooking);
    } catch (error) {
      console.error('Error auto-assigning room:', error);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <User className="w-6 h-6 text-[#2596be]" />
            Booking Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Guest Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <User className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Guest Name</div>
                  <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Mail className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{guest?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Phone className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{guest?.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <CreditCard className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Payment Status</div>
                  <div className={`inline-block px-2 py-1 rounded-full text-sm ${getPaymentStatusColor(booking.payment_status)}`}>
                    {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Home className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Room</div>
                  <div className="font-medium">
                    Room {booking.room_number} ({booking.room_type_name})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Calendar className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className={`inline-block px-2 py-1 rounded-full text-sm ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Check-in</div>
                  <div className="font-medium">
                    {formatDate(new Date(booking.check_in_date))}
                    <div className="text-sm text-gray-500">
                      {formatTime(new Date(booking.check_in_date))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Check-out</div>
                  <div className="font-medium">
                    {formatDate(new Date(booking.check_out_date))}
                    <div className="text-sm text-gray-500">
                      {formatTime(new Date(booking.check_out_date))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Room Assignment</h3>
            {isAssigningRoom ? (
              <div className="space-y-4">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select a room</option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.room_number}>
                      Room {room.room_number} ({room.category_name})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAssignRoom}
                    disabled={!selectedRoom}
                    className="flex-1 bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Assign Room
                  </button>
                  <button
                    onClick={() => setIsAssigningRoom(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  {booking.room_number ? (
                    <div>
                      <div className="font-medium">Room {booking.room_number}</div>
                      <div className="text-sm text-gray-500">{booking.room_type_name}</div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No room assigned</div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!booking.room_number && (
                    <button
                      onClick={handleAutoAssign}
                      disabled={isAutoAssigning}
                      className="bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Wand2 className="w-5 h-5" />
                      {isAutoAssigning ? 'Assigning...' : 'Auto Assign'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsAssigningRoom(true)}
                    className="bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90"
                  >
                    {booking.room_number ? 'Change Room' : 'Manual Assign'}
                  </button>
                  {booking.room_number && (
                    <button
                      onClick={handleUnassignRoom}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-red-600 hover:text-red-700"
                    >
                      Unassign
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#2596be]" />
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Amount</div>
                <div className="font-medium">${parseFloat(booking.total_amount).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Paid Amount</div>
                <div className="font-medium">${parseFloat(booking.paid_amount).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Payment Status</div>
                <div className="font-medium capitalize">{booking.payment_status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Source</div>
                <div className="font-medium capitalize">{booking.source}</div>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {showInvoiceModal && (
        <InvoiceModal
          booking={booking}
          guest={guest}
          onClose={() => setShowInvoiceModal(false)}
          onSend={handleSendInvoice}
        />
      )}
    </div>
  );
}