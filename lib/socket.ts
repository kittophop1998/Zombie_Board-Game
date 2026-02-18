import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { GameRoom, Player, Battle, CardType, PlayerStatus } from '../types/game';
import { 
  dealCards, 
  distributeSpecialCards, 
  assignTeams, 
  determineBattleWinner,
  checkGameEnd,
  countPlayersByStatus,
  calculateTotalValue
} from '../lib/gameLogic';

const rooms = new Map<string, GameRoom>();
const gameTimers = new Map<string, NodeJS.Timeout>(); // เก็บ timer ของแต่ละห้อง

export function setupSocketServer(httpServer: ReturnType<typeof createServer>) {
  const io = new SocketServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // สร้างห้อง
    socket.on('create-room', (playerName: string, callback) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const player: Player = {
        id: socket.id,
        name: playerName,
        teamId: 0,
        status: PlayerStatus.HUMAN,
        cards: [],
        isReady: false
      };

      const room: GameRoom = {
        id: roomId,
        players: [player],
        gameStarted: false,
        gameEnded: false
      };

      rooms.set(roomId, room);
      socket.join(roomId);
      
      callback({ success: true, roomId, playerId: socket.id });
      io.to(roomId).emit('room-updated', room);
    });

    // เข้าร่วมห้อง
    socket.on('join-room', (data: { roomId: string; playerName: string }, callback) => {
      const room = rooms.get(data.roomId);
      
      if (!room) {
        callback({ success: false, error: 'ไม่พบห้องนี้' });
        return;
      }

      if (room.gameStarted) {
        callback({ success: false, error: 'เกมเริ่มแล้ว' });
        return;
      }

      const player: Player = {
        id: socket.id,
        name: data.playerName,
        teamId: 0,
        status: PlayerStatus.HUMAN,
        cards: [],
        isReady: false
      };

      room.players.push(player);
      socket.join(data.roomId);
      
      callback({ success: true, roomId: data.roomId, playerId: socket.id });
      io.to(data.roomId).emit('room-updated', room);
    });

    // พร้อมเล่น
    socket.on('player-ready', (roomId: string) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.isReady = true;
        io.to(roomId).emit('room-updated', room);

        // ถ้าทุกคนพร้อม เริ่มเกม
        if (room.players.length >= 2 && room.players.every(p => p.isReady)) {
          startGame(roomId, io);
        }
      }
    });

    // วางไพ่ในการแบทเทิล
    socket.on('play-card', (data: { roomId: string; cardId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.currentBattle) {
        console.log('play-card: No room or battle');
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        console.log('play-card: Player not found');
        return;
      }

      const cardIndex = player.cards.findIndex(c => c.id === data.cardId);
      if (cardIndex === -1) {
        console.log('play-card: Card not found', data.cardId);
        return;
      }

      const card = player.cards[cardIndex];
      const battle = room.currentBattle;

      console.log('Battle IDs:', {
        player1Id: battle.player1Id,
        player2Id: battle.player2Id,
        currentSocketId: socket.id
      });

      // เช็คว่าวางครบ 3 ใบหรือยัง (แก้ไข: ให้วางได้ไม่เกิน 3 ใบ)
      const myCards = battle.player1Id === socket.id ? battle.player1Cards : battle.player2Cards;
      if (myCards.length >= 3) {
        socket.emit('error', { message: 'วางไพ่ได้สูงสุด 3 ใบ' });
        return;
      }

      // วางไพ่
      if (battle.player1Id === socket.id) {
        battle.player1Cards.push(card);
        battle.player1CardsRevealed.push(false);
        console.log(`Player 1 placed card: ${card.id}, total: ${battle.player1Cards.length}`);
      } else if (battle.player2Id === socket.id) {
        battle.player2Cards.push(card);
        battle.player2CardsRevealed.push(false);
        console.log(`Player 2 placed card: ${card.id}, total: ${battle.player2Cards.length}`);
      } else {
        console.log('ERROR: Socket ID does not match either player!');
        return;
      }

      // ลบไพ่ออกจากมือผู้เล่น
      player.cards.splice(cardIndex, 1);

      // ส่งข้อมูลห้องที่อัพเดตกลับไปให้ทุกคน
      console.log('Emitting room-updated with battle:', {
        player1Cards: battle.player1Cards.length,
        player2Cards: battle.player2Cards.length
      });
      io.to(data.roomId).emit('room-updated', room);
      
      // หา index ปัจจุบันหลัง push แล้ว
      const currentCards = battle.player1Id === socket.id ? battle.player1Cards : battle.player2Cards;
      io.to(data.roomId).emit('message', { 
        message: `${player.name} วางไพ่ ${currentCards.length}/3` 
      });
    });

    // ดึงไพ่กลับจาก battle (ก่อนเปิดไพ่)
    socket.on('remove-card', (data: { roomId: string; cardIndex: number }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.currentBattle) {
        console.log('remove-card: No room or battle');
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        console.log('remove-card: Player not found');
        return;
      }

      const battle = room.currentBattle;

      // เช็คว่าเป็นผู้เล่นที่อยู่ใน battle หรือไม่
      if (battle.player1Id !== socket.id && battle.player2Id !== socket.id) {
        socket.emit('error', { message: 'คุณไม่ได้อยู่ใน battle นี้' });
        return;
      }

      // เช็คว่ายังไม่ได้เปิดไพ่
      const myCardsRevealed = battle.player1Id === socket.id ? battle.player1CardsRevealed : battle.player2CardsRevealed;
      if (myCardsRevealed.some(r => r)) {
        socket.emit('error', { message: 'เปิดไพ่แล้วไม่สามารถดึงกลับได้' });
        return;
      }

      // ดึงไพ่กลับ
      let removedCard;
      if (battle.player1Id === socket.id) {
        removedCard = battle.player1Cards.splice(data.cardIndex, 1)[0];
        battle.player1CardsRevealed.splice(data.cardIndex, 1);
      } else {
        removedCard = battle.player2Cards.splice(data.cardIndex, 1)[0];
        battle.player2CardsRevealed.splice(data.cardIndex, 1);
      }

      // คืนไพ่กลับให้ผู้เล่น
      if (removedCard) {
        player.cards.push(removedCard);
        io.to(data.roomId).emit('room-updated', room);
        io.to(data.roomId).emit('message', { 
          message: `${player.name} ดึงไพ่กลับ` 
        });
      }
    });

    // เปิดไพ่
    socket.on('reveal-cards', (roomId: string) => {
      const room = rooms.get(roomId);
      if (!room || !room.currentBattle) return;

      const battle = room.currentBattle;
      
      // เช็คว่าวางไพ่อย่างน้อย 1 ใบแล้วหรือยัง
      const myCards = battle.player1Id === socket.id ? battle.player1Cards : battle.player2Cards;
      if (myCards.length === 0) {
        socket.emit('error', { message: 'กรุณาวางไพ่อย่างน้อย 1 ใบก่อนเปิด' });
        return;
      }
      
      // เปิดไพ่ทั้งหมดของผู้เล่นที่กดเปิด
      if (battle.player1Id === socket.id) {
        battle.player1CardsRevealed = battle.player1CardsRevealed.map(() => true);
      } else if (battle.player2Id === socket.id) {
        battle.player2CardsRevealed = battle.player2CardsRevealed.map(() => true);
      }

      io.to(roomId).emit('room-updated', room);

      // ถ้าทั้งสองคนเปิดไพ่แล้วและทั้งสองคนวางไพ่อย่างน้อย 1 ใบ ให้ตัดสินผล
      const allPlayer1Revealed = battle.player1CardsRevealed.length > 0 && battle.player1CardsRevealed.every(r => r);
      const allPlayer2Revealed = battle.player2CardsRevealed.length > 0 && battle.player2CardsRevealed.every(r => r);
      
      if (allPlayer1Revealed && allPlayer2Revealed && battle.player1Cards.length > 0 && battle.player2Cards.length > 0) {
        setTimeout(() => {
          resolveBattle(room, io);
        }, 1000);
      }
    });

    // ใช้ไพ่ปืนลูกซอง (ใช้ได้เฉพาะตอนอยู่ใน battle และยิงได้แค่คู่ battle)
    socket.on('use-shotgun', (data: { roomId: string; targetPlayerId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      // เช็คว่าอยู่ใน battle หรือไม่
      if (!room.currentBattle) {
        socket.emit('error', { message: 'ใช้ไพ่ปืนได้เฉพาะตอนอยู่ใน battle เท่านั้น' });
        return;
      }

      // เช็คว่าเป็นผู้เล่นที่อยู่ใน battle หรือไม่
      if (room.currentBattle.player1Id !== socket.id && room.currentBattle.player2Id !== socket.id) {
        socket.emit('error', { message: 'คุณไม่ได้อยู่ใน battle นี้' });
        return;
      }

      // เช็คว่ายิงเฉพาะคู่ battle ตรงข้ามเท่านั้น
      const opponentId = room.currentBattle.player1Id === socket.id 
        ? room.currentBattle.player2Id 
        : room.currentBattle.player1Id;
      
      if (data.targetPlayerId !== opponentId) {
        socket.emit('error', { message: 'ใช้ปืนได้เฉพาะกับคู่ battle ตรงข้ามเท่านั้น' });
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      const target = room.players.find(p => p.id === data.targetPlayerId);
      
      if (!player || !target) return;

      const shotgunIndex = player.cards.findIndex(c => c.type === CardType.SHOTGUN);
      if (shotgunIndex === -1) {
        socket.emit('error', { message: 'คุณไม่มีไพ่ปืนลูกซอง' });
        return;
      }

      if (target.status !== PlayerStatus.ZOMBIE) {
        socket.emit('error', { message: 'ใช้ปืนลูกซองกับซอมบี้เท่านั้น' });
        return;
      }

      // ลบไพ่ปืนลูกซอง
      player.cards.splice(shotgunIndex, 1);

      // กำจัดซอมบี้
      target.status = PlayerStatus.ELIMINATED;
      target.cards = [];

      io.to(data.roomId).emit('room-updated', room);
      io.to(data.roomId).emit('message', { 
        message: `${player.name} ใช้ปืนลูกซองกำจัด ${target.name}!` 
      });

      // ตรวจสอบว่าเกมจบหรือไม่
      const gameEnd = checkGameEnd(room.players);
      if (gameEnd.isEnded) {
        endGame(room, gameEnd.winner!, gameEnd.reason!, io);
      }
    });

    // ใช้ไพ่วัคซีน (ใช้กับตัวเองหรือคู่ battle ได้ ถ้าอยู่ใน battle)
    socket.on('use-vaccine', (data: { roomId: string; targetPlayerId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      const target = room.players.find(p => p.id === data.targetPlayerId);
      
      if (!player || !target) return;

      // เช็คว่าผู้ใช้มีไพ่วัคซีนหรือไม่
      const vaccineIndex = player.cards.findIndex(c => c.type === CardType.VACCINE);
      if (vaccineIndex === -1) {
        socket.emit('error', { message: 'คุณไม่มีไพ่วัคซีน' });
        return;
      }

      // ถ้าอยู่ใน battle ให้ใช้ได้เฉพาะกับตัวเองหรือคู่ battle
      if (room.currentBattle && 
          (room.currentBattle.player1Id === socket.id || room.currentBattle.player2Id === socket.id)) {
        const opponentId = room.currentBattle.player1Id === socket.id 
          ? room.currentBattle.player2Id 
          : room.currentBattle.player1Id;
        
        if (data.targetPlayerId !== socket.id && data.targetPlayerId !== opponentId) {
          socket.emit('error', { message: 'ใช้วัคซีนได้เฉพาะกับตัวเองหรือคู่ battle เท่านั้น' });
          return;
        }
      }

      // เช็คว่า target มีไพ่ซอมบี้หรือไม่
      const targetHasZombieCard = target.cards.some(c => c.type === CardType.ZOMBIE);
      if (!targetHasZombieCard) {
        socket.emit('error', { message: `${target.name} ไม่มีไพ่ซอมบี้` });
        return;
      }

      // ลบไพ่วัคซีน
      player.cards.splice(vaccineIndex, 1);

      // เปลี่ยน target กลับเป็นมนุษย์
      target.status = PlayerStatus.HUMAN;
      // ลบไพ่ซอมบี้ทั้งหมดของ target
      target.cards = target.cards.filter(c => c.type !== CardType.ZOMBIE);

      io.to(data.roomId).emit('room-updated', room);
      io.to(data.roomId).emit('message', { 
        message: `${player.name} ใช้วัคซีนรักษา ${target.name}!` 
      });
    });

    // เริ่มแบทเทิลใหม่
    socket.on('start-battle', (data: { roomId: string; opponentId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room || room.currentBattle) return;

      const player = room.players.find(p => p.id === socket.id);
      const opponent = room.players.find(p => p.id === data.opponentId);
      
      if (!player || !opponent) return;
      if (player.status === PlayerStatus.ELIMINATED || opponent.status === PlayerStatus.ELIMINATED) return;

      const battle: Battle = {
        id: Math.random().toString(36).substring(7),
        player1Id: socket.id,
        player2Id: data.opponentId,
        player1Cards: [],
        player2Cards: [],
        player1CardsRevealed: [],
        player2CardsRevealed: [],
        isComplete: false
      };

      room.currentBattle = battle;
      io.to(data.roomId).emit('room-updated', room);
      io.to(data.roomId).emit('message', { 
        message: `${player.name} vs ${opponent.name} - เริ่มแบทเทิล!` 
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // ลบผู้เล่นออกจากห้อง
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          
          if (room.players.length === 0) {
            rooms.delete(roomId);
            // ลบ timer ด้วย
            const timer = gameTimers.get(roomId);
            if (timer) {
              clearTimeout(timer);
              gameTimers.delete(roomId);
            }
          } else {
            io.to(roomId).emit('room-updated', room);
          }
        }
      });
    });
  });

  return io;
}

