# AI-Powered Product Intelligence System

A full-stack application for collecting and analyzing startup and project information, built with the MERN stack and PostgreSQL.

## 🚀 Features

- **Project Submission**: Submit startup/project information through a user-friendly form
- **Data Storage**: Secure storage in PostgreSQL database
- **Validation**: Client-side and server-side validation
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Extensible Architecture**: Modular design ready for AI integration

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd product-intelligence
```

### 2. Database Setup

```bash
# Create the database
psql -U postgres -f database/schema.sql
```

### 3. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### 4. Frontend Setup

```bash
cd client
npm install
npm run dev
```

### 5. ML Service Setup (optional Docker service)

```bash
cd ml_service
docker compose up -d --build
```

The ML service is exposed at `http://localhost:8001`. The backend reads its
model files from the root-level `ml_service/ml_model` directory.

## 🏗️ Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── utils/             # Utility functions
├── ml_service/             # Python ML service and model files
│   ├── ml_model/            # Trained models and inference code
│   ├── Dockerfile
│   └── docker-compose.yml
└── database/              # Database schemas
```

## 🎨 Technologies

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express.js
- PostgreSQL
- Express Validator
- Helmet (Security)

### Future Integrations

- LangChain
- OpenAI
- AI Agents
- Vector Databases
- RAG (Retrieval-Augmented Generation)

## 🔒 Environment Variables

### Server (.env)

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=product_intelligence
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Client (.env)

```
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```
