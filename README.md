# Metadata App 🚀

AI-powered metadata generation tool for micro-business owners, e-commerce sellers, and solo creators. Upload an image, add context, and receive structured, SEO-optimized metadata instantly.

## 📋 Features

- **AI-Powered Generation**: Uses GPT-4 Vision to analyze images and generate metadata
- **Comprehensive Metadata**: Get SEO title, meta description, alt text, and social media captions
- **Channel Recommendations**: AI suggests the best platform for your content
- **User Authentication**: Secure JWT-based authentication
- **Results Management**: Save, view, and manage all generated metadata
- **Clean UI**: Modern, responsive interface built with React and TailwindCSS

## 🏗️ Architecture

This is a monorepo containing:

- **apps/api**: Backend API (Node.js + Fastify + TypeScript + PostgreSQL)
- **apps/web**: Frontend web app (React + Vite + TypeScript + TailwindCSS)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (@fastify/jwt)
- **AI**: OpenAI API (GPT-4 Vision)
- **File Upload**: @fastify/multipart

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Routing**: React Router v7
- **HTTP Client**: Axios

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **PostgreSQL** (v14 or higher)
- **OpenAI API Key** (GPT-4 Vision access)

## 🚀 Installation

### 1. Clone the Repository

```bash
cd C:\Users\Kristi Vahter\Documents\GitHub\metadata_app
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE metadata_app;
```

### 4. Configure Environment Variables

#### Backend (.env)

Create `apps/api/.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/metadata_app

# JWT Secret (generate a random secure string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Upload Directory
UPLOAD_DIR=./uploads

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)

Create `apps/web/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 5. Run Database Migrations

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

## ▶️ Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
# From root directory
pnpm dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
pnpm api

# Terminal 2 - Frontend
pnpm web
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

## 📁 Project Structure

```
metadata_app/
├── apps/
│   ├── api/                    # Backend application
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── middleware/     # Custom middleware
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── types/          # TypeScript types
│   │   │   └── index.ts        # Entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Frontend application
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── pages/          # Page components
│       │   ├── services/       # API services
│       │   ├── context/        # React context
│       │   ├── types/          # TypeScript types
│       │   ├── App.tsx         # Main app component
│       │   └── main.tsx        # Entry point
│       ├── package.json
│       └── vite.config.ts
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml        # Workspace configuration
└── README.md                  # This file
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (protected) |

### Image Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image (protected) |
| GET | `/uploads/:filename` | Serve uploaded image |

### Metadata Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Generate metadata from image (protected) |

### Results

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/results` | Get all user results with pagination (protected) |
| GET | `/api/results/:id` | Get single result (protected) |
| DELETE | `/api/results/:id` | Delete result (protected) |

## 📊 Database Schema

### Users Table
- `id` (UUID)
- `email` (unique)
- `password` (hashed)
- `created_at`
- `updated_at`

### Images Table
- `id` (UUID)
- `user_id` (FK → users)
- `filename`
- `filepath`
- `mimetype`
- `size`
- `created_at`

### Metadata Results Table
- `id` (UUID)
- `user_id` (FK → users)
- `image_url`
- `context_input`
- `seo_title`
- `meta_description`
- `alt_text`
- `social_caption`
- `recommended_channel`
- `channel_explanation`
- `created_at`

## 🔐 Authentication Flow

1. User registers or logs in
2. Server generates JWT token
3. Client stores token in localStorage
4. Client includes token in Authorization header for protected routes
5. Server validates token using @fastify/jwt middleware

## 🎨 User Flow

1. **Register/Login** → Create account or sign in
2. **Upload Image** → Select and upload an image (max 10MB)
3. **Add Context** → Provide brief description (max 500 chars)
4. **Generate** → AI analyzes image and generates metadata
5. **View Results** → See generated metadata with copy functionality
6. **Manage Results** → Browse, view details, and delete saved results

## 🧪 Testing the Application

### Quick Test Flow

1. Register a new account
2. Login with credentials
3. Navigate to "Generate Metadata"
4. Upload a test image
5. Add context (e.g., "Product photo of wireless headphones")
6. Click "Generate Metadata"
7. View and copy the generated metadata
8. Check "Results" page to see saved result

## 🚨 Troubleshooting

### Common Issues

**Database connection failed**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

**OpenAI API errors**
- Verify OPENAI_API_KEY is valid
- Check OpenAI account has GPT-4 Vision access
- Ensure sufficient credits

**File upload fails**
- Check UPLOAD_DIR exists and is writable
- Verify file size is under 10MB
- Confirm file type is supported (JPEG, PNG, WebP, GIF)

**CORS errors**
- Ensure FRONTEND_URL in backend .env matches frontend URL
- Check both servers are running

## 📝 Development Commands

```bash
# Install dependencies
pnpm install

# Run both apps in development
pnpm dev

# Run only backend
pnpm api

# Run only frontend
pnpm web

# Build both apps
pnpm build

# Database operations
cd apps/api
pnpm prisma migrate dev      # Create and run migration
pnpm prisma generate          # Generate Prisma Client
pnpm prisma studio            # Open Prisma Studio GUI
```

## 🤝 Contributing

This is an MVP (Minimum Viable Product). Future enhancements could include:

- Billing and subscription management
- Style learning (AI learns user preferences)
- Batch processing
- Export to various formats
- Team collaboration features
- Analytics and insights

## 📄 License

MIT

## 👤 Author

**whaubrand**
- Email: whau@whau.ee
- GitHub: [@whaubrand](https://github.com/whaubrand)

---

Built with ❤️ using Claude Code