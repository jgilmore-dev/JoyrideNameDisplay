# Performance Optimizations

This document outlines the major performance optimizations implemented in the Member Name Display application.

## Critical Memory Leak Fixes

### 1. Event Listener Cleanup in Banner Component
**File**: `src/banner.jsx`
**Issue**: Event listeners were registered but never cleaned up, causing memory leaks
**Fix**: 
- Added proper cleanup function in useEffect
- Implemented `removeAllListeners` method in preload.js
- Added cleanup for preload cache and queue

```javascript
// Before: No cleanup
useEffect(() => {
  window.electronAPI.on('display-name', (nameData) => setDisplayName(nameData));
  // ... more listeners
}, []);

// After: Proper cleanup
useEffect(() => {
  // Register listeners
  window.electronAPI.on('display-name', displayNameHandler);
  // ... more listeners
  
  return () => {
    // Remove all event listeners to prevent memory leaks
    window.electronAPI.removeAllListeners('display-name');
    // ... cleanup all listeners
  };
}, []);
```

### 2. Window Management Memory Leaks
**File**: `src/bannerManager.js`
**Issue**: Banner windows weren't properly cleaned up when destroyed
**Fix**: Added window event listeners for proper cleanup

```javascript
// Added window cleanup listeners
bannerWindow.on('closed', () => {
  this.banners.delete(bannerId);
});

bannerWindow.on('unresponsive', () => {
  console.warn(`Banner ${bannerId} window became unresponsive`);
});
```

## Performance Optimizations

### 3. Debounced Search with Memoization
**File**: `src/controlPanel.jsx`
**Issue**: Search filtering ran on every keystroke, causing performance issues
**Fix**: 
- Implemented debounced search (300ms delay)
- Added memoization for filtered results
- Created reusable debounce utility

```javascript
// Debounced search with memoization
const debouncedSearchTerm = useDebounce(searchTerm, 300);

const { membersToDisplay, recentlyDisplayedMembers } = useMemo(() => {
  const searchLower = debouncedSearchTerm.toLowerCase();
  // ... filtering logic
}, [members, debouncedSearchTerm]);
```

### 4. Font Size Calculation Optimization
**File**: `src/useFitText.js`
**Issue**: Linear search for optimal font size was inefficient
**Fix**:
- Implemented binary search algorithm (O(log n) vs O(n))
- Added caching for font size calculations
- Added cache size management to prevent memory bloat

```javascript
// Binary search for optimal font size
let minSize = 10;
let maxSize = 175;
while (minSize <= maxSize) {
  const midSize = Math.floor((minSize + maxSize) / 2);
  // ... test and adjust
}
```

### 5. Smart Image Preloading
**File**: `src/banner.jsx`
**Issue**: Simple preloading strategy wasn't optimal for performance
**Fix**:
- Implemented priority queue for preloading
- Limited concurrent preloads to 3
- Added smart preloading strategy based on slideshow size
- Added proper error handling and cleanup

```javascript
// Priority-based preloading
const preloadImage = (src, priority = 0) => {
  preloadQueueRef.current.push({ src, priority });
  preloadQueueRef.current.sort((a, b) => b.priority - a.priority);
  // ... process queue with concurrency limit
};
```

## Utility Functions Added

### 6. Performance Utilities
**File**: `src/utils.js`
**Added**:
- `debounce()` - Debounce function calls
- `throttle()` - Throttle function calls

```javascript
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

## Performance Impact

### Before Optimizations:
- **Memory Leaks**: Event listeners accumulated over time
- **Search Performance**: O(n) filtering on every keystroke
- **Font Calculation**: O(n) linear search for each text change
- **Image Preloading**: Simple sequential loading

### After Optimizations:
- **Memory Management**: Proper cleanup prevents leaks
- **Search Performance**: O(n) filtering with 300ms debounce
- **Font Calculation**: O(log n) binary search with caching
- **Image Preloading**: Priority-based with concurrency control

## Configuration

### Debounce Settings:
- Search debounce: 300ms
- Font cache size: 100 entries (auto-cleanup at 100)
- Preload concurrency: 3 images
- Preload priority levels: 1-10

### Cache Management:
- Font size cache: LRU-style cleanup
- Image preload cache: Automatic cleanup on slideshow update
- Event listener cleanup: Automatic on component unmount

## Additional Benefits

1. **Reduced CPU Usage**: Memoization prevents unnecessary recalculations
2. **Better Memory Management**: Proper cleanup prevents memory leaks
3. **Improved User Experience**: Debounced search feels more responsive
4. **Smoother Animations**: Optimized font calculations reduce layout thrashing
5. **Better Resource Usage**: Smart preloading reduces bandwidth waste

## Monitoring

To monitor the effectiveness of these optimizations:

1. **Memory Usage**: Check for memory leaks in DevTools
2. **Search Performance**: Monitor search input responsiveness
3. **Font Rendering**: Observe smoothness of text resizing
4. **Image Loading**: Check for smooth slideshow transitions

## Future Optimizations

Potential areas for further optimization:

1. **Virtual Scrolling**: For large member lists (>1000 items)
2. **Image Compression**: Automatic image optimization
3. **Lazy Loading**: Load components only when needed
4. **Service Worker**: Cache frequently used data
5. **Web Workers**: Move heavy computations off main thread 