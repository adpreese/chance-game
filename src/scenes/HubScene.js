import Phaser from 'phaser';
import { getState } from '../utils/store.js';
import { createTextButton } from '../utils/ui.js';
import { applySelectedShader } from '../utils/shader.js';
import { playSfx, registerSfx } from '../utils/audio.js';

const gameCards = [
  { key: 'PlinkoScene', label: 'Plinko' },
  { key: 'WheelScene', label: 'Spin Wheel' },
  { key: 'DiceScene', label: 'Dice Roll' },
  { key: 'FishingScene', label: 'Fishing' },
  { key: 'ClawScene', label: 'Claw Game' },
  { key: 'BingoScene', label: 'Bingo Ball' },
  { key: 'HorseRaceScene', label: 'Horse Dash' },
];

const drawPreview = (scene, graphics, key, x, y, width, height) => {
  graphics.fillStyle(0x0f172a, 1).fillRoundedRect(x, y, width, height, 14);
  graphics.lineStyle(2, 0xffffff, 0.08).strokeRoundedRect(x, y, width, height, 14);

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  graphics.lineStyle(3, 0x7ef9ff, 0.6);
  graphics.fillStyle(0xffd166, 0.9);

  switch (key) {
    case 'PlinkoScene':
      graphics.fillCircle(centerX, centerY - 10, 12);
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          graphics.fillCircle(centerX - 60 + col * 40 + (row % 2) * 20, centerY + row * 22, 6);
        }
      }
      graphics.lineStyle(2, 0x9fffd1, 0.7).strokeRect(centerX - 60, centerY + 50, 120, 20);
      break;
    case 'WheelScene':
      graphics.fillStyle(0x7c3aed, 0.8).fillCircle(centerX, centerY, 40);
      graphics.lineStyle(3, 0xffffff, 0.8).strokeCircle(centerX, centerY, 40);
      graphics.lineStyle(3, 0xffd166, 0.9).lineBetween(centerX, centerY - 50, centerX, centerY - 20);
      break;
    case 'DiceScene':
      graphics.fillStyle(0x22c55e, 0.9).fillRoundedRect(centerX - 30, centerY - 30, 60, 60, 12);
      graphics.fillStyle(0xf8fafc, 1).fillCircle(centerX - 10, centerY - 5, 5);
      graphics.fillCircle(centerX + 15, centerY + 8, 5);
      break;
    case 'FishingScene':
      graphics.lineStyle(3, 0xf8fafc, 0.8).lineBetween(centerX - 40, centerY - 40, centerX - 10, centerY);
      graphics.fillStyle(0x38bdf8, 0.8).fillEllipse(centerX + 20, centerY + 10, 70, 30);
      graphics.fillStyle(0xf472b6, 0.9).fillCircle(centerX + 25, centerY + 10, 10);
      break;
    case 'ClawScene':
      graphics.lineStyle(3, 0xf8fafc, 0.8).lineBetween(centerX, centerY - 40, centerX, centerY - 10);
      graphics.fillStyle(0xfacc15, 0.9).fillCircle(centerX, centerY - 5, 12);
      graphics.fillStyle(0x94a3b8, 0.9).fillRect(centerX - 40, centerY + 20, 80, 16);
      break;
    case 'BingoScene':
      graphics.fillStyle(0x38bdf8, 0.7).fillCircle(centerX - 20, centerY, 12);
      graphics.fillStyle(0xf472b6, 0.7).fillCircle(centerX + 15, centerY - 10, 12);
      graphics.fillStyle(0xfbbf24, 0.7).fillCircle(centerX + 5, centerY + 15, 12);
      graphics.lineStyle(2, 0xffffff, 0.6).strokeRect(centerX - 50, centerY + 30, 100, 16);
      break;
    case 'HorseRaceScene':
      graphics.fillStyle(0xf97316, 0.9).fillRoundedRect(centerX - 50, centerY - 15, 36, 14, 6);
      graphics.fillStyle(0xf97316, 0.9).fillCircle(centerX - 12, centerY - 18, 6);
      graphics.fillStyle(0x38bdf8, 0.9).fillRoundedRect(centerX - 10, centerY + 5, 36, 14, 6);
      graphics.fillStyle(0x38bdf8, 0.9).fillCircle(centerX + 28, centerY + 2, 6);
      graphics.lineStyle(2, 0xffffff, 0.4).lineBetween(centerX + 45, centerY - 30, centerX + 45, centerY + 30);
      break;
    default:
      break;
  }
};

class HubScene extends Phaser.Scene {
  constructor() {
    super('HubScene');
  }

  create() {
    registerSfx(this);
    applySelectedShader(this);
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x0b1020, 1);
    this.add
      .text(this.scale.width / 2, 40, 'Chance Arcade', {
        fontFamily: '"Bangers", "Impact", "Trebuchet MS", sans-serif',
        fontSize: '36px',
        color: '#fff1c2',
        stroke: '#3b0d0d',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: 'rgba(255, 136, 0, 0.6)',
          blur: 8,
          fill: true,
        },
      })
      .setOrigin(0.5, 0.5);

    createTextButton(this, this.scale.width - 100, 40, 'Configure', () => {
      playSfx(this, 'uiNavigate');
      this.scene.start('ConfigScene');
    });

    const cardWidth = 200;
    const cardHeight = 160;
    const startX = this.scale.width / 2 - cardWidth * 1.5 - 20;
    const startY = 110;

    const graphics = this.add.graphics();

    gameCards.forEach((card, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = startX + col * (cardWidth + 20);
      const y = startY + row * (cardHeight + 20);
      drawPreview(this, graphics, card.key, x, y, cardWidth, cardHeight);

      const hitZone = this.add.zone(x + cardWidth / 2, y + cardHeight / 2, cardWidth, cardHeight);
      hitZone.setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        playSfx(this, 'uiNavigate');
        this.scene.start(card.key);
      });

      this.add
        .text(x + cardWidth / 2, y + cardHeight - 20, card.label, {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '16px',
          color: '#f5f5f5',
        })
        .setOrigin(0.5, 0.5);
    });

    const { nextGame } = getState();

    createTextButton(this, this.scale.width / 2, this.scale.height - 60, 'Play Configured Game', () => {
      const target = nextGame === 'random' ? Phaser.Utils.Array.GetRandom(gameCards).key : nextGame;
      playSfx(this, 'uiNavigate');
      this.scene.start(target);
    });

    createTextButton(this, this.scale.width / 2, this.scale.height - 25, 'Play Random Game', () => {
      const target = Phaser.Utils.Array.GetRandom(gameCards).key;
      playSfx(this, 'uiNavigate');
      this.scene.start(target);
    });
  }
}

export default HubScene;
