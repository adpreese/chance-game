import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';

class BingoScene extends BaseGameScene {
  constructor() {
    super('BingoScene');
  }

  create() {
    this.createBaseLayout('Bingo Ball Drop');

    const frame = this.add.rectangle(this.scale.width / 2, this.scale.height / 2 + 20, 520, 360, 0x0f172a, 0.4);
    frame.setStrokeStyle(2, 0xffffff, 0.2);

    for (let i = 0; i < 4; i += 1) {
      const peg = this.matter.add.circle(this.scale.width / 2 - 150 + i * 100, this.scale.height / 2 - 20, 10, {
        isStatic: true,
        restitution: 0.9,
      });
      this.add.circle(peg.position.x, peg.position.y, 10, 0x7ef9ff, 0.7);
    }

    const sensor = this.matter.add.rectangle(this.scale.width / 2, this.scale.height - 130, 160, 30, {
      isStatic: true,
      isSensor: true,
      label: 'sensor',
    });
    this.add.rectangle(sensor.position.x, sensor.position.y, 160, 30, 0xfbbf24, 0.3).setStrokeStyle(2, 0xfbbf24, 0.7);

    const items = getItems().slice(0, 8);
    const balls = items.map((item, index) => {
      const x = this.scale.width / 2 - 140 + index * 40;
      const body = this.matter.add.circle(x, this.scale.height / 2 - 160, 14, {
        restitution: 1.1,
        frictionAir: 0.01,
        label: `ball-${item}`,
      });
      const ball = this.add.circle(x, body.position.y, 14, 0x38bdf8, 0.9);
      const text = this.add
        .text(x, body.position.y, item, {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '9px',
          color: '#0f172a',
        })
        .setOrigin(0.5);
      return { body, ball, text, item };
    });

    this.matter.world.on('afterupdate', () => {
      balls.forEach(({ body, ball, text }) => {
        ball.setPosition(body.position.x, body.position.y);
        text.setPosition(body.position.x, body.position.y);
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
            consumeItem(ball.item);
            this.setResult(ball.item);
            this.updateItemPoolText();
          }
        }
      });
    });
  }
}

export default BingoScene;
