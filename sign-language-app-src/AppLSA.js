import { Camera } from './Camera.js';
import { Canvas } from './Canvas.js';
import * as rec from './Recognition.js';
import { updateFPS } from "./fpsModule.js"; 

const camera = new Camera();
const canvas = new Canvas();

let keypoints = [];

// Load Networks
rec.loadPoseNet(poseDetection.SupportedModels.MoveNet, {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
});

rec.loadHandNet(handPoseDetection.SupportedModels.MediaPipeHands, {
  runtime: 'tfjs',
  modelType: 'lite'
});

rec.loadFaceNet(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
  runtime: 'tfjs',
  refineLandmarks: false
});

// Event Listeners
camera.getVideo().addEventListener('loadeddata', function() {
    runInference(canvas, camera);
    setTimeout(
      setInterval(function() {
        fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-type' : 'application/json'
          },
          body: JSON.stringify({
            keypoints: keypoints,
            timestamp: new Date().toLocaleString()
          })
        })
        .then((res) => res.json())
        .then((data) => console.log(data));
        keypoints = [];
      }, 5000)
    , 5000);
}, false);

const buttonStart = document.getElementById('btn-start-webcam');
buttonStart.addEventListener('click', function() { 
  document.getElementById('overlay').remove();
  countdown(document.getElementById('downcounter'), function() {
    camera.start(canvas);
  });
}, false);

const buttonStops = document.getElementById('btn-stops-webcam');
buttonStops.addEventListener('click', function() { 
  camera.stops();
}, false);

async function runInference(canvas, camera) {
  const image = camera.getVideo();

  const poses = await rec.estimatePoses(image, {flipHorizontal: false});
  const hands = await rec.estimateHands(image, {flipHorizontal: false});
  const faces = await rec.estimateFaces(image, {flipHorizontal: false});

  keypoints.push({
    posesKeypoints: poses, 
    handsKeypoints: hands,
    facesKeypoints: faces,
  });

  canvas.drawCameraFrame(camera);
  canvas.drawResultsPoses(poses);
  canvas.drawResultsHands(hands);
  canvas.drawResultsFaces(faces);

  updateFPS();

  requestAnimationFrame(() => runInference(canvas, camera));
}

function countdown( parent, callback ){
  
  // This is the function we will call every 1000 ms using setInterval
  
  function count(){

    if( paragraph ){
      
      // Remove the paragraph if there is one
      paragraph.remove();

    }

    if( texts.length === 0 ){
      
      // If we ran out of text, use the callback to get started
      // Also, remove the interval
      // Also, return since we dont want this function to run anymore.
      clearInterval( interval );
      callback();
      return;

    }
  
    // Get the first item of the array out of the array.
    // Your array is now one item shorter.
    var text = texts.shift();
  
    // Create a paragraph to add to the DOM
    // This new paragraph will trigger an animation
    paragraph = document.createElement("p");
    paragraph.textContent = text;
    paragraph.className = text + " nums";

    parent.appendChild( paragraph );

  }
  
  // These are all the text we want to display
  var texts = ['3', '2', '1'];
  
  // This will store the paragraph we are currently displaying
  var paragraph = null;
  
  // Initiate an interval, but store it in a variable so we can remove it later.
  var interval = setInterval( count, 1000 );

}