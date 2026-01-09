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
    const faces = rawItems.length ? rawItems : ['1', '2', '3', '4', '5', '6'];
    const sideCount = faces.length;
    const slice = (Math.PI * 2) / sideCount;

    const maxFace = 140;
    const minFace = 80;
    const faceSize = Phaser.Math.Clamp(180 - sideCount * 4, minFace, maxFace);
    const radius = Math.max((faceSize / 2) / Math.sin(Math.PI / sideCount), faceSize * 0.7);
    const baseY = 140;
    const restY = this.scale.height - 160;

    const dice = this.add.container(this.scale.width / 2, baseY);

    const shadow = this.add.ellipse(0, faceSize * 0.6, faceSize * 1.1, faceSize * 0.35, 0x020617, 0.45);
    shadow.setScale(1.1, 0.9);
    dice.add(shadow);

    const topFace = this.add
      .rectangle(0, -faceSize * 0.55, faceSize * 0.7, faceSize * 0.25, 0xe2e8f0, 0.9)
      .setStrokeStyle(2, 0xf8fafc, 0.9);
    dice.add(topFace);

    const labelFontSize = Math.round(faceSize * 0.22);
    const faceObjects = faces.map((labelText) => {
      const faceRect = this.add.rectangle(0, 0, faceSize, faceSize, 0x22c55e, 1).setStrokeStyle(3, 0xf8fafc, 0.8);
      const faceLabel = this.createItemLabel(0, 0, labelText, {
        fontSize: `${labelFontSize}px`,
        color: '#0f172a',
        stroke: '#f8fafc',
        strokeThickness: 3,
        wordWrap: { width: faceSize - 16 },
      });
      const faceContainer = this.add.container(0, 0, [faceRect, faceLabel]);
      dice.add(faceContainer);
      return { faceContainer, faceRect, faceLabel };
    });

    const updateFaces = (rotation) => {
      faceObjects.forEach((face, index) => {
        const angle = rotation + index * slice;
        const depth = (Math.cos(angle) + 1) / 2;
        const x = Math.sin(angle) * radius;
        const scale = 0.55 + depth * 0.45;
        face.faceContainer.setPosition(x, depth * 6);
        face.faceContainer.setScale(scale);
        face.faceContainer.setAlpha(0.25 + depth * 0.75);
        face.faceContainer.setDepth(depth);
        face.faceLabel.setAlpha(0.55 + depth * 0.45);
      });
      topFace.setAlpha(0.65 + Math.abs(Math.cos(rotation)) * 0.2);
      shadow.setScale(1 + Math.abs(Math.sin(rotation)) * 0.1, 0.9);
    };

    const spinState = {
      rotation: Phaser.Math.FloatBetween(0, Math.PI * 2),
    };
    updateFaces(spinState.rotation);

    const landingIndex = Phaser.Math.Between(0, faces.length - 1);
    const landingRotation = -landingIndex * slice;
    const totalSpins = Phaser.Math.Between(3, 5) * Math.PI * 2;

    this.tweens.add({
      targets: spinState,
      rotation: spinState.rotation + totalSpins + landingRotation,
      duration: 2600,
      ease: 'Cubic.easeOut',
      onUpdate: () => updateFaces(spinState.rotation),
      onComplete: () => {
        const choice = faces[landingIndex];
        consumeItem(choice);
        this.setResult(choice);
        this.updateItemPoolText();
      },
    });

    this.tweens.add({
      targets: dice,
      y: restY,
      duration: 2600,
      ease: 'Bounce.easeOut',
    });

    this.add.rectangle(this.scale.width / 2, restY + faceSize * 0.6, this.scale.width - 120, 18, 0x0f172a, 0.8);
  }
}

export default DiceScene;
