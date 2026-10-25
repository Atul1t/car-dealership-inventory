# AutoVault: Car Dealership Inventory System

A full-stack inventory system for a car dealership, built test-first for the Incubyte TDD kata. It has a **FastAPI + PostgreSQL** REST API with JWT authentication and a **React + Tailwind** single-page app. Customers browse, search and buy cars. Admins manage the catalogue and restock it.

![Admin dashboard](docs/screenshots/06-dashboard-admin.png)

| | |
|---|---|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16, PyJWT, bcrypt |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| **Testing** | pytest + pytest-cov (105 tests, 99% coverage), Vitest + Testing Library (64 tests, 97% coverage) |
| **Tooling** | Docker Compose (Postgres), GitHub Actions CI |

---

## Contents

- [Features](#features)
- [Running locally](#running-locally)
- [Running the tests](#running-the-tests)
- [API reference](#api-reference)
- [Architecture](#architecture)
- [Design decisions](#design-decisions)
- [TDD workflow](#tdd-workflow)
- [Screenshots](#screenshots)
- [My AI Usage](#my-ai-usage)

---

## Features

**Every signed-in user can:**

- Register and log in. Sessions use a JWT that survives page reloads and signs the user out when it expires.
- See the whole showroom on a dashboard: stats, cards colour-coded by category, prices in ₹ with Indian digit grouping.
- Search by make, model, category and price range, and toggle "in stock only". Results can be sorted.
- Buy a vehicle. The **Purchase** button is disabled ("Sold out") when quantity is 0, and stock updates straight away.

**Admins can also:**

- Add, edit and delete vehicles from modal forms. Deleting asks for confirmation first.
- Restock vehicles, including ones that are sold out.

The UI is responsive down to phone width, uses labelled form controls and dialogs, and reports success and errors in toasts.

---

## Running locally

### Prerequisites

- **Python 3.11+**
- **Node.js 20+** and npm
- **PostgreSQL 16**: the easiest way is Docker (`docker compose`). A local install also works.

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This creates two databases: `dealership` for the app and `dealership_test` for the test suite. The user is `postgres` and the password is `postgres`. If you use your own Postgres instead, create those two databases yourself.

### 2. Backend API (port 8000)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt

cp .env.example .env                 # adjust DATABASE_URL / JWT secret if needed
alembic upgrade head                 # create tables
python -m app.scripts.seed           # admin account + 12 sample cars
uvicorn app.main:app --reload --port 8000
```

Interactive API docs are at **http://localhost:8000/docs**.

### 3. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. In development, Vite forwards `/api` requests to `localhost:8000`, so no CORS setup is needed. To point a production build at another API, set `VITE_API_URL` (see `frontend/.env.example`).

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@dealership.com` | `Admin@12345` (set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`) |
| Customer | register any account from the sign-up page | |

The public sign-up form can't create admins. The seed script creates the admin account, or promotes an existing account with that email to admin.

---

## Running the tests

```bash
# Backend: SQLite by default (zero setup)
cd backend && pytest --cov

# Backend: against PostgreSQL (what CI does)
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/dealership_test pytest --cov

# Frontend
cd frontend && npm test          # or: npm run coverage
```

📄 **[Full test report](docs/TEST_REPORT.md)**: 105 backend tests (99% coverage) and 64 frontend tests (97% coverage), all passing.

---

## API reference

The API exposes **exactly** the endpoints listed in the kata requirements (`tests/test_api_contract.py` checks this). All `/api/vehicles` routes are protected and need an `Authorization: Bearer <token>` header. 🔒 means admin only, as the spec states.

| Method | Path | Description | Success | Errors |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Create an account (`name`, `email`, `password` ≥ 8 chars) | 201 | 409 duplicate email, 422 |
| `POST` | `/api/auth/login` | Returns `{access_token, token_type, user}` | 200 | 401 |
| `GET` | `/api/vehicles` | All vehicles (including sold-out ones), sorted by make and model | 200 | 401 |
| `GET` | `/api/vehicles/search` | `make`, `model` (partial, case-insensitive), `category` (exact, case-insensitive), `min_price`, `max_price` (inclusive) | 200 | 400 inverted range, 422 |
| `POST` | `/api/vehicles` | Add a vehicle (`make`, `model`, `category`, `price` > 0, `quantity` ≥ 0) | 201 | 422 |
| `PUT` | `/api/vehicles/{id}` | Update any subset of fields | 200 | 404, 422 |
| `DELETE` | `/api/vehicles/{id}` 🔒 | Delete a vehicle | 204 | 403, 404 |
| `POST` | `/api/vehicles/{id}/purchase` | Buy `{quantity}` units (body optional, default 1) | 200 | 400 insufficient stock, 404 |
| `POST` | `/api/vehicles/{id}/restock` 🔒 | Add `{quantity}` units (≥ 1) | 200 | 403, 404, 422 |

Every error response has the shape `{"detail": "..."}`.

---

## Architecture

```
car-dealership-inventory/
├── backend/
│   ├── app/
│   │   ├── api/            # HTTP layer: routers, auth dependencies, error → status mapping
│   │   ├── services/       # Business rules (no FastAPI or SQL imports); raise domain errors
│   │   ├── repositories/   # The only code that talks to the database
│   │   ├── models/         # SQLAlchemy ORM models (+ DB check constraints)
│   │   ├── schemas/        # Pydantic request/response validation
│   │   ├── core/           # Settings, password hashing, JWT
│   │   └── scripts/seed.py # Idempotent admin + demo inventory
│   ├── alembic/            # Migrations
│   └── tests/              # API integration tests + unit tests (tests/unit)
├── frontend/
│   └── src/
│       ├── api/            # fetch client (token, errors, 401 handling) + typed endpoint functions
│       ├── context/        # AuthContext: session state, login/register/logout
│       ├── hooks/          # useInventory: vehicle list + mutations
│       ├── components/     # VehicleCard, SearchFilters, modals, ui/ primitives
│       └── pages/          # Login, Register, Dashboard (+ tests)
├── docs/                   # Test report and screenshots
└── docker-compose.yml
```

**Backend request flow:** `router → service → repository → database`. Each layer depends only on the one below it:

- Routers handle HTTP only.
- Services hold the rules ("can't buy more than is in stock", "min price can't exceed max price") and raise errors such as `NotFoundError` or `BusinessRuleError`.
- `api/errors.py` maps those errors to HTTP status codes in one place.

Services receive their repository through the constructor, so the unit tests swap in in-memory fakes (`tests/unit/test_services.py`).

**Frontend:** pages and components never call `fetch` directly. They go through `vehiclesApi` / `authApi`, which use one `apiRequest` client. `useInventory` owns the list state and mutations, so the dashboard just lays out presentational components.

---

## Design decisions

- **Permissions follow the spec exactly.** Every vehicle endpoint needs a valid token. Only `DELETE /api/vehicles/:id` and `POST /api/vehicles/:id/restock` are admin-only, because those are the two the spec marks "(Admin only)". On the frontend, the add/update/delete forms are shown only to admins, because the spec lists them under "(For Admin Users)".
- **No extra endpoints.** There's no "current user" endpoint, so the frontend keeps the user object returned by `POST /api/auth/login` alongside the token. Any 401 clears both and returns to the login page.
- **Race-safe purchases.** Stock changes are a single conditional `UPDATE … SET quantity = quantity - n WHERE id = :id AND quantity >= n`. Two simultaneous purchases of the last car can't both succeed. Database `CHECK` constraints (`price > 0`, `quantity >= 0`) back up the API validation.
- **Partial `PUT`.** Only the fields sent are changed, and explicit `null`s are rejected. The edit form sends only the fields that changed.
- **Security details.**
  - Login returns the same error for an unknown email and a wrong password, so it can't be used to find out which emails are registered.
  - Emails are stored lower-case, so `Asha@x.com` and `asha@x.com` count as the same account.
  - Passwords over bcrypt's 72-byte limit are rejected with a 422 instead of causing a 500.
  - `%` and `_` in search terms are escaped so they don't act as SQL wildcards.
- **Indian market data.** The seed inventory uses Indian models with approximate ex-showroom prices in ₹. Prices are stored as `NUMERIC(12,2)`.
- **Tests on both databases.** Tests default to SQLite for zero-setup runs. CI runs them against PostgreSQL, which is what production uses.

---

## TDD workflow

The git history follows **Red → Green → Refactor**. Commit prefixes make each step visible:

- `test(red): …`: failing tests that describe the next behaviour
- `feat(green): …` / `fix(green): …`: the smallest change that makes them pass
- `refactor: …`: cleanup with the tests still green

```bash
git log --oneline --reverse
```

Some refactors and fixes came from things the tests surfaced:

- PyJWT warned about a short HMAC key.
- bcrypt raised an error on inputs over 72 bytes.
- `LIKE` wildcards weren't escaped in search.
- A repository method named `list` shadowed the built-in.

---

## Screenshots

| | |
|---|---|
| **Login** ![Login](docs/screenshots/01-login.png) | **Register** ![Register](docs/screenshots/02-register.png) |
| **Customer dashboard** ![Customer dashboard](docs/screenshots/03-dashboard-customer.png) | **Purchase feedback** ![Purchase](docs/screenshots/04-purchase.png) |
| **Search: SUVs under ₹12 lakh** ![Search](docs/screenshots/05-search.png) | **Admin: add vehicle** ![Add vehicle](docs/screenshots/07-add-vehicle.png) |
| **Admin: restock** ![Restock](docs/screenshots/08-restock.png) | **Mobile** ![Mobile](docs/screenshots/09-mobile.png) |

---

## My AI Usage

<!-- TODO(Atulit): review this section and rewrite the reflection in your own words before submitting; you'll be asked about it in the interview. -->

### Tools used

- **Claude (Anthropic)**, used through the Claude desktop app (Cowork mode), which can run code and edit files in a sandbox.

### How I used it

- **Turning the requirements into a plan.** I gave Claude the kata PDF. It asked me to make the key decisions before writing any code, and I chose:
  - **FastAPI** for the backend. My usual stack is Spring Boot, which the kata doesn't allow.
  - **PostgreSQL**. Claude pointed out that Prisma's Python client is no longer maintained, so I switched to SQLAlchemy + Alembic.
  - Following the kata's co-author rule on commits.
- **Writing tests first.** For each feature, Claude wrote the failing tests (committed as `test(red)`), then the implementation (`feat(green)`), then cleanups (`refactor`). It ran the backend suite against both SQLite and a real PostgreSQL server at every step.
- **Boilerplate and structure.** Claude generated the project scaffolding, the router / service / repository layering, the Alembic setup, the React components and the Tailwind styling.
- **Edge cases and debugging.** Several fixes came out of this loop: the race-safe stock `UPDATE`, the 72-byte bcrypt limit, SQL wildcard escaping, and the JWT key-length warning.
- **Docs.** Claude drafted this README and generated the test report from real test runs. It also took the screenshots with Playwright against the running app.

Every commit where AI was involved has a `Co-authored-by: Claude <noreply@anthropic.com>` trailer. The raw prompts are in [PROMPTS.md](PROMPTS.md).

### Reflection

AI made it possible to deliver a full-stack, well-tested project in a stack I don't use day to day. It was fastest at boilerplate and at listing edge cases I might have missed (concurrent purchases, wildcard injection, bcrypt's byte limit). Writing the tests first kept it honest: each generated implementation had to pass a test that stated the behaviour. That made the code easier to review than a big generated dump. What I still had to own was the set of decisions: the stack, and reading the spec literally (permissions and the exact endpoint list). I also had to understand the code well enough to explain and change it.
