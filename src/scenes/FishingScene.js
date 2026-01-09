import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';

class FishingScene extends BaseGameScene {
  constructor() {
    super('FishingScene');
  }

  create() {
    this.createBaseLayout('Fishing Pond');

    // Disable gravity for underwater physics
    this.matter.world.setGravity(0, 0);

    const pond = this.add.rectangle(this.scale.width / 2, this.scale.height / 2 + 60, 520, 260, 0x1e40af, 0.6);
    pond.setStrokeStyle(2, 0x93c5fd, 0.8);

    const anchor = { x: this.scale.width / 2, y: 110 };
    const hookBody = this.matter.add.circle(anchor.x, anchor.y + 120, 12, {
      frictionAir: 0.02,
      restitution: 0.8,
      label: 'hook',
    });
    const hookVisual = this.add.circle(hookBody.position.x, hookBody.position.y, 10, 0xfbbf24, 1);
    const hookTip = this.add.triangle(hookBody.position.x, hookBody.position.y + 8, 0, 0, 8, 6, 0, 12, 0xfef3c7, 1);
    const constraint = this.matter.add.worldConstraint(hookBody, 120, 0.02, { pointA: { x: anchor.x, y: anchor.y } });
    const line = this.add.line(0, 0, anchor.x, anchor.y, hookBody.position.x, hookBody.position.y, 0xffffff, 0.6).setOrigin(0, 0);

    // Animate the anchor position left and right
    this.tweens.add({
      targets: anchor,
      x: { from: this.scale.width / 2 - 80, to: this.scale.width / 2 + 80 },
      duration: 2500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        constraint.pointA = { x: anchor.x, y: anchor.y };
      },
    });

    const pondBounds = {
      left: pond.getCenter().x - pond.width / 2 + 30,
      right: pond.getCenter().x + pond.width / 2 - 30,
      top: pond.getCenter().y - pond.height / 2 + 30,
      bottom: pond.getCenter().y + pond.height / 2 - 30,
    };

    // Create rigid walls around the pond
    const wallThickness = 20;
    const pondCenterX = pond.getCenter().x;
    const pondCenterY = pond.getCenter().y;

    // Top wall
    this.matter.add.rectangle(pondCenterX, pondBounds.top - wallThickness / 2, pond.width - 60, wallThickness, {
      isStatic: true,
      restitution: 0.8,
      label: 'pond-wall',
    });

    // Bottom wall
    this.matter.add.rectangle(pondCenterX, pondBounds.bottom + wallThickness / 2, pond.width - 60, wallThickness, {
      isStatic: true,
      restitution: 0.8,
      label: 'pond-wall',
    });

    // Left wall
    this.matter.add.rectangle(pondBounds.left - wallThickness / 2, pondCenterY, wallThickness, pond.height - 60, {
      isStatic: true,
      restitution: 0.8,
      label: 'pond-wall',
    });

    // Right wall
    this.matter.add.rectangle(pondBounds.right + wallThickness / 2, pondCenterY, wallThickness, pond.height - 60, {
      isStatic: true,
      restitution: 0.8,
      label: 'pond-wall',
    });

    const fishItems = getItems();
    const fishBodies = fishItems.map((item) => {
      const x = Phaser.Math.FloatBetween(pondBounds.left, pondBounds.right);
      const y = Phaser.Math.FloatBetween(pondBounds.top, pondBounds.bottom);
      const body = this.matter.add.circle(x, y, 10, {
        restitution: 1.05,
        frictionAir: 0.015,
        label: `fish-${item}`,
      });
      const fishBody = this.add.ellipse(0, 0, 22, 12, 0xf472b6, 0.9);
      const fishTail = this.add.triangle(-12, 0, 0, 0, -8, 6, -8, -6, 0xf9a8d4, 0.9);
      const fishText = this.createItemLabel(0, -16, item, {
        fontSize: '11px',
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 2,
        wordWrap: { width: 80 },
      });
      const container = this.add.container(x, y, [fishTail, fishBody, fishText]);
      return { body, container, item, caught: false };
    });

    const fishSwimEvent = this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        fishBodies.forEach(({ body, caught }) => {
          if (caught) {
            return;
          }
          const forceX = Phaser.Math.FloatBetween(-0.002, 0.002);
          const forceY = Phaser.Math.FloatBetween(-0.0015, 0.0015);
          this.matter.body.applyForce(body, body.position, { x: forceX, y: forceY });
        });
      },
    });

    const hookWiggleEvent = this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        const forceX = Phaser.Math.FloatBetween(-0.006, 0.006);
        const forceY = 0.002; // Constant downward force
        this.matter.body.applyForce(hookBody, hookBody.position, { x: forceX, y: forceY });
      },
    });

    this.matter.world.on('afterupdate', () => {
      hookVisual.setPosition(hookBody.position.x, hookBody.position.y);
      hookTip.setPosition(hookBody.position.x, hookBody.position.y + 8);
      line.setTo(anchor.x, anchor.y, hookBody.position.x, hookBody.position.y);
      fishBodies.forEach(({ body, container, caught }) => {
        if (caught) {
          return;
        }
        container.setPosition(body.position.x, body.position.y);
        container.rotation = Math.sin(body.velocity.x * 6) * 0.2;
      });
    });

    this.time.delayedCall(3000, () => {
      if (this.hasResult) {
        return;
      }
      fishSwimEvent.remove();
      hookWiggleEvent.remove();
      const targetFishEntry = fishBodies.reduce((closest, candidate) => {
        if (candidate.caught) {
          return closest;
        }
        const distance = Phaser.Math.Distance.Between(
          candidate.body.position.x,
          candidate.body.position.y,
          hookBody.position.x,
          hookBody.position.y,
        );
        if (!closest || distance < closest.distance) {
          return { entry: candidate, distance };
        }
        return closest;
      }, null);

      if (!targetFishEntry) {
        return;
      }

      const targetFish = targetFishEntry.entry;
      targetFish.caught = true;
      this.matter.world.remove(targetFish.body);
      this.tweens.add({
        targets: targetFish.container,
        x: hookBody.position.x,
        y: hookBody.position.y + 6,
        scale: 1.3,
        duration: 600,
        ease: 'Back.easeIn',
        onComplete: () => {
          if (this.hasResult) {
            return;
          }
          this.hasResult = true;
          consumeItem(targetFish.item);
          this.setResult(targetFish.item);
          this.updateItemPoolText();
        },
      });
    });
  }
}

export default FishingScene;
