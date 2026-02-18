'use client';

import { Player, PlayerStatus } from '../types/game';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Avatar,
  Stack
} from '@mui/material';
import { Person, Coronavirus, Cancel } from '@mui/icons-material';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  onSelect?: () => void;
  showStatus?: boolean; // แสดงสถานะหรือไม่ (มนุษย์/ซอมบี้)
}

export default function PlayerCard({ player, isCurrentPlayer, onSelect, showStatus = false }: PlayerCardProps) {
  const getStatusColor = () => {
    // ใช้สีเดียวกันทุกคนเพื่อไม่ให้เห็นสถานะ
    return '#3498db';
  };

  const getStatusIcon = () => {
    if (!showStatus && !isCurrentPlayer) {
      return <Person />; // แสดงไอคอนคนธรรมดาถ้าไม่ใช่ตัวเอง
    }
    
    switch (player.status) {
      case PlayerStatus.HUMAN:
        return <Person />;
      case PlayerStatus.ZOMBIE:
        return <Coronavirus />;
      case PlayerStatus.ELIMINATED:
        return <Cancel />;
      default:
        return <Person />;
    }
  };

  const getStatusText = () => {
    switch (player.status) {
      case PlayerStatus.HUMAN:
        return 'มนุษย์';
      case PlayerStatus.ZOMBIE:
        return 'ซอมบี้';
      case PlayerStatus.ELIMINATED:
        return 'ถูกกำจัด';
      default:
        return '';
    }
  };

  return (
    <Card
      onClick={onSelect}
      sx={{
        minWidth: 200,
        cursor: onSelect ? 'pointer' : 'default',
        border: isCurrentPlayer ? '3px solid #f39c12' : '1px solid #ecf0f1',
        boxShadow: isCurrentPlayer ? 4 : 1,
        transition: 'all 0.3s',
        '&:hover': onSelect ? {
          boxShadow: 6,
          transform: 'translateY(-5px)'
        } : {},
        opacity: player.status === PlayerStatus.ELIMINATED ? 0.5 : 1
      }}
    >
      <CardContent>
        <Stack spacing={2} alignItems="center">
          <Avatar 
            sx={{ 
              width: 60, 
              height: 60, 
              bgcolor: getStatusColor(),
              fontSize: 30
            }}
          >
            {getStatusIcon()}
          </Avatar>
          
          <Typography variant="h6" component="div" textAlign="center">
            {player.name}
            {isCurrentPlayer && ' (คุณ)'}
          </Typography>
          
          {(showStatus || isCurrentPlayer) && player.status !== PlayerStatus.HUMAN && (
            <Chip 
              label={getStatusText()}
              color={player.status === PlayerStatus.ZOMBIE ? 'success' : 'default'}
              icon={getStatusIcon()}
              size="small"
            />
          )}
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip 
              label={`ไพ่: ${player.cards.length}`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
