CREATE TABLE "google_reviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "reviewer_name" varchar(255) NOT NULL,
    "review_text" text NOT NULL,
    "stars" integer NOT NULL DEFAULT 5,
    "language" varchar(2) NOT NULL,
    "profile_picture" varchar(500),
    "review_link" varchar(500),
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp without time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp without time zone NOT NULL DEFAULT now()
);
