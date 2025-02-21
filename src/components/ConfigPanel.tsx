import React from 'react';
import { Settings, Save, X, Loader2, Edit, Trash2, Plus } from 'lucide-react';
import { APIRoom, HotelRoomType } from '../types';
import { 
  createHotelRoomType,
  updateHotelRoomType,
  deleteHotelRoomType,
  createRoom,
  deleteRoom,
  getRooms,
  getHotelRoomTypes,
  login
} from '../services/api';
import { AxiosError } from 'axios';

interface ConfigPanelProps {
  rooms: APIRoom[];
  onUpdateRooms: (rooms: APIRoom[]) => void;
}

interface RoomInput {
  room_number: string;
  floor: string;
}

interface CreateRoomInput {
  hotel_id: number;
  hotel_room_type_id: number;
  room_number: string;
  floor: string;
  status: 'available' | 'occupied' | 'maintenance';
}

export function ConfigPanel({ 
  rooms,
  onUpdateRooms
}: ConfigPanelProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [roomInputs, setRoomInputs] = React.useState<RoomInput[]>([]);
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);
  const [hotelRoomTypes, setHotelRoomTypes] = React.useState<HotelRoomType[]>([]);
  const [editingType, setEditingType] = React.useState<HotelRoomType | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [debouncedRoomCount, setDebouncedRoomCount] = React.useState('');
  const [collapsedTypes, setCollapsedTypes] = React.useState<Record<number, boolean>>({});
  
  // New/Edit room type form state
  const [roomTypeForm, setRoomTypeForm] = React.useState<{
    name: string;
    description: string;
    base_price: string;
    number_of_rooms: string;
    starting_room: string;
    max_occupancy: number;
    max_adults: number;
    max_children: number;
    amenities: string[];
  }>({
    name: '',
    description: '',
    base_price: '',
    number_of_rooms: '',
    starting_room: '',
    max_occupancy: 2,
    max_adults: 2,
    max_children: 1,
    amenities: ['wifi', 'tv']
  });

  // Debounce the number_of_rooms value
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRoomCount(roomTypeForm.number_of_rooms);
    }, 500); // Wait 500ms after last change

    return () => clearTimeout(timer);
  }, [roomTypeForm.number_of_rooms]);

  // Update room inputs when debouncedRoomCount changes
  React.useEffect(() => {
    const numRooms = parseInt(debouncedRoomCount) || 0;
    const startingNum = parseInt(roomTypeForm.starting_room) || 1;
    
    setRoomInputs(prev => {
      const newInputs = [...prev];
      // Add more inputs if needed
      while (newInputs.length < numRooms) {
        const index = newInputs.length;
        const roomNum = startingNum + index;
        const prefix = roomTypeForm.name.substring(0, 2).toUpperCase().replace(/\s+/g, '');
        newInputs.push({
          room_number: `${prefix}${roomNum.toString().padStart(3, '0')}`,
          floor: Math.ceil(roomNum / 10).toString()
        });
      }
      // Remove excess inputs if needed
      while (newInputs.length > numRooms) {
        newInputs.pop();
      }
      return newInputs;
    });
  }, [debouncedRoomCount, roomTypeForm.name, roomTypeForm.starting_room]);

  // Load room types and rooms on initial load
  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading room types and rooms...');
        // Ensure we're logged in first
        await login('endre@hotelonline.co', 'S@ccess900');
        console.log('Login successful, loading room data...');

        // Load room types first
        const types = await getHotelRoomTypes('40642');
        console.log('Loaded room types:', types);
        setHotelRoomTypes(types);

        // Then load rooms
        const allRooms = await getRooms({ hotel_id: '40642' });
        console.log('Loaded rooms:', allRooms);
        onUpdateRooms(allRooms);
      } catch (error) {
        console.error('Error loading data:', error);
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 500) {
          console.log('Server error, retrying login...');
          try {
            await login('endre@hotelonline.co', 'S@ccess900');
            const types = await getHotelRoomTypes('40642');
            setHotelRoomTypes(types);
            const allRooms = await getRooms({ hotel_id: '40642' });
            onUpdateRooms(allRooms);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }
      }
    };

    loadData();
  }, [onUpdateRooms]);

  // Refresh data after creating/updating room types
  const refreshData = async () => {
    try {
      console.log('Refreshing room types and rooms...');
      // Ensure we're logged in
      await login('endre@hotelonline.co', 'S@ccess900');
      
      const types = await getHotelRoomTypes('40642');
      console.log('Refreshed room types:', types);
      setHotelRoomTypes(types);

      const updatedRooms = await getRooms({ hotel_id: '40642' });
      console.log('Refreshed rooms:', updatedRooms);
      onUpdateRooms(updatedRooms);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleCreateRoomType = async () => {
    setIsLoading(true);
    try {
      // Create or update the hotel room type
      let roomType: HotelRoomType;
      if (editingType) {
        roomType = await updateHotelRoomType(editingType.id, {
          name: roomTypeForm.name,
          description: roomTypeForm.description,
          base_price: parseFloat(roomTypeForm.base_price),
          max_occupancy: roomTypeForm.max_occupancy,
          max_adults: roomTypeForm.max_adults,
          max_children: roomTypeForm.max_children,
          amenities: roomTypeForm.amenities
        });

        // Only create rooms if number_of_rooms is provided
        if (roomTypeForm.number_of_rooms && roomInputs.length > 0) {
          console.log('Creating rooms for existing type:', {
            typeId: editingType.id,
            rooms: roomInputs
          });
          const createRoomPromises = roomInputs.map(roomInput => {
            const roomData: CreateRoomInput = {
              hotel_id: 40642,
              hotel_room_type_id: editingType.id,
              room_number: roomInput.room_number.replace(/\s+/g, ''),
              floor: roomInput.floor,
              status: "available"
            };
            console.log('Creating room with data:', roomData);
            return createRoom(roomData);
          });
          
          await Promise.all(createRoomPromises);
        }
      } else {
        roomType = await createHotelRoomType({
          hotel_id: 40642,
          name: roomTypeForm.name,
          description: roomTypeForm.description,
          base_price: parseFloat(roomTypeForm.base_price),
          max_occupancy: roomTypeForm.max_occupancy,
          max_adults: roomTypeForm.max_adults,
          max_children: roomTypeForm.max_children,
          amenities: roomTypeForm.amenities
        });

        // Create rooms for new room type
        if (roomInputs.length > 0) {
          console.log('Creating rooms for new type:', {
            typeId: roomType.id,
            rooms: roomInputs
          });
          const createRoomPromises = roomInputs.map(roomInput => {
            const roomData: CreateRoomInput = {
              hotel_id: 40642,
              hotel_room_type_id: roomType.id,
              room_number: roomInput.room_number.replace(/\s+/g, ''),
              floor: roomInput.floor,
              status: "available"
            };
            console.log('Creating room with data:', roomData);
            return createRoom(roomData);
          });
          
          await Promise.all(createRoomPromises);
        }
      }

      // Refresh data
      await refreshData();
      
      // Reset form and close modal
      setRoomInputs([]);
      setRoomTypeForm({
        name: '',
        description: '',
        base_price: '',
        number_of_rooms: '',
        starting_room: '',
        max_occupancy: 2,
        max_adults: 2,
        max_children: 1,
        amenities: ['wifi', 'tv']
      });
      setIsCreating(false);
      setEditingType(null);
    } catch (error: unknown) {
      console.error('Error creating/updating hotel room type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoomType = async (typeId: number) => {
    if (!window.confirm('Are you sure you want to delete this room type and all its rooms?')) return;
    
    setIsLoading(true);
    try {
      // Delete all rooms of this type
      const typeRooms = rooms.filter(room => room.hotel_room_type_id === typeId);
      await Promise.all(typeRooms.map(room => deleteRoom(room.id)));
      
      // Delete the room type
      await deleteHotelRoomType(typeId);

      // Refresh data
      const [types, updatedRooms] = await Promise.all([
        getHotelRoomTypes('40642'),
        getRooms({ hotel_id: '40642' })
      ]);
      setHotelRoomTypes(types);
      onUpdateRooms(updatedRooms);
    } catch (error) {
      console.error('Error deleting room type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoomType = (type: HotelRoomType) => {
    setEditingType(type);
    setRoomTypeForm({
      name: type.name,
      description: type.description,
      base_price: type.base_price.toString(),
      number_of_rooms: '',
      starting_room: '',
      max_occupancy: type.max_occupancy,
      max_adults: type.max_adults,
      max_children: type.max_children,
      amenities: type.amenities
    });
    setIsCreating(true);
  };

  const handleAddRooms = (type: HotelRoomType) => {
    setEditingType(type);
    setRoomTypeForm({
      ...roomTypeForm,
      name: type.name,
      number_of_rooms: ''
    });
    setIsCreating(true);
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    setIsLoading(true);
    try {
      await deleteRoom(roomId);
      await refreshData();
    } catch (error) {
      console.error('Error deleting room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRooms = async (rooms: { room_number: string; floor: string }[], typeId: number) => {
    console.log('Creating rooms for existing type:', { rooms, typeId });
    
    for (const room of rooms) {
      const roomData: CreateRoomInput = {
        hotel_id: 40642,
        hotel_room_type_id: typeId,
        room_number: room.room_number,
        floor: room.floor,
        status: 'available'
      };
      // ... existing code ...
    }
  };

  const toggleRoomType = (typeId: number) => {
    setCollapsedTypes(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  return (
    <div>
      <button 
        onClick={() => setIsConfigOpen(!isConfigOpen)}
        className="fixed bottom-4 right-4 p-3 bg-[#2596be] text-white rounded-full shadow-lg hover:bg-[#2596be]/90"
      >
        <Settings className="w-6 h-6" />
      </button>

      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Settings className="w-6 h-6 text-[#2596be]" />
                Property Configuration
              </h2>
              <button onClick={() => setIsConfigOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Room Types Grid */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Room Types</h3>
                  <button
                    onClick={() => {
                      setEditingType(null);
                      setRoomTypeForm({
                        name: '',
                        description: '',
                        base_price: '',
                        number_of_rooms: '',
                        starting_room: '',
                        max_occupancy: 2,
                        max_adults: 2,
                        max_children: 1,
                        amenities: ['wifi', 'tv']
                      });
                      setIsCreating(true);
                    }}
                    className="px-4 py-2 bg-[#2596be] text-white rounded-lg hover:bg-[#2596be]/90 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Type
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotelRoomTypes.map(type => (
                    <div key={type.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 cursor-pointer" onClick={() => toggleRoomType(type.id)}>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-lg">{type.name}</h4>
                              <div className={`transform transition-transform ${collapsedTypes[type.id] ? 'rotate-180' : ''}`}>
                                ▼
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-1">{type.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditRoomType(type)}
                              className="p-1.5 text-gray-500 hover:text-[#2596be] rounded-md hover:bg-[#2596be]/10"
                              title="Edit Type"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoomType(type.id)}
                              className="p-1.5 text-gray-500 hover:text-red-500 rounded-md hover:bg-red-50"
                              title="Delete Type"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500">Base Price</div>
                            <div className="font-medium">${type.base_price}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500">Occupancy</div>
                            <div className="font-medium">{type.max_occupancy} guests</div>
                          </div>
                        </div>

                        {!collapsedTypes[type.id] && (
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-sm font-medium">Rooms ({rooms.filter(room => room.hotel_room_type_id === type.id).length})</div>
                              <button
                                onClick={() => handleAddRooms(type)}
                                className="text-[#2596be] hover:text-[#2596be]/80 text-sm font-medium flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" />
                                Add Rooms
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {rooms
                                .filter(room => room.hotel_room_type_id === type.id)
                                .map(room => (
                                  <div key={room.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <div>
                                      <div className="font-medium">{room.room_number}</div>
                                      <div className="text-xs text-gray-500">Floor {room.floor}</div>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleDeleteRoom(room.id)}
                                        className="p-1 text-gray-500 hover:text-red-500 rounded hover:bg-red-50"
                                        title="Delete Room"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create/Edit Form */}
              {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        {editingType ? 
                          (roomTypeForm.number_of_rooms ? 'Add Rooms to ' + editingType.name : 'Edit ' + editingType.name) : 
                          'Create New Room Type'
                        }
                      </h3>
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setEditingType(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Form fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={roomTypeForm.name}
                          onChange={(e) => setRoomTypeForm(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                          placeholder="Room Type Name"
                          className="border rounded-lg px-3 py-2"
                        />
                        <input
                          type="text"
                          value={roomTypeForm.description}
                          onChange={(e) => setRoomTypeForm(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          placeholder="Description"
                          className="border rounded-lg px-3 py-2"
                        />
                        <input
                          type="number"
                          value={roomTypeForm.base_price}
                          onChange={(e) => setRoomTypeForm(prev => ({
                            ...prev,
                            base_price: e.target.value
                          }))}
                          placeholder="Base Price"
                          className="border rounded-lg px-3 py-2"
                        />
                        {/* Allow adding rooms for both new and existing types */}
                        <input
                          type="number"
                          value={roomTypeForm.number_of_rooms}
                          onChange={(e) => setRoomTypeForm(prev => ({
                            ...prev,
                            number_of_rooms: e.target.value
                          }))}
                          placeholder="Number of Rooms"
                          className="border rounded-lg px-3 py-2"
                        />
                        <input
                          type="number"
                          value={roomTypeForm.starting_room}
                          onChange={(e) => setRoomTypeForm(prev => ({
                            ...prev,
                            starting_room: e.target.value
                          }))}
                          placeholder="Starting Room Number"
                          className="border rounded-lg px-3 py-2"
                        />
                        <div className="grid grid-cols-3 gap-2 col-span-2">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Max Occupancy</label>
                            <input
                              type="number"
                              value={roomTypeForm.max_occupancy}
                              onChange={(e) => setRoomTypeForm(prev => ({
                                ...prev,
                                max_occupancy: parseInt(e.target.value)
                              }))}
                              className="w-full border rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Max Adults</label>
                            <input
                              type="number"
                              value={roomTypeForm.max_adults}
                              onChange={(e) => setRoomTypeForm(prev => ({
                                ...prev,
                                max_adults: parseInt(e.target.value)
                              }))}
                              className="w-full border rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Max Children</label>
                            <input
                              type="number"
                              value={roomTypeForm.max_children}
                              onChange={(e) => setRoomTypeForm(prev => ({
                                ...prev,
                                max_children: parseInt(e.target.value)
                              }))}
                              className="w-full border rounded-lg px-3 py-2"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Room Numbers Input - only show when adding rooms */}
                      {roomTypeForm.number_of_rooms && roomInputs.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Room Numbers</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {roomInputs.map((room, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={room.room_number}
                                  onChange={(e) => {
                                    const newInputs = [...roomInputs];
                                    newInputs[index].room_number = e.target.value;
                                    setRoomInputs(newInputs);
                                  }}
                                  placeholder="Room Number"
                                  className="border rounded-lg px-3 py-2 flex-1"
                                />
                                <input
                                  type="text"
                                  value={room.floor}
                                  onChange={(e) => {
                                    const newInputs = [...roomInputs];
                                    newInputs[index].floor = e.target.value;
                                    setRoomInputs(newInputs);
                                  }}
                                  placeholder="Floor"
                                  className="border rounded-lg px-3 py-2 w-24"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsCreating(false);
                            setEditingType(null);
                          }}
                          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateRoomType}
                          disabled={isLoading || !roomTypeForm.name || !roomTypeForm.base_price || (!editingType && (!roomTypeForm.number_of_rooms || roomInputs.some(room => !room.room_number || !room.floor)))}
                          className="bg-[#2596be] text-white px-4 py-2 rounded-lg hover:bg-[#2596be]/90 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                          {editingType ? 
                            (roomTypeForm.number_of_rooms ? 'Add Rooms' : 'Update Room Type') : 
                            'Create Room Type'
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}