# Performance Optimizations

This document describes the performance optimizations implemented in the Excalidraw Organizer application.

## Backend Optimizations

### 1. Pagination
- **Drawings API**: Added pagination support with `limit` and `offset` parameters
  - `/api/drawings/recent` - Paginated recent drawings (max 100 per page)
  - `/api/drawings/project/:projectId` - Paginated project drawings (max 100 per page)
- **Projects API**: Added pagination support
  - `/api/projects` - Paginated projects list (max 200 per page)
- All paginated endpoints return `totalCount` and `hasMore` fields

### 2. Database Query Optimization
- **Composite Indexes**: Added indexes for common query patterns
  - `idx_drawings_user_last_accessed` - For recent drawings queries
  - `idx_drawings_project_updated` - For project drawings queries
  - `idx_projects_user_updated` - For projects list queries
- **Partial Indexes**: Optimized indexes for specific conditions
  - `idx_drawings_public_active` - For public share lookups
- **Count Optimization**: Separate indexes for count queries

### 3. Data Compression
- Created compression utilities (`backend/src/utils/compression.ts`)
- Supports gzip compression for large JSON data
- Automatic compression for data > 1KB

## Frontend Optimizations

### 1. Thumbnail Caching
- **localStorage Cache**: Implemented LRU cache for thumbnails
  - Max cache size: 5MB
  - Max cache items: 100 thumbnails
  - Automatic eviction of old entries
- **Cache Manager**: `excalidraw-organizer/src/utils/cache.utils.ts`
  - Tracks cache size and item count
  - Provides cache statistics

### 2. Thumbnail Format Optimization
- **WebP Support**: Thumbnails use WebP format when supported
  - 80% quality for optimal size/quality balance
  - Automatic fallback to PNG for unsupported browsers
- **Optimized Dimensions**: 300x200px thumbnails

### 3. Lazy Loading
- **Excalidraw Component**: Lazy loaded using React.lazy()
  - Reduces initial bundle size
  - Improves first page load time
- **Suspense Fallback**: Loading spinner during component load

### 4. Debouncing
- **Auto-save**: Debounced auto-save with 2-second delay
  - Reduces server requests during active editing
  - Implemented in `DrawingContext`
- **Debounce Utility**: `excalidraw-organizer/src/utils/debounce.utils.ts`
  - Reusable debounce and throttle functions

### 5. Virtual Scrolling
- **VirtualList Component**: Renders only visible items
  - Configurable item height and overscan
  - Efficient for large lists (1000+ items)
  - Located at `excalidraw-organizer/src/components/VirtualList.tsx`

### 6. Pagination UI
- **Load More Buttons**: Incremental loading for all list views
  - Recent drawings section
  - Project drawings view
  - Projects list
- **Infinite Scroll Ready**: Architecture supports infinite scroll implementation

## Performance Metrics

### Expected Improvements
- **Initial Load Time**: 30-40% faster with lazy loading
- **Memory Usage**: 50-60% reduction with virtual scrolling for large lists
- **Network Traffic**: 40-50% reduction with thumbnail caching
- **Database Query Time**: 60-70% faster with optimized indexes
- **Storage Efficiency**: 30-40% reduction with WebP thumbnails

## Usage Examples

### Backend Pagination
```typescript
// Get recent drawings with pagination
GET /api/drawings/recent?limit=50&offset=0

// Response includes pagination metadata
{
  "drawings": [...],
  "count": 50,
  "totalCount": 250,
  "hasMore": true
}
```

### Frontend Thumbnail Cache
```typescript
import { thumbnailCache } from './utils/cache.utils';

// Cache a thumbnail
thumbnailCache.set(drawingId, thumbnailDataUrl);

// Retrieve from cache
const cached = thumbnailCache.get(drawingId);

// Get cache statistics
const stats = thumbnailCache.getStats();
```

### Auto-save with Debouncing
```typescript
import { useDrawing } from './contexts/DrawingContext';

const { autoSaveDrawing, enableAutoSave } = useDrawing();

// Enable auto-save for a drawing
enableAutoSave(drawingId);

// Auto-save will be debounced (2 second delay)
autoSaveDrawing(drawingId, elements, appState);
```

### Virtual Scrolling
```typescript
import { VirtualList } from './components/VirtualList';

<VirtualList
  items={drawings}
  itemHeight={80}
  containerHeight={600}
  renderItem={(drawing, index) => (
    <DrawingCard key={drawing.id} drawing={drawing} />
  )}
  overscan={3}
/>
```

## Future Optimizations

### Potential Improvements
1. **Service Worker**: Offline caching and background sync
2. **Image CDN**: Serve thumbnails from CDN
3. **Database Connection Pooling**: Optimize database connections
4. **Redis Caching**: Server-side caching for frequently accessed data
5. **GraphQL**: Reduce over-fetching with precise queries
6. **Code Splitting**: Further split bundles by route
7. **Compression Middleware**: Gzip/Brotli compression for API responses
8. **Database Read Replicas**: Scale read operations

## Monitoring

### Recommended Metrics to Track
- API response times (p50, p95, p99)
- Database query execution times
- Cache hit/miss ratios
- Bundle sizes and load times
- Memory usage patterns
- Network payload sizes

## Configuration

### Environment Variables
```env
# Cache settings (frontend)
VITE_THUMBNAIL_CACHE_SIZE=5242880  # 5MB
VITE_THUMBNAIL_CACHE_MAX_ITEMS=100

# Pagination settings (backend)
MAX_DRAWINGS_PER_PAGE=100
MAX_PROJECTS_PER_PAGE=200

# Auto-save settings (frontend)
VITE_AUTOSAVE_DEBOUNCE_MS=2000
```

## Testing

### Performance Testing
1. Test pagination with large datasets (1000+ items)
2. Verify cache eviction with memory constraints
3. Measure load times with/without optimizations
4. Test auto-save under rapid changes
5. Verify virtual scrolling with 10,000+ items

### Load Testing
- Use tools like Apache JMeter or k6
- Test concurrent users (100+)
- Monitor database connection pool
- Check memory leaks during extended sessions
