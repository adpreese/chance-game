import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, fallbackItems, getItems } from '../utils/store.js';
import { playSfx } from '../utils/audio.js';

const GRID_SIZE = 8;
const TILE_SIZE = 44;
const TILE_GAP = 6;
const MOVE_INTERVAL = 400;
const COUNTDOWN_STEP = 500;
const PHASE_TWO_START = 4000;

const creaturePalette = [0xf472b6, 0x38bdf8, 0xfacc15, 0x34d399, 0xa78bfa, 0xfb923c, 0x22d3ee, 0xf87171];

const buildCreature = (scene, color, styleIndex) => {
  const container = scene.add.container(0, 0);
  const accent = Phaser.Display.Color.ValueToColor(color).brighten(30).color;
  let body;

  switch (styleIndex % 3) {
    case 0:
      body = scene.add.rectangle(0, 0, 24, 20, color, 1).setStrokeStyle(2, accent, 0.9);
      body.setOrigin(0.5, 0.5);
      break;
    case 1:
      body = scene.add.ellipse(0, 0, 26, 20, color, 1).setStrokeStyle(2, accent, 0.9);
      break;
    default:
      body = scene.add.triangle(0, 2, -12, 10, 12, 10, 0, -12, color, 1).setStrokeStyle(2, accent, 0.9);
      break;
  }

  const leftEye = scene.add.rectangle(-5, -2, 4, 4, 0x0f172a, 1);
  const rightEye = scene.add.rectangle(5, -2, 4, 4, 0x0f172a, 1);
  const eyeGlow = scene.add.rectangle(0, 6, 10, 3, 0xffffff, 0.6);

  container.add([body, leftEye, rightEye, eyeGlow]);
  return container;
};

class SurvivalScene extends BaseGameScene {
  constructor() {
    super('SurvivalScene');
    this.tiles = [];
    this.creatures = [];
    this.moveEvent = null;
    this.phaseOneEvent = null;
    this.phaseTwoEvent = null;
    this.remainingText = null;
    this.countdownText = null;
    this.gameActive = false;
    this.lastEliminated = null;
  }

  create() {
    this.createBaseLayout('Last One Standing!');
    this.resultText.setText('Survive the collapse!');
    this.createArena();
    this.createCreatures();
    this.createHud();
    this.startCountdown();
  }

