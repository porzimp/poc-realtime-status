sequenceDiagram
participant User1 as ผู้ใช้ 1<br/>(user_123)
participant App1 as แอปของผู้ใช้ 1
participant Firebase as Firebase Realtime DB
participant App2 as แอปของผู้ใช้ 2
participant User2 as ผู้ใช้ 2<br/>(user_456)

    %% การเริ่มตั้งของผู้ใช้ 1
    User1->>App1: เปิดแอปพลิเคชัน
    App1->>Firebase: ล็อกอิน user_123
    App1->>Firebase: ตั้งค่า isOnline: true
    App1->>Firebase: ติดตามการเปลี่ยนแปลงที่ /users
    Firebase-->>App1: ส่งข้อมูลผู้ใช้ทั้งหมด
    App1->>User1: แสดงรายการผู้ใช้

    %% การเริ่มต้นของผู้ใช้ 2
    User2->>App2: เปิดแอปพลิเคชัน
    App2->>Firebase: ล็อกอิน user_456
    App2->>Firebase: ตั้งค่า isOnline: true
    App2->>Firebase: ติดตามการเปลี่ยนแปลงที่ /users

    %% Firebase แจ้งทั้งสองฝั่ง
    Firebase-->>App1: แจ้งเตือนการเปลี่ยนแปลง<br/>(มีผู้ใช้ user_456 เข้ามาใหม่)
    Firebase-->>App2: ส่งข้อมูลผู้ใช้ทั้งหมด

    %% แสดงผลให้ผู้ใช้ทั้งสองเห็น
    App1->>User1: อัปเดตรายการผู้ใช้<br/>(แสดง user_456 เป็นออนไลน์)
    App2->>User2: แสดงรายการผู้ใช้<br/>(แสดง user_123 เป็นออนไลน์)

    %% ผู้ใช้ 1 ออกจากระบบ
    User1->>App1: กดปุ่มออกจากระบบ
    App1->>Firebase: ตั้งค่า isOnline: false, lastSeen: timestamp
    Firebase-->>App2: แจ้งเตือนการเปลี่ยนแปลง<br/>(user_123 ออฟไลน์)
    App2->>User2: อัปเดตรายการผู้ใช้<br/>(แสดง user_123 เป็นออฟไลน์)

    %% ผู้ใช้ 2 ปิดแท็บโดยไม่ได้ล็อกเอาท์
    User2->>App2: ปิดแท็บเบราวเซอร์
    Note over App2,Firebase: onDisconnect handler ทำงาน
    Firebase->>Firebase: ตั้งค่า user_456<br/>isOnline: false, lastSeen: timestamp

    %% ผู้ใช้ 1 กลับเข้าระบบอีกครั้ง
    User1->>App1: ล็อกอินใหม่
    App1->>Firebase: ล็อกอิน user_123
    App1->>Firebase: ตั้งค่า isOnline: true
    App1->>Firebase: ติดตามการเปลี่ยนแปลงที่ /users
    Firebase-->>App1: ส่งข้อมูลผู้ใช้ทั้งหมด
    App1->>User1: แสดงรายการผู้ใช้<br/>(แสดง user_456 เป็นออฟไลน์พร้อมเวลาล่าสุด)
