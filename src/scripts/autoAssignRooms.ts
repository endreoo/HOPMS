import { bulkAssignRooms } from '../services/api';

async function main() {
  try {
    console.log('Starting auto room assignment process...');
    
    const result = await bulkAssignRooms();
    
    console.log('\nAssignment Results:');
    console.log('------------------');
    console.log(`Total unassigned bookings: ${result.total}`);
    console.log(`Successfully assigned: ${result.assigned}`);
    console.log(`Errors encountered: ${result.errors}`);
    
    if (result.results.length > 0) {
      console.log('\nDetailed Results:');
      result.results.forEach(r => {
        if (r.success) {
          console.log(`✓ Booking ${r.booking_id} assigned to room ${r.room_number}`);
        } else {
          console.log(`✗ Booking ${r.booking_id} failed: ${r.error}`);
        }
      });
    }
    
  } catch (error: any) {
    console.error('Script failed:', error?.message || error);
    process.exit(1);
  }
}

// Run the script
main(); 