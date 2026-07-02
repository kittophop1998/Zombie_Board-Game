# DESIGN.md

# Zombie Boardgame Web App Design System

## 1. Design Direction

ระบบนี้เป็น web app สำหรับ boardgame แนว zombie survival ที่ได้แรงบันดาลใจจากเกมเอาตัวรอดแบบด่านทดสอบ แต่ปรับ mood ให้สดใส ทันสมัย และไม่สยองจนผู้ใช้รู้สึกเหมือนเปิดเว็บผิดชีวิต

เป้าหมายหลักของ UI คือ:

* สนุก
* อ่านง่าย
* ใช้งานเร็ว
* มีความเป็นเกม
* มีความตึงเครียดนิดๆ แต่ไม่มืดหรือกดดันเกินไป
* รองรับ mobile-first

---

## 2. Visual Concept

### Theme Name

**Neon Survival Playground**

### Keywords

* Bright survival
* Neon boardgame
* Playful zombie
* Modern arcade
* Soft danger
* Game dashboard
* Clean sci-fi

### Mood

แทนที่จะใช้โทน horror หนักๆ ให้ใช้โทนเหมือนสนามเกมกลางเมืองที่มีแสง neon, card, token, map, mission และ status ของผู้เล่น

---

## 3. Color Palette

### Primary Colors

```css
--color-primary: #7C5CFF;
--color-primary-soft: #EEE9FF;
--color-primary-dark: #4E35B8;
```

ใช้กับปุ่มหลัก, active state, selected card, important action

### Secondary Colors

```css
--color-secondary: #00D9C0;
--color-secondary-soft: #E5FFFB;
--color-secondary-dark: #009A89;
```

ใช้กับ success, safe zone, healing, player-ready state

### Accent Colors

```css
--color-accent-yellow: #FFD166;
--color-accent-orange: #FF9F45;
--color-accent-pink: #FF6FAE;
```

ใช้กับ item, badge, reward, warning แบบไม่ดุเกินไป

### Zombie / Danger Colors

```css
--color-danger: #FF4D6D;
--color-danger-soft: #FFE8EE;
--color-danger-dark: #B8203D;
```

ใช้กับ zombie alert, infected state, game over warning

### Background Colors

```css
--color-bg: #F8F7FF;
--color-bg-card: #FFFFFF;
--color-bg-soft: #F1F5FF;
--color-bg-dark: #171A2E;
```

### Text Colors

```css
--color-text-main: #202238;
--color-text-secondary: #6B6F8A;
--color-text-muted: #A0A4BD;
--color-text-inverse: #FFFFFF;
```

### Border Colors

```css
--color-border: #E4E7F5;
--color-border-active: #7C5CFF;
```

---

## 4. Typography

### Font Recommendation

ใช้ font ที่อ่านง่ายและทันสมัย:

```css
font-family: "Inter", "Prompt", sans-serif;
```

### Font Scale

```css
--font-xs: 12px;
--font-sm: 14px;
--font-md: 16px;
--font-lg: 20px;
--font-xl: 24px;
--font-2xl: 32px;
--font-3xl: 40px;
```

### Font Usage

* Page title: 32px / bold
* Section title: 24px / semi-bold
* Card title: 18px / semi-bold
* Body: 16px / regular
* Helper text: 14px / regular
* Badge text: 12px / semi-bold

---

