import React from 'react';
import { Settings, Plus, Trash2, Save, X } from 'lucide-react';
import { Room } from '../types';

interface ConfigPanelProps {
  rooms: Room[];
  onUpdateRooms: (rooms: Room[]) => void;
}

export function ConfigPanel({ rooms, onUpdateRooms }: ConfigPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [roomTypes, setRoomTypes] = React.useState<string[]>([
    'Standard',
    'Deluxe',
    'Suite',
    'Penthouse'
  ]);
  const [newRoomType, setNewRoomType] = React.useState('');
  const [bulkRoomAdd, setBulkRoomAdd] = React.useState({
    startNumber: '',
    endNumber: '',
    type: 'Standard',
    pricePerNight: ''
  });

  const handleAddRoomType = () => {
    if (newRoomType && !roomTypes.includes(newRoomType)) {
      setRoomTypes([...roomTypes, newRoomType]);
      setNewRoomType('');
    }
  };

  const handleRemoveRoomType = (type: string) => {
    setRoomTypes(roomTypes.filter(t => t !== type));
  };

  const handleBulkAdd = () => {
    const start = parseInt(bulkRoomAdd.startNumber);
    const end = parseInt(bulkRoomAdd.endNumber);
    const price = parseFloat(bulkRoomAdd.pricePerNight);

    if (start && end && price && start <= end) {
      const newRooms: Room[] = [];
      for (let i = start; i <= end; i++) {
        newRooms.push({
          id: `new-${i}`,
          number: String(i).padStart(3, '0'),
          type: bulkRoomAdd.type,
          capacity: bulkRoomAdd.type === 'Suite' ? 4 : bulkRoomAdd.type === 'Penthouse' ? 6 : 2,
          pricePerNight: price,
          status: 'available',
          amenities: []
        });
      }
      onUpdateRooms([...rooms, ...newRooms]);
      setBulkRoomAdd({
        startNumber: '',
        endNumber: '',
        type: 'Standard',
        pricePerNight: ''
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#2596be] text-white p-3 rounded-full shadow-lg hover:bg-[#2596be]/90 transition-colors"
      >
        <Settings className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Settings className="w-6 h-6 text-[#2596be]" />
                Property Configuration
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Room Types Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Room Types</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRoomType}
                      onChange={(e) => setNewRoomType(e.target.value)}
                      placeholder="Add new room type"
                      className="flex-1 border rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={handleAddRoomType}
                      className="bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {roomTypes.map(type => (
                      <div
                        key={type}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <span>{type}</span>
                        <button
                          onClick={() => handleRemoveRoomType(type)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bulk Add Rooms Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Bulk Add Rooms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Room Number
                    </label>
                    <input
                      type="number"
                      value={bulkRoomAdd.startNumber}
                      onChange={(e) => setBulkRoomAdd({
                        ...bulkRoomAdd,
                        startNumber: e.target.value
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Room Number
                    </label>
                    <input
                      type="number"
                      value={bulkRoomAdd.endNumber}
                      onChange={(e) => setBulkRoomAdd({
                        ...bulkRoomAdd,
                        endNumber: e.target.value
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Type
                    </label>
                    <select
                      value={bulkRoomAdd.type}
                      onChange={(e) => setBulkRoomAdd({
                        ...bulkRoomAdd,
                        type: e.target.value
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {roomTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Night
                    </label>
                    <input
                      type="number"
                      value={bulkRoomAdd.pricePerNight}
                      onChange={(e) => setBulkRoomAdd({
                        ...bulkRoomAdd,
                        pricePerNight: e.target.value
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  onClick={handleBulkAdd}
                  className="mt-4 w-full bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Add Rooms
                </button>
              </div>

              {/* Current Rooms Summary */}
              <div>
                <h3 className="text-lg font-medium mb-4">Current Rooms Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    {roomTypes.map(type => {
                      const count = rooms.filter(room => room.type === type).length;
                      return (
                        <div key={type} className="bg-white p-3 rounded-lg">
                          <div className="text-sm text-gray-600">{type}</div>
                          <div className="text-2xl font-semibold">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}