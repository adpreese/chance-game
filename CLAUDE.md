# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chance Arcade is a Phaser 3-based web game collection featuring multiple chance-based mini-games (Plinko, Spin Wheel, Dice Roll, Fishing, Claw Game, Bingo Ball). The game allows users to configure item pools and visual shaders, then play randomized selection games with configurable behavior.

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

## Architecture

### Entry Points and Build Configuration

- **index.html** and **main.html**: Identical HTML entry points that use an import map to load Phaser from CDN. This supports both Vite dev server and static GitHub Pages hosting.
- **vite.config.js**: Configured with `base: './'` for relative paths to support GitHub Pages deployment.
- **src/main.js**: Application entry point that initializes the Phaser game, registers custom shader pipelines, and starts with ConfigScene.

### Scene Architecture

The game uses Phaser's scene system with a hub-and-spoke navigation pattern:

- **ConfigScene**: Initial scene for configuring items, game selection mode, removal behavior, and shader aesthetic
- **HubScene**: Central navigation hub with clickable game previews and quick action buttons
- **BaseGameScene**: Abstract base class that all game scenes extend from. Provides:
  - Standard layout with title, back button, result text, and item pool status
  - `pickItem()` method that retrieves items from the store
  - `setResult()` method for displaying game outcomes
  - Shader application and uniform updates
  - Matter.js physics world bounds setup

All game scenes (PlinkoScene, WheelScene, DiceScene, FishingScene, ClawScene, BingoScene) extend BaseGameScene and implement their specific game mechanics.

### State Management (src/utils/store.js)

Centralized application state using a simple state object pattern:

- **Items**: Array of user-defined strings (or fallback defaults) used for random selection
- **removeOnSelect**: Boolean controlling whether items are consumed after selection
- **nextGame**: String identifying which game scene to launch from config ('random' or specific scene key)
- **shader**: String key for the active shader aesthetic

Key behaviors:
- When `removeOnSelect` is true, items are filtered out after selection
- If items array becomes empty, it automatically resets to `originalItems` (the initially configured set)
- `getNextItem()` handles both selection and consumption in a single call

### Visual Effects (src/utils/shaders.js)

Custom WebGL post-processing pipelines that extend Phaser's SinglePipeline:

1. **NeonPipeline**: Cyan/magenta neon glow with scanline effects
2. **SolarpunkPipeline**: Warm green/yellow tones with subtle bloom
3. **MidcenturyPipeline**: Warm wood tones with vignette effect
4. **Retro16Pipeline**: Pixelation and color posterization for 16-bit aesthetic

All pipelines receive `uTime` and `uResolution` uniforms updated each frame. Shaders are applied as post-processing effects to the main camera and can be toggled without restarting scenes.

### UI Utilities (src/utils/ui.js)

Helper functions for creating consistent UI elements:

- **createTextButton()**: Interactive text with hover effects and click handlers
- **createPanel()**: Rounded rectangles with semi-transparent fills and borders

DOM-based UI (forms, dropdowns) uses Phaser's DOM element system with CSS classes defined in index.html (.ui-panel, .hud-button, etc.).

## Important Implementation Details

### Phaser Import Pattern

Always import Phaser as an ES module:
```javascript
import Phaser from 'phaser';
```

The import map in index.html resolves this to the CDN-hosted ESM build.

### Scene Navigation

Use `this.scene.start(sceneKey)` to switch between scenes. Scene keys match class names (e.g., 'HubScene', 'PlinkoScene').

### Matter.js Physics

Game scenes use Matter.js physics (configured in src/main.js with `gravity: { y: 1.1 }`). BaseGameScene sets up world bounds with:
```javascript
this.matter.world.setBounds(40, 40, width - 80, height - 80, 64, true, true, false, true);
```

### Registry for Cross-Scene Data

The Phaser registry stores the current shader setting:
```javascript
game.registry.set('shader', shaderKey);
this.registry.get('shader');
```

This allows shader preference to persist across scene transitions without passing parameters.

### Static Hosting Considerations

The project is designed for GitHub Pages deployment:
- Uses relative paths (`base: './'` in vite.config.js)
- main.html serves as the fallback entry point
- Phaser is loaded from CDN to minimize bundle size
