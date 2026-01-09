import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';

class FishingScene extends BaseGameScene {
  constructor() {
    super('FishingScene');
  }

  create() {
    this.createBaseLayout('Fishing Pond');

    const pond = this.add.rectangle(this.scale.width / 2, this.scale.height / 2 + 60, 520, 260, 0x1e40af, 0.6);
    pond.setStrokeStyle(2, 0x93c5fd, 0.8);

    const anchor = { x: this.scale.width / 2, y: 110 };
    const hookBody = this.matter.add.circle(anchor.x, anchor.y + 120, 12, {
      frictionAir: 0.02,
      restitution: 0.8,
      label: 'hook',
    });
    const hookVisual = this.add.circle(hookBody.position.x, hookBody.position.y, 12, 0xfbbf24, 1);
    this.matter.add.constraint(hookBody, { x: anchor.x, y: anchor.y }, 120, 0.02);
    this.add.line(0, 0, anchor.x, anchor.y, hookBody.position.x, hookBody.position.y, 0xffffff, 0.6).setOrigin(0, 0);

    const fishItems = getItems().slice(0, 6);
    const fishBodies = fishItems.map((item, index) => {
      const x = this.scale.width / 2 - 180 + index * 60;
      const y = this.scale.height / 2 + 100;
      const body = this.matter.add.circle(x, y, 16, {
        restitution: 1.05,
        frictionAir: 0.01,
        label: `fish-${item}`,
      });
      const fish = this.add.circle(x, y, 16, 0xf472b6, 0.9);
      const text = this.add
        .text(x, y, item, {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '10px',
          color: '#0f172a',
        })
        .setOrigin(0.5);
      return { body, fish, text, item };
    });

    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        fishBodies.forEach(({ body }) => {
          const forceX = Phaser.Math.FloatBetween(-0.002, 0.002);
          const forceY = Phaser.Math.FloatBetween(-0.001, 0.001);
          body.applyForce({ x: forceX, y: forceY });
        });
      },
    });

    this.matter.world.on('afterupdate', () => {
      hookVisual.setPosition(hookBody.position.x, hookBody.position.y);
      fishBodies.forEach(({ body, fish, text }) => {
        fish.setPosition(body.position.x, body.position.y);
        text.setPosition(body.position.x, body.position.y);
      });
    });

    this.matter.world.on('collisionstart', (event) => {
      if (this.hasResult) {
        return;
      }
      event.pairs.forEach((pair) => {
        const bodies = [pair.bodyA, pair.bodyB];
        if (bodies.includes(hookBody)) {
          const other = bodies.find((body) => body !== hookBody);
          const fish = fishBodies.find((entry) => entry.body === other);
          if (fish) {
            this.hasResult = true;
            consumeItem(fish.item);
            this.setResult(fish.item);
            this.updateItemPoolText();
            this.tweens.add({
              targets: fish.fish,
              scale: 1.4,
              yoyo: true,
              repeat: 3,
              duration: 120,
            });
          }
        }
      });
    });
  }
}

export default FishingScene;
