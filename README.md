# College ERP System

A comprehensive Enterprise Resource Planning system designed specifically for educational institutions. Built with modern web technologies to manage students, faculty, courses, and administrative operations efficiently.

##  Features

###  Multi-Role System
- **Students**: Profile management, attendance tracking, grade viewing, fee payments
- **Faculty**: Class management, attendance marking, grade entry, student monitoring
- **Administrators**: User management, system configuration, analytics, reporting

###  Core Modules
- **Authentication & Authorization**: JWT-based secure login with role-based access
- **Student Management**: Complete student lifecycle management
- **Faculty Portal**: Tools for teachers and staff
- **Course Management**: Curriculum and class scheduling
- **Attendance System**: Real-time attendance tracking
- **Fee Management**: Payment processing and financial tracking
- **Library System**: Book catalog and borrowing management
- **Notice Board**: Announcements and notifications
- **Analytics & Reports**: Data-driven insights and reporting

##  Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email notifications

### Frontend
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Chart.js** - Data visualization

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/college-erp-system.git
   cd college-erp-system
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # For local MongoDB
   mongod
   
   # Or use MongoDB Atlas (update MONGODB_URI in .env)
   ```

5. **Run the backend server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000


## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Students
- `GET /api/students` - Get all students (Admin/Faculty)
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update student profile
- `GET /api/students/attendance` - Get attendance records
- `GET /api/students/grades` - Get academic records

### Faculty
- `GET /api/faculty` - Get all faculty (Admin)
- `GET /api/faculty/profile` - Get faculty profile
- `PUT /api/faculty/profile` - Update faculty profile
- `GET /api/faculty/classes` - Get assigned classes
- `POST /api/faculty/attendance` - Mark attendance
