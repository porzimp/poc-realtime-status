flowchart TB
subgraph "Client Side (React Application)"
A[App.tsx] --> B[Login Component]
A --> C[UserList Component]
A --> D[useUserStatus Hook]

        D <--> E[Firebase Service]
        C <--> E

        E <--> F[Browser localStorage]
    end

    subgraph "Firebase Cloud"
        G[Firebase Realtime Database] --- H["/users" Node]
        H --- I["{userId1}" Node]
        H --- J["{userId2}" Node]
        H --- K["{userId3}" Node]

        I --- I1[isOnline: true/false]
        I --- I2[lastSeen: timestamp]

        J --- J1[isOnline: true/false]
        J --- J2[lastSeen: timestamp]

        K --- K1[isOnline: true/false]
        K --- K2[lastSeen: timestamp]
    end

    E <---> G

    %% สัญลักษณ์การเชื่อมต่อ
    classDef component fill:#f9d5e5,stroke:#333,stroke-width:2px
    classDef hook fill:#c7ceea,stroke:#333,stroke-width:2px
    classDef service fill:#d8f8e1,stroke:#333,stroke-width:2px
    classDef storage fill:#eeeeee,stroke:#333,stroke-width:2px
    classDef firebase fill:#ffcc99,stroke:#333,stroke-width:2px
    classDef node fill:#b5ead7,stroke:#333,stroke-width:2px
    classDef data fill:#e2eafc,stroke:#333,stroke-width:1px

    class A,B,C component
    class D hook
    class E service
    class F storage
    class G firebase
    class H,I,J,K node
    class I1,I2,J1,J2,K1,K2 data

    %% การเพิ่ม annotations
    H:::node
