import type { UserPet } from "../types/pet.type";

type PetExperienceSource = Pick<UserPet, "level" | "experience">;

export const MAX_PET_LEVEL = 25;
export const XP_PER_PET_LEVEL = 100;

export const clampExperiencePercent = (value: number) =>
  Math.min(Math.max(value, 0), 100);

export function getPetExperience(pet: PetExperienceSource) {
  return Math.max(Number(pet.experience ?? 0), 0);
}

export function getPetExperienceProgress(pet: PetExperienceSource) {
  const experience = getPetExperience(pet);

  return clampExperiencePercent((experience / XP_PER_PET_LEVEL) * 100);
}

export function canUpgradePet(pet: PetExperienceSource) {
  return pet.level < MAX_PET_LEVEL && getPetExperience(pet) >= XP_PER_PET_LEVEL;
}
