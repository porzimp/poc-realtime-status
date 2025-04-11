import { UserStatus } from "./user";

// client/src/types/room.ts
export interface Room {
	id: string;
	name: string;
	description?: string;
	memberCount?: number;
	createdAt?: string;
}

export interface RoomMember {
	userId: string;
	displayName?: string;
	photoURL?: string;
	status: UserStatus;
}

export interface RoomWithMembers extends Room {
	members: Record<string, RoomMember>;
}
