const express = require('express');
const router = express.Router();

let orders = [
  { id: 1, customerName: 'Alice Johnson', amount: 120.50, status: 'pending' },
  { id: 2, customerName: 'Bob Smith',     amount: 340.00, status: 'shipped' },
  { id: 3, customerName: 'Carol White',   amount: 89.99,  status: 'delivered' },
  { id: 4, customerName: 'David Brown',   amount: 215.75, status: 'pending' },
  { id: 5, customerName: 'Eva Martinez',  amount: 530.00, status: 'cancelled' },
];

let nextId = orders.length + 1;

// GET / — return all orders
router.get('/', (req, res) => {
  res.json(orders);
});

// BUG: missing amount validation, intentional for onboarding diagnostics
router.post('/', (req, res) => {
  const { customerName, amount, status } = req.body;
  const newOrder = { id: nextId++, customerName, amount, status: status || 'pending' };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// GET /:id — return a single order by id
router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

module.exports = router;
