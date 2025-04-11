// server/src/firebase-admin.ts
import * as admin from "firebase-admin";
import { App } from "firebase-admin/app";

// สำหรับการใช้งานใน production ควรใช้ environment variables
// หรือเก็บในที่ปลอดภัย เช่น secrets manager
let firebaseAdmin: App;

/**
 * เริ่มต้นใช้งาน Firebase Admin SDK
 * @returns Firebase Admin app instance
 */
function initializeFirebaseAdmin(): App {
	if (!firebaseAdmin) {
		// ในระบบจริงควรใช้ service account key จาก environment variable
		// หรือใช้ default credentials ใน production environment
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const serviceAccount = require("../service-account-key.json");

			firebaseAdmin = admin.initializeApp({
				credential: admin.credential.cert(
					serviceAccount as admin.ServiceAccount,
				),
				databaseURL:
					process.env.FIREBASE_DATABASE_URL ||
					"https://test-realtime-8cbb5-default-rtdb.asia-southeast1.firebasedatabase.app",
			});

			console.log("เริ่มต้น Firebase Admin SDK สำเร็จ");
		} catch (error) {
			console.error("ไม่สามารถเริ่มต้น Firebase Admin SDK:", error);
			throw error;
		}
	}

	return firebaseAdmin;
}

/**
 * ดึง Firebase Admin instance ที่มีการเริ่มต้นแล้ว
 * @returns Firebase Admin app instance
 */
function getFirebaseAdmin(): App {
	if (!firebaseAdmin) {
		return initializeFirebaseAdmin();
	}
	return firebaseAdmin;
}

export { initializeFirebaseAdmin, getFirebaseAdmin };
