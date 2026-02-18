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

      // เช็คว่าวางครบ 3 ใบหรือยัง
      const myCards = battle.player1Id === socket.id ? battle.player1Cards : battle.player2Cards;
      if (myCards.length >= 3) {
        socket.emit('error', { message: 'วางไพ่ครบ 3 ใบแล้ว' });
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

      // ถ้าทั้งสองคนวางไพ่ครบ 3 ใบแล้ว ให้รอการเปิดไพ่
      if (battle.player1Cards.length === 3 && battle.player2Cards.length === 3) {
        io.to(data.roomId).emit('message', { 
          message: 'ทั้งสองฝ่ายวางไพ่ครบแล้ว! คลิกปุ่มเปิดไพ่' 
        });
      }
    });

    // เปิดไพ่
    socket.on('reveal-cards', (roomId: string) => {
      const room = rooms.get(roomId);
      if (!room || !room.currentBattle) return;

      const battle = room.currentBattle;
      
      // เปิดไพ่ทั้งหมดของผู้เล่นที่กดเปิด
      if (battle.player1Id === socket.id) {
        battle.player1CardsRevealed = battle.player1CardsRevealed.map(() => true);
      } else if (battle.player2Id === socket.id) {
        battle.player2CardsRevealed = battle.player2CardsRevealed.map(() => true);
      }

      io.to(roomId).emit('room-updated', room);

      // ถ้าทั้งสองคนเปิดไพ่แล้ว ให้ตัดสินผล
      const allPlayer1Revealed = battle.player1CardsRevealed.every(r => r);
      const allPlayer2Revealed = battle.player2CardsRevealed.every(r => r);
      
      if (allPlayer1Revealed && allPlayer2Revealed) {
        setTimeout(() => {
          resolveBattle(room, io);
        }, 1000);
      }
    });

    // ใช้ไพ่ปืนลูกซอง
    socket.on('use-shotgun', (data: { roomId: string; targetPlayerId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      const target = room.players.find(p => p.id === data.targetPlayerId);
      
      if (!player || !target) return;

      const shotgunIndex = player.cards.findIndex(c => c.type === CardType.SHOTGUN);
      if (shotgunIndex === -1) return;

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

    // ใช้ไพ่วัคซีน
    socket.on('use-vaccine', (data: { roomId: string; targetPlayerId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      const target = room.players.find(p => p.id === data.targetPlayerId);
      
      if (!player || !target) return;

      if (target.id === player.id) {
        socket.emit('error', { message: 'ไม่สามารถใช้วัคซีนกับตัวเองได้' });
        return;
      }

      const vaccineIndex = player.cards.findIndex(c => c.type === CardType.VACCINE);
      if (vaccineIndex === -1) return;

      if (target.status !== PlayerStatus.ZOMBIE) {
        socket.emit('error', { message: 'ใช้วัคซีนกับซอมบี้เท่านั้น' });
        return;
      }

      // ลบไพ่วัคซีน
      player.cards.splice(vaccineIndex, 1);

      // เปลี่ยนซอมบี้เป็นมนุษย์
      target.status = PlayerStatus.HUMAN;
      // ลบไพ่ซอมบี้ทั้งหมด
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
  
  io.to(roomId).emit('game-started', room);
  io.to(roomId).emit('room-updated', room);
  
  const stats = countPlayersByStatus(room.players);
  io.to(roomId).emit('message', { 
    message: `เกมเริ่มแล้ว! มนุษย์: ${stats.humans} | ซอมบี้: ${stats.zombies}` 
  });
}

function resolveBattle(room: GameRoom, io: SocketServer) {
  const battle = room.currentBattle;
  if (!battle || battle.player1Cards.length < 3 || battle.player2Cards.length < 3) return;

  const player1 = room.players.find(p => p.id === battle.player1Id);
  const player2 = room.players.find(p => p.id === battle.player2Id);
  
  if (!player1 || !player2) return;

  const winnerId = determineBattleWinner(battle.player1Cards, battle.player2Cards, player1, player2);
  
  if (winnerId) {
    battle.winnerId = winnerId;
    const winner = winnerId === player1.id ? player1 : player2;
    const loser = winnerId === player1.id ? player2 : player1;
    
    const total1 = calculateTotalValue(battle.player1Cards);
    const total2 = calculateTotalValue(battle.player2Cards);
    
    // ผู้ชนะได้รับไพ่หนึ่งใบจากผู้แพ้
    if (loser.cards.length > 0) {
      const stolenCardIndex = Math.floor(Math.random() * loser.cards.length);
      const stolenCard = loser.cards.splice(stolenCardIndex, 1)[0];
      winner.cards.push(stolenCard);
      
      // ถ้าไพ่ที่ได้คือไพ่ซอมบี้ ผู้แพ้ติดเชื้อ
      if (stolenCard.type === CardType.ZOMBIE) {
        loser.status = PlayerStatus.ZOMBIE;
        loser.cards.push({
          id: `zombie-${Date.now()}`,
          type: CardType.ZOMBIE
        });
      }
    }
    
    // เช็คว่ามีไพ่ซอมบี้ในไพ่ที่วางหรือไม่
    const hasZombieInPlayer1Cards = battle.player1Cards.some(c => c.type === CardType.ZOMBIE);
    const hasZombieInPlayer2Cards = battle.player2Cards.some(c => c.type === CardType.ZOMBIE);
    
    if (hasZombieInPlayer1Cards && winnerId === player1.id) {
      loser.status = PlayerStatus.ZOMBIE;
      loser.cards.push({
        id: `zombie-${Date.now()}`,
        type: CardType.ZOMBIE
      });
    } else if (hasZombieInPlayer2Cards && winnerId === player2.id) {
      loser.status = PlayerStatus.ZOMBIE;
      loser.cards.push({
        id: `zombie-${Date.now()}`,
        type: CardType.ZOMBIE
      });
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
  
  io.to(room.id).emit('game-ended', { winner, reason });
  io.to(room.id).emit('room-updated', room);
}
