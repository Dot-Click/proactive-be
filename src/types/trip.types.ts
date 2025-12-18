import { z } from "zod";

/**
 * Discount schema for trip discounts
 */
export const discountSchema = z.object({
  discount_code: z.string().min(5).max(255),
  discount_percentage: z.coerce.number(),
  amount: z.coerce.number(),
  valid_till: z.coerce.date(),
  description: z.string().min(5).max(255),
})

/**
 * Create trip request body schema
 */
export const createTripSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .min(1, "Description is required"),
  coverImage: z
    .string()
    .url("Cover image must be a valid URL")
    .max(500, "Cover image URL must be less than 500 characters")
    .optional(),
  type: z
    .string()
    .min(1, "Type is required")
    .max(100, "Type must be less than 100 characters"),
  location: z
    .string()
    .min(1, "Location is required")
    .max(255, "Location must be less than 255 characters"),
  mapCoordinates: z
    .string()
    .optional(),
  startDate: z.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? val : date;
      }
      return val;
    },
    z.date({ message: "Invalid date" })
  ),
  endDate: z.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? val : date;
      }
      return val;
    },
    z.date({ message: "Invalid date" })
  ),
  duration: z
    .string()
    .min(1, "Duration is required")
    .max(100, "Duration must be less than 100 characters"),
  longDesc: z
    .string()
    .min(1, "Long description is required")
    .optional(),
  groupSize: z
    .string()
    .min(1, "Group size is required")
    .max(50, "Group size must be less than 50 characters")
    .optional(),
  rhythm: z
    .string()
    .min(1, "Rhythm is required")
    .max(100, "Rhythm must be less than 100 characters"),
  sportLvl: z
    .string()
    .min(1, "Sport level is required")
    .max(100, "Sport level must be less than 100 characters")
    .optional(),
  weekendTt: z
    .string()
    .min(1, "Weekend timetable is required")
    .max(100, "Weekend timetable must be less than 100 characters")
    .optional(),
  included: z.any().transform((val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
          try {
              return JSON.parse(val);
          } catch {
              return [];
          }
      }
      return [];
  }).pipe(z.array(z.object({ 
      title: z.string().min(5).max(255),
      description: z.string().min(5).max(255),
      img: z.string().min(5).max(255)
  }))),
  notIncluded: z.any().transform((val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
          try {
              return JSON.parse(val);
          } catch {
              return [];
          }
      }
      return [];
  }).pipe(z.array(z.object({ 
      title: z.string().min(5).max(255),
      description: z.string().min(5).max(255),
      img: z.string().min(5).max(255)
  }))),
  shortDesc: z
    .string()
    .min(1, "Short description is required")
    .optional(),
  instaLink: z
    .string()
    .url("Instagram link must be a valid URL")
    .max(500, "Instagram link must be less than 500 characters")
    .optional()
    .nullable(),
  likedinLink: z
    .string()
    .url("LinkedIn link must be a valid URL")
    .max(500, "LinkedIn link must be less than 500 characters")
    .optional()
    .nullable(),
  promotionalVideo: z
    .string()
    .url("Promotional video must be a valid URL")
    .max(500, "Promotional video URL must be less than 500 characters")
    .optional(),
  galleryImages: z
    .array(z.string().url("Gallery image must be a valid URL"))
    .min(1, "At least one gallery image is required")
    .optional(),
  bestPriceMsg: z
    .string()
    .min(1, "Best price message is required")
    .optional(),
  perHeadPrice: z
    .string()
    .min(1, "Per head price is required")
    .max(100, "Per head price must be less than 100 characters")
    .optional(),
  status: z
    .enum(["pending", "active", "completed", "cancelled"])
    .optional()
    .default("pending"),
  coordinators: z
    .union([
      z.string(),
      z.array(z.string()),
    ])
    .optional(),
  discounts: z
    .array(discountSchema)
    .optional(),
})
.refine(
  (data) => data.startDate,
  {
    message: "Start date is required",
    path: ["startDate"],
  }
)
.refine(
  (data) => data.endDate,
  {
    message: "End date is required",
    path: ["endDate"],
  }
)
.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

/**
 * Update trip request body schema
 * All fields are optional for updates
 */
export const updateTripSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .optional(),
  coverImage: z
    .string()
    .url("Cover image must be a valid URL")
    .max(500, "Cover image URL must be less than 500 characters")
    .optional(),
  type: z
    .string()
    .min(1, "Type is required")
    .max(100, "Type must be less than 100 characters")
    .optional(),
  location: z
    .string()
    .min(1, "Location is required")
    .max(255, "Location must be less than 255 characters")
    .optional(),
  mapCoordinates: z
    .string()
    .optional(),
  startDate: z
    .union([z.string().datetime(), z.date(), z.string()])
    .transform((val) => {
      if (typeof val === "string" && !val.includes("T")) {
        return new Date(val);
      }
      return typeof val === "string" ? new Date(val) : val;
    })
    .optional(),
  endDate: z
    .union([z.string().datetime(), z.date(), z.string()])
    .transform((val) => {
      if (typeof val === "string" && !val.includes("T")) {
        return new Date(val);
      }
      return typeof val === "string" ? new Date(val) : val;
    })
    .optional(),
  duration: z
    .string()
    .min(1, "Duration is required")
    .max(100, "Duration must be less than 100 characters")
    .optional(),
  longDesc: z
    .string()
    .min(1, "Long description is required")
    .optional(),
  groupSize: z
    .string()
    .min(1, "Group size is required")
    .max(50, "Group size must be less than 50 characters")
    .optional(),
  rhythm: z
    .string()
    .min(1, "Rhythm is required")
    .max(100, "Rhythm must be less than 100 characters")
    .optional(),
  sportLvl: z
    .string()
    .min(1, "Sport level is required")
    .max(100, "Sport level must be less than 100 characters")
    .optional(),
  weekendTt: z
    .string()
    .min(1, "Weekend timetable is required")
    .max(100, "Weekend timetable must be less than 100 characters")
    .optional(),
  included: z
    .array(z.any())
    .optional()
    .nullable(),
  notIncluded: z
    .array(z.any())
    .optional()
    .nullable(),
  shortDesc: z
    .string()
    .min(1, "Short description is required")
    .optional(),
  instaLink: z
    .string()
    .url("Instagram link must be a valid URL")
    .max(500, "Instagram link must be less than 500 characters")
    .optional()
    .nullable(),
  likedinLink: z
    .string()
    .url("LinkedIn link must be a valid URL")
    .max(500, "LinkedIn link must be less than 500 characters")
    .optional()
    .nullable(),
  promotionalVideo: z
    .string()
    .url("Promotional video must be a valid URL")
    .max(500, "Promotional video URL must be less than 500 characters")
    .optional(),
  galleryImages: z
    .array(z.string().url("Gallery image must be a valid URL"))
    .min(1, "At least one gallery image is required")
    .optional(),
  bestPriceMsg: z
    .string()
    .min(1, "Best price message is required")
    .optional(),
  perHeadPrice: z
    .string()
    .min(1, "Per head price is required")
    .max(100, "Per head price must be less than 100 characters")
    .optional(),
  status: z
    .enum(["pending", "active", "completed", "cancelled"])
    .optional(),
  coordinators: z.any().transform((val: any) => {
    try {
        return JSON.parse(val);
    } catch {
        return Array.isArray(val) ? val : [];
    }
}).pipe(z.array(z.string())),
  discounts: z
    .array(discountSchema)
    .optional(),
});

/**
 * Create trip request type
 */
export type CreateTripRequest = z.infer<typeof createTripSchema>;

/**
 * Update trip request type
 */
export type UpdateTripRequest = z.infer<typeof updateTripSchema>;

/**
 * Discount type
 */
export type Discount = z.infer<typeof discountSchema>;
