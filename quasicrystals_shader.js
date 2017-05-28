var kQuasicrystalsShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
precision mediump float;
#endif

precision mediump int;

const float kPi = 3.1415926535;
const int kMaxNumWaves = 22;

uniform int num_waves;
uniform float t;
uniform float freq;
uniform float ra;
uniform float ga;
uniform float ba;
uniform float ck;
uniform float co;
uniform vec2 res;
uniform vec4 bins;

vec4 waves() {
    float x = gl_FragCoord.x - 0.5 * res.x;
    float y = gl_FragCoord.y - 0.5 * res.y;

    float coses[kMaxNumWaves];
    float sines[kMaxNumWaves];

    float power = sqrt(bins.x*bins.x + bins.y*bins.y + bins.z*bins.z + bins.w*bins.w);

    for (int i = 0; i < kMaxNumWaves; ++i) {
        float angle = float(i) * kPi / float(num_waves);
        coses[i] = cos(angle);
        sines[i] = sin(angle);
        if (i == num_waves) break;
    }

    // Compute intensity over the sum of waves.
    float p = 0.0;
    for (int w = 0; w < kMaxNumWaves; ++w) {
        float cx = coses[w] * x;
        float sy = sines[w] * y;
        // vec4 phase_vec = texture1D(phases, (float(w) + 0.5) / float(kMaxNumWaves));
        float phase = t * 0.01 * float(w);
        p += 0.5 * (cos(freq * (cx + sy) + phase + power*power) + 1.0);
        if (w == num_waves) break;
    }

    float cc = cos(kPi * p);
    float ss = sin(kPi * p);
    float rr = cos(ra) * cc + sin(ra) * ss;
    float gg = cos(ga) * cc + sin(ga) * ss;
    float bb = cos(ba) * cc + sin(ba) * ss;
    float r = ck * 0.5 * rr + co;
    float g = ck * 0.5 * gg + co - bins.x * bins.z;
    float b = ck * 0.5 * bb + co;

    return vec4(r, g, b, 1.0);
}

void main() {
    gl_FragColor = waves();
}
`;
