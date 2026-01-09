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

const celShadingFragmentShader = `
#define SHADER_NAME CEL_SHADING_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 uv = outTexCoord;
  vec4 baseColor = texture2D(uMainSampler, uv);

  vec2 pixel = vec2(1.0) / uResolution;
  float edgeX = luma(texture2D(uMainSampler, uv + vec2(pixel.x, 0.0)).rgb) -
    luma(texture2D(uMainSampler, uv - vec2(pixel.x, 0.0)).rgb);
  float edgeY = luma(texture2D(uMainSampler, uv + vec2(0.0, pixel.y)).rgb) -
    luma(texture2D(uMainSampler, uv - vec2(0.0, pixel.y)).rgb);
  float edge = smoothstep(0.05, 0.2, abs(edgeX) + abs(edgeY));

  float levels = 4.0;
  vec3 quantized = floor(baseColor.rgb * levels) / levels;
  vec3 shaded = mix(quantized, quantized * 0.2, edge);

  gl_FragColor = vec4(shaded, baseColor.a);
}
`;

const halftoneFragmentShader = `
#define SHADER_NAME HALFTONE_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 uv = outTexCoord;
  vec4 baseColor = texture2D(uMainSampler, uv);

  float angle = 0.4;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 gridUv = rot * (uv * uResolution / 24.0);
  vec2 cell = fract(gridUv) - 0.5;
  float dist = length(cell);

  float ink = 1.0 - luma(baseColor.rgb);
  float dotRadius = mix(0.08, 0.16, ink);
  float dotMask = smoothstep(dotRadius, dotRadius - 0.05, dist);

  vec3 paper = vec3(0.98, 0.96, 0.92);
  vec3 inkColor = mix(baseColor.rgb, vec3(0.05, 0.05, 0.08), 0.35);
  vec3 halftone = mix(baseColor.rgb, mix(paper, inkColor, dotMask), 0.5);

  gl_FragColor = vec4(halftone, baseColor.a);
}
`;

const crossHatchFragmentShader = `
#define SHADER_NAME CROSS_HATCH_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float hatchLine(vec2 uv, float spacing, float angle) {
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 rotated = rot * (uv * uResolution / spacing);
  float line = abs(fract(rotated.y) - 0.5);
  return smoothstep(0.52, 0.45, line);
}

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 uv = outTexCoord;
  vec4 baseColor = texture2D(uMainSampler, uv);

  float shade = 1.0 - luma(baseColor.rgb);
  float hatchA = hatchLine(uv, 7.0, 0.0);
  float hatchB = hatchLine(uv, 7.0, 1.5708);
  float hatchC = hatchLine(uv, 9.0, 0.7854);
  float hatchD = hatchLine(uv, 11.0, -0.7854);

  float hatchMask = 0.0;
  hatchMask += step(0.25, shade) * hatchA;
  hatchMask += step(0.45, shade) * hatchB;
  hatchMask += step(0.65, shade) * hatchC;
  hatchMask += step(0.8, shade) * hatchD;
  hatchMask = clamp(hatchMask, 0.0, 1.0);

  vec3 ink = vec3(0.08, 0.08, 0.12);
  vec3 shaded = mix(baseColor.rgb, ink, hatchMask * 0.65);
  shaded = mix(shaded, baseColor.rgb * 0.9, 0.15);

  gl_FragColor = vec4(shaded, baseColor.a);
}
`;

const watercolorFragmentShader = `
#define SHADER_NAME WATERCOLOR_FS

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

  vec2 pixel = vec2(1.0) / uResolution;
  vec3 blur =
    texture2D(uMainSampler, uv + vec2(pixel.x, 0.0)).rgb +
    texture2D(uMainSampler, uv - vec2(pixel.x, 0.0)).rgb +
    texture2D(uMainSampler, uv + vec2(0.0, pixel.y)).rgb +
    texture2D(uMainSampler, uv - vec2(0.0, pixel.y)).rgb;
  blur = (blur + baseColor.rgb) / 5.0;

  float grain = rand(uv * uResolution + uTime) * 0.08;
  vec3 wash = mix(blur, vec3(0.95, 0.92, 0.85), 0.15);
  vec3 watercolor = mix(baseColor.rgb, wash, 0.6) + grain;

  gl_FragColor = vec4(watercolor, baseColor.a);
}
`;

