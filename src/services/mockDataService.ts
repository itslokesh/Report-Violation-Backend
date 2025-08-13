// Note: Enums are now strings in SQLite
type ViolationType = 'WRONG_SIDE_DRIVING' | 'NO_PARKING_ZONE' | 'SIGNAL_JUMPING' | 'SPEED_VIOLATION' | 'HELMET_SEATBELT_VIOLATION' | 'MOBILE_PHONE_USAGE' | 'LANE_CUTTING' | 'DRUNK_DRIVING_SUSPECTED' | 'OTHERS';
type SeverityLevel = 'MINOR' | 'MAJOR' | 'CRITICAL';
import { VehicleInfo } from '../types/api';
import { VIOLATION_FINES } from '../utils/constants';

export class MockDataService {
  private mockVehicles: Record<string, VehicleInfo> = {
    'TN01AB1234': {
      owner: {
        name: 'John Doe',
        address: '123 Main Street, Chennai, Tamil Nadu',
        phone: '+91-9876543210',
        licenseNumber: 'TN123456789'
      },
      vehicle: {
        type: 'FOUR_WHEELER',
        model: 'Honda City',
        color: 'White',
        registrationDate: '2020-01-15'
      },
      previousViolations: [
        {
          date: '2023-06-15',
          violationType: 'SPEED_VIOLATION',
          fineAmount: 1000,
          status: 'PAID'
        }
      ]
    },
    'TN02CD5678': {
      owner: {
        name: 'Jane Smith',
        address: '456 Park Avenue, Chennai, Tamil Nadu',
        phone: '+91-8765432109',
        licenseNumber: 'TN987654321'
      },
      vehicle: {
        type: 'TWO_WHEELER',
        model: 'Honda Activa',
        color: 'Red',
        registrationDate: '2021-03-20'
      },
      previousViolations: []
    },
    'TN03EF9012': {
      owner: {
        name: 'Mike Johnson',
        address: '789 Lake Road, Chennai, Tamil Nadu',
        phone: '+91-7654321098',
        licenseNumber: 'TN456789123'
      },
      vehicle: {
        type: 'FOUR_WHEELER',
        model: 'Maruti Swift',
        color: 'Blue',
        registrationDate: '2019-08-10'
      },
      previousViolations: [
        {
          date: '2023-04-22',
          violationType: 'SIGNAL_JUMPING',
          fineAmount: 500,
          status: 'PAID'
        },
        {
          date: '2023-01-15',
          violationType: 'NO_PARKING_ZONE',
          fineAmount: 300,
          status: 'PAID'
        }
      ]
    }
  };
  
  async getVehicleInfo(vehicleNumber: string): Promise<VehicleInfo | null> {
    const normalizedNumber = vehicleNumber.toUpperCase();
    return this.mockVehicles[normalizedNumber] || null;
  }
  
  calculateFine(violationType: ViolationType, severity: SeverityLevel): number {
    const baseFines = VIOLATION_FINES[violationType];
    if (!baseFines) {
      return VIOLATION_FINES.OTHERS[severity];
    }
    
    return baseFines[severity];
  }

  async getVehicleHistory(vehicleNumber: string): Promise<any[]> {
    const vehicleInfo = await this.getVehicleInfo(vehicleNumber);
    return vehicleInfo?.previousViolations || [];
  }

  async getOwnerDetails(vehicleNumber: string): Promise<any> {
    const vehicleInfo = await this.getVehicleInfo(vehicleNumber);
    return vehicleInfo?.owner || null;
  }

  async validateLicenseNumber(licenseNumber: string): Promise<boolean> {
    // Mock validation - in real implementation, this would check against RTO database
    const validFormats = [
      /^[A-Z]{2}\d{9}$/, // TN123456789
      /^[A-Z]{2}\d{2}\d{4}\d{4}$/, // TN1234567890
    ];
    
    return validFormats.some(format => format.test(licenseNumber));
  }

  async getTrafficSignals(latitude: number, longitude: number, radius: number = 1000): Promise<any[]> {
    // Mock traffic signal data - in real implementation, this would come from GIS database
    return [
      {
        id: 1,
        name: 'Anna Nagar Junction',
        latitude: latitude + 0.001,
        longitude: longitude + 0.001,
        status: 'ACTIVE',
        lastMaintenance: '2023-12-01'
      },
      {
        id: 2,
        name: 'T Nagar Signal',
        latitude: latitude - 0.002,
        longitude: longitude - 0.002,
        status: 'ACTIVE',
        lastMaintenance: '2023-11-15'
      }
    ];
  }

  async getSpeedLimit(latitude: number, longitude: number): Promise<number> {
    // Mock speed limit data - in real implementation, this would come from road database
    const areaType = this.getAreaType(latitude, longitude);
    
    switch (areaType) {
      case 'SCHOOL_ZONE':
        return 25;
      case 'RESIDENTIAL':
        return 30;
      case 'COMMERCIAL':
        return 40;
      case 'HIGHWAY':
        return 60;
      default:
        return 40;
    }
  }

  private getAreaType(latitude: number, longitude: number): string {
    // Mock area type detection - in real implementation, this would use GIS data
    const random = Math.floor((latitude + longitude) * 1000) % 4;
    const types = ['SCHOOL_ZONE', 'RESIDENTIAL', 'COMMERCIAL', 'HIGHWAY'];
    return types[random];
  }
}

