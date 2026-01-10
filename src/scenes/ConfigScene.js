import Phaser from 'phaser';
import { getState, setItemsFromText, setNextGame, setRemoveOnSelect, setShader } from '../utils/store.js';
import { createTextButton, createPanel } from '../utils/ui.js';
import { applySelectedShader } from '../utils/shader.js';
import { playSfx, registerSfx } from '../utils/audio.js';

class ConfigScene extends Phaser.Scene {
  constructor() {
    super('ConfigScene');
    this.currentRemoveOnSelect = false;
    this.currentNextGame = 'random';
    this.currentShader = 'none';
  }

  create() {
    registerSfx(this);
    const { items, removeOnSelect, nextGame, shader } = getState();

    // Initialize current values
    this.currentRemoveOnSelect = removeOnSelect;
    this.currentNextGame = nextGame;
    this.currentShader = shader;

    applySelectedShader(this);

    // Background
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x070b18, 1);

    // Title
    this.add
      .text(this.scale.width / 2, 60, 'Chance Arcade Config', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '28px',
        color: '#f5f5f5',
      })
      .setOrigin(0.5, 0.5);

    // Panel background
    const panelBg = createPanel(this, this.scale.width / 2, this.scale.height / 2 + 20, 480, 480);
    panelBg.setStrokeStyle(2, 0xffffff, 0.1);

    let yPos = 140;

    // Item list textarea (using DOM for text input)
    this.add
      .text(this.scale.width / 2, yPos, 'Item list (comma or new-line separated)', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        color: '#d1d5db',
      })
      .setOrigin(0.5, 0.5);

    yPos += 30;

    const textareaPanel = this.add.dom(this.scale.width / 2, yPos + 55);
    textareaPanel.createFromHTML(`
      <textarea rows="6" id="itemsInput" style="
        width: 400px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        padding: 8px 10px;
        font-size: 0.9rem;
        font-family: 'Inter', system-ui, sans-serif;
        resize: vertical;
      ">${items.join('\n')}</textarea>
    `);
    textareaPanel.setDepth(100);

    yPos += 140;

    // Remove items after selection (cycle button)
    this.add
      .text(this.scale.width / 2, yPos, 'Remove items after selection?', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        color: '#d1d5db',
      })
      .setOrigin(0.5, 0.5);

    yPos += 30;

    const removeOptions = [
      { label: 'Keep items', value: false },
      { label: 'Remove items', value: true }
    ];
    let removeIndex = removeOptions.findIndex(opt => opt.value === removeOnSelect);
    if (removeIndex === -1) removeIndex = 0;

    const removeButton = createTextButton(
      this,
      this.scale.width / 2,
      yPos,
      removeOptions[removeIndex].label,
      () => {
        removeIndex = (removeIndex + 1) % removeOptions.length;
        this.currentRemoveOnSelect = removeOptions[removeIndex].value;
        removeButton.setText(removeOptions[removeIndex].label);
        playSfx(this, 'uiModeChange');
      }
    );

    yPos += 40;

    // Next game preference (cycle button)
    this.add
      .text(this.scale.width / 2, yPos, 'Next game preference', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        color: '#d1d5db',
      })
      .setOrigin(0.5, 0.5);

    yPos += 30;

    const gameOptions = [
      { label: 'Random', value: 'random' },
      { label: 'Plinko', value: 'PlinkoScene' },
      { label: 'Spin Wheel', value: 'WheelScene' },
      { label: 'Dice Roll', value: 'DiceScene' },
      { label: 'Fishing', value: 'FishingScene' },
      { label: 'Claw', value: 'ClawScene' },
      { label: 'Bingo Ball', value: 'BingoScene' },
      { label: 'Horse Dash', value: 'HorseRaceScene' },
      { label: 'Survival', value: 'SurvivalScene' },
      { label: 'Maze Race', value: 'MazeRaceScene' }
    ];
    let gameIndex = gameOptions.findIndex(opt => opt.value === nextGame);
    if (gameIndex === -1) gameIndex = 0;

    const gameButton = createTextButton(
      this,
      this.scale.width / 2,
      yPos,
      gameOptions[gameIndex].label,
      () => {
        gameIndex = (gameIndex + 1) % gameOptions.length;
        this.currentNextGame = gameOptions[gameIndex].value;
        gameButton.setText(gameOptions[gameIndex].label);
        playSfx(this, 'uiModeChange');
      }
    );

    yPos += 50;

    // Shader preference (cycle button)
    this.add
      .text(this.scale.width / 2, yPos, 'Visual shader', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        color: '#d1d5db',
      })
      .setOrigin(0.5, 0.5);

    yPos += 30;

    const shaderOptions = [
      { label: 'None', value: 'none' },
      { label: 'Neon', value: 'neon' },
      { label: 'Solarpunk', value: 'solarpunk' },
      { label: 'Tree of Life', value: 'tree-of-life' },
      { label: 'Comic Halftone', value: 'halftone' },
      { label: 'Film Noir', value: 'film-noir' },
      { label: 'Rain', value: 'rain' },
    ];
    let shaderIndex = shaderOptions.findIndex(opt => opt.value === shader);
    if (shaderIndex === -1) shaderIndex = 0;

    const shaderButton = createTextButton(
      this,
      this.scale.width / 2,
      yPos,
      shaderOptions[shaderIndex].label,
      () => {
        shaderIndex = (shaderIndex + 1) % shaderOptions.length;
        this.currentShader = shaderOptions[shaderIndex].value;
        shaderButton.setText(shaderOptions[shaderIndex].label);
        playSfx(this, 'uiModeChange');
      }
    );

    yPos += 50;

    // Save and Hub buttons
    const saveConfig = () => {
      const itemsInput = textareaPanel.getChildByID('itemsInput');
      setItemsFromText(itemsInput?.value ?? '');
      setRemoveOnSelect(this.currentRemoveOnSelect);
      setNextGame(this.currentNextGame);
      setShader(this.currentShader);
      applySelectedShader(this);
    };

    createTextButton(this, this.scale.width / 2 - 100, yPos, 'Save', () => {
      saveConfig();
      playSfx(this, 'uiSave');
    });

    createTextButton(this, this.scale.width / 2 + 100, yPos, 'Go to Hub', () => {
      saveConfig();
      playSfx(this, 'uiNavigate');
      this.scene.start('HubScene');
    });
  }
}

export default ConfigScene;
