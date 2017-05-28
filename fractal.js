var helpTimer;
var helpShown = false;
function toggleHelp() {
  if (helpTimer) clearTimeout(helpTimer);
  if (helpShown) {
    helpShown = false;
    $("#help").hide();
  } else {
    $("#help").show();
    helpShown = true;
    helpTimer = setTimeout(function () {
      $("#help").fadeOut(1000);
      helpShown = false;
    }, 4000);
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
};

function setupTextureFilteringAndMips(gl, width, height) {
  if (isPowerOf2(width) && isPowerOf2(height)) {
    // the dimensions are power of 2 so generate mips and turn on
    // tri-linear filtering.
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  } else {
    // at least one of the dimensions is not a power of 2 so set the filtering
    // so WebGL will render it.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
};

function textureFromFloats(gl,width,height,float32Array) {
  var oldActive = gl.getParameter(gl.ACTIVE_TEXTURE);
  gl.activeTexture(gl.TEXTURE15); // working register 31, thanks.

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                width, height, 0,
                gl.RGBA, gl.FLOAT, float32Array);

  setupTextureFilteringAndMips(gl, width, height);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);

  gl.activeTexture(oldActive);

  return texture;
};

var Fractal = function() {
  audio.setupAudio();
  
  this.palettesize = 6;  
  this.prec = 1;
  this.pow = 0;
  this.dt = 1.0;
  this.olddt = 0.0;
  this.t = 0;
  this.ncolors = 3;
  this.coloring = 0;
  this.freq = 1.0;
  this.n = 8;
  this.x = 0.0;
  this.x_ = 0.0;
  this.y = 0.0;
  this.y_ = 0.0;
  this.rmin = 0.0;
  this.gmin = 0.0;
  this.bmin = 0.0;
  this.rmax = 1.0;
  this.gmax = 1.0;
  this.bmax = 1.0;
  this.rphase = 0.0;
  this.gphase = 0.0;
  this.bphase = 0.0;

  this.bins = [ 0, 0, 0, 0 ];
}

