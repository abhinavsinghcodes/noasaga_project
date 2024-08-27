const bcrypt = require('bcryptjs');

const password = '67et98i9i59to21230227890314152278901234567890314159'; // Replace with your desired password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed password:', hash);
});
