'use strict';

import path from 'path';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';

let isFirebase;

let fireInit;

const state = {
	appName: '',
};

const copyFiles = {
	rundev: `rundev.js`,
	firebaseJSON: `firebase.json`,
	database: `database.rules.json`,
	env: `.env`,
	firebase: `src/firebase.js`,
	context: `src/context.js`,
	config: `src/config.js`,
	useFirebaseRef: `src/hooks/useFirebaseRef.js`,
	firebasePNG: `src/assets/firebase-logo.png`,
	loading: `src/components/Loading.js`,
	home: `src/pages/Home.js`,
	App: `src/App.js`,
	autoscroll: `src/utils/autoscroll.js`,
	indexHTML: `public/index.html`,
};

const directories = {
	hooks: `src/hooks`,
	assets: `src/assets`,
	components: `src/components`,
	pages: `src/pages`,
	utils: `src/utils`,
};

const commands = {
	15: [0, `    "dev": "node rundev.js",`],
	16: [
		1,
		`    "build": "cross-env REACT_APP_ENV=production react-scripts build",`,
	],
};

const packages = {
	'cross-env': true,
	firebase: false,
};

const toolchains = {
	React: 'create-react-app',
	Nextjs: 'create-next-app@latest',
};

const toolchainNames = Object.keys(toolchains);
const toolchainCommands = Object.values(toolchains);

