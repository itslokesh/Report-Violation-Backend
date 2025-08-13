import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey: string;
  private readonly iv: Buffer;

  constructor() {
    // Use environment variable for encryption key, fallback to a default for development
    this.secretKey = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here-123';
    
    // Ensure the key is exactly 32 characters for AES-256
    if (this.secretKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }
    
    // Generate a fixed IV for consistency (in production, you might want to store this securely)
    this.iv = Buffer.from(process.env.ENCRYPTION_IV || '1234567890123456', 'utf8');
  }

  encrypt(text: string): string {
    try {
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash sensitive data for searching (one-way hash)
  hashForSearch(text: string): string {
    return crypto.createHash('sha256').update(text.toLowerCase()).digest('hex');
  }

  // Encrypt phone number for storage
  encryptPhoneNumber(phoneNumber: string): string {
    return this.encrypt(phoneNumber);
  }

  // Decrypt phone number for display
  decryptPhoneNumber(encryptedPhone: string): string {
    return this.decrypt(encryptedPhone);
  }

  // Encrypt email for storage
  encryptEmail(email: string): string {
    return this.encrypt(email.toLowerCase());
  }

  // Decrypt email for display
  decryptEmail(encryptedEmail: string): string {
    return this.decrypt(encryptedEmail);
  }

  // Encrypt address for storage
  encryptAddress(address: string): string {
    return this.encrypt(address);
  }

  // Decrypt address for display
  decryptAddress(encryptedAddress: string): string {
    return this.decrypt(encryptedAddress);
  }

  // Encrypt license number for storage
  encryptLicenseNumber(licenseNumber: string): string {
    return this.encrypt(licenseNumber);
  }

  // Decrypt license number for display
  decryptLicenseNumber(encryptedLicense: string): string {
    return this.decrypt(encryptedLicense);
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();
