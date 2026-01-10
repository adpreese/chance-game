import Phaser from 'phaser';
import BaseGameScene from './BaseGameScene.js';
import { consumeItem, fallbackItems, getItems } from '../utils/store.js';

const creatureColors = [0xf97316, 0x38bdf8, 0xf472b6, 0x34d399, 0xfacc15];

const buildCreature = (scene, color) => {
  const container = scene.add.container(0, 0);
  const body = scene.add.circle(0, 0, 10, color, 1);
  const head = scene.add.circle(10, -6, 5, 0xffffff, 0.8);
  const tail = scene.add.triangle(-8, 8, 0, 0, 8, 4, 8, -4, 0x0f172a, 0.4);
  const detail = scene.add.circle(-6, -6, 3, 0x0f172a, 0.3);
  container.add([tail, body, head, detail]);
  return container;
};

const createGrid = (cols, rows) => {
  const grid = [];
  for (let y = 0; y < rows; y += 1) {
    const row = [];
    for (let x = 0; x < cols; x += 1) {
      row.push({
        x,
        y,
        visited: false,
        walls: {
          top: true,
          right: true,
          bottom: true,
          left: true,
        },
      });
    }
    grid.push(row);
  }
  return grid;
};

const carveMaze = (grid) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const stack = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  const directions = [
    { dx: 0, dy: -1, wall: 'top', opposite: 'bottom' },
    { dx: 1, dy: 0, wall: 'right', opposite: 'left' },
    { dx: 0, dy: 1, wall: 'bottom', opposite: 'top' },
    { dx: -1, dy: 0, wall: 'left', opposite: 'right' },
  ];

  while (stack.length) {
    const current = stack[stack.length - 1];
    const neighbors = directions
      .map((dir) => ({
        dir,
        x: current.x + dir.dx,
        y: current.y + dir.dy,
      }))
      .filter(({ x, y }) => y >= 0 && y < rows && x >= 0 && x < cols && !grid[y][x].visited);

    if (!neighbors.length) {
      stack.pop();
      continue;
    }

    const next = Phaser.Utils.Array.GetRandom(neighbors);
    const nextCell = grid[next.y][next.x];
    current.walls[next.dir.wall] = false;
    nextCell.walls[next.dir.opposite] = false;
    nextCell.visited = true;
    stack.push(nextCell);
  }

  const extraOpenChance = 0.12;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cell = grid[y][x];
      if (x < cols - 1 && cell.walls.right && Phaser.Math.FloatBetween(0, 1) < extraOpenChance) {
        cell.walls.right = false;
        grid[y][x + 1].walls.left = false;
      }
      if (y < rows - 1 && cell.walls.bottom && Phaser.Math.FloatBetween(0, 1) < extraOpenChance) {
        cell.walls.bottom = false;
        grid[y + 1][x].walls.top = false;
      }
    }
  }
};

const getOpenNeighbors = (grid, cell) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const cellData = grid[cell.y][cell.x];
  const neighbors = [];
  if (!cellData.walls.top && cell.y > 0) {
    neighbors.push({ x: cell.x, y: cell.y - 1 });
  }
  if (!cellData.walls.right && cell.x < cols - 1) {
    neighbors.push({ x: cell.x + 1, y: cell.y });
  }
  if (!cellData.walls.bottom && cell.y < rows - 1) {
    neighbors.push({ x: cell.x, y: cell.y + 1 });
  }
  if (!cellData.walls.left && cell.x > 0) {
    neighbors.push({ x: cell.x - 1, y: cell.y });
  }
  return neighbors;
};

const countDistinctPaths = (grid, start, goal, limit = 3, maxDepth = 100) => {
  let paths = 0;
  const visited = new Set();
  let operations = 0;
  const maxOperations = 1000;

  const walk = (cell, depth = 0) => {
    operations += 1;
    if (operations > maxOperations || paths >= limit || depth > maxDepth) {
      return;
    }
    if (cell.x === goal.x && cell.y === goal.y) {
      paths += 1;
      return;
    }
    const key = `${cell.x},${cell.y}`;
    visited.add(key);
    const neighbors = getOpenNeighbors(grid, cell);
    neighbors.forEach((neighbor) => {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(neighborKey)) {
        walk(neighbor, depth + 1);
      }
    });
    visited.delete(key);
  };

  walk(start);
  return paths;
};