function startGame(roomId: string, io: SocketServer) {
  const room = rooms.get(roomId);
  if (!room) return;

  // แบ่งทีม
  room.players = assignTeams(room.players);
  
  // แจกไพ่
  room.players = dealCards(room.players);
  room.players = distributeSpecialCards(room.players);
  
  room.gameStarted = true;
  
  // ตั้งเวลาเริ่มเกมและเวลาจบ (5 นาที)
  const now = Date.now();
  room.gameStartTime = now;
  room.gameEndTime = now + (5 * 60 * 1000); // 5 นาที
  
  io.to(roomId).emit('game-started', room);
  io.to(roomId).emit('room-updated', room);
  
  // ไม่แสดงข้อความจำนวนมนุษย์/ซอมบี้อีกต่อไป
  io.to(roomId).emit('message', { 
    message: `เกมเริ่มแล้ว! เวลา 5 นาที` 
  });
  
  // ตั้ง timer สำหรับจบเกมหลัง 5 นาที
  const timer = setTimeout(() => {
    const currentRoom = rooms.get(roomId);
    if (currentRoom && !currentRoom.gameEnded) {
      endGameByTime(currentRoom, io);
    }
    gameTimers.delete(roomId);
  }, 5 * 60 * 1000);
  
  gameTimers.set(roomId, timer);
}

