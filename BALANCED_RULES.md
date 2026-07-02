# BALANCED_RULES.md

# Zombie Boardgame - Balanced Rule Set

## 1. เป้าหมายการปรับสมดุล

กติกาชุดนี้ออกแบบเพื่อให้เกม:

* ไม่จบเร็วเกินไป
* ผู้เล่นไม่ตายไวเกินจนหมดสนุก
* ปืนไม่โกงเกิน
* ซอมบี้ยังน่ากลัว แต่ไม่ชนะง่ายเกิน
* มีจังหวะ bluff, แก้เกม, และ comeback
* เล่นซ้ำได้หลายรอบโดยไม่รู้สึกว่ากติกา unfair

---

## 2. Battle Rules

### 2.1 จำนวนไพ่ที่วางได้

```txt
ผู้เล่นวางไพ่ได้สูงสุด 3 ใบต่อ battle
ไพ่พิเศษนับรวมในจำนวน 3 ใบ
```

ตัวอย่าง:

```txt
✅ 7♠ + 8♠ + SHOTGUN
✅ 5♥ + ZOMBIE_CARD
❌ 3♣ + 4♣ + 5♣ + SHOTGUN
```

---

### 2.2 กฎดอกไพ่

```txt
ไพ่ NUMBER ต้องเป็นดอกเดียวกัน
ไพ่พิเศษไม่สนดอก
```

ตัวอย่าง:

```txt
✅ 5♠ + 8♠
✅ 4♥ + 9♥ + SHOTGUN
❌ 6♣ + 7♦
```

---

### 2.3 การนับแต้ม

```txt
แต้ม battle = ผลรวมแต้มของไพ่ NUMBER
ไพ่พิเศษไม่มีแต้ม ยกเว้นมี effect ระบุไว้
```

ตัวอย่าง:

```txt
7♠ + 8♠ = 15 แต้ม
7♠ + SHOTGUN = 7 + bonus จาก SHOTGUN
```

---

## 3. Player State

ผู้เล่นทุกคนมีค่าสถานะหลักดังนี้:

```txt
HP: 2
Infection Level: 0/2
Status: HUMAN | ZOMBIE | ELIMINATED
```

---

## 4. HP Rules

```txt
ผู้เล่นทุกคนเริ่มต้น HP 2
เมื่อได้รับ damage จะเสีย HP ตามผล battle
ถ้า HP เหลือ 0 จะถูก ELIMINATED
```

### Damage ปกติ

```txt
แพ้ battle ปกติ → เสีย HP 1
แพ้ battle โดยแต้มต่างกัน 5 ขึ้นไป → เสีย HP 2
```

---

## 5. Infection Rules

### 5.1 การติดเชื้อ

```txt
มนุษย์มี Infection Level 0/2
เมื่อถูกซอมบี้แพร่เชื้อสำเร็จ → Infection +1
เมื่อ Infection ครบ 2 → กลายเป็น ZOMBIE
```

### 5.2 เมื่อกลายเป็นซอมบี้

```txt
ผู้เล่นเปลี่ยน status เป็น ZOMBIE
ได้รับ ZOMBIE_CARD 1 ใบ
HP คงเหลือตามเดิม
```

---

## 6. Shotgun Rules

### 6.1 การได้รับปืนตอนเริ่มเกม

```txt
มนุษย์ทุกคนไม่ได้เริ่มต้นด้วย SHOTGUN
จำนวน SHOTGUN เริ่มต้น = floor(humanCount / 2)
แจกแบบสุ่มให้มนุษย์
```

ตัวอย่าง:

```txt
มนุษย์ 4 คน → มี SHOTGUN เริ่มต้น 2 ใบ
มนุษย์ 5 คน → มี SHOTGUN เริ่มต้น 2 ใบ
มนุษย์ 6 คน → มี SHOTGUN เริ่มต้น 3 ใบ
```

---

### 6.2 ขีดจำกัดการถือปืน

```txt
ผู้เล่นถือ SHOTGUN ได้สูงสุด 2 ใบ
```

---

### 6.3 การใช้ปืน

```txt
SHOTGUN ใช้ได้ครั้งเดียว
เมื่อใช้ SHOTGUN จะได้รับ bonus +3 แต้ม
หลังใช้แล้ว SHOTGUN จะถูกทิ้ง
```

---

### 6.4 มนุษย์ใช้ปืน vs มนุษย์

```txt
ถ้าผู้ใช้ SHOTGUN ชนะ:
- ฝ่ายแพ้เสีย HP 1
- ถ้าชนะห่าง 5 แต้มขึ้นไป ฝ่ายแพ้เสีย HP 2

ถ้าผู้ใช้ SHOTGUN แพ้:
- ฝ่ายตรงข้ามเลือกได้ 1 อย่าง:
  1. ยึด SHOTGUN ถ้ายังถือไม่เกิน limit
  2. ทำให้ผู้ใช้ SHOTGUN เสีย HP 1
```

---

### 6.5 มนุษย์ใช้ปืน vs ซอมบี้

```txt
ถ้ามนุษย์ใช้ SHOTGUN ชนะ:
- ซอมบี้เสีย HP 1
- ถ้าชนะห่าง 5 แต้มขึ้นไป ซอมบี้เสีย HP 2

ถ้ามนุษย์ใช้ SHOTGUN แพ้:
- มนุษย์ได้รับ Infection +1
```

