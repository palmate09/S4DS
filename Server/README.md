# AI Data Science Club Backend

This is the backend server for the AI Data Science Club website, now using MySQL database with ES6 modules.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
1. Install MySQL on your system
2. Create a database named `ai_datascience_club`
3. Create a `.env` file in the Server directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_datascience_club
DB_PORT=3306

# Email Configuration
email=your_email@gmail.com
Passkey=your_app_password

# Email Verification API
APIKEy=your_abstract_api_key
```

### 3. Run the Server
```bash
npm run dev
```

The server will start on `http://127.0.0.1:8000`

## API Endpoints

- `GET /App/Get` - Test endpoint
- `POST /App/FormData` - Handle form submissions

## Database Schema

The `form_submissions` table will be automatically created with the following structure:
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), NOT NULL)
- `message` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

## Changes Made

- Converted from CommonJS to ES6 modules
- Replaced MongoDB/Mongoose with MySQL
- Added proper database connection pooling
- Updated all imports/exports to use ES6 syntax
- Added database initialization script
- Improved error handling and logging
