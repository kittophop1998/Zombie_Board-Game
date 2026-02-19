import { Card, CardType, CardSuit, Player, PlayerStatus } from '../types/game';

// สร้างไพ่ทั้งหมดในสำรับ
export function createDeck(): Card[] {
  const cards: Card[] = [];
  
  // สร้างไพ่ตัวเลข (1-13 ของแต่ละดอก)
  // โพดำ (Spades), ดอกจิก (Clubs), ข้าวหลามตัด (Diamonds), โพแดง (Hearts)
  const suits = [CardSuit.SPADES, CardSuit.CLUBS, CardSuit.DIAMONDS, CardSuit.HEARTS];
  
  suits.forEach(suit => {
    for (let value = 1; value <= 13; value++) {
      cards.push({
        id: `${suit}-${value}`,
        type: CardType.NUMBER,
        suit,
        value
      });
    }
  });
  
  return cards;
}

// สับไพ่
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// แจกไพ่ให้ผู้เล่น (7 ใบต่อคน)
export function dealCards(players: Player[]): Player[] {
  const deck = shuffleDeck(createDeck());
  const dealtPlayers = players.map((player, index) => ({
    ...player,
    cards: deck.slice(index * 7, (index + 1) * 7)
  }));
  
  return dealtPlayers;
}

// แจกไพ่พิเศษ และสุ่ม role ซอมบี้กับคนให้เท่าๆกัน
export function distributeSpecialCards(players: Player[]): Player[] {
  const updatedPlayers = [...players];
  
  // แจกไพ่ปืนลูกซองให้ทุกคน 1 ใบ
  updatedPlayers.forEach(player => {
    player.cards.push({
      id: `shotgun-${player.id}`,
      type: CardType.SHOTGUN
    });
  });
  
  // สุ่ม role ซอมบี้กับคนให้เท่าๆกัน
  const halfPlayers = Math.floor(updatedPlayers.length / 2);
  const numZombies = halfPlayers;
  const numHumans = updatedPlayers.length - numZombies;
  
  // สับลำดับผู้เล่นเพื่อสุ่ม role
  const shuffledIndices = updatedPlayers.map((_, index) => index);
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
  }
  
  // แจก role และไพ่ซอมบี้ให้ครึ่งหนึ่ง
  for (let i = 0; i < numZombies; i++) {
    const index = shuffledIndices[i];
    updatedPlayers[index].status = PlayerStatus.ZOMBIE;
    updatedPlayers[index].cards.push({
      id: `zombie-${updatedPlayers[index].id}`,
      type: CardType.ZOMBIE
    });
  }
  
  // ที่เหลือเป็นมนุษย์
  for (let i = numZombies; i < updatedPlayers.length; i++) {
    const index = shuffledIndices[i];
    updatedPlayers[index].status = PlayerStatus.HUMAN;
  }
  
  // แจกไพ่วัคซีนให้ผู้เล่นที่เป็นมนุษย์
  const numVaccines = Math.floor(numHumans / 2);
  
  // หาผู้เล่นที่เป็นมนุษย์
  const humanPlayerIndices = updatedPlayers
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.status === PlayerStatus.HUMAN)
    .map(({ index }) => index);
  
  // สับลำดับผู้เล่นที่เป็นมนุษย์
  const shuffledHumanIndices = [...humanPlayerIndices];
  for (let i = shuffledHumanIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledHumanIndices[i], shuffledHumanIndices[j]] = [shuffledHumanIndices[j], shuffledHumanIndices[i]];
  }
  
  // แจกวัคซีนให้ผู้เล่นที่เป็นมนุษย์
  const actualVaccines = Math.min(numVaccines, shuffledHumanIndices.length);
  for (let i = 0; i < actualVaccines; i++) {
    const index = shuffledHumanIndices[i];
    updatedPlayers[index].cards.push({
      id: `vaccine-${index}`,
      type: CardType.VACCINE
    });
  }
  
  return updatedPlayers;
}

// คำนวณแต้มไพ่
export function calculateCardValue(card: Card | undefined): number {
  if (!card) return 0;
  
  // ไพ่พิเศษไม่นับคะแนน
  if (card.type === CardType.ZOMBIE || card.type === CardType.SHOTGUN || card.type === CardType.VACCINE) {
    return 0;
  }
  
  if (card.type === CardType.NUMBER && card.value) {
    return card.value;
  }
  
  return 0;
}

// คำนวณผลรวมแต้มจากไพ่หลายใบ
export function calculateTotalValue(cards: Card[]): number {
  return cards.reduce((total, card) => total + calculateCardValue(card), 0);
}

