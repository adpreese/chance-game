import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';

class PlinkoScene extends BaseGameScene {
  constructor() {
    super('PlinkoScene');
  }

  create() {
    this.createBaseLayout('Plinko Drop');

    const item = this.pickItem();

    const pegRows = 6;
    const pegCols = 8;
    const spacingX = 70;
    const spacingY = 55;
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
          render: { fillStyle: '#7ef9ff' },
        });
        this.add.circle(pegX, pegY, 12, 0x7ef9ff, 0.7).setStrokeStyle(1, 0xffffff, 0.6);
      }
    }

    const baseY = this.scale.height - 110;
    for (let i = 0; i < 5; i += 1) {
      this.add.rectangle(this.scale.width / 2 - 200 + i * 100, baseY, 90, 16, 0x1f2937, 0.9);
    }

    const puck = this.matter.add.circle(this.scale.width / 2, 80, 18, {
      restitution: 1.15,
      frictionAir: 0.01,
      density: 0.004,
    });

    const puckVisual = this.add.circle(puck.position.x, puck.position.y, 18, 0xffd166, 1);
    const puckText = this.add
      .text(puck.position.x, puck.position.y, item, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#0f172a',
        align: 'center',
        wordWrap: { width: 80 },
      })
      .setOrigin(0.5);

    this.matter.world.on('afterupdate', () => {
      puckVisual.setPosition(puck.position.x, puck.position.y);
      puckText.setPosition(puck.position.x, puck.position.y);

      if (!this.hasResult && puck.position.y > this.scale.height - 120) {
        this.hasResult = true;
        this.setResult(item);
      }
    });
  }
}

export default PlinkoScene;
