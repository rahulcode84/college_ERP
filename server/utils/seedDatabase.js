const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const {
  User,
  Department,
  Student,
  Faculty,
  Course,
  Book,
  Notice
} = require('../models');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await User.deleteMany({});
      await Department.deleteMany({});
      await Student.deleteMany({});
      await Faculty.deleteMany({});
      await Course.deleteMany({});
      await Book.deleteMany({});
      await Notice.deleteMany({});
      console.log('🗑️  Cleared existing data');
    }

    // Create Departments
    console.log('📚 Creating departments...');
    const departments = await Department.create([
      {
        name: 'Computer Science and Engineering',
        code: 'CSE',
        description: 'Department of Computer Science and Engineering',
        established: new Date('2005-07-01'),
        contactInfo: {
          email: 'cse@college.edu',
          phone: '+91-1234567890',
          office: 'CSE Block, Room 101'
        }
      },
      {
        name: 'Electronics and Communication Engineering',
        code: 'ECE',
        description: 'Department of Electronics and Communication Engineering',
        established: new Date('2003-07-01'),
        contactInfo: {
          email: 'ece@college.edu',
          phone: '+91-1234567891',
          office: 'ECE Block, Room 201'
        }
      },
      {
        name: 'Mechanical Engineering',
        code: 'MECH',
        description: 'Department of Mechanical Engineering',
        established: new Date('2000-07-01'),
        contactInfo: {
          email: 'mech@college.edu',
          phone: '+91-1234567892',
          office: 'Mech Block, Room 301'
        }
      },
      {
        name: 'Civil Engineering',
        code: 'CIVIL',
        description: 'Department of Civil Engineering',
        established: new Date('1998-07-01'),
        contactInfo: {
          email: 'civil@college.edu',
          phone: '+91-1234567893',
          office: 'Civil Block, Room 401'
        }
      }
    ]);

    // Create Admin User
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@college.edu',
      password: 'admin123456',
      role: 'admin',
      phone: '+91-9876543210',
      isActive: true,
      isEmailVerified: true
    });

    // Create Faculty Users
    console.log('👨‍🏫 Creating faculty users...');
    const facultyUsers = await User.create([
      {
        firstName: 'Dr. Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.kumar@college.edu',
        password: 'faculty123',
        role: 'faculty',
        phone: '+91-9876543211',
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Prof. Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@college.edu',
        password: 'faculty123',
        role: 'faculty',
        phone: '+91-9876543212',
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Dr. Amit',
        lastName: 'Patel',
        email: 'amit.patel@college.edu',
        password: 'faculty123',
        role: 'faculty',
        phone: '+91-9876543213',
        isActive: true,
        isEmailVerified: true
      }
    ]);

    // Create Faculty profiles
    console.log('📋 Creating faculty profiles...');
    const facultyProfiles = await Faculty.create([
      {
        user: facultyUsers[0]._id,
        employeeId: 'FAC001',
        department: departments[0]._id, // CSE
        designation: 'Professor',
        joiningDate: new Date('2010-07-01'),
        qualifications: [
          {
            degree: 'Ph.D. Computer Science',
            institution: 'IIT Delhi',
            year: 2008,
            specialization: 'Machine Learning'
          },
          {
            degree: 'M.Tech Computer Science',
            institution: 'NIT Trichy',
            year: 2004
          }
        ],
        experience: {
          total: 14
        },
        office: {
          roomNumber: 'CSE-101',
          building: 'CSE Block',
          phone: 'Ext: 2345'
        }
      },
      {
        user: facultyUsers[1]._id,
        employeeId: 'FAC002',
        department: departments[1]._id, // ECE
        designation: 'Associate Professor',
        joiningDate: new Date('2012-08-01'),
        qualifications: [
          {
            degree: 'Ph.D. Electronics',
            institution: 'IISc Bangalore',
            year: 2010,
            specialization: 'Signal Processing'
          }
        ],
        experience: {
          total: 12
        }
      },
      {
        user: facultyUsers[2]._id,
        employeeId: 'FAC003',
        department: departments[0]._id, // CSE
        designation: 'Assistant Professor',
        joiningDate: new Date('2015-07-15'),
        qualifications: [
          {
            degree: 'M.Tech Computer Science',
            institution: 'BITS Pilani',
            year: 2013,
            specialization: 'Software Engineering'
          }
        ],
        experience: {
          total: 9
        }
      }
    ]);

    // Update department heads
    await Department.findByIdAndUpdate(departments[0]._id, { head: facultyProfiles[0]._id });
    await Department.findByIdAndUpdate(departments[1]._id, { head: facultyProfiles[1]._id });

    // Create Student Users
    console.log('👨‍🎓 Creating student users...');
    const studentUsers = await User.create([
      {
        firstName: 'Arjun',
        lastName: 'Reddy',
        email: 'arjun.reddy@student.college.edu',
        password: 'student123',
        role: 'student',
        phone: '+91-9876543220',
        dateOfBirth: new Date('2002-05-15'),
        gender: 'male',
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Sneha',
        lastName: 'Gupta',
        email: 'sneha.gupta@student.college.edu',
        password: 'student123',
        role: 'student',
        phone: '+91-9876543221',
        dateOfBirth: new Date('2003-03-22'),
        gender: 'female',
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'vikram.singh@student.college.edu',
        password: 'student123',
        role: 'student',
        phone: '+91-9876543222',
        dateOfBirth: new Date('2002-11-08'),
        gender: 'male',
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'Ananya',
        lastName: 'Nair',
        email: 'ananya.nair@student.college.edu',
        password: 'student123',
        role: 'student',
        phone: '+91-9876543223',
        dateOfBirth: new Date('2003-01-12'),
        gender: 'female',
        isActive: true,
        isEmailVerified: true
      }
    ]);

    // Create Student profiles
    console.log('📚 Creating student profiles...');
    const studentProfiles = await Student.create([
      {
        user: studentUsers[0]._id,
        studentId: 'CSE21001',
        rollNumber: '21CSE001',
        department: departments[0]._id, // CSE
        batch: '2021-2025',
        semester: 6,
        academicYear: '2024-25',
        admissionDate: new Date('2021-07-15'),
        guardian: {
          father: {
            name: 'Ramesh Reddy',
            occupation: 'Business',
            phone: '+91-9876543230',
            email: 'ramesh.reddy@email.com'
          },
          mother: {
            name: 'Lakshmi Reddy',
            occupation: 'Teacher',
            phone: '+91-9876543231'
          }
        },
        cgpa: 8.5,
        totalCredits: 140
      },
      {
        user: studentUsers[1]._id,
        studentId: 'ECE21002',
        rollNumber: '21ECE002',
        department: departments[1]._id, // ECE
        batch: '2021-2025',
        semester: 6,
        academicYear: '2024-25',
        admissionDate: new Date('2021-07-15'),
        guardian: {
          father: {
            name: 'Suresh Gupta',
            occupation: 'Engineer',
            phone: '+91-9876543232'
          }
        },
        cgpa: 9.1,
        totalCredits: 138
      },
      {
        user: studentUsers[2]._id,
        studentId: 'CSE22003',
        rollNumber: '22CSE003',
        department: departments[0]._id, // CSE
        batch: '2022-2026',
        semester: 4,
        academicYear: '2024-25',
        admissionDate: new Date('2022-07-20'),
        guardian: {
          father: {
            name: 'Ravi Singh',
            occupation: 'Doctor',
            phone: '+91-9876543233'
          }
        },
        cgpa: 8.8,
        totalCredits: 90
      },
      {
        user: studentUsers[3]._id,
        studentId: 'ECE22004',
        rollNumber: '22ECE004',
        department: departments[1]._id, // ECE
        batch: '2022-2026',
        semester: 4,
        academicYear: '2024-25',
        admissionDate: new Date('2022-07-20'),
        guardian: {
          father: {
            name: 'Krishnan Nair',
            occupation: 'Banker',
            phone: '+91-9876543234'
          }
        },
        cgpa: 9.3,
        totalCredits: 92
      }
    ]);

    // Create Sample Courses
    console.log('📖 Creating courses...');
    const courses = await Course.create([
      {
        courseCode: 'CSE301',
        courseName: 'Database Management Systems',
        description: 'Introduction to database concepts, SQL, and database design',
        department: departments[0]._id,
        semester: 6,
        credits: 4,
        type: 'theory',
        faculty: {
          coordinator: facultyProfiles[0]._id,
          instructors: [facultyProfiles[0]._id]
        },
        academicYear: '2024-25',
        syllabus: {
          units: [
            {
              unitNumber: 1,
              title: 'Introduction to DBMS',
              topics: ['Database concepts', 'DBMS architecture', 'Data models'],
              hours: 10
            },
            {
              unitNumber: 2,
              title: 'SQL and Relational Algebra',
              topics: ['SQL basics', 'Joins', 'Subqueries'],
              hours: 12
            }
          ]
        }
      },
      {
        courseCode: 'ECE302',
        courseName: 'Digital Signal Processing',
        description: 'Fundamentals of digital signal processing',
        department: departments[1]._id,
        semester: 6,
        credits: 4,
        type: 'theory',
        faculty: {
          coordinator: facultyProfiles[1]._id,
          instructors: [facultyProfiles[1]._id]
        },
        academicYear: '2024-25'
      },
      {
        courseCode: 'CSE201',
        courseName: 'Data Structures and Algorithms',
        description: 'Fundamental data structures and algorithmic techniques',
        department: departments[0]._id,
        semester: 4,
        credits: 4,
        type: 'theory',
        faculty: {
          coordinator: facultyProfiles[2]._id,
          instructors: [facultyProfiles[2]._id]
        },
        academicYear: '2024-25'
      }
    ]);

    // Create Sample Books
    console.log('📚 Creating library books...');
    await Book.create([
      {
        isbn: '978-0123456789',
        title: 'Database System Concepts',
        author: ['Abraham Silberschatz', 'Henry F. Korth'],
        publisher: 'McGraw-Hill',
        edition: '7th',
        category: 'Computer Science',
        subject: 'Database Management',
        totalCopies: 10,
        availableCopies: 8,
        location: {
          shelf: 'CS-DB-01',
          rack: 'A1',
          floor: '2nd Floor'
        },
        publishedYear: 2019,
        pages: 1376,
        price: 850
      },
      {
        isbn: '978-0134685991',
        title: 'Computer Networking: A Top-Down Approach',
        author: ['James Kurose', 'Keith Ross'],
        publisher: 'Pearson',
        edition: '8th',
        category: 'Computer Science',
        subject: 'Computer Networks',
        totalCopies: 15,
        availableCopies: 12,
        location: {
          shelf: 'CS-NET-01',
          rack: 'B2',
          floor: '2nd Floor'
        },
        publishedYear: 2021,
        pages: 864,
        price: 920
      },
      {
        isbn: '978-0262033848',
        title: 'Introduction to Algorithms',
        author: ['Thomas H. Cormen', 'Charles E. Leiserson'],
        publisher: 'MIT Press',
        edition: '3rd',
        category: 'Computer Science',
        subject: 'Algorithms',
        totalCopies: 20,
        availableCopies: 18,
        location: {
          shelf: 'CS-ALG-01',
          rack: 'A3',
          floor: '2nd Floor'
        },
        publishedYear: 2009,
        pages: 1312,
        price: 1200
      }
    ]);

    // Create Sample Notices
    console.log('📢 Creating notices...');
    await Notice.create([
      {
        title: 'Mid-Semester Examination Schedule',
        content: 'The mid-semester examinations for all departments will be conducted from March 15-22, 2025. Students are advised to check their individual timetables on the student portal.',
        targetAudience: ['students', 'faculty'],
        category: 'examination',
        priority: 'high',
        publishedBy: adminUser._id,
        status: 'published',
        expiryDate: new Date('2025-03-25')
      },
      {
        title: 'Library New Books Arrival',
        content: 'New collection of books on Artificial Intelligence and Machine Learning has arrived. Students can check the availability on the library portal.',
        targetAudience: ['students', 'faculty'],
        category: 'academic',
        priority: 'medium',
        publishedBy: adminUser._id,
        status: 'published',
        expiryDate: new Date('2025-08-31')
      },
      {
        title: 'College Annual Day Celebration',
        content: 'College Annual Day will be celebrated on March 30, 2025. All students and faculty are invited to participate in various cultural events.',
        targetAudience: ['all'],
        category: 'event',
        priority: 'medium',
        publishedBy: adminUser._id,
        status: 'published',
        isPinned: true,
        expiryDate: new Date('2025-04-01')
      }
    ]);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Faculty: ${facultyProfiles.length}`);
    console.log(`- Students: ${studentProfiles.length}`);
    console.log(`- Courses: ${courses.length}`);
    console.log(`- Books: 3`);
    console.log(`- Notices: 3`);
    console.log('\n🔑 Default Login Credentials:');
    console.log('Admin: admin@college.edu / admin123456');
    console.log('Faculty: rajesh.kumar@college.edu / faculty123');
    console.log('Student: arjun.reddy@student.college.edu / student123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Run seeder
const runSeeder = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

// Check if script is run directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedData };
