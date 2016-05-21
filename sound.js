var audioContext = null;
var analyser = null;
var freqarr = null;
var mediaStreamSource = null;
function audio_setup() {
    // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    // grab an audio context
    audioContext = new AudioContext();

    // Attempt to get audio input
    try {
        // monkeypatch getUserMedia
        navigator.getUserMedia =
            navigator.mediaDevices.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

        // ask for an audio input
        navigator.getUserMedia({
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, didntGetStream);
    } catch (e) {
        alert('getUserMedia threw exception: ' + e);
    }
}
function didntGetStream() {
    console.error('Stream generation failed.');
}
function gotStream(stream) {
    // Create an AnalyserNode from the stream.
    console.log('Got a stream.');
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.6;
    analyser.fftSize = 1024;
    mediaStreamSource.connect(analyser);
    freqarr = new Uint8Array(analyser.frequencyBinCount);
    console.log('Finished setting up audio stuff.');
}