export default async () => {
	process.on('exit', () => {
		if (fireInit && !fireInit.killed) fireInit.kill();
	});

	const installToolchain = (toolchain, appName) => {
		const tool = spawnSync('npx', [toolchains[toolchain], appName], {
			cwd: path.dirname('./'),
			stdio: ['ignore', 'inherit', 'inherit'],
		});
		if (tool.error || tool.status !== 0 || tool.signal) {
			tool.error ? console.error(tool.error) : null;
			process.exit(process.exitCode);
		}
	};

	const checkFirebase = () => {
		console.log(`Checking firebase version ......`);
		isFirebase = spawnSync('firebase', ['-V'], {
			cwd: path.dirname('./'),
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		if (isFirebase.signal) process.exit(process.exitCode);
		if (isFirebase.error && isFirebase.error.code !== 'ENOENT') {
			throw isFirebase.error;
		}
		return isFirebase.output;
	};

	const installFirebaseTools = () => {
		console.log(`Installing firebase cli ......`);
		const install = spawnSync('npm', ['install', '-g', 'firebase-tools'], {
			cwd: path.dirname('./'),
			stdio: ['ignore', 'inherit', 'inherit'],
		});
		if (install.error || install.status !== 0 || install.signal) {
			install.error ? console.error(install.error) : null;
			process.exit(process.exitCode);
		}
		console.log(`Firebase tools installed successfully!`);
	};

	const createDir = () => {
		for (let dir in directories) {
			try {
				fs.mkdirSync(
					path.join(path.dirname('./'), `${state.appName}/${directories[dir]}`)
				);
				console.log(
					`Directory ${dir} created at ${path.join(
						path.dirname('./'),
						`${state.appName}/${directories[dir]}`
					)}`
				);
			} catch (error) {
				if (error.code === 'EEXIST')
					console.warn(
						`Directory ${error.path} already exists. Skipping ......`
					);
				else throw error;
			}
		}
	};

	const createFiles = async () => {
		for (let file in copyFiles) {
			try {
				fs.copyFileSync(
					path.join(path.dirname('./'), `template/${copyFiles[file]}`),
					path.join(path.dirname('./'), `${state.appName}/${copyFiles[file]}`),
					fs.constants.COPYFILE_EXCL
				);
				console.log(
					`File ${file} created at ${path.join(
						path.dirname('./'),
						`${state.appName}/${copyFiles[file]}`
					)}`
				);
			} catch (error) {
				if (error.code === 'EEXIST') {
					const answer = await inquirer.prompt([
						{
							name: 'overwrite',
							type: 'confirm',
							message: `File ${path.join(
								path.dirname('./'),
								`${state.appName}/${copyFiles[file]}`
							)} already exists. Do you want to over write it?`,
							default() {
								return false;
							},
						},
					]);
					if (answer.overwrite) {
						try {
							fs.copyFileSync(
								path.join(path.dirname('./'), `template/${copyFiles[file]}`),
								path.join(
									path.dirname('./'),
									`${state.appName}/${copyFiles[file]}`
								)
							);
						} catch (error) {
							throw error;
						}
					} else {
						console.log(
							`Skipping file ${path.join(
								path.dirname('./'),
								`${state.appName}/${copyFiles[file]}`
							)}`
						);
					}
				}
			}
		}
	};

	const firebaseLogin = () => {
		console.log(`Logging into firebase ......`);
		const login = spawnSync('firebase', ['login'], {
			cwd: path.join(path.dirname('./'), `${state.appName}`),
			stdio: ['inherit', 'inherit', 'inherit'],
		});
		if (login.error || login.status !== 0 || login.signal) {
			login.error ? console.error(login.error) : null;
			process.exit(process.exitCode);
		}
		console.log(`Firebase login successfull!`);
	};

	const firebaseInit = () => {
		fireInit = spawn('firebase', ['init'], {
			cwd: path.join(path.dirname('./'), `${state.appName}/`),
			stdio: ['inherit', 'inherit', 'inherit'],
		});
	};

	const updatePackage = () => {
		console.log(`Updating package.json ......`);
		const file_path = path.join(
			path.dirname('./'),
			`${state.appName}/package.json`
		);

		let pkg = fs.readFileSync(file_path).toString().split('\n');
		for (let command in commands) {
			pkg.splice(command, commands[command][0], commands[command][1]);
		}
		pkg = pkg.join('\n');
		fs.writeFileSync(file_path, pkg);

		console.log('Package.json successfully updated');
	};

	const installPackages = () => {
		console.log(`Installing dependencies ......`);
		let attr = ['install', '--save'];
		let attrDev = ['install', '--save-dev'];
		for (let pkg in packages)
			packages[pkg] ? attrDev.push(pkg) : attr.push(pkg);

		if (attr.length > 1) {
			const install = spawnSync('npm', attr, {
				cwd: path.join(path.dirname('./'), `${state.appName}`),
				stdio: ['ignore', 'inherit', 'inherit'],
			});
			if (install.error || install.status !== 0 || install.signal) {
				install.error ? console.error(install.error) : null;
				process.exit(process.exitCode);
			}
			console.log(`Dependencies ${attr.splice(2)} successfull installed`);
		}
		if (attrDev.length > 2) {
			const install = spawnSync('npm', attrDev, {
				cwd: path.join(path.dirname('./'), `${state.appName}`),
				stdio: ['ignore', 'inherit', 'inherit'],
			});
			if (install.error || install.status !== 0 || install.signal) {
				install.error ? console.error(install.error) : null;
				process.exit(process.exitCode);
			}
			console.log(`Dependencies ${attrDev.splice(2)} successfull installed`);
		}
	};

	const chooseProject = async () => {
		const answers = await inquirer.prompt([
			{
				type: 'list',
				name: 'toolchain',
				message: 'What toolchain do you want to use?',
				choices: [toolchainNames[0] /* , toolchainNames[1] */],
			},
			{
				name: 'appName',
				type: 'input',
				message: 'Enter your app name : ',
				default() {
					return 'my-firebase-app';
				},
			},
		]);

		state.appName = answers.appName;
		installToolchain(answers.toolchain, answers.appName);
		const stdio = checkFirebase();
		if (
			stdio &&
			!`${stdio[2]}` &&
			Number(`${stdio[1]}`.substring(0, `${stdio[1]}`.indexOf('.'))) > 9
		) {
			console.log(
				`Skipping download of firebase cli (Version ${stdio[1]} already present)`
			);
		} else {
			installFirebaseTools();
		}

		console.log(`Creating files ......`);
		createDir();
		await createFiles();
		updatePackage();
		installPackages();
		firebaseLogin();
		firebaseInit();
	};

	await chooseProject();
};
