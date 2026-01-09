import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';

class ClawScene extends BaseGameScene {
  constructor() {
    super('ClawScene');
  }

  create() {
    this.createBaseLayout('Claw Grab');

    const platform = this.add.rectangle(this.scale.width / 2, this.scale.height - 100, 520, 24, 0x1f2937, 0.9);
    platform.setStrokeStyle(2, 0x94a3b8, 0.6);

    const items = getItems().slice(0, 6);
    const prizes = items.map((item, index) => {
      const x = this.scale.width / 2 - 180 + index * 60;
      const y = this.scale.height - 150;
      const body = this.matter.add.circle(x, y, 18, {
        restitution: 0.6,
        friction: 0.2,
        label: `prize-${item}`,
      });
      const ball = this.add.circle(x, y, 18, 0x38bdf8, 0.9);
      const text = this.add
        .text(x, y, item, {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '10px',
          color: '#0f172a',
        })
        .setOrigin(0.5);
      return { body, ball, text, item };
    });

    const anchor = { x: this.scale.width / 2, y: 90 };
    const clawBody = this.matter.add.circle(anchor.x, anchor.y + 60, 16, {
      isSensor: true,
      label: 'claw',
    });
    const clawVisual = this.add.circle(clawBody.position.x, clawBody.position.y, 16, 0xfacc15, 1);
    const tether = this.matter.add.constraint(clawBody, anchor, 60, 0.05);

    this.tweens.add({
      targets: anchor,
      x: { from: this.scale.width / 2 - 160, to: this.scale.width / 2 + 160 },
      yoyo: true,
      duration: 1600,
      repeat: 0,
      onUpdate: () => {
        tether.pointB = { x: anchor.x, y: anchor.y };
      },
      onComplete: () => {
        tether.length = 220;
      },
    });

    this.matter.world.on('afterupdate', () => {
      clawVisual.setPosition(clawBody.position.x, clawBody.position.y);
      prizes.forEach(({ body, ball, text }) => {
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
        if (bodies.includes(clawBody)) {
          const other = bodies.find((body) => body !== clawBody);
          const prize = prizes.find((entry) => entry.body === other);
          if (prize) {
            this.hasResult = true;
            consumeItem(prize.item);
            this.setResult(prize.item);
            this.updateItemPoolText();
            clawBody.isSensor = false;
            this.matter.add.constraint(clawBody, prize.body, 20, 0.9);
          }
        }
      });
    });
  }
}

export default ClawScene;
