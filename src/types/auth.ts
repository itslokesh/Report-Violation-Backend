import { Citizen, Police } from '@prisma/client';

export interface CitizenAuthRequest {
  phoneNumber: string;
  otp: string;
}

export interface CitizenRegistrationRequest {
  phoneNumber: string;
  name: string;
  email: string;
  registeredCity?: string;
  registeredPincode?: string;
  registeredDistrict?: string;
  registeredState?: string;
}

export interface PoliceAuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: Citizen | Police;
}

export interface JwtPayload {
  userId: string;
  type: 'citizen' | 'police';
  role?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}