---

## 7. Zombie Card Rules

### 7.1 การใช้ ZOMBIE_CARD

```txt
ซอมบี้ใช้ ZOMBIE_CARD เพื่อพยายามแพร่เชื้อมนุษย์
ZOMBIE_CARD ไม่เพิ่มแต้ม
```

---

### 7.2 ซอมบี้ใช้ ZOMBIE_CARD vs มนุษย์

```txt
ถ้าซอมบี้ชนะ:
- มนุษย์ได้รับ Infection +1
- คืน ZOMBIE_CARD ให้ซอมบี้

ถ้าซอมบี้แพ้:
- ซอมบี้ถูกเปิดเผยตัวตน
- คืน ZOMBIE_CARD ให้ซอมบี้

ถ้าเสมอ:
- ไม่มีใครได้รับผล
- คืน ZOMBIE_CARD ให้ซอมบี้
```

---

### 7.3 ซอมบี้ vs ซอมบี้

```txt
นับคะแนนตามปกติ
ไม่มีการแพร่เชื้อ
ไม่มีผลจาก ZOMBIE_CARD
```

---

## 8. Revealed Zombie Rules

```txt
เมื่อซอมบี้แพร่เชื้อไม่สำเร็จ จะติดสถานะ REVEALED
```

ผลของสถานะ REVEALED:

```txt
มนุษย์ได้ bonus +2 แต้ม เมื่อต่อสู้กับซอมบี้ที่ถูก REVEALED
สถานะ REVEALED อยู่จนจบเกม
```

---

## 9. Battle Result Summary

| สถานการณ์                       | ผลลัพธ์                         |
| ------------------------------- | ------------------------------- |
| มนุษย์ชนะมนุษย์                 | ฝ่ายแพ้เสีย HP 1                |
| มนุษย์ชนะขาด 5+                 | ฝ่ายแพ้เสีย HP 2                |
| มนุษย์ใช้ SHOTGUN ชนะ           | ฝ่ายแพ้เสีย HP ตามกติกา         |
| มนุษย์ใช้ SHOTGUN แพ้มนุษย์     | อีกฝ่ายเลือกยึดปืนหรือทำ damage |
| มนุษย์ใช้ SHOTGUN แพ้ซอมบี้     | มนุษย์ได้รับ Infection +1       |
| ซอมบี้ใช้ ZOMBIE_CARD ชนะมนุษย์ | มนุษย์ได้รับ Infection +1       |
| ซอมบี้ใช้ ZOMBIE_CARD แพ้มนุษย์ | ซอมบี้ถูก REVEALED              |
| Infection ครบ 2                 | กลายเป็น ZOMBIE                 |
| HP เหลือ 0                      | ELIMINATED                      |

---

## 10. Recommended Implementation Changes

### 10.1 เปลี่ยนจำนวนไพ่สูงสุด

```ts
const MAX_CARDS_PER_BATTLE = 3;
```

---

### 10.2 เพิ่มค่า HP และ Infection

```ts
type PlayerStatus = "HUMAN" | "ZOMBIE" | "ELIMINATED";

interface Player {
  id: string;
  name: string;
  status: PlayerStatus;
  hp: number;
  infectionLevel: number;
  isRevealed?: boolean;
}
```

---

### 10.3 เพิ่มค่าคงที่ของเกม

```ts
const INITIAL_HP = 2;
const MAX_INFECTION = 2;
const MAX_SHOTGUNS = 2;
const SHOTGUN_BONUS = 3;
const BIG_WIN_DIFFERENCE = 5;
const REVEALED_ZOMBIE_BONUS = 2;
```

---

## 11. Final Recommended Rule Set

```txt
1. วางไพ่ได้สูงสุด 3 ใบต่อ battle
2. ไพ่ NUMBER ต้องเป็นดอกเดียวกัน
3. ไพ่พิเศษนับรวมใน 3 ใบ
4. ผู้เล่นทุกคนมี HP 2
5. HP เหลือ 0 = ELIMINATED
6. มนุษย์มี Infection 0/2
7. Infection ครบ 2 = กลายเป็น ZOMBIE
8. SHOTGUN ให้ bonus +3 แต้ม
9. SHOTGUN ไม่ฆ่าทันที ยกเว้นทำให้ HP เหลือ 0
10. เริ่มเกมสุ่มแจก SHOTGUN ให้มนุษย์แค่ floor(humanCount / 2)
11. ถือ SHOTGUN ได้สูงสุด 2 ใบ
12. ZOMBIE_CARD คืนกลับให้ซอมบี้หลังใช้เสมอ
13. ซอมบี้แพ้ตอนใช้ ZOMBIE_CARD จะถูก REVEALED
14. มนุษย์ได้ +2 แต้มเมื่อต่อสู้กับซอมบี้ที่ REVEALED
```

---

## 12. Design Goal

กติกานี้ทำให้เกมมีจังหวะมากขึ้น:

```txt
ปืน = เครื่องมือเสี่ยง ไม่ใช่ปุ่มลบผู้เล่น
ซอมบี้ = ภัยค่อยๆ ลุกลาม ไม่ใช่แพ้ทีเดียวจบชีวิต
HP = กันผู้เล่นตายไวเกิน
Infection = เพิ่ม drama และโอกาส comeback
Reveal = ทำให้ซอมบี้ต้องคิดก่อนเปิดเกมบุก
```
