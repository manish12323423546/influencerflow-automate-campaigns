// Clear VAPI localStorage data script
// Run this in the browser console if you're getting "Assistant Does Not Exist" errors

console.log('🧹 Clearing VAPI localStorage data...');

// Clear all VAPI-related localStorage keys
const keysToRemove = [
  'meeting_ai_agents',
  'meetings', 
  'selected_ai_agent'
];

let cleared = 0;
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    cleared++;
    console.log(`✅ Cleared: ${key}`);
  } else {
    console.log(`⚪ Not found: ${key}`);
  }
});

console.log(`🎉 Cleanup complete! Cleared ${cleared} items.`);
console.log('💡 Now refresh the page and set up proper VAPI credentials in your .env file');
console.log('📖 See VAPI_SETUP_GUIDE.md for detailed instructions');

// Also clear any session storage that might interfere
sessionStorage.clear();
console.log('🧹 Session storage cleared as well'); 