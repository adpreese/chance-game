const createTextButton = (scene, x, y, label, onClick) => {
  const button = scene.add
    .text(x, y, label, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#f5f5f5',
      backgroundColor: 'rgba(255,255,255,0.15)',
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  button.on('pointerdown', () => onClick?.());
  button.on('pointerover', () => button.setStyle({ backgroundColor: 'rgba(255,255,255,0.3)' }));
  button.on('pointerout', () => button.setStyle({ backgroundColor: 'rgba(255,255,255,0.15)' }));
  return button;
};

const createPanel = (scene, x, y, width, height, color = 0x121826) => {
  const panel = scene.add.rectangle(x, y, width, height, color, 0.85);
  panel.setStrokeStyle(2, 0xffffff, 0.12);
  panel.setOrigin(0.5);
  return panel;
};

export { createPanel, createTextButton };
