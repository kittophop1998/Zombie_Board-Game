'use client';

import React from 'react';
import Image from 'next/image';
import { Card as GameCard, CardType, CardSuit } from '../types/game';
import { Card, CardContent, Box } from '@mui/material';

interface BattleCardProps {
  card: GameCard | undefined;
  isRevealed: boolean;
  isMyCard?: boolean;
  onClick?: () => void;
}

// แปลงดอกไพ่เป็นชื่อไฟล์
const suitToFileName = {
  [CardSuit.SPADES]: 'Black1',    // โพดำ
  [CardSuit.CLUBS]: 'Black2',     // ดอกจิก
  [CardSuit.DIAMONDS]: 'Red1',    // ข้าวหลามตัด
  [CardSuit.HEARTS]: 'Red2'       // โพแดง
};

// แปลงค่าไพ่เป็นชื่อไฟล์
const getCardFileName = (card: GameCard): string => {
  if (card.type === CardType.NUMBER && card.suit && card.value) {
    const suitName = suitToFileName[card.suit];
    let valueName = '';
    
    if (card.value === 1) {
      valueName = 'A';
    } else if (card.value === 11) {
      valueName = 'J';
    } else if (card.value === 12) {
      valueName = 'Q';
    } else if (card.value === 13) {
      valueName = 'K';
    } else {
      valueName = card.value.toString();
    }
    
    return `${valueName}${suitName}.png`;
  } else if (card.type === CardType.ZOMBIE) {
    return 'Zombie.png';
  } else if (card.type === CardType.SHOTGUN) {
    return 'Gun.png';
  } else if (card.type === CardType.VACCINE) {
    return 'Vaccine.png';
  }
  
  return 'BackCard.png';
};

export default function BattleCard({ card, isRevealed, isMyCard, onClick }: BattleCardProps) {
  if (!card) {
    return (
      <Box sx={{
        width: 80,
        height: 120,
        border: '2px dashed #E4E7F5',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#A0A4BD',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        ?
      </Box>
    );
  }

  // ถ้าเป็นไพ่ของเราเอง แสดงหน้าไพ่เสมอ
  // ถ้าไม่ใช่ไพ่เรา แสดงหลังไพ่จนกว่าจะเปิด
  const showFront = isMyCard || isRevealed;
  const fileName = showFront ? getCardFileName(card) : 'BackCard.png';
  
  return (
    <Card
      onClick={onClick}
      sx={{
        width: 80,
        height: 120,
        cursor: onClick ? 'pointer' : 'default',
        border: '2px solid #7C5CFF',
        borderRadius: '14px',
        boxShadow: '0 4px 12px rgba(32, 34, 56, 0.06)',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': onClick ? {
          transform: 'scale(1.05)',
          boxShadow: '0 0 24px rgba(124, 92, 255, 0.28)'
        } : {},
        position: 'relative',
        overflow: 'hidden',
        padding: 0
      }}
    >
      <CardContent sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        p: 0,
        '&:last-child': { pb: 0 }
      }}>
        <Box sx={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Image
            src={`/${fileName}`}
            alt={showFront ? `Card ${fileName}` : 'Card Back'}
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>
      </CardContent>
    </Card>
  );
}
