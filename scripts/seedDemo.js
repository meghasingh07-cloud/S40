const bcrypt = require('bcryptjs');
const db = require('../services/localDb');
const email = process.env.DEMO_EMAIL || db.DEMO_EMAIL;
const password = process.env.DEMO_PASSWORD || db.DEMO_PASSWORD;
const user = db.findUser(email);
if (!user) {
  db.createUser({ name: 'FraudShield Demo User', email, password: bcrypt.hashSync(password, 12), role: 'user', isSupervised: false, spendingLimit: 50000 });
}
const current = db.findUser(email);
console.log(`Demo account ready: ${current.email}`);
console.log(`Password: ${password}`);
console.log(`Local database: ${db.DB_FILE}`);
console.log('No MongoDB connection is required.');
