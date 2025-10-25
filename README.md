# 🎓 College ERP System

A comprehensive Enterprise Resource Planning system designed specifically for educational institutions. Built with modern web technologies to manage students, faculty, courses, and administrative operations efficiently.

## 🚀 Features

### 👥 Multi-Role System
- **Students**: Profile management, attendance tracking, grade viewing, fee payments
- **Faculty**: Class management, attendance marking, grade entry, student monitoring
- **Administrators**: User management, system configuration, analytics, reporting

### 📚 Core Modules
- **Authentication & Authorization**: JWT-based secure login with role-based access
- **Student Management**: Complete student lifecycle management
- **Faculty Portal**: Tools for teachers and staff
- **Course Management**: Curriculum and class scheduling
- **Attendance System**: Real-time attendance tracking
- **Fee Management**: Payment processing and financial tracking
- **Library System**: Book catalog and borrowing management
- **Notice Board**: Announcements and notifications
- **Analytics & Reports**: Data-driven insights and reporting

## 🛠️ Tech Stack

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

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Git

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

## 📁 Project Structure

```
college-erp-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── utils/         # Helper functions
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Business logic
│   ├── models/           # Database schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── config/           # Configuration files
│   ├── utils/            # Helper utilities
│   └── package.json
├── docs/                 # Documentation
├── .env.example          # Environment template
└── README.md
```

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

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Manage users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## 🚀 Deployment

### Backend Deployment (Render/Railway)

1. **Prepare for deployment**
   ```bash
   # Ensure all environment variables are set
   # Update MONGODB_URI to use MongoDB Atlas
   # Set NODE_ENV to 'production'
   ```

2. **Deploy to Render**
   - Connect your GitHub repository
   - Set environment variables
   - Deploy automatically on push

### Frontend Deployment (Vercel/Netlify)

1. **Build the project**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### API Testing
- Import the Postman collection from `/docs/postman_collection.json`
- Test all endpoints with different user roles

## 🔒 Security Features

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers for Express
- **Data Sanitization**: Prevents NoSQL injection and XSS

## 📊 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient data loading with pagination
- **Compression**: Gzip compression for responses
- **Caching**: Strategic caching for improved performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@college-erp.com
- Documentation: [Wiki](https://github.com/yourusername/college-erp-system/wiki)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time chat system
- [ ] AI-powered analytics
- [ ] Advanced reporting dashboard
- [ ] Integration with external systems
- [ ] Video conferencing integration
- [ ] Mobile push notifications

---

**Built with ❤️ for educational institutions**