const bcrypt = require('bcryptjs');
const localDb = require('./localDb');

const DEMO_EMAIL = localDb.DEMO_EMAIL;
const DEMO_PASSWORD = localDb.DEMO_PASSWORD;
const DEMO_USER_ID = localDb.DEMO_USER_ID;

function isMongoReady() { return false; }
function findUser(email) { return localDb.findUser(email); }
function findUserById(id) { return localDb.findUserById(id); }
function createUser(input) { return localDb.createUser({ ...input, password: input.password }); }
function addTransaction(input) { return localDb.addTransaction(input); }
function updateTransaction(id, patch) { return localDb.updateTransaction(id, patch); }
function transactionsForUser(userId) { return localDb.transactionsForUser(userId); }

localDb.ensureDb();

module.exports = {
  DEMO_EMAIL, DEMO_PASSWORD, DEMO_USER_ID,
  isMongoReady, findUser, findUserById, createUser,
  addTransaction, updateTransaction, transactionsForUser,
  get demoUser() { return localDb.findUser(DEMO_EMAIL); },
  get dbFile() { return localDb.DB_FILE; },
  bcrypt
};
