import Phaser from 'phaser';
import { createTextButton } from '../utils/ui.js';
import { getNextItem, getState } from '../utils/store.js';
import { applySelectedShader } from '../utils/shader.js';

class BaseGameScene extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.selectedItem = null;
  }

  createBaseLayout(title) {
    applySelectedShader(this);
    this.matter.world.setBounds(40, 40, this.scale.width - 80, this.scale.height - 80, 64, true, true, false, true);
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x0b1020, 1);

    this.add
      .text(this.scale.width / 2, 28, title, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '24px',
        color: '#f5f5f5',
      })
      .setOrigin(0.5, 0.5);

    createTextButton(this, 90, 30, 'Back to Hub', () => {
      this.scene.start('HubScene');
    });

    this.resultText = this.add
      .text(this.scale.width / 2, this.scale.height - 40, 'Result pending...', {
        fontFamily: '"Bangers", "Impact", "Trebuchet MS", sans-serif',
        fontSize: '26px',
        fontStyle: '700',
        color: '#ffe08a',
        stroke: '#0f172a',
        strokeThickness: 5,
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: 'rgba(255, 170, 0, 0.7)',
          blur: 10,
          fill: true,
        },
      })
      .setOrigin(0.5, 0.5);
    this.resultText.setResolution(2);

    this.itemPoolText = this.add
      .text(this.scale.width - 18, 32, '', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#c4c4c4',
        align: 'right',
      })
      .setOrigin(1, 0.5);

    this.updateItemPoolText();
  }

  createItemLabel(x, y, text, styleOverrides = {}) {
    const label = this.add.text(x, y, text, {
      fontFamily: '"Rubik", "Inter", system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: '600',
      color: '#f8fafc',
      align: 'center',
      wordWrap: { width: 80 },
      stroke: '#0f172a',
      strokeThickness: 3,
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
      ...styleOverrides,
    });
    label.setOrigin(0.5);
    label.setShadow(0, 2, 'rgba(15, 23, 42, 0.7)', 4, true, true);
    label.setResolution(2);
    return label;
  }

  updateItemPoolText() {
    const { items, removeOnSelect } = getState();
    this.itemPoolText.setText(`Items: ${items.length} | Remove: ${removeOnSelect ? 'On' : 'Off'}`);
  }

  pickItem() {
    this.selectedItem = getNextItem();
    this.updateItemPoolText();
    return this.selectedItem;
  }

  setResult(text) {
    this.resultText.setText(`Result: ${text}`);
  }
}

export default BaseGameScene;
