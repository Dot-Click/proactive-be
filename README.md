# Proactive Backend API

A TypeScript-based backend API for the Proactive project, featuring authentication with role-based access control (Admin, Coordinator, and User roles), email verification, and password management.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Authentication Flow](#authentication-flow)
- [Email Verification](#email-verification)
- [Password Management](#password-management)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Middleware](#middleware)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Features

- ✅ User registration with email, password, and role selection (User or Coordinator)
- ✅ User login with email and password
- ✅ Email verification with 5-6 digit numeric tokens
- ✅ Password reset and change password functionality
- ✅ JWT-based authentication with access and refresh tokens
- ✅ HTTP-only cookies for secure token storage
- ✅ Password hashing using bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Protected routes middleware
- ✅ Email sending via Brevo (formerly Sendinblue)
- ✅ Responsive HTML email templates
- ✅ Swagger/OpenAPI documentation
- ✅ TypeScript for type safety
- ✅ Drizzle ORM for database operations
- ✅ NeonDB (PostgreSQL) database
- ✅ Rate limiting with Upstash Redis (optional)
- ✅ Group chat system with role-based access
- ✅ Real-time messaging via Socket.IO
- ✅ Chat management (create, update, delete chats)
- ✅ Message management (send, edit, delete messages)
- ✅ Participant management
- ✅ Achievement tracking system with automatic badge unlocking
- ✅ Trip-based achievement progress tracking

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth
- **Password Hashing**: bcrypt
- **Email Service**: Brevo (via Nodemailer)
- **Documentation**: Swagger/OpenAPI
- **Validation**: Zod
- **Rate Limiting**: Upstash Redis (optional)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- A NeonDB account and database connection string
- A Brevo account (for email functionality)
- Git

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:

   ```bash
   cd proactive-be
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables) section)

4. **Generate database migrations**:

   ```bash
   npm run dbgenerate
   ```

5. **Push database schema**:
   ```bash
   npm run dbpush
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
CONNECTION_URL=your_neondb_connection_string
database=proactive_db

# Server
PORT=3000
BACKEND_DOMAIN=http://localhost:3000
FRONTEND_DOMAIN=http://localhost:3000

# Security
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
COOKIE_SECRET=your_cookie_secret_key_minimum_32_characters

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# Rate Limiting (Optional - Upstash Redis)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

SUPABASE_SERVICE_ROLE_KEY=your_supabase_role_key
SUPABASE_URL=your_supabase_url

# Email Verification (Optional)
REQUIRE_EMAIL_VERIFICATION=true
```

### Generating Secrets

You can generate secure secrets using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this command twice to generate both `JWT_SECRET` and `COOKIE_SECRET`.

### Setting Up Brevo

1. **Create a Brevo account**: Sign up at [Brevo](https://www.brevo.com) (formerly Sendinblue)
2. **Get your API key**:
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the API key to your `.env` file as `BREVO_API_KEY`
3. **Set sender email**: Add your verified sender email as `BREVO_SENDER_EMAIL`

**Note**: Email functionality will gracefully degrade if Brevo is not configured. The API will continue to work, but emails won't be sent.

## Database Setup

1. **Create a NeonDB database**:

   - Sign up at [NeonDB](https://neon.tech)
   - Create a new project and database
   - Copy the connection string

2. **Update your `.env` file** with the connection string

3. **Generate and apply migrations**:

   ```bash
   npm run dbgenerate
   npm run dbpush
   ```

4. **Optional: Open Drizzle Studio** to view your database:
   ```bash
   npm run dbstudio
   ```
   This will open Drizzle Studio at `http://localhost:5000`

```mermaid
erDiagram
    User {
        string id PK
        string name
        string email UK
        string role
        boolean emailVerified
        boolean twoFactorEnabled
        string nickName
        string phoneNumber
        string address
        string gender
        datetime dateOfBirth
        boolean email_notf
        boolean app_notf
        boolean review_notf
        string status
        bigint adventure_points
        bigint progress_points
        string badges
        string bio
        string coordinator_type
        string access_lvl
        string certific_lvl
        int experience
        string languages
        string specialties
        string position
        string image
        decimal ratings
        datetime last_active
        datetime createdAt
        datetime updatedAt
    }

    TwoFactor {
        string id PK
        string userId FK
        string secret
        string backupCodes
        datetime createdAt
        datetime updatedAt
    }

    Session {
        string id PK
        datetime expiresAt
        string token UK
        datetime createdAt
        datetime updatedAt
        string ipAddress
        string userAgent
        string userId FK
    }

    Account {
        string id PK
        string accountId
        string providerId
        string userId FK
        string accessToken
        string refreshToken
        string idToken
        datetime accessTokenExpiresAt
        datetime refreshTokenExpiresAt
        string scope
        string password
        datetime createdAt
        datetime updatedAt
    }

    Verification {
        string id PK
        string identifier
        string value
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }

    Chat {
        string id PK
        string trip_id FK
        string opened
        datetime createdAt
        datetime updatedAt
    }

    ChatParticipant {
        string id PK
        string chatId FK
        string userId FK
    }

    Message {
        string id PK
        string content
        string chatId FK
        string senderId FK
        datetime createdAt
        datetime updatedAt
    }

    Trip {
        string id PK
        string title
        string description
        string cover_image
        string type
        string location
        string map_coordinates
        datetime start_date
        datetime end_date
        string duration
        string long_desc
        string group_size
        string rhythm
        string sport_lvl
        string weekend_tt
        string included
        string not_included
        string status
        string short_desc
        string insta_link
        string likedin_link
        string promotional_video
        string gallery_images
        string best_price_msg
        string per_head_price
        datetime createdAt
        datetime updatedAt
    }

    Application {
        string id PK
        string user_id FK
        string trip_id FK
        string short_intro
        string intro_video
        string status
        datetime createdAt
        datetime updatedAt
    }

    Reviews {
        string id PK
        string user_id FK
        string trip_id FK
        int rating
        string review
        datetime createdAt
        datetime updatedAt
    }

    Payment_And_Membership {
        string id PK
        string user_id FK
        string trip_id FK
        decimal amount
        string status
        string last4
        string currency
        string membership_type
        string method
        string card_expiry
        string stripe_customer_id
        string membership_id
        boolean discount_available
        string valid_till
        string stripe_payment_id
        datetime createdAt
        datetime updatedAt
    }

    Settings {
        string id PK
        string platform_name
        string time_zone
        string logo
        string default_language
        string currency
        boolean chat_widget
        string trip_categories
        string default_approval
        int default_max_participants
        int default_min_participants
        boolean email_notification
        int reminder_days
        boolean send_sms
        boolean two_factor_enabled
        int session_timeout
        int max_logins
        int min_password_length
        datetime createdAt
        datetime updatedAt
    }

    Notification {
        string id PK
        string user_id FK
        string title
        string description
        string type
        boolean read
        datetime createdAt
        datetime updatedAt
    }

    Achievement {
        string id PK
        string user_id FK
        string trip_id FK
        string badges
        integer points
        integer progress
        string level
        boolean unlocked
        string role
        datetime createdAt
        datetime updatedAt
    }

    %% Relationships
    User ||--o{ Session : has
    User ||--o{ Account : has
    User ||--o{ Application : applied
    User ||--o{ Payment_And_Membership : pays
    User ||--o{ Reviews : writes
    User ||--o{ Notification : receives
    User ||--o{ ChatParticipant : joins
    User ||--o{ Message : sends
    User ||--|| TwoFactor : has
    User ||--o{ Achievement : earns

    TwoFactor }o--|| User : belongsTo
    Session }o--|| User : belongsTo
    Account }o--|| User : belongsTo
    Application }o--|| User : by
    Application }o--|| Trip : for
    Reviews }o--|| User : by
    Reviews }o--|| Trip : for
    Payment_And_Membership }o--|| User : by
    Payment_And_Membership }o--|| Trip : for
    Notification }o--|| User : for
    ChatParticipant }o--|| User : user
    ChatParticipant }o--|| Chat : chat
    Message }o--|| Chat : chat
    Message }o--|| User : sender
    Chat }o--|| Trip : of
    Chat ||--o{ Message : messages
    Chat ||--o{ ChatParticipant : participants
    Trip ||--o{ Application : takes
    Trip ||--o{ Payment_And_Membership : has
    Trip ||--o{ Reviews : gets
    Trip ||--o{ Chat : has
    Trip ||--o{ Achievement : contributes
    Achievement }o--|| User : earnedBy
    Achievement }o--|| Trip : from

```

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### Production Mode

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

## API Documentation

Once the server is running, you can access the Swagger API documentation at:

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Swagger JSON**: `http://localhost:3000/api/docs-json`

The Swagger documentation includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Direct API testing from the UI

## Authentication Flow

### Registration Flow

1. User sends POST request to `/api/auth/register` with:

   - `email`: User's email address
   - `password`: User's password (min 8 chars, must contain uppercase, lowercase, and number)
   - `role`: Either "user" or "coordinator"

2. Server validates the input, hashes the password, and creates a new user

3. Server generates:

   - Access token (JWT, expires in 15 minutes)
   - Refresh token (JWT, expires in 7 days)
   - Verification token (5-6 digit numeric code)

4. Server sends verification email with the token

5. Server responds with:
   - User information (id, email, role, emailVerified)
   - Access token (in response body)
   - Refresh token (in HTTP-only cookie)
   - Verification token (only in development mode)

### Login Flow

1. User sends POST request to `/api/auth/login` with:

   - `email`: User's email address
   - `password`: User's password

2. Server validates credentials:

   - Checks if user exists
   - Verifies password hash
   - **Checks if email is verified** (if `REQUIRE_EMAIL_VERIFICATION=true`)

3. If valid, server generates tokens and responds similar to registration

4. If email is not verified, server returns 403 Forbidden with appropriate message

### Protected Routes

To access protected routes:

1. Include the access token in the Authorization header:

   ```
   Authorization: Bearer <access_token>
   ```

2. The `authenticate` middleware will verify the token and attach user info to `req.user`

3. For role-based access, use the `authorize` middleware:
   ```typescript
   router.get("/admin-only", authenticate, authorize("admin"), controller);
   ```

### Logout Flow

1. User sends POST request to `/api/auth/logout` with access token in Authorization header

2. Server clears the refresh token cookie

## Email Verification

### Verification Token Format

- **Length**: 5 or 6 digits (randomly chosen)
- **Format**: Numeric only (e.g., `12345` or `123456`)
- **Expiration**: 24 hours from generation
- **Storage**: Stored in database with normalized email identifier

### Verify Email

1. User receives verification email with 5-6 digit token
2. User sends POST request to `/api/auth/verify-email` with:
   ```json
   {
     "token": "123456"
   }
   ```
3. Server validates token:
   - Checks token format (must be 5-6 digits)
   - Verifies token exists and hasn't expired
   - Updates user's `emailVerified` status to `true`
4. Server sends welcome email to user
5. User can now log in (if email verification is required)

### Resend Verification Email

1. User sends POST request to `/api/auth/resend-verification` with:
   ```json
   {
     "email": "user@example.com"
   }
   ```
2. Server generates new verification token and sends email
3. Previous verification tokens for that email are invalidated

## Password Management

### Forgot Password

1. User sends POST request to `/api/auth/forgot-password` with:
   ```json
   {
     "email": "user@example.com"
   }
   ```
2. Server generates 5-6 digit reset token (expires in 1 hour)
3. Server sends password reset email with token
4. Server always returns success (to prevent email enumeration)

### Reset Password

1. User receives password reset email with 5-6 digit token
2. User sends POST request to `/api/auth/reset-password` with:
   ```json
   {
     "token": "123456",
     "password": "NewPassword123"
   }
   ```
3. Server validates token and updates password
4. Reset token is deleted after use

### Change Password

1. Authenticated user sends POST request to `/api/auth/change-password` with:
   ```json
   {
     "currentPassword": "OldPassword123",
     "newPassword": "NewPassword123"
   }
   ```
2. Server verifies current password
3. Server updates to new password

## Project Structure

```
proactive-be/
├── src/
│   ├── configs/           # Configuration files
│   │   ├── connection.config.ts
│   │   ├── swagger.config.ts
│   │   └── session.config.ts
│   ├── controllers/       # Route controllers
│   │   └── auth/
│   │       ├── register.controller.ts
│   │       ├── login.controller.ts
│   │       ├── logout.controller.ts
│   │       ├── refresh-token.controller.ts
│   │       ├── get-current-user.controller.ts
│   │       ├── verify-email.controller.ts
│   │       ├── resend-verification.controller.ts
│   │       ├── forgot-password.controller.ts
│   │       ├── reset-password.controller.ts
│   │       └── change-password.controller.ts
│   ├── middlewares/       # Express middlewares
│   │   ├── auth.middleware.ts
│   │   └── throttle.middleware.ts
│   ├── routes/            # Route definitions
│   │   └── auth.routes.ts
│   ├── schema/            # Database schema
│   │   └── schema.ts
│   ├── types/             # TypeScript type definitions
│   │   └── auth.types.ts
│   ├── utils/             # Utility functions
│   │   ├── response.util.ts
│   │   ├── password.util.ts
│   │   ├── token.util.ts
│   │   ├── brevo.util.ts
│   │   ├── env.utils.ts
│   │   ├── logger.util.ts
│   │   ├── socket-chat.util.ts
│   │   └── registerevents.util.ts
│   ├── controllers/       # Route controllers
│   │   ├── auth/
│   │   └── chat/          # Chat controllers
│   │       ├── create-chat.controller.ts
│   │       ├── get-chats.controller.ts
│   │       ├── get-chat.controller.ts
│   │       ├── update-chat.controller.ts
│   │       ├── delete-chat.controller.ts
│   │       ├── add-participant.controller.ts
│   │       ├── remove-participant.controller.ts
│   │       ├── send-message.controller.ts
│   │       ├── get-messages.controller.ts
│   │       ├── update-message.controller.ts
│   │       └── delete-message.controller.ts
│   ├── events/            # Socket event handlers
│   │   ├── example.event.ts
│   │   └── chat.event.ts
│   ├── routes/            # Route definitions
│   │   ├── auth.routes.ts
│   │   └── chat.routes.ts
│   └── server.ts          # Application entry point
├── drizzle/               # Database migrations
├── package.json
└── README.md
```

## Chat Module

The chat module provides a complete group chat system with role-based access control and real-time messaging capabilities.

### Chat Features

- **Group Chats**: Create group chats with multiple participants
- **Role-Based Access**:
  - **Admin**: Can view all chats in the system
  - **Coordinator**: Can view chats where they are the coordinator
  - **User**: Can view chats where they are a participant
- **Real-time Messaging**: Messages are delivered instantly via Socket.IO
- **Message Management**: Send, edit, and delete messages
- **Participant Management**: Add and remove participants from chats

### Socket.IO Setup

#### Client Connection

To connect to the Socket.IO server, include the JWT access token in the connection:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "your_jwt_access_token"
  },
  // Or use headers
  extraHeaders: {
    Authorization: "Bearer your_jwt_access_token"
  }
});
```

#### Server Socket Events

##### Client → Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `chat:join` | Join a chat room | `{ chatId: string }` |
| `chat:leave` | Leave a chat room | `{ chatId: string }` |
| `message:send` | Send a message via socket | `{ chatId: string, content: string }` |

##### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `chat:joined` | Confirmation of joining chat | `{ chatId: string }` |
| `chat:left` | Confirmation of leaving chat | `{ chatId: string }` |
| `message:new` | New message received | `{ message: MessageObject }` |
| `message:sent` | Confirmation of message sent | `{ message: MessageObject }` |
| `error` | Error occurred | `{ message: string, errors?: any }` |

#### Socket Event Examples

**Join a Chat Room:**
```javascript
socket.emit("chat:join", { chatId: "chat123" });

