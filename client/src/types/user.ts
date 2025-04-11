// client/src/types/user.ts
export interface UserStatus {
	online: boolean;
	lastSeenAt: string;
	status?: "active" | "away" | "offline";
	device?: string;
}

export interface User {
	uid: string;
	displayName?: string;
	email?: string;
	photoURL?: string;
}

// ตัวอย่างโครงสร้างข้อมูลใน Firebase
export interface FirebaseData {
	status: Record<string, UserStatus>;
	rooms: Record<
		string,
		{
			name: string;
			description?: string;
			members: Record<string, boolean>;
		}
	>;
	user_rooms: Record<string, Record<string, boolean>>;
}
