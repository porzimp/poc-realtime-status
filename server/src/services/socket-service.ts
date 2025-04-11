// server/src/services/socket-service.ts
import { Server, Socket } from "socket.io";
import { UserStatus } from "../types/user";
import statusService from "./status-service";

// ตัวเลือกสำหรับ Socket.IO
interface ServerToClientEvents {
	login_success: (data: { userId: string }) => void;
	login_error: (data: { message: string }) => void;
	join_room_success: (data: {
		roomId: string;
		members: Array<{ userId: string; status: UserStatus }>;
	}) => void;
	join_room_error: (data: { message: string }) => void;
	leave_room_success: (data: { roomId: string }) => void;
	leave_room_error: (data: { message: string }) => void;
	member_joined: (data: { roomId: string; userId: string }) => void;
	member_left: (data: { roomId: string; userId: string }) => void;
	status_update: (data: { userId: string; status: UserStatus }) => void;
}

interface ClientToServerEvents {
	login: (data: { userId: string; [key: string]: any }) => void;
	join_room: (data: { roomId: string }) => void;
	leave_room: (data: { roomId: string }) => void;
	update_status: (data: { status: string }) => void;
}

interface InterServerEvents {
	ping: () => void;
}

interface SocketData {
	userId?: string;
	rooms?: string[];
}

type AppSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

/**
 * บริการจัดการ Socket
 */
class SocketService {
	private io: Server<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	> | null = null;
	private activeConnections: Map<string, AppSocket> = new Map();

	/**
	 * สร้าง SocketService
	 */
	constructor() {
		console.log("สร้างบริการ Socket แล้ว");
	}

	/**
	 * กำหนด Socket.IO instance
	 * @param io - Socket.IO server instance
	 */
	setIo(
		io: Server<
			ClientToServerEvents,
			ServerToClientEvents,
			InterServerEvents,
			SocketData
		>,
	): void {
		this.io = io;
		this.setupListeners();
	}

	/**
	 * ตั้งค่า listeners สำหรับ Socket.IO
	 */
	private setupListeners(): void {
		if (!this.io) {
			console.error("ไม่พบ Socket.IO instance");
			return;
		}

		this.io.on("connection", (socket: AppSocket) => {
			console.log(`ผู้ใช้เชื่อมต่อแล้ว: ${socket.id}`);

			this.setupSocketListeners(socket);
		});
	}

