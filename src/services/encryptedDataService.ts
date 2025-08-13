import { encryptionService } from '../utils/encryption';

export class EncryptedDataService {
  // Citizen data encryption/decryption
  static encryptCitizenData(data: {
    phoneNumber: string;
    email?: string;
  }) {
    return {
      phoneNumberEncrypted: encryptionService.encryptPhoneNumber(data.phoneNumber),
      phoneNumberHash: encryptionService.hashForSearch(data.phoneNumber),
      emailEncrypted: data.email ? encryptionService.encryptEmail(data.email) : null,
      emailHash: data.email ? encryptionService.hashForSearch(data.email) : null,
    };
  }

  static decryptCitizenData(data: {
    phoneNumberEncrypted: string;
    emailEncrypted?: string | null;
  }) {
    return {
      phoneNumber: encryptionService.decryptPhoneNumber(data.phoneNumberEncrypted),
      email: data.emailEncrypted ? encryptionService.decryptEmail(data.emailEncrypted) : null,
    };
  }

  // User data encryption/decryption
  static encryptUserData(data: {
    email: string;
  }) {
    return {
      emailEncrypted: encryptionService.encryptEmail(data.email),
      emailHash: encryptionService.hashForSearch(data.email),
    };
  }

  static decryptUserData(data: {
    emailEncrypted: string;
  }) {
    return {
      email: encryptionService.decryptEmail(data.emailEncrypted),
    };
  }

  // Violation report data encryption/decryption
  static encryptReportData(data: {
    reporterPhone: string;
    address: string;
    vehicleNumber?: string;
  }) {
    return {
      reporterPhoneEncrypted: encryptionService.encryptPhoneNumber(data.reporterPhone),
      reporterPhoneHash: encryptionService.hashForSearch(data.reporterPhone),
      addressEncrypted: encryptionService.encryptAddress(data.address),
      vehicleNumberEncrypted: data.vehicleNumber ? encryptionService.encrypt(data.vehicleNumber) : null,
    };
  }

  static decryptReportData(data: {
    reporterPhoneEncrypted: string;
    addressEncrypted: string;
    vehicleNumberEncrypted?: string | null;
  }) {
    return {
      reporterPhone: encryptionService.decryptPhoneNumber(data.reporterPhoneEncrypted),
      address: encryptionService.decryptAddress(data.addressEncrypted),
      vehicleNumber: data.vehicleNumberEncrypted ? encryptionService.decrypt(data.vehicleNumberEncrypted) : null,
    };
  }

  // OTP data encryption/decryption
  static encryptOTPData(data: {
    phoneNumber: string;
  }) {
    return {
      phoneNumberEncrypted: encryptionService.encryptPhoneNumber(data.phoneNumber),
      phoneNumberHash: encryptionService.hashForSearch(data.phoneNumber),
    };
  }

  static decryptOTPData(data: {
    phoneNumberEncrypted: string;
  }) {
    return {
      phoneNumber: encryptionService.decryptPhoneNumber(data.phoneNumberEncrypted),
    };
  }

  // Search by hash
  static createSearchHash(value: string): string {
    return encryptionService.hashForSearch(value);
  }
}
