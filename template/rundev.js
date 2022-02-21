/**
 * @file Development script, which performs the following actions.
 *
 * 1. Runs `npm run build -- --watch` on the functions directory.
 * 2. Starts the Firebase Local Emulator Suite.
 * 3. Manually executes the `clearConnections` function on a schedule.
 * 4. Starts the frontend React app with Fast Refresh enabled.
 */

const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { PubSub } = require('@google-cloud/pubsub');

let build, emulators, app;

process.on('exit', () => {
	if (build && !build.killed) build.kill();
	if (emulators && !emulators.killed) emulators.kill();
	if (app && !app.killed) app.kill();
});

// Initial build
spawnSync('npm', ['run', 'build'], {
	cwd: path.join(__dirname, 'functions'),
	stdio: ['ignore', 'inherit', 'inherit'],
});

// Incremental watch builds
build = spawn(
	'npm', // Command to run
	['run', 'build', '--', '--watch', '--preserveWatchOutput'], // Arguments
	{
		cwd: path.join(__dirname, 'functions'), // Working directory
		stdio: ['ignore', 'inherit', 'inherit'], // [stdin, stdout, stderr] => Pipes established between parent and child process
	}
);
// Start emulators
emulators = spawn(
	'firebase',
	[
		'emulators:start',
		'--project',
		'staging',
		'--import=./data',
		'--export-on-exit',
	],
	{
		cwd: __dirname,
		stdio: ['ignore', 'inherit', 'inherit'],
	}
);
// Frontend application
app = spawn('npm', ['start'], {
	cwd: __dirname,
	stdio: ['ignore', 'pipe', 'inherit'],
	env: Object.assign({ FORCE_COLOR: true }, process.env),
});
app.stdout.pipe(process.stdout);

const pubsub = new PubSub({
	apiEndpoint: 'localhost:8085', // Hosted sites endpoint
	projectId: '',
});

setInterval(async () => {
	await pubsub.topic('firebase-schedule-<Your function name>').publishJSON({});
}, 60 * 1000); // every minute
