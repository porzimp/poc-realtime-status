sequenceDiagram
participant User as ผู้ใช้งาน
participant App as React Application
participant FB as Firebase Realtime Database

    %% การเริ่มต้นแอปพลิเคชัน
    User->>App: เปิดแอปพลิเคชัน
    App->>App: ตรวจสอบ localStorage

    alt มี userId ในระบบ
        App->>FB: ตรวจสอบการเชื่อมต่อ
        FB->>App: เชื่อมต่อสำเร็จ
        App->>FB: อัปเดตสถานะผู้ใช้เป็นออนไลน์<br/>(set ที่ /users/{userId})
        App->>FB: ตั้งค่า onDisconnect handler
        App->>FB: ติดตามการเปลี่ยนแปลงข้อมูลผู้ใช้<br/>(onValue ที่ /users)
        FB-->>App: ส่งข้อมูลผู้ใช้ทั้งหมด
        App->>User: แสดงรายการผู้ใช้และสถานะ
    else ยังไม่มี userId
        App->>User: แสดงหน้าล็อกอิน
        User->>App: กรอกรหัสผู้ใช้/กดใช้รหัสสุ่ม
        App->>App: บันทึก userId ใน localStorage
        App->>FB: ตรวจสอบการเชื่อมต่อ
        FB->>App: เชื่อมต่อสำเร็จ
        App->>FB: อัปเดตสถานะผู้ใช้เป็นออนไลน์<br/>(set ที่ /users/{userId})
        App->>FB: ตั้งค่า onDisconnect handler
        App->>FB: ติดตามการเปลี่ยนแปลงข้อมูลผู้ใช้<br/>(onValue ที่ /users)
        FB-->>App: ส่งข้อมูลผู้ใช้ทั้งหมด
        App->>User: แสดงรายการผู้ใช้และสถานะ
    end

    %% การอัปเดตสถานะอัตโนมัติ
    loop ทุก 1 นาที ถ้าเว็บยังเปิดอยู่
        App->>FB: อัปเดต lastSeen<br/>(set ที่ /users/{userId})
    end

    %% การตรวจจับการเปลี่ยนแปลงข้อมูลผู้ใช้
    FB-->>App: ข้อมูลผู้ใช้มีการเปลี่ยนแปลง
    App->>User: อัปเดตหน้าจอแสดงผล

    %% การออกจากระบบด้วยตัวเอง
    User->>App: กดปุ่มออกจากระบบ
    App->>FB: อัปเดตสถานะเป็นออฟไลน์<br/>(set ที่ /users/{userId})
    App->>App: ลบ userId จาก localStorage
    App->>User: แสดงหน้าล็อกอินอีกครั้ง

    %% การตัดการเชื่อมต่อ
    User->>App: ปิดแท็บ/เบราวเซอร์
    Note over App,FB: onDisconnect handler ทำงานอัตโนมัติ
    App->>FB: อัปเดตสถานะเป็นออฟไลน์<br/>(onDisconnect ที่ /users/{userId})
