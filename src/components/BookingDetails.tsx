import React from 'react';
import { X, Mail, Phone, CreditCard, Calendar, Home, User, Clock, Send } from 'lucide-react';
import { Booking, Guest } from '../types';
import { InvoiceModal } from './InvoiceModal';

interface BookingDetailsProps {
  booking: Booking;
  guest: Guest;
  onClose: () => void;
}

export function BookingDetails({ booking, guest, onClose }: BookingDetailsProps) {
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);

  const handleSendInvoice = async (method: 'email' | 'whatsapp') => {
    // In a real app, this would send the invoice via the selected method
    console.log(`Sending invoice via ${method} to ${method === 'email' ? guest.email : guest.phone}`);
    
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

  const getStatusColor = (status: Booking['status']) => {
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

  const getPaymentStatusColor = (status: Booking['paymentStatus']) => {
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
                  <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Mail className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{guest.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Phone className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{guest.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <CreditCard className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Payment Status</div>
                  <div className={`inline-block px-2 py-1 rounded-full text-sm ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
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
                    Room {booking.roomNumber} ({booking.roomType})
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
                    {formatDate(booking.checkIn)}
                    <div className="text-sm text-gray-500">
                      {formatTime(booking.checkIn)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-[#2596be]" />
                <div>
                  <div className="text-sm text-gray-600">Check-out</div>
                  <div className="font-medium">
                    {formatDate(booking.checkOut)}
                    <div className="text-sm text-gray-500">
                      {formatTime(booking.checkOut)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-2xl font-semibold">${booking.totalAmount.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-sm ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                  </div>
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {booking.paymentStatus === 'paid' ? 'New Invoice' : 'Send Invoice'}
                  </button>
                </div>
              </div>
              {booking.invoiceSentAt && (
                <div className="mt-2 text-sm text-gray-600">
                  Invoice sent via {booking.invoiceSentVia} on {booking.invoiceSentAt.toLocaleDateString()}
                </div>
              )}
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