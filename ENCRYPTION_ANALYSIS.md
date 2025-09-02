# Encryption Analysis Report

## Issue: Vehicle Numbers Appearing as Encrypted Hash

### Problem Description
The vehicle number `7f0f9d0b8a49907ede43b4745300f9a3` you're seeing in the frontend is indeed an **encrypted value**, not a properly formatted vehicle number. This is happening because:

1. **Data is stored encrypted** in the database
2. **No decryption is performed** before sending data to the frontend
3. **Frontend receives encrypted data** directly from the API endpoints

### Root Cause Analysis

#### 1. Data Storage Pattern
All sensitive data is encrypted before storage using AES-256-CBC encryption:
- Vehicle numbers are encrypted using `encryptionService.encrypt(vehicleNumber)`
- The encrypted value is stored in `vehicleNumberEncrypted` field
- The original plain text is never stored

#### 2. API Response Pattern
The API endpoints return encrypted data directly without decryption:
- `getReports()` returns `vehicleNumberEncrypted` as `vehicleNumber`
- `getReport()` returns `vehicleNumberEncrypted` as `vehicleNumber`
- No decryption service is called before sending responses

#### 3. Script Data Generation
In `scripts/populateCoimbatoreData.ts`, vehicle numbers are generated correctly:
```typescript
function generateVehicleNumber(): string {
  const states = ['TN', 'KL', 'KA', 'AP'];
  const state = states[Math.floor(Math.random() * states.length)];
  const district = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                 String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const numbers = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `${state}${district}${letters}${numbers}`; // e.g., "TN01AB1234"
}
```

But then they're encrypted before storage:
```typescript
const vehicleNumberEncrypted = Math.random() > 0.1 ? 
  encryptionService.encrypt(generateVehicleNumber()) : null;
```

## Complete List of Encrypted Fields Across All Endpoints

### 1. Citizen Endpoints (`/citizen/*`)

#### `GET /citizen/profile`
- `phoneNumberEncrypted` → Returns encrypted phone number
- `emailEncrypted` → Returns encrypted email

#### `GET /citizen/reports`
- `reporterPhoneEncrypted` → Returns encrypted reporter phone number
- `addressEncrypted` → Returns encrypted address
- `vehicleNumberEncrypted` → Returns encrypted vehicle number

#### `GET /citizen/reports/:id`
- `reporterPhoneEncrypted` → Returns encrypted reporter phone number
- `addressEncrypted` → Returns encrypted address
- `vehicleNumberEncrypted` → Returns encrypted vehicle number

### 2. Police Endpoints (`/police/*`)

#### `GET /police/profile`
- `emailEncrypted` → Returns encrypted email

#### `GET /police/reports`
- `reporterPhoneEncrypted` → Returns encrypted reporter phone number
- `addressEncrypted` → Returns encrypted address
- `vehicleNumberEncrypted` → Returns encrypted vehicle number
- Citizen data: `phoneNumberEncrypted` → Returns encrypted phone number

#### `GET /police/reports/:id`
- `reporterPhoneEncrypted` → Returns encrypted reporter phone number
- `addressEncrypted` → Returns encrypted address
- `vehicleNumberEncrypted` → Returns encrypted vehicle number
- Citizen data: `phoneNumberEncrypted` → Returns encrypted phone number

#### `GET /police/dashboard`
- Geographic data: `addressEncrypted` → Returns encrypted addresses in hotspots

#### `GET /police/geographic-stats`
- `addressEncrypted` → Returns encrypted addresses in hotspots and individual violations

### 3. Auth Endpoints (`/auth/*`)

#### `POST /auth/verify-otp`
- Returns citizen object with `phoneNumberEncrypted` → Returns encrypted phone number

#### `POST /auth/register-citizen`
- Returns citizen object with `phoneNumberEncrypted` → Returns encrypted phone number
- Returns citizen object with `emailEncrypted` → Returns encrypted email

#### `POST /auth/police-login`
- Returns user object with `emailEncrypted` → Returns encrypted email

## Solution Options

### Option 1: Backend Decryption (Recommended)
Modify API endpoints to decrypt data before sending to frontend:

```typescript
// In policeController.ts - getReports method
const transformedReports = reports.map(report => ({
  // ... other fields
  vehicleNumber: report.vehicleNumberEncrypted ? 
    encryptionService.decrypt(report.vehicleNumberEncrypted) : null,
  address: encryptionService.decrypt(report.addressEncrypted),
  citizen: {
    // ... other fields
    phoneNumber: encryptionService.decrypt(report.citizen.phoneNumberEncrypted)
  }
}));
```

### Option 2: Frontend Decryption
Implement decryption on the frontend side (requires sharing encryption keys)

### Option 3: Hybrid Approach
- Decrypt only display fields (vehicle numbers, addresses)
- Keep sensitive fields encrypted (phone numbers, emails)
- Add decryption utilities to the backend

## Recommended Implementation

I recommend **Option 1 (Backend Decryption)** because:
1. **Security**: Encryption keys stay on the backend
2. **Simplicity**: Frontend receives clean, readable data
3. **Performance**: Decryption happens once on the backend
4. **Maintainability**: Single point of control for data formatting

## Files That Need Modification

1. `src/controllers/policeController.ts` - All report endpoints
2. `src/controllers/citizenController.ts` - Profile and report endpoints
3. `src/controllers/authController.ts` - Login/registration endpoints
4. `src/services/encryptedDataService.ts` - Add decryption utilities

## Expected Vehicle Number Format

After decryption, vehicle numbers should appear as:
- `TN01AB1234` (Tamil Nadu)
- `KL02CD5678` (Kerala)
- `KA03EF9012` (Karnataka)
- `AP04GH3456` (Andhra Pradesh)

## Security Note

The current encryption implementation uses a fixed IV (Initialization Vector) which is not ideal for production. Consider:
1. Using random IVs for each encryption
2. Storing IVs alongside encrypted data
3. Using environment variables for encryption keys
4. Implementing key rotation mechanisms
