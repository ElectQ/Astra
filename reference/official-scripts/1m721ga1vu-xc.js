(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,914469,e=>{"use strict";var t=e.i(409703),a=e.i(695418),o=e.i(361489),i=t;let r=`
  #include <common>
  uniform sampler2D inputBuffer;
  uniform vec2 sourceTexelSize;
  uniform float threshold;
  uniform float smoothing;
  varying vec2 vUv;
  void main() {
    vec2 offset = sourceTexelSize * 0.5;
    vec4 color = (
      texture2D(inputBuffer, vUv + vec2(-offset.x, -offset.y)) +
      texture2D(inputBuffer, vUv + vec2( offset.x, -offset.y)) +
      texture2D(inputBuffer, vUv + vec2(-offset.x,  offset.y)) +
      texture2D(inputBuffer, vUv + vec2( offset.x,  offset.y))
    ) * 0.25;
    gl_FragColor = color * smoothstep(threshold, threshold + smoothing, luminance(color.rgb));
  }
`,l=`
  uniform sampler2D source;
  uniform vec2 stepSize;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(source, vUv) * 0.2270270270;
    color += (texture2D(source, vUv + stepSize * 1.3846153846)
      + texture2D(source, vUv - stepSize * 1.3846153846)) * 0.3162162162;
    color += (texture2D(source, vUv + stepSize * 3.2307692308)
      + texture2D(source, vUv - stepSize * 3.2307692308)) * 0.0702702703;
    gl_FragColor = color;
  }
`;class n extends i.BloomEffect{sourceTexelSize=new a.Uniform(new a.Vector2);blurSource=new a.Uniform(null);blurStep=new a.Uniform(new a.Vector2);horizontalTarget=new a.WebGLRenderTarget(1,1,{type:a.HalfFloatType,depthBuffer:!1});verticalTarget=this.horizontalTarget.clone();reconstruction=new i.ShaderPass(new a.ShaderMaterial({uniforms:{source:this.blurSource,stepSize:this.blurStep},vertexShader:`
        varying vec2 vUv;
        void main() {
          vUv = position.xy * 0.5 + 0.5;
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,fragmentShader:l,blending:a.NoBlending,depthTest:!1,depthWrite:!1,toneMapped:!1}));constructor(e){super(e),this.luminanceMaterial.uniforms.sourceTexelSize=this.sourceTexelSize,this.luminanceMaterial.fragmentShader=r,this.luminanceMaterial.needsUpdate=!0,this.uniforms.set("map",new a.Uniform(this.verticalTarget.texture))}setSize(e,t){super.setSize(e,t);let a=Math.max(1,Math.round(.5*e)),o=Math.max(1,Math.round(.5*t));this.horizontalTarget?.setSize(a,o),this.verticalTarget?.setSize(a,o)}update(e,t,a){this.sourceTexelSize.value.set(1/t.width,1/t.height),super.update(e,t,a),this.blurSource.value=super.texture,this.blurStep.value.set(1/this.horizontalTarget.width,0),this.reconstruction.render(e,null,this.horizontalTarget),this.blurSource.value=this.horizontalTarget.texture,this.blurStep.value.set(0,1/this.verticalTarget.height),this.reconstruction.render(e,null,this.verticalTarget)}}var s=t;class h extends s.SMAAEffect{disposed=!1;resolveReady;ready=new Promise(e=>{this.resolveReady=e});constructor(e){super({preset:e}),this.addEventListener("load",this.onLoad)}onLoad=()=>{this.removeEventListener("load",this.onLoad),this.disposed&&(this.weightsMaterial.searchTexture.dispose(),this.weightsMaterial.areaTexture.dispose()),this.resolveReady()};dispose(){this.disposed||(this.disposed=!0,super.dispose(),this.resolveReady())}}let c=["#6DCBF4","#7AB1FE","#F87915","#FA994C","#F5F6FB"].map(e=>new a.Color(e)),u=[.08,.58,.22,.68,.44];function p(e){return e<.36?c[0]:e<.52?c[1]:e<.64?c[2]:e<.74?c[3]:c[4]}let m=`
  float moonCrescentLight(vec3 normal, vec3 light, vec3 view) {
    float side = length(light - view * dot(light, view));
    float wrap = 0.42 * smoothstep(0.15, 0.65, side);
    // An offset lighting plane keeps the inner edge a smooth elliptical arc.
    return (dot(normal, light) + wrap * (side - dot(normal, view))) / (1.0 + wrap);
  }
`;function f(e){e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
${m}
float moonPixelCoverage;`).replace("#include <normal_fragment_maps>",`
        vec3 moonSmoothNormal = normal;
        #include <normal_fragment_maps>
        vec3 moonViewDir = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
        float moonFacing = max(dot(moonSmoothNormal, moonViewDir), 0.0);
        // Squared facing stays smooth in screen space at the sphere silhouette.
        float moonLimbDistance = moonFacing * moonFacing;
        moonPixelCoverage = smoothstep(0.0, max(0.0025, fwidth(moonLimbDistance) * 3.0), moonLimbDistance);
        float moonDetail = smoothstep(0.02, 0.24, moonFacing);
        #if NUM_DIR_LIGHTS > 0
          float moonLightFacing = moonCrescentLight(moonSmoothNormal, directionalLights[0].direction, moonViewDir);
          // Let an unresolved crescent fade away instead of flickering between raster samples.
          float moonPixelSize = max(max(fwidth(moonSmoothNormal.x), fwidth(moonSmoothNormal.y)), 0.0001);
          float moonCrescentPixels = (1.0 + dot(directionalLights[0].direction, moonViewDir)) / moonPixelSize;
          moonPixelCoverage *= smoothstep(0.0, 2.0, moonCrescentPixels);
          moonDetail *= smoothstep(0.0, 0.2, abs(moonLightFacing));
        #endif
        // Preserve crater relief on the face, but not at the grazing limb or terminator.
        normal = normalize(mix(moonSmoothNormal, normal, moonDetail));
      `).replace("#include <lights_physical_pars_fragment>",o.ShaderChunk.lights_physical_pars_fragment.replace("vec3 irradiance = dotNL * directLight.color;",`
          float moonLight = moonCrescentLight(geometryNormal, directLight.direction, geometryViewDir);
          float moonSoftness = max(0.06, fwidth(moonLight) * 1.5);
          // Integrate lighting over a small source / pixel footprint at the terminator.
          float moonLitFraction = clamp((moonLight + moonSoftness) / (2.0 * moonSoftness), 0.0, 1.0);
          float moonDiffuse = moonLight >= moonSoftness ? moonLight
            : moonSoftness * moonLitFraction * moonLitFraction;
          // Keep the crescent's tips visible as the surface turns toward the poles.
          moonDiffuse /= max(length(geometryNormal.xz), 0.5);
          float moonLimb = max(dot(geometryNormal, geometryViewDir), 0.0);
          float moonCoverage = smoothstep(0.0, max(0.05, fwidth(moonLimb) * 1.5), moonLimb);
          vec3 irradiance = moonDiffuse * moonCoverage * directLight.color;
        `)).replace("#include <colorspace_fragment>",`
        #include <colorspace_fragment>
        // On the direct path, apply coverage after tone mapping to keep subpixel light dim.
        gl_FragColor.rgb *= moonPixelCoverage;
      `)}let d=`
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  varying vec3 vLocalViewDirection;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vLocalNormal = normal;
    vLocalViewDirection = normalize(vec3(modelViewMatrix[0][2], modelViewMatrix[1][2], modelViewMatrix[2][2]));
    gl_Position = projectionMatrix * viewPosition;
  }
`,v=`
  ${m}
  uniform float uRevealBrightness;
  uniform float uSurfaceRadius;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  varying vec3 vLocalViewDirection;
  uniform vec3 uColor;
  uniform float uDirectional;
  uniform vec3 uLightDirection;
  void main() {
    // The hero uses an orthographic camera: every view ray is parallel.
    float facing = max(normalize(vNormal).z, 0.0);
    vec3 view = normalize(vLocalViewDirection);
    vec3 normal = normalize(vLocalNormal);
    // Light the halo from the corresponding surface point, extending its limb outward.
    vec3 projected = (normal - view * dot(normal, view)) / uSurfaceRadius;
    float radialSquared = dot(projected, projected);
    vec3 surfaceNormal = projected / max(1.0, sqrt(radialSquared))
      + view * sqrt(max(0.0, 1.0 - radialSquared));
    float lightFacing = moonCrescentLight(surfaceNormal, uLightDirection, view);
    float lightFootprint = fwidth(lightFacing) * 1.5;
    float lit = smoothstep(-0.12 - lightFootprint, 0.4 + lightFootprint, lightFacing);
    float glow = pow(facing, 3.5) * mix(1.0, lit, uDirectional);
    glow *= smoothstep(0.0, max(0.05, fwidth(facing) * 1.5), facing);
    gl_FragColor = vec4(uColor * 4.0, glow * mix(0.22, 0.65, uDirectional) * uRevealBrightness);
  }
`,g=`
  vec3 sunRim(vec3 color, float radius, float bloomScale) {
    float edge = radius - 1.0;
    float rim = exp(-pow(edge / 0.045, 2.0))
      + exp(-pow(edge / 0.11, 2.0)) * 0.22;
    vec3 warmGold = vec3(color.r, max(color.g, color.r * 0.7), color.b);
    return mix(warmGold, vec3(1.0), 0.12) * rim * 1.25 * bloomScale;
  }
`,x=`
  uniform float uRevealBrightness;
  uniform float uWhiteHeat;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  uniform vec3 uColor;
  uniform float uBloomScale;
  uniform float uSurfaceTime;
  ${g}

  float solarHash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float solarNoise(vec3 p) {
    vec3 cell = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(solarHash(cell), solarHash(cell + vec3(1, 0, 0)), f.x),
          mix(solarHash(cell + vec3(0, 1, 0)), solarHash(cell + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(solarHash(cell + vec3(0, 0, 1)), solarHash(cell + vec3(1, 0, 1)), f.x),
          mix(solarHash(cell + vec3(0, 1, 1)), solarHash(cell + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    float facing = max(normal.z, 0.0);
    vec3 surface = normalize(vLocalNormal);
    // Visible convection at hero scale, with continuous rather than random motion.
    vec3 drift = vec3(0.12, 0.072, -0.096) * uSurfaceTime;
    float broad = solarNoise(surface * 5.0 + vec3(7.1, 2.8, 4.3) + drift);
    vec3 warped = surface * 15.0 + broad * 2.2 + drift.yzx * 2.0;
    float cells = solarNoise(warped);
    // Fade the finest detail when it becomes smaller than a screen pixel.
    float detailVisibility = 1.0 - smoothstep(0.5, 1.5, length(fwidth(surface * 42.0)));
    float grain = mix(0.5, solarNoise(surface * 42.0 + drift.zxy * 4.0), detailVisibility);
    float heat = smoothstep(0.15, 0.85, broad * 0.45 + cells * 0.4 + grain * 0.15);
    float colorEnergy = 1.0 - min(uColor.r, min(uColor.g, uColor.b));
    // Map temperature to orange, gold, then yellow, without adding white.
    // Keep the blue channel low so HDR bloom cannot bleach the hot patches.
    vec3 deepOrange = uColor * vec3(1.0, mix(1.0, 0.62, colorEnergy), 1.0);
    vec3 gold = vec3(uColor.r, max(uColor.g, uColor.r * 0.48), uColor.b);
    vec3 hotYellow = vec3(uColor.r, max(uColor.g, uColor.r * 0.92), uColor.b);
    vec3 surfaceColor = mix(deepOrange, gold, smoothstep(0.12, 0.58, heat));
    surfaceColor = mix(surfaceColor, hotYellow, smoothstep(0.5, 0.88, heat));
    float roundness = mix(0.5, 1.0, sqrt(facing))
      * (0.9 + 0.1 * dot(normal, normalize(vec3(-0.4, 0.5, 1.0))));
    vec3 emission = surfaceColor
      * mix(1.1, 2.2, heat) * roundness * (1.0 + colorEnergy * 0.15);
    // Feather the outer ~8% into the optical halo's color at the limb.
    // Keep the sphere opaque so it still occludes stars and masks bloom.
    vec3 limbGlow = uColor * (0.28 + 0.055) * 4.0 * uBloomScale;
    emission = mix(limbGlow, emission, smoothstep(0.0, 0.4, facing));
    emission += sunRim(uColor, sqrt(max(1.0 - facing * facing, 0.0)), uBloomScale);
    // Cool the opaque surface from white to gold while it continues to occlude stars.
    vec3 whiteHot = vec3(2.2) * mix(0.65, 1.0, sqrt(facing))
      + sunRim(vec3(1.0), sqrt(max(1.0 - facing * facing, 0.0)), uBloomScale);
    emission = mix(emission, whiteHot, uWhiteHeat);
    // Brighten the textured surface itself; keep depth and opacity stable.
    gl_FragColor = vec4(emission * uRevealBrightness, 1.0);
  }
`,y=`
  varying vec2 vPoint;
  void main() {
    vPoint = (uv - 0.5) * 14.0;
    vec4 viewCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 scale = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
    viewCenter.xy += position.xy * scale;
    gl_Position = projectionMatrix * viewCenter;
  }
`,w=`
  uniform float uRevealBrightness;
  uniform float uWhiteHeat;
  varying vec2 vPoint;
  uniform vec3 uColor;
  uniform float uBloomScale;
  uniform float uEclipse;
  uniform float uDiamond;
  uniform float uSurfaceTime;
  uniform vec3 uMoon;
  ${g}

  vec2 coronaGradient(vec2 cell) {
    float angle = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453) * 6.2831853;
    return vec2(cos(angle), sin(angle));
  }

  float coronaPerlin(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    vec2 fade = local * local * local * (local * (local * 6.0 - 15.0) + 10.0);
    return mix(
      mix(dot(coronaGradient(cell), local),
          dot(coronaGradient(cell + vec2(1.0, 0.0)), local - vec2(1.0, 0.0)), fade.x),
      mix(dot(coronaGradient(cell + vec2(0.0, 1.0)), local - vec2(0.0, 1.0)),
          dot(coronaGradient(cell + vec2(1.0)), local - vec2(1.0)), fade.x),
      fade.y);
  }

  void main() {
    float radius = length(vPoint);
    float outside = max(radius - 1.0, 0.0);
    // A tight rim plus a much fainter, long tail; no visible halo boundary.
    float outerHalo = exp(-outside * 1.15) * 0.055;
    float haloFade = 1.0 - smoothstep(4.5, 7.0, radius);
    float halo = (exp(-outside * 4.8) * 0.28 + outerHalo) * haloFade;
    // Cool the halo along with the sun's surface.
    vec3 glowColor = mix(uColor, vec3(1.0), uWhiteHeat);
    vec3 light = glowColor * halo * 4.0 * uBloomScale
      + sunRim(glowColor, radius, uBloomScale);
    if (uEclipse > 0.0 || uDiamond > 0.0) {
      // Direction-based noise closes around the limb without an angular seam.
      // Compress its radial domain into soft streamers, drifting on the scene clock.
      vec2 radial = vPoint / max(radius, 0.001);
      vec2 drift = vec2(0.004, -0.003) * uSurfaceTime;
      float broad = coronaPerlin(radial * 2.8 + drift);
      vec2 detailPoint = radial * (11.0 + outside * 0.8) + drift * 0.6 + 8.3;
      float detailVisibility = 1.0 - smoothstep(0.3, 0.8, length(fwidth(detailPoint)));
      float detail = coronaPerlin(detailPoint) * detailVisibility;
      float streamers = smoothstep(-0.45, 0.55, broad + detail * 0.3);
      float inner = exp(-outside * 8.0) * (0.22 + detail * 0.025);
      // Give the corona the normal bloom's reach while retaining uneven streamers.
      float wisps = outerHalo * (0.8 + streamers * 2.4);
      vec3 eclipseLight = glowColor * (inner + wisps);
      eclipseLight *= haloFade;
      light = mix(light, eclipseLight, uEclipse);

      // The final exposed sunlight sits opposite the Moon's projected center.
      vec2 direction = -uMoon.xy / max(length(uMoon.xy), 0.0001);
      vec2 diamondPoint = vPoint - direction * 1.02;
      float beadWidth = max(0.025, fwidth(radius));
      float bead = exp(-dot(diamondPoint, diamondPoint) / (beadWidth * beadWidth));
      float scatter = exp(-length(diamondPoint) * 18.0) * 0.08;
      light += glowColor * (bead * 0.8 + scatter) * uDiamond;
    }
    if (uMoon.z > 0.0) {
      float moonEdge = length(vPoint - uMoon.xy) - uMoon.z;
      float footprint = max(fwidth(moonEdge), 0.006);
      light *= smoothstep(-footprint, footprint, moonEdge);
    }
    gl_FragColor = vec4(light * uRevealBrightness, 1.0);
  }
`;function M(e,t,o){let i=o/Math.max(t,1),r=1-a.MathUtils.smoothstep(e,480,900),l=Math.min(68,.13*e),n=Math.min(l,t*a.MathUtils.lerp(.15,.12,r)),s=n/l,h=Math.max(.32*Math.min(e,1440)*.7,3.4*n),c=a.MathUtils.smoothstep(1-(e/2-18)/(h+1.15*n),0,.25),u=Math.min(h,Math.max(0,e/2-18-1.15*(n*=(1-.07*c)*a.MathUtils.lerp(.9,1,r))));return{compression:c,heightScale:s,radius:n*i,centerOffset:6*r*i,separation:u*i/.7}}var S=a;let b=["M128.472 2.36011C65.4727 24.3601 10.7725 93.1601 9.97246 162.36C8.97246 248.86 79.4138 262.86 87.9725 262.86C116.973 262.86 135.973 244.36 135.973 221.36C135.973 189.86 102.973 193.86 102.973 209.36","M224.973 31.8602C132.473 3.86011 29.9727 75.8601 29.9727 159.86C29.9727 247.86 98.4726 259.86 126.473 247.86","M126.473 215.359C124.639 222.692 117.073 237.159 101.473 236.359C89.1905 235.729 76.0585 219.995 76.4724 195.859C76.4724 165.859 100.473 142.859 132.473 142.859C171.973 142.859 213.473 171.36 213.473 231.36C213.473 276.36 170.473 328.36 85.9727 316.86","M106.973 237.36C81.9727 240.36 61.4727 222.86 61.4727 184.86C61.4727 153.36 91.9727 123.36 132.473 123.36C172.973 123.36 227.973 149.86 227.973 225.36C227.973 287.36 168.473 322.36 121.473 322.36C53.4727 322.36 10.9727 264.86 2.47266 208.36","M114.973 211.36C114.973 225.86 92.4727 226.86 92.4727 205.36C92.4727 183.86 109.938 175.36 127.973 175.36C146.008 175.36 174.473 195.86 174.473 230.86C174.473 264.36 148.473 281.86 133.973 287.36C119.473 292.86 81.6727 296.56 54.4727 269.36"];class P extends S.Curve{source;depth;rotationDepth;depthPhase;constructor(e,t,a,o){super(),this.source=e,this.depth=t,this.rotationDepth=a,this.depthPhase=o,this.arcLengthDivisions=640}getPoint(e,t=new S.Vector3){let a=S.MathUtils.clamp(e,0,1),o=this.source.getPointAt(a),i=Math.sin(a*Math.PI),r=Math.sin(a*Math.PI*1.35+this.depthPhase)*this.depth*this.rotationDepth*i;return t.set((o.x-114.973)*(9.7/325),(211.36-o.y)*(9.7/325),r)}}function R(e){let t=e>>>0;return()=>{let e=t+=0x6d2b79f5;return e=Math.imul(e^e>>>15,1|e),(((e^=e+Math.imul(e^e>>>7,61|e))^e>>>14)>>>0)/0x100000000}}let D=`
  uniform float uBuildIn;
  float starBuildIn(float seed) {
    float delay = seed * 0.1;
    return smoothstep(delay, delay + 0.55, uBuildIn)
      * mix(0.2, 1.0, smoothstep(0.2, 1.0, uBuildIn));
  }
`,C=`
  varying float vParticleDiameter;
  #ifdef ZOOM_RUSH
    varying vec2 vRushDirection;
    varying float vRushStretch;
    varying float vRushGlow;
    varying float vSpriteDiameter;
  #endif
  vec2 astraSpritePixel(float flareExtent) {
    #ifdef ZOOM_RUSH
      return (gl_PointCoord - vec2(0.5)) * vSpriteDiameter;
    #else
      return (gl_PointCoord - vec2(0.5)) * max(vParticleDiameter * flareExtent, 4.0);
    #endif
  }
  float astraCubicCoverage(float coordinate) {
    float x = abs(coordinate);
    if (x < 1.0) return (4.0 - 6.0 * x * x + 3.0 * x * x * x) / 6.0;
    float tail = max(2.0 - x, 0.0);
    return tail * tail * tail / 6.0;
  }
  float astraFilteredCore(vec2 pixel, float area) {
    return astraCubicCoverage(pixel.x) * astraCubicCoverage(pixel.y)
      * area * vParticleDiameter * vParticleDiameter;
  }
`,T=`
  varying float vBrightness;
  varying float vLens;
  varying float vOpacity;
  ${C}

  void main() {
    vec2 pixel = astraSpritePixel(1.0);
    float distanceToCenter = length(pixel) * 2.0 / max(vParticleDiameter, 0.0001);
    float disc = 1.0 - smoothstep(0.22, 1.0, distanceToCenter);
    float core = mix(astraFilteredCore(pixel, 0.256408), pow(disc, 1.5),
      smoothstep(2.0, 4.0, vParticleDiameter));
    float alpha = core * vOpacity;

    if (alpha <= 0.0) {
      discard;
    }

    gl_FragColor = vec4(vec3(vBrightness), alpha);
  }
`,A=`
  varying float vBrightness;
  varying vec3 vColor;
  varying float vLens;
  varying float vOpacity;
  varying float vRayStrength;
  varying float vRayScale;
  varying float vGlimmerStrength;
  ${C}

  void main() {
    float flareExtent = mix(1.0, 3.0, vGlimmerStrength);
    vec2 pixel = astraSpritePixel(flareExtent);
    vec2 point = pixel * 2.0 / max(vParticleDiameter, 0.0001);
    float distanceToCenter = length(point);
    float disc = 1.0 - smoothstep(0.08, 1.0, distanceToCenter);
    float core = pow(disc, 2.2);
    vec2 rayPoint = point / vRayScale;
    float rayFalloff = mix(28.0, 6.0, vGlimmerStrength);
    float horizontalRay = exp(-abs(rayPoint.y) * rayFalloff)
      * (1.0 - smoothstep(0.18, 1.0, abs(rayPoint.x)));
    float verticalRay = exp(-abs(rayPoint.x) * rayFalloff)
      * (1.0 - smoothstep(0.18, 1.0, abs(rayPoint.y)));
    float rays = max(horizontalRay, verticalRay)
      * mix(0.28, 0.85, vGlimmerStrength) * vRayStrength;
    float resolved = smoothstep(2.0, 4.0, vParticleDiameter);
    float alpha = mix(astraFilteredCore(pixel, 0.150904), max(core, rays), resolved)
      * vOpacity;
    #ifdef TRANSIT_STARS
      float trailAlpha = 0.0;
    #endif
    #ifdef ZOOM_RUSH
      // Extend the glow behind the star; keep its leading edge, core and flare intact.
      float along = dot(point, vRushDirection);
      float across = dot(point, vec2(-vRushDirection.y, vRushDirection.x));
      #ifndef TRANSIT_STARS
      float glowAlong = min(along, 0.0) / vRushStretch + max(along, 0.0);
      vec2 glowPoint = vec2(glowAlong, across);
      alpha += exp(-2.2 * dot(glowPoint, glowPoint)) * 0.16 * vRushGlow * vOpacity;
      #endif
      float trailLength = vRushStretch - 1.0;
      if (trailLength > 0.001) {
        float end = along - clamp(along, -trailLength, 0.0);
        float fade = 1.0 - smoothstep(0.0, trailLength, -along);
        #ifdef TRANSIT_STARS
          // A narrow light streak tapers into darkness instead of a broad comet plume.
          float width = mix(0.16, 0.5, fade);
          float crossSection = across * across / (width * width);
          float trail = exp(-crossSection - 4.0 * end * end) * 0.4
            + exp(-crossSection * 0.3 - 2.2 * end * end) * 0.05;
          trailAlpha = trail * fade * fade * vRushGlow * vOpacity;
          alpha += trailAlpha;
        #else
          alpha += exp(-4.0 * (across * across + end * end))
            * fade * 0.2 * vRushGlow * vOpacity;
        #endif
      }
    #endif

    if (alpha <= 0.0) {
      discard;
    }

    float whiteCore = mix(0.59228, core, resolved)
      * smoothstep(0.9, 2.8, vBrightness)
      * 0.82;
    float colorEnergy = 1.0
      - min(vColor.r, min(vColor.g, vColor.b));
    vec3 emission = mix(vColor, vec3(1.0), whiteCore)
      * vBrightness
      * (1.0 + colorEnergy * 0.42);
    #ifdef TRANSIT_STARS
      // Faster trails approach white while the star itself keeps its authored color.
      float whiteTrail = mix(0.35, 0.95, smoothstep(0.1, 0.8, vRushGlow));
      vec3 trailEmission = mix(vColor, vec3(1.0), whiteTrail) * vBrightness;
      emission = (emission * (alpha - trailAlpha) + trailEmission * trailAlpha) / alpha;
    #endif
    gl_FragColor = vec4(emission, alpha);
  }
`;function F(e,t,a){let o=Math.min(Math.max((e-t)/(a-t),0),1);return o*o*o*(o*(6*o-15)+10)}function z(e){let t=8.27*Math.max(e,0),a=Math.min(Math.max((t-.45)/3.0199999999999996,0),1),o=t-.47*a*a*(3-2*a),i=Math.min(Math.max(o-3,0),4.8),r=Math.exp(-i/1.8)*(1-(i/4.8)**3)**2,l=o<=3?o:4.8-1.8*r,n=(1-Math.cos(F(l,.45,4.8)*Math.PI))/2,s=(1-F(l,2.3,4.7))**1.1;return{expansion:n,camera:{x:(.42*Math.sin(Math.PI*n)-.12)*(1-n),y:.12*Math.sin(2*Math.PI*n)*(1-n)},scatter:F(l,1.45,4.8),bodies:{brightness:.35+.65*n,sunWhiteHeat:1-F(l,.45,3.6),scale:.035+.965*n,separation:.7,rotation:s,center:n}}}let _=[[.097,.05],[.688,.274],[.908,.3],[.083,.45],[.308,.58],[.254,.762],[.797,.758],[.889,.866],[.126,.998]],L=`
  ${D}
  attribute vec4 star;
  attribute vec4 tint;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uImageScale;
  uniform float uTravel;
  uniform float uHalfView;
  uniform float uPixelToField;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vCoreDiameter;
  varying float vFlareDiameter;
  varying float vRasterSize;
  varying float vRayWidth;
  void main() {
    float reveal = starBuildIn(star.z / 6.28318530718);
    float scale = uPixelRatio * uImageScale * sqrt(reveal);
    float settled = smoothstep(8.3, 9.5, uTime);
    float pulse = pow(0.5 + 0.5 * sin(star.z + uTime * star.w), 3.0);
    vCoreDiameter = star.x * scale;
    vFlareDiameter = tint.w * scale * (1.0 - 0.18 * settled * pulse);
    vRasterSize = max(max(vCoreDiameter * 6.0, tint.w * scale), 4.0);
    vRayWidth = max(0.35, 0.6 * scale);
    vColor = tint.rgb;
    vOpacity = star.y * smoothstep(0.0, 0.2, reveal);
    gl_PointSize = vRasterSize;
    // Wrap beyond the full unpulsed sprite, keeping the pool fixed for this crop.
    float halfSpan = uHalfView + 0.5 * vRasterSize * uPixelToField / uPixelRatio;
    if (abs(position.x) > halfSpan) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }
    vec3 shifted = position;
    float travel = uTravel * (4.0 + position.z);
    shifted.x = mod(position.x + travel + halfSpan, 2.0 * halfSpan) - halfSpan;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(shifted, 1.0);
  }
`,B=`
  varying vec3 vColor;
  varying float vOpacity;
  varying float vCoreDiameter;
  varying float vFlareDiameter;
  varying float vRasterSize;
  varying float vRayWidth;
  float coverage(float coordinate) {
    float x = abs(coordinate);
    if (x < 1.0) return (4.0 - 6.0 * x * x + 3.0 * x * x * x) / 6.0;
    float tail = max(2.0 - x, 0.0);
    return tail * tail * tail / 6.0;
  }
  void main() {
    vec2 pixel = (gl_PointCoord - 0.5) * vRasterSize;
    float diameterSquared = vCoreDiameter * vCoreDiameter;
    // Preserve the energy of subpixel stars without blinking at pixel boundaries.
    float filtered = coverage(pixel.x) * coverage(pixel.y) * diameterSquared * 0.45;
    float disc = exp(-8.0 * dot(pixel, pixel) / max(diameterSquared, 0.0001));
    float core = mix(filtered, disc, smoothstep(2.0, 4.0, vCoreDiameter));
    float halo = exp(-3.5 * length(pixel) / max(vCoreDiameter, 0.001)) * 0.12;
    halo *= smoothstep(1.5, 3.5, vCoreDiameter);
    float rays = 0.0;
    if (vFlareDiameter > 0.0) {
      vec2 arm = max(vec2(0.0), 1.0 - abs(pixel) / (vFlareDiameter * 0.5));
      float horizontal = exp(-abs(pixel.y) / vRayWidth) * pow(arm.x, 3.0);
      float vertical = exp(-abs(pixel.x) / vRayWidth) * pow(arm.y, 3.0);
      rays = max(horizontal, vertical) * 0.8;
    }
    float alpha = max(core + halo, rays) * vOpacity;
    if (alpha <= 0.0) discard;
    gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.4), alpha);
  }
`;var O=e.i(63295);let I=[{depth:.62,phase:.16,speed:.025,strong:!0},{depth:-.46,phase:.72,speed:.018,strong:!1},{depth:.78,phase:.38,speed:.021,strong:!0},{depth:-.7,phase:.58,speed:.016,strong:!1},{depth:.42,phase:.08,speed:.03,strong:!0}],E=`
  ${D}
  attribute vec3 destination;
  attribute vec3 starColor;
  attribute float starBrightness;
  attribute float starOpacity;
  attribute float starScale;
  attribute float starEnvelope;
  attribute float starVisibility;
  attribute float ambientVisibility;
  attribute float galaxyRank;
  attribute float twinklePhase;
  attribute float twinkleRate;
  attribute vec4 path;
  attribute vec2 pathOffset;
  uniform float uExpansion;
  uniform float uScatter;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uFlowTime;
  uniform float uGalaxyDensity;
  uniform float uViewportWidth;
  uniform float uViewportHeight;
  uniform float uRush;
  uniform float uTravelSpeed;
  uniform float uWrapOpacity;
  uniform float uFieldSpread;
  uniform float uViewHeight;
  uniform sampler2D uPaths;
  uniform float uPixelRatio;
  varying float vBrightness;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vLens;
  varying float vRayStrength;
  varying float vRayScale;
  varying float vGlimmerStrength;
  varying float vParticleDiameter;
  varying vec2 vRushDirection;
  varying float vRushStretch;
  varying float vRushGlow;
  varying float vSpriteDiameter;
  vec3 samplePath(float progress) {
    float index = clamp(progress, 0.0, 1.0) * 255.0;
    float lower = floor(index);
    vec3 a = texture2D(uPaths, vec2((lower + 0.5) / 256.0, path.y)).xyz;
    vec3 b = texture2D(uPaths, vec2((min(lower + 1.0, 255.0) + 0.5) / 256.0, path.y)).xyz;
    return mix(a, b, fract(index));
  }
  void main() {
    vec3 origin = position;
    float envelope = starEnvelope;
    float visibility = starVisibility;
    if (path.z != 0.0) {
      float phase = path.x;
      #ifdef INTRO_GALAXY
        phase = fract(phase + uFlowTime * path.z);
      #endif
      float progress = phase + path.w * sin(phase * 6.28318530718) / 6.28318530718;
      vec3 tangent = samplePath(progress + 1.0 / 255.0)
        - samplePath(progress - 1.0 / 255.0);
      vec3 across = normalize(vec3(-tangent.y, tangent.x, 0.0));
      origin = samplePath(progress) + across * pathOffset.x + vec3(0.0, 0.0, pathOffset.y);
      envelope = mix(1.0, 0.14 + 0.86 * pow(max(sin(progress * 3.14159265359), 0.0), 0.68), 0.45);
      visibility = smoothstep(0.0, 0.055, progress) * (1.0 - smoothstep(0.945, 1.0, progress));
    }
    vRayStrength = smoothstep(1.45, 2.8, starBrightness);
    vRayScale = 1.0;
    vGlimmerStrength = 0.0;
    #ifdef DUST
      vBrightness = starBrightness;
      vOpacity = starOpacity * mix(visibility, 1.0, uScatter);
      vParticleDiameter = uPixelRatio * starScale;
    #else
      float twinkle = 0.86 + 0.14 * sin(twinklePhase + uTime * 0.62 * twinkleRate);
      envelope = mix(envelope, 1.0, uScatter);
      visibility = mix(visibility, 1.0, uScatter);
      float bright = smoothstep(1.35, 1.65, starBrightness);
      vBrightness = uIntensity * starBrightness * twinkle;
      vOpacity = starOpacity * visibility * (0.92 + twinkle * 0.08);
      vParticleDiameter = uPixelRatio
        * (0.35 + starScale * envelope * visibility * 3.8 * mix(0.95, 0.6, bright))
        * (0.97 + twinkle * 0.03);
    #endif
    float reveal = starBuildIn(fract(starScale * 0.61803398875));
    vOpacity *= smoothstep(0.0, 0.2, reveal);
    #ifdef INTRO_STAR
      vOpacity *= 1.0 - smoothstep(0.18, 0.4, uExpansion);
      float central = 1.0 - step(0.0001, length(origin));
      float coreSize = mix(4.5, 7.5, clamp(starScale * 0.25, 0.0, 1.0));
      vParticleDiameter = uPixelRatio * mix(coreSize, 6.0, central);
    #endif
    // Keep the same viewport-sized star population throughout the approach.
    #ifndef INTRO_STAR
    vOpacity *= ambientVisibility;
    #endif
    vParticleDiameter *= sqrt(reveal);
    vColor = starColor;
    vLens = 0.0;
    float diameter = max(vParticleDiameter, 4.0);
    vSpriteDiameter = diameter;
    vRushStretch = 1.0;
    vRushGlow = 0.0;
    #ifdef INTRO_GALAXY
      // Fly through the authored spiral toward the same focus as the bright core.
      // Virtual depth supplies perspective without changing the orthographic scene.
      vec4 galaxyFocus = viewMatrix * vec4(0.0, 1.2 * uExpansion, 0.0, 1.0);
      vec3 offset = mat3(modelMatrix) * origin;
      // Preserve the opening silhouette while giving each star its own approach speed.
      float depthSeed = fract(starScale * 0.754877666 + twinklePhase * 0.569840296);
      float startDepth = clamp(mix(7.0, 17.0, depthSeed) - offset.z * 1.5, 5.0, 19.0);
      float travelDepth = startDepth - uExpansion * 38.0;
      float approach = startDepth / max(1.5, travelDepth);
      vec4 galaxyPoint = galaxyFocus;
      galaxyPoint.xy += offset.xy * approach;
      galaxyPoint.z = -max(1.5, -galaxyFocus.z + travelDepth - 12.0);
      vOpacity = starOpacity * visibility * smoothstep(0.0, 0.2, reveal)
        * smoothstep(1.5, 5.0, travelDepth);
      #ifndef DUST
        vOpacity *= 1.0 - step(uGalaxyDensity, galaxyRank);
      #endif
      vParticleDiameter *= min(2.0, sqrt(approach));
      vSpriteDiameter = max(vParticleDiameter, 4.0);
      gl_PointSize = vSpriteDiameter;
      gl_Position = projectionMatrix * galaxyPoint;
      vec2 edge = abs(gl_Position.xy / gl_Position.w);
      vOpacity *= 1.0 - smoothstep(0.85, 1.08, max(edge.x, edge.y));
      // Fade departing arms before the measured artwork slot gives way to copy.
      float artworkBottom = 1.2 - uViewHeight * 0.5;
      vOpacity *= smoothstep(artworkBottom, artworkBottom + 0.75,
        1.2 * uExpansion + offset.y * approach);
      vRushDirection = vec2(1.0, 0.0);
      return;
    #endif
    #ifdef INTRO_STAR
      vSpriteDiameter = max(diameter, vParticleDiameter * 2.6);
      vRushStretch = 1.0;
    #endif
    gl_PointSize = vSpriteDiameter;
    // Keep the seeded direction fixed as the field approaches.
    vec2 center = vec2(0.0, 1.2);
    vec2 radial = origin.xy;
    float startRadius = length(radial);
    float endRadius = max(startRadius, length(destination.xy - center));
    vec2 direction = startRadius > 0.0001 ? radial / startRadius : vec2(0.0, 1.0);
    vec3 expanded = vec3(center + direction * endRadius, destination.z);
    // A wider horizontal volume keeps covering the viewport as it turns in depth.
    expanded.xz *= uFieldSpread;
    // Approach the settled positions directly, without morphing between star layouts.
    vec3 point = expanded;
    #ifdef INTRO_STAR
      // Turn a compact volume around a tilted axis so stars pass in front of one another.
      float orbit = uTime * 0.85;
      vec3 axis = normalize(vec3(0.3, 1.0, 0.25));
      vec3 orbitPoint = origin * cos(orbit) + cross(axis, origin) * sin(orbit)
        + axis * dot(axis, origin) * (1.0 - cos(orbit));
      // Keep the orbit compact while the growing sun covers it.
      point = orbitPoint;
      point.y += 1.2 * uExpansion;
    #endif
    vec4 world = modelMatrix * vec4(point, 1.0);
    vec4 viewPoint = viewMatrix * world;
    #ifdef FLYBY_STARS
      vec3 field = vec3(destination.x * uFieldSpread, destination.y, destination.z * uFieldSpread);
      viewPoint = viewMatrix * modelMatrix * vec4(field, 1.0);
    #endif
    vec4 focus = viewMatrix * vec4(0.0, 1.2 * uExpansion, 0.0, 1.0);
    #ifndef INTRO_STAR
      // Travel through distributed depths rather than expanding a central emitter.
      float depth = max(2.0, -viewPoint.z);
      float focusDepth = max(12.0, -focus.z);
      // Distant stars cover the edges; nearby stars travel farther during the approach.
      float distant = smoothstep(0.75, 1.1, depth / focusDepth);
      float distance = focusDepth * mix(2.8, 1.8, distant) * (1.0 - uExpansion);
      float perspective = mix(0.55 + distant * 0.3, 1.0, depth / (depth + distance));
      viewPoint.xy = focus.xy + (viewPoint.xy - focus.xy) * perspective;
      float motionRush = uRush * (1.0 - distant) * 0.1;
      #ifdef TRANSIT_STARS
        // A uniform volume keeps supplying stars across the view as we travel through it.
        float startDepth = 32.0 + destination.z * 150.0;
        // Both ends fade to zero before a star is recycled into the far volume.
        float travelDepth = 14.0 + mod(startDepth - 14.0 - uExpansion * 490.0, 168.0);
        vec2 halfView = vec2(uViewHeight * uViewportWidth / uViewportHeight, uViewHeight) * 0.65;
        // The scene camera is orthographic: project depth into screen travel explicitly.
        vec2 travelOffset = destination.xy * halfView * 110.0;
        viewPoint.xy = focus.xy + travelOffset / travelDepth;
        // Keep virtual far stars inside the scene's clip range, behind the bodies.
        viewPoint.z = -min(travelDepth, focusDepth + 1.0);
        perspective = min(2.6, 90.0 / travelDepth);
        // Short exposure trails follow projected speed, not just the reveal's brightness.
        vec2 velocity = (projectionMatrix * vec4(travelOffset, 0.0, 0.0)).xy
          * uTravelSpeed / (travelDepth * travelDepth);
        float pixelSpeed = length(velocity * vec2(uViewportWidth, uViewportHeight) * 0.5);
        motionRush = uRush * smoothstep(40.0, 600.0, pixelSpeed);
        vOpacity *= smoothstep(14.0, 60.0, travelDepth)
          * (1.0 - smoothstep(120.0, 182.0, travelDepth))
          * (1.0 - smoothstep(0.85, 1.0, uExpansion));
      #endif
      vParticleDiameter *= perspective;
      // Only nearby stars leave short exposure streaks during the fast approach.
      float rushLength = motionRush
        * (0.5 + 0.5 * fract(twinklePhase)) * float(RUSH_LENGTH) * uPixelRatio;
      // Preserve the reconstruction filter's four-pixel support even for distant stars.
      float rushDiameter = max(vParticleDiameter, 4.0);
      vSpriteDiameter = min(rushDiameter * 3.0, rushDiameter + rushLength);
      vRushStretch = vSpriteDiameter / rushDiameter;
      #ifndef DUST
        // Give the moving stars room for a halo without widening their sharp cores.
        vRushGlow = motionRush;
        vSpriteDiameter *= mix(1.0, float(RUSH_GLOW_EXTENT), vRushGlow);
        vBrightness *= 1.0 + vRushGlow * 1.2;
      #endif
      #ifdef TRANSIT_STARS
        // Reserve space behind the unchanged core for a short exposure of its motion.
        float exposureLength = min(float(TRANSIT_TRAIL_LIMIT), pixelSpeed * 0.085)
          * uRush * uPixelRatio;
        vRushStretch = 1.0 + 2.0 * exposureLength / max(vParticleDiameter, 1.0);
        vSpriteDiameter = max(vSpriteDiameter, 2.0 * exposureLength + rushDiameter * 2.0);
      #endif
      gl_PointSize = vSpriteDiameter;
    #endif
    gl_Position = projectionMatrix * viewPoint;
    #ifdef TRANSIT_STARS
      vec2 screenEdge = abs(gl_Position.xy / gl_Position.w);
      vOpacity *= 1.0 - smoothstep(0.85, 1.0, max(screenEdge.x, screenEdge.y));
    #endif
    #ifdef INTRO_STAR
      // Put the core behind the opaque bodies so the growing sun covers its glow.
      gl_Position.z = gl_Position.w * 0.999;
    #endif
    // Keep the short streaks aligned with the approach through the field.
    vec2 flight = (projectionMatrix * vec4(viewPoint.xy - focus.xy, 0.0, 0.0)).xy;
    flight *= vec2(uViewportWidth, -uViewportHeight);
    vRushDirection = length(flight) > 0.0001 ? normalize(flight) : vec2(1.0, 0.0);
    // Only the ambient field wraps sideways; passing stars recycle invisibly in depth.
    // Fade recycling back in for ambient motion and dragging after the reveal settles.
    #ifndef TRANSIT_STARS
    float halfSpan = 1.0 + gl_PointSize / (uPixelRatio * uViewportWidth);
    float screenX = gl_Position.x / gl_Position.w;
    if (abs(screenX) > halfSpan) vOpacity *= uWrapOpacity;
    gl_Position.x = (mod(screenX + halfSpan, 2.0 * halfSpan) - halfSpan) * gl_Position.w;
    #endif
  }
`,V=`
  uniform float uTime;
  varying float vParticleDiameter;
  varying float vSpriteDiameter;
  varying float vOpacity;
  void main() {
    vec2 pixel = (gl_PointCoord - 0.5) * vSpriteDiameter;
    float coreDiameter = vParticleDiameter * 0.55;
    float core = exp(-8.0 * dot(pixel, pixel) / max(coreDiameter * coreDiameter, 0.0001));
    float halo = exp(-3.5 * length(pixel) / max(coreDiameter, 0.001)) * 0.16;
    float alpha = (core + halo) * vOpacity;
    if (alpha <= 0.0) discard;
    float charge = smoothstep(0.1, 0.43, uTime);
    gl_FragColor = vec4(vec3(mix(0.12, 2.0, charge)), alpha);
  }
`;function U(e,t,a,o){let i=43758.5453*Math.sin(e*a+t*o);return i-Math.floor(i)}function N(e,t,a,o){let i=U(e,t,127.1,311.7)*Math.PI*2,r=2*U(t,a,269.5,183.3)-1,l=Math.cbrt(U(e,o,419.2,371.9)),n=Math.sqrt(Math.max(0,1-r*r));return[Math.cos(i)*n*l,r*l,Math.sin(i)*n*l]}function G(e){let t=R(0xb7e15162),a=R(0xc0ac29b7);return Array.from({length:e},()=>{let e=t()**2.4*.42,o=t()*Math.PI*2,i=[Math.cos(o)*e,Math.sin(o)*e*.72,(t()-.5)*.16],r=1-e/.42,l=1.2+2.8*r+.6*t(),n=r>.74?.99:a(),s=(.28+1.45*r+.45*t())*1.64,h=t()*Math.PI*2,c=.55+.45*t();return{position:i,sphere:N(0,h,s,l),brightness:l,color:n,opacity:.62+.38*r,scale:s,envelope:1,visibility:1,phase:h,rate:c,path:[0,0,0,0],offset:[0,0]}})}function H(e,t){return Array.from({length:t},(a,o)=>{let i=e[Math.floor(o*e.length/t)],r=N(o+1,i.phase,i.scale,i.brightness);return{...i,position:r,sphere:r,envelope:1,visibility:1,path:[0,0,0,0],offset:[0,0]}})}function W(e,t){let a=e.getPointAt(1).lengthSq()<e.getPointAt(0).lengthSq();return .8*I[t].speed*(a?1:-1)}e.s(["createUpdatesRenderer",0,function(e,i){let r,l,s,c,m=(s="full"===(l=(r=i.canUseWebGL())?i.getPostprocessing():"none"),c=0,s?c=5:"selective"===l&&(c=3),{antialias:r&&i.getAntialias(),postprocessing:l,bloomLevels:c,bloomResolutionScale:s||"selective"===l?.5:0}),g=i.shouldUseContinuousMotion(),S=new Set,D=!1,C=e=>(S.add(e),e);function F(){if(!D){for(let e of(D=!0,[...S].reverse()))try{e.dispose()}catch{}S.clear()}}try{let r,l,s,c="none"===m.postprocessing,k=C(new o.WebGLRenderer({canvas:e,alpha:!0,antialias:m.antialias,depth:!0,powerPreference:"high-performance"}));k.outputColorSpace=a.SRGBColorSpace,k.toneMapping=c?a.ACESFilmicToneMapping:a.NoToneMapping,k.setClearColor(0,0);let q=new a.Scene,j=new a.OrthographicCamera(-1,1,1,-1,.1,80),Y=new a.Group,$=new a.Group;q.add(Y),Y.add($);let K=function({own:e,profile:t}){let o=new a.Group,i=I.map(({strong:e})=>({stars:Math.round((e?220:170)*3.4),ambientStars:Math.round((e?220:170)*1.05),dust:Math.round((e?150:90)*.55)})),r=i.reduce((e,t)=>e+(t.stars+t.dust)*2,607),l=Math.min(1===t.tier?.75:1,t.getMaxParticleCount()/r),n=new O.SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg">${b.map(e=>`<path d="${e}"/>`).join("")}</svg>`),s=[],h=[],c=new Float32Array(256*I.length*4),m=new a.Vector3;n.paths.forEach((e,t)=>{let o=new P(e.subPaths[0],I[t].depth,1.4,.82*t);for(let e=0;e<256;e+=1)o.getPointAt(e/255,m),m.toArray(c,(256*t+e)*4);s.push(...function(e,t,o){let i,r=I[t],l=R(0x243f6a88^(t+1)*0x9e3779b9),n=R(0xa4093822^(t+1)*0x299f31d0),s=new a.Vector3,h=new a.Vector3,c=new a.Vector3,p=[],m=W(e,t);for(let u=0;u<o;u+=1){let o=l(),u=o+.57*Math.sin(o*Math.PI*2)/(2*Math.PI),f=Math.sin(u*Math.PI);e.getPointAt(u,s),e.getTangentAt(u,h).normalize(),c.set(-h.y,h.x,0).normalize();let d=.4*a.MathUtils.lerp(.3,1,f)*(.22+.78*l()),v=(l()+l()-1)*d,g=(l()+l()-1)*d*.65;s.addScaledVector(c,v),s.z+=g;let x=r.strong?.085:.055,y=l()<a.MathUtils.lerp(.22*x,x,f),w=(y?.85+1.25*l():.12+l()**2.4*.68)*2.05,M=(y?2+1.5*l():.56+.78*l())*(r.strong?1:.82),S=n(),b=.82+.16*l(),P=l()*Math.PI*2,R=.65+.7*l(),D={position:s.toArray(),sphere:N(o,P,w,M),brightness:M,color:S,opacity:b,scale:w,envelope:a.MathUtils.lerp(1,.14+.86*f**.68,.45),visibility:a.MathUtils.smoothstep(u,0,.055)*(1-a.MathUtils.smoothstep(u,.945,1)),phase:P,rate:R,path:[o,(t+.5)/I.length,m,.57],offset:[v,g]};p.push(D),(!i||w>i.scale)&&(i=D)}return i&&(i.scale=Math.max(i.scale,(r.strong?2.2:2.05)*2.05),i.brightness=Math.max(i.brightness,r.strong?3.35:2.85),i.color=u[t]),p}(o,t,Math.floor(i[t].stars*l))),h.push(...function(e,t,o){let i=I[t],r=R(0x9e3779b9^(t+1)*0x85ebca6b),l=new a.Vector3,n=new a.Vector3,s=new a.Vector3,h=[],c=W(e,t);for(let u=0;u<o;u+=1){let p=(u+.92*r())/o,m=(r()+r()+r())/3,f=.57>r()?m:p,d=Math.sin(f*Math.PI),v=a.MathUtils.lerp(1,.18+.82*d**.68,.45);e.getPointAt(f,l),e.getTangentAt(f,n).normalize(),s.set(-n.y,n.x,0).normalize();let g=.68>r(),x=(g?.03:.4)*v,y=(r()+r()-1)*x,w=(r()+r()-1)*x*.7;l.addScaledVector(s,y),l.z+=w;let M=r(),S=r()*(g?1:.72)*v,b=a.MathUtils.smoothstep(f,0,.07)*(1-a.MathUtils.smoothstep(f,.84,1))*(g?1:.72)*(.38+.58*r())*a.MathUtils.lerp(1,.3+.7*d,.45),P=.17*(i.strong?1.15:1),R=1-a.MathUtils.smoothstep(Math.abs(f-i.phase),.08*P,P),D=(i.phase-f+1)%1,C=Math.max(R**2,(1-a.MathUtils.smoothstep(D,0,.18))**2*.68);h.push({position:l.toArray(),sphere:N(f,M,S,b),brightness:2*(.16+C*(i.strong?1:.62)*3.6),color:.99,opacity:b*(.22+.78*C),scale:1+1.35*S+1.25*C,envelope:1,visibility:1,phase:0,rate:0,path:[f,(t+.5)/I.length,c,0],offset:[y,w]})}return h}(o,t,Math.floor(i[t].dust*l)))});let f=e(new a.DataTexture(c,256,I.length,a.RGBAFormat,a.FloatType));f.minFilter=f.magFilter=a.NearestFilter,f.generateMipmaps=!1,f.needsUpdate=!0;let d={uTime:{value:0},uFlowTime:{value:0},uGalaxyDensity:{value:1},uViewportWidth:{value:1},uViewportHeight:{value:1},uRush:{value:0},uTravelSpeed:{value:0},uWrapOpacity:{value:0},uFieldSpread:{value:1},uViewHeight:{value:1},uPaths:{value:f},uBuildIn:{value:0},uPixelRatio:{value:1},uExpansion:{value:0},uScatter:{value:0}},v="none"===t.getPostprocessing();function g(t,{isDust:i=!1,intensity:r=1.35,isFlyby:l=!1,isIntro:n=!1,isTransit:h=!1}={}){let c=e(new a.BufferGeometry),u=new Float32Array(3*t.length);t.forEach((e,t)=>{var a;let o;return a=3*t,o=p(e.color),void(u[a]=o.r,u[a+1]=o.g,u[a+2]=o.b)}),c.setAttribute("position",new a.BufferAttribute(new Float32Array(t.flatMap(e=>e.position)),3));let m=new a.BufferAttribute(new Float32Array(3*t.length),3);c.setAttribute("destination",m);let f=new a.BufferAttribute(new Float32Array(t.length).fill(1),1);if(c.setAttribute("ambientVisibility",f),t===s){let e=Float32Array.from(t,(e,a)=>a/t.length),o=R(5370206);for(let t=e.length-1;t>0;t--){let a=Math.floor(o()*(t+1));[e[t],e[a]]=[e[a],e[t]]}c.setAttribute("galaxyRank",new a.BufferAttribute(e,1))}for(let[e,o]of(c.setAttribute("starColor",new a.BufferAttribute(u,3)),c.setAttribute("path",new a.BufferAttribute(new Float32Array(t.flatMap(e=>e.path)),4)),c.setAttribute("pathOffset",new a.BufferAttribute(new Float32Array(t.flatMap(e=>e.offset)),2)),[["starBrightness","brightness"],["starOpacity","opacity"],["starScale","scale"],["starEnvelope","envelope"],["starVisibility","visibility"],["twinklePhase","phase"],["twinkleRate","rate"]]))c.setAttribute(e,new a.BufferAttribute(new Float32Array(t.map(e=>e[o])),1));let x=A;i?x=T:n&&(x=V);let y=e(new a.ShaderMaterial({vertexShader:E,fragmentShader:v?`${x.replace("void main()","void zoomLinearMain()")}
        void main() {
          zoomLinearMain();
          // Resolve subpixel coverage before tone mapping, like the bloom pipeline.
          gl_FragColor.rgb *= gl_FragColor.a;
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.a = max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b));
        }`:x,defines:{ZOOM_RUSH:1,RUSH_LENGTH:v?8:12,TRANSIT_TRAIL_LIMIT:v?24:44,RUSH_GLOW_EXTENT:v?1.8:2.4,...l?{FLYBY_STARS:1}:{},...h?{TRANSIT_STARS:1}:{},...i?{DUST:1}:{},...n?{INTRO_STAR:1}:{}},uniforms:{...d,uIntensity:{value:r}},blending:a.CustomBlending,blendEquation:a.AddEquation,blendSrc:v?a.OneFactor:a.SrcAlphaFactor,blendDst:a.OneFactor,blendEquationAlpha:a.AddEquation,blendSrcAlpha:a.OneFactor,blendDstAlpha:a.OneMinusSrcAlphaFactor,transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:v})),w=new a.Points(c,y);return w.frustumCulled=!1,o.add(w),{points:w,particles:t,destination:m,ambientVisibility:f}}let x=[g(s),g(h,{isDust:!0}),g(G(Math.floor(30*l)),{intensity:1.647})],y=new a.Group;for(let{points:t}of(y.name="intro-galaxy",y.rotation.y=63*Math.PI/180,o.add(y),x.slice(0,2))){let o=e(t.material.clone());o.defines={...o.defines,INTRO_GALAXY:1},o.uniforms=t.material.uniforms;let i=new a.Points(t.geometry,o);i.frustumCulled=!1,y.add(i)}let w=g(G(Math.max(1,Math.floor(17*l))).map((e,t)=>{let a=.105*(0!==t);return{...e,position:[e.sphere[0]*a,e.sphere[1]*a*1.15,e.sphere[2]*a],color:.99,opacity:1}}),{isIntro:!0});w.points.name="intro-galactic-core",w.points.rotation.y=63*Math.PI/180,x.push(w);let S=g(H(s,Math.floor(380*l)),{isFlyby:!0});S.points.name="flyby-stars",x.push(S);let D=R(0x6a09e667),C=Math.ceil(Math.floor(180*l)/60),F=g(H(s,Math.floor(180*l)).map((e,t)=>({...e,sphere:[(t%10+D())/5-1,(Math.floor(t/10)%6+D())/3-1,(Math.floor(t/60)+D())/C],scale:.65*e.scale})),{isTransit:!0,intensity:1});F.points.name="transit-stars",x.push(F);let _=i.reduce((e,t)=>e+Math.floor(t.ambientStars*l),0),L=_/(_+S.particles.length);return{group:o,count:x.reduce((e,t)=>e+t.particles.length,s.length+h.length),resize(e,t,a){let o=3.5*Math.min(a*e/t*1.12*.34,1.12*a*.4);d.uViewportWidth.value=e,d.uViewportHeight.value=t,d.uViewHeight.value=a;let{compression:i,heightScale:r}=M(e,t,a);d.uGalaxyDensity.value=Math.max(.8,(1-.2*i)*r);let l=Math.max(o,a*e/t*.7);d.uFieldSpread.value=l/o;let n=Math.min(1,e*o*t/(842956.8*a));for(let{particles:e,destination:t,ambientVisibility:a}of x){let i=e===S.particles,r=1;e===s?r=L*(_/s.length):i&&(r=L),e.forEach((l,s)=>{let h,c=(s+.5)*.61803398875%1;a.setX(s,+(c<n*r)),h=e===F.particles?l.sphere:i?[l.sphere[0]*o,1.2+l.sphere[1]*o,l.sphere[2]*o]:function(e,t,a){let o=e[0],i=e[1]-1.2,r=Math.hypot(o,i),l=r>1e-4?Math.atan2(i,o):0,n=t[0]*a,s=t[1]*a,h=Math.hypot(n,s),c=(h>1e-4?Math.atan2(s,n):l)-l,u=.1*Math.atan2(Math.sin(c),Math.cos(c)),p=Math.max(r/Math.cos(u),h),m=Math.sqrt(Math.max(a**2-p**2,0));return[Math.cos(l+u)*p,1.2+Math.sin(l+u)*p,Math.max(-m,Math.min(m,t[2]*a))]}(l.position,l.sphere,o),t.setXYZ(s,...h)}),t.needsUpdate=!0,a.needsUpdate=!0}return l},update(e,i,r,l=1,n=e,s=0){let h=t.shouldUseContinuousMotion();d.uFlowTime.value=h?n:0,d.uTime.value=h?n:0,d.uPixelRatio.value=r,d.uBuildIn.value=l,d.uExpansion.value=i,y.visible=i<.55&&h,w.points.visible=i<.4,F.points.visible=i<1&&h,d.uWrapOpacity.value=h?a.MathUtils.smoothstep(e,8.27,9.07):1,d.uRush.value=h?a.MathUtils.smoothstep(i,.03,.22)*(1-a.MathUtils.smoothstep(i,.65,.98)):0;let c=z(e/8.27),u=z((e+.01)/8.27);d.uTravelSpeed.value=h?490*Math.max(0,(u.expansion-c.expansion)/.01):0,d.uScatter.value=c.scatter;let p=h?Math.max(0,e-1.8):0,m=Math.min(p/1.2,1),f=p<1.2?1.2*(m**6-3*m**5+2.5*m**4):p-.6;o.rotation.y=-(63*Math.PI/180)-.018*f+(h?.314*s:0)}}}({own:C,profile:i});q.add(K.group);let X=function({own:e,profile:t,availableCount:o}){let i=1===t.tier?1700:2720,r=Math.max(0,Math.min(i+Math.round(2*i*.06),Math.floor(o))),l=R(0x5a91f04c),n=new Float32Array(3*r),s=new Float32Array(4*r),h=new Float32Array(4*r);for(let e=0;e<r;e++){let t=_[e],a=t?t[0]:l();e>=i&&(a=e%2==0?-(.06*a):1+.06*a);let o=t?t[1]:l(),r=!t&&.045>l(),c=.8+l()**2*1.8;t?c=4+2*l():r&&(c=2.5+3.5*l()),n.set([a-.5,.5-o,-(2*l())],3*e),s.set([c,t||r?.65+.3*l():.25+.6*l(),l()*Math.PI*2,.35+.3*l()],4*e);let u=l(),p=[.82,.9,1];!t&&u<.12?p=[1,.58,.3]:!t&&u<.3&&(p=[.35,.65,1]),h.set([...p,t?55+30*l():0],4*e)}let c=e(new a.BufferGeometry);c.setAttribute("position",new a.BufferAttribute(n,3)),c.setAttribute("star",new a.BufferAttribute(s,4)),c.setAttribute("tint",new a.BufferAttribute(h,4));let u={uTime:{value:0},uBuildIn:{value:0},uPixelRatio:{value:1},uImageScale:{value:1},uTravel:{value:0},uHalfView:{value:.5},uPixelToField:{value:5208333333333333e-19}},p="none"===t.getPostprocessing(),m=e(new a.ShaderMaterial({vertexShader:L,fragmentShader:p?`${B.replace("void main()","void backgroundLinearMain()")}
          void main() {
            backgroundLinearMain();
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`:B,uniforms:u,blending:a.CustomBlending,blendEquation:a.AddEquation,blendSrc:a.SrcAlphaFactor,blendDst:a.OneFactor,blendEquationAlpha:a.AddEquation,blendSrcAlpha:a.OneFactor,blendDstAlpha:a.OneMinusSrcAlphaFactor,transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:p})),f=new a.Points(c,m);f.frustumCulled=!1;let d=e(new a.PlaneGeometry(1.12,1,48,28)),v=d.getAttribute("position"),g=new Float32Array(3*v.count);for(let e=0;e<v.count;e++){let t=v.getX(e),a=v.getY(e),o=Math.min(1,Math.hypot(1.6*t,1.2*a))**1.8*(.65+.2*Math.sin(27*t+2*Math.sin(13*a))+.15*Math.sin(39*a-19*t));g.set([3e-4+.012*o,6e-4+.023*o,9e-4+.032*o],3*e)}d.setAttribute("color",new a.BufferAttribute(g,3));let x=new a.Mesh(d,e(new a.MeshBasicMaterial({vertexColors:!0,depthWrite:!1,transparent:!0,opacity:0})));x.position.z=-3;let y=new a.Group;return y.add(x,f),{group:y,points:f,resize(e,t,a,o,i){let r=Math.max(e/1920,t/1080);y.scale.set(1920*r,1080*r,1),y.position.set(0,a,-o),u.uImageScale.value=r*i/t,u.uHalfView.value=e/(2*y.scale.x),u.uPixelToField.value=t/(i*y.scale.x)},update(e,a,o,i=1,r=e){let l=t.shouldUseContinuousMotion();u.uTime.value=l?e:0,u.uPixelRatio.value=a,u.uBuildIn.value=i,x.material.opacity=i*i*(3-2*i),u.uTravel.value=l?(o+.06*r)*.18/y.scale.x:0}}}({own:C,profile:i,availableCount:i.getMaxParticleCount()-K.count});q.add(X.group);let Z=function({own:e,tierLow:t=!1}){let o=new a.Group;o.name="celestial-bodies";let i=new a.Group;i.name="sun";let r=new a.Group;r.name="moon",o.add(i,r);let l={sun:p(.58).clone(),moon:p(.08).clone()},n=new a.Color("#eef3f8"),s=new a.Vector3(-6,0,-4.5).normalize(),h={uRevealBrightness:{value:1},uWhiteHeat:{value:0},uColor:{value:l.sun},uSurfaceTime:{value:0},uBloomScale:{value:.5},uEclipse:{value:0},uDiamond:{value:0},uMoon:{value:new a.Vector3}},c={uRevealBrightness:{value:1},uSurfaceRadius:{value:.8474576271186441},uColor:{value:l.moon},uDirectional:{value:1},uLightDirection:{value:s.clone()}},u={blending:a.CustomBlending,blendEquation:a.AddEquation,blendSrc:a.SrcAlphaFactor,blendDst:a.OneFactor,blendEquationAlpha:a.AddEquation,blendSrcAlpha:a.OneFactor,blendDstAlpha:a.OneMinusSrcAlphaFactor};function m(e,a=!1){if(!t&&!a)return e;let o="";return t&&(o+=`
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      `),a&&(o+=`
        float coverage = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
        gl_FragColor = vec4(gl_FragColor.rgb / max(coverage, 0.00001), coverage);
      `),`${e.replace("void main()","void celestialLinearMain()")}
        void main() {
          celestialLinearMain();
          ${o}
        }`}let g=new a.Mesh(e(new a.SphereGeometry(1,t?32:64,t?24:48)),e(new a.ShaderMaterial({vertexShader:d,fragmentShader:m(x),uniforms:h,toneMapped:t})));g.name="sun-surface";let S=new a.Mesh(e(new a.PlaneGeometry(14,14)),e(new a.ShaderMaterial({vertexShader:y,fragmentShader:m(w,!0),uniforms:h,...u,transparent:!0,depthWrite:!1,toneMapped:t})));S.name="sun-corona",S.renderOrder=110,S.frustumCulled=!1,i.add(g,S);let b=e(function(){let e=new Uint8Array(131072),t=1729,o=()=>(t=Math.imul(t,1664525)+0x3c6ef35f>>>0)/0x100000000,i=Array.from({length:44},()=>{let e=2*o()-1,t=o()*Math.PI*2,a=Math.sqrt(1-e*e);return{x:a*Math.cos(t),y:e,z:a*Math.sin(t),radius:.025+.13*o()}});for(let t=0;t<128;t++){let o=t/127*Math.PI;for(let r=0;r<256;r++){let l=r/255*Math.PI*2,n=Math.sin(o)*Math.cos(l),s=Math.cos(o),h=Math.sin(o)*Math.sin(l),c=.65+Math.sin(13*n+7*h)*Math.sin(17*s-5*n)*.12+Math.sin(137*n+91*s)*Math.sin(113*h-67*s)*.07;for(let e of i){let t=Math.hypot(n-e.x,s-e.y,h-e.z)/e.radius;t<1.25&&(c+=-.18*Math.max(0,1-t*t)+.14*Math.exp(-Math.pow((t-.95)/.14,2)))}let u=Math.round(255*a.MathUtils.clamp(c,.2,.95)),p=(256*t+r)*4;e[p]=u,e[p+1]=u,e[p+2]=u,e[p+3]=255}}let r=new a.DataTexture(e,256,128,a.RGBAFormat);return r.wrapS=a.RepeatWrapping,r.magFilter=a.LinearFilter,r.minFilter=a.LinearMipmapLinearFilter,r.generateMipmaps=!0,r.needsUpdate=!0,r}()),P=e(new a.MeshStandardMaterial({color:n,map:b,bumpMap:b,roughness:1,metalness:0,toneMapped:t}));P.onBeforeCompile=f;let R=new a.Mesh(e(new a.SphereGeometry(1,t?48:96,t?32:64)),P);R.name="moon-surface";let D=new a.Mesh(e(new a.SphereGeometry(1,t?32:64,t?24:48)),e(new a.ShaderMaterial({vertexShader:d,fragmentShader:m(v),uniforms:c,...u,transparent:!0,depthWrite:!1,toneMapped:t})));D.name="moon-atmosphere",D.renderOrder=111;let C=new a.Object3D,T=new a.DirectionalLight(l.moon,24);T.name="moon-rim-light",T.position.copy(c.uLightDirection.value),T.target=C,r.add(R,D,C,T),o.add(new a.AmbientLight(l.moon,.025));let A=0,F=1,z=1,_=0,L=new a.Vector3,B=new a.Vector3,O=new a.Vector3;return{group:o,resize:function(e,t,a){let o=M(e,t,a);F=1.15*o.radius,z=1.1*o.radius,A=o.separation,_=o.centerOffset,g.scale.setScalar(F),S.scale.setScalar(F),R.scale.setScalar(z),D.scale.setScalar(1.18*z),P.bumpScale=.09*z},update:function(e,t,l){o.position.y=1.2*t.center;let u=_*(1-t.rotation);i.position.set(u-A*t.separation,0,-.8),r.position.set(u+A*t.separation,0,1.2);let p=r.position.x-i.position.x,m=r.position.z-i.position.z,f=(p*(s.z/s.x)-m)/Math.hypot(p,m);i.scale.setScalar(t.scale),r.scale.setScalar(t.scale),h.uSurfaceTime.value=4*e,h.uWhiteHeat.value=t.sunWhiteHeat,l.updateMatrixWorld(),i.getWorldPosition(L).applyMatrix4(l.matrixWorldInverse),r.getWorldPosition(B).applyMatrix4(l.matrixWorldInverse);let d=B.z>L.z,v=F*t.scale,g=function(e,t,o,i){if(!i||!Number.isFinite(e)||!Number.isFinite(t)||!Number.isFinite(o)||e<0||t<=0||o<=0)return{moonScale:1,darkening:0,corona:0,diamond:0};let r=e/t,l=1-a.MathUtils.smoothstep(r,.3,2),n=Math.max(o,1.02*t),s=a.MathUtils.lerp(1,n/o,l),h=r+1-o*s/t;return{moonScale:s,darkening:l,corona:1-a.MathUtils.smoothstep(h,.02,.38),diamond:a.MathUtils.smoothstep(h,0,.025)*(1-a.MathUtils.smoothstep(h,.08,.22))}}(Math.hypot(B.x-L.x,B.y-L.y),v,z*t.scale,d);r.scale.setScalar(t.scale*g.moonScale),r.updateWorldMatrix(!0,!1),O.subVectors(L,B).normalize(),O.z-=f,T.position.copy(O).add(B).applyMatrix4(l.matrixWorld),r.worldToLocal(T.position),c.uLightDirection.value.copy(T.position).normalize(),h.uEclipse.value=g.corona,h.uDiamond.value=g.diamond,h.uMoon.value.set((B.x-L.x)/v,(B.y-L.y)/v,d?z*g.moonScale/F:0);let x=1-g.darkening;c.uRevealBrightness.value=t.brightness**2*x,P.color.copy(n).multiplyScalar(t.brightness*x),T.intensity=24*x}}}({own:C,tierLow:c});if($.add(Z.group),!c){r=C(new t.EffectComposer(k,{depthBuffer:!0,frameBufferType:a.HalfFloatType,multisampling:0}));let e=C(new t.RenderPass(q,j));r.addPass(e),S.delete(e),l=C(new n({blendFunction:t.BlendFunction.ADD,intensity:.5,levels:m.bloomLevels,luminanceSmoothing:.18,luminanceThreshold:.62,mipmapBlur:!0,radius:.72}));let o=C(new t.ToneMappingEffect({mode:t.ToneMappingMode.ACES_FILMIC})),i=C(new t.EffectPass(j,l,o));S.delete(l),S.delete(o),r.addPass(i),S.delete(i),s=C(new h("full"===m.postprocessing?t.SMAAPreset.HIGH:t.SMAAPreset.MEDIUM));let c=C(new t.EffectPass(j,s));S.delete(s),r.addPass(c),S.delete(c)}let J=0,Q=0,ee=0,et=0,ea=0,eo=0,ei=0,er=0,el=!0,en=0;function U(e,t,a={height:t,centerY:t/2}){var o;let n,s;if(D)return;let h=function(e,t,a,o){let[i,r]=e.getDpr(),l=Number.isFinite(r)?Math.min(1.5,Math.max(.1,r)):1;void 0!==a&&void 0!==o&&Number.isFinite(a)&&Number.isFinite(o)&&a>0&&o>0&&(l=Math.min(l,Math.max(.5,Math.sqrt(24e5/(a*o)))));let n=Number.isFinite(i)?Math.min(l,Math.max(.1,i)):Math.min(l,1),s=Math.min(l,Math.max(n,Number.isFinite(t)?t:1));return Math.min(l,Math.max(.1,Math.floor(100*s)/100))}(i,window.devicePixelRatio,e,t),c=J!==e||Q!==t||ee!==h;if(!c&&et===a.height&&ea===a.centerY)return;J=e,Q=t,ee=h,et=a.height,ea=a.centerY,c&&(k.setDrawingBufferSize(e,t,h),r?.setSize(e,t,!1),l?.setSize(Math.max(1,Math.round(e*h*m.bloomResolutionScale)),Math.max(1,Math.round(t*h*m.bloomResolutionScale))));let{frameViewHeight:u,viewHeight:p,viewWidth:f,centerY:d}=(s=(n=e/a.height<.72?12.7:10.9)/a.height,{frameViewHeight:n,viewHeight:t*s,viewWidth:e*s,centerY:1.2+(a.centerY-t/2)*s}),v=K.resize(e,a.height,u),g=Math.max(12,v+2,.4*f+.3*p);j.left=-f/2,j.right=f/2,j.top=p/2,j.bottom=-p/2,j.far=Math.max(40,2*g+p),j.position.set(0,d,g),ei=d,j.lookAt(0,d,0),j.updateProjectionMatrix(),X.resize(f,p,d,v+4,t),Z.resize(e,a.height,u);let x=(o=a.height,M(e,o,u).separation);eo=Math.PI-Math.atan2(2*x*.7,2)}return U(Math.max(1,e.clientWidth),Math.max(1,e.clientHeight)),{ready:(async()=>{await s?.ready,D||await C(function({renderer:e,scene:t,camera:a,composer:o,onReady:i}){let r=Object.create(e);r.render=(t,a)=>{e.compile(t,a)};let l=e.getRenderTarget();try{if(o)for(let e of o.passes)e.enabled&&e.render(r,o.inputBuffer,o.outputBuffer,0,!1);else r.render(t,a)}finally{e.setRenderTarget(l)}let n=!1,s=0,h=()=>{},c=new Promise(e=>{h=e}),u=()=>{h(),i?.()},p=e.extensions.get("KHR_parallel_shader_compile");if(p){let t=e.getContext(),a=(e.info.programs??[]).map(({program:e})=>e),o=()=>{n||(a.every(e=>t.getProgramParameter(e,p.COMPLETION_STATUS_KHR))?u():s=requestAnimationFrame(o))};s=requestAnimationFrame(o)}else u();return{ready:c,dispose(){n||(n=!0,cancelAnimationFrame(s),h())}}}({renderer:k,scene:q,camera:j,composer:r})).ready})(),dispose:F,draw:function(e){var t;if(D)return;let a=g?Math.min(Math.max(0,e-en),.05):0;en=e;let o=(t=e=function(e,t=!0){return t?e+Math.min(e,7.499999999999999)*(1.1-1):8.25}(e,g),{starfield:Math.min(Math.max(t/.55,0),1),foreground:Math.min(Math.max((t-.1)/.33,0),1),revealElapsed:Math.max(0,t- -.020000000000000018)}),i=o.revealElapsed,l=z(i/8.27);j.position.x=l.camera.x,j.position.y=ei+l.camera.y;let n=eo*l.bodies.rotation;$.rotation.y=n,$.position.set(-.2*Math.sin(n),0,.2*(1-Math.cos(n))),Y.rotation.y+=(er-Y.rotation.y)*(1-Math.exp(-(el?5.5:14)*a)),K.update(i,l.expansion,ee,o.foreground,e,Y.rotation.y),X.update(i,ee,Y.rotation.y,o.starfield,e),Z.group.visible=l.expansion>0,Z.update(g?i:0,l.bodies,j),r?r.render(a):k.render(q,j)},resize:U,rotate(e){el=!1,er+=e},resetRotation(){el=!0,er=0}}}catch(e){throw F(),e}}],914469)}]);