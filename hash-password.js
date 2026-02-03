const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('TestPass123!', 10);
console.log(hash);
