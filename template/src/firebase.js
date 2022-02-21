import { initializeApp } from 'firebase/app'; // Tree shakable library
import {
	getAuth,
	signInAnonymously,
	onAuthStateChanged,
	connectAuthEmulator,
} from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

import config, { isDev } from './config';

// Initialize firebase app
const app = initializeApp(config.firebase);

// Get a reference to the auth services
export const auth = getAuth(app);

// Get a reference to the database services
export const database = getDatabase(app);

// Get a reference to the function services
const functions = getFunctions(app);

// If in development environment, use emulators
if (isDev) {
	connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true }); // Auth emulator running on http://localhost:9099
	connectDatabaseEmulator(database, 'localhost', 9000); // Realtime database emulator running on http://localhost:9000
	connectFunctionsEmulator(functions, 'localhost', 5001); // Functions emulator running on http://localhost:5001
} else {
	getAnalytics(app); // Initilizes google analytics for the app
}
