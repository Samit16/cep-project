# KJO Samaj Backend

Fastify v5 TypeScript backend for the KJO Samaj community management platform, powered by **Mongoose (MongoDB)** and **Redis**.

## 🚀 Key Features

- **ODM**: Mongoose (MongoDB) for robust document storage.
- **Auth**: JWT-based authentication (Member OTP via Redis, Admin bcrypt).
- **Background Jobs**: BullMQ (Redis) for high-performance CSV bulk-uploads.
- **Security**: 
  - AES-256-GCM encryption for sensitive fields (`contact_no`).
  - Standard Rate-limiting on sensitive endpoints.
  - Custom CSRF header validation (`X-Requested-With: XMLHttpRequest`).
- **Audit Logging**: Automatic tracking of all member and event mutations.
- **Directory**: Advanced filtering, pagination, and visibility controls for member profiles.

## 🛠 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (running locally or a cloud URI)
- **Redis** (running locally or a cloud URI)

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your real DATABASE_URL and REDIS_HOST

# 3. Start the server (API at http://localhost:3001)
npm run dev

# 4. In a separate terminal, start the background worker
npm run worker
```

## 📊 Member Schema
The new Mongoose schema includes the following fields:
- `first_name`: Member's given name.
- `last_name`: Member's family name.
- `address`: Full residential address.
- `contact_numbers`: Array of encrypted mobile numbers (Used for OTP login).
- `email`: Official email address.
- `occupation`: Professional details.
- `marital_status`: Single, Married, etc.
- `current_place`: Current city of residence.
- `kutch_town`: Ancestral town in Kutch.
- `family_members`: List of related members.
- `is_alive`: Boolean status.
- `profile_complete`: Boolean flag for onboarding status.
- `contact_visibility`: `public` or `private`.

## ⚙️ Environment Variables (`.env`)

```ini
DATABASE_URL=mongodb://localhost:27017/kvjos_nagpur
JWT_SECRET=your_jwt_secret
AES_256_KEY=base64_aes_key
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
FRONTEND_URL=http://localhost:3000
PORT=3001
CSV_BATCH_SIZE=100
```

## 📜 Scripts

- `npm run dev` – Start Fastify with hot-reload (`ts-node-dev`).
- `npm run build` – Compile TypeScript to `dist/`.
- `npm run start` – Run compiled production code.
- `npm run worker` – Start the BullMQ worker for CSV processing.

## License
MIT
