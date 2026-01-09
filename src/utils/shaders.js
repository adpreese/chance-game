import Phaser from 'phaser';

class NeonPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      fragShader: `
      precision mediump float;
      uniform sampler2D uMainSampler;
      uniform float uTime;
      uniform vec2 uResolution;
      varying vec2 outTexCoord;

      void main() {
        vec2 uv = outTexCoord;
        vec4 color = texture2D(uMainSampler, uv);
        float scan = sin((uv.y + uTime * 0.8) * uResolution.y * 0.08) * 0.04;
        vec3 neon = vec3(color.r * 1.1 + 0.1, color.g * 0.2 + 0.05, color.b * 1.4 + 0.2);
        neon += vec3(scan);
        gl_FragColor = vec4(neon, color.a);
      }
      `,
    });
  }
}

class SolarpunkPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      fragShader: `
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
      `,
    });
  }
}

class MidcenturyPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      fragShader: `
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
      `,
    });
  }
}

class Retro16Pipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      fragShader: `
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
      `,
    });
  }
}

const registerPipelines = (game) => {
  game.renderer.addPipeline('NeonPipeline', new NeonPipeline(game));
  game.renderer.addPipeline('SolarpunkPipeline', new SolarpunkPipeline(game));
  game.renderer.addPipeline('MidcenturyPipeline', new MidcenturyPipeline(game));
  game.renderer.addPipeline('Retro16Pipeline', new Retro16Pipeline(game));
};

const pipelineMap = {
  neon: 'NeonPipeline',
  solarpunk: 'SolarpunkPipeline',
  midcentury: 'MidcenturyPipeline',
  retro16: 'Retro16Pipeline',
};

const shaderOptions = [
  { value: 'neon', label: '80s Neon' },
  { value: 'solarpunk', label: 'Solarpunk' },
  { value: 'midcentury', label: 'Midcentury Modern' },
  { value: 'retro16', label: '90s 16-bit' },
];

const applyShaderToScene = (scene, shaderKey) => {
  const pipelineKey = pipelineMap[shaderKey];
  if (!pipelineKey) {
    scene.cameras.main.clearPostPipeline();
    return;
  }
  scene.cameras.main.setPostPipeline(pipelineKey);
};

const updateShaderUniforms = (scene, time) => {
  const pipelineKey = pipelineMap[scene.registry.get('shader')];
  if (!pipelineKey) {
    return;
  }
  const pipeline = scene.game.renderer.getPipeline(pipelineKey);
  pipeline.setFloat1('uTime', time / 1000);
  pipeline.setFloat2('uResolution', scene.scale.width, scene.scale.height);
};

export {
  applyShaderToScene,
  registerPipelines,
  shaderOptions,
  updateShaderUniforms,
};
