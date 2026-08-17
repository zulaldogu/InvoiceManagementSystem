# Invoice Management System

A full-stack, multi-company invoice management application developed as an internship project. It provides secure customer, product, invoice, company, user, role, and profile management through a Turkish administration interface.

## Features

- JWT-based authentication
- Argon2 password hashing
- Company-based data isolation
- Super administrator, company manager, and limited viewer accounts
- Role and profile-based authorization
- Company and user management
- Customer and product/service CRUD operations
- Invoice creation, editing, deletion, and detail views
- Invoice line creation, updating, and removal
- KDV and ÖTV calculations
- Backend-controlled invoice totals
- Real-data dashboard and recent invoices
- Field-specific search and filtering
- Responsive sidebar, tables, forms, and modals
- Docker Compose setup with persistent SQLite storage
- Repeatable and idempotent demo data

## Technology Stack

### Backend

- Python 3.13
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite
- Alembic
- PyJWT
- pwdlib with Argon2
- Uvicorn

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

### Infrastructure

- Docker
- Docker Compose
- Git and GitHub

## Authorization Model

Authorization follows this relationship:

```text
User -> UserProfile -> Profile -> ProfileRole -> Role
```

The authenticated user's company is obtained from the JWT session. Client-provided company identifiers are not trusted for tenant operations.

Main application permissions include:

- `VIEW_CUSTOMERS`
- `MANAGE_CUSTOMERS`
- `MANAGE_PRODUCTS`
- `VIEW_INVOICES`
- `MANAGE_INVOICES`

## Running with Docker

Docker Desktop must be installed and running.

Clone the repository:

```powershell
git clone https://github.com/zulaldogu/InvoiceManagementSystem.git
Set-Location InvoiceManagementSystem
```

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Build and start the services:

```powershell
docker compose up --build -d
```

Check container status:

```powershell
docker compose ps
```

Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

Docker startup automatically:

- Applies Alembic migrations
- Creates secure demo accounts
- Creates repeatable company-specific demo records
- Starts the FastAPI and Next.js services

## Demo Accounts

| Account | Username | Password | Access |
|---|---|---|---|
| Super Administrator | `admin` | `DemoAdmin123!` | System-wide administration |
| Company Manager | `companymanager` | `CompanyManager123!` | Company operational management |
| Limited Viewer | `companyviewer` | `CompanyViewer123!` | Restricted company viewing |

The login screen also displays these local demo credentials for evaluation.

Demo passwords and the example JWT secret are intended only for local development. They must be replaced before production use.

## Demo Records

A clean Docker installation creates consistent, company-isolated sample records.

The administrator company receives:

- 6 customers
- 8 products/services
- 7 invoices

The company demo account receives:

- 5 customers
- 6 products/services
- 5 invoices

Running the seed process again does not duplicate these records.

## Database Persistence

SQLite data is stored in the named Docker volume:

```text
invoice-management-data
```

Stop the application without deleting data:

```powershell
docker compose down
```

Restart:

```powershell
docker compose up -d
```

Delete the containers and database volume only when a complete data reset is intended:

```powershell
docker compose down -v
```

Then create a clean installation:

```powershell
docker compose up --build -d
```

> Warning: `docker compose down -v` permanently removes the Docker database volume.

## Environment Configuration

The `.env.example` file documents the required local settings:

- JWT secret and expiration time
- Demo account credentials
- Frontend API address
- Allowed CORS origins

The real `.env` file is ignored by Git.

For access from another device on the same local network, update the API URL and CORS origins with the host computer's local IPv4 address, then rebuild the services.

## Database Migrations

Docker applies migrations automatically. For manual verification:

```powershell
docker compose exec backend python -m alembic current
docker compose exec backend python -m alembic heads
docker compose exec backend python -m alembic check
```

The current migration chain includes:

- Initial database schema
- Company tenancy foundation
- Invoice KDV and ÖTV fields

## Verification Commands

Frontend lint:

```powershell
npm.cmd --prefix frontend run lint
```

Frontend production build:

```powershell
npm.cmd --prefix frontend run build
```

Backend Python syntax check:

```powershell
Get-ChildItem backend -Filter *.py -Recurse |
  Where-Object {
    $_.FullName -notmatch '\\venv\\|\\__pycache__\\'
  } |
  ForEach-Object {
    python -m py_compile $_.FullName
  }
```

Docker logs:

```powershell
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

Git whitespace check:

```powershell
git diff --check
```

## Main Application Pages

- `/login` — Authentication
- `/` — Dashboard
- `/customers` — Customer management
- `/customers/[customerId]` — Customer detail
- `/products` — Product and service management
- `/products/[productId]` — Product detail
- `/invoices` — Invoice management
- `/invoices/new` — Invoice creation
- `/invoices/[invoiceId]` — Invoice detail
- `/invoices/[invoiceId]/edit` — Invoice and line editing
- `/companies` — Company management or current company information
- `/users` — User management
- `/authorization` — Role and profile management

Available pages, menu items, and operations change according to the authenticated user's permissions.

## Validation and Security

The application includes controls for:

- Missing or invalid JWT tokens
- Inactive users and companies
- Missing permissions
- Cross-company record access
- Duplicate product codes, tax numbers, and invoice numbers
- Deleting referenced customers or products
- Invalid invoice lines and tax rates
- Profile and role assignment integrity
- Protected frontend routes and permission-based actions

Common API responses include `401`, `403`, `404`, and `409`.

## Testing Status

The following checks were completed successfully:

- Authentication and logout flows
- Super administrator, company manager, and limited viewer scenarios
- Company isolation
- Customer and product CRUD
- Invoice and invoice-line workflows
- KDV and ÖTV calculations
- Dashboard updates
- Role and profile assignment protection
- Direct URL and menu visibility controls
- Desktop, tablet, and mobile layouts
- Keyboard and Escape-key interactions
- Clean Docker installation and persistent volume behavior
- Frontend lint and production build
- Backend syntax and Alembic checks

## Known Development Notes

- Automated pytest, frontend component tests, and CI workflows are not included; final validation was performed through syntax, build, API, Docker, and manual end-to-end tests.
- The JWT access token is stored in `sessionStorage`, which is acceptable for this local internship demonstration. Production deployment should evaluate HttpOnly cookies and refresh-token handling.
- Demo credentials shown on the login page must be removed in production.
- Dependency audit warnings should be reviewed before a production deployment. Avoid forced dependency upgrades without regression testing.

## Project Status

The planned internship scope has been completed. The application is ready for local Docker-based evaluation and final supervisor review.