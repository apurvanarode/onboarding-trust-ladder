const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/compliance', require('./modules/compliance'));
app.use('/api/resources', require('./modules/resources'));
app.use('/api/diagnostics', require('./modules/diagnostics'));
// app.use('/api/tasks', require('./modules/scoring'));
app.use('/api/tier', require('./modules/accessTiers'));
app.use('/api/team', require('./modules/resources'));

app.listen(5000, () => console.log('Onboarding backend running on :5000'));