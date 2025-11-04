# FINTOP 

A full-stack web application that simulates a UPI payment system, demonstrating real-time money transfers between users through a MySQL database.

## Overview

FINTOP is a demonstration project that showcases the fundamental mechanics of a UPI payment system. It allows users to:
- Register with bank account details
- Send and receive money using unique Fintop IDs
- Request payments from other users
- Track transaction history
- Earn rewards based on spending thresholds

## Features

### User Management
- User registration with multi-step form
- Authentication with email and password
- Profile editing
- Unique Fintop ID generation

### Payment Operations
- Send money to other users via Fintop ID
- Request money from contacts
- PIN-based transaction verification
- Balance updates
- Transaction success/failure handling

### Transaction History
- View all past transactions
- Filter by date, amount, or type
- Detailed transaction receipts

### Rewards System
- Four-tier badge system (Bronze, Silver, Gold, Diamond)
- Spending-based reward unlocking
- Automatic balance crediting on badge claims
- Progress tracking towards next tier

### Additional Features
- QR code generation for Fintop ID
- Contact management with search and filtering
- Responsive UI with animations
- Persistent login sessions

## Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **Redux Persist** - State persistence
- **React Router** - Navigation
- **Lottie React** - Animations
- **Framer Motion** - UI animations
- **Three.js & Vanta.js** - 3D effects
- **QRCode** - QR code generation
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Database
- **MySQL** - Relational database

## Usage Guide

### Getting Started

1. **Sign Up**
   - Click "Sign Up" on the landing page
   - Enter username, email, and password
   
   <img width="1919" alt="Sign Up Page" src="https://github.com/user-attachments/assets/e1fc562d-9823-44ac-b6ac-701b8c35cf19" />

   - Complete the 4-step registration form:
   
     **Step 1: Description**
     
     <img width="1919" alt="Step 1 - Description" src="https://github.com/user-attachments/assets/e2ce4704-1001-4ae4-919d-a23971fe1673" />
   
     **Step 2: Bank account details**
     
     <img width="1919" alt="Step 2 - Bank Details" src="https://github.com/user-attachments/assets/0ed6d0d2-9174-47e2-b74b-793cdd79dd83" />
   
     **Step 3: Personal information**
     
     <img width="1919" alt="Step 3 - Personal Info" src="https://github.com/user-attachments/assets/ac2b228c-15c4-4d77-9c9c-e7955a7904cf" />
   
     **Step 4: Set 4-digit Fintop PIN**
     
     <img width="1919" alt="Step 4 - Fintop PIN" src="https://github.com/user-attachments/assets/bd4cd03e-abf3-4198-9034-33bc667546d6" />

2. **Sign In**
   - Enter your registered email and password
   - You'll be redirected to the home dashboard

   <img width="1919" alt="Sign In Page" src="https://github.com/user-attachments/assets/c360a4d9-9867-4f22-aeb1-7e87c5469378" />

### Using the Application

#### Home Dashboard
- View your Fintop ID and account balance
- Click on Fintop ID to view/download/share QR code
- Edit your profile information
- Copy Fintop ID or balance with one click

<img width="1916" alt="Home Dashboard" src="https://github.com/user-attachments/assets/52f28315-65e6-4dbb-b5ab-f6f7c37c695f" />

#### Making Payments
1. Navigate to "Payment" from the sidebar
2. Enter recipient's Fintop ID
3. Enter amount
4. Click "Pay"
5. Enter your 4-digit PIN
6. Transaction will be processed

#### Requesting Money
1. Navigate to "Payment" from the sidebar
2. Enter payer's Fintop ID
3. Enter amount
4. Click "Request"
5. Enter your 4-digit PIN
6. Request will be sent

<img width="1919" alt="Payment Page" src="https://github.com/user-attachments/assets/a6d5d8e3-9829-4159-946b-bd7bdba0edaa" />

#### Managing Contacts
- View all registered users
- Search by name or phone number
- Filter contacts (Ascending/Descending/Pending Payments)
- Click on any contact to initiate payment

