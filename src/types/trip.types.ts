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
});

/**
 * Day itinerary item schema for individual day in the trip
 */
export const dayItineraryItemSchema = z.object({
  day: z.coerce.number().min(1, "Day number must be at least 1"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  image: z.string().url().max(2000).optional(),
});

/**
 * Days itinerary schema - array of day items
 */
export const daysItinerarySchema = z.array(dayItineraryItemSchema).optional();

/**
 * Create trip request body schema
 */
export const createTripSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z.string().min(1, "Description is required"),
  coverImage: z
    .string()
    .url("Cover image must be a valid URL")
    .max(2000, "Cover image URL must be less than 2000 characters"),
  categoryId: z.string().min(1, "Category is required"),
  locationId: z.string().min(1, "Location is required"),
  mapCoordinates: z.string().optional(),
  startDate: z.preprocess((val) => {
    if (typeof val === "string") {
      const s = val.trim();
      if (!s) return val;
      const d = new Date(s);
      return isNaN(d.getTime()) ? val : d;
    }
    return val;
  }, z.date({ message: "Start date is required" })),

  endDate: z.preprocess((val) => {
    if (typeof val === "string") {
      const s = val.trim();
      if (!s) return val;
      const d = new Date(s);
      return isNaN(d.getTime()) ? val : d;
    }
    return val;
  }, z.date({ message: "End date is required" })),
  duration: z
    .string()
    .min(1, "Duration is required")
    .max(100, "Duration must be less than 100 characters"),
  longDesc: z.string().min(1, "Long description is required").optional(),
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
  included: z
    .any()
    .transform((val: any) => {
      let parsed = [] as any[];
      if (Array.isArray(val)) parsed = val;
      else if (typeof val === "string") {
        try {
          parsed = JSON.parse(val);
        } catch {
          parsed = [];
        }
      }
      parsed = parsed.map((item: any) => {
        if (typeof item === "string") {
          return { title: item, description: "", img: "" };
        }
        return item;
      });
      return parsed;
    })
    .pipe(
      z.array(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().max(1000).optional(),
          img: z.string().max(2000).optional(),
        })
      )
    ),
  notIncluded: z
    .any()
    .transform((val: any) => {
      let parsed = [] as any[];
      if (Array.isArray(val)) parsed = val;
      else if (typeof val === "string") {
        try {
          parsed = JSON.parse(val);
        } catch {
          parsed = [];
        }
      }
      parsed = parsed.map((item: any) => {
        if (typeof item === "string") {
          return { title: item, description: "", img: "" };
        }
        return item;
      });
      return parsed;
    })
    .pipe(
      z.array(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().max(1000).optional(),
          img: z.string().max(2000).optional(),
        })
      )
    ),
  shortDesc: z.string().min(1, "Short description is required"),
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
  // Days itinerary - array of days with description and image
  daysItinerary: z
    .any()
    .transform((val: any) => {
      if (!val) return [];
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return Array.isArray(val) ? val : [];
    })
    .pipe(daysItinerarySchema),
  promotionalVideo: z
    .string()
    .url("Promotional video must be a valid URL")
    .max(500, "Promotional video URL must be less than 500 characters"),
  galleryImages: z
    .array(z.string().url("Gallery image must be a valid URL"))
    .min(1, "At least one gallery image is required"),
  bestPriceMsg: z.string().min(1, "Best price message is required"),
  perHeadPrice: z
    .string()
    .min(1, "Per head price is required")
    .max(100, "Per head price must be less than 100 characters"),
  status: z
    .enum(["pending", "active", "completed", "cancelled"])
    .optional()
    .default("pending"),
  coordinators: z.union([z.string(), z.array(z.string())]).optional(),
  discounts: z
    .any()
    .transform((val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return [];
    })
    .pipe(z.array(discountSchema))
    .optional(),
});

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
  description: z.string().min(1, "Description is required").optional(),
  coverImage: z
    .string()
    .url("Cover image must be a valid URL")
    .max(500, "Cover image URL must be less than 500 characters")
    .optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  locationId: z.string().min(1, "Location is required").optional(),
  mapCoordinates: z.string().optional(),
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
  longDesc: z.string().min(1, "Long description is required").optional(),
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
  included: z.array(z.any()).optional().nullable(),
  notIncluded: z.array(z.any()).optional().nullable(),
  shortDesc: z.string().min(1, "Short description is required").optional(),
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
  // Days itinerary - array of days with description and image
  daysItinerary: z
    .any()
    .transform((val: any) => {
      if (!val) return [];
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return Array.isArray(val) ? val : [];
    })
    .pipe(daysItinerarySchema)
    .optional(),
  promotionalVideo: z
    .string()
    .url("Promotional video must be a valid URL")
    .max(500, "Promotional video URL must be less than 500 characters")
    .optional(),
  galleryImages: z
    .array(z.string().url("Gallery image must be a valid URL"))
    .min(1, "At least one gallery image is required")
    .optional(),
  bestPriceMsg: z.string().min(1, "Best price message is required").optional(),
  perHeadPrice: z
    .string()
    .min(1, "Per head price is required")
    .max(100, "Per head price must be less than 100 characters")
    .optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional(),
  coordinators: z
    .any()
    .transform((val: any) => {
      try {
        return JSON.parse(val);
      } catch {
        return Array.isArray(val) ? val : [];
      }
    })
    .pipe(z.array(z.string())),
  discounts: z
    .any()
    .transform((val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return [];
    })
    .pipe(z.array(discountSchema))
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

/**
 * Day itinerary item type
 */
export type DayItineraryItem = z.infer<typeof dayItineraryItemSchema>;

/**
 * Days itinerary type
 */
export type DaysItinerary = z.infer<typeof daysItinerarySchema>;
