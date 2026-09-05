import api from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type { ShopPet, UserPet } from "../types/pet.type";

const USER_PET_ENDPOINT = "/user-pets";
const PET_ENDPOINT = "/pets";

export const petApi = {
  getMyPets: () =>
    api
      .get<ApiResponse<UserPet[]>>(`${USER_PET_ENDPOINT}/me`)
      .then((r) => r.data.data),

  equipPet: (userPetId: number) =>
    api
      .post<ApiResponse<UserPet>>(`${USER_PET_ENDPOINT}/${userPetId}/equip`)
      .then((r) => r.data.data),

  renamePet: (userPetId: number, customName: string) =>
    api
      .post<ApiResponse<UserPet>>(
        `${USER_PET_ENDPOINT}/${userPetId}/rename`,
        { customName },
      )
      .then((r) => r.data.data),

  upgradePet: (userPetId: number) =>
    api
      .put<ApiResponse<UserPet>>(`${USER_PET_ENDPOINT}/${userPetId}/upgrade`)
      .then((r) => r.data.data),

  getShopPets: () =>
    api
      .get<ApiResponse<ShopPet[]>>(`${PET_ENDPOINT}`)
      .then((r) => r.data.data),

//   buyPet: (petId: number) =>
//     api
//       .post<ApiResponse<UserPet>>(`${PET_ENDPOINT}/${petId}/buy`)
//       .then((r) => r.data.data),
    addPet: (petId: number) =>
  api
    .post<ApiResponse<UserPet>>(`${USER_PET_ENDPOINT}/shop/${petId}`, {
      petId,
    })
    .then((r) => r.data.data),

};