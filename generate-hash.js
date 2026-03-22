const bcryptjs = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10;

bcryptjs.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password:', password);
    console.log('Hash:', hash);
  }
});
