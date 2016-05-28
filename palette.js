function create_rainbow(rmin, rmax, gmin, gmax, bmin, bmax) {
    var palette_dataf = new Float32Array([rmax, gmin, bmin, 1.0,
                                          rmax, gmax, bmin, 1.0,
                                          rmin, gmax, bmin, 1.0,
                                          rmin, gmax, bmax, 1.0,
                                          rmin, gmin, bmax, 1.0,
                                          rmax, gmin, bmax, 1.0]);
    return palette_dataf;
};

// mins and maxes are between 0 and 1.  phases wrap from 1 to 0.
function create_palette_1d(mins, maxes, phases, count) {
    var data = new Float32Array((count + 1) * 4);
    var ranges = [maxes[0] - mins[0],
		  maxes[1] - mins[1],
		  maxes[2] - mins[2]];
    var PI = 3.1415926535;

    for (i = 0; i < count + 1; i++) {
	var phase = i * 2 * PI / count;
	// R, G, B, A
	data[4*i]     = 0.5 * ranges[0] * Math.cos(2*PI*phase + phases[0])
	    + 0.5 + mins[0];
	data[4*i + 1] = 0.5 * ranges[1] * Math.cos(2*PI*(phase + phases[1] + 1/3))
	    + 0.5 + mins[1];
	data[4*i + 2] = 0.5 * ranges[2] * Math.cos(2*PI*(phase + phases[2] + 2/3))
	    + 0.5 + mins[2];
	data[4*i + 3] = 1.0;
    }

    return data;
};

// mins and maxes are between 0 and 1.  phases wrap from 1 to 0.  it
// is best if count is divisible by 6.
function create_rainbow_1d(mins, maxes, phases, count) {
    var data = new Float32Array((count + 1) * 4);
    var ranges = [maxes[0] - mins[0],
		  maxes[1] - mins[1],
		  maxes[2] - mins[2]];
    var PI = 3.1415926535;

    function flatcos(x) {
	while (x > 2 * PI) { x -= 2*PI; }
	while (x < 0) { x += 2*PI; }

	if (x < 2*PI / 3) { return 1.0; }
	if (x < PI) { return Math.cos(3 * (x - 2*PI / 3)); }
	if (x < 5*PI / 3) { return -1.0; }
	return Math.cos(3 * (x - 2*PI / 3));
    }

    for (i = 0; i < count + 1; i++) {
	var phase = i * 2 * PI / count;
	// R, G, B, A
	data[4*i]     = 0.5 * ranges[0] * flatcos(2*PI*(phase + phases[0]))
	    + 0.5 + mins[0];
	data[4*i + 1] = 0.5 * ranges[1] * flatcos(2*PI*(phase + phases[1] + 1/3))
	    + 0.5 + mins[1];
	data[4*i + 2] = 0.5 * ranges[2] * flatcos(2*PI*(phase + phases[2] + 2/3))
	    + 0.5 + mins[2];
	data[4*i + 3] = 1.0;
    }

    return data;
};