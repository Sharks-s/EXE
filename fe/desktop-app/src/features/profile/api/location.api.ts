import api from "../../../lib/axios";
import type { LocationOption } from "../types/profile.types";

export const locationApi = {
  getProvinces: () =>
    api.get<LocationOption[]>("/api/locations/provinces").then((r) => r.data),

  getWards: (provinceCode: number) =>
    api
      .get<LocationOption[]>("/api/locations/wards", {
        params: { provinceCode },
      })
      .then((r) => r.data),
};
