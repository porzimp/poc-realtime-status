// server/src/types/user.ts
export interface UserStatus {
	online: boolean;
	lastSeenAt: string;
	status?: "active" | "away" | "offline";
	device?: string;
	socketId?: string;
}

export interface User {
	uid: string;
	displayName?: string;
	email?: string;
	photoURL?: string;
}

// server/src/types/room.ts
export interface Room {
	id: string;
	name: string;
	description?: string;
	type?: string;
	createdAt?: string;
}

export interface RoomMember {
	userId: string;
	status: UserStatus;
}

export interface RoomWithMembers extends Room {
	members: Record<string, RoomMember>;
}
