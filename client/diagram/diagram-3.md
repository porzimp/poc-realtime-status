graph LR
subgraph "การส่งข้อมูลจาก App ไป Firebase"
direction TB
A1[เข้าสู่ระบบ] --> A2["firebase.ts: updateUserStatus()"]
A3[อัปเดตเวลาทุก 1 นาที] --> A2
A4[ออกจากระบบ] --> A2
A2 --> A5["set(ref(database, users/{userId}), status)"]
A5 --> A6[Firebase\nRealtime Database]
end

    subgraph "การรับข้อมูลจาก Firebase มายัง App"
        direction TB
        B1[Firebase\nRealtime Database] --"ข้อมูลมีการเปลี่ยนแปลง"--> B2["firebase.ts: subscribeToUsers()"]
        B2 --"onValue() callback"--> B3["UserList: แปลงข้อมูลและจัดเรียง"]
        B3 --> B4["UserList: อัปเดต UI"]
    end

    subgraph "การตั้งค่า onDisconnect handler"
        direction TB
        C1[เข้าสู่ระบบ] --> C2["firebase.ts: setupPresence()"]
        C2 --> C3["onDisconnect(ref).update({...})"]
        C3 --> C4[บันทึกไว้ใน Firebase Server\nรอการตัดการเชื่อมต่อ]
        C5[ผู้ใช้ปิดแท็บ/เบราวเซอร์] --> C6[Firebase ตรวจพบ\nการตัดการเชื่อมต่อ]
        C6 --> C7[Firebase ทำงานตาม\nonDisconnect handler]
        C7 --> C8[อัปเดตสถานะเป็นออฟไลน์\nพร้อมเวลาล่าสุด]
    end

    classDef app fill:#f9d5e5,stroke:#333,stroke-width:2px
    classDef service fill:#d8f8e1,stroke:#333,stroke-width:2px
    classDef firebase fill:#ffcc99,stroke:#333,stroke-width:2px
    classDef action fill:#c7ceea,stroke:#333,stroke-width:2px

    class A1,A3,A4,B4,C1,C5 app
    class A2,A5,B2,B3,C2,C3,C7,C8 service
    class A6,B1,C4,C6 firebase
