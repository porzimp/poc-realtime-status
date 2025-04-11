// server/src/services/status-service.ts
import { getDatabase } from "firebase-admin/database";
import { ServerValue } from "firebase-admin/database";
import { getFirebaseAdmin } from "../firebase-admin";
import { UserStatus } from "../types/user";

// เริ่มต้นใช้งาน Firebase Admin
const admin = getFirebaseAdmin();
const db = getDatabase();

interface StatusServiceOptions {
	cleanupInterval?: number; // เวลาในการทำความสะอาดผู้ใช้ที่ไม่ได้ active (นาที)
}

/**
 * บริการจัดการสถานะออนไลน์
 */
class StatusService {
	private cleanupInterval: number;

	/**
	 * สร้าง StatusService
	 * @param options - ตัวเลือกสำหรับบริการสถานะออนไลน์
	 */
	constructor(options: StatusServiceOptions = {}) {
		this.cleanupInterval = options.cleanupInterval || 60; // ค่าเริ่มต้น 60 นาที
	}

	/**
	 * อัพเดทสถานะผู้ใช้เมื่อเข้าสู่ระบบ
	 * @param userId - ID ของผู้ใช้
	 * @param data - ข้อมูลเพิ่มเติม (อุปกรณ์, IP, ฯลฯ)
	 */
	async updateUserOnlineStatus(
		userId: string,
		data: Record<string, any> = {},
	): Promise<boolean> {
		try {
			// อัพเดท Firebase Realtime Database
			const userStatusRef = db.ref(`status/${userId}`);
			await userStatusRef.update({
				online: true,
				lastSeenAt: ServerValue.TIMESTAMP,
				status: "active",
				...data,
			});

			console.log(`อัพเดทสถานะออนไลน์ของผู้ใช้ ${userId} สำเร็จ`);
			return true;
		} catch (error) {
			console.error("เกิดข้อผิดพลาดในการอัพเดทสถานะผู้ใช้:", error);
			throw error;
		}
	}

	/**
	 * อัพเดทสถานะผู้ใช้เมื่อออกจากระบบ
	 * @param userId - ID ของผู้ใช้
	 */
	async updateUserOfflineStatus(userId: string): Promise<boolean> {
		try {
			// อัพเดท Firebase Realtime Database
			const userStatusRef = db.ref(`status/${userId}`);
			await userStatusRef.update({
				online: false,
				lastSeenAt: ServerValue.TIMESTAMP,
				status: "offline",
			});

			console.log(`อัพเดทสถานะออฟไลน์ของผู้ใช้ ${userId} สำเร็จ`);
			return true;
		} catch (error) {
			console.error("เกิดข้อผิดพลาดในการอัพเดทสถานะผู้ใช้:", error);
			throw error;
		}
	}

	/**
	 * เพิ่มผู้ใช้เข้าห้อง
	 * @param roomId - ID ของห้อง
	 * @param userId - ID ของผู้ใช้
	 */
	async addUserToRoom(roomId: string, userId: string): Promise<boolean> {
		try {
			// อัพเดท Firebase Realtime Database
			const roomMembersRef = db.ref(`rooms/${roomId}/members/${userId}`);
			await roomMembersRef.set(true);

			// อัพเดทรายการห้องของผู้ใช้
			const userRoomsRef = db.ref(`user_rooms/${userId}/${roomId}`);
			await userRoomsRef.set(true);

			console.log(`เพิ่มผู้ใช้ ${userId} เข้าห้อง ${roomId} สำเร็จ`);
			return true;
		} catch (error) {
			console.error("เกิดข้อผิดพลาดในการเพิ่มผู้ใช้เข้าห้อง:", error);
			throw error;
		}
	}

	/**
	 * ลบผู้ใช้ออกจากห้อง
	 * @param roomId - ID ของห้อง
	 * @param userId - ID ของผู้ใช้
	 */
	async removeUserFromRoom(roomId: string, userId: string): Promise<boolean> {
		try {
			// อัพเดท Firebase Realtime Database
			const roomMembersRef = db.ref(`rooms/${roomId}/members/${userId}`);
			await roomMembersRef.remove();

			// ลบรายการห้องของผู้ใช้
			const userRoomsRef = db.ref(`user_rooms/${userId}/${roomId}`);
			await userRoomsRef.remove();

			console.log(`ลบผู้ใช้ ${userId} ออกจากห้อง ${roomId} สำเร็จ`);
			return true;
		} catch (error) {
			console.error("เกิดข้อผิดพลาดในการลบผู้ใช้ออกจากห้อง:", error);
			throw error;
		}
	}