## 5. Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 20px;
--radius-xl: 28px;
--radius-full: 999px;
```

ใช้ radius เยอะเพื่อให้ระบบดู friendly ไม่แข็งเหมือนหน้า admin ราชการที่มนุษย์ยังสร้างกันอยู่

---

## 6. Shadows

```css
--shadow-sm: 0 4px 12px rgba(32, 34, 56, 0.06);
--shadow-md: 0 8px 24px rgba(32, 34, 56, 0.10);
--shadow-lg: 0 16px 40px rgba(32, 34, 56, 0.14);
--shadow-glow: 0 0 24px rgba(124, 92, 255, 0.28);
```

ใช้ glow เฉพาะกับ active game state หรือ selected tile

---

## 7. Layout System

### Page Layout

```txt
Header
Game Status Bar
Main Board Area
Action Panel
Player / Zombie Info
```

### Desktop Layout

```txt
------------------------------------------------
| Header                                       |
------------------------------------------------
| Status Bar                                   |
------------------------------------------------
| Sidebar     | Board Area        | Action Panel |
| Players     | Game Map          | Cards/Action |
------------------------------------------------
```

### Mobile Layout

```txt
Header
Status Bar
Board Area
Bottom Action Sheet
Player Cards
```

---

## 8. Spacing

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
```

---

## 9. Core Components

## 9.1 Button

### Primary Button

ใช้กับ action หลัก เช่น Start Game, Roll Dice, Confirm Move

```css
background: #7C5CFF;
color: #FFFFFF;
border-radius: 16px;
padding: 12px 20px;
font-weight: 700;
box-shadow: 0 8px 24px rgba(124, 92, 255, 0.25);
```

### Secondary Button

ใช้กับ action รอง เช่น View Rule, Skip Turn

```css
background: #EEE9FF;
color: #4E35B8;
border-radius: 16px;
```

### Danger Button

ใช้กับ action เสี่ยง เช่น Trigger Zombie, Leave Game

```css
background: #FF4D6D;
color: #FFFFFF;
border-radius: 16px;
```

---

## 9.2 Card

ใช้กับ player, item, mission, event

```css
background: #FFFFFF;
border: 1px solid #E4E7F5;
border-radius: 20px;
box-shadow: 0 8px 24px rgba(32, 34, 56, 0.08);
padding: 16px;
```

### Card Types

* Player Card
* Zombie Card
* Mission Card
* Item Card
* Event Card
* Rule Card

---

## 9.3 Game Tile

Tile คือช่องบน board

### Normal Tile

```css
background: #FFFFFF;
border: 2px solid #E4E7F5;
border-radius: 14px;
```

### Active Tile

```css
background: #EEE9FF;
border: 2px solid #7C5CFF;
box-shadow: 0 0 20px rgba(124, 92, 255, 0.28);
```

### Danger Tile

```css
background: #FFE8EE;
border: 2px solid #FF4D6D;
```

### Safe Tile

```css
background: #E5FFFB;
border: 2px solid #00D9C0;
```

---

## 9.4 Badge

ใช้บอกสถานะ

```css
border-radius: 999px;
padding: 4px 10px;
font-size: 12px;
font-weight: 700;
```

### Badge Variants

```txt
READY       = Green
WAITING     = Yellow
INFECTED    = Pink/Red
SAFE        = Mint
ZOMBIE TURN = Red
PLAYER TURN = Purple
```

---

## 9.5 Status Bar

แสดงข้อมูลเกมแบบรวดเร็ว:

* Current round
* Current turn
* Zombie distance
* Remaining players
* Mission progress

ตัวอย่าง:

```txt
Round 03 | Player Turn | Zombies: 4 | Safe Zones: 2
```

---

## 10. Game UI Screens

## 10.1 Lobby Screen

### Purpose

ให้ผู้เล่นเข้าห้อง เตรียมตัว และดู rule สั้นๆ

### Sections

* Game title
* Room code
* Player list
* Ready button
* Rule preview
* Start game button

### Design

ใช้ card ใหญ่กลางหน้า มีพื้นหลัง gradient สดใส

```css
background: linear-gradient(135deg, #F8F7FF, #E5FFFB);
```

---

## 10.2 Board Screen

### Purpose

หน้าหลักของเกม

### Sections

* Board map
* Player tokens
* Zombie tokens
* Action panel
* Dice / card action
* Game log

### Visual

Board ควรเป็น grid หรือ path แบบ boardgame จริง มีช่องสีต่างๆ เช่น safe, danger, event, item

---

## 10.3 Player Panel

