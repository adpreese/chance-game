import Phaser from 'phaser';
import { CORE_SFX, registerSfx } from '../utils/audio.js';

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    Object.entries(CORE_SFX).forEach(([key, { url }]) => {
      this.load.audio(key, url);
    });
  }

  create() {
    registerSfx(this);
    this.scene.start('ConfigScene');
  }
}

export default BootScene;
