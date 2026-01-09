import Phaser from 'phaser';

const fragShaderNeon = `
#define SHADER_NAME NEON_SHADER
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 outTexCoord;

void main() {
  vec2 uv = outTexCoord;
  vec4 color = texture2D(uMainSampler, uv);
  float scan = sin((uv.y + uTime * 0.8) * uResolution.y * 0.08) * 0.04;

  // Pink/magenta neon aesthetic - boost red and magenta, reduce green
  vec3 neon = vec3(
    color.r * 1.5 + 0.25,  // Strong red boost with pink tint
    color.g * 0.15 + 0.02, // Very low green for magenta/pink
    color.b * 1.2 + 0.25   // Moderate blue boost for magenta
  );

  neon += vec3(scan);
  gl_FragColor = vec4(neon, color.a);
}
`;

const fragShaderSolarpunk = `
#define SHADER_NAME SOLARPUNK_SHADER
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 outTexCoord;

void main() {
  vec2 uv = outTexCoord;
  vec4 color = texture2D(uMainSampler, uv);
  float bloom = sin(uTime + uv.x * 6.0) * 0.05;
  vec3 warm = vec3(color.r * 1.1 + 0.08, color.g * 1.2 + 0.12, color.b * 0.7 + 0.05);
  warm += bloom;
  gl_FragColor = vec4(warm, color.a);
}
`;

const fragShaderMidcentury = `
#define SHADER_NAME MIDCENTURY_SHADER
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 outTexCoord;

void main() {
  vec2 uv = outTexCoord;
  vec4 color = texture2D(uMainSampler, uv);
  float vignette = smoothstep(0.9, 0.4, distance(uv, vec2(0.5)));
  vec3 wood = vec3(color.r * 1.2 + 0.1, color.g * 0.8 + 0.08, color.b * 0.6 + 0.05);
  gl_FragColor = vec4(wood * vignette, color.a);
}
`;

const fragShaderRetro16 = `
#define SHADER_NAME RETRO16_SHADER
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 outTexCoord;

vec3 posterize(vec3 color) {
  return floor(color * 6.0) / 6.0;
}

void main() {
  vec2 uv = outTexCoord;
  vec4 color = texture2D(uMainSampler, uv);
  float pixelSize = 2.0 / uResolution.x;
  vec2 pixelUv = floor(uv / pixelSize) * pixelSize;
  vec4 pix = texture2D(uMainSampler, pixelUv);
  gl_FragColor = vec4(posterize(pix.rgb), color.a);
}
`;

class NeonPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'NeonPipeline',
      fragShader: fragShaderNeon,
    });
  }

  onDraw(target) {
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set2f('uResolution', target.width, target.height);
    this.drawFrame(target, target);
  }
}

class SolarpunkPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'SolarpunkPipeline',
      fragShader: fragShaderSolarpunk,
    });
  }

  onDraw(target) {
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set2f('uResolution', target.width, target.height);
    this.drawFrame(target, target);
  }
}

class MidcenturyPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'MidcenturyPipeline',
      fragShader: fragShaderMidcentury,
    });
  }

  onDraw(target) {
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set2f('uResolution', target.width, target.height);
    this.drawFrame(target, target);
  }
}

class Retro16Pipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'Retro16Pipeline',
      fragShader: fragShaderRetro16,
    });
  }

  onDraw(target) {
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set2f('uResolution', target.width, target.height);
    this.drawFrame(target, target);
  }
}

const registerPipelines = (game) => {
  if (!game.renderer || !game.renderer.pipelines) {
    console.warn('Renderer not ready for pipelines');
    return;
  }
  game.renderer.pipelines.add('NeonPipeline', new NeonPipeline(game));
  game.renderer.pipelines.add('SolarpunkPipeline', new SolarpunkPipeline(game));
  game.renderer.pipelines.add('MidcenturyPipeline', new MidcenturyPipeline(game));
  game.renderer.pipelines.add('Retro16Pipeline', new Retro16Pipeline(game));
};

const pipelineMap = {
  none: null,
  neon: 'NeonPipeline',
  solarpunk: 'SolarpunkPipeline',
  midcentury: 'MidcenturyPipeline',
  retro16: 'Retro16Pipeline',
};

const shaderOptions = [
  { value: 'none', label: 'None (Default)' },
  { value: 'neon', label: '80s Neon' },
  { value: 'solarpunk', label: 'Solarpunk' },
  { value: 'midcentury', label: 'Midcentury Modern' },
  { value: 'retro16', label: '90s 16-bit' },
];

const applyShaderToScene = (scene, shaderKey) => {
  const pipelineKey = pipelineMap[shaderKey];

  // Clear existing post pipelines first
  scene.cameras.main.resetPostPipeline();

  if (!pipelineKey) {
    return;
  }

  // Add the post-processing effect
  scene.cameras.main.setPostPipeline(pipelineKey);
};

const updateShaderUniforms = (scene, time) => {
  // Uniforms are now automatically updated in the onDraw() method
  // This function is kept for compatibility but does nothing
};

export {
  applyShaderToScene,
  registerPipelines,
  shaderOptions,
  updateShaderUniforms,
};
