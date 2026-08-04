# Invoice Management System

This project is a full-stack web application developed to manage customer, product, invoice, and authorization processes for companies. The system is being developed as an internship project. The current phase focuses on building a modular backend API before moving to the frontend development phase.

## System Architecture

The project is designed with three main layers:

- **Frontend:** Developed with Next.js, React, TypeScript, and Tailwind CSS.
- **Backend:** Developed with FastAPI as a RESTful API.
- **Database:** Designed with a relational database structure using SQLite and SQLAlchemy ORM.

## Technologies Used

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- Uvicorn
- Git and GitHub
- Swagger UI
- Next.js
- React
- TypeScript
- Tailwind CSS
- Docker and Docker Compose

## Backend Structure

The backend is organized with a modular structure. Database models, schemas, authorization helpers, and routers are separated to keep the project maintainable.

Main backend components:

- `main.py`: Starts the FastAPI application and includes API routers.
- `database.py`: Contains database connection, session, and base configuration.
- `models.py`: Contains SQLAlchemy ORM models.
- `schemas.py`: Contains Pydantic request and response schemas.
- `auth.py`: Contains role-based authorization helper functions.
- `routers/`: Contains separate API route files for each module.

## Database Tables

The database currently includes the following tables:

- `Users`: Stores system users.
- `Customer`: Stores customer account information.
- `Product`: Stores products or services used in invoice lines.
- `Invoice`: Stores invoice header information.
- `InvoiceLine`: Stores invoice line/detail records.
- `Role`: Stores authorization roles.
- `Profile`: Stores user profiles.
- `ProfileRole`: Connects profiles with roles.
- `UserProfile`: Connects users with profiles.

## Authorization Model

The system uses a role/profile based authorization structure.

Authorization flow:

```text
User -> UserProfile -> Profile -> ProfileRole -> Role
```

A user can be assigned to a profile, and a profile can contain multiple roles. API operations are controlled according to the roles assigned to the user's profile.

Example roles:

- `MANAGE_PRODUCTS`
- `MANAGE_CUSTOMERS`
- `VIEW_CUSTOMERS`
- `MANAGE_INVOICES`
- `VIEW_INVOICES`

Example profiles:

- `ADMIN`
- `ACCOUNTANT`

The admin profile can manage products, customers, and invoices. The accountant profile can access invoice-related operations depending on the assigned roles.

## API Modules

The backend currently includes the following API modules:

- Users
- Customers
- Products
- Roles
- Profiles
- Profile Roles
- User Profiles
- Invoices
- Invoice Lines

## Invoice Workflow

The invoice workflow supports invoice headers and invoice line records.

Implemented invoice features:

- Creating invoice records
- Listing invoices
- Viewing invoice details with related line items
- Updating invoice records
- Deleting invoice records
- Creating invoice lines by selecting existing products
- Automatically retrieving product name and product price for invoice lines
- Automatically recalculating invoice total amount
- Deleting related invoice lines when an invoice is deleted

## Validation and Error Handling

The backend API includes validation and controlled error responses for important scenarios:

- Creating an invoice with a non-existing customer returns `404 Customer not found`.
- Creating an invoice line with a non-existing product returns `404 Product not found`.
- Performing an authorized operation with a non-existing user returns `404 User not found`.
- Performing an operation without the required role returns `403 Forbidden`.
- Requesting non-existing invoice or invoice line records returns `404`.

## Running with Docker

Docker Desktop must be installed and running before starting the application.

Clone the repository and enter the project directory:

```powershell
git clone https://github.com/zulaldogu/InvoiceManagementSystem.git
cd InvoiceManagementSystem
```

Create the local environment file from the provided example:

```powershell
Copy-Item .env.example .env
```

The `.env` file contains local JWT and demo login settings and is ignored by Git. The example values are intended only for local development and must be changed before a production deployment.

Build and start the backend and frontend services:

```powershell
docker compose up --build -d
```

Docker Compose automatically:

- Applies all Alembic database migrations
- Creates the demo company
- Creates an Argon2-hashed administrator account
- Creates repeatable product, customer, invoice, role, and profile data
- Starts the FastAPI and Next.js services

Open the following addresses:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

Demo login credentials:

- Username: `admin`
- Password: `DemoAdmin123!`

Use the **Authorize** button in Swagger to obtain and use a JWT access token.

The SQLite database is stored in the named Docker volume `invoice-management-data`. Restarting the containers does not duplicate the demo records.

Check the services:

```powershell
docker compose ps
```

View backend logs:

```powershell
docker compose logs backend
```

Stop the application without deleting its data:

```powershell
docker compose down
```

## Running the Backend

Create `.env` from the example file if it does not already exist:

```powershell
Copy-Item .env.example .env
```

Go to the backend directory:

```powershell
cd backend
```

Install the dependencies and apply the migrations:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m alembic upgrade head
```

Start FastAPI by loading the environment variables:

```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --reload --env-file ..\.env
```

Swagger UI is available at:

```text
http://127.0.0.1:8000/docs
```

## Current Development Status

The backend API and the first frontend development phase have been completed. The application currently provides Turkish dashboard, product, customer, invoice list, and invoice detail pages connected to the FastAPI backend. Backend and frontend services can be built and started together with Docker Compose. A persistent SQLite volume and repeatable demo data are included for testing.