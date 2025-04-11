import http from "http";
import cors from "cors";
// server/src/index.ts
import express from "express";
import { Server } from "socket.io";
import { initializeFirebaseAdmin } from "./firebase-admin";
import statusService from "./services/status-service";
import { UserStatus } from "./types/user";

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
}

interface ClientToServerEvents {
	login: (data: { userId: string; [key: string]: any }) => void;
	join_room: (data: { roomId: string }) => void;
	leave_room: (data: { roomId: string }) => void;
}

interface InterServerEvents {
	ping: () => void;
}

interface SocketData {
	userId?: string;
}

// ตั้งค่า Express
const app = express();
const server = http.createServer(app);
const io = new Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>(server, {
	cors: {
		origin: process.env.CORS_ORIGIN || "*",
		methods: ["GET", "POST"],
	},
});

// Middleware
app.use(cors());
app.use(express.json());

// เริ่มต้นการเชื่อมต่อกับ Firebase
function initializeServices() {
	try {
		initializeFirebaseAdmin();
		console.log("เริ่มต้นบริการสำเร็จ");

		// เริ่มบริการสถานะออนไลน์
		statusService.startService();
	} catch (error) {
		console.error("เกิดข้อผิดพลาดในการเริ่มต้นบริการ:", error);
		process.exit(1);
	}
}

// เริ่มต้น Socket.IO
function setupSocketIO() {
	io.on("connection", (socket) => {
		console.log(`ผู้ใช้เชื่อมต่อแล้ว: ${socket.id}`);

		// ตรวจสอบการเข้าสู่ระบบ
		socket.on("login", async (data) => {
			try {
				const { userId, ...userData } = data;

				// บันทึกข้อมูล userId ใน socket สำหรับใช้ต่อไป
				socket.data.userId = userId;

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
					// อัพเดทสถานะออฟไลน์
					await statusService.updateUserOfflineStatus(socket.data.userId);
					console.log(`ผู้ใช้ ${socket.data.userId} ตัดการเชื่อมต่อแล้ว`);
				} catch (error) {
					console.error("เกิดข้อผิดพลาดในการอัพเดทสถานะออฟไลน์:", error);
				}
			}
		});
	});
}

// API routes
app.get("/api/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// API สำหรับข้อมูลสถานะออนไลน์
app.get("/api/status/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		// ดึงข้อมูลสถานะจาก Firebase
		const admin = getFirebaseAdmin();
		const db = admin.database();
		const userStatusRef = db.ref(`status/${userId}`);

		const snapshot = await userStatusRef.once("value");
		const status = snapshot.val() || { online: false };

		res.status(200).json(status);
	} catch (error) {
		console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ:", error);
		res.status(500).json({ error: "ไม่สามารถดึงข้อมูลสถานะได้" });
	}
});

// API สำหรับดึงข้อมูลสมาชิกในห้อง
app.get("/api/rooms/:roomId/members", async (req, res) => {
	try {
		const { roomId } = req.params;
		const members = await statusService.getRoomMembersStatus(roomId);
		res.status(200).json(members);
	} catch (error) {
		console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิกในห้อง:", error);
		res.status(500).json({ error: "ไม่สามารถดึงข้อมูลสมาชิกในห้องได้" });
	}
});

// เริ่มต้นเซิร์ฟเวอร์
function startServer() {
	try {
		initializeServices();
		setupSocketIO();

		const PORT = process.env.PORT || 5001;
		server.listen(PORT, () => {
			console.log(`เซิร์ฟเวอร์ทำงานที่พอร์ต ${PORT}`);
		});
	} catch (error) {
		console.error("เกิดข้อผิดพลาดในการเริ่มต้นเซิร์ฟเวอร์:", error);
		process.exit(1);
	}
}

// จัดการการปิดเซิร์ฟเวอร์
process.on("SIGINT", () => {
	console.log("ได้รับสัญญาณ SIGINT กำลังปิดเซิร์ฟเวอร์...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("ได้รับสัญญาณ SIGTERM กำลังปิดเซิร์ฟเวอร์...");
	process.exit(0);
});

// เริ่มต้นเซิร์ฟเวอร์
startServer();