socket.on("chat:joined", (data) => {
  console.log("Joined chat:", data.chatId);
});
```

**Send a Message:**
```javascript
socket.emit("message:send", {
  chatId: "chat123",
  content: "Hello everyone!"
});

socket.on("message:new", (data) => {
  console.log("New message:", data.message);
});
```

**Leave a Chat Room:**
```javascript
socket.emit("chat:leave", { chatId: "chat123" });
```

### Chat REST API Endpoints

#### Chat Management

##### Create Chat
- **POST** `/api/chat`
- **Description**: Create a new group chat
- **Body**:
  ```json
  {
    "name": "Trip to Paris",
    "description": "Group chat for Paris trip participants",
    "coordinatorId": "coord123",
    "participantIds": ["user1", "user2"]
  }
  ```
- **Response**: Chat object with details
- **Status Codes**: 201 (Created), 400 (Bad Request), 404 (Not Found)

##### Get All Chats
- **GET** `/api/chat`
- **Description**: Get all chats based on user role
  - Admin: All chats
  - Coordinator: Chats where they are coordinator
  - User: Chats where they are participant
- **Response**: Array of chat objects with participant counts
- **Status Codes**: 200 (OK), 401 (Unauthorized)

##### Get Single Chat
- **GET** `/api/chat/:chatId`
- **Description**: Get detailed information about a specific chat
- **Response**: Chat object with participants and coordinator details
- **Status Codes**: 200 (OK), 403 (Forbidden), 404 (Not Found)

##### Update Chat
- **PUT** `/api/chat/:chatId`
- **Description**: Update chat name or description (admin or coordinator only)
- **Body**:
  ```json
  {
    "name": "Updated Chat Name",
    "description": "Updated description"
  }
  ```
- **Status Codes**: 200 (OK), 403 (Forbidden), 404 (Not Found)

##### Delete Chat
- **DELETE** `/api/chat/:chatId`
- **Description**: Delete a chat (admin or coordinator only)
- **Status Codes**: 200 (OK), 403 (Forbidden), 404 (Not Found)

#### Participant Management

##### Add Participant
- **POST** `/api/chat/:chatId/participants`
- **Description**: Add a user as participant (admin or coordinator only)
- **Body**:
  ```json
  {
    "userId": "user123"
  }
  ```
- **Status Codes**: 200 (OK), 400 (Bad Request), 403 (Forbidden), 404 (Not Found)

##### Remove Participant
- **DELETE** `/api/chat/:chatId/participants/:userId`
- **Description**: Remove a participant (admin, coordinator, or self)
- **Status Codes**: 200 (OK), 403 (Forbidden), 404 (Not Found)

#### Message Management

##### Get Messages
- **GET** `/api/chat/:chatId/messages?page=1&limit=50`
- **Description**: Get paginated messages from a chat
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Messages per page (default: 50, max: 100)
- **Response**: Array of messages with sender details and pagination info
- **Status Codes**: 200 (OK), 403 (Forbidden), 404 (Not Found)

##### Send Message (REST)
- **POST** `/api/chat/:chatId/messages`
- **Description**: Send a message via REST API (also emits socket event)
- **Body**:
  ```json
  {
    "content": "Hello everyone!"
  }
  ```
- **Response**: Message object with sender details
- **Status Codes**: 201 (Created), 400 (Bad Request), 403 (Forbidden), 404 (Not Found)

##### Update Message
- **PUT** `/api/chat/:chatId/messages/:messageId`
- **Description**: Update a message (sender only)
- **Body**:
  ```json
  {
    "content": "Updated message content"
  }
  ```
- **Status Codes**: 200 (OK), 400 (Bad Request), 403 (Forbidden), 404 (Not Found)

##### Delete Message
- **DELETE** `/api/chat/:chatId/messages/:messageId`
- **Description**: Soft delete a message (sender or admin)
- **Status Codes**: 200 (OK), 403 (Forbidden), 404 (Not Found)

### Chat Workflow

1. **Create Chat**: Coordinator or admin creates a chat with participants
2. **Join Chat Room**: Participants connect via Socket.IO and join the chat room
3. **Send Messages**: Messages can be sent via REST API or Socket.IO
4. **Real-time Updates**: All participants receive new messages instantly via Socket.IO
5. **Manage Participants**: Add or remove participants as needed
6. **Edit/Delete Messages**: Users can edit their own messages, admins can delete any message

### Message Object Structure

```typescript
{
  id: string;
  chatId: string;
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  senderEmail: string;
  senderProfilePic: string;
  content: string;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Achievements System

The achievements system automatically tracks user progress based on trip participation and unlocks badges when specific criteria are met. Achievements are tracked per user-trip relationship, allowing users to earn badges by participating in different types of trips.

### Achievement Badges

The system supports four types of achievement badges:

1. **Mountain Climber** 🏔️
   - **Criteria**: Complete 5 hiking, trekking, or mountain-related trips
   - **Points per trip**: 20 points
   - **Trip types**: `hiking`, `trekking`, `mountain`, `mountaineering`, `climbing`

2. **Culture Explorer** 🏛️
   - **Criteria**: Complete 3 cultural, city tour, or heritage-related trips
   - **Points per trip**: 15 points
   - **Trip types**: `cultural`, `city tour`, `city tours`, `heritage`, `historical`, `museum`

3. **Nature Lover** 🌿
   - **Criteria**: Complete 3 eco-friendly, nature, or conservation-related trips
   - **Points per trip**: 15 points
   - **Trip types**: `eco-friendly`, `nature`, `conservation`, `wildlife`, `sustainability`, `environmental`

4. **Leader** 👑
   - **Criteria**: Take leadership role (as coordinator) in 1 trip
   - **Points per role**: 50 points
   - **Trigger**: User is assigned as a trip coordinator

### How It Works

#### Automatic Tracking

Achievements are automatically tracked when:

1. **Application Approval**: When a coordinator approves a user's application for a trip
   - System checks the trip's `type` field
   - Determines which badges this trip contributes to
   - Creates achievement records for applicable badges
   - Checks if user is a coordinator (for Leader badge)
   - Updates progress counters
   - Unlocks badges when criteria are met

2. **Trip Type Matching**: The system automatically categorizes trips based on keywords in the `type` field:
   ```typescript
   // Example trip types that trigger Mountain Climber badge:
   "Hiking Adventure"
   "Mountain Trekking"
   "Mountaineering Expedition"
   
   // Example trip types that trigger Culture Explorer badge:
   "Cultural Tour"
   "City Tours of Paris"
   "Historical Heritage Walk"
   
   // Example trip types that trigger Nature Lover badge:
   "Eco-Friendly Safari"
   "Nature Conservation Project"
   "Wildlife Sustainability Tour"
   ```

#### Achievement Record Structure

Each achievement record represents one user's participation in one trip toward a specific badge:

```typescript
{
  id: string;                    // Unique achievement ID
  userId: string;                // User who earned the achievement
  tripId: string;                // Trip that contributed to the achievement
  badges: "Mountain Climber" | "Culture Explorer" | "Nature Lover" | "Leader";
  points: number;                // Points awarded for this achievement
  progress: number;              // Progress counter (usually 1 per record)
  level: string;                 // Achievement level (e.g., "Bronze")
  unlocked: boolean;            // Whether the badge is unlocked
  role: "participant" | "leader"; // User's role in the trip
  createdAt: Date;
  updatedAt: Date;
}
```

#### Badge Unlocking Logic

- **Trip-based badges** (Mountain Climber, Culture Explorer, Nature Lover):
  - System counts all achievement records for a user-badge combination
  - When count reaches the required threshold (e.g., 5 for Mountain Climber), all records for that badge are marked as `unlocked: true`
  - Badge remains unlocked even if user completes more trips

- **Leader badge**:
  - Unlocked when user takes coordinator role in at least 1 trip
  - Tracked separately from participant achievements

### Database Schema

The achievements table structure:

```sql
CREATE TABLE "achievements" (
  "id" varchar PRIMARY KEY NOT NULL,
  "user_id" varchar(128) NOT NULL,
  "trip_id" varchar(128) NOT NULL,
  "badges" "achievements_badges" NOT NULL,
  "points" integer NOT NULL DEFAULT 0,
  "progress" integer DEFAULT 0,
  "level" varchar(255) NOT NULL,
  "unlocked" boolean DEFAULT false NOT NULL,
  "role" varchar(50),
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp
);
```

### API Endpoints

#### Get User Achievements

- **GET** `/api/user/achievements`
- **Description**: Get authenticated user's achievements and progress
- **Authentication**: Required (User role)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Achievements retrieved successfully",
    "data": {
      "achievements": [
        {
          "id": "ach123",
          "userId": "user123",
          "tripId": "trip123",
          "badges": "Mountain Climber",
          "points": 20,
          "progress": 1,
          "level": "Bronze",
          "unlocked": false,
          "role": "participant",
          "createdAt": "2024-01-15T10:00:00Z",
          "updatedAt": "2024-01-15T10:00:00Z"
        }
      ],
      "badgeProgress": {
        "Mountain Climber": {
          "totalTrips": 3,
          "unlocked": false,
          "progress": 3,
          "required": 5,
          "percentage": 60,
          "points": 60
        },
        "Culture Explorer": {
          "totalTrips": 2,
          "unlocked": false,
          "progress": 2,
          "required": 3,
          "percentage": 66.67,
          "points": 30
        }
      },
      "totalPoints": 90,
      "unlockedBadges": []
    }
  }
  ```

#### Get All Achievements (Admin/Coordinator)

- **GET** `/api/coordinator/achievements`
- **Description**: Get all achievements across all users (admin view)
- **Authentication**: Required (Coordinator or Admin role)
- **Response**: Array of all achievement records

#### Update Application Status (Triggers Achievement Tracking)

- **PATCH** `/api/coordinator/applications/:applicationId`
- **Description**: Update application status. When status is set to "approved", achievements are automatically tracked.
- **Authentication**: Required (Coordinator or Admin role)
- **Body**:
  ```json
  {
    "status": "approved"
  }
  ```
- **Response**: Updated application object

### Achievement Tracking Flow

```mermaid
sequenceDiagram
    participant User
    participant Coordinator
    participant API
    participant AchievementService
    participant Database

    User->>API: Submit Application
    API->>Database: Create Application (status: pending)
    
    Coordinator->>API: Approve Application
    API->>Database: Update Application (status: approved)
    API->>AchievementService: trackTripAchievement(userId, tripId, role)
    
    AchievementService->>Database: Get Trip Details
    AchievementService->>AchievementService: Determine Applicable Badges
    AchievementService->>Database: Check Existing Achievement Records
    AchievementService->>Database: Create Achievement Records
    AchievementService->>AchievementService: checkAndUnlockBadge()
    AchievementService->>Database: Count User Progress
    AchievementService->>Database: Update Badge Status (if unlocked)
    
    API->>Coordinator: Application Updated Successfully
