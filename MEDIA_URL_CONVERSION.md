# Media URL Conversion Implementation

## Overview

This document describes the implementation of automatic media URL conversion from IP-based addresses to localhost URLs in the Traffic Violation Management System. This change ensures that media files (photos and videos) are consistently accessible regardless of network changes or IP address variations.

## Problem Statement

**Before Implementation:**
- Media URLs were stored using dynamic IP addresses (e.g., `http://192.168.1.100:3000/uploads/violations/images/file.jpg`)
- Different WiFi networks assigned different IP addresses
- Media files became inaccessible when switching networks
- Image/video rendering failed due to broken URLs
- Poor user experience and system reliability

**After Implementation:**
- Media URLs automatically use localhost (e.g., `http://localhost:3000/uploads/violations/images/file.jpg`)
- Consistent access regardless of network changes
- Media files always render correctly
- Improved user experience and system reliability

## Technical Implementation

### 1. URL Conversion Functions

Added two utility functions in `src/utils/constants.ts`:

#### `getLocalhostUrl(relativePath: string)`
- Converts relative paths to full localhost URLs
- Handles paths starting with `/uploads`
- Uses configurable port from environment variables

#### `convertToLocalhostUrl(url: string)`
- Converts any existing IP-based URLs to localhost
- Maintains backward compatibility
- Preserves Firebase/cloud storage URLs unchanged
- Handles edge cases (empty URLs, already localhost URLs)

### 2. File Upload Service Updates

Modified `src/services/fileUpload.ts`:
- **Local Storage**: URLs now return full localhost URLs instead of relative paths
- **Firebase Storage**: URLs remain unchanged (cloud-based)
- **Automatic Conversion**: All new uploads automatically use localhost format

### 3. Controller Updates

Updated controllers to use URL conversion:
- **Citizen Controller**: Converts URLs when submitting reports
- **Police Controller**: Converts URLs when returning report data
- **Consistent Format**: All media URLs returned to frontend use localhost

### 4. Configuration

Added `LOCAL_SERVER_URL` constant:
```typescript
LOCAL_SERVER_URL: `http://localhost:${process.env.PORT || 3000}`
```

## Usage Examples

### New File Upload
```typescript
// Before: /uploads/violations/images/file.jpg
// After: http://localhost:3000/uploads/violations/images/file.jpg
```

### Existing URL Conversion
```typescript
// Input: http://192.168.1.100:3000/uploads/violations/videos/file.mp4
// Output: http://localhost:3000/uploads/violations/videos/file.mp4

// Input: https://storage.googleapis.com/bucket/file.jpg (Firebase)
// Output: https://storage.googleapis.com/bucket/file.jpg (unchanged)
```

## Database Migration

Created `scripts/updateMediaUrls.ts` to update existing data:
- Scans all reports with media URLs
- Converts IP-based URLs to localhost format
- Preserves Firebase URLs unchanged
- Provides detailed logging of changes

### Running the Migration
```bash
npx ts-node scripts/updateMediaUrls.ts
```

## Benefits

### 1. **Network Independence**
- Media files work consistently across different WiFi networks
- No more broken URLs due to IP address changes
- Seamless experience when switching between networks

### 2. **Improved Reliability**
- Media files always render correctly
- Reduced support tickets related to broken media
- Better user experience for citizens and police officers

### 3. **Backward Compatibility**
- Existing data automatically converted
- No manual intervention required
- Zero downtime during implementation

### 4. **Hybrid Storage Support**
- Local files use localhost URLs
- Cloud storage (Firebase) URLs remain unchanged
- Flexible storage strategy maintained

## Configuration Options

### Environment Variables
- `PORT`: Server port (defaults to 3000)
- `STORAGE_DRIVER`: Storage backend ('local' or 'firebase')

### Constants
- `LOCAL_SERVER_URL`: Automatically constructed from PORT
- `getLocalhostUrl()`: Utility function for path conversion
- `convertToLocalhostUrl()`: Utility function for existing URL conversion

## Testing

The implementation includes comprehensive testing:
- Unit tests for URL conversion functions
- Integration tests for file upload scenarios
- Validation of backward compatibility
- Testing of edge cases (empty URLs, Firebase URLs)

## Future Enhancements

### 1. **Dynamic Port Detection**
- Automatic port detection from running server
- Support for multiple server instances

### 2. **Custom Domain Support**
- Configuration for custom domains
- Environment-specific URL generation

### 3. **CDN Integration**
- Support for CDN URLs
- Automatic CDN URL generation for production

## Conclusion

The media URL conversion implementation provides a robust, network-independent solution for media file access. By automatically converting URLs to use localhost, the system ensures consistent media rendering regardless of network changes, significantly improving user experience and system reliability.

The implementation is backward-compatible, requires no configuration changes, and maintains support for both local and cloud storage solutions. This change addresses the core issue of media accessibility while preserving all existing functionality.
