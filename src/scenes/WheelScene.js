import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';

const createWheelTexture = (scene, key, items) => {
  const size = 320;
  const radius = size / 2;
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  const sliceAngle = (Math.PI * 2) / items.length;

  items.forEach((item, index) => {
    const startAngle = sliceAngle * index;
    const endAngle = startAngle + sliceAngle;
    const color = Phaser.Display.Color.HSLToColor(index / items.length, 0.7, 0.55).color;

    graphics.fillStyle(color, 1);
    graphics.slice(radius, radius, radius, startAngle, endAngle, false);
    graphics.fillPath();
  });

  graphics.lineStyle(4, 0xffffff, 0.6).strokeCircle(radius, radius, radius - 2);
  graphics.generateTexture(key, size, size);
  graphics.destroy();
};

class WheelScene extends BaseGameScene {
  constructor() {
    super('WheelScene');
  }

  create() {
    this.createBaseLayout('Spin the Wheel');

    const rawItems = getItems();
    const items = rawItems.length >= 2 ? rawItems.slice(0, Math.min(rawItems.length, 10)) : ['Yes', 'No'];

    createWheelTexture(this, 'wheelTexture', items);

    const wheel = this.add.sprite(this.scale.width / 2, this.scale.height / 2 + 30, 'wheelTexture');
    this.matter.add.gameObject(wheel, { shape: { type: 'circle', radius: 160 } });
    wheel.setOrigin(0.5);
    wheel.setScale(1);

    this.add.triangle(this.scale.width / 2, this.scale.height / 2 - 180, 0, 0, 30, 0, 15, 30, 0xffd166, 1);

    items.forEach((item, index) => {
      const angle = (Math.PI * 2 * index) / items.length - Math.PI / 2;
      const radius = 100;
      const label = this.createItemLabel(
        wheel.x + Math.cos(angle) * radius,
        wheel.y + Math.sin(angle) * radius,
        item,
        {
          fontSize: '12px',
          color: '#f8fafc',
          stroke: '#0f172a',
          strokeThickness: 3,
          wordWrap: { width: 80 },
        },
      );
      label.setRotation(angle + Math.PI / 2);
    });

    wheel.setAngularVelocity(6);
    wheel.setFrictionAir(0.02);

    const jitterEvent = this.time.addEvent({
      delay: 260,
      callback: () => {
        const impulse = Phaser.Math.FloatBetween(-0.05, 0.05);
        wheel.setAngularVelocity(wheel.body.angularVelocity + impulse);
      },
      loop: true,
    });

    this.time.delayedCall(4200, () => {
      jitterEvent.remove();
      const angle = Phaser.Math.Angle.Normalize(wheel.rotation + Math.PI / 2);
      const slice = (Math.PI * 2) / items.length;
      const index = Math.floor(angle / slice) % items.length;
      const choice = items[index];
      consumeItem(choice);
      this.setResult(choice);
      this.updateItemPoolText();
    });
  }
}

export default WheelScene;