const impressionistFragmentShader = `
#define SHADER_NAME IMPRESSIONIST_FS

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

  vec2 pixel = vec2(1.0) / uResolution;
  float jitter = rand(uv * uResolution + uTime) * 2.0 - 1.0;
  vec2 brushOffset = vec2(jitter * pixel.x * 2.0, sin(uTime + uv.y * 8.0) * pixel.y * 2.0);

  vec3 sampleA = texture2D(uMainSampler, uv + brushOffset).rgb;
  vec3 sampleB = texture2D(uMainSampler, uv - brushOffset * 0.5).rgb;
  vec3 blend = mix(sampleA, sampleB, 0.5);

  float levels = 5.0;
  vec3 quantized = floor(blend * levels) / levels;
  vec3 warmed = mix(quantized, vec3(1.0, 0.85, 0.65), 0.12);

  gl_FragColor = vec4(mix(baseColor.rgb, warmed, 0.75), baseColor.a);
}
`;

const sketchFragmentShader = `
#define SHADER_NAME SKETCH_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float hatch(vec2 uv, float angle, float scale, float thickness) {
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 rotated = rot * (uv * uResolution / scale);
  float line = abs(fract(rotated.y) - 0.5);
  return smoothstep(thickness, thickness * 0.4, line);
}

void main() {
  vec2 uv = outTexCoord;
  vec4 baseColor = texture2D(uMainSampler, uv);

  vec2 pixel = vec2(1.0) / uResolution;
  float jitterSeed = rand(uv * uResolution + uTime) * 2.0 - 1.0;
  vec2 jitter = jitterSeed * pixel * 0.6;

  float edgeX = luma(texture2D(uMainSampler, uv + vec2(pixel.x, 0.0) + jitter).rgb) -
    luma(texture2D(uMainSampler, uv - vec2(pixel.x, 0.0) - jitter).rgb);
  float edgeY = luma(texture2D(uMainSampler, uv + vec2(0.0, pixel.y) + jitter).rgb) -
    luma(texture2D(uMainSampler, uv - vec2(0.0, pixel.y) - jitter).rgb);
  float edge = smoothstep(0.04, 0.18, abs(edgeX) + abs(edgeY));

  float ink = 1.0 - luma(baseColor.rgb);
  float hatchA = hatch(uv, 0.0, 8.0, 0.22);
  float hatchB = hatch(uv, 0.785398, 7.0, 0.2);
  float hatchC = hatch(uv, 1.570796, 6.0, 0.18);
  float hatchD = hatch(uv, 2.356194, 6.5, 0.18);

  float layer1 = step(0.2, ink) * hatchA;
  float layer2 = step(0.4, ink) * hatchB;
  float layer3 = step(0.6, ink) * hatchC;
  float layer4 = step(0.75, ink) * hatchD;
  float hatchInk = max(max(layer1, layer2), max(layer3, layer4));

  vec3 paper = vec3(0.98, 0.97, 0.94);
  vec3 lineColor = vec3(0.05, 0.05, 0.06);
  vec3 hatched = mix(paper, lineColor, hatchInk);
  vec3 edged = mix(baseColor.rgb, lineColor, edge);
  vec3 shaded = mix(edged, hatched, 0.55);

  gl_FragColor = vec4(shaded, baseColor.a);
}
`;

