import Phaser from 'phaser';
import ConfigScene from './scenes/ConfigScene.js';
import HubScene from './scenes/HubScene.js';
import PlinkoScene from './scenes/PlinkoScene.js';
import WheelScene from './scenes/WheelScene.js';
import DiceScene from './scenes/DiceScene.js';
import FishingScene from './scenes/FishingScene.js';
import ClawScene from './scenes/ClawScene.js';
import BingoScene from './scenes/BingoScene.js';
import { registerPipelines } from './utils/shaders.js';
import { getState } from './utils/store.js';

const config = {
  type: Phaser.WEBGL,
  parent: 'app',
  width: 960,
  height: 640,
  backgroundColor: '#0b1020',
  dom: {
    createContainer: true,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 1.1 },
    },
  },
  scene: [ConfigScene, HubScene, PlinkoScene, WheelScene, DiceScene, FishingScene, ClawScene, BingoScene],
};

const game = new Phaser.Game(config);

// Wait for renderer to be ready before registering pipelines
game.events.once('ready', () => {
  registerPipelines(game);

  const { shader } = getState();
  game.registry.set('shader', shader);
});