```

### Example Scenarios

#### Scenario 1: User Earns Mountain Climber Badge

1. User applies for 5 hiking trips
2. Coordinator approves all 5 applications
3. System creates 5 achievement records for "Mountain Climber" badge
4. After the 5th approval, system checks progress: `5 >= 5` ✅
5. System unlocks the badge by setting `unlocked: true` on all records
6. User can now see "Mountain Climber" badge in their achievements

#### Scenario 2: User Takes Leadership Role

1. Admin assigns user as coordinator for a trip
2. User's application for that trip is approved
3. System detects user is in `tripCoordinators` table
4. System creates achievement record with `role: "leader"` and `badges: "Leader"`
5. System checks progress: `1 >= 1` ✅
6. Leader badge is immediately unlocked

#### Scenario 3: Mixed Trip Types

1. User completes:
   - 2 hiking trips (Mountain Climber: 2/5)
   - 3 cultural trips (Culture Explorer: 3/3 ✅ Unlocked)
   - 1 eco-friendly trip (Nature Lover: 1/3)
2. User sees:
   - Culture Explorer badge: **Unlocked** ✅
   - Mountain Climber badge: 40% progress (2/5)
   - Nature Lover badge: 33% progress (1/3)

### Integration Points

The achievement system integrates with:

1. **Application Approval Flow** (`src/controllers/coordinators/update.application.controller.ts`):
   - Automatically calls `trackTripAchievement()` when application status changes to "approved"

2. **Trip Coordinator Assignment** (`tripCoordinators` table):
   - System checks if user is a coordinator to award Leader badge

3. **Trip Type Field** (`trips.type`):
   - Used to determine which badges a trip contributes to

### Service Functions

The achievement service (`src/services/achievement.service.ts`) provides:

- `getAchievementBadgeForTrip(tripType)`: Maps trip types to applicable badges
- `trackTripAchievement(userId, tripId, role)`: Creates achievement records and checks unlock status
- `checkAndUnlockBadge(userId, badge)`: Checks progress and unlocks badges when criteria are met
- `getUserAchievements(userId)`: Returns comprehensive achievement summary with progress percentages

### Best Practices

1. **Trip Type Naming**: Use descriptive trip types that include keywords matching badge categories (e.g., "Hiking Adventure", "Cultural Tour")

2. **Achievement Tracking**: Achievements are automatically tracked - no manual intervention needed

3. **Progress Monitoring**: Use the `getUserAchievements` endpoint to display progress bars and motivate users

4. **Badge Display**: Show unlocked badges prominently and display progress for badges in progress

5. **Leader Recognition**: Highlight users with Leader badges as they've demonstrated leadership capabilities

## API Endpoints

### Authentication Endpoints

#### Register User

- **POST** `/api/auth/register`
- **Description**: Register a new user account
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "role": "user"
  }
  ```
