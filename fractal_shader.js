var kFractalShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
precision mediump float;
#endif

precision mediump int;

const float kPi = 3.1415926535;

uniform int num_waves;
uniform int prec;
uniform int pow;
uniform float t;
uniform vec2 freq;
uniform vec2 res;
uniform vec2 center;
uniform vec3 speed;
uniform vec3 phase;
uniform sampler2D palette;
uniform int coloring;
uniform vec4 bins;

vec4 colormap(int cap, int iters) {
    float capfl = float(cap);
    float ifl = float(iters);
    float div = ifl / capfl;
    float s = sin(log(div));
    float c = cos(log(div));
    float tt = t / 100.0;
    float r = s + sin(tt * speed.x + phase.x);
    float g = c - cos(tt * speed.y + phase.y);
    float b = 0.5 * sin(tt * speed.z + phase.z) + 0.5;
    return vec4(r, g, b, 1.0);
}

vec4 bettermap(int cap, int iters, float x, float y) {
    float power = sqrt(bins.x*bins.x + bins.y*bins.y + bins.z*bins.z + bins.w*bins.w);
    float capfl = float(cap);
    float ifl = float(iters);
    if (coloring == 2 && iters < cap) {
        // sqrt of inner term removed using log simplification rules.
        float log_zn = log(x*x + y*y) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        // Rearranging the potential function.
        // Dividing log_zn by log(2) instead of log(N = 1<<8)
        // because we want the entire palette to range from the
        // center to radius 2, NOT our bailout radius.
        ifl = (ifl + 1.0 - nu) / (3.1415926535 * 2.0);
    } else if (coloring == 1) {
        ifl = log(ifl);
    } else if (coloring == 0) {
        ifl = log(ifl) - log(capfl);
    }

    float map = 0.5 + sin(ifl + bins.y*bins.y + bins.z*bins.z + t / 256.0) * 0.5;
    return texture2D(palette, vec2(map, 0.0));
}

vec4 iterate() {
    float x = 0.0;
    float y = 0.0;

    float x0 = (freq.x * (gl_FragCoord.x / res.x - 0.5) + center.x) * (3.5 / 2.0);
    float y0 = freq.x * (gl_FragCoord.y / res.y - 0.5) + center.y;

    const int cap = 200;
    int iter = 0;

    for (int i = 0; i < cap; i++) {
        iter = i;
        float xsq = x*x;
        float ysq = y*y;
        if (xsq + ysq > 4.0) {
            break;
        }
        float xtemp;
        if (pow == 4) {
            xtemp = xsq*xsq + ysq*ysq - 6.0*xsq*ysq + x0;
            y = 4.0*x*y*(xsq - ysq) + y0;
        } else if (pow == 3) {
            xtemp = xsq*x - 3.0*x*ysq + x0;
            y = 3.0*xsq*y - ysq*y + y0;
        } else {
            xtemp = xsq - ysq + x0;
            y = 2.0*x*y + y0;
        }
        x = xtemp;
    }

    return bettermap(cap, iter, x, y);
    // return colormap(cap, iter);
}

vec2 ds_set(float a) {
    vec2 z;
    z.x = a;
    z.y = 0.0;
    return z;
}

vec2 ds_add(vec2 dsa, vec2 dsb) {
    vec2 dsc;
    float t1, t2, e;

    t1 = dsa.x + dsb.x;
    e = t1 - dsa.x;
    t2 = ((dsb.x - e) + (dsa.x - (t1 - e))) + dsa.y + dsb.y;

    dsc.x = t1 + t2;
    dsc.y = t2 - (dsc.x - t1);
    return dsc;
}

vec2 ds_sub(vec2 dsa, vec2 dsb) {
    vec2 negb;
    negb.x = -dsb.x;
    negb.y = -dsb.y;
    return ds_add(dsa, negb);
}

vec2 ds_mul(vec2 dsa, vec2 dsb) {
    vec2 dsc;
    float c11, c21, c2, e, t1, t2;
    float a1, a2, b1, b2, cona, conb, split = 8193.;

    cona = dsa.x * split;
    conb = dsb.x * split;
    a1 = cona - (cona - dsa.x);
    b1 = conb - (conb - dsb.x);
    a2 = dsa.x - a1;
    b2 = dsb.x - b1;

    c11 = dsa.x * dsb.x;
    c21 = a2 * b2 + (a2 * b1 + (a1 * b2 + (a1 * b1 - c11)));

    c2 = dsa.x * dsb.y + dsa.y * dsb.x;

    t1 = c11 + c2;
    e = t1 - c11;
    t2 = dsa.y * dsb.y + ((c2 - e) + (c11 - (t1 - e))) + c21;

    dsc.x = t1 + t2;
    dsc.y = t2 - (dsc.x - t1);

    return dsc;
}

bool ds_gt(vec2 dsa, vec2 dsb) {
    if (dsa.x > dsb.x) {
        return true;
    } else if (dsa.x < dsb.x) {
        return false;
    } else if (dsa.y > dsb.y) {
        return true;
    }
    return false;
}

vec4 iterate_double() {
    vec2 x;
    x = vec2(0.0, 0.0);
    vec2 y;
    y = vec2(0.0, 0.0);

    vec2 x0 = ds_mul(ds_add(ds_mul(freq,
                                   ds_add(ds_mul(ds_set(gl_FragCoord.x),
                                                 ds_set(1.0/res.x)),
                                          ds_set(-0.5))),
                            ds_set(center.x)),
                     ds_mul(ds_set(3.5), ds_set(0.5)));
    vec2 y0 = ds_add(ds_mul(freq,
                            ds_add(ds_mul(ds_set(gl_FragCoord.y),
                                          ds_set(1.0/res.y)),
                                   ds_set(-0.5))),
                     ds_set(center.y));

    const int cap = 1000;
    int iter = 0;

    for (int i = 0; i < cap; i++) {
        iter = i;
        vec2 xsq = ds_mul(x, x);
        vec2 ysq = ds_mul(y, y);
        vec2 sqr = ds_add(xsq, ysq);
        if (ds_gt(sqr, ds_set(4.0))) {
            break;
        }
        vec2 xtemp = ds_add(ds_sub(xsq, ysq), x0);
        y = ds_add(ds_mul(ds_mul(ds_set(2.0),x),y),y0);
        x = xtemp;
    }

    return colormap(cap, iter);
}

void main() {
    if (prec != 1) {
        gl_FragColor = iterate_double();
    } else {
        gl_FragColor = iterate();
    }
}
`;
