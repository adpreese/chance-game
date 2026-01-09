import Phaser from 'phaser';
import { createTextButton } from '../utils/ui.js';
import { getNextItem, getState } from '../utils/store.js';

class BaseGameScene extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.selectedItem = null;
  }

  createBaseLayout(title) {
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
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '18px',
        color: '#ffd36e',
      })
      .setOrigin(0.5, 0.5);

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