- **Response**: User object, access token, and verification token (dev only)
- **Status Codes**: 201 (Created), 400 (Bad Request), 409 (Conflict)

#### Login User

- **POST** `/api/auth/login`
- **Description**: Authenticate user and receive tokens
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Response**: User object and access token
- **Status Codes**: 200 (OK), 401 (Unauthorized), 403 (Forbidden - email not verified), 400 (Bad Request)

#### Logout User

- **POST** `/api/auth/logout`
- **Description**: Logout user and clear refresh token
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: Success message
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### Refresh Token

- **POST** `/api/auth/refresh`
- **Description**: Get new access token using refresh token
- **Headers**: Refresh token in HTTP-only cookie
- **Response**: New access token
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### Get Current User

- **GET** `/api/auth/me`
- **Description**: Get authenticated user's profile
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: User profile information
- **Status Codes**: 200 (OK), 401 (Unauthorized)

### Email Verification Endpoints

#### Verify Email

- **POST** `/api/auth/verify-email`
- **Description**: Verify user's email address using token
- **Body**:
  ```json
  {
    "token": "123456"
  }
  ```
- **Response**: Success message
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

#### Resend Verification Email

- **POST** `/api/auth/resend-verification`
- **Description**: Resend email verification token
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: Success message
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

### Password Management Endpoints

