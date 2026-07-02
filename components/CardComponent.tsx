'use client';

import React from 'react';
import Image from 'next/image';
import { Card as GameCard, CardType, CardSuit } from '../types/game';
import { Card, CardContent, Box } from '@mui/material';

interface CardComponentProps {
  card: GameCard;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
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

export default function CardComponent({ card, onClick, disabled, selected }: CardComponentProps) {
  const fileName = getCardFileName(card);
  
  return (
    <Card
      onClick={disabled ? undefined : onClick}
      sx={{
        width: 120,
        height: 180,
        cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        border: selected ? '3px solid #7C5CFF' : '2px solid #E4E7F5',
        borderRadius: '14px',
        boxShadow: selected ? '0 0 24px rgba(124, 92, 255, 0.28)' : '0 4px 12px rgba(32, 34, 56, 0.06)',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': onClick && !disabled ? {
          transform: 'translateY(-10px)',
          boxShadow: '0 16px 40px rgba(32, 34, 56, 0.14)'
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
            alt={`Card ${fileName}`}
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>
      </CardContent>
    </Card>
  );
}
