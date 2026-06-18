export type UserPet = {
  userPetId: number;
  code: string;
  customName: string;
  level: number;
  imageUrl: string;
  premium: boolean;
  equipped: boolean;
};

export type ShopPet = {
  id: number;
  code: string;
  name: string;
  description: string;
  imageUrl: string;
  premium: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
};