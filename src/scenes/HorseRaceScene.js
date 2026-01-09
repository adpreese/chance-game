import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, fallbackItems, getItems } from '../utils/store.js';

const horseColors = [0xf97316, 0x38bdf8, 0xf472b6, 0x34d399, 0xfacc15];

const buildHorse = (scene, color) => {
  const container = scene.add.container(0, 0);
  const body = scene.add.rectangle(0, 0, 42, 18, color, 1);
  const head = scene.add.circle(26, -4, 8, color, 1);
  const tail = scene.add.triangle(-26, -2, 0, 0, 12, 6, 12, -6, 0xffffff, 0.6);
  const saddle = scene.add.rectangle(0, -4, 18, 10, 0x1f2937, 0.6);

  container.add([tail, body, saddle, head]);
  return container;
};

class HorseRaceScene extends BaseGameScene {
  constructor() {
    super('HorseRaceScene');
    this.horses = [];
    this.raceTimer = null;
    this.winnerName = '';
    this.finishX = 0;
  }

  create() {
    this.createBaseLayout('Horse Dash');
    this.resultText.setText('Race in progress...');

    const startX = 120;
    this.finishX = this.scale.width - 120;
    const laneCount = 5;
    const laneHeight = 80;
    const topY = 140;

    const track = this.add.graphics();
    track.fillStyle(0x111827, 0.6).fillRoundedRect(80, 110, this.scale.width - 160, laneCount * laneHeight + 30, 18);
    track.lineStyle(2, 0xffffff, 0.15).strokeRoundedRect(80, 110, this.scale.width - 160, laneCount * laneHeight + 30, 18);
    track.lineStyle(3, 0xffffff, 0.4).lineBetween(this.finishX, 120, this.finishX, 120 + laneCount * laneHeight + 10);

    this.add
      .text(this.finishX + 10, 120, 'Finish', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#f8fafc',
      })
      .setOrigin(0, 0.5);

    const items = getItems();
    const horseNames = items.length ? items : fallbackItems;
    const lanes = Array.from({ length: laneCount }, (_, index) => horseNames[index % horseNames.length]);

    this.winnerName = Phaser.Utils.Array.GetRandom(lanes);

    this.horses = lanes.map((name, index) => {
      const laneY = topY + index * laneHeight + 30;
      const horse = buildHorse(this, horseColors[index % horseColors.length]);
      horse.setPosition(startX, laneY);
      horse.name = name;
      const isWinner = name === this.winnerName;
      horse.minSpeed = isWinner ? 1.8 : 1.2;
      horse.maxSpeed = isWinner ? 3.4 : 2.7;
      horse.speed = Phaser.Math.FloatBetween(horse.minSpeed, horse.maxSpeed);
      horse.speedTarget = Phaser.Math.FloatBetween(horse.minSpeed, horse.maxSpeed);
      horse.speedJitter = isWinner ? 0.12 : 0.16;
      horse.targetShiftChance = 0.08;

      this.add
        .text(startX - 30, laneY, name, {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '14px',
          color: '#e2e8f0',
        })
        .setOrigin(1, 0.5);

      return horse;
    });

    this.raceTimer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!this.horses.length) {
          return;
        }
        this.horses.forEach((horse) => {
          if (Phaser.Math.FloatBetween(0, 1) < horse.targetShiftChance) {
            horse.speedTarget = Phaser.Math.FloatBetween(horse.minSpeed, horse.maxSpeed);
          }
          horse.speed += (horse.speedTarget - horse.speed) * 0.08;
          horse.speed += Phaser.Math.FloatBetween(-horse.speedJitter, horse.speedJitter);
          horse.speed = Phaser.Math.Clamp(horse.speed, horse.minSpeed, horse.maxSpeed);
          horse.x += horse.speed;
        });

        const winner = this.horses.find((horse) => horse.name === this.winnerName);
        if (winner && winner.x >= this.finishX) {
          winner.x = this.finishX;
          this.finishRace();
        }
      },
    });
  }

  finishRace() {
    if (this.raceTimer) {
      this.raceTimer.remove();
      this.raceTimer = null;
    }
    consumeItem(this.winnerName);
    this.setResult(`${this.winnerName} wins!`);
    this.updateItemPoolText();
  }
}

export default HorseRaceScene;
