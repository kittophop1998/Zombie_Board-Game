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
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  Alert,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Login,
  ContentCopy,
  PlayArrow,
  Visibility,
  AccessTime,
  Shield,
} from '@mui/icons-material';
import CardComponent from './CardComponent';
import BattleCard from './BattleCard';
import ShotgunChoiceModal from './ShotgunChoiceModal';

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
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Shotgun choice states
  const [showShotgunChoice, setShowShotgunChoice] = useState(false);
  const [shotgunChoiceData, setShotgunChoiceData] = useState<{
    battleId: string;
    chooserId: string;
    chooserName: string;
    loserId: string;
    loserName: string;
  } | null>(null);

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

    socket.on('shotgun-choice-required', (data: {
      battleId: string;
      chooserId: string;
      chooserName: string;
      loserId: string;
      loserName: string;
    }) => {
      console.log('shotgun-choice-required received:', data);
      setShotgunChoiceData(data);
      setShowShotgunChoice(true);
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

  // Timer effect - นับเวลาถอยหลัง
  useEffect(() => {
    if (!room?.gameStarted || room.gameEnded || !room.gameEndTime) {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = room.gameEndTime! - now;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
      } else {
        setTimeRemaining(remaining);
      }
    };

    // อัพเดททันที
    updateTimer();

    // อัพเดททุก 1 วินาที
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [room?.gameStarted, room?.gameEnded, room?.gameEndTime]);

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

  const removeCard = (cardIndex: number) => {
    if (!socket || !room || !room.currentBattle) return;
    
    const myPlayer = room.players.find(p => p.id === myPlayerId);
    if (!myPlayer) return;
    
    const isMyTurn = room.currentBattle.player1Id === myPlayerId || 
                     room.currentBattle.player2Id === myPlayerId;
    
    if (!isMyTurn) {
      setError('ยังไม่ถึงตาคุณ');
      return;
    }
    
    socket.emit('remove-card', { roomId: room.id, cardIndex });
  };

  const confirmCards = () => {
    if (!socket || !room || !room.currentBattle) return;
    socket.emit('confirm-cards', room.id);
  };

  const useSpecialCard = () => {
    if (!socket || !room || !selectedTarget) return;
    
    // เฉพาะวัคซีนเท่านั้น (ปืนไม่ได้ใช้ผ่าน dialog แล้ว)
    if (specialCardType === CardType.VACCINE) {
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

  const handleShotgunChoice = (battleId: string, action: 'steal' | 'kill_opponent') => {
    if (!socket || !room) return;
    
    console.log('Sending shotgun choice:', { roomId: room.id, battleId, action });
    socket.emit('choose-shotgun-action', { 
      roomId: room.id, 
      battleId, 
      action 
    });
    
    setShowShotgunChoice(false);
    setShotgunChoiceData(null);
  };

  // หาคู่ battle ของเรา
  const getBattleOpponent = () => {
    if (!room?.currentBattle || !myPlayerId) return null;
    
    const opponentId = room.currentBattle.player1Id === myPlayerId 
      ? room.currentBattle.player2Id 
      : room.currentBattle.player2Id === myPlayerId 
        ? room.currentBattle.player1Id 
        : null;
    
    if (!opponentId) return null;
    return room.players.find(p => p.id === opponentId) || null;
  };

  // เช็คว่าอยู่ใน battle หรือไม่
  const isInBattle = () => {
    if (!room?.currentBattle || !myPlayerId) return false;
    return room.currentBattle.player1Id === myPlayerId || room.currentBattle.player2Id === myPlayerId;
  };

  // แปลงเวลาเป็นรูปแบบ MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const myPlayer = room?.players.find(p => p.id === myPlayerId);

  // Lobby view
  if (!room) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8F7FF 0%, #E5FFFB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Box sx={{ maxWidth: 440, width: '100%', bgcolor: '#FFFFFF', borderRadius: '28px', p: 4, border: '1px solid #E4E7F5', boxShadow: '0 16px 40px rgba(32, 34, 56, 0.14)', textAlign: 'center' }}>
          {/* Logo */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ fontSize: 80, lineHeight: 1 }}>🧟</Box>
              <Box sx={{
                position: 'absolute', top: -4, right: -4,
                bgcolor: '#FF4D6D', borderRadius: '50%', p: 0.5,
                border: '3px solid #FFFFFF',
                fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32
              }}>
                🔫
              </Box>
            </Box>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 900, color: '#202238', mb: 0.5, letterSpacing: '-1px' }}>
            ZOMBIE CARD GAME
          </Typography>
          <Typography sx={{ color: '#6B6F8A', mb: 4, fontSize: 14 }}>
            &quot;รอดชีวิต หรือ กลายเป็นพวกมัน&quot;
          </Typography>

          {!connected && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setShowCreateDialog(true)}
              disabled={!connected}
              fullWidth
              sx={{ py: 1.75, bgcolor: '#7C5CFF', '&:hover': { bgcolor: '#4E35B8' }, boxShadow: '0 8px 24px rgba(124,92,255,0.25)' }}
            >
              สร้างห้องใหม่
            </Button>

            <Button
              variant="contained"
              size="large"
              startIcon={<Login />}
              onClick={() => setShowJoinDialog(true)}
              disabled={!connected}
              fullWidth
              sx={{ py: 1.75, bgcolor: '#EEE9FF', color: '#4E35B8', boxShadow: 'none', '&:hover': { bgcolor: '#e0d8ff', boxShadow: 'none' } }}
            >
              เข้าร่วมห้อง
            </Button>
          </Stack>
        </Box>

        {/* Create Room Dialog */}
        <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} PaperProps={{ sx: { minWidth: 360 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>สร้างห้องใหม่</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="ชื่อของคุณ"
              fullWidth
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setShowCreateDialog(false)}>ยกเลิก</Button>
            <Button onClick={createRoom} variant="contained">สร้างห้อง</Button>
          </DialogActions>
        </Dialog>

        {/* Join Room Dialog */}
        <Dialog open={showJoinDialog} onClose={() => setShowJoinDialog(false)} PaperProps={{ sx: { minWidth: 360 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>เข้าร่วมห้อง</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="ชื่อของคุณ"
              fullWidth
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              sx={{ mb: 1 }}
            />
            <TextField
              margin="dense"
              label="รหัสห้อง"
              fullWidth
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setShowJoinDialog(false)}>ยกเลิก</Button>
            <Button onClick={joinRoom} variant="contained">เข้าร่วม</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage('')}>
          <Alert severity="success">{message}</Alert>
        </Snackbar>
        <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')}>
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      </Box>
    );
  }

  // ======= LOBBY VIEW (room exists but game not started) =======
  if (!room.gameStarted) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8F7FF 0%, #E5FFFB 100%)', p: { xs: 2, sm: 4 } }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>

          {/* Header bar */}
          <Box sx={{
            bgcolor: '#FFFFFF', borderRadius: '20px', p: 3, mb: 3,
            border: '1px solid #E4E7F5', boxShadow: '0 8px 24px rgba(32, 34, 56, 0.10)',
            display: 'flex', flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between', gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#F1F5FF', borderRadius: '12px', border: '1px solid #E4E7F5' }}>
                <Typography sx={{ color: '#6B6F8A', fontSize: 12, lineHeight: 1.2 }}>รหัสห้อง</Typography>
                <Typography sx={{ color: '#202238', fontSize: 22, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.2 }}>
                  {room.id}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={copyRoomId}
                sx={{ p: 1.5, minWidth: 0, bgcolor: '#EEE9FF', color: '#7C5CFF', '&:hover': { bgcolor: '#e0d8ff' }, borderRadius: '12px' }}
              >
                <ContentCopy fontSize="small" />
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ color: '#6B6F8A', fontSize: 12 }}>สถานะผู้เล่น</Typography>
                <Typography sx={{ color: '#202238', fontWeight: 700 }}>
                  {room.players.filter(p => p.isReady).length} / {room.players.length} พร้อมแล้ว
                </Typography>
              </Box>
              {myPlayer && !myPlayer.isReady ? (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={setReady}
                  sx={{ px: 4, py: 1.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,217,192,0.25)' }}
                >
                  พร้อมเล่น
                </Button>
              ) : (
                <Chip label="รอผู้เล่นอื่น..." color="warning" sx={{ fontWeight: 700, px: 1 }} />
              )}
            </Box>
          </Box>

          {/* Player grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3
          }}>
            {room.players.map((player) => {
              const isMe = player.id === myPlayerId;
              return (
                <Box key={player.id} sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '20px',
                  p: 3,
                  border: isMe ? '2px solid #7C5CFF' : '2px solid #E4E7F5',
                  boxShadow: isMe ? '0 0 24px rgba(124, 92, 255, 0.28)' : '0 8px 24px rgba(32, 34, 56, 0.08)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 0.2s',
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <Box sx={{
                      width: 72, height: 72, bgcolor: '#F1F5FF', borderRadius: '50%',
                      border: '2px solid #E4E7F5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 32
                    }}>
                      🧑
                    </Box>
                    {isMe && (
                      <Box sx={{
                        position: 'absolute', bottom: -4, right: -4,
                        bgcolor: '#7C5CFF', color: '#fff', fontSize: 10,
                        px: 0.75, py: 0.25, borderRadius: 10, fontWeight: 700, lineHeight: 1.4
                      }}>ME</Box>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#202238' }}>
                      {player.name}{isMe ? ' (คุณ)' : ''}
                    </Typography>
                    <Typography sx={{ color: player.isReady ? '#009A89' : '#6B6F8A', fontSize: 13, fontWeight: player.isReady ? 700 : 400 }}>
                      {player.isReady ? '✅ พร้อมแล้ว' : 'รอกดพร้อม...'}
                    </Typography>
                  </Box>
                  {/* card back indicators */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {Array.from({ length: Math.max(player.cards.length, 7) }).map((_, j) => (
                      <Box key={j} sx={{
                        width: 8, height: 12, borderRadius: 0.5,
                        bgcolor: j < player.cards.length ? '#7C5CFF' : '#E4E7F5'
                      }} />
                    ))}
                  </Box>
                </Box>
              );
            })}

            {/* Empty slot placeholder */}
            {room.players.length < 6 && (
              <Box sx={{
                bgcolor: 'rgba(241,245,255,0.6)', borderRadius: '20px', p: 3,
                border: '2px dashed #E4E7F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#A0A4BD', fontStyle: 'italic', minHeight: 180
              }}>
                รอผู้เล่นเข้าร่วม...
              </Box>
            )}
          </Box>
        </Box>

        <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage('')}>
          <Alert severity="success">{message}</Alert>
        </Snackbar>
        <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')}>
          <Alert severity="error">{error}</Alert>
        </Snackbar>

        {/* ── Shotgun Choice Modal — ต้องอยู่ทุก view เพื่อไม่ให้หายเมื่อ state เปลี่ยน ── */}
        <ShotgunChoiceModal
          isOpen={showShotgunChoice && shotgunChoiceData?.chooserId === myPlayerId}
          battleId={shotgunChoiceData?.battleId || ''}
          chooserName={shotgunChoiceData?.chooserName || ''}
          loserName={shotgunChoiceData?.loserName || ''}
          onChoose={handleShotgunChoice}
        />
      </Box>
    );
  }

  // ======= GAME VIEW =======
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8F7FF', color: '#202238', pb: { xs: 12, md: 4 } }}>

      {/* ── Sticky Top Bar ── */}
      <Box sx={{
        bgcolor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid #E4E7F5',
        px: 3, py: 1.5
      }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              bgcolor: '#F1F5FF', px: 1.5, py: 0.5, borderRadius: '8px',
              fontFamily: 'monospace', fontSize: 14, border: '1px solid #E4E7F5', color: '#6B6F8A'
            }}>
              {room.id}
            </Box>
            <Button size="small" onClick={copyRoomId} sx={{ minWidth: 0, p: 0.75, color: '#7C5CFF' }}>
              <ContentCopy sx={{ fontSize: 16 }} />
            </Button>
            {room.gameStarted && !room.gameEnded && timeRemaining !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: timeRemaining < 60000 ? '#FF4D6D' : '#FF9F45' }}>
                <AccessTime sx={{ fontSize: 18 }} />
                <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 16 }}>
                  {formatTime(timeRemaining)}
                </Typography>
              </Box>
            )}
          </Box>

          <Box>
            {room.gameEnded && (
              <Chip
                label={room.winningTeam === 'HUMAN' ? '🏆 มนุษย์ชนะ!' : '🧟 ซอมบี้ชนะ!'}
                color={room.winningTeam === 'HUMAN' ? 'primary' : 'success'}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, sm: 3 } }}>

        {/* ── Status Alerts ── */}
        {!room.currentBattle && !room.gameEnded && (
          <Alert severity="info" sx={{ mb: 3, bgcolor: '#EEE9FF', border: '1px solid rgba(124,92,255,0.3)', color: '#4E35B8' }}>
            💡 <strong>คลิกที่ผู้เล่นคนอื่น</strong> เพื่อเริ่มแบทเทิล
          </Alert>
        )}

        {room.currentBattle && isInBattle() && (
          <Alert severity="warning" sx={{ mb: 3, bgcolor: '#FFF6E0', border: '1px solid rgba(255,159,69,0.35)', color: '#8a5a12' }}>
            ⚔️ <strong>คลิกที่ไพ่ของคุณ 1-3 ใบ</strong> เพื่อวางลงในกระดาน แล้วกด <strong>ยืนยันการเปิดไพ่</strong> เมื่อพร้อม
          </Alert>
        )}

        {room.currentBattle && !isInBattle() && (
          <Alert severity="info" sx={{ mb: 3, bgcolor: '#EEE9FF', border: '1px solid rgba(124,92,255,0.3)', color: '#4E35B8' }}>
            👀 <strong>{room.players.find(p => p.id === room.currentBattle?.player1Id)?.name}</strong>
            {' vs '}
            <strong>{room.players.find(p => p.id === room.currentBattle?.player2Id)?.name}</strong>
            {' กำลังแบทเทิลกัน'}
          </Alert>
        )}

        {/* ── Battle Arena ── */}
        {room.currentBattle && isInBattle() && (() => {
          const battle = room.currentBattle!;
          const p1 = room.players.find(p => p.id === battle.player1Id);
          const p2 = room.players.find(p => p.id === battle.player2Id);
          const isP1 = battle.player1Id === myPlayerId;
          const myCards = isP1 ? battle.player1Cards : battle.player2Cards;
          const myRevealed = isP1 ? battle.player1CardsRevealed : battle.player2CardsRevealed;
          const oppCards = isP1 ? battle.player2Cards : battle.player1Cards;
          const oppRevealed = isP1 ? battle.player2CardsRevealed : battle.player1CardsRevealed;
          const myCardCount = myCards?.length || 0;
          const oppCardCount = oppCards?.length || 0;
          const myConfirmed = isP1 ? battle.player1Confirmed : battle.player2Confirmed;
          const oppConfirmed = isP1 ? battle.player2Confirmed : battle.player1Confirmed;
          const bothConfirmed = battle.player1Confirmed && battle.player2Confirmed;
          const myAllRevealed = myRevealed?.every(r => r) ?? false;

          return (
            <Box sx={{
              bgcolor: '#FFFFFF', border: '1px solid #E4E7F5',
              borderRadius: '28px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(32, 34, 56, 0.14)', mb: 4
            }}>
              {/* Arena header */}
              <Box sx={{
                background: 'linear-gradient(90deg, #FFE8EE 0%, #F1F5FF 50%, #EEE9FF 100%)',
                px: 3, py: 1.5, borderBottom: '1px solid #E4E7F5',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B6F8A', fontSize: 14 }}>
                  <Shield sx={{ fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: '#6B6F8A' }}>การประลองกำลังดำเนินการ</Typography>
                </Box>
                <Typography sx={{ fontSize: 11, bgcolor: '#FFFFFF', px: 1.5, py: 0.5, borderRadius: '8px', color: '#7C5CFF', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
                  Battle Table
                </Typography>
              </Box>

              {/* Arena body */}
              <Box sx={{
                p: { xs: 3, md: 5 },
                display: 'flex', flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center', justifyContent: 'space-around', gap: 4
              }}>
                {/* My side */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
                    {[0, 1, 2].map(index => (
                      <BattleCard
                        key={`my-${index}`}
                        card={myCards?.[index]}
                        isRevealed={myRevealed?.[index] || false}
                        isMyCard={true}
                        onClick={
                          myCards?.[index] && !myConfirmed
                            ? () => removeCard(index)
                            : undefined
                        }
                      />
                    ))}
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#202238', mb: 0.5 }}>
                    {myPlayer?.name} (คุณ)
                  </Typography>
                  <Box sx={{
                    display: 'inline-block', bgcolor: '#EEE9FF',
                    color: '#4E35B8', fontSize: 11, px: 1.5, py: 0.25,
                    borderRadius: 10, border: '1px solid rgba(124,92,255,0.3)', fontWeight: 700
                  }}>
                    วางแล้ว {myCardCount}/3
                  </Box>

                  {/* ปุ่มยืนยัน / สถานะรอ */}
                  <Box sx={{ mt: 1.5 }}>
                    {!myConfirmed ? (
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={confirmCards}
                        disabled={myCardCount < 1 || bothConfirmed || myAllRevealed}
                        sx={{ fontWeight: 700 }}
                      >
                        ✅ ยืนยันการเปิดไพ่
                      </Button>
                    ) : (
                      <Chip
                        label="✅ ยืนยันแล้ว"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </Box>

                {/* VS */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 48, fontWeight: 900, fontStyle: 'italic', color: '#7C5CFF', userSelect: 'none', lineHeight: 1 }}>
                    VS
                  </Typography>
                  {/* Battle status hint */}
                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    {bothConfirmed || myAllRevealed ? (
                      <Typography sx={{ fontSize: 11, color: '#009A89', fontStyle: 'italic', fontWeight: 700 }}>
                        ⚔️ กำลังตัดสินผล...
                      </Typography>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: myConfirmed ? '#00D9C0' : '#A0A4BD'
                          }} />
                          <Typography sx={{ fontSize: 11, color: myConfirmed ? '#009A89' : '#6B6F8A' }}>
                            คุณ {myConfirmed ? '✅' : '⏳'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: oppConfirmed ? '#00D9C0' : '#A0A4BD'
                          }} />
                          <Typography sx={{ fontSize: 11, color: oppConfirmed ? '#009A89' : '#6B6F8A' }}>
                            คู่แข่ง {oppConfirmed ? '✅' : '⏳'}
                          </Typography>
                        </Box>
                        {!myConfirmed && myCardCount >= 1 && (
                          <Typography sx={{ fontSize: 10, color: '#FF9F45', fontStyle: 'italic', mt: 0.5, fontWeight: 700 }}>
                            กดยืนยันเมื่อวางไพ่เสร็จแล้ว
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </Box>

                {/* Opponent side */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
                    {[0, 1, 2].map(index => (
                      <BattleCard
                        key={`opp-${index}`}
                        card={oppCards?.[index]}
                        isRevealed={oppRevealed?.[index] || false}
                        isMyCard={false}
                      />
                    ))}
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#202238', mb: 0.5 }}>
                    {isP1 ? p2?.name : p1?.name}
                  </Typography>
                  <Box sx={{
                    display: 'inline-block', bgcolor: '#FFE8EE',
                    color: '#B8203D', fontSize: 11, px: 1.5, py: 0.25,
                    borderRadius: 10, border: '1px solid rgba(255,77,109,0.3)', fontWeight: 700
                  }}>
                    วางแล้ว {oppCardCount}/3
                  </Box>
                  {/* สถานะ confirm ของฝ่ายตรงข้าม */}
                  <Box sx={{ mt: 1.5 }}>
                    {oppConfirmed ? (
                      <Chip
                        label="✅ ยืนยันแล้ว"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : (
                      <Chip
                        label="⏳ รอยืนยัน..."
                        size="small"
                        sx={{ fontWeight: 700, color: '#6B6F8A', bgcolor: '#F1F5FF' }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Arena footer hint */}
              <Box sx={{ bgcolor: '#F1F5FF', px: 3, py: 1.5, borderTop: '1px solid #E4E7F5', textAlign: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#6B6F8A', fontStyle: 'italic' }}>
                  ℹ️ วางไพ่ดอกเดียวกันกับที่ได้รับ (สูงสุด 3 ใบ) — คลิกไพ่ที่วางแล้วเพื่อเอาคืน — กดยืนยันเมื่อวางไพ่เสร็จแล้ว
                </Typography>
              </Box>
            </Box>
          );
        })()}

        {/* ── Players Grid ── */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2, color: '#202238' }}>
            ผู้เล่น ({room.players.length})
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2
          }}>
            {room.players.map(player => {
              const isMe = player.id === myPlayerId;
              const canChallenge = !room.gameEnded && !room.currentBattle && !isMe && player.status !== PlayerStatus.ELIMINATED;
              return (
                <Box
                  key={player.id}
                  onClick={canChallenge ? () => { setSelectedOpponent(player); setShowBattleDialog(true); } : undefined}
                  sx={{
                    bgcolor: '#FFFFFF', border: isMe ? '2px solid #7C5CFF' : '1px solid #E4E7F5',
                    borderRadius: '20px', p: 2.5,
                    boxShadow: isMe ? '0 0 24px rgba(124, 92, 255, 0.28)' : '0 4px 12px rgba(32, 34, 56, 0.06)',
                    cursor: canChallenge ? 'pointer' : 'default',
                    opacity: player.status === PlayerStatus.ELIMINATED ? 0.45 : 1,
                    transition: 'all 0.2s',
                    '&:hover': canChallenge ? { borderColor: '#FF9F45', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(32, 34, 56, 0.14)' } : {},
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5
                  }}
                >
                  <Box sx={{ fontSize: 36 }}>
                    {player.status === PlayerStatus.ELIMINATED ? '💀' : isMe ? '🧑' : '👤'}
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: '#202238', fontSize: 15 }}>
                      {player.name}{isMe ? ' (คุณ)' : ''}
                    </Typography>
                    {isMe && player.status !== PlayerStatus.ELIMINATED && (
                      <Box sx={{
                        display: 'inline-block', mt: 0.5,
                        bgcolor: player.status === PlayerStatus.ZOMBIE ? '#E5FFFB' : '#EEE9FF',
                        color: player.status === PlayerStatus.ZOMBIE ? '#009A89' : '#4E35B8',
                        fontSize: 11, px: 1.5, py: 0.25, borderRadius: 10, fontWeight: 700,
                        border: `1px solid ${player.status === PlayerStatus.ZOMBIE ? 'rgba(0,217,192,0.35)' : 'rgba(124,92,255,0.3)'}`
                      }}>
                        {player.status === PlayerStatus.ZOMBIE ? '🧟 ซอมบี้' : '🧑 มนุษย์'}
                      </Box>
                    )}
                  </Box>
                  <Chip label={`ไพ่: ${player.cards.length}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                  {canChallenge && (
                    <Typography sx={{ fontSize: 11, color: '#6B6F8A', fontStyle: 'italic' }}>
                      คลิกเพื่อท้าชิง
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ── My Hand ── */}
        {myPlayer && (
          <Box sx={{ bgcolor: '#FFFFFF', border: '1px solid #E4E7F5', borderRadius: '28px', boxShadow: '0 8px 24px rgba(32, 34, 56, 0.08)', p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pb: 1.5, borderBottom: '1px solid #E4E7F5' }}>
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#202238' }}>
                ไพ่ของคุณ <Box component="span" sx={{ color: '#A0A4BD', fontWeight: 400 }}>({myPlayer.cards.length})</Box>
              </Typography>
              {room.currentBattle && isInBattle() && (
                <Typography sx={{ fontSize: 12, color: '#6B6F8A' }}>
                  คลิกไพ่เพื่อวางลงกระดาน
                </Typography>
              )}
            </Box>

            {/* Number Cards */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 11, color: '#A0A4BD', letterSpacing: 2, textTransform: 'uppercase', mb: 2, fontWeight: 700 }}>
                ไพ่ตัวเลข
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {myPlayer.cards.filter(c => c.type === CardType.NUMBER).map(card => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    onClick={() => { if (room.currentBattle) playCard(card); }}
                    disabled={!room.currentBattle || room.gameEnded}
                    selected={selectedCard?.id === card.id}
                  />
                ))}
                {myPlayer.cards.filter(c => c.type === CardType.NUMBER).length === 0 && (
                  <Typography sx={{ color: '#A0A4BD', fontStyle: 'italic', fontSize: 14 }}>ไม่มีไพ่ตัวเลข</Typography>
                )}
              </Box>
            </Box>

            {/* Special Cards */}
            <Box>
              <Typography sx={{ fontSize: 11, color: '#A0A4BD', letterSpacing: 2, textTransform: 'uppercase', mb: 2, fontWeight: 700 }}>
                ไพ่พิเศษ
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {myPlayer.cards.filter(c => c.type !== CardType.NUMBER).map(card => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    onClick={() => {
                      if (card.type === CardType.ZOMBIE) {
                        if (room.currentBattle) playCard(card);
                      } else if (card.type === CardType.SHOTGUN) {
                        if (room.currentBattle) playCard(card);
                        else setError('ใช้ไพ่ปืนได้เฉพาะตอนอยู่ใน battle เท่านั้น');
                      } else if (card.type === CardType.VACCINE) {
                        openSpecialCardDialog(card.type);
                      }
                    }}
                    disabled={room.gameEnded}
                  />
                ))}
                {myPlayer.cards.filter(c => c.type !== CardType.NUMBER).length === 0 && (
                  <Typography sx={{ color: '#A0A4BD', fontStyle: 'italic', fontSize: 14 }}>ไม่มีไพ่พิเศษ</Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Battle Dialog ── */}
      <Dialog open={showBattleDialog} onClose={() => setShowBattleDialog(false)} PaperProps={{ sx: { minWidth: 320 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>⚔️ เริ่มแบทเทิล</DialogTitle>
        <DialogContent>
          <Typography>คุณต้องการท้าชิง <strong>{selectedOpponent?.name}</strong> หรือไม่?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowBattleDialog(false)}>ยกเลิก</Button>
          <Button onClick={startBattle} variant="contained" color="error">เริ่มแบทเทิล</Button>
        </DialogActions>
      </Dialog>

      {/* ── Vaccine Dialog ── */}
      <Dialog open={showSpecialCardDialog} onClose={() => setShowSpecialCardDialog(false)} PaperProps={{ sx: { minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>💉 ใช้ไพ่วัคซีน</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>เลือกผู้เล่นที่ต้องการรักษา (ห้ามใช้กับตัวเอง):</Typography>
          <Stack spacing={1}>
            {(() => {
              const battleOpponent = getBattleOpponent();
              const availablePlayers: Player[] = isInBattle() && battleOpponent
                ? [battleOpponent]
                : room.players.filter(p => p.status !== PlayerStatus.ELIMINATED && p.id !== myPlayerId);
              return availablePlayers.map(player => (
                <Button
                  key={player.id}
                  variant={selectedTarget?.id === player.id ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTarget(player)}
                  fullWidth
                >
                  {player.name}
                </Button>
              ));
            })()}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            {isInBattle()
              ? '⚠️ กติกา: วัคซีนห้ามใช้กับตัวเอง (ใช้ได้เฉพาะคู่ battle)'
              : '⚠️ กติกา: วัคซีนห้ามใช้กับตัวเอง'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowSpecialCardDialog(false)}>ยกเลิก</Button>
          <Button onClick={useSpecialCard} variant="contained" disabled={!selectedTarget}>ใช้ไพ่</Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbars ── */}
      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage('')}>
        <Alert severity="success">{message}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      {/* ── Shotgun Choice Modal ── */}
      <ShotgunChoiceModal
        isOpen={showShotgunChoice && shotgunChoiceData?.chooserId === myPlayerId}
        battleId={shotgunChoiceData?.battleId || ''}
        chooserName={shotgunChoiceData?.chooserName || ''}
        loserName={shotgunChoiceData?.loserName || ''}
        onChoose={handleShotgunChoice}
      />
    </Box>
  );
}
