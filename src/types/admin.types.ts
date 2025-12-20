import { z } from "zod";

export const createCoordinatorSchema = z.object({
  coordinatorDetails: z.preprocess((val) => {
    if (typeof val === "string") {
      return JSON.parse(val);
    }
    return val;
  }, z.object({
    fullName: z.string(),
    phoneNumber: z.string(),
    bio: z.string(),
    profilePicture: z.string(),
    specialities: z.array(z.string()),
    languages: z.array(z.string()),
    certificateLvl: z.string(),
    yearsOfExperience: z.number(),
    type: z.string(),
    accessLvl: z.string(),
  })),
  email: z.string().email(),
  password: z.string(),
});

export type CreateCoordinatorRequest = z.infer<typeof createCoordinatorSchema>;

