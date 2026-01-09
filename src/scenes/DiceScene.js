import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, getItems } from '../utils/store.js';

class DiceScene extends BaseGameScene {
  constructor() {
    super('DiceScene');
  }

  create() {
    this.createBaseLayout('Dice Roll');

    const rawItems = getItems();
    const faces = rawItems.length ? rawItems.slice(0, 6) : ['1', '2', '3', '4', '5', '6'];

    const boxSize = 90;
    const box = this.add.rectangle(0, 0, boxSize, boxSize, 0x22c55e, 1).setStrokeStyle(4, 0xf8fafc, 0.8);
    const label = this.add
      .text(0, 0, faces[0], {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '20px',
        color: '#0f172a',
        align: 'center',
        wordWrap: { width: 80 },
      })
      .setOrigin(0.5);

    const dice = this.add.container(this.scale.width / 2, 120, [box, label]);
    this.matter.add.gameObject(dice, { shape: { type: 'rectangle', width: boxSize, height: boxSize } });
    dice.setFrictionAir(0.005);
    dice.setBounce(1.1);

    const floor = this.matter.add.rectangle(this.scale.width / 2, this.scale.height - 80, this.scale.width - 120, 20, {
      isStatic: true,
      restitution: 0.9,
    });
    this.add.rectangle(floor.position.x, floor.position.y, this.scale.width - 120, 20, 0x0f172a, 0.8);

    this.time.addEvent({
      delay: 180,
      repeat: 15,
      callback: () => {
        const forceX = Phaser.Math.FloatBetween(-0.02, 0.02);
        const forceY = Phaser.Math.FloatBetween(-0.02, 0.01);
        dice.applyForce({ x: forceX, y: forceY });
        dice.setAngularVelocity(dice.body.angularVelocity + Phaser.Math.FloatBetween(-0.3, 0.3));
      },
    });

    this.time.delayedCall(2800, () => {
      const angle = Phaser.Math.Angle.Normalize(dice.rotation);
      const slice = (Math.PI * 2) / faces.length;
      const index = Math.floor(angle / slice) % faces.length;
      const choice = faces[index];
      label.setText(choice);
      consumeItem(choice);
      this.setResult(choice);
      this.updateItemPoolText();
    });
  }
}

export default DiceScene;
