// Force clear cache and reload script
(function() {
  console.log('🔄 Force reloading to clear CopilotKit cache...');
  
  // Clear all possible caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
        console.log('🗑️ Cleared cache:', name);
      }
    });
  }
  
  // Clear localStorage and sessionStorage
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🗑️ Cleared local storage');
  } catch (e) {
    console.log('⚠️ Could not clear storage:', e);
  }
  
  // Force reload with cache clear
  window.location.reload(true);
})();
