import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';

class PlinkoScene extends BaseGameScene {
  constructor() {
    super('PlinkoScene');
  }

  create() {
    this.createBaseLayout('Plinko Drop');

    this.matter.world.setGravity(0, 0.6);

    const items = getItems();
    const shuffledItems = Phaser.Utils.Array.Shuffle([...items]);

    const pegRows = 10;
    const pegCols = 8;
    const spacingX = 70;
    const spacingY = 45;
    const startX = this.scale.width / 2 - ((pegCols - 1) * spacingX) / 2;
    const startY = 120;

    for (let row = 0; row < pegRows; row += 1) {
      for (let col = 0; col < pegCols; col += 1) {
        const offset = row % 2 === 0 ? 0 : spacingX / 2;
        const pegX = startX + col * spacingX + offset;
        const pegY = startY + row * spacingY;
        this.matter.add.circle(pegX, pegY, 12, {
          isStatic: true,
          restitution: 0.4,
          render: { fillStyle: '#7ef9ff' },
        });
        this.add.circle(pegX, pegY, 12, 0x7ef9ff, 0.7).setStrokeStyle(1, 0xffffff, 0.6);
      }
    }

    const baseY = this.scale.height - 120;
    const slotGap = 12;
    const slotCount = Math.max(shuffledItems.length, 1);
    const availableWidth = this.scale.width - 160;
    const slotWidth = (availableWidth - slotGap * (slotCount - 1)) / slotCount;
    const slotStartX = (this.scale.width - availableWidth) / 2 + slotWidth / 2;
    const slotBodies = new Map();

    for (let i = 0; i < slotCount; i += 1) {
      const slotX = slotStartX + i * (slotWidth + slotGap);
      const slotItem = shuffledItems[i % shuffledItems.length];
      const slotBody = this.matter.add.rectangle(slotX, baseY, slotWidth, 22, {
        isStatic: true,
        isSensor: true,
        label: `slot-${i}`,
      });
      slotBodies.set(slotBody.id, slotItem);
      this.add.rectangle(slotX, baseY, slotWidth, 22, 0x1f2937, 0.9);
      this.add
        .text(slotX, baseY, slotItem, {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '12px',
          color: '#e2e8f0',
          align: 'center',
          wordWrap: { width: slotWidth - 10 },
        })
        .setOrigin(0.5);
    }

    const puck = this.matter.add.circle(this.scale.width / 2, 80, 18, {
      restitution: 0.2,
      frictionAir: 0.05,
      friction: 0.1,
      density: 0.004,
    });

    const puckVisual = this.add.circle(puck.position.x, puck.position.y, 18, 0xffd166, 1);

    this.matter.world.on('collisionstart', (event) => {
      if (this.hasResult) {
        return;
      }

      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const slotItem = slotBodies.get(bodyA.id) ?? slotBodies.get(bodyB.id);
        const involvesPuck = bodyA === puck || bodyB === puck;

        if (slotItem && involvesPuck && !this.hasResult) {
          this.hasResult = true;
          const chosen = consumeItem(slotItem);
          this.setResult(chosen);
          this.updateItemPoolText();
          this.matter.body.setVelocity(puck, { x: 0, y: 0 });
          this.matter.body.setAngularVelocity(puck, 0);
          this.matter.body.setStatic(puck, true);
        }
      });
    });

    this.matter.world.on('afterupdate', () => {
      puckVisual.setPosition(puck.position.x, puck.position.y);

      if (!this.hasResult && puck.position.y > baseY - 10 && puck.speed < 0.2) {
        this.matter.body.setVelocity(puck, { x: 0, y: 0 });
        this.matter.body.setAngularVelocity(puck, 0);
        this.matter.body.setStatic(puck, true);
      }
    });
  }
}

export default PlinkoScene;
