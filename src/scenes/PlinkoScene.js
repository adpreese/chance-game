import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';

class PlinkoScene extends BaseGameScene {
  constructor() {
    super('PlinkoScene');
  }

  create() {
    this.createBaseLayout('Plinko Drop');

    this.matter.world.setGravity(0, 1.2);

    const items = getItems();
    const shuffledItems = Phaser.Utils.Array.Shuffle([...items]);

    const pegRows = 10;
    const pegCols = 8;
    const spacingX = 60;
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
          restitution: 0.9,
          friction: 0.01,
          label: 'peg',
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
      this.createItemLabel(slotX, baseY, slotItem, {
        fontSize: '12px',
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 3,
        wordWrap: { width: slotWidth - 10 },
      });
    }

    const dropStartY = 80;
    const puck = this.matter.add.circle(this.scale.width / 2, dropStartY, 15, {
      restitution: 0.9,
      frictionAir: 0.008,
      friction: 0.01,
      density: 0.002,
      label: 'plinko-puck',
    });

    const puckVisual = this.add.circle(puck.position.x, puck.position.y, 15, 0xffd166, 1);

    const slotButtonCount = pegCols + 1;
    const gridLeftX = startX;
    const gridRightX = startX + ((pegCols - 1) * spacingX) + (spacingX / 2);
    const slotButtonSpacing = (gridRightX - gridLeftX) / (slotButtonCount - 1);
    const slotButtonStartX = gridLeftX;
    const slotButtonY = startY - 50;

    const dropPuckAt = (x) => {
      if (this.hasResult) {
        return;
      }
      this.matter.body.setStatic(puck, false);
      this.matter.body.setPosition(puck, { x: x + ((Math.random() - 0.5) * 100), y: dropStartY + ((Math.random() - 0.5) / 20) });
      const randomHorizontalVelocity = (Math.random() - 0.5) * 1.5;
      const randomAngularVelocity = (Math.random() - 0.5) * 0.1;
      //this.matter.body.setVelocity(puck, { x: randomHorizontalVelocity, y: 0 });
      //this.matter.body.setAngularVelocity(puck, randomAngularVelocity);
    };

    for (let i = 0; i < slotButtonCount; i += 1) {
      const buttonX = slotButtonStartX + i * slotButtonSpacing;
      const button = this.add.rectangle(buttonX, slotButtonY, 38, 22, 0x1f2937, 0.9);
      button.setStrokeStyle(1, 0x94a3b8, 0.6);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => dropPuckAt(buttonX));
      const buttonLabel = this.createItemLabel(buttonX, slotButtonY, `${i + 1}`, {
        fontSize: '12px',
        color: '#e2e8f0',
        stroke: '#0f172a',
        strokeThickness: 2,
      });
      buttonLabel.setShadow(0, 1, 'rgba(15, 23, 42, 0.6)', 3, true, true);
    }

    this.add
      .text(this.scale.width / 2, slotButtonY - 24, 'Choose a slot to drop from', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.matter.body.setStatic(puck, true);

    this.matter.world.on('collisionstart', (event) => {
      if (this.hasResult) {
        return;
      }

      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const slotItem = slotBodies.get(bodyA.id) ?? slotBodies.get(bodyB.id);
        const involvesPuck = bodyA === puck || bodyB === puck;

        // Check if puck hit a peg
        const peg = (bodyA.label === 'peg' && bodyB === puck) ? bodyA :
                    (bodyB.label === 'peg' && bodyA === puck) ? bodyB : null;

        if (peg && involvesPuck) {
          // If puck is moving slowly, give it a horizontal nudge to prevent balancing
          if (puck.speed < 2) {
            const nudge = (Math.random() - 0.5) * 2.5;
            this.matter.body.applyForce(puck, puck.position, { x: nudge * 0.0001, y: nudge * 0.0002 });
          }
        }

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

      if (!this.hasResult && puck.position.y > baseY - 10 && puck.speed < 1.5) {
        this.matter.body.setVelocity(puck, { x: 0, y: 0 });
        this.matter.body.setAngularVelocity(puck, 0);
        this.matter.body.setStatic(puck, true);
      }
    });
  }
}

export default PlinkoScene;
