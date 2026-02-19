# 🔫 Shotgun Choice Feature - การเลือกการกระทำเมื่อยึดปืนได้

## 📋 สรุปการอัปเดต

เพิ่มระบบให้ผู้เล่นสามารถเลือกการกระทำได้เมื่อชนะการต่อสู้กับฝั่งตรงข้ามที่ใช้ไพ่ปืน โดยมี 2 ตัวเลือก:
1. **ยึดปืนมาใช้เอง** - เพิ่มไพ่ปืนให้ผู้เล่น (สูงสุด 3 ใบ)
2. **ใช้ปืนยิงฝั่งตรงข้าม** - กำจัดผู้เล่นที่แพ้ออกจากเกม

## ⚙️ กติกาที่ใช้งาน

### 2. กรณีฝั่งมนุษย์ใช้ไพ่ปืน

#### 2.1 ฝั่งตรงข้ามเป็นมนุษย์

**2.1.1 แต้มของคนใช้ไพ่ปืนสูงกว่า**
- ✅ ฝั่งตรงข้ามถูกยิงตาย (ถูกกำจัดออกจากเกม)

**2.1.2 แต้มของคนใช้ไพ่ปืนน้อยกว่า** ⭐ **NEW**
- ✅ ผู้เล่นฝั่งตรงข้ามสามารถเลือกได้ว่าจะ:
  - **ยึดปืนมาใช้เอง** - ได้ไพ่ปืนเพิ่ม (สูงสุด 3 ใบ)
  - **ยิงฝั่งตรงข้ามให้ตาย** - ใช้ปืนของผู้แพ้ยิงผู้แพ้เอง

## 📁 ไฟล์ที่เปลี่ยนแปลง

### 1. `/types/game.ts`
เพิ่ม field ใหม่ใน `Battle` interface:
```typescript
export interface Battle {
  // ... existing fields
  pendingShotgunChoice?: {
    chooserId: string;      // ผู้เล่นที่ต้องเลือก
    loserId: string;        // ผู้เล่นที่แพ้
    shotgunCard: Card;      // ไพ่ปืนที่จะถูกยึด
  };
}
```

### 2. `/lib/gameLogic.ts`
อัปเดต `determineBattleWinner` function:
- เพิ่ม return types ใหม่:
  - `needsPlayerChoice?: boolean`
  - `chooserId?: string`
  - `loserId?: string`
  - `shotgunAction: 'pending_choice'` (เพิ่ม)

- แก้ไข logic กรณี 2.1.2:
  ```typescript
  else if (total1 < total2) {
    return {
      winnerId: player2.id,
      isInfection: false,
      shotgunAction: 'pending_choice',
      needsPlayerChoice: true,
      chooserId: player2.id,
      loserId: player1.id
    };
  }
  ```

### 3. `/lib/socket.ts`

#### เพิ่ม Socket Event ใหม่: `choose-shotgun-action`
```typescript
socket.on('choose-shotgun-action', (data: { 
  roomId: string; 
  battleId: string; 
  action: 'steal' | 'kill_opponent' 
}) => {
  // จัดการการเลือกของผู้เล่น
});
```

#### เพิ่ม Socket Event ใหม่: `shotgun-choice-required`
```typescript
io.to(room.id).emit('shotgun-choice-required', {
  battleId: battle.id,
  chooserId: result.chooserId,
  chooserName: chooser?.name,
  loserId: result.loserId,
  loserName: loser?.name
});
```

#### แก้ไข `resolveBattle` function:
- เพิ่มการตรวจสอบ `needsPlayerChoice`
- หยุด battle ไว้และรอการเลือกจากผู้เล่น
- ลบ logic auto-steal ปืนออก

### 4. `/components/ShotgunChoiceModal.tsx` ⭐ **NEW**
Component ใหม่สำหรับแสดง Modal ให้ผู้เล่นเลือก:
- แสดงชื่อผู้เล่นที่ชนะและแพ้
- ปุ่มเลือก 2 ตัวเลือก พร้อม icon และคำอธิบาย
- การแสดงผลแบบ responsive
- Animation และ styling ที่สวยงาม

### 5. `/components/ShotgunChoiceModal.module.css` ⭐ **NEW**
Styling สำหรับ Modal:
- Overlay แบบโปร่งแสง
- Animation fadeIn และ slideUp
- Gradient backgrounds
- Hover effects
- Responsive design

