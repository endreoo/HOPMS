import React from 'react';
import { APIBooking } from '../types';
import { Calendar, DollarSign, User, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { getBookings, updateBooking } from '../services/api';

interface BookingOverviewProps {
  bookings: APIBooking[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export function BookingOverview({ bookings: initialBookings }: BookingOverviewProps) {
  const [bookings, setBookings] = React.useState<APIBooking[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = React.useState<APIBooking | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [sortField, setSortField] = React.useState<string>('check_in_date');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalStats, setTotalStats] = React.useState({
    totalBookings: 0,
    totalRevenue: 0,
    averageStay: 0,
    averageDailyRate: 0,
    averageBookingValue: 0
  });

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getBookings({
        page: currentPage,
        limit: 50,
        status: status,
        search: searchTerm,
        sort_by: sortField,
        sort_order: sortDirection
      });
      
      if ('data' in response) {
        setBookings(response.data);
        setTotalPages(Math.ceil(response.pagination?.total || 0 / 50));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, status, searchTerm, sortField, sortDirection]);

  const fetchTotalStats = React.useCallback(async () => {
    try {
      const response = await getBookings({
        limit: 3500, // Set higher to get all bookings
        status: status,
        search: searchTerm,
        sort_by: sortField,
        sort_order: sortDirection
      });
      
      if ('data' in response) {
        const allBookings = response.data;
        const totalRevenue = allBookings.reduce((sum: number, b: APIBooking) => sum + parseFloat(b.total_amount || '0'), 0);
        const totalDays = allBookings.reduce((sum: number, b: APIBooking) => {
          const days = (new Date(b.check_out_date).getTime() - new Date(b.check_in_date).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);

        setTotalStats({
          totalBookings: allBookings.length,
          totalRevenue: totalRevenue,
          averageStay: Math.round(totalDays / allBookings.length),
          averageDailyRate: totalRevenue / totalDays,
          averageBookingValue: totalRevenue / allBookings.length
        });
      }
    } catch (error) {
      console.error('Error fetching total stats:', error);
    }
  }, [status, searchTerm, sortField, sortDirection]);

  React.useEffect(() => {
    fetchBookings();
    fetchTotalStats();
  }, [fetchBookings, fetchTotalStats]);

  const handleSort = (field: string) => {
    console.log('Sorting clicked:', { field, currentSortField: sortField, currentDirection: sortDirection });
    if (field === sortField) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      console.log('Changing direction to:', newDirection);
      setSortDirection(newDirection);
    } else {
      console.log('Changing field to:', field);
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const getStatusBadgeColor = (status: string) => {
    if (status.includes('confirmed')) return 'bg-green-100 text-green-800';
    if (status.includes('cancelled')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const SortHeader = ({ field, children }: { field: string, children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col opacity-0 group-hover:opacity-50">
          <ChevronUp className={`w-3 h-3 -mb-1 ${sortField === field && sortDirection === 'asc' ? 'opacity-100 text-[#2596be]' : ''}`} />
          <ChevronDown className={`w-3 h-3 ${sortField === field && sortDirection === 'desc' ? 'opacity-100 text-[#2596be]' : ''}`} />
        </div>
      </div>
    </th>
  );

  const handleEditBooking = async (updatedBooking: APIBooking) => {
    try {
      await updateBooking(updatedBooking.id, updatedBooking);
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      setIsModalOpen(false);
      fetchTotalStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Booking Overview</h2>
          <div className="flex gap-4">
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2596be]"
              onChange={(e) => {
                const newStatus = e.target.value === 'all' ? undefined : e.target.value;
                setStatus(newStatus);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Search bookings..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2596be]"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
            <Calendar className="w-4 h-4 text-[#2596be]" />
            <div>
              <div className="text-gray-500">Total Bookings</div>
              <div className="text-lg font-semibold text-gray-900">{totalStats.totalBookings.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
            <DollarSign className="w-4 h-4 text-[#2596be]" />
            <div>
              <div className="text-gray-500">Total Revenue</div>
              <div className="text-lg font-semibold text-gray-900">${totalStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
            <Clock className="w-4 h-4 text-[#2596be]" />
            <div>
              <div className="text-gray-500">Average Stay</div>
              <div className="text-lg font-semibold text-gray-900">{totalStats.averageStay} days</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
            <DollarSign className="w-4 h-4 text-[#2596be]" />
            <div>
              <div className="text-gray-500">Average Daily Rate</div>
              <div className="text-lg font-semibold text-gray-900">${totalStats.averageDailyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
            <DollarSign className="w-4 h-4 text-[#2596be]" />
            <div>
              <div className="text-gray-500">Average Booking</div>
              <div className="text-lg font-semibold text-gray-900">${totalStats.averageBookingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader field="booking_number">
                    <span className="w-12">Booking</span>
                  </SortHeader>
                  <SortHeader field="guest_name">
                    <span className="w-16">Guest</span>
                  </SortHeader>
                  <SortHeader field="check_in_date">
                    <span className="w-16">Check In</span>
                  </SortHeader>
                  <SortHeader field="check_out_date">
                    <span className="w-16">Check Out</span>
                  </SortHeader>
                  <SortHeader field="room_type_name">
                    <span className="w-20">Room</span>
                  </SortHeader>
                  <SortHeader field="status">
                    <span className="w-16">Status</span>
                  </SortHeader>
                  <SortHeader field="total_amount">
                    <span className="w-16">Amount</span>
                  </SortHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map(booking => (
                  <tr 
                    key={booking.id} 
                    className="hover:bg-gray-50 cursor-pointer" 
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 truncate">
                      {booking.booking_number}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 truncate">
                      {booking.first_name} {booking.last_name}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.check_in_date)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.check_out_date)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 truncate">
                      {booking.room_type_name}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                      ${parseFloat(booking.total_amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center p-4 border-t">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
            {isModalOpen && selectedBooking && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Edit Booking</h3>
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Booking Number</label>
                        <input
                          type="text"
                          value={selectedBooking.booking_number}
                          disabled
                          className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={selectedBooking.status}
                          onChange={(e) => setSelectedBooking({...selectedBooking, status: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2596be]"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={selectedBooking.first_name || ''}
                            onChange={(e) => setSelectedBooking({...selectedBooking, first_name: e.target.value})}
                            placeholder="First Name"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2596be]"
                          />
                          <input
                            type="text"
                            value={selectedBooking.last_name || ''}
                            onChange={(e) => setSelectedBooking({...selectedBooking, last_name: e.target.value})}
                            placeholder="Last Name"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2596be]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Room Type</label>
                        <input
                          type="text"
                          value={selectedBooking.room_type_name || ''}
                          disabled
                          className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Check In</label>
                        <input
                          type="date"
                          value={selectedBooking.check_in_date.split('T')[0]}
                          onChange={(e) => setSelectedBooking({...selectedBooking, check_in_date: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2596be]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Check Out</label>
                        <input
                          type="date"
                          value={selectedBooking.check_out_date.split('T')[0]}
                          onChange={(e) => setSelectedBooking({...selectedBooking, check_out_date: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2596be]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                        <input
                          type="number"
                          value={selectedBooking.total_amount}
                          onChange={(e) => setSelectedBooking({...selectedBooking, total_amount: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2596be]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditBooking(selectedBooking)}
                      className="px-4 py-2 bg-[#2596be] text-white rounded-md hover:bg-[#2596be]/90"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 