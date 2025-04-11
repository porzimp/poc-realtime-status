// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import {
	DatabaseReference,
	getDatabase,
	onDisconnect,
	onValue,
	ref,
	set,
} from "firebase/database";

// Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyCw0OWQgdU4HoL3D5uZkct3w8Yh8m6kb6M",
	authDomain: "test-realtime-8cbb5.firebaseapp.com",
	databaseURL:
		"https://test-realtime-8cbb5-default-rtdb.asia-southeast1.firebasedatabase.app",
	projectId: "test-realtime-8cbb5",
	storageBucket: "test-realtime-8cbb5.firebasestorage.app",
	messagingSenderId: "1078137511870",
	appId: "1:1078137511870:web:e7ddfb730b1aa074f7e3ef",
	measurementId: "G-1WN1JE3M18",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface UserStatus {
	isOnline: boolean;
	lastSeen: number;
}

export const getUserStatusRef = (userId: string): DatabaseReference => {
	return ref(database, `users/${userId}`);
};

export const updateUserStatus = (userId: string, status: UserStatus): void => {
	const userRef = getUserStatusRef(userId);
	set(userRef, status);
};

export const setupPresence = (userId: string): (() => void) => {
	const userRef = getUserStatusRef(userId);

	// Set user as online
	updateUserStatus(userId, {
		isOnline: true,
		lastSeen: Date.now(),
	});

	// Set up disconnect handler
	onDisconnect(userRef).update({
		isOnline: false,
		lastSeen: Date.now(),
	});

	// Update timestamp periodically when online
	const intervalId = setInterval(() => {
		if (document.visibilityState === "visible") {
			updateUserStatus(userId, {
				isOnline: true,
				lastSeen: Date.now(),
			});
		}
	}, 60000);

	// Return cleanup function
	return () => {
		clearInterval(intervalId);
		updateUserStatus(userId, {
			isOnline: false,
			lastSeen: Date.now(),
		});
	};
};

export const subscribeToUsers = (
	callback: (users: { [id: string]: UserStatus }) => void,
): (() => void) => {
	const usersRef = ref(database, "users");

	const unsubscribe = onValue(usersRef, (snapshot) => {
		const data = snapshot.val();
		callback(data || {});
	});

	return unsubscribe;
};

export default {
	getUserStatusRef,
	updateUserStatus,
	setupPresence,
	subscribeToUsers,
};
