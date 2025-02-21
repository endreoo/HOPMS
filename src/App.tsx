import React from 'react';
import { Dashboard } from './components/Dashboard';
import { HotelRoomType } from './types';
import { getHotelRoomTypes } from './services/api';

function App() {
  const [hotelRoomTypes, setHotelRoomTypes] = React.useState<HotelRoomType[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const types = await getHotelRoomTypes('40642');
        setHotelRoomTypes(types);
      } catch (error) {
        console.error('Error loading room types:', error);
      }
    };
    loadData();
  }, []);

  return (
    <Dashboard roomTypes={hotelRoomTypes} />
  );
}

export default App;
