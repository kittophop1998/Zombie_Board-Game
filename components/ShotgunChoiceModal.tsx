'use client';

import React from 'react';
import styles from './ShotgunChoiceModal.module.css';

interface ShotgunChoiceModalProps {
  isOpen: boolean;
  battleId: string;
  chooserName: string;
  loserName: string;
  onChoose: (battleId: string, action: 'steal' | 'kill_opponent') => void;
}

export default function ShotgunChoiceModal({
  isOpen,
  battleId,
  chooserName,
  loserName,
  onChoose
}: ShotgunChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.title}>🔫 คุณได้เปรียบในการต่อสู้!</h2>
        <p className={styles.description}>
          {chooserName} ชนะการต่อสู้! <br />
          คุณสามารถเลือกได้ว่าจะทำอย่างไรกับปืนของ {loserName}:
        </p>
        
        <div className={styles.choiceButtons}>
          <button
            className={`${styles.choiceButton} ${styles.stealButton}`}
            onClick={() => onChoose(battleId, 'steal')}
          >
            <span className={styles.icon}>🤝</span>
            <span className={styles.buttonText}>ยึดปืนมาใช้เอง</span>
            <span className={styles.description}>เพิ่มไพ่ปืนให้คุณ (สูงสุด 2 ใบ)</span>
          </button>
          
          <button
            className={`${styles.choiceButton} ${styles.killButton}`}
            onClick={() => onChoose(battleId, 'kill_opponent')}
          >
            <span className={styles.icon}>💀</span>
            <span className={styles.buttonText}>ทำ damage</span>
            <span className={styles.description}>{loserName} เสีย HP 1</span>
          </button>
        </div>
        
        <p className={styles.warning}>⚠️ กรุณาเลือกภายใน 30 วินาที</p>
      </div>
    </div>
  );
}
