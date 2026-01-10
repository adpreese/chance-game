import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import ConfigScene from './scenes/ConfigScene.js';
import HubScene from './scenes/HubScene.js';
import PlinkoScene from './scenes/PlinkoScene.js';
import WheelScene from './scenes/WheelScene.js';
import DiceScene from './scenes/DiceScene.js';
import FishingScene from './scenes/FishingScene.js';
import ClawScene from './scenes/ClawScene.js';
import BingoScene from './scenes/BingoScene.js';
import HorseRaceScene from './scenes/HorseRaceScene.js';
import SurvivalScene from './scenes/SurvivalScene.js';
import MazeRaceScene from './scenes/MazeRaceScene.js';

const config = {
  type: Phaser.WEBGL,
  parent: 'app',
  width: 960,
  height: 640,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
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
  scene: [BootScene, ConfigScene, HubScene, PlinkoScene, WheelScene, DiceScene, FishingScene, ClawScene, BingoScene, HorseRaceScene, SurvivalScene, MazeRaceScene],
};

const game = new Phaser.Game(config);

const resizeGame = () => {
  const { innerWidth, innerHeight } = window;
  const parent = document.getElementById('app');

  if (parent) {
    parent.style.width = `${innerWidth}px`;
    parent.style.height = `${innerHeight}px`;
  }

  game.scale.resize(innerWidth, innerHeight);
};

window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', resizeGame);
resizeGame();