const filmNoirFragmentShader = `
#define SHADER_NAME FILM_NOIR_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 uv = outTexCoord;
  vec4 baseColor = texture2D(uMainSampler, uv);

  float lum = luma(baseColor.rgb);
  vec3 noir = vec3(lum);
  vec3 tint = mix(vec3(0.88, 0.9, 0.98), vec3(1.0, 0.95, 0.9), lum);
  noir *= tint;

  noir = pow(noir, vec3(0.85));
  noir = smoothstep(0.08, 0.95, noir);

  float vignette = smoothstep(0.9, 0.35, distance(uv, vec2(0.5)));
  noir *= mix(vec3(0.6), vec3(1.05), vignette);

  float grain = rand(uv * uResolution + uTime * 12.0) - 0.5;
  noir += grain * 0.04;

  float slats = step(0.6, fract((uv.y * 24.0) + sin(uv.x * 3.0) * 0.6));
  noir *= mix(1.0, 0.72, slats * 0.4);

  gl_FragColor = vec4(clamp(noir, 0.0, 1.0), baseColor.a);
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

class CelShadingPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: celShadingFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

class HalftonePostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: halftoneFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

class CrossHatchPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: crossHatchFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

class WatercolorPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: watercolorFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

class ImpressionistPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: impressionistFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

class SketchPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: sketchFragmentShader,
    });

    this._time = 0;
  }

  onPreRender() {
    this._time = this.game.loop.time / 1000;
    this.set1f('uTime', this._time);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

class FilmNoirPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: filmNoirFragmentShader,
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
    { key: 'CelShading', pipeline: CelShadingPostFX },
    { key: 'Halftone', pipeline: HalftonePostFX },
    { key: 'CrossHatch', pipeline: CrossHatchPostFX },
    { key: 'Watercolor', pipeline: WatercolorPostFX },
    { key: 'Impressionist', pipeline: ImpressionistPostFX },
    { key: 'Sketch', pipeline: SketchPostFX },
    { key: 'FilmNoir', pipeline: FilmNoirPostFX },
  ];

  pipelines.forEach(({ key, pipeline }) => {
    if (!game.renderer.pipelines.get(key)) {
      game.renderer.pipelines.addPostPipeline(key, pipeline);
    }
  });
};

const applyCrossHatchToScene = (scene) => {
  const shouldApply = (gameObject) =>
    gameObject &&
    typeof gameObject.setPostPipeline === 'function' &&
    gameObject.type !== 'DOMElement';

  const applyToObject = (gameObject) => {
    if (shouldApply(gameObject)) {
      gameObject.setPostPipeline('CrossHatch');
    }
  };

  scene.children?.list?.forEach(applyToObject);

  const listener = (gameObject) => {
    applyToObject(gameObject);
  };

  scene.sys.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, listener);
  scene.__crossHatchListener = listener;
  scene.sys.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    clearCrossHatchFromScene(scene);
  });
};

const clearCrossHatchFromScene = (scene) => {
  if (scene.__crossHatchListener) {
    scene.sys.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, scene.__crossHatchListener);
    scene.__crossHatchListener = null;
  }

  scene.children?.list?.forEach((gameObject) => {
    if (gameObject && typeof gameObject.removePostPipeline === 'function') {
      gameObject.removePostPipeline('CrossHatch');
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

  clearCrossHatchFromScene(scene);

  if (shader === 'neon') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('NeonPurple');
  } else if (shader === 'solarpunk') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('Solarpunk');
  } else if (shader === 'tree-of-life') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('TreeOfLife');
  } else if (shader === 'cel-shading') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('CelShading');
  } else if (shader === 'halftone') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('Halftone');
  } else if (shader === 'cross-hatch') {
    ensureShaderPipelines(scene.game);
    camera.resetPostPipeline();
    applyCrossHatchToScene(scene);
  } else if (shader === 'watercolor') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('Watercolor');
  } else if (shader === 'impressionist') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('Impressionist');
  } else if (shader === 'sketch') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('Sketch');
  } else if (shader === 'film-noir') {
    ensureShaderPipelines(scene.game);
    camera.setPostPipeline('FilmNoir');
  } else {
    camera.resetPostPipeline();
  }
};

const applyTextBoxShader = (scene, gameObject, pipelineKey = 'TreeOfLife') => {
  if (scene.game.renderer.type !== Phaser.WEBGL) {
    return;
  }

  if (!gameObject || typeof gameObject.setPostPipeline !== 'function') {
    return;
  }

  ensureShaderPipelines(scene.game);
  gameObject.setPostPipeline(pipelineKey);
};

export { applySelectedShader, applyTextBoxShader };
