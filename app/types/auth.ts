export enum Role {
  Admin = 'Admin',
  Owner = 'Owner',
  Seller = 'Seller',
}
export interface Roles {
  data: string[];
}

export interface User {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  age: number;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  gender: number;
  activeStatus: number;
  paymentStatus: number;
  role: Role;
  image: string;
  documentPath: string;
  centerId: number;
  centerName: string;
  salary: number;
  experience: number;
  createdAt: string;
  updatedAt: string;
  emailNotificationsEnabled: boolean;
  telegramNotificationsEnabled: boolean;
  telegramChatId: number | null;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string | null;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface ChangeMailRequest {
  newEmail: string;
}
export interface UpdateProfilePictureRequest {
  profilePicture: File;
}
export type LoginResponse = ApiResponse<string>; // data содержит JWT строку
