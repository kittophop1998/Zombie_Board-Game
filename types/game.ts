// ประเภทของไพ่
export enum CardType {
  NUMBER = 'NUMBER',
  ZOMBIE = 'ZOMBIE',
  SHOTGUN = 'SHOTGUN',
  VACCINE = 'VACCINE'
}

// ดอกไพ่
export enum CardSuit {
  SPADES = 'SPADES',      // โพดำ - Black1
  CLUBS = 'CLUBS',        // ดอกจิก - Black2
  DIAMONDS = 'DIAMONDS',  // ข้าวหลามตัด - Red1
  HEARTS = 'HEARTS'       // โพแดง - Red2
}

// สถานะผู้เล่น
export enum PlayerStatus {
  HUMAN = 'HUMAN',
  ZOMBIE = 'ZOMBIE',
  ELIMINATED = 'ELIMINATED'
}

// ไพ่
export interface Card {
  id: string;
  type: CardType;
  suit?: CardSuit;
  value?: number; // 1-13 สำหรับไพ่ตัวเลข
}

// ผู้เล่น
export interface Player {
  id: string;
  name: string;
  teamId: number;
  status: PlayerStatus;
  cards: Card[];
  isReady: boolean;
  hp: number;
  infectionLevel: number;
  isRevealed: boolean;
}

// โต๊ะเล่น (Battle)
export interface Battle {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Cards: Card[];
  player2Cards: Card[];
  player1CardsRevealed: boolean[];
  player2CardsRevealed: boolean[];
  player1Confirmed: boolean; // ยืนยันพร้อมเปิดไพ่แล้ว
  player2Confirmed: boolean; // ยืนยันพร้อมเปิดไพ่แล้ว
  winnerId?: string;
  isComplete: boolean;
  pendingShotgunChoice?: {
    chooserId: string; // ผู้เล่นที่ต้องเลือก
    loserId: string; // ผู้เล่นที่แพ้และถูกยึดปืน
    shotgunCard: Card; // ไพ่ปืนที่จะถูกยึด
  };
}

// ห้องเกม
export interface GameRoom {
  id: string;
  players: Player[];
  currentBattle?: Battle; // เก็บไว้เพื่อ backward compatibility
  battles: Battle[]; // เก็บ battle ทั้งหมดที่กำลังดำเนินการอยู่
  gameStarted: boolean;
  gameEnded: boolean;
  winningTeam?: 'HUMAN' | 'ZOMBIE';
  gameStartTime?: number; // เวลาเริ่มเกม (timestamp)
  gameEndTime?: number; // เวลาที่เกมจะจบ (timestamp)
}

// สถานะเกมสำหรับ Client
export interface GameState {
  room: GameRoom | null;
  myPlayerId: string | null;
  myPlayer: Player | null;
}
