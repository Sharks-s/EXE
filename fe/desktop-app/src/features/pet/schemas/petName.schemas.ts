import { z } from "zod";

export const RenamePetSchema = z.object({
    petName: z.string().min(1, "notBlank").max(32, "max"),
});
