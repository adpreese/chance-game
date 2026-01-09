import Phaser from 'phaser';
import { applyShaderToScene, shaderOptions, updateShaderUniforms } from '../utils/shaders.js';
import { getState, setItemsFromText, setNextGame, setRemoveOnSelect, setShader } from '../utils/store.js';

class ConfigScene extends Phaser.Scene {
  constructor() {
    super('ConfigScene');
  }

  create() {
    const { items, removeOnSelect, nextGame, shader } = getState();

    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x070b18, 1);
    this.add
      .text(this.scale.width / 2, 60, 'Chance Arcade Config', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '28px',
        color: '#f5f5f5',
      })
      .setOrigin(0.5, 0.5);

    const panel = this.add.dom(this.scale.width / 2, this.scale.height / 2);
    panel.createFromHTML(`
      <div class="ui-panel" style="width: 420px;">
        <label>Item list (comma or new-line separated)</label>
        <textarea rows="6" id="itemsInput">${items.join('\n')}</textarea>
        <label>Remove items after selection?</label>
        <select id="removeSelect">
          <option value="false">Keep items</option>
          <option value="true">Remove items</option>
        </select>
        <label>Next game preference</label>
        <select id="nextGameSelect">
          <option value="random">Random</option>
          <option value="PlinkoScene">Plinko</option>
          <option value="WheelScene">Spin Wheel</option>
          <option value="DiceScene">Dice Roll</option>
          <option value="FishingScene">Fishing</option>
          <option value="ClawScene">Claw</option>
          <option value="BingoScene">Bingo Ball</option>
        </select>
        <label>Shader aesthetic</label>
        <select id="shaderSelect">
          ${shaderOptions
            .map((option) => `<option value="${option.value}">${option.label}</option>`)
            .join('')}
        </select>
        <div class="row" style="margin-top: 12px;">
          <button id="saveBtn">Save</button>
          <button id="hubBtn">Go to Hub</button>
        </div>
      </div>
    `);

    panel.setDepth(10);

    const itemsInput = panel.getChildByID('itemsInput');
    const removeSelect = panel.getChildByID('removeSelect');
    const nextGameSelect = panel.getChildByID('nextGameSelect');
    const shaderSelect = panel.getChildByID('shaderSelect');
    const saveBtn = panel.getChildByID('saveBtn');
    const hubBtn = panel.getChildByID('hubBtn');

    if (removeSelect) {
      removeSelect.value = String(removeOnSelect);
    }
    if (nextGameSelect) {
      nextGameSelect.value = nextGame;
    }
    if (shaderSelect) {
      shaderSelect.value = shader;
    }

    const saveConfig = () => {
      setItemsFromText(itemsInput?.value ?? '');
      setRemoveOnSelect(removeSelect?.value === 'true');
      setNextGame(nextGameSelect?.value ?? 'random');
      setShader(shaderSelect?.value ?? 'neon');
      this.registry.set('shader', shaderSelect?.value ?? 'neon');
      applyShaderToScene(this, this.registry.get('shader'));
    };

    saveBtn?.addEventListener('click', () => {
      saveConfig();
    });

    hubBtn?.addEventListener('click', () => {
      saveConfig();
      this.scene.start('HubScene');
    });

    applyShaderToScene(this, this.registry.get('shader'));
  }

  update(time) {
    updateShaderUniforms(this, time);
  }
}

export default ConfigScene;
