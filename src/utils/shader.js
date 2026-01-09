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

const ensureShaderPipelines = (game) => {
  if (game.renderer.type !== Phaser.WEBGL) {
    return;
  }

  const pipelineKey = 'NeonPurple';
  if (!game.renderer.pipelines.get(pipelineKey)) {
    game.renderer.pipelines.addPostPipeline(pipelineKey, NeonPurplePostFX);
  }
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
  } else {
    camera.resetPostPipeline();
  }
};

export { applySelectedShader };
