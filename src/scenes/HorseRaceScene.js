import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, fallbackItems, getItems } from '../utils/store.js';
import { playSfx } from '../utils/audio.js';

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
    this.sprintEvent = null;
    this.winnerName = '';
    this.finishX = 0;
  }

  create() {
    this.createBaseLayout('Horse Dash Derby!');
    this.resultText.setText('Race in progress...');
    playSfx(this, 'horseRaceStart');

    const startX = 120;
    this.finishX = this.scale.width - 120;
    const trackTop = 110;
    const maxTrackHeight = this.scale.height - 90 - trackTop;

    const items = getItems();
    const horseNames = items.length ? items : fallbackItems;
    const laneCount = Math.max(1, horseNames.length);
    const trackPadding = Math.min(30, Math.max(12, maxTrackHeight * 0.08));
    const availableHeight = Math.max(0, maxTrackHeight - trackPadding * 2);
    const laneHeight = Math.min(80, availableHeight / laneCount);
    const trackHeight = laneCount * laneHeight + trackPadding * 2;
    const laneStartY = trackTop + trackPadding;
    const finishLineTop = trackTop + 10;
    const finishLineBottom = trackTop + trackHeight - 10;

    const track = this.add.graphics();
    track.fillStyle(0x111827, 0.6).fillRoundedRect(80, trackTop, this.scale.width - 160, trackHeight, 18);
    track.lineStyle(2, 0xffffff, 0.15).strokeRoundedRect(80, trackTop, this.scale.width - 160, trackHeight, 18);
    track.lineStyle(3, 0xffffff, 0.4).lineBetween(this.finishX, finishLineTop, this.finishX, finishLineBottom);

    this.add
      .text(this.finishX + 10, finishLineTop, 'Finish', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#f8fafc',
      })
      .setOrigin(0, 0.5);
    const lanes = horseNames;
    const labelFontSize = Math.max(10, Math.min(14, Math.round(laneHeight * 0.35)));
    const horseScale = Math.min(1, Math.max(0.5, laneHeight / 50));

    this.horses = lanes.map((name, index) => {
      const laneY = laneStartY + index * laneHeight;
      const horse = buildHorse(this, horseColors[index % horseColors.length]);
      horse.setPosition(startX, laneY);
      horse.setScale(horseScale);
      horse.name = name;
      horse.minSpeed = 0.6;
      horse.maxSpeed = 2.1;
      horse.speed = Phaser.Math.FloatBetween(horse.minSpeed, horse.maxSpeed);
      horse.speedTarget = Phaser.Math.FloatBetween(horse.minSpeed, horse.maxSpeed);
      horse.speedJitter = 0.24;
      horse.acceleration = Phaser.Math.FloatBetween(-0.05, 0.08);
      horse.accelJitter = 0.03;
      horse.targetShiftChance = 0.16;

      const laneLabel = this.createItemLabel(startX - 30, laneY, name, {
        fontSize: `${labelFontSize}px`,
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 3,
        wordWrap: { width: 120 },
      });
      laneLabel.setOrigin(1, 0.5);

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
            horse.acceleration = Phaser.Math.FloatBetween(-0.08, 0.12);
          }
          horse.speed += (horse.speedTarget - horse.speed) * 0.05;
          horse.acceleration += Phaser.Math.FloatBetween(-horse.accelJitter, horse.accelJitter);
          horse.acceleration = Phaser.Math.Clamp(horse.acceleration, -0.1, 0.12);
          horse.speed += horse.acceleration;
          horse.speed += Phaser.Math.FloatBetween(-horse.speedJitter, horse.speedJitter);
          horse.speed = Phaser.Math.Clamp(horse.speed, horse.minSpeed, horse.maxSpeed);
          horse.x += horse.speed;
        });

        if (!this.winnerName) {
          const winner = this.horses.find((horse) => horse.x >= this.finishX);
          if (winner) {
            winner.x = this.finishX;
            this.winnerName = winner.name;
            this.finishRace();
          }
        }
      },
    });

    this.sprintEvent = this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        if (this.winnerName) {
          return;
        }
        playSfx(this, 'horseRaceSprint');
      },
    });
  }

  finishRace() {
    if (this.raceTimer) {
      this.raceTimer.remove();
      this.raceTimer = null;
    }
    if (this.sprintEvent) {
      this.sprintEvent.remove();
      this.sprintEvent = null;
    }
    playSfx(this, 'horseRaceFinish');
    consumeItem(this.winnerName);
    this.setResult(`${this.winnerName} wins!`);
    this.updateItemPoolText();
  }
}

export default HorseRaceScene;