// ตรวจสอบว่าไพ่ทั้งหมดเป็นดอกเดียวกันหรือไม่ (ไม่นับไพ่พิเศษ)
export function checkSameSuit(cards: Card[]): boolean {
  const numberCards = cards.filter(c => c.type === CardType.NUMBER && c.suit);
  if (numberCards.length === 0) return true; // ถ้าไม่มีไพ่ตัวเลข ถือว่าผ่าน
  
  const firstSuit = numberCards[0].suit;
  return numberCards.every(c => c.suit === firstSuit);
}

// ตรวจสอบผู้ชนะในการแบทเทิล และจัดการกติกาพิเศษทั้งหมด
export function determineBattleWinner(
  cards1: Card[],
  cards2: Card[],
  player1: Player,
  player2: Player
): {
  winnerId: string | null;
  isInfection: boolean; // true ถ้ามีการแพร่เชื้อ
  infectedPlayerId?: string; // ผู้เล่นที่ติดเชื้อ
  zombiePlayerId?: string; // ผู้เล่นที่แพร่เชื้อ
  zombieCardReturned?: boolean; // true ถ้าไพ่ซอมบี้ถูกคืนกลับ
  eliminatedPlayerId?: string; // ผู้เล่นที่ถูกกำจัด (ยิงตาย)
  shotgunAction?: 'stolen' | 'kill_opponent' | 'kill_self' | 'pending_choice'; // การกระทำของปืน
  shotgunOwnerId?: string; // เจ้าของปืนใหม่ (กรณียึดปืน)
  zombieRevealed?: boolean; // true ถ้าซอมบี้ถูกเปิดเผยตัวตน
  needsPlayerChoice?: boolean; // true ถ้าต้องรอผู้เล่นเลือก
  chooserId?: string; // ผู้เล่นที่ต้องเลือก
  loserId?: string; // ผู้เล่นที่แพ้
} {
  if (cards1.length === 0 || cards2.length === 0) {
    return { winnerId: null, isInfection: false };
  }
  
  // ตรวจสอบว่ามีไพ่พิเศษหรือไม่
  const hasShotgun1 = cards1.some(card => card.type === CardType.SHOTGUN);
  const hasShotgun2 = cards2.some(card => card.type === CardType.SHOTGUN);
  const hasZombieCard1 = cards1.some(card => card.type === CardType.ZOMBIE);
  const hasZombieCard2 = cards2.some(card => card.type === CardType.ZOMBIE);
  
  // คำนวณแต้ม
  const total1 = calculateTotalValue(cards1);
  const total2 = calculateTotalValue(cards2);
  
  // === กรณีที่ 2: ฝั่งมนุษย์ใช้ไพ่ปืน ===
  
  // 2.1 Player1 เป็นมนุษย์และใช้ปืน vs Player2 เป็นมนุษย์
  if (hasShotgun1 && player1.status === PlayerStatus.HUMAN && player2.status === PlayerStatus.HUMAN) {
    // 2.1.1 แต้มของคนใช้ปืนสูงกว่า -> ฝั่งตรงข้ามตาย
    if (total1 > total2) {
      return {
        winnerId: player1.id,
        isInfection: false,
        eliminatedPlayerId: player2.id,
        shotgunAction: 'kill_opponent'
      };
    }
    // 2.1.2 แต้มของคนใช้ปืนน้อยกว่า -> ฝั่งตรงข้ามเลือกได้ (ยึดปืนหรือยิงกลับ)
    // *** ผู้เล่นต้องเลือก: 1) ยึดปืนมาใช้เอง หรือ 2) ยิงฝั่งตรงข้ามให้ตาย ***
    else if (total1 < total2) {
      return {
        winnerId: player2.id,
        isInfection: false,
        shotgunAction: 'pending_choice', // รอการเลือกจากผู้เล่น
        needsPlayerChoice: true,
        chooserId: player2.id,
        loserId: player1.id
      };
    }
    // เสมอ
    return { winnerId: null, isInfection: false };
  }
  
  // Player2 เป็นมนุษย์และใช้ปืน vs Player1 เป็นมนุษย์
  if (hasShotgun2 && player2.status === PlayerStatus.HUMAN && player1.status === PlayerStatus.HUMAN) {
    // 2.1.1 แต้มของคนใช้ปืนสูงกว่า -> ฝั่งตรงข้ามตาย
    if (total2 > total1) {
      return {
        winnerId: player2.id,
        isInfection: false,
        eliminatedPlayerId: player1.id,
        shotgunAction: 'kill_opponent'
      };
    }
    // 2.1.2 แต้มของคนใช้ปืนน้อยกว่า -> ฝั่งตรงข้ามเลือกได้
    else if (total2 < total1) {
      return {
        winnerId: player1.id,
        isInfection: false,
        shotgunAction: 'pending_choice',
        needsPlayerChoice: true,
        chooserId: player1.id,
        loserId: player2.id
      };
    }
    // เสมอ
    return { winnerId: null, isInfection: false };
  }
  
  // 2.2 มนุษย์ใช้ปืน vs ซอมบี้
  // Player1 เป็นมนุษย์ใช้ปืน vs Player2 เป็นซอมบี้
  if (hasShotgun1 && player1.status === PlayerStatus.HUMAN && player2.status === PlayerStatus.ZOMBIE) {
    // 2.2.1 แต้มมนุษย์สูงกว่า -> ซอมบี้ตาย
    if (total1 > total2) {
      return {
        winnerId: player1.id,
        isInfection: false,
        eliminatedPlayerId: player2.id,
        shotgunAction: 'kill_opponent'
      };
    }
    // 2.2.2 แต้มมนุษย์น้อยกว่า -> ถูกแพร่เชื้อ
    else if (total1 < total2) {
      return {
        winnerId: player2.id,
        isInfection: true,
        infectedPlayerId: player1.id,
        zombiePlayerId: player2.id,
        zombieCardReturned: hasZombieCard2 // ถ้าซอมบี้ลงไพ่ซอมบี้ ให้คืนกลับ
      };
    }
    // เสมอ
    return { winnerId: null, isInfection: false };
  }
  
  // Player2 เป็นมนุษย์ใช้ปืน vs Player1 เป็นซอมบี้
  if (hasShotgun2 && player2.status === PlayerStatus.HUMAN && player1.status === PlayerStatus.ZOMBIE) {
    // 2.2.1 แต้มมนุษย์สูงกว่า -> ซอมบี้ตาย
    if (total2 > total1) {
      return {
        winnerId: player2.id,
        isInfection: false,
        eliminatedPlayerId: player1.id,
        shotgunAction: 'kill_opponent'
      };
    }
    // 2.2.2 แต้มมนุษย์น้อยกว่า -> ถูกแพร่เชื้อ
    else if (total2 < total1) {
      return {
        winnerId: player1.id,
        isInfection: true,
        infectedPlayerId: player2.id,
        zombiePlayerId: player1.id,
        zombieCardReturned: hasZombieCard1
      };
    }
    // เสมอ
    return { winnerId: null, isInfection: false };
  }
  
  // === กรณีที่ 3: ซอมบี้ใช้ไพ่ซอมบี้ ===
  
  // Player1 เป็นซอมบี้และวางไพ่ซอมบี้
  if (hasZombieCard1 && player1.status === PlayerStatus.ZOMBIE) {
    // ถ้า player2 เป็นซอมบี้อยู่แล้ว ไม่สามารถแพร่เชื้อได้ นับคะแนนตามปกติ
    if (player2.status === PlayerStatus.ZOMBIE) {
      if (total1 > total2) return { winnerId: player1.id, isInfection: false };
      if (total2 > total1) return { winnerId: player2.id, isInfection: false };
      return { winnerId: null, isInfection: false };
    }
    
    // ถ้า player2 เป็นมนุษย์
    // 3.1 แต้มซอมบี้สูงกว่า -> แพร่เชื้อสำเร็จ และคืนไพ่ซอมบี้
    if (total1 > total2) {
      return {
        winnerId: player1.id,
        isInfection: true,
        infectedPlayerId: player2.id,
        zombiePlayerId: player1.id,
        zombieCardReturned: true // คืนไพ่ซอมบี้กลับ
      };
    }
    // 3.2 แต้มซอมบี้น้อยกว่า -> แพร่เชื้อไม่สำเร็จ และเปิดเผยตัวตน
    else if (total1 < total2) {
      return {
        winnerId: player2.id,
        isInfection: false,
        zombieRevealed: true,
        zombiePlayerId: player1.id,
        zombieCardReturned: true // คืนไพ่ซอมบี้กลับ
      };
    }
    // เสมอ
    return { 
      winnerId: null, 
      isInfection: false,
      zombieCardReturned: true // คืนไพ่ซอมบี้กลับ
    };
  }
  
  // Player2 เป็นซอมบี้และวางไพ่ซอมบี้
  if (hasZombieCard2 && player2.status === PlayerStatus.ZOMBIE) {
    // ถ้า player1 เป็นซอมบี้อยู่แล้ว ไม่สามารถแพร่เชื้อได้ นับคะแนนตามปกติ
    if (player1.status === PlayerStatus.ZOMBIE) {
      if (total1 > total2) return { winnerId: player1.id, isInfection: false };
      if (total2 > total1) return { winnerId: player2.id, isInfection: false };
      return { winnerId: null, isInfection: false };
    }
    
    // ถ้า player1 เป็นมนุษย์
    // 3.1 แต้มซอมบี้สูงกว่า -> แพร่เชื้อสำเร็จ และคืนไพ่ซอมบี้
    if (total2 > total1) {
      return {
        winnerId: player2.id,
        isInfection: true,
        infectedPlayerId: player1.id,
        zombiePlayerId: player2.id,
        zombieCardReturned: true
      };
    }
    // 3.2 แต้มซอมบี้น้อยกว่า -> แพร่เชื้อไม่สำเร็จ และเปิดเผยตัวตน
    else if (total2 < total1) {
      return {
        winnerId: player1.id,
        isInfection: false,
        zombieRevealed: true,
        zombiePlayerId: player2.id,
        zombieCardReturned: true
      };
    }
    // เสมอ
    return { 
      winnerId: null, 
      isInfection: false,
      zombieCardReturned: true
    };
  }
  
  // === กรณีปกติ: นับคะแนนตามปกติ ===
  if (total1 > total2) return { winnerId: player1.id, isInfection: false };
  if (total2 > total1) return { winnerId: player2.id, isInfection: false };
  
  return { winnerId: null, isInfection: false }; // เสมอ
}