Fractal.prototype.keyhandler = function(e) {
  if (e.which == ','.charCodeAt(0)) this.dt = this.dt - 0.1;
  else if (e.which == '.'.charCodeAt(0)) this.dt = this.dt + 0.1;
  else if (e.which == '-'.charCodeAt(0)) this.freq = this.freq*1.1;
  else if (e.which == '_'.charCodeAt(0)) this.freq = this.freq*1.1;
  else if (e.which == ']'.charCodeAt(0)) this.pow = (this.pow + 1) % 3;
  else if (e.which == '['.charCodeAt(0)) this.pow = (this.pow - 1) % 3;
  else if (e.which == '}'.charCodeAt(0)) this.pow = (this.pow + 1) % 3;
  else if (e.which == '{'.charCodeAt(0)) this.pow = (this.pow - 1) % 3;
  else if (e.which == '='.charCodeAt(0)) this.freq = this.freq*0.909;
  else if (e.which == '+'.charCodeAt(0)) this.freq = this.freq*0.909;
  else if (e.which == 'p'.charCodeAt(0)) this.prec = 1;
  else if (e.which == 'P'.charCodeAt(0)) this.prec = 2;
  else if (e.which == 't'.charCodeAt(0)) {
    this.rmax -= 0.05;
    if (this.rmax < this.rmin) this.rmax = this.rmin;
  } else if (e.which == 'T'.charCodeAt(0)) {
    this.rmax += 0.05;
    if (this.rmax > 1.0) this.rmax = 1.0;
  } else if (e.which == 'h'.charCodeAt(0)) {
    this.gmax -= 0.05;
    if (this.gmax < this.gmin) this.gmax = this.gmin;
  } else if (e.which == 'H'.charCodeAt(0)) {
    this.gmax += 0.05;
    if (this.gmax > 1.0) this.gmax = 1.0; }
  else if (e.which == 'n'.charCodeAt(0)) {
    this.bmax -= 0.05;
    if (this.bmax < this.bmin) this.bmax = this.bmin;
  } else if (e.which == 'N'.charCodeAt(0)) {
    this.bmax += 0.05;
    if (this.bmax > 1.0) this.bmax = 1.0;
  } else if (e.which == 'e'.charCodeAt(0)) {
    this.rmin -= 0.05;
    if (this.rmin < 0.0) this.rmin = 0.0;
  } else if (e.which == 'E'.charCodeAt(0)) {
    this.rmin += 0.05;
    if (this.rmin > this.rmax) this.rmin = this.rmax;
  } else if (e.which == 'f'.charCodeAt(0)) {
    this.gmin -= 0.05;
    if (this.gmin < 0.0) this.gmin = 0.0;
  } else if (e.which == 'F'.charCodeAt(0)) {
    this.gmin += 0.05;
    if (this.gmin > this.gmax) this.gmin = this.gmax;
  } else if (e.which == 'v'.charCodeAt(0)) {
    this.bmin -= 0.05;
    if (this.bmin < 0.0) this.bmin = 0.0;
  } else if (e.which == 'V'.charCodeAt(0)) {
    this.bmin += 0.05;
    if (this.bmin > this.bmax) this.bmin = this.bmax;
  } else if (e.which == 'r'.charCodeAt(0)) {
    this.rphase -= 0.05;
    if (this.rphase < 0.0) this.rphase = 1.0 - this.rphase;
  } else if (e.which == 'R'.charCodeAt(0)) {
    this.rphase += 0.05;
    if (this.rphase > 1.0) this.rphase = this.rphase - 1.0;
  } else if (e.which == 'g'.charCodeAt(0)) {
    this.gphase -= 0.05;
    if (this.gphase < 0.0) this.gphase = 1.0 - this.gphase;
  } else if (e.which == 'G'.charCodeAt(0)) {
    this.gphase += 0.05;
    if (this.gphase > 1.0) this.gphase = this.gphase - 1.0;
  } else if (e.which == 'b'.charCodeAt(0)) {
    this.bphase -= 0.05;
    if (this.bphase < 0.0) this.bphase = 1.0 - this.bphase;
  } else if (e.which == 'B'.charCodeAt(0)) {
    this.bphase += 0.05;
    if (this.bphase > 1.0) this.bphase = this.bphase - 1.0;
  } else if (e.which == 'c'.charCodeAt(0)) this.coloring = (this.coloring + 1) % this.ncolors;
  else if (e.which == 'C'.charCodeAt(0)) this.coloring = (this.coloring - 1) % this.ncolors;
  else if (e.which == '?'.charCodeAt(0)) toggleHelp();
  else if (e.which == '/'.charCodeAt(0)) toggleHelp();
  else if (e.which == ' '.charCodeAt(0)) {
    if (this.olddt == 0.0) {
      this.olddt = this.dt;
      this.dt = 0.0;
    } else {
      this.dt = this.olddt;
      this.olddt = 0.0;
    }
  }
  console.log(this.dt, this.freq, this.x, this.y, e.which, e.keyCode);
};

Fractal.prototype.arrowhandler = function(e) {
  if (e.which == 37) this.x -= 0.1 * this.freq;
  else if (e.which == 38) this.y += 0.1 * this.freq;
  else if (e.which == 39) this.x += 0.1 * this.freq;
  else if (e.which == 40) this.y -= 0.1 * this.freq;
  else if (e.which == 33) { this.x = 0; this.y = 0; }
  else if (e.which == 34) { this.x = 0; this.y = 0; this.freq = 1.0; }
  console.log(this.dt, this.freq, this.x, this.y, e.which, e.keyCode);
};

