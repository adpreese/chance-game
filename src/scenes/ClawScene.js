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
    this.matter.add.rectangle(platform.getCenter().x, platform.getCenter().y, platform.width, platform.height, {
      isStatic: true,
      restitution: 0.2,
      label: 'claw-platform',
    });

    const items = Phaser.Utils.Array.Shuffle(getItems()).slice(0, 6);
    const prizes = items.map((item, index) => {
      const x = this.scale.width / 2 - 180 + index * 60;
      const y = platform.getCenter().y - 26;
      const body = this.matter.add.circle(x, y, 18, {
        restitution: 0.6,
        friction: 0.4,
        frictionAir: 0.02,
        label: `prize-${item}`,
      });
      const ball = this.add.circle(x, y, 18, 0x38bdf8, 0.9);
      const text = this.createItemLabel(x, y, item, {
        fontSize: '11px',
        color: '#0f172a',
        stroke: '#f8fafc',
        strokeThickness: 2,
        wordWrap: { width: 60 },
      });
      return { body, ball, text, item };
    });

    const anchor = { x: this.scale.width / 2, y: 90 };
    const clawBody = this.matter.add.circle(anchor.x, anchor.y + 60, 16, {
      isSensor: true,
      label: 'claw',
    });
    const clawVisual = this.add.circle(clawBody.position.x, clawBody.position.y, 16, 0xfacc15, 1);
    const tether = this.matter.add.worldConstraint(clawBody, 60, 0.05, {
      pointA: { x: anchor.x, y: anchor.y },
    });

    const idleTween = this.tweens.add({
      targets: anchor,
      x: { from: this.scale.width / 2 - 160, to: this.scale.width / 2 + 160 },
      yoyo: true,
      duration: 2200,
      repeat: -1,
      onUpdate: () => {
        tether.pointA = { x: anchor.x, y: anchor.y };
      },
    });

    const instructionText = this.add
      .text(this.scale.width / 2, 120, 'Tap/click to drop the claw', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5, 0.5);

    const dropLength = Math.max(160, platform.getCenter().y - anchor.y - 40);
    const liftLength = 60;
    let activeConstraint = null;

    const liftClaw = (prize) => {
      this.tweens.add({
        targets: tether,
        length: liftLength,
        duration: 500,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: anchor,
        x: this.scale.width / 2,
        duration: 500,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          tether.pointA = { x: anchor.x, y: anchor.y };
        },
        onComplete: () => {
          if (this.hasResult) {
            return;
          }
          this.hasResult = true;
          consumeItem(prize.item);
          this.setResult(prize.item);
          this.updateItemPoolText();
        },
      });
    };

    const dropClaw = () => {
      if (this.hasResult || this.isDropping) {
        return;
      }
      this.isDropping = true;
      instructionText.setVisible(false);
      idleTween.stop();
      const targetPrize = Phaser.Utils.Array.GetRandom(prizes);
      this.tweens.add({
        targets: anchor,
        x: targetPrize.body.position.x,
        duration: 450,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          tether.pointA = { x: anchor.x, y: anchor.y };
        },
        onComplete: () => {
          this.tweens.add({
            targets: tether,
            length: dropLength,
            duration: 520,
            ease: 'Sine.easeIn',
          });
        },
      });
    };

    this.input.on('pointerdown', dropClaw);
    this.time.delayedCall(1500, dropClaw);

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
          if (prize && this.isDropping && !activeConstraint) {
            clawBody.isSensor = false;
            activeConstraint = this.matter.add.constraint(clawBody, prize.body, 0, 0.9);
            liftClaw(prize);
          }
        }
      });
    });
  }
}

export default ClawScene;
