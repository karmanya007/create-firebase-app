/** This file contains all public configuration variables for different environments. */

const config = {
	// Development credentials
	development: {
		firebase: {
			apiKey: '',
			authDomain: '',
			databaseURL: '',
			projectId: '',
			storageBucket: '',
			messagingSenderId: '',
			appId: '',
		},
	},
	// Previewing credentials for Q/A testing
	preview: {
		firebase: {},
	},
	// Production credentials
	production: {
		firebase: {},
	},
};

/** The environment of the application. */
export const env = process.env.REACT_APP_ENV || 'development';

/** Indicates whether the app is running in development. */
export const isDev = env === 'development';

export default config[env];
