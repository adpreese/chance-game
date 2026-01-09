import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';
import { playSfx } from '../utils/audio.js';

const randomBallColor = () => Phaser.Display.Color.HSLToColor(Math.random(), 0.7, 0.6).color;

class BingoScene extends BaseGameScene {
  constructor() {
    super('BingoScene');
  }

  create() {
    this.createBaseLayout('Bingo Ball Drop');

    const { Bodies, Body } = Phaser.Physics.Matter.Matter;
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 - 10;
    const radius = 160;

    const frame = this.add.circle(centerX, centerY, radius + 24, 0x0f172a, 0.4);
    frame.setStrokeStyle(2, 0xffffff, 0.2);

    const segmentCount = 28;
    const wallThickness = 12;
    const wallLength = (2 * Math.PI * radius) / segmentCount + 4;
    const gapWidth = 150;
    const gapAngle = gapWidth / radius;
    const gapCenter = Math.PI / 2;
    const containerSegments = [];

    for (let i = 0; i < segmentCount; i += 1) {
      const angle = (Math.PI * 2 * i) / segmentCount;
      const relativeAngle = Phaser.Math.Angle.Wrap(angle - gapCenter);
      if (Math.abs(relativeAngle) < gapAngle / 2) {
        continue;
      }
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const segment = Bodies.rectangle(x, y, wallLength, wallThickness, {
        restitution: 0.95,
        friction: 0.02,
      });
      Body.rotate(segment, angle + Math.PI / 2);
      containerSegments.push(segment);
    }

    const containerBody = Body.create({
      parts: containerSegments,
      isStatic: true,
      label: 'bingo-container',
    });
    this.matter.world.add(containerBody);

    for (let i = 0; i < 12; i += 1) {
      const angle = Phaser.Math.DegToRad((360 / 12) * i);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const wall = this.matter.add.circle(x, y, 12, {
        isStatic: true,
        restitution: 0.9,
      });
      this.add.circle(wall.position.x, wall.position.y, 12, 0x1f2937, 0.7).setStrokeStyle(1, 0x7ef9ff, 0.6);
    }

    const latchY = centerY + radius + 6;
    const latchBody = this.matter.add.rectangle(centerX, latchY, 140, 20, {
      isStatic: true,
      label: 'latch',
    });
    const latchVisual = this.add.rectangle(centerX, latchY, 140, 20, 0xfbbf24, 0.8);
    latchVisual.setStrokeStyle(2, 0xfbbf24, 0.9);

    const sensor = this.matter.add.rectangle(centerX, this.scale.height - 130, 180, 30, {
      isStatic: true,
      isSensor: true,
      label: 'sensor',
    });
    this.add.rectangle(sensor.position.x, sensor.position.y, 180, 30, 0xfbbf24, 0.3).setStrokeStyle(2, 0xfbbf24, 0.7);

    const items = getItems().slice(0, 8);
    const balls = items.map((item, index) => {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(20, radius - 40);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const ballColor = randomBallColor();
      const body = this.matter.add.circle(x, y, 14, {
        restitution: 1.1,
        frictionAir: 0.02,
        label: `ball-${item}`,
      });
      const ball = this.add.circle(x, body.position.y, 14, ballColor, 0.9);
      const text = this.createItemLabel(x, body.position.y, item, {
        fontSize: '10px',
        color: '#0f172a',
        stroke: '#f8fafc',
        strokeThickness: 2,
        wordWrap: { width: 40 },
      });
      return { body, ball, text, item };
    });

    this.matter.world.on('afterupdate', () => {
      balls.forEach(({ body, ball, text }) => {
        ball.setPosition(body.position.x, body.position.y);
        text.setPosition(body.position.x, body.position.y);
      });
    });

    this.matter.world.setGravity(0, 0);
    const spinState = { active: true };
    const spinForce = 0.0006;

    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!spinState.active) {
          return;
        }
        balls.forEach(({ body }) => {
          const dx = body.position.x - centerX;
          const dy = body.position.y - centerY;
          const distance = Math.max(Math.hypot(dx, dy), 1);
          const tangentX = -dy / distance;
          const tangentY = dx / distance;
          this.matter.body.applyForce(body, body.position, {
            x: tangentX * spinForce,
            y: tangentY * spinForce,
          });
        });
      },
    });

    this.time.delayedCall(3000, () => {
      spinState.active = false;
      this.matter.world.setGravity(0, 0.9);
      playSfx(this, 'bingoDraw');
      this.tweens.add({
        targets: latchVisual,
        y: latchVisual.y + 90,
        duration: 500,
        ease: 'Cubic.easeIn',
        onUpdate: () => {
          this.matter.body.setPosition(latchBody, { x: latchBody.position.x, y: latchVisual.y });
        },
        onComplete: () => {
          this.matter.world.remove(latchBody);
        },
      });
    });

    this.matter.world.on('collisionstart', (event) => {
      if (this.hasResult) {
        return;
      }
      event.pairs.forEach((pair) => {
        const bodies = [pair.bodyA, pair.bodyB];
        if (bodies.includes(sensor)) {
          const other = bodies.find((body) => body !== sensor);
          const ball = balls.find((entry) => entry.body === other);
          if (ball) {
            this.hasResult = true;
            playSfx(this, 'bingoMatch');
            consumeItem(ball.item);
            playSfx(this, 'bingoComplete');
            this.setResult(ball.item);
            this.updateItemPoolText();
          }
        }
      });
    });
  }
}

export default BingoScene;
