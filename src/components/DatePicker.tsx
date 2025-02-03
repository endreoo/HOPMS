import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export function DatePicker({ currentDate, onSelect, onClose }: DatePickerProps) {
  const [viewDate, setViewDate] = React.useState(currentDate);
  const [selectedYear, setSelectedYear] = React.useState(currentDate.getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => currentDate.getFullYear() - 5 + i
  );

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setViewDate(new Date(year, viewDate.getMonth()));
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, 1);
    onSelect(newDate);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newYear = selectedYear + (direction === 'prev' ? -1 : 1);
    handleYearChange(newYear);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select Date</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Year Selection */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateYear('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-lg"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => navigateYear('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const isCurrentMonth = 
                index === currentDate.getMonth() && 
                selectedYear === currentDate.getFullYear();

              return (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className={`
                    p-4 rounded-lg text-center transition-colors
                    ${isCurrentMonth 
                      ? 'bg-[#2596be] text-white' 
                      : 'hover:bg-[#2596be]/10 text-gray-700'
                    }
                  `}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}