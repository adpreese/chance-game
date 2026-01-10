import Phaser from 'phaser';
import { createTextButton } from '../utils/ui.js';
import { getNextItem, getState } from '../utils/store.js';
import { applySelectedShader, applyTextBoxShader } from '../utils/shader.js';
import { playSfx, registerSfx } from '../utils/audio.js';

const GAME_BACKGROUNDS = {
  PlinkoScene: { color: 0x3a1b66, accent: 0x5a2b88 },
  WheelScene: { color: 0x122b5c, accent: 0x1d4f9c },
  DiceScene: { color: 0x1b4d3c, accent: 0x2f7a5d },
  FishingScene: { color: 0x0f3b4f, accent: 0x1f6f8f },
  ClawScene: { color: 0x4b1f2a, accent: 0x7a3240 },
  BingoScene: { color: 0x3a3d12, accent: 0x6f7422 },
  HorseRaceScene: { color: 0x3d2d18, accent: 0x6d4b25 },
  MazeRaceScene: { color: 0x102a35, accent: 0x1f5666 },
};

const getBackgroundTheme = (sceneKey) =>
  GAME_BACKGROUNDS[sceneKey] ?? { color: 0x0b1020, accent: 0x1f2a44 };

const renderBackgroundPattern = (scene, sceneKey, theme) => {
  const { width, height } = scene.scale;
  const graphics = scene.add.graphics();
  const accent = Phaser.Display.Color.ValueToColor(theme.accent).color;
  const softAccent = Phaser.Display.Color.ValueToColor(theme.accent).brighten(40).color;

  switch (sceneKey) {
    case 'PlinkoScene': {
      graphics.fillStyle(softAccent, 0.18);
      const spacingX = 70;
      const spacingY = 60;
      for (let row = 0; row < 6; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          const offset = row % 2 === 0 ? 0 : spacingX / 2;
          const x = 120 + col * spacingX + offset;
          const y = 120 + row * spacingY;
          graphics.fillCircle(x, y, 8);
        }
      }
      graphics.lineStyle(2, accent, 0.25).strokeRect(100, height - 160, width - 200, 60);
      break;
    }
    case 'WheelScene': {
      graphics.lineStyle(3, accent, 0.18);
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.6;
      for (let i = 0; i < 16; i += 1) {
        const angle = (Math.PI * 2 * i) / 16;
        graphics.lineBetween(centerX, centerY, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      }
      graphics.lineStyle(6, softAccent, 0.12).strokeCircle(centerX, centerY, radius * 0.35);
      break;
    }
    case 'DiceScene': {
      const tile = 80;
      for (let y = 0; y < height; y += tile) {
        for (let x = 0; x < width; x += tile) {
          const isDark = (x / tile + y / tile) % 2 === 0;
          graphics.fillStyle(isDark ? accent : softAccent, isDark ? 0.16 : 0.08);
          graphics.fillRect(x, y, tile, tile);
        }
      }
      break;
    }
    case 'FishingScene': {
      graphics.lineStyle(2, softAccent, 0.2);
      for (let row = 0; row < 6; row += 1) {
        const y = 120 + row * 70;
        graphics.beginPath();
        for (let x = 0; x <= width; x += 60) {
          const waveY = y + Math.sin((x / width) * Math.PI * 2 + row) * 10;
          if (x === 0) {
            graphics.moveTo(x, waveY);
          } else {
            graphics.lineTo(x, waveY);
          }
        }
        graphics.strokePath();
      }
      graphics.fillStyle(accent, 0.18);
      for (let bubble = 0; bubble < 12; bubble += 1) {
        const x = 100 + bubble * 90;
        const y = height - 140 - (bubble % 3) * 25;
        graphics.fillCircle(x, y, 12 - (bubble % 3) * 2);
      }
      break;
    }
    case 'ClawScene': {
      graphics.lineStyle(6, accent, 0.12);
      const stripeGap = 80;
      for (let x = -height; x < width + height; x += stripeGap) {
        graphics.lineBetween(x, 0, x + height, height);
      }
      graphics.lineStyle(2, softAccent, 0.2).strokeRect(90, 90, width - 180, height - 180);
      break;
    }
    case 'BingoScene': {
      const spacing = 90;
      for (let y = 120; y < height - 120; y += spacing) {
        for (let x = 120; x < width - 120; x += spacing) {
          graphics.fillStyle(accent, 0.16);
          graphics.fillCircle(x, y, 18);
          graphics.fillStyle(softAccent, 0.12);
          graphics.fillCircle(x + 12, y + 10, 8);
        }
      }
      graphics.lineStyle(3, softAccent, 0.2).strokeRoundedRect(80, 100, width - 160, height - 200, 18);
      break;
    }
    case 'HorseRaceScene': {
      graphics.lineStyle(3, accent, 0.22);
      const lanes = 5;
      const laneHeight = (height - 160) / lanes;
      for (let i = 0; i <= lanes; i += 1) {
        const y = 100 + i * laneHeight;
        graphics.lineBetween(80, y, width - 80, y);
      }
      graphics.lineStyle(2, softAccent, 0.18);
      for (let i = 0; i < 12; i += 1) {
        const x = 120 + i * 90;
        const y = 120 + (i % lanes) * laneHeight + laneHeight / 2;
        graphics.lineBetween(x, y, x + 40, y);
      }
      break;
    }
    case 'MazeRaceScene': {
      const cellSize = 50;
      graphics.lineStyle(2, accent, 0.18);
      for (let y = 110; y <= height - 140; y += cellSize) {
        graphics.lineBetween(120, y, width - 120, y);
      }
      for (let x = 120; x <= width - 120; x += cellSize) {
        graphics.lineBetween(x, 110, x, height - 140);
      }
      graphics.lineStyle(3, softAccent, 0.2);
      graphics.strokeRoundedRect(90, 90, width - 180, height - 180, 20);
      break;
    }
    default:
      graphics.fillStyle(accent, 0.12);
      graphics.fillRect(40, 80, width - 80, height - 160);
      break;
  }
};

