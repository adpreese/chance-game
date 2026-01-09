import Phaser from 'phaser';
import { getState } from './store.js';

const neonPurpleFragmentShader = `
#define SHADER_NAME NEON_PURPLE_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = outTexCoord;
  vec4 baseColor = texture2D(uMainSampler, uv);

  float vignette = smoothstep(0.9, 0.2, distance(uv, vec2(0.5)));
  float scanline = sin((uv.y * uResolution.y * 0.6) + (uTime * 4.0)) * 0.04;
  float noise = rand(uv * (uTime + 0.1)) * 0.02;

  vec3 neonTint = mix(baseColor.rgb, vec3(0.85, 0.2, 1.0), 0.35);
  neonTint += vec3(0.25, 0.0, 0.4) * vignette;
  neonTint += scanline + noise;

  gl_FragColor = vec4(neonTint, baseColor.a);
}
`;

const solarpunkFragmentShader = `
#define SHADER_NAME SOLARPUNK_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = outTexCoord;
  vec4 baseColor = texture2D(uMainSampler, uv);

  float wave = sin((uv.x * 6.0) + (uTime * 1.2)) * 0.03;
  float breeze = sin((uv.y * 8.0) - (uTime * 1.1)) * 0.02;

  float sunGlow = smoothstep(0.6, 0.0, distance(uv, vec2(0.78, 0.2)));
  float canopy = smoothstep(0.4, 0.8, uv.y + (wave * 0.5));
  float shimmer = hash(uv * (uResolution.xy * 0.08) + uTime) * 0.02;

  vec3 leafTint = mix(vec3(0.1, 0.45, 0.3), vec3(0.25, 0.75, 0.45), canopy);
  vec3 sunTint = vec3(1.0, 0.85, 0.45) * sunGlow;
  vec3 ecoTint = leafTint + sunTint;

  vec3 solarpunk = mix(baseColor.rgb, ecoTint, 0.28);
  solarpunk += vec3(0.1, 0.22, 0.15) * breeze;
  solarpunk += shimmer;

  gl_FragColor = vec4(solarpunk, baseColor.a);
}
`;

const treeOfLifeFragmentShader = `
#define SHADER_NAME TREE_OF_LIFE_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float linePattern(vec2 uv, float thickness) {
  vec2 grid = abs(fract(uv * 6.0) - 0.5);
  float line = smoothstep(0.5 - thickness, 0.5, max(grid.x, grid.y));
  return 1.0 - line;
}

void main() {
  vec2 uv = outTexCoord;
  vec4 baseColor = texture2D(uMainSampler, uv);

  float radial = smoothstep(0.9, 0.2, distance(uv, vec2(0.5)));
  float lead = linePattern(uv + vec2(0.02 * sin(uTime * 0.4), 0.0), 0.05);
  float shimmer = sin((uv.y * uResolution.y * 0.4) + (uTime * 2.0)) * 0.02;

  vec3 amber = vec3(0.9, 0.6, 0.2);
  vec3 emerald = vec3(0.2, 0.55, 0.35);
  vec3 sapphire = vec3(0.25, 0.35, 0.65);
  vec3 stained = mix(amber, emerald, uv.y);
  stained = mix(stained, sapphire, smoothstep(0.2, 0.8, uv.x));

  vec3 glassTint = mix(baseColor.rgb, stained, 0.35);
  glassTint = mix(glassTint, vec3(0.1, 0.08, 0.06), lead * 0.6);
  glassTint += radial * 0.1;
  glassTint += shimmer;

  gl_FragColor = vec4(glassTint, baseColor.a);
}
`;

class NeonPurplePostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: neonPurpleFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

class SolarpunkPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: solarpunkFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

class TreeOfLifePostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: treeOfLifeFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

const ensureShaderPipelines = (game) => {
  if (game.renderer.type !== Phaser.WEBGL) {
    return;
  }

  const pipelines = [
    { key: 'NeonPurple', pipeline: NeonPurplePostFX },
    { key: 'Solarpunk', pipeline: SolarpunkPostFX },
    { key: 'TreeOfLife', pipeline: TreeOfLifePostFX },
  ];

  pipelines.forEach(({ key, pipeline }) => {
    if (!game.renderer.pipelines.get(key)) {
      game.renderer.pipelines.addPostPipeline(key, pipeline);
    }
  });
};

const applySelectedShader = (scene) => {
  if (scene.game.renderer.type !== Phaser.WEBGL) {
    return;
  }

  const { shader } = getState();
  const camera = scene.cameras?.main;
  if (!camera) {
    return;
  }

  if (shader === 'neon') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('NeonPurple');
  } else if (shader === 'solarpunk') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('Solarpunk');
  } else if (shader === 'tree-of-life') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('TreeOfLife');
  } else {
    camera.resetPostPipeline();
  }
};

export { applySelectedShader };