function resolveBattle(room: GameRoom, io: SocketServer) {
  const battle = room.currentBattle;
  // เปลี่ยนเงื่อนไข: ต้องวางอย่างน้อย 1 ใบ (แทนที่จะเป็น 3 ใบ)
  if (!battle || battle.player1Cards.length < 1 || battle.player2Cards.length < 1) return;

  const player1 = room.players.find(p => p.id === battle.player1Id);
  const player2 = room.players.find(p => p.id === battle.player2Id);
  
  if (!player1 || !player2) return;

  const winnerId = determineBattleWinner(battle.player1Cards, battle.player2Cards, player1, player2);
  
  if (winnerId) {
    battle.winnerId = winnerId;
    const winner = winnerId === player1.id ? player1 : player2;
    const loser = winnerId === player1.id ? player2 : player1;
    const loserBattleCards = winnerId === player1.id ? battle.player2Cards : battle.player1Cards;
    
    const total1 = calculateTotalValue(battle.player1Cards);
    const total2 = calculateTotalValue(battle.player2Cards);
    
    // ผู้ชนะได้รับไพ่ตัวเลขหนึ่งใบจากไพ่ที่ผู้แพ้วางลงในกระดาน battle (ไม่ใช่จากมือ)
    const loserNumberCardsInBattle = loserBattleCards.filter(c => c.type === CardType.NUMBER);
    if (loserNumberCardsInBattle.length > 0) {
      const randomIndex = Math.floor(Math.random() * loserNumberCardsInBattle.length);
      const stolenCard = loserNumberCardsInBattle[randomIndex];
      
      // เพิ่มไพ่ให้ผู้ชนะ
      winner.cards.push(stolenCard);
      
      io.to(room.id).emit('message', { 
        message: `${winner.name} ได้ไพ่ตัวเลข ${stolenCard.value} จากกระดาน battle!` 
      });
    }
    
    // เช็คว่ามีไพ่ซอมบี้ในไพ่ที่วางหรือไม่
    const hasZombieInPlayer1Cards = battle.player1Cards.some(c => c.type === CardType.ZOMBIE);
    const hasZombieInPlayer2Cards = battle.player2Cards.some(c => c.type === CardType.ZOMBIE);
    
    if (hasZombieInPlayer1Cards && winnerId === player1.id) {
      if (loser.status !== PlayerStatus.ZOMBIE) {
        loser.status = PlayerStatus.ZOMBIE;
        loser.cards.push({
          id: `zombie-${Date.now()}`,
          type: CardType.ZOMBIE
        });
        io.to(room.id).emit('message', { 
          message: `${loser.name} ติดเชื้อซอมบี้!` 
        });
      }
    } else if (hasZombieInPlayer2Cards && winnerId === player2.id) {
      if (loser.status !== PlayerStatus.ZOMBIE) {
        loser.status = PlayerStatus.ZOMBIE;
        loser.cards.push({
          id: `zombie-${Date.now()}`,
          type: CardType.ZOMBIE
        });
        io.to(room.id).emit('message', { 
          message: `${loser.name} ติดเชื้อซอมบี้!` 
        });
      }
    }
    
    io.to(room.id).emit('message', { 
      message: `${winner.name} ชนะ! (${total1} vs ${total2})` 
    });
  } else {
    io.to(room.id).emit('message', { 
      message: 'เสมอ!' 
    });
  }
  
  battle.isComplete = true;
  room.currentBattle = undefined;
  
  io.to(room.id).emit('room-updated', room);
  
  // ตรวจสอบว่าเกมจบหรือไม่
  const gameEnd = checkGameEnd(room.players);
  if (gameEnd.isEnded) {
    endGame(room, gameEnd.winner!, gameEnd.reason!, io);
  }
}