class BaseGameScene extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.selectedItem = null;
  }

  createBaseLayout(title) {
    registerSfx(this);
    applySelectedShader(this);
    this.matter.world.setBounds(40, 40, this.scale.width - 80, this.scale.height - 80, 64, true, true, false, true);
    const { color, accent } = getBackgroundTheme(this.scene.key);
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, color, 1);
    renderBackgroundPattern(this, this.scene.key, { color, accent });

    this.add
      .text(this.scale.width / 2, 28, title, {
        fontFamily: '"Bangers", "Impact", "Trebuchet MS", sans-serif',
        fontSize: '30px',
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

    createTextButton(this, 90, 30, 'Back to Hub', () => {
      playSfx(this, 'uiNavigate');
      this.scene.start('HubScene');
    });

    this.resultPanel = this.add
      .rectangle(this.scale.width / 2, this.scale.height - 40, 360, 54, 0x11172a, 0.72)
      .setOrigin(0.5, 0.5);
    this.resultPanel.setStrokeStyle(2, 0xffd07a, 0.6);
    applyTextBoxShader(this, this.resultPanel, 'NeonPurple');

    this.resultText = this.add
      .text(this.scale.width / 2, this.scale.height - 40, 'Result pending...', {
        fontFamily: '"Bangers", "Impact", "Trebuchet MS", sans-serif',
        fontSize: '26px',
        fontStyle: '700',
        color: '#ffe08a',
        stroke: '#0f172a',
        strokeThickness: 5,
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: 'rgba(255, 170, 0, 0.7)',
          blur: 10,
          fill: true,
        },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1);
    this.resultText.setResolution(2);

    this.itemPoolText = this.add
      .text(this.scale.width - 18, 32, '', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#c4c4c4',
        align: 'right',
      })
      .setOrigin(1, 0.5);

    this.updateItemPoolText();
  }

  createItemLabel(x, y, text, styleOverrides = {}) {
    const label = this.add.text(x, y, text, {
      fontFamily: '"Rubik", "Inter", system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: '600',
      color: '#f8fafc',
      align: 'center',
      wordWrap: { width: 80 },
      stroke: '#0f172a',
      strokeThickness: 3,
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
      ...styleOverrides,
    });
    label.setOrigin(0.5);
    label.setShadow(0, 2, 'rgba(15, 23, 42, 0.7)', 4, true, true);
    label.setResolution(2);
    return label;
  }

  updateItemPoolText() {
    const { items, removeOnSelect } = getState();
    this.itemPoolText.setText(``);
  }

  pickItem() {
    this.selectedItem = getNextItem();
    this.updateItemPoolText();
    return this.selectedItem;
  }

  setResult(text) {
    this.resultText.setText(`Result: ${text}`);
  }
}

export default BaseGameScene;
