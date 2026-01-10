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

  const extraOpenChance = 0.35;
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

const countDistinctPaths = (grid, start, goal, limit = 3) => {
  let paths = 0;
  const visited = new Set();

  const walk = (cell) => {
    if (paths >= limit) {
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
        walk(neighbor);
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
  const maxAttempts = rows * cols * 8;
  let attempts = 0;

  while (countDistinctPaths(grid, start, goal, minPaths) < minPaths && attempts < maxAttempts) {
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
      this.createItemLabel(baseX - 30, baseY - 30 - index * 14, name, {
        fontSize: '11px',
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 3,
      }).setOrigin(1, 0.5);
      return creature;
    });

    this.creatures.forEach((creature) => this.scheduleMove(creature));
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