Fractal.prototype.draw = function(gl, program, vertexPosBuffer) {
  // Color palette is supplied as a texture
  var textureUnit = 15;
  var palette_data = create_rainbow_1d([this.rmin, this.gmin, this.bmin],
				       [this.rmax, this.gmax, this.bmax],
				       [this.rphase, this.gphase, this.bphase],
				       50);
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  var palette_texture = textureFromFloats(gl, this.palettesize, 1, palette_data);
  gl.bindTexture(gl.TEXTURE_2D, palette_texture);

  var f32 = new Float32Array(1);
  f32[0] = this.freq;
  gl.uniform2f(program.freq, this.freq, this.freq-f32[0]);
  gl.uniform1f(program.t, this.t);
  gl.uniform1i(program.num_waves, this.n);
  gl.uniform1i(program.prec, this.prec);
  gl.uniform1i(program.pow, this.pow + 2);
  gl.uniform2f(program.center, this.x, this.y);
  gl.uniform1i(program.palette, textureUnit);
  gl.uniform1i(program.coloring, this.coloring);
  audio.calcBins(this.bins);
  gl.uniform4f(program.bins, this.bins[0], this.bins[1], this.bins[2], this.bins[3]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPosBuffer.numItems);
}

Fractal.prototype.animate = function() {
  this.t += this.dt;
}

function main() {
  // If the browser doesn't even know what WebGL is, redirect.
  if (!window.WebGLRenderingContext) {
    window.location = "http://get.webgl.org";
  }

  // Setup WebGL
  var c = document.getElementById('c');
  var gl = c.getContext('webgl');
  if (!gl) {
    alert("Your browser won't work; I need WebGL!")
    window.location = "http://get.webgl.org/troubleshooting";
  }
  if (!gl.getExtension("OES_texture_float")) {
    alert("Your browser won't work; I need OES_texture_float in WebGL.");
    window.location = "http://get.webgl.org/troubleshooting";
  }
  if (!gl.getExtension("OES_texture_float_linear")) {
      alert("Your browser won't work; I need OES_texture_float_linear in WebGL.");
    console.log("fuck");
    window.location = "http://get.webgl.org/troubleshooting";
  }
  var vertexPosBuffer = screenQuad(gl);

  var program = createProgram(gl, kTrivialVertexShader, kFractalShader);
  gl.useProgram(program);
  gl.bindAttribLocation(program, 0, 'aVertexPosition');
  program.vertexPosAttrib = gl.getAttribLocation(program, 'aVertexPosition');
  program.freq = gl.getUniformLocation(program, 'freq');
  program.res = gl.getUniformLocation(program, 'res');
  program.t = gl.getUniformLocation(program, 't');
  program.center = gl.getUniformLocation(program, 'center');
  program.prec = gl.getUniformLocation(program, 'prec');
  program.pow = gl.getUniformLocation(program, 'pow');
  program.speed = gl.getUniformLocation(program, 'speed');
  program.phase = gl.getUniformLocation(program, 'phase');
  program.palette = gl.getUniformLocation(program, 'palette');
  program.coloring = gl.getUniformLocation(program, 'coloring');
  program.bins = gl.getUniformLocation(program, 'bins');
  gl.vertexAttribPointer(program.vertexPosAttrib, vertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  // Thanks, Erika!
  function setsize() {
    c.width = $(window).width();
    c.height = $(window).height();
    gl.uniform2f(program.res, c.width, c.height);
    gl.viewport(0, 0, c.width, c.height);
  };

  $(window).on('resize', setsize);
  $(window).on('load', setsize);

  fractal = new Fractal();
  document.onkeypress = function(e) { fractal.keyhandler(e) };
  document.onkeydown = function(e) { fractal.arrowhandler(e) };

  function mainLoop() {
    window.requestAnimationFrame(mainLoop);
    fractal.draw(gl, program, vertexPosBuffer);
    fractal.animate();
  }

  mainLoop();

  toggleHelp();
  $("#helpButton").click(function () {
    toggleHelp();
  });
}

main();