	/**
	 * ตั้งค่า listeners สำหรับแต่ละ socket
	 * @param socket - Socket ที่เชื่อมต่อ
	 */
	private setupSocketListeners(socket: AppSocket): void {
		// ตรวจสอบการเข้าสู่ระบบ
		socket.on("login", async (data) => {
			try {
				const { userId, ...userData } = data;

				// บันทึกข้อมูล userId ใน socket
				socket.data.userId = userId;
				this.activeConnections.set(userId, socket);

				// อัพเดทสถานะออนไลน์
				await statusService.updateUserOnlineStatus(userId, {
					socketId: socket.id,
					...userData,
				});

				console.log(`ผู้ใช้ ${userId} เข้าสู่ระบบแล้ว`);

				// ส่งข้อมูลกลับให้ผู้ใช้
				socket.emit("login_success", { userId });
			} catch (error) {
				console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
				socket.emit("login_error", { message: "ไม่สามารถเข้าสู่ระบบได้" });
			}
		});

		// อัพเดทสถานะ
		socket.on("update_status", async (data) => {
			if (!socket.data.userId) return;

			try {
				const userId = socket.data.userId;
				const status = data.status;

				await statusService.updateUserOnlineStatus(userId, {
					status,
					lastSeenAt: new Date().toISOString(),
				});

				console.log(`ผู้ใช้ ${userId} อัพเดทสถานะเป็น ${status}`);
			} catch (error) {
				console.error("เกิดข้อผิดพลาดในการอัพเดทสถานะ:", error);
			}
		});

		// เข้าร่วมห้อง
		socket.on("join_room", async (data) => {
			try {
				const { roomId } = data;

				if (!socket.data.userId) {
					socket.emit("join_room_error", { message: "กรุณาเข้าสู่ระบบก่อน" });
					return;
				}

				const userId = socket.data.userId;

				// เพิ่มผู้ใช้เข้าห้อง
				await statusService.addUserToRoom(roomId, userId);

				// เข้าร่วม Socket.IO room
				socket.join(roomId);

				// เก็บข้อมูลห้องที่ผู้ใช้เข้าร่วม
				if (!socket.data.rooms) {
					socket.data.rooms = [];
				}
				socket.data.rooms.push(roomId);

				console.log(`ผู้ใช้ ${userId} เข้าร่วมห้อง ${roomId}`);

				// ดึงข้อมูลสมาชิกในห้อง
				const members = await statusService.getRoomMembersStatus(roomId);

				// ส่งข้อมูลกลับให้ผู้ใช้
				socket.emit("join_room_success", {
					roomId,
					members,
				});

				// แจ้งเตือนสมาชิกอื่นในห้อง
				socket.to(roomId).emit("member_joined", {
					roomId,
					userId,
				});
			} catch (error) {
				console.error("เกิดข้อผิดพลาดในการเข้าร่วมห้อง:", error);
				socket.emit("join_room_error", { message: "ไม่สามารถเข้าร่วมห้องได้" });
			}
		});

		// ออกจากห้อง
		socket.on("leave_room", async (data) => {
			try {
				const { roomId } = data;

				if (!socket.data.userId) {
					socket.emit("leave_room_error", { message: "กรุณาเข้าสู่ระบบก่อน" });
					return;
				}

				const userId = socket.data.userId;

				// ลบผู้ใช้ออกจากห้อง
				await statusService.removeUserFromRoom(roomId, userId);

				// ออกจาก Socket.IO room
				socket.leave(roomId);

				// ลบข้อมูลห้องที่ผู้ใช้ออก
				if (socket.data.rooms) {
					socket.data.rooms = socket.data.rooms.filter((id) => id !== roomId);
				}

				console.log(`ผู้ใช้ ${userId} ออกจากห้อง ${roomId}`);

				// ส่งข้อมูลกลับให้ผู้ใช้
				socket.emit("leave_room_success", { roomId });

				// แจ้งเตือนสมาชิกอื่นในห้อง
				socket.to(roomId).emit("member_left", {
					roomId,
					userId,
				});
			} catch (error) {
				console.error("เกิดข้อผิดพลาดในการออกจากห้อง:", error);
				socket.emit("leave_room_error", { message: "ไม่สามารถออกจากห้องได้" });
			}
		});

		// ผู้ใช้ตัดการเชื่อมต่อ
		socket.on("disconnect", async () => {
			if (socket.data.userId) {
				try {
					const userId = socket.data.userId;

					// อัพเดทสถานะออฟไลน์
					await statusService.updateUserOfflineStatus(userId);

					// ลบ socket จากรายการการเชื่อมต่อที่ใช้งานอยู่
					this.activeConnections.delete(userId);

					console.log(`ผู้ใช้ ${userId} ตัดการเชื่อมต่อแล้ว`);
				} catch (error) {
					console.error("เกิดข้อผิดพลาดในการอัพเดทสถานะออฟไลน์:", error);
				}
			}
		});
	}

	/**
	 * ส่งการอัพเดทสถานะไปยังทุกผู้ใช้
	 * @param userId - ID ของผู้ใช้ที่อัพเดทสถานะ
	 * @param status - ข้อมูลสถานะ
	 */
	broadcastStatusUpdate(userId: string, status: UserStatus): void {
		if (!this.io) return;

		this.io.emit("status_update", { userId, status });
	}

	/**
	 * ส่งการอัพเดทสถานะไปยังห้อง
	 * @param roomId - ID ของห้อง
	 * @param userId - ID ของผู้ใช้ที่อัพเดทสถานะ
	 * @param status - ข้อมูลสถานะ
	 */
	broadcastStatusUpdateToRoom(
		roomId: string,
		userId: string,
		status: UserStatus,
	): void {
		if (!this.io) return;

		this.io.to(roomId).emit("status_update", { userId, status });
	}

	/**
	 * ดึง socket ของผู้ใช้
	 * @param userId - ID ของผู้ใช้
	 * @returns Socket ของผู้ใช้หรือ null ถ้าไม่พบ
	 */
	getUserSocket(userId: string): AppSocket | undefined {
		return this.activeConnections.get(userId);
	}
}

// สร้าง instance เดียวสำหรับการใช้งานทั่วเซิร์ฟเวอร์
const socketService = new SocketService();

export default socketService;
