# TaskFlow API

A mini order-management REST API used as a **training ground for onboarding a new developer**.

The project is intentionally kept simple — in-memory arrays, no database, no authentication — so a new team member can focus on reading, understanding, and improving real code without infrastructure overhead.

---

## Getting Started

```bash
cd sample-project
npm install
npm start
```

The server starts on **http://localhost:4000**.

---

## Endpoints

### Orders

| Method | Path         | Description                  |
|--------|--------------|------------------------------|
| GET    | /orders      | List all orders              |
| GET    | /orders/:id  | Get a single order by id     |
| POST   | /orders      | Create a new order           |

**Order shape**
```json
{ "id": 1, "customerName": "Alice Johnson", "amount": 120.50, "status": "pending" }
```

### Users

| Method | Path        | Description                 |
|--------|-------------|-----------------------------|
| GET    | /users      | List all users              |
| GET    | /users/:id  | Get a single user by id     |
| POST   | /users      | Create a new user           |

**User shape**
```json
{ "id": 1, "name": "Alice Johnson", "email": "alice@example.com" }
```

---

## Known Intentional Bugs

These bugs are **deliberate** and exist specifically for onboarding practice. A new developer's first task is to find, understand, and fix them.

### Bug 1 — No amount validation in `POST /orders`

**File:** [`src/routes/orders.js`](src/routes/orders.js)

`POST /orders` accepts any value for `amount`, including negative numbers, zero, or non-numeric strings. There is no check that `amount` is a positive number before the order is saved.

**Expected fix:** Validate that `amount` is present and is a number greater than zero; return a `400 Bad Request` if it is not.

---

### Bug 2 — No duplicate email check in `POST /users`

**File:** [`src/routes/users.js`](src/routes/users.js)

`POST /users` will create a new user even if another user with the same email address already exists. This can result in duplicate accounts.

**Expected fix:** Before inserting, check whether any existing user already has the same email; return a `409 Conflict` if a duplicate is found.

---

## Project Structure

```
sample-project/
├── package.json
└── src/
    ├── server.js
    └── routes/
        ├── orders.js
        └── users.js
```
