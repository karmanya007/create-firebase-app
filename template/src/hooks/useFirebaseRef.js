import { useEffect, useState } from 'react';

import { database as db } from '../firebase';
import { ref, onValue } from 'firebase/database';

function useFirebaseRef(path, once = false) {
	const [value, setValue] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true); // The value is not set yet
		if (path) {
			const dbRef = ref(db, path); // Reference to the field specified in the path 
			let unsubscribe = onValue( // Attaches a listner to the above reference
				dbRef,
				(snapshot) => { // On every change to the path, setValue and set Loading to false
					setValue(snapshot.val());
					setLoading(false); // Value set
				},
				{
					onlyOnce: once, // This option gets the value only once (No listner attached)
				}
			);
			return () => {
				unsubscribe(); // *IMPORTANT* Removes the listner on component unmount
			};
		}
	}, [path, once]);

	return [value, loading];
}

export default useFirebaseRef;