### 6. `/components/GameBoard.tsx`

#### เพิ่ม States:
```typescript
const [showShotgunChoice, setShowShotgunChoice] = useState(false);
const [shotgunChoiceData, setShotgunChoiceData] = useState<{
  battleId: string;
  chooserId: string;
  chooserName: string;
  loserId: string;
  loserName: string;
} | null>(null);
```

#### เพิ่ม Handler:
```typescript
const handleShotgunChoice = (battleId: string, action: 'steal' | 'kill_opponent') => {
  socket.emit('choose-shotgun-action', { 
    roomId: room.id, 
    battleId, 
    action 
  });
  setShowShotgunChoice(false);
  setShotgunChoiceData(null);
};
```

#### เพิ่ม Socket Listener:
```typescript
socket.on('shotgun-choice-required', (data) => {
  setShotgunChoiceData(data);
  setShowShotgunChoice(true);
});
```

#### เพิ่ม Modal ใน JSX:
```typescript
<ShotgunChoiceModal
  isOpen={showShotgunChoice && shotgunChoiceData?.chooserId === myPlayerId}
  battleId={shotgunChoiceData?.battleId || ''}
  chooserName={shotgunChoiceData?.chooserName || ''}
  loserName={shotgunChoiceData?.loserName || ''}
  onChoose={handleShotgunChoice}
/>
```

## 🎮 Flow การทำงาน

1. **Player A (มนุษย์)** ใช้ไพ่ปืน + ไพ่ตัวเลข แต้มรวม 5
2. **Player B (มนุษย์)** ใช้ไพ่ตัวเลข แต้มรวม 8
3. Player B ชนะ (8 > 5) → Server ตรวจสอบเงื่อนไข
4. Server พบว่าตรงกับกรณี 2.1.2 → ส่ง `shotgun-choice-required` event
5. Player B เห็น Modal ขึ้นมาพร้อม 2 ตัวเลือก:
   - 🤝 **ยึดปืนมาใช้เอง**
   - 💀 **ใช้ปืนยิงฝั่งตรงข้าม**
6. Player B เลือกตัวเลือกหนึ่ง → ส่ง `choose-shotgun-action` event
7. Server ประมวลผล:
   - ถ้าเลือก `steal`: เพิ่มไพ่ปืนให้ Player B
   - ถ้าเลือก `kill_opponent`: กำจัด Player A ออกจากเกม
8. จบ battle และตรวจสอบสภาพเกม

## ⏱️ Timeout (Future Enhancement)

ปัจจุบันมี warning ข้อความ "⚠️ กรุณาเลือกภายใน 30 วินาที" แต่ยังไม่มี logic บังคับ
สามารถเพิ่มได้ในอนาคตโดย:
- เพิ่ม timer ใน battle state
- ถ้าหมดเวลาให้เลือกอัตโนมัติ (default: steal)

## ✅ Testing Checklist

- [x] Build สำเร็จ (`npm run build`)
- [x] TypeScript compile ไม่มี error
- [ ] ทดสอบการเล่นจริง:
  - [ ] กรณี Human ใช้ปืน vs Human (แพ้) → แสดง Modal
  - [ ] เลือก "ยึดปืน" → ได้ไพ่ปืนเพิ่ม
  - [ ] เลือก "ยิงฝั่งตรงข้าม" → ฝั่งตรงข้ามตาย
  - [ ] เช็คว่าเฉพาะผู้ชนะเท่านั้นที่เห็น Modal
  - [ ] Battle จบหลังจากเลือกเสร็จ
  - [ ] ได้ไพ่จากกระดาน battle ตามปกติ

## 🐛 Known Issues

- ยังไม่มี timeout mechanism
- ยังไม่มีการ disable ปุ่มเมื่อมีปืนครบ 3 ใบแล้ว (แต่มี logic check แล้ว)

## 🎯 Future Improvements

1. เพิ่ม countdown timer ใน Modal
2. เพิ่ม sound effects เมื่อเปิด Modal
3. เพิ่ม animation เมื่อเลือกแล้ว
4. แสดง notification ให้ผู้เล่นคนอื่นเห็นว่าใครกำลังเลือก
5. เพิ่ม history log ของการเลือก

---

**วันที่อัปเดต:** 19 กุมภาพันธ์ 2026
**เวอร์ชัน:** 1.0.0
**ผู้พัฒนา:** AI Assistant