function endGame(room: GameRoom, winner: 'HUMAN' | 'ZOMBIE', reason: string, io: SocketServer) {
  room.gameEnded = true;
  room.winningTeam = winner;
  
  // ลบ timer ถ้ามี
  const timer = gameTimers.get(room.id);
  if (timer) {
    clearTimeout(timer);
    gameTimers.delete(room.id);
  }
  
  io.to(room.id).emit('game-ended', { winner, reason });
  io.to(room.id).emit('room-updated', room);
}

function endGameByTime(room: GameRoom, io: SocketServer) {
  const stats = countPlayersByStatus(room.players);
  
  let winner: 'HUMAN' | 'ZOMBIE';
  let reason: string;
  
  if (stats.humans > stats.zombies) {
    winner = 'HUMAN';
    reason = `หมดเวลา! มนุษย์ชนะ (${stats.humans} vs ${stats.zombies})`;
  } else if (stats.zombies > stats.humans) {
    winner = 'ZOMBIE';
    reason = `หมดเวลา! ซอมบี้ชนะ (${stats.zombies} vs ${stats.humans})`;
  } else {
    // เสมอ - ให้มนุษย์ชนะ
    winner = 'HUMAN';
    reason = `หมดเวลา! เสมอกัน - มนุษย์ชนะ!`;
  }
  
  endGame(room, winner, reason, io);
}