// จัดการการติดเชื้อซอมบี้ - เพิ่มไพ่ซอมบี้ให้ผู้เล่นที่ติดเชื้อ
export function infectPlayer(player: Player): Player {
  const updatedPlayer = { ...player };
  
  // เปลี่ยนสถานะเป็นซอมบี้
  updatedPlayer.status = PlayerStatus.ZOMBIE;
  
  // เพิ่มไพ่ซอมบี้ให้
  updatedPlayer.cards.push({
    id: `zombie-infected-${player.id}-${Date.now()}`,
    type: CardType.ZOMBIE
  });
  
  return updatedPlayer;
}

// นับจำนวนผู้เล่นแต่ละสถานะ
export function countPlayersByStatus(players: Player[]): {
  humans: number;
  zombies: number;
  eliminated: number;
} {
  return {
    humans: players.filter(p => p.status === PlayerStatus.HUMAN).length,
    zombies: players.filter(p => p.status === PlayerStatus.ZOMBIE).length,
    eliminated: players.filter(p => p.status === PlayerStatus.ELIMINATED).length
  };
}

// ตรวจสอบว่าเกมจบหรือไม่
export function checkGameEnd(players: Player[]): {
  isEnded: boolean;
  winner?: 'HUMAN' | 'ZOMBIE';
  reason?: string;
} {
  const { humans, zombies } = countPlayersByStatus(players);
  
  // เกมจบถ้าทุกคนเป็นซอมบี้
  if (humans === 0 && zombies > 0) {
    return { isEnded: true, winner: 'ZOMBIE', reason: 'ซอมบี้ครอบงำโลก!' };
  }
  
  // เกมจบถ้าซอมบี้ถูกกำจัดหมด
  if (zombies === 0 && humans > 0) {
    return { isEnded: true, winner: 'HUMAN', reason: 'มนุษย์ชนะ! ซอมบี้ถูกกำจัดหมดแล้ว!' };
  }
  
  // เกมจบถ้าผู้เล่นหมดไพ่
  const playersWithoutCards = players.filter(
    p => p.status !== PlayerStatus.ELIMINATED && 
    p.cards.filter(c => c.type === CardType.NUMBER).length === 0
  );
  
  if (playersWithoutCards.length === players.filter(p => p.status !== PlayerStatus.ELIMINATED).length) {
    if (humans > zombies) {
      return { isEnded: true, winner: 'HUMAN', reason: 'มนุษย์มีจำนวนมากกว่า!' };
    } else if (zombies > humans) {
      return { isEnded: true, winner: 'ZOMBIE', reason: 'ซอมบี้มีจำนวนมากกว่า!' };
    }
  }
  
  return { isEnded: false };
}

// แจกทีมให้ผู้เล่น
export function assignTeams(players: Player[]): Player[] {
  const teamsCount = Math.ceil(players.length / 2);
  return players.map((player, index) => ({
    ...player,
    teamId: index % teamsCount
  }));
}
