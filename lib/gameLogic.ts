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

// แจกไพ่พิเศษ
export function distributeSpecialCards(players: Player[]): Player[] {
  const updatedPlayers = [...players];
  
  // แจกไพ่ปืนลูกซองให้ทุกคน 1 ใบ
  updatedPlayers.forEach(player => {
    player.cards.push({
      id: `shotgun-${player.id}`,
      type: CardType.SHOTGUN
    });
  });
  
  // แจกไพ่ซอมบี้ให้ผู้เล่นสุ่ม 1 คน
  const randomZombieIndex = Math.floor(Math.random() * updatedPlayers.length);
  updatedPlayers[randomZombieIndex].cards.push({
    id: `zombie-initial`,
    type: CardType.ZOMBIE
  });
  updatedPlayers[randomZombieIndex].status = PlayerStatus.ZOMBIE;
  
  // แจกไพ่วัคซีนให้ผู้เล่นสุ่ม (ยกเว้นคนที่เป็นซอมบี้)
  const numVaccines = Math.floor(updatedPlayers.length / 2);
  
  // หาผู้เล่นที่เป็นมนุษย์
  const humanPlayerIndices = updatedPlayers
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.status !== PlayerStatus.ZOMBIE)
    .map(({ index }) => index);
  
  // สับลำดับผู้เล่นที่เป็นมนุษย์
  const shuffledHumanIndices = [...humanPlayerIndices];
  for (let i = shuffledHumanIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledHumanIndices[i], shuffledHumanIndices[j]] = [shuffledHumanIndices[j], shuffledHumanIndices[i]];
  }
  
  // แจกวัคซีนให้ผู้เล่นที่เป็นมนุษย์เท่านั้น
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
  
  if (card.type === CardType.ZOMBIE) {
    return 999; // ไพ่ซอมบี้ชนะทุกอย่าง
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

// ตรวจสอบผู้ชนะในการแบทเทิล (3 ใบ)
export function determineBattleWinner(
  cards1: Card[],
  cards2: Card[],
  player1: Player,
  player2: Player
): string | null {
  if (cards1.length === 0 || cards2.length === 0) return null;
  
  const total1 = calculateTotalValue(cards1);
  const total2 = calculateTotalValue(cards2);
  
  if (total1 > total2) return player1.id;
  if (total2 > total1) return player2.id;
  
  return null; // เสมอ
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
