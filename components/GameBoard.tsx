'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  GameRoom, 
  Player, 
  Card as GameCard, 
  CardType, 
  PlayerStatus 
} from '../types/game';
import { countPlayersByStatus } from '../lib/gameLogic';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Chip,
  Alert,
  Snackbar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Add,
  Login,
  ContentCopy,
  Person,
  Coronavirus,
  PlayArrow,
  Visibility
} from '@mui/icons-material';
import CardComponent from './CardComponent';
import PlayerCard from './PlayerCard';
import BattleCard from './BattleCard';

let socket: Socket | null = null;

export default function GameBoard() {
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showBattleDialog, setShowBattleDialog] = useState(false);
  const [showSpecialCardDialog, setShowSpecialCardDialog] = useState(false);
  
  // Battle states
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [specialCardType, setSpecialCardType] = useState<CardType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Player | null>(null);
  
  // Messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initSocket = useCallback(async () => {
    await fetch('/api/socket');
    
    socket = io({
      path: '/api/socket',
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnected(false);
    });

    socket.on('room-updated', (updatedRoom: GameRoom) => {
      console.log('room-updated received:', updatedRoom);
      if (updatedRoom.currentBattle) {
        console.log('Current battle:', {
          player1Cards: updatedRoom.currentBattle.player1Cards?.length || 0,
          player2Cards: updatedRoom.currentBattle.player2Cards?.length || 0,
          player1CardsRevealed: updatedRoom.currentBattle.player1CardsRevealed?.length || 0,
          player2CardsRevealed: updatedRoom.currentBattle.player2CardsRevealed?.length || 0
        });
      }
      setRoom(updatedRoom);
    });

    socket.on('game-started', (startedRoom: GameRoom) => {
      setRoom(startedRoom);
      setMessage('เกมเริ่มแล้ว!');
    });

    socket.on('game-ended', (data: { winner: string; reason: string }) => {
      setMessage(`${data.winner === 'HUMAN' ? 'มนุษย์ชนะ!' : 'ซอมบี้ชนะ!'} - ${data.reason}`);
    });

    socket.on('message', (data: { message: string }) => {
      setMessage(data.message);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });
  }, []);

  useEffect(() => {
    initSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [initSocket]);

  const createRoom = () => {
    if (!socket || !playerName) return;
    socket.emit('create-room', playerName, (response: { success: boolean; playerId: string; roomId: string; error?: string }) => {
      if (response.success) {
        setMyPlayerId(response.playerId);
        setShowCreateDialog(false);
        setMessage(`สร้างห้องสำเร็จ! รหัสห้อง: ${response.roomId}`);
      }
    });
  };

  const joinRoom = () => {
    if (!socket || !playerName || !roomIdInput) return;
    socket.emit('join-room', { roomId: roomIdInput, playerName }, (response: { success: boolean; playerId: string; roomId: string; error?: string }) => {
      if (response.success) {
        setMyPlayerId(response.playerId);
        setShowJoinDialog(false);
        setMessage('เข้าร่วมห้องสำเร็จ!');
      } else {
        setError(response.error || 'เกิดข้อผิดพลาด');
      }
    });
  };

  const setReady = () => {
    if (!socket || !room) return;
    socket.emit('player-ready', room.id);
  };

  const copyRoomId = () => {
    if (room) {
      navigator.clipboard.writeText(room.id);
      setMessage('คัดลอกรหัสห้องแล้ว!');
    }
  };

  const startBattle = () => {
    if (!socket || !room || !selectedOpponent) return;
    socket.emit('start-battle', { roomId: room.id, opponentId: selectedOpponent.id });
    setShowBattleDialog(false);
    setSelectedOpponent(null);
  };

  const playCard = (card: GameCard) => {
    if (!socket || !room || !room.currentBattle) {
      console.log('playCard: Cannot play card', { socket: !!socket, room: !!room, battle: !!room?.currentBattle });
      return;
    }
    
    const myPlayer = room.players.find(p => p.id === myPlayerId);
    if (!myPlayer) {
      console.log('playCard: My player not found');
      return;
    }
    
    const isMyTurn = room.currentBattle.player1Id === myPlayerId || 
                     room.currentBattle.player2Id === myPlayerId;
    
    if (!isMyTurn) {
      console.log('playCard: Not my turn');
      setError('ยังไม่ถึงตาคุณ');
      return;
    }
    
    console.log('playCard: Emitting play-card event', { roomId: room.id, cardId: card.id });
    socket.emit('play-card', { roomId: room.id, cardId: card.id });
    setSelectedCard(null);
  };

  const revealCard = () => {
    if (!socket || !room || !room.currentBattle) return;
    socket.emit('reveal-cards', room.id);
  };

  const useSpecialCard = () => {
    if (!socket || !room || !specialCardType || !selectedTarget) return;
    
    if (specialCardType === CardType.SHOTGUN) {
      socket.emit('use-shotgun', { roomId: room.id, targetPlayerId: selectedTarget.id });
    } else if (specialCardType === CardType.VACCINE) {
      socket.emit('use-vaccine', { roomId: room.id, targetPlayerId: selectedTarget.id });
    }
    
    setShowSpecialCardDialog(false);
    setSpecialCardType(null);
    setSelectedTarget(null);
  };

  const openSpecialCardDialog = (cardType: CardType) => {
    setSpecialCardType(cardType);
    setShowSpecialCardDialog(true);
  };

  const myPlayer = room?.players.find(p => p.id === myPlayerId);
  const stats = room ? countPlayersByStatus(room.players) : { humans: 0, zombies: 0, eliminated: 0 };

  // Lobby view
  if (!room) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4 }}>
            🧟 Zombie Card Game
          </Typography>
          
          <Typography variant="body1" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
            เกมการ์ดซอมบี้ - เล่นผ่าน Local Network
          </Typography>

          {!connected && <LinearProgress sx={{ mb: 2 }} />}

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setShowCreateDialog(true)}
              disabled={!connected}
              fullWidth
            >
              สร้างห้องใหม่
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<Login />}
              onClick={() => setShowJoinDialog(true)}
              disabled={!connected}
              fullWidth
            >
              เข้าร่วมห้อง
            </Button>
          </Stack>
        </Paper>

        {/* Create Room Dialog */}
        <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
          <DialogTitle>สร้างห้องใหม่</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="ชื่อของคุณ"
              fullWidth
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>ยกเลิก</Button>
            <Button onClick={createRoom} variant="contained">สร้างห้อง</Button>
          </DialogActions>
        </Dialog>

        {/* Join Room Dialog */}
        <Dialog open={showJoinDialog} onClose={() => setShowJoinDialog(false)}>
          <DialogTitle>เข้าร่วมห้อง</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="ชื่อของคุณ"
              fullWidth
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="รหัสห้อง"
              fullWidth
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowJoinDialog(false)}>ยกเลิก</Button>
            <Button onClick={joinRoom} variant="contained">เข้าร่วม</Button>
          </DialogActions>
        </Dialog>

        <Snackbar 
          open={!!message} 
          autoHideDuration={3000} 
          onClose={() => setMessage('')}
        >
          <Alert severity="success">{message}</Alert>
        </Snackbar>

        <Snackbar 
          open={!!error} 
          autoHideDuration={3000} 
          onClose={() => setError('')}
        >
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      </Container>
    );
  }

  // Game view
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5">
              ห้อง: {room.id}
              <Button
                size="small"
                startIcon={<ContentCopy />}
                onClick={copyRoomId}
                sx={{ ml: 2 }}
              >
                คัดลอก
              </Button>
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Chip
              icon={<Person />}
              label={`มนุษย์: ${stats.humans}`}
              color="primary"
            />
            <Chip
              icon={<Coronavirus />}
              label={`ซอมบี้: ${stats.zombies}`}
              color="success"
            />
          </Stack>
          
          <Box>
            {!room.gameStarted && myPlayer && !myPlayer.isReady && (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrow />}
                onClick={setReady}
              >
                พร้อมเล่น
              </Button>
            )}
            {!room.gameStarted && myPlayer?.isReady && (
              <Chip label="รอผู้เล่นอื่น..." color="warning" />
            )}
            {room.gameEnded && (
              <Chip 
                label={`${room.winningTeam === 'HUMAN' ? 'มนุษย์ชนะ!' : 'ซอมบี้ชนะ!'}`}
                color={room.winningTeam === 'HUMAN' ? 'primary' : 'success'}
              />
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Battle Status Alert */}
      {!room.currentBattle && room.gameStarted && !room.gameEnded && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            💡 <strong>คลิกที่การ์ดผู้เล่นคนอื่น</strong> เพื่อเริ่มแบทเทิล
          </Typography>
        </Alert>
      )}

      {room.currentBattle && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1">
            ⚔️ <strong>คลิกที่ไพ่ของคุณ 3 ใบ</strong> เพื่อวางลงในกระดาน
          </Typography>
        </Alert>
      )}

      {/* Current Battle */}
      {room.currentBattle && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#fff3e0' }}>
          <Typography variant="h6" gutterBottom>
            ⚔️ การแบทเทิลกำลังดำเนินการ
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'flex-start',
            gap: 4,
            my: 3 
          }}>
            {/* Player 1 Cards */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                {room.players.find(p => p.id === room.currentBattle?.player1Id)?.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
                {[0, 1, 2].map(index => (
                  <BattleCard
                    key={`p1-${index}`}
                    card={room.currentBattle!.player1Cards?.[index]}
                    isRevealed={room.currentBattle!.player1CardsRevealed?.[index] || false}
                    isMyCard={room.currentBattle!.player1Id === myPlayerId}
                  />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                วางแล้ว: {room.currentBattle.player1Cards?.length || 0}/3
              </Typography>
              {room.currentBattle.player1Id === myPlayerId && 
               (room.currentBattle.player1Cards?.length || 0) === 3 && 
               !(room.currentBattle.player1CardsRevealed?.every(r => r)) && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Visibility />}
                  onClick={revealCard}
                  sx={{ mt: 2 }}
                >
                  เปิดไพ่ทั้งหมด
                </Button>
              )}
            </Box>

            <Typography variant="h4" sx={{ color: '#e74c3c', alignSelf: 'center' }}>
              VS
            </Typography>

            {/* Player 2 Cards */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                {room.players.find(p => p.id === room.currentBattle?.player2Id)?.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
                {[0, 1, 2].map(index => (
                  <BattleCard
                    key={`p2-${index}`}
                    card={room.currentBattle!.player2Cards?.[index]}
                    isRevealed={room.currentBattle!.player2CardsRevealed?.[index] || false}
                    isMyCard={room.currentBattle!.player2Id === myPlayerId}
                  />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                วางแล้ว: {room.currentBattle.player2Cards?.length || 0}/3
              </Typography>
              {room.currentBattle.player2Id === myPlayerId && 
               (room.currentBattle.player2Cards?.length || 0) === 3 && 
               !(room.currentBattle.player2CardsRevealed?.every(r => r)) && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Visibility />}
                  onClick={revealCard}
                  sx={{ mt: 2 }}
                >
                  เปิดไพ่ทั้งหมด
                </Button>
              )}
            </Box>
          </Box>
          
          {/* Battle Status */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            {(room.currentBattle.player1Cards?.length || 0) < 3 || (room.currentBattle.player2Cards?.length || 0) < 3 ? (
              <Alert severity="info">
                {room.currentBattle.player1Id === myPlayerId || room.currentBattle.player2Id === myPlayerId
                  ? `เลือกไพ่ ${3 - (room.currentBattle.player1Id === myPlayerId ? (room.currentBattle.player1Cards?.length || 0) : (room.currentBattle.player2Cards?.length || 0))} ใบจากมือของคุณ`
                  : 'รอผู้เล่นวางไพ่...'}
              </Alert>
            ) : !(room.currentBattle.player1CardsRevealed?.every(r => r)) || !(room.currentBattle.player2CardsRevealed?.every(r => r)) ? (
              <Alert severity="warning">ทั้งสองฝ่ายวางไพ่ครบแล้ว! คลิกปุ่ม &quot;เปิดไพ่ทั้งหมด&quot; เพื่อเปิดไพ่</Alert>
            ) : (
              <Alert severity="success">กำลังตัดสินผล...</Alert>
            )}
          </Box>
        </Paper>
      )}

      {/* Players */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ผู้เล่น ({room.players.length})
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)', 
            lg: 'repeat(4, 1fr)' 
          }, 
          gap: 2 
        }}>
          {room.players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === myPlayerId}
              showStatus={player.id === myPlayerId}
              onSelect={
                room.gameStarted && !room.gameEnded && !room.currentBattle && player.id !== myPlayerId
                  ? () => {
                      setSelectedOpponent(player);
                      setShowBattleDialog(true);
                    }
                  : undefined
              }
            />
          ))}
        </Box>
      </Paper>

      {/* My Cards */}
      {myPlayer && room.gameStarted && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            ไพ่ของคุณ ({myPlayer.cards.length})
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Number Cards */}
          <Typography variant="subtitle2" gutterBottom>
            ไพ่ตัวเลข
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {myPlayer.cards
              .filter(card => card.type === CardType.NUMBER)
              .map(card => (
                <CardComponent
                  key={card.id}
                  card={card}
                  onClick={() => {
                    if (room.currentBattle) {
                      playCard(card);
                    }
                  }}
                  disabled={!room.currentBattle || room.gameEnded}
                  selected={selectedCard?.id === card.id}
                />
              ))}
            {myPlayer.cards.filter(c => c.type === CardType.NUMBER).length === 0 && (
              <Typography color="text.secondary">ไม่มีไพ่ตัวเลข</Typography>
            )}
          </Box>

          {/* Special Cards */}
          <Typography variant="subtitle2" gutterBottom>
            ไพ่พิเศษ
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {myPlayer.cards
              .filter(card => card.type !== CardType.NUMBER)
              .map(card => (
                <CardComponent
                  key={card.id}
                  card={card}
                  onClick={() => {
                    if (card.type === CardType.ZOMBIE) {
                      if (room.currentBattle) {
                        playCard(card);
                      }
                    } else {
                      openSpecialCardDialog(card.type);
                    }
                  }}
                  disabled={room.gameEnded}
                />
              ))}
            {myPlayer.cards.filter(c => c.type !== CardType.NUMBER).length === 0 && (
              <Typography color="text.secondary">ไม่มีไพ่พิเศษ</Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* Battle Dialog */}
      <Dialog open={showBattleDialog} onClose={() => setShowBattleDialog(false)}>
        <DialogTitle>เริ่มแบทเทิล</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการท้าชิง {selectedOpponent?.name} หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBattleDialog(false)}>ยกเลิก</Button>
          <Button onClick={startBattle} variant="contained">เริ่มแบทเทิล</Button>
        </DialogActions>
      </Dialog>

      {/* Special Card Dialog */}
      <Dialog open={showSpecialCardDialog} onClose={() => setShowSpecialCardDialog(false)}>
        <DialogTitle>
          ใช้ไพ่{specialCardType === CardType.SHOTGUN ? 'ปืนลูกซอง' : 'วัคซีน'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            เลือกเป้าหมาย:
          </Typography>
          <Stack spacing={1}>
            {room.players
              .filter(p => {
                if (specialCardType === CardType.SHOTGUN) {
                  return p.status === PlayerStatus.ZOMBIE && p.id !== myPlayerId;
                } else if (specialCardType === CardType.VACCINE) {
                  return p.status === PlayerStatus.ZOMBIE && p.id !== myPlayerId;
                }
                return false;
              })
              .map(player => (
                <Button
                  key={player.id}
                  variant={selectedTarget?.id === player.id ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTarget(player)}
                  fullWidth
                >
                  {player.name}
                </Button>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSpecialCardDialog(false)}>ยกเลิก</Button>
          <Button 
            onClick={useSpecialCard} 
            variant="contained"
            disabled={!selectedTarget}
          >
            ใช้ไพ่
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar 
        open={!!message} 
        autoHideDuration={3000} 
        onClose={() => setMessage('')}
      >
        <Alert severity="success">{message}</Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError('')}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Container>
  );
}