### Data

* Avatar
* Name
* Health
* Infection level
* Items
* Current position
* Status badge

### Health Display

ใช้ heart icon หรือ bar สั้นๆ

```txt
HP: ♥ ♥ ♥
Infection: 20%
```

---

## 10.4 Zombie Panel

### Data

* Zombie count
* Zombie movement
* Current danger level
* Next zombie event

ใช้สีแดงอมชมพู ไม่ใช้เลือด ไม่ใช้ภาพสยอง

---

## 10.5 Mission Screen

### Data

* Current objective
* Required action
* Reward
* Risk level
* Progress

ตัวอย่าง:

```txt
Mission: Reach the Safe Gate
Progress: 3 / 6 tiles
Reward: Shield Card
Risk: Medium
```

---

## 10.6 Result Screen

### Win State

ใช้สี mint + purple

```txt
Survived!
Your team reached the final safe zone.
```

### Lose State

ใช้สี pink/red แบบนุ่ม

```txt
Game Over
The zombies reached your team.
```

อย่าใช้ภาพ gore หรือ horror หนักๆ ให้ใช้ icon zombie แบบน่ารักหรือ silhouette

---

## 11. Icon Style

### Style

* Rounded
* Filled หรือ duotone
* ไม่ realistic
* ไม่ใช้ horror detail

### Recommended Icons

* Dice
* Map
* Shield
* Heart
* Skull แบบ cute
* Zombie hand แบบ cartoon
* Lightning
* Card
* Flag
* Door / Gate

---

## 12. Illustration Style

ใช้ภาพประกอบแบบ:

* Cartoon
* Rounded shape
* Neon outline
* Character friendly
* Zombie ดูกวนมากกว่าน่ากลัว

### Zombie Character Direction

Zombie ควรมีลักษณะ:

* ตากลม
* หน้าตาเบลอๆ
* สีเขียว mint หรือม่วงอ่อน
* ท่าทางงงๆ
* ไม่มีเลือด
* ไม่มีแผลชัดเจน

---

## 13. Motion / Animation

### Recommended Animation

* Dice roll bounce
* Tile selected glow
* Card flip
* Zombie move shake เบาๆ
* Mission complete confetti
* Turn change slide

### Timing

```css
--motion-fast: 120ms;
--motion-normal: 220ms;
--motion-slow: 360ms;
```

### Easing

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 14. UI Tone

ใช้ภาษาในระบบให้เป็นเกม สดใส และเข้าใจง่าย

### Examples

```txt
Your Turn!
Roll the Dice
Move to Safe Zone
Zombie Alert!
Pick a Card
Mission Complete
Team Survived
```

ภาษาไทย:

```txt
ถึงตาคุณแล้ว!
ทอยลูกเต๋า
ย้ายไปเขตปลอดภัย
ซอมบี้ขยับแล้ว!
จั่วการ์ด
ภารกิจสำเร็จ
ทีมรอดแล้ว
```

---

## 15. Accessibility

### Rules

* Contrast ต้องอ่านง่าย
* ห้ามใช้สีอย่างเดียวในการบอกสถานะ
* Badge ต้องมี text
* ปุ่มกดต้องสูงอย่างน้อย 44px
* รองรับ keyboard navigation
* Animation ควรปิดได้ถ้าผู้ใช้เลือก reduce motion

---

## 16. Responsive Rules

### Mobile

* Board เป็น scroll / pinch zoom ได้
* Action panel เป็น bottom sheet
* Player status ย่อเป็น horizontal cards
* Header compact

### Tablet

* Board กลาง
* Player panel ด้านล่าง
* Action panel ด้านขวา

### Desktop

* Sidebar ซ้าย
* Board กลาง
* Action panel ขวา

---

## 17. Component Naming

```txt
GameLayout
GameHeader
GameStatusBar
BoardGrid
BoardTile
PlayerToken
ZombieToken
PlayerCard
ZombiePanel
MissionCard
ActionPanel
DiceButton
GameLog
ResultModal
ConfirmModal
```

