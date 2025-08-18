import dotenv from 'dotenv';

// Load environment variables as early as possible
dotenv.config();

// Optionally normalize some booleans
if (process.env.PROTOTYPE_NO_AUTH && process.env.PROTOTYPE_NO_AUTH.toLowerCase() === 'false') {
	process.env.PROTOTYPE_NO_AUTH = 'false';
}