const ensureMultiplePaths = (grid, minPaths = 3) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const start = { x: 0, y: 0 };
  const goal = { x: cols - 1, y: rows - 1 };
  const directions = [
    { dx: 0, dy: -1, wall: 'top', opposite: 'bottom' },
    { dx: 1, dy: 0, wall: 'right', opposite: 'left' },
    { dx: 0, dy: 1, wall: 'bottom', opposite: 'top' },
    { dx: -1, dy: 0, wall: 'left', opposite: 'right' },
  ];
  const maxAttempts = Math.min(rows * cols * 2, 50);
  let attempts = 0;
  let pathCheckAttempts = 0;
  const maxPathChecks = 5;

  while (attempts < maxAttempts) {
    pathCheckAttempts += 1;
    if (pathCheckAttempts > maxPathChecks) {
      break;
    }

    const pathCount = countDistinctPaths(grid, start, goal, minPaths);
    if (pathCount >= minPaths) {
      break;
    }

    pathCheckAttempts = 0;
    for (let i = 0; i < 10 && attempts < maxAttempts; i += 1) {
      attempts += 1;
      const cell = grid[Phaser.Math.Between(0, rows - 1)][Phaser.Math.Between(0, cols - 1)];
      const options = directions.filter((dir) => {
        const nextX = cell.x + dir.dx;
        const nextY = cell.y + dir.dy;
        if (nextX < 0 || nextX >= cols || nextY < 0 || nextY >= rows) {
          return false;
        }
        return cell.walls[dir.wall];
      });
      if (!options.length) {
        continue;
      }
      const pick = Phaser.Utils.Array.GetRandom(options);
      cell.walls[pick.wall] = false;
      grid[cell.y + pick.dy][cell.x + pick.dx].walls[pick.opposite] = false;
    }
  }
};

class MazeRaceScene extends BaseGameScene {
  constructor() {
    super('MazeRaceScene');
    this.maze = [];
    this.creatures = [];
    this.goal = { x: 0, y: 0 };
    this.cellSize = 40;
    this.origin = { x: 0, y: 0 };
    this.raceOver = false;
    this.moveEvents = [];
    this.winnerName = '';
  }

  create() {
    this.createBaseLayout('Maze Race Rally!');
    this.resultText.setText('Race in progress...');

    const mazeArea = {
      x: 90,
      y: 90,
      width: this.scale.width - 180,
      height: this.scale.height - 210,
    };
    const maxCellSize = 40;
    let cols = Math.floor(mazeArea.width / maxCellSize);
    let rows = Math.floor(mazeArea.height / maxCellSize);
    cols = Math.max(7, cols);
    rows = Math.max(6, rows);
    this.cellSize = Math.floor(Math.min(mazeArea.width / cols, mazeArea.height / rows));
    const totalWidth = cols * this.cellSize;
    const totalHeight = rows * this.cellSize;
    this.origin = {
      x: mazeArea.x + (mazeArea.width - totalWidth) / 2,
      y: mazeArea.y + (mazeArea.height - totalHeight) / 2,
    };

    this.maze = createGrid(cols, rows);
    carveMaze(this.maze);
    ensureMultiplePaths(this.maze, 3);
    this.goal = { x: cols - 1, y: rows - 1 };

    this.drawMaze(totalWidth, totalHeight);
    this.spawnCreatures();
    this.createLegend();
  }