#### Forgot Password

- **POST** `/api/auth/forgot-password`
- **Description**: Request password reset token
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: Success message (always returns success to prevent email enumeration)
- **Status Codes**: 200 (OK), 400 (Bad Request)

#### Reset Password

- **POST** `/api/auth/reset-password`
- **Description**: Reset password using reset token
- **Body**:
  ```json
  {
    "token": "123456",
    "password": "NewPassword123"
  }
  ```
- **Response**: Success message
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

#### Change Password

- **POST** `/api/auth/change-password`
- **Description**: Change password for authenticated user
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**:
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword123"
  }
  ```
- **Response**: Success message
- **Status Codes**: 200 (OK), 400 (Bad Request), 401 (Unauthorized)

## Middleware

### Authentication Middleware

#### `authenticate`

Verifies JWT token from Authorization header and attaches user info to `req.user`.

**Usage**:

```typescript
import { authenticate } from "@/middlewares/auth.middleware";

router.get("/protected", authenticate, controller);
```

#### `authorize(...roles)`

Checks if the authenticated user has one of the specified roles.

**Usage**:

```typescript
import { authenticate, authorize } from "@/middlewares/auth.middleware";

router.get("/admin", authenticate, authorize("admin"), controller);
router.get(
  "/coordinator",
  authenticate,
  authorize("coordinator", "admin"),
  controller
);
```

#### `optionalAuthenticate`

Attaches user info if token is present, but doesn't require authentication.

**Usage**:

```typescript
import { optionalAuthenticate } from "@/middlewares/auth.middleware";