<img width="1919" alt="Contacts Page" src="https://github.com/user-attachments/assets/0420c282-6d2c-4e42-8937-e693bafbe32e" />

#### Transaction History
- View all your transactions
- Filter by date (First/Recent) or amount
- Click on any transaction for detailed receipt
- See sent (red) vs received (green) transactions

<img width="1919" alt="Transaction History" src="https://github.com/user-attachments/assets/87cb3973-7c88-449c-8f28-79d8ece4ee14" />

<img width="426" alt="Transaction Details" src="https://github.com/user-attachments/assets/11b69f7e-0b57-4847-8c7c-12b34d860414" />

#### Rewards
- Track your spending progress
- View available badges (Bronze, Silver, Gold, Diamond)
- Claim rewards when thresholds are met
- Rewards are automatically credited to your account

<img width="1919" alt="Rewards Page" src="https://github.com/user-attachments/assets/dfe2cec3-5116-458f-b14a-cbe3905f9a5c" />

## Project Structure

```
Fintop/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection configuration
│   ├── routes/
│   │   └── userRoutes.js         # API route handlers
│   ├── node_modules/
│   ├── .env                      # Environment variables
│   ├── server.js                 # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── assets/               # Animation JSON files
│   │       ├── animation1.json
│   │       ├── animation3.json
│   │       ├── animation4.json
│   │       ├── Bronze.json
│   │       ├── Diamond.json
│   │       ├── Gold.json
│   │       ├── Silver.json
│   │       ├── insufficientamount.json
│   │       ├── payment-animation.json
│   │       ├── request-animation.json
│   │       └── success-animation.json
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Multiform.jsx     # Multi-step registration form
│   │   │   ├── Multiform.css
│   │   │   ├── SignInSignUp.jsx  # Authentication component
│   │   │   └── SignInSignUp.css
│   │   │
│   │   ├── website/
│   │   │   ├── Home.jsx          # Dashboard/home page
│   │   │   ├── Home.css
│   │   │   ├── Payment.jsx       # Payment & request interface
│   │   │   ├── Payment.css
│   │   │   ├── Rewards.jsx       # Badge rewards system
│   │   │   ├── Rewards.css
│   │   │   ├── Contacts.jsx      # Contact list
│   │   │   ├── Contacts.css
│   │   │   ├── TransactionHistory.jsx  # Transaction records
│   │   │   ├── TransactionHistory.css
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   └── Sidebar.css
│   │   │
│   │   ├── App.jsx               # Main app component with routing
│   │   ├── authSlice.js          # Redux authentication slice
│   │   ├── store.js              # Redux store configuration
│   │   ├── main.jsx              # React entry point
│   │   └── index.html
│   │
│   ├── node_modules/
│   └── package.json
│
└── database/
    └── schema.sql                # MySQL database schema and sample data
```

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL** (v8.0 or higher)
- **MySQL Command Line Client** or **MySQL Workbench**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/rohankallummal/Fintop.git
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Database Setup

### 1. Start MySQL Server

Ensure your MySQL server is running.

### 2. Create Database and Tables

Open MySQL Command Line Client or MySQL Workbench and execute the database schema:

```bash
mysql -u root -p < database/schema.sql
```

Or manually:

1. Open MySQL Command Line Client
2. Copy the contents of `database/schema.sql`
3. Paste and execute in the MySQL client

The schema will:
- Create a database named `dbms_mini`
- Create all necessary tables
- Set up triggers for automatic Fintop ID generation, transaction processing, and reward crediting
- Insert sample user data (20 users with bank accounts)

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dbms_mini
```

Replace `your_mysql_password` with your actual MySQL root password.

## Running the Application

### 1. Start the Backend Server

```bash
cd backend
node server.js
```

The server will run on `http://localhost:5000`

### 2. Start the Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm run dev
```

The application will run on `http://localhost:5173` (or another port shown in terminal)

### 3. Access the Application

Open your browser and navigate to the frontend URL
