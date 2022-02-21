import { auth, database as db } from './firebase';
import { ref, onValue, update } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import { useState, useEffect } from 'react';

import './App.css';

import { UserContext } from './context/context';

function App() {
	const [authUser, setAuthUser] = useState(null);
	const [user, setUser] = useState(null);

	useEffect(() => {
		return onAuthStateChanged(auth, (userObj) => {
			// Runs on signin/signout
			if (userObj) {
				// User is signed in.
				const user = userObj.toJSON();
				// User is already logged in
				setAuthUser(user);
			} else {
				// User is signed out, then sign in anonymously
				setAuthUser(null);
				signInAnonymously(auth).catch((err) => {
					alert('Unable to connect to the server. Please try again later.');
				});
			}
		});
	}, []);
	useEffect(() => {
		if (!authUser) {
			// If user is not logged in, set user to null and return
			setUser(null);
			return;
		}
		// Get the user reference in the database
		const userRef = ref(db, `/users/${authUser.uid}`);
		let unsubscribe = onValue(userRef, (snapshot) => {
			// If the ref exists, then set the user, else update the ref
			if (snapshot.child('name').exists()) {
				setUser({
					...snapshot.val(),
					id: authUser.uid,
					authUser,
				});
			} else {
				update(userRef, {
					name: 'tempUser',
				});
			}
		});
		return () => {
			// Unsuscribe from the listner on ComponentUnmount
			unsubscribe();
		};
	}, [authUser]);

	return (
		<BrowserRouter>
			<UserContext.Provider value={user}>
				<Toaster position="top-right" reverseOrder={false} />
				<Routes>{/* Routes for different screens */}</Routes>
			</UserContext.Provider>
		</BrowserRouter>
	);
}

export default App;