router.get("/public", optionalAuthenticate, controller);
```

### Rate Limiting Middleware

#### `throttle(points, duration)`

Rate limits API requests using Upstash Redis. Gracefully degrades if Redis is not configured.

**Usage**:

```typescript
import { throttle } from "@/middlewares/throttle.middleware";

router.post("/api/auth/login", throttle(5, "15m"), login);
```

## Email Templates

The project includes three responsive HTML email templates:

1. **Email Verification Template**: Sent when user registers or requests verification

   - Includes verification link and 5-6 digit token
   - Expires in 24 hours

2. **Password Reset Template**: Sent when user requests password reset

   - Includes reset link and 5-6 digit token
   - Expires in 1 hour

3. **Welcome Email Template**: Sent after successful email verification
   - Welcomes user to the platform
   - Includes link to login

All templates are mobile-responsive and include both HTML and plain text versions.

## Best Practices

### Security

1. **Never commit `.env` files** - Add `.env` to `.gitignore`
2. **Use strong secrets** - Generate random 32+ character strings for JWT_SECRET and COOKIE_SECRET
3. **HTTPS in production** - Always use HTTPS in production environments
4. **Password requirements** - Enforce strong password policies
5. **Token expiration** - Access tokens expire in 15 minutes, refresh tokens in 7 days
6. **Email verification** - Require email verification before allowing login (set `REQUIRE_EMAIL_VERIFICATION=true`)
7. **Rate limiting** - Implement rate limiting to prevent abuse
8. **Token format validation** - All verification tokens are validated for correct format (5-6 digits)

### Code Organization

1. **Separation of concerns** - Controllers handle HTTP logic, utilities handle business logic
2. **Type safety** - Use TypeScript types and Zod schemas for validation
3. **Reusable utilities** - Response, password, token, and email utilities are used throughout
4. **Error handling** - Consistent error responses using `sendError` utility
5. **Documentation** - All endpoints documented with Swagger annotations
6. **Email templates** - Centralized email template functions in `brevo.util.ts`

### Database

1. **Migrations** - Always generate migrations before pushing schema changes
2. **Indexes** - Email is unique and indexed for fast lookups
3. **Cascading deletes** - User deletion cascades to related sessions and accounts
4. **Normalized identifiers** - Email identifiers are normalized (lowercase) for consistency

### Email Service

1. **Graceful degradation** - Email service fails gracefully if Brevo is not configured
2. **Error logging** - All email errors are logged for debugging
3. **Template consistency** - All emails use consistent branding and styling
4. **Token security** - Verification tokens are randomly generated and expire appropriately

## Troubleshooting

### Common Issues

1. **Database connection errors**:

   - Verify your `CONNECTION_URL` in `.env`
   - Ensure your NeonDB database is active
   - Check network connectivity

2. **JWT token errors**:

   - Verify `JWT_SECRET` is set in `.env`
   - Ensure token hasn't expired
   - Check token format in Authorization header

3. **CORS errors**:

   - Verify `FRONTEND_DOMAIN` matches your frontend URL
   - Check CORS configuration in `server.ts`

4. **Validation errors**:

   - Check request body matches expected schema
   - Verify email format and password requirements
   - Ensure token format is 5-6 digits for verification/reset

5. **Email not sending**:

   - Verify `BREVO_API_KEY` is set in `.env`
   - Check Brevo account status and API key validity
   - Verify `BREVO_SENDER_EMAIL` is a verified sender in Brevo
   - Check server logs for email sending errors
   - Note: Email service gracefully degrades if not configured

6. **Email verification not working**:

   - Check if `REQUIRE_EMAIL_VERIFICATION` is set correctly
   - Verify token format (must be 5-6 digits)
   - Check token expiration (24 hours for verification, 1 hour for reset)
   - Ensure email is normalized correctly in database

7. **Rate limiting errors**:

   - If using Upstash Redis, verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
   - Rate limiting gracefully degrades if Redis is not configured
   - Check rate limit settings in route definitions

8. **Token validation errors**:
   - Verification tokens must be exactly 5 or 6 digits
   - Tokens are case-sensitive and must match exactly
   - Check for whitespace in token (automatically trimmed)

## License

ISC

## Support

For issues and questions, please refer to the project documentation or contact the development team.
