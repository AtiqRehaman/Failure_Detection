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
└── database/              # Database schemas
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects | Create a new project |
| GET | /api/projects | Get all projects |
| GET | /api/projects/:id | Get a specific project |
| PUT | /api/projects/:id | Update a project |
| DELETE | /api/projects/:id | Delete a project |

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

### Development Mode

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Production Mode

```bash
# Build frontend
cd client
npm run build

# Start backend
cd server
npm start
```

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built for the AI-Powered Product Intelligence System project
- Designed for future AI and LangChain integration
- Production-ready architecture
```