  createArena() {
    const gridWidth = GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * TILE_GAP;
    const gridHeight = GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * TILE_GAP;
    const startX = this.scale.width / 2 - gridWidth / 2;
    const startY = this.scale.height / 2 - gridHeight / 2 + 20;

    this.tiles = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null));

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const x = startX + col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
        const y = startY + row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
        const tile = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x1f2937, 1).setStrokeStyle(2, 0x0f172a, 0.9);
        tile.setDepth(0);
        this.tiles[row][col] = {
          row,
          col,
          x,
          y,
          rect: tile,
          state: 'solid',
        };
      }
    }
  }

  createCreatures() {
    const items = getItems();
    const entrants = items.length ? items : fallbackItems;
    const roster = entrants.slice(0, 20);
    while (roster.length < 2) {
      roster.push(`Runner ${roster.length + 1}`);
    }

    const positions = [];
    this.tiles.forEach((row) => row.forEach((tile) => positions.push(tile)));
    Phaser.Utils.Array.Shuffle(positions);

    this.creatures = roster.map((name, index) => {
      const tile = positions[index % positions.length];
      const creature = buildCreature(this, creaturePalette[index % creaturePalette.length], index);
      creature.setPosition(tile.x, tile.y);
      creature.setDepth(2);
      creature.name = name;
      creature.row = tile.row;
      creature.col = tile.col;
      creature.prevRow = null;
      creature.prevCol = null;
      creature.alive = true;
      creature.hopTween = null;
      return creature;
    });
  }

  createHud() {
    this.remainingText = this.add
      .text(this.scale.width - 40, 90, '', {
        fontFamily: '"Bangers", "Impact", sans-serif',
        fontSize: '32px',
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 5,
      })
      .setOrigin(1, 0.5);
    this.updateRemainingText();
  }

  startCountdown() {
    const messages = ['3', '2', '1', 'GO!'];
    let step = 0;

    this.countdownText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, messages[step], {
        fontFamily: '"Bangers", "Impact", sans-serif',
        fontSize: '84px',
        color: '#fef08a',
        stroke: '#0f172a',
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(10);

    this.time.addEvent({
      delay: COUNTDOWN_STEP,
      repeat: messages.length - 2,
      callback: () => {
        step += 1;
        if (step < messages.length) {
          this.countdownText.setText(messages[step]);
          this.countdownText.setScale(step === messages.length - 1 ? 1.1 : 1);
          this.countdownText.setColor(step === messages.length - 1 ? '#86efac' : '#fef08a');
          if (step === messages.length - 1) {
            this.time.delayedCall(300, () => {
              this.countdownText.destroy();
              this.startGame();
            });
          }
        }
      },
    });
  }

  startGame() {
    this.gameActive = true;
    this.startMovement();
    this.startPhaseOne();
    this.time.delayedCall(PHASE_TWO_START, () => {
      if (this.gameActive) {
        this.startPhaseTwo();
      }
    });
  }

  startMovement() {
    this.moveEvent = this.time.addEvent({
      delay: MOVE_INTERVAL,
      loop: true,
      callback: () => {
        if (!this.gameActive) {
          return;
        }
        this.creatures.forEach((creature) => {
          if (!creature.alive) {
            return;
          }
          const next = this.pickNextMove(creature);
          if (!next) {
            return;
          }
          this.moveCreature(creature, next.row, next.col);
        });
      },
    });
  }

  pickNextMove(creature) {
    const directions = [
      { row: creature.row - 1, col: creature.col, key: 'up' },
      { row: creature.row + 1, col: creature.col, key: 'down' },
      { row: creature.row, col: creature.col - 1, key: 'left' },
      { row: creature.row, col: creature.col + 1, key: 'right' },
    ];

    const valid = directions.filter((direction) => this.isTileAvailable(direction.row, direction.col));
    if (!valid.length) {
      return null;
    }

    if (creature.prevRow === null || creature.prevCol === null) {
      return Phaser.Utils.Array.GetRandom(valid);
    }

    const backRow = creature.prevRow;
    const backCol = creature.prevCol;
    const weighted = valid.map((direction) => {
      const isBack = direction.row === backRow && direction.col === backCol;
      return { direction, weight: isBack ? 0.15 : 0.2833 };
    });

    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Phaser.Math.FloatBetween(0, totalWeight);
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.direction;
      }
    }

    return weighted[weighted.length - 1].direction;
  }

  moveCreature(creature, row, col) {
    if (!this.isTileAvailable(row, col)) {
      return;
    }
    const tile = this.tiles[row][col];
    if (!tile) {
      return;
    }

    const targetX = tile.x;
    const targetY = tile.y;
    creature.prevRow = creature.row;
    creature.prevCol = creature.col;
    creature.row = row;
    creature.col = col;

    if (creature.hopTween) {
      creature.hopTween.stop();
    }

    playSfx(this, 'hover', { volume: 0.2, rate: 1 + (1 - this.getAliveCount() / this.creatures.length) * 0.4 });

    creature.hopTween = this.tweens.add({
      targets: creature,
      x: targetX,
      y: targetY - 8,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: creature,
          x: targetX,
          y: targetY,
          scaleX: 1,
          scaleY: 1,
          duration: 120,
          ease: 'Quad.easeIn',
        });
      },
    });
  }

  startPhaseOne() {
    const scheduleNext = () => {
      if (!this.gameActive) {
        return;
      }
      const remaining = this.getRemainingTiles().filter((tile) => tile.state === 'solid');
      if (!remaining.length) {
        return;
      }
      const nextTile = Phaser.Utils.Array.GetRandom(remaining);
      this.flashAndCollapse(nextTile, 0xfacc15, 250);
      this.phaseOneEvent = this.time.delayedCall(Phaser.Math.Between(300, 500), scheduleNext);
    };

    scheduleNext();
  }

  startPhaseTwo() {
    let tick = 0;
    this.phaseTwoEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.gameActive) {
          return;
        }
        const remainingTiles = this.getRemainingTiles();
        if (!remainingTiles.length) {
          return;
        }
        let count = 0;
        if (tick === 0) {
          count = 1;
        } else if (tick === 1) {
          count = 2;
        } else if (tick === 2) {
          count = 3;
        } else {
          count = Phaser.Math.Between(2, 4);
        }
        tick += 1;

        Phaser.Utils.Array.Shuffle(remainingTiles);
        remainingTiles.slice(0, count).forEach((tile) => this.flashAndCollapse(tile, 0xf87171, 500));
      },
    });
  }

  flashAndCollapse(tile, flashColor, warningDuration) {
    if (!tile || tile.state === 'gone') {
      return;
    }
    tile.state = 'flashing';
    tile.rect.setFillStyle(flashColor, 1);
    this.tweens.add({
      targets: tile.rect,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: warningDuration,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.collapseTile(tile);
      },
    });
  }

  collapseTile(tile) {
    if (tile.state === 'gone') {
      return;
    }
    tile.state = 'gone';
    playSfx(this, 'impact', { volume: 0.3 });

    const poof = this.add.circle(tile.x, tile.y, TILE_SIZE * 0.3, 0xffffff, 0.5);
    this.tweens.add({
      targets: poof,
      alpha: 0,
      scale: 1.6,
      duration: 280,
      onComplete: () => poof.destroy(),
    });

    this.tweens.add({
      targets: tile.rect,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 260,
      onComplete: () => tile.rect.destroy(),
    });

    this.creatures.forEach((creature) => {
      if (!creature.alive) {
        return;
      }
      if (creature.row === tile.row && creature.col === tile.col) {
        this.eliminateCreature(creature);
      }
    });
  }

  eliminateCreature(creature) {
    if (!creature.alive) {
      return;
    }
    creature.alive = false;
    this.lastEliminated = creature;
    this.updateRemainingText();
    playSfx(this, 'fail', { volume: 0.4 });

    const puff = this.add.circle(creature.x, creature.y - 4, 10, 0xffffff, 0.7);
    this.tweens.add({
      targets: puff,
      alpha: 0,
      scale: 2,
      duration: 280,
      onComplete: () => puff.destroy(),
    });

    this.tweens.add({
      targets: creature,
      y: creature.y + 40,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeIn',
      onComplete: () => creature.destroy(),
    });

    if (this.getAliveCount() <= 1) {
      this.finishGame();
    }
  }

  finishGame() {
    if (!this.gameActive) {
      return;
    }
    this.gameActive = false;
    if (this.moveEvent) {
      this.moveEvent.remove();
    }
    if (this.phaseOneEvent) {
      this.phaseOneEvent.remove();
    }
    if (this.phaseTwoEvent) {
      this.phaseTwoEvent.remove();
    }

    const alive = this.creatures.find((creature) => creature.alive);
    const winner = alive || this.lastEliminated;

    const flash = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xffffff, 0.5);
    flash.setDepth(9);
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

    if (winner) {
      playSfx(this, 'success', { volume: 0.6 });
      this.tweens.add({
        targets: winner,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 200,
        yoyo: true,
        repeat: 2,
      });
    }

    this.time.delayedCall(1000, () => {
      if (winner) {
        consumeItem(winner.name);
        this.setResult(`${winner.name} survives!`);
      } else {
        this.setResult('No survivors!');
      }
      this.updateItemPoolText();
    });
  }

  updateRemainingText() {
    const count = this.getAliveCount();
    this.remainingText.setText(`${count} LEFT`);
  }

  getAliveCount() {
    return this.creatures.filter((creature) => creature.alive).length;
  }

  getRemainingTiles() {
    const remaining = [];
    this.tiles.forEach((row) =>
      row.forEach((tile) => {
        if (tile && tile.state !== 'gone') {
          remaining.push(tile);
        }
      }),
    );
    return remaining;
  }

  isTileAvailable(row, col) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return false;
    }
    const tile = this.tiles[row][col];
    return tile && tile.state !== 'gone';
  }
}

export default SurvivalScene;
