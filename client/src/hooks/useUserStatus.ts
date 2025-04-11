// src/hooks/useUserStatus.ts
import { useCallback, useEffect, useState } from "react";
import { setupPresence, updateUserStatus } from "../services/firebase";

interface UserStatusHook {
	userId: string;
	isLoggedIn: boolean;
	login: (customUserId?: string) => void;
	logout: () => void;
}

/**
 * Hook for managing user online status, presence, login and logout
 */
export const useUserStatus = (): UserStatusHook => {
	const [userId, setUserId] = useState<string>("");
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

	// Check for existing login on initial render
	useEffect(() => {
		const savedUserId = localStorage.getItem("userId");
		if (savedUserId) {
			setUserId(savedUserId);
			setIsLoggedIn(true);
		}
	}, []);

	// Set up Firebase presence system when user is logged in
	useEffect(() => {
		if (!userId || !isLoggedIn) return;

		// Setup presence monitoring and get cleanup function
		const cleanupPresence = setupPresence(userId);

		// Handle page visibility changes
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible" && isLoggedIn) {
				// Re-establish presence when page becomes visible again
				setupPresence(userId);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		// Clean up
		return () => {
			if (isLoggedIn) {
				cleanupPresence();
			}
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [userId, isLoggedIn]);

	// Login function that can accept a custom user ID or generate random one
	const login = useCallback((customUserId?: string) => {
		let newUserId: string;

		if (customUserId) {
			// Use the provided custom user ID
			newUserId = customUserId;
		} else {
			// Generate a random user ID
			const randomNum = Math.floor(Math.random() * 1000);
			newUserId = `user_${randomNum}`;
		}

		// Store user ID in local storage for persistence across refreshes
		localStorage.setItem("userId", newUserId);
		setUserId(newUserId);
		setIsLoggedIn(true);
	}, []);

	// Logout function
	const logout = useCallback(() => {
		if (userId) {
			// Mark user as offline
			updateUserStatus(userId, {
				isOnline: false,
				lastSeen: Date.now(),
			});

			// Remove from local storage
			localStorage.removeItem("userId");

			// Update state
			setIsLoggedIn(false);
			setUserId("");
		}
	}, [userId]);

	return { userId, isLoggedIn, login, logout };
};

export default useUserStatus;
