import React from 'react';
import { X, Mail, Phone, CreditCard, Send, Download } from 'lucide-react';
import { Booking, Guest } from '../types';

interface InvoiceModalProps {
  booking: Booking;
  guest: Guest;
  onClose: () => void;
  onSend: (method: 'email' | 'whatsapp') => void;
}

export function InvoiceModal({ booking, guest, onClose, onSend }: InvoiceModalProps) {
  const [sending, setSending] = React.useState(false);
  const [selectedMethod, setSelectedMethod] = React.useState<'email' | 'whatsapp'>('email');
  const [extras, setExtras] = React.useState(booking.extras || []);
  const [newExtra, setNewExtra] = React.useState({
    description: '',
    amount: '',
    quantity: '1'
  });

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend(selectedMethod);
      onClose();
    } catch (error) {
      console.error('Error sending invoice:', error);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddExtra = () => {
    if (newExtra.description && newExtra.amount) {
      setExtras([
        ...extras,
        {
          id: Math.random().toString(36).substr(2, 9),
          description: newExtra.description,
          amount: parseFloat(newExtra.amount),
          quantity: parseInt(newExtra.quantity)
        }
      ]);
      setNewExtra({ description: '', amount: '', quantity: '1' });
    }
  };

  const handleRemoveExtra = (id: string) => {
    setExtras(extras.filter(extra => extra.id !== id));
  };

  const calculateTotal = () => {
    const roomTotal = booking.totalAmount;
    const extrasTotal = extras.reduce((sum, extra) => 
      sum + (extra.amount * extra.quantity), 0
    );
    return roomTotal + extrasTotal;
  };

  const invoiceNumber = booking.invoiceNumber || `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#2596be]" />
            Send Invoice
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invoice Preview */}
          <div className="border rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-[#2596be]">Invoice</h3>
                <p className="text-gray-600">#{invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Issue Date</p>
                <p className="text-gray-600">{formatDate(new Date())}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-medium mb-2">From</p>
                <p className="text-gray-800">Your Hotel Name</p>
                <p className="text-gray-600">123 Hotel Street</p>
                <p className="text-gray-600">City, Country</p>
              </div>
              <div>
                <p className="font-medium mb-2">Bill To</p>
                <p className="text-gray-800">{guest.firstName} {guest.lastName}</p>
                <p className="text-gray-600">{guest.email}</p>
                <p className="text-gray-600">{guest.phone}</p>
                {guest.address && <p className="text-gray-600">{guest.address}</p>}
              </div>
            </div>

            <div className="border-t border-b py-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Nights</th>
                    <th className="pb-2 text-right">Rate</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">
                      <div className="font-medium">Room {booking.roomNumber}</div>
                      <div className="text-sm text-gray-600">{booking.roomType}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                      </div>
                    </td>
                    <td className="py-2">
                      {Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24))}
                    </td>
                    <td className="py-2 text-right">${(booking.totalAmount / Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}</td>
                    <td className="py-2 text-right">${booking.totalAmount.toFixed(2)}</td>
                  </tr>
                  {extras.map(extra => (
                    <tr key={extra.id}>
                      <td className="py-2">
                        <div className="font-medium">{extra.description}</div>
                      </td>
                      <td className="py-2">{extra.quantity}</td>
                      <td className="py-2 text-right">${extra.amount.toFixed(2)}</td>
                      <td className="py-2 text-right">${(extra.amount * extra.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={3} className="pt-4 text-right font-medium">Total</td>
                    <td className="pt-4 text-right font-bold">${calculateTotal().toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right text-sm text-gray-600">Payment Status</td>
                    <td className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Add Extras */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add Extra Charges</h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Description"
                value={newExtra.description}
                onChange={(e) => setNewExtra({ ...newExtra, description: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={newExtra.quantity}
                onChange={(e) => setNewExtra({ ...newExtra, quantity: e.target.value })}
                className="w-24 border rounded-lg px-3 py-2"
                min="1"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newExtra.amount}
                onChange={(e) => setNewExtra({ ...newExtra, amount: e.target.value })}
                className="w-32 border rounded-lg px-3 py-2"
                min="0"
                step="0.01"
              />
              <button
                onClick={handleAddExtra}
                className="px-4 py-2 bg-[#2596be] text-white rounded-lg hover:bg-[#2596be]/90"
              >
                Add
              </button>
            </div>
            {extras.length > 0 && (
              <div className="space-y-2">
                {extras.map(extra => (
                  <div key={extra.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <div className="font-medium">{extra.description}</div>
                      <div className="text-sm text-gray-600">
                        {extra.quantity} x ${extra.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-medium">${(extra.quantity * extra.amount).toFixed(2)}</div>
                      <button
                        onClick={() => handleRemoveExtra(extra.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Send Invoice</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedMethod('email')}
                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                  selectedMethod === 'email'
                    ? 'border-[#2596be] bg-[#2596be]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Mail className={`w-5 h-5 ${
                  selectedMethod === 'email' ? 'text-[#2596be]' : 'text-gray-500'
                }`} />
                <div className="text-left">
                  <div className="font-medium">Send via Email</div>
                  <div className="text-sm text-gray-600">{guest.email}</div>
                </div>
              </button>
              <button
                onClick={() => setSelectedMethod('whatsapp')}
                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                  selectedMethod === 'whatsapp'
                    ? 'border-[#2596be] bg-[#2596be]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Phone className={`w-5 h-5 ${
                  selectedMethod === 'whatsapp' ? 'text-[#2596be]' : 'text-gray-500'
                }`} />
                <div className="text-left">
                  <div className="font-medium">Send via WhatsApp</div>
                  <div className="text-sm text-gray-600">{guest.phone}</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={() => {/* Handle download */}}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="bg-[#2596be] text-white px-6 py-2 rounded-lg hover:bg-[#2596be]/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {sending ? 'Sending...' : `Send via ${selectedMethod === 'email' ? 'Email' : 'WhatsApp'}`}
          </button>
        </div>
      </div>
    </div>
  );
}