  drawMaze(totalWidth, totalHeight) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x111827, 0.6).fillRoundedRect(this.origin.x - 16, this.origin.y - 16, totalWidth + 32, totalHeight + 32, 18);
    graphics.lineStyle(2, 0xffffff, 0.08).strokeRoundedRect(this.origin.x - 16, this.origin.y - 16, totalWidth + 32, totalHeight + 32, 18);

    graphics.lineStyle(3, 0xffd166, 0.85);
    graphics.lineBetween(this.origin.x, this.origin.y + 4, this.origin.x + this.cellSize, this.origin.y + 4);
    this.add
      .text(this.origin.x + 8, this.origin.y - 14, 'Start', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#f8fafc',
      })
      .setOrigin(0, 0.5);

    const finishX = this.origin.x + totalWidth - this.cellSize;
    const finishY = this.origin.y + totalHeight - 4;
    graphics.lineStyle(3, 0x22d3ee, 0.9);
    graphics.lineBetween(finishX, finishY, finishX + this.cellSize, finishY);
    this.add
      .text(finishX + this.cellSize - 6, finishY + 12, 'Exit', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#f8fafc',
      })
      .setOrigin(1, 0.5);

    graphics.lineStyle(2, 0xe2e8f0, 0.45);

    for (let y = 0; y < this.maze.length; y += 1) {
      for (let x = 0; x < this.maze[y].length; x += 1) {
        const cell = this.maze[y][x];
        const cellX = this.origin.x + x * this.cellSize;
        const cellY = this.origin.y + y * this.cellSize;

        if (cell.walls.top) {
          graphics.lineBetween(cellX, cellY, cellX + this.cellSize, cellY);
        }
        if (cell.walls.right) {
          graphics.lineBetween(cellX + this.cellSize, cellY, cellX + this.cellSize, cellY + this.cellSize);
        }
        if (cell.walls.bottom) {
          graphics.lineBetween(cellX, cellY + this.cellSize, cellX + this.cellSize, cellY + this.cellSize);
        }
        if (cell.walls.left) {
          graphics.lineBetween(cellX, cellY, cellX, cellY + this.cellSize);
        }
      }
    }
  }

  spawnCreatures() {
    const items = getItems();
    const creatureNames = (items.length ? items : fallbackItems).slice(0, 5);
    const startPos = { x: 0, y: 0 };
    const baseX = this.origin.x + this.cellSize / 2;
    const baseY = this.origin.y + this.cellSize / 2;

    this.creatures = creatureNames.map((name, index) => {
      const creature = buildCreature(this, creatureColors[index % creatureColors.length]);
      creature.setPosition(baseX + index * 6, baseY + index * 4);
      creature.setScale(0.9);
      creature.name = name;
      creature.cell = { ...startPos };
      creature.lastDirection = { dx: 0, dy: 0 };
      creature.memory = [];
      creature.visited = new Set([`${startPos.x},${startPos.y}`]);
      
      return creature;
    });

    this.creatures.forEach((creature) => this.scheduleMove(creature));
  }

  createLegend() {
    const entries = this.creatures.map((creature, index) => ({
      name: creature.name,
      color: creatureColors[index % creatureColors.length],
    }));
    if (!entries.length) {
      return;
    }

    const padding = 10;
    const headerHeight = 18;
    const lineHeight = 18;
    const rows = entries.length;
    const columnWidth = 150;
    const width = columnWidth + padding * 2;
    const height = rows * lineHeight + padding * 2 + headerHeight;
    const offsetX = 24;
    const offsetY = this.scale.height - height - 80;

    const container = this.add.container(offsetX, offsetY).setDepth(6);
    const background = this.add.rectangle(0, 0, width, height, 0x0b1020, 0.7).setOrigin(0, 0);
    background.setStrokeStyle(2, 0x7dd3fc, 0.35);
    container.add(background);

    const header = this.add.text(padding, padding, 'Legend', {
      fontFamily: '"Bangers", "Impact", sans-serif',
      fontSize: '14px',
      color: '#e0f2fe',
      stroke: '#0f172a',
      strokeThickness: 3,
    });
    header.setOrigin(0, 0);
    container.add(header);

    entries.forEach((entry, index) => {
      const entryX = padding;
      const entryY = padding + headerHeight + index * lineHeight + 8;

      const icon = buildCreature(this, entry.color);
      icon.setPosition(entryX + 10, entryY);
      icon.setScale(0.55);
      container.add(icon);

      const label = this.add.text(entryX + 24, entryY - 7, entry.name, {
        fontFamily: '"Rubik", "Inter", system-ui, sans-serif',
        fontSize: '12px',
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 3,
      });
      label.setOrigin(0, 0);
      container.add(label);
    });
  }

  scheduleMove(creature) {
    const delay = Phaser.Math.Between(100, 200);
    const event = this.time.delayedCall(delay, () => {
      if (this.raceOver) {
        return;
      }
      this.moveCreature(creature);
      this.scheduleMove(creature);
    });
    this.moveEvents.push(event);
  }

  moveCreature(creature) {
    const neighbors = this.getNeighbors(creature.cell);
    if (!neighbors.length) {
      return;
    }

    const currentDistance = this.getDistance(creature.cell, this.goal);
    const weighted = neighbors.map((neighbor) => {
      const key = `${neighbor.x},${neighbor.y}`;
      const nextDistance = this.getDistance(neighbor, this.goal);
      let weight = 1 / (nextDistance + 1);

      if (nextDistance > currentDistance) {
        weight *= 0.55;
      }

      weight *= creature.visited.has(key) ? 0.5 : 2.4;

      if (neighbor.dx === creature.lastDirection.dx && neighbor.dy === creature.lastDirection.dy) {
        weight *= 1.15;
      }

      if (creature.memory.includes(key) && neighbors.length > 1) {
        weight *= 0.15;
      }

      return { neighbor, weight };
    });

    const hasUnvisited = weighted.some(({ neighbor }) => !creature.visited.has(`${neighbor.x},${neighbor.y}`));
    let choice = null;
    if (hasUnvisited && Phaser.Math.FloatBetween(0, 1) < 0.6) {
      choice = weighted.reduce((best, option) => (option.weight > best.weight ? option : best), weighted[0]);
    } else {
      choice = this.pickWeighted(weighted);
    }
    if (!choice) {
      return;
    }
    const { neighbor } = choice;
    const nextKey = `${neighbor.x},${neighbor.y}`;
    creature.memory.push(`${creature.cell.x},${creature.cell.y}`);
    if (creature.memory.length > 4) {
      creature.memory.shift();
    }
    creature.visited.add(nextKey);
    creature.cell = { x: neighbor.x, y: neighbor.y };
    creature.lastDirection = { dx: neighbor.dx, dy: neighbor.dy };

    const targetX = this.origin.x + (neighbor.x + 0.5) * this.cellSize;
    const targetY = this.origin.y + (neighbor.y + 0.5) * this.cellSize;
    this.tweens.add({
      targets: creature,
      x: targetX,
      y: targetY,
      duration: 220,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!this.raceOver && neighbor.x === this.goal.x && neighbor.y === this.goal.y) {
          this.finishRace(creature);
        }
      },
    });
  }

  getNeighbors(cell) {
    const cellData = this.maze[cell.y][cell.x];
    const neighbors = [];
    if (!cellData.walls.top && cell.y > 0) {
      neighbors.push({ x: cell.x, y: cell.y - 1, dx: 0, dy: -1 });
    }
    if (!cellData.walls.right && cell.x < this.maze[0].length - 1) {
      neighbors.push({ x: cell.x + 1, y: cell.y, dx: 1, dy: 0 });
    }
    if (!cellData.walls.bottom && cell.y < this.maze.length - 1) {
      neighbors.push({ x: cell.x, y: cell.y + 1, dx: 0, dy: 1 });
    }
    if (!cellData.walls.left && cell.x > 0) {
      neighbors.push({ x: cell.x - 1, y: cell.y, dx: -1, dy: 0 });
    }
    return neighbors;
  }

  getDistance(cell, goal) {
    return Math.abs(goal.x - cell.x) + Math.abs(goal.y - cell.y);
  }

  pickWeighted(options) {
    const total = options.reduce((sum, option) => sum + option.weight, 0);
    if (!total) {
      return null;
    }
    let threshold = Phaser.Math.FloatBetween(0, total);
    for (const option of options) {
      threshold -= option.weight;
      if (threshold <= 0) {
        return option;
      }
    }
    return options[options.length - 1];
  }

  finishRace(creature) {
    this.raceOver = true;
    this.winnerName = creature.name;
    this.moveEvents.forEach((event) => event.remove());
    this.moveEvents = [];
    consumeItem(this.winnerName);
    this.setResult(`${this.winnerName} escapes first!`);
    this.updateItemPoolText();
  }
}

export default MazeRaceScene;