	/**
	 * สร้างห้องใหม่
	 * @param roomId - ID ของห้อง
	 * @param roomData - ข้อมูลห้อง
	 */
	async createRoom(
		roomId: string,
		roomData: Record<string, any>,
	): Promise<boolean> {
		try {
			// เพิ่มห้องใน Firebase Realtime Database
			const roomRef = db.ref(`rooms/${roomId}`);
			await roomRef.set({
				name: roomData.name,
				description: roomData.description,
				type: roomData.type,
				createdAt: ServerValue.TIMESTAMP,
				members: {},
			});

			console.log(`สร้างห้อง ${roomId} สำเร็จ`);
			return true;
		} catch (error) {
			console.error("เกิดข้อผิดพลาดในการสร้างห้อง:", error);
			throw error;
		}
	}

	/**
	 * ดึงข้อมูลสถานะออนไลน์ของสมาชิกในห้อง
	 * @param roomId - ID ของห้อง
	 */
	async getRoomMembersStatus(
		roomId: string,
	): Promise<Array<{ userId: string; status: UserStatus }>> {
		try {
			// ดึงรายชื่อสมาชิกใน Firebase
			const roomRef = db.ref(`rooms/${roomId}/members`);
			const snapshot = await roomRef.once("value");
			const members = snapshot.val() as Record<string, boolean> | null;

			if (!members) {
				return [];
			}

			// ดึงข้อมูลสถานะจาก Firebase
			const memberIds = Object.keys(members);
			const memberStatuses: Array<{ userId: string; status: UserStatus }> = [];

			// ใช้ Promise.all เพื่อดึงข้อมูลพร้อมกัน
			await Promise.all(
				memberIds.map(async (userId) => {
					const userStatusRef = db.ref(`status/${userId}`);
					const snapshot = await userStatusRef.once("value");
					const statusData = snapshot.val();

					const defaultStatus: UserStatus = {
						online: false,
						lastSeenAt: new Date().toISOString(),
						status: "offline",
					};

					const status = statusData || defaultStatus;

					memberStatuses.push({
						userId,
						status,
					});
				}),
			);

			return memberStatuses;
		} catch (error) {
			console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสถานะสมาชิกในห้อง:", error);
			throw error;
		}
	}

	/**
	 * ตรวจสอบผู้ใช้ที่ไม่ได้ active (เพื่อทำ cleanup)
	 * @param inactiveHours - จำนวนชั่วโมงที่ไม่มีกิจกรรม
	 */
	async cleanupInactiveUsers(inactiveHours: number = 24): Promise<number> {
		try {
			const cutoffTime = Date.now() - inactiveHours * 60 * 60 * 1000;

			// ดึงข้อมูลสถานะผู้ใช้จาก Firebase
			const statusRef = db.ref("status");
			const snapshot = await statusRef.once("value");
			const statuses = snapshot.val() as Record<string, UserStatus> | null;

			if (!statuses) {
				return 0;
			}

			// หาผู้ใช้ที่ไม่ได้ active
			const inactiveUsers: string[] = [];

			Object.entries(statuses).forEach(([userId, status]) => {
				if (status.online && status.lastSeenAt) {
					const lastSeenTime = new Date(status.lastSeenAt).getTime();
					if (lastSeenTime < cutoffTime) {
						inactiveUsers.push(userId);
					}
				}
			});

			// อัพเดทสถานะของผู้ใช้ที่ไม่ได้ active
			for (const userId of inactiveUsers) {
				await this.updateUserOfflineStatus(userId);
			}

			console.log(
				`ทำความสะอาดผู้ใช้ที่ไม่ได้ active จำนวน ${inactiveUsers.length} คน`,
			);
			return inactiveUsers.length;
		} catch (error) {
			console.error("เกิดข้อผิดพลาดในการทำความสะอาดผู้ใช้ที่ไม่ได้ active:", error);
			throw error;
		}
	}

	/**
	 * เริ่มการทำงานของบริการสถานะออนไลน์
	 */
	startService(): void {
		// ตั้งเวลาทำความสะอาดผู้ใช้ที่ไม่ได้ active
		setInterval(
			async () => {
				try {
					await this.cleanupInactiveUsers(1); // ทำความสะอาดผู้ใช้ที่ไม่ได้ active มากกว่า 1 ชั่วโมง
				} catch (error) {
					console.error("เกิดข้อผิดพลาดในการทำงานตามกำหนดเวลา:", error);
				}
			},
			this.cleanupInterval * 60 * 1000,
		);

		console.log(
			`เริ่มบริการสถานะออนไลน์แล้ว (ทำความสะอาดทุก ${this.cleanupInterval} นาที)`,
		);
	}
}

// สร้าง instance เดียวสำหรับการใช้งานทั่วเซิร์ฟเวอร์
const statusService = new StatusService();

export default statusService;
