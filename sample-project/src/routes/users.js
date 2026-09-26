const express = require('express');
const router = express.Router();

let users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith',     email: 'bob@example.com' },
  { id: 3, name: 'Carol White',   email: 'carol@example.com' },
];

let nextId = users.length + 1;

// GET / — return all users
router.get('/', (req, res) => {
  res.json(users);
});

// GET /:id — return a single user by id
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// BUG: missing duplicate email check, intentional for onboarding diagnostics
router.post('/', (req, res) => {
  const { name, email } = req.body;
  const newUser = { id: nextId++, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

module.exports = router;
