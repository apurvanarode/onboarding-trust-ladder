const express = require('express');
const ordersRouter = require('./routes/orders');
const usersRouter = require('./routes/users');

const app = express();
const PORT = 4000;

app.use(express.json());

app.use('/orders', ordersRouter);
app.use('/users', usersRouter);

app.listen(PORT, () => {
  console.log('TaskFlow API running on port 4000');
});
