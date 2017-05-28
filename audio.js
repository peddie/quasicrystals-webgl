// Audio utilities module.
var audio = (function() {

  var audioContext = null;
  var analyser = null;
  var freqrr = null;
  var mediaStreamSource = null;

  function setupAudio() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    // Disable some built in signal cleanup.
    var constraints = {
      audio: {
	mandatory: {
          googEchoCancellation: false,
          googAutoGainControl: false,
          googNoiseSuppression: false,
          googHighpassFilter: false
	},
	optional: []
      },
    };

    // Screw older browsers.
    if (navigator.mediaDevices === undefined ||
	navigator.mediaDevices.getUserMedia === undefined) {
      alert("Your browser's audio support is too old.");
      return;
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then(function(stream) {
	// Create an AnalyserNode from the stream.
	console.log('Got a stream.');
	mediaStreamSource = audioContext.createMediaStreamSource(stream);
	
	analyser = audioContext.createAnalyser();
	analyser.smoothingTimeConstant = 0.6;
	analyser.fftSize = 1024;
	mediaStreamSource.connect(analyser);
	freqarr = new Uint8Array(analyser.frequencyBinCount);
	console.log('Finished setting up audio stuff.');
      })
      .catch(function(err) {
	console.error('Stream generation failed, ' + err.name + ': ' + err.message);
      });
  }

  function calcBin(offset, count) {
    newbin = 0;
    for (i = offset; i < offset + count; i++)
      newbin += freqarr[i];
    newbin = newbin / (count * 255);
    return newbin;
  }

  function calcBins(bins) {
    if (analyser) {
      analyser.getByteFrequencyData(freqarr);
      bins[0] = calcBin(0, 5);
      bins[1] = calcBin(5, 6);
      bins[2] = calcBin(11, 13);
      bins[3] = calcBin(24, 488);
    }
  }
  
  return {
    setupAudio: setupAudio,
    calcBins: calcBins,
  };
})();



