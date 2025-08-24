# Database Population Scripts

This directory contains scripts for populating the database with test data for development and testing purposes.

## Scripts Overview

### 1. `populateCoimbatoreData.ts` - Coimbatore City Data Population

This script creates comprehensive test data for the Report Violation Backend system, specifically focused on Coimbatore city.

#### Features:
- **100 Violation Reports** across Coimbatore city areas
- **Realistic data spanning 3 months** with proper timestamps
- **80% of reports are approved/rejected** with proper reasoning
- **Complete audit trail** with report events and comments
- **Points system** with transactions and rewards
- **Notifications** for citizens
- **Feedback system** with responses
- **Easy cleanup** functionality

#### Data Generated:
- **5 Police Users** (Commissioner, DSP, Inspector, Constable, Admin)
- **25 Citizens** with varying verification status and points
- **100 Violation Reports** with realistic locations and descriptions
- **Report Events** for complete audit trail
- **Points Transactions** for approved reports
- **Notifications** for status updates
- **Feedback** and responses
- **Report Comments** from police officers

#### Areas Covered:
- RS Puram
- Peelamedu
- Saibaba Colony
- Race Course
- Gandhipuram
- Singanallur
- Kovaipudur
- Vadavalli
- Thudiyalur
- Saravanampatti

#### Violation Types:
- Speed Violation
- Signal Jumping
- Wrong Side Driving
- No Parking Zone
- Helmet/Seatbelt Violation
- Mobile Phone Usage
- Lane Cutting
- Drunk Driving Suspected
- Others

## Usage

### Populate Database with Coimbatore Data
```bash
npm run db:populate-coimbatore
```

### Clean Up All Data
```bash
npm run db:cleanup
```

### Alternative Direct Execution
```bash
npx ts-node scripts/populateCoimbatoreData.ts
```

## Test Credentials

After running the script, you can use these credentials to test the system:

### Police Users:
1. `commissioner@coimbatore.gov.in` (password: `password123`)
2. `dsp.traffic@coimbatore.gov.in` (password: `password123`)
3. `inspector.rs@coimbatore.gov.in` (password: `password123`)
4. `constable.peelamedu@coimbatore.gov.in` (password: `password123`)
5. `admin@coimbatore.gov.in` (password: `admin123`)

### Citizen Phone Numbers:
The script generates 25 citizens with random phone numbers. Check the console output for the generated phone numbers.

## Data Statistics

The script generates:
- **100 Violation Reports** with realistic distribution:
  - ~50% Approved
  - ~30% Rejected
  - ~20% Pending
- **Complete audit trail** with events for each report
- **Points transactions** for approved reports
- **Notifications** for status updates
- **Realistic timestamps** spanning the last 3 months

## Cleanup Function

The `cleanupDatabase()` function deletes all data in the correct order to respect foreign key constraints:

1. Notifications
2. Points Transactions
3. Report Comments
4. Report Events
5. Feedback Responses
6. Feedback
7. OTP Records
8. Violation Reports
9. Citizens
10. Police Users

## Important Notes

- **Encryption**: All sensitive data (phone numbers, emails, addresses) is properly encrypted
- **Foreign Keys**: All relationships are maintained correctly
- **Realistic Data**: Locations, timestamps, and descriptions are realistic for Coimbatore
- **Testing Ready**: Data is structured for testing graphs, analytics, and user experience
- **One-Click Cleanup**: Easy to reset the database for fresh testing

## Customization

You can modify the script to:
- Change the number of reports generated
- Adjust the approval/rejection ratios
- Add more areas or violation types
- Modify the time span
- Change the police user details

## Dependencies

Make sure you have the following installed:
- Node.js
- TypeScript
- Prisma Client
- Required npm packages (bcryptjs, crypto)

## Troubleshooting

If you encounter issues:

1. **Database Connection**: Ensure your database is running and accessible
2. **Prisma**: Run `npx prisma generate` to ensure the client is up to date
3. **Permissions**: Ensure you have write permissions to the database
4. **Cleanup**: If the script fails, run the cleanup function first

## Security Note

This script is for development and testing purposes only. The encryption keys used are development keys and should not be used in production.