---

## 18. Example CSS Tokens

```css
:root {
  --color-primary: #7C5CFF;
  --color-primary-soft: #EEE9FF;
  --color-primary-dark: #4E35B8;

  --color-secondary: #00D9C0;
  --color-secondary-soft: #E5FFFB;
  --color-secondary-dark: #009A89;

  --color-danger: #FF4D6D;
  --color-danger-soft: #FFE8EE;
  --color-danger-dark: #B8203D;

  --color-warning: #FFD166;
  --color-bg: #F8F7FF;
  --color-bg-card: #FFFFFF;
  --color-bg-soft: #F1F5FF;

  --color-text-main: #202238;
  --color-text-secondary: #6B6F8A;
  --color-text-muted: #A0A4BD;
  --color-text-inverse: #FFFFFF;

  --color-border: #E4E7F5;
  --color-border-active: #7C5CFF;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 999px;

  --shadow-sm: 0 4px 12px rgba(32, 34, 56, 0.06);
  --shadow-md: 0 8px 24px rgba(32, 34, 56, 0.10);
  --shadow-lg: 0 16px 40px rgba(32, 34, 56, 0.14);
  --shadow-glow: 0 0 24px rgba(124, 92, 255, 0.28);

  --font-xs: 12px;
  --font-sm: 14px;
  --font-md: 16px;
  --font-lg: 20px;
  --font-xl: 24px;
  --font-2xl: 32px;
  --font-3xl: 40px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
}
```

---

## 19. Tailwind Theme Example

```js
theme: {
  extend: {
    colors: {
      primary: "#7C5CFF",
      "primary-soft": "#EEE9FF",
      secondary: "#00D9C0",
      "secondary-soft": "#E5FFFB",
      danger: "#FF4D6D",
      "danger-soft": "#FFE8EE",
      warning: "#FFD166",
      bg: "#F8F7FF",
      card: "#FFFFFF",
      text: "#202238",
      muted: "#6B6F8A",
      border: "#E4E7F5",
    },
    borderRadius: {
      sm: "8px",
      md: "12px",
      lg: "20px",
      xl: "28px",
      full: "999px",
    },
    boxShadow: {
      sm: "0 4px 12px rgba(32, 34, 56, 0.06)",
      md: "0 8px 24px rgba(32, 34, 56, 0.10)",
      lg: "0 16px 40px rgba(32, 34, 56, 0.14)",
      glow: "0 0 24px rgba(124, 92, 255, 0.28)",
    },
  },
}
```

---

## 20. Design Do / Don't

### Do

* ใช้สีสด
* ใช้ zombie แบบ cute
* ใช้ card UI
* ใช้ animation ให้รู้สึกเป็นเกม
* ทำให้ board อ่านง่าย
* แยก player turn ให้ชัด
* ทำ mobile-first

### Don't

* อย่าใช้ภาพเลือดหรือ gore
* อย่าใช้พื้นหลังดำทั้งระบบ
* อย่าให้ board รายละเอียดเยอะจนอ่านไม่ออก
* อย่าใช้ font แปลกเกินไป
* อย่าใช้สีแดงทุกอย่างจนผู้ใช้ไม่รู้ว่าอะไรสำคัญจริง
* อย่าลอก visual identity จากหนังโดยตรง เช่น logo, symbol, character หรือฉากเฉพาะ

---

## 21. Final UI Direction

UI ควรรู้สึกเหมือน:

```txt
เกมกระดานเอาตัวรอดในสนาม neon สดใส
มี zombie น่ากวน
มีภารกิจให้ลุ้น
แต่ยังดูสะอาด ทันสมัย และใช้งานง่าย
```

ไม่ใช่:

```txt
เว็บ horror หนักๆ
admin dashboard ธรรมดา
หรือเกมมือถือรกๆ ที่ทุกปุ่มแย่งกันตะโกน
```
