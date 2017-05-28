var kMaxNumWaves = 22;

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

var Quasicrystals = function() {
  audio.setupAudio();
  
  this.dt = 1.0;
  this.t = 0;
  this.freq = 0.2;
  this.n = 8;
  this.ra = 0;
  this.ga = 0.2 * Math.PI;
  this.ba = 0.5 * Math.PI;
  this.ck = 1.6;
  this.co = 0.7;

  this.bins = [ 0, 0, 0, 0 ];
}

Quasicrystals.prototype.keyhandler = function(e) {
  if (e.which == ','.charCodeAt(0)) this.dt = this.dt - 0.1;
  else if (e.which == '.'.charCodeAt(0)) this.dt = this.dt + 0.1;
  else if (e.which == '-'.charCodeAt(0)) this.freq = this.freq*1.1;
  else if (e.which == '='.charCodeAt(0)) this.freq = this.freq*0.909;
  else if (e.which == '['.charCodeAt(0)) this.n = Math.max(this.n - 1, 1);
  else if (e.which == ']'.charCodeAt(0)) this.n = Math.min(this.n + 1, kMaxNumWaves);
  else if (e.which == 'r'.charCodeAt(0)) this.ra = this.ra - Math.PI / 16.0;
  else if (e.which == 'R'.charCodeAt(0)) this.ra = this.ra + Math.PI / 16.0;
  else if (e.which == 'g'.charCodeAt(0)) this.ga = this.ga - Math.PI / 16.0;
  else if (e.which == 'G'.charCodeAt(0)) this.ga = this.ga + Math.PI / 16.0;
  else if (e.which == 'b'.charCodeAt(0)) this.ba = this.ba - Math.PI / 16.0;
  else if (e.which == 'B'.charCodeAt(0)) this.ba = this.ba + Math.PI / 16.0;
  else if (e.which == 'k'.charCodeAt(0)) this.ck = Math.max(this.ck - 0.05, 0);
  else if (e.which == 'K'.charCodeAt(0)) this.ck = Math.min(this.ck + 0.05, 10);
  else if (e.which == 'o'.charCodeAt(0)) this.co = Math.max(this.co - 0.05, 0);
  else if (e.which == 'O'.charCodeAt(0)) this.co = Math.min(this.co + 0.05, 10);
  else if (e.which == '?'.charCodeAt(0)) toggleHelp();
  else if (e.which == '/'.charCodeAt(0)) toggleHelp();
  console.log(this.ra, this.ga, this.ba, this.ck, this.co);
};

Quasicrystals.prototype.draw = function(gl, program, vertexPosBuffer) {
  gl.uniform1f(program.freq, this.freq);
  gl.uniform1f(program.t, this.t);
  gl.uniform1i(program.num_waves, this.n);
  gl.uniform1f(program.ra, this.ra);
  gl.uniform1f(program.ga, this.ga);
  gl.uniform1f(program.ba, this.ba);
  gl.uniform1f(program.ck, this.ck);
  gl.uniform1f(program.co, this.co);
  audio.calcBins(this.bins);
  gl.uniform4f(program.bins, this.bins[0], this.bins[1], this.bins[2], this.bins[3]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPosBuffer.numItems);
}

Quasicrystals.prototype.animate = function() {
  this.t += this.dt;
}

function main() {
  // If the browser doesn't even know what WebGL is, redirect.
  if (!window.WebGLRenderingContext) {
    window.location = "http://get.webgl.org";
  }

  // Setup WebGL.
  var c = document.getElementById('c');
  var gl = c.getContext('webgl');
  if (!gl) {
    window.location = "http://get.webgl.org/troubleshooting";
  }
  var vertexPosBuffer = screenQuad(gl);

  // Setup our shader.
  var program = createProgram(gl, kTrivialVertexShader, kQuasicrystalsShader);
  gl.useProgram(program);
  program.vertexPosAttrib = gl.getAttribLocation(program, 'aVertexPosition');
  program.freq = gl.getUniformLocation(program, 'freq');
  program.res = gl.getUniformLocation(program, 'res');
  program.t = gl.getUniformLocation(program, 't');
  program.ra = gl.getUniformLocation(program, 'ra');
  program.ga = gl.getUniformLocation(program, 'ga');
  program.ba = gl.getUniformLocation(program, 'ba');
  program.ck = gl.getUniformLocation(program, 'ck');
  program.co = gl.getUniformLocation(program, 'co');
  program.bins = gl.getUniformLocation(program, 'bins');
  program.num_waves = gl.getUniformLocation(program, 'num_waves');
  gl.enableVertexAttribArray(program.vertexPosArray);
  gl.vertexAttribPointer(program.vertexPosAttrib, vertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Thanks, Erika!
  function setsize() {
    c.width = $(window).width();
    c.height = $(window).height();
    gl.uniform2f(program.res, c.width, c.height);
    gl.viewport(0, 0, c.width, c.height);
  };

  $(window).on('resize', setsize);
  $(window).on('load', setsize);

  quasicrystals = new Quasicrystals();
  document.onkeypress = function(e) { quasicrystals.keyhandler(e) };

  function mainLoop() {
    window.requestAnimationFrame(mainLoop);
    quasicrystals.draw(gl, program, vertexPosBuffer);
    quasicrystals.animate();
  }

  mainLoop();

  toggleHelp();
  $("#helpButton").click(function () {
    toggleHelp();
  });
}

main();
