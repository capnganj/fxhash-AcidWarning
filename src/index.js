//CAPNGANJ Acid Warning fxhash generative token
//August -> September, 2022

//imports
import { Features } from './Features';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Skull from './SKULL.glb';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass';


//1) - generate fxhash features - global driving parameters
//new featuresClass
let feet = new Features();
window.$fxhashData = feet;

// FX Features
window.$fxhashFeatures = {
  "Palette" : feet.color.inverted ? feet.color.name + " Invert" : feet.color.name,
  "Scatter": feet.pattern.scatterTag,
  "Pattern Size" : feet.pattern.sizeTag,
  "Background": feet.background.tag,
  "Pattern" : feet.pattern.anglesTag,
  "Sunlight" : feet.lightsAndCamera.lightsTag,
  "Camera": feet.lightsAndCamera.cameraTag
};
console.log(window.$fxhashFeatures);
//console.log(feet);

//vars related to fxhash preview call
//previewed tracks whether preview has been called
let previewed = false;
let loaded = false;

//from fxhash webpack boilerplate
// these are the variables you can use as inputs to your algorithms
//console.log(fxhash)   // the 64 chars hex number fed to your algorithm
//console.log(fxrand()) // deterministic PRNG function, use it instead of Math.random()
//console.log("fxhash features", window.$fxhashFeatures);


//2) Initialize three.js scene and start the render loop
//all data driving geometry and materials and whatever else should be generated in step 2




//global vars 
let controls, renderer, scene, camera, skullObj, firstAnimate
let rendererDiv, outerDiv, innerDiv;
let postprocessing = {selectedObjects: []}
init();

function init() {
  //scene & camera
  scene = new THREE.Scene();
  const sCol = new THREE.Color(feet.background.value.r/255, feet.background.value.g/255, feet.background.value.b/255);
  scene.background = sCol;
  //scene.fog = new THREE.Fog(sCol, 5, 26)

  renderer = new THREE.WebGLRenderer( { 
    antialias: true,
    alpha: true
  } );

  //renderer
  let w = computeCanvasSize()
  
  renderer.setSize( w.w-(w.nearEdgeOffset*2), (w.h-(w.nearEdgeOffset*2))/1.25);
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.shadowMap.enabled = true;
  renderer.domElement.id = "hashish";
  //renderer.domElement.style.backgroundColor = feet.background.value
  document.body.style.backgroundColor = 'rgb(38,38,38)'
  document.body.style.display = 'flex'
  document.body.style.justifyContent = 'center'
  document.body.style.alignItems = 'center'
  document.body.style.height = window.innerHeight.toString() + 'px'

  outerDiv = document.createElement('div')
  outerDiv.style.backgroundColor = 'white'
  outerDiv.style.display = 'flex'
  outerDiv.style.justifyContent = 'center'
  //outerDiv.style.alignItems = 'center'
  outerDiv.style.height = w.w.toString() + 'px'
  //outerDiv.style.add
  document.body.appendChild(outerDiv)
  outerDiv.id = "fxhashish"

  innerDiv = document.createElement('div')
  innerDiv.style.padding = w.nearEdgeOffset.toString() + 'px'
  outerDiv.appendChild(innerDiv)

  //renderer in frame
  //renderer.domElement.style.paddingTop = w.nearEdgeOffset.toString() + 'px'
  innerDiv.appendChild( renderer.domElement )
  rendererDiv = renderer.domElement


  //document.body.appendChild( renderer.domElement );

  //camera and orbit controls
  camera = new THREE.PerspectiveCamera( 60, w.w / (w.h/1.25), 0.01, 100 );
  //camera.aspect=w.w/w.h
  camera.updateProjectionMatrix()
  camera.position.set( feet.lightsAndCamera.cameraVal.x, feet.lightsAndCamera.cameraVal.y, 37 );

  // controls
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target = new THREE.Vector3(0, 10, 0)
  controls.enableDamping =true;
  controls.dampingFactor = 0.2;
  controls.autoRotateSpeed = 1.0;
  controls.maxDistance = 50;
  controls.minDistance = 18;

  //lights
  const p1 = new THREE.DirectionalLight( );
  p1.intensity = 0.6
  p1.position.set( feet.lightsAndCamera.lightsVal, 15, 15);
  p1.castShadow = true;
  p1.shadow.mapSize.width = 2048;
  p1.shadow.mapSize.height = 2048;
  const d = 15;
  p1.shadow.camera.left = -d;
  p1.shadow.camera.right = d;
  p1.shadow.camera.top = d;
  p1.shadow.camera.bottom = -d;
  p1.shadow.camera.far = 1000;
  scene.add(p1);

  //light colors
  const p3Col = feet.interpolateFn(0.15);
  const p4Col = feet.interpolateFn(0.66);
  const p5Col = feet.interpolateFn(0.33);
  const p6Col = feet.interpolateFn(0.85);
  
  const p3 = new THREE.DirectionalLight(
    new THREE.Color(p3Col.r/255, p3Col.g/255, p3Col.b/255),
    0.7
  )
  p3.position.set(10,1,10);
  const p4 = new THREE.DirectionalLight(
    new THREE.Color(p4Col.r/255, p4Col.g/255, p4Col.b/255),
    0.7
  )
  p4.position.set(10,1,-10);
  const p5 = new THREE.DirectionalLight(
    new THREE.Color(p5Col.r/255, p5Col.g/255, p5Col.b/255),
    0.7
  )
  p5.position.set(-10,-1,-10);
  const p6 = new THREE.DirectionalLight(
    new THREE.Color(p6Col.r/255, p6Col.g/255, p6Col.b/255),
    0.7
  )
  p6.position.set(-10,-1,10);
  
  scene.add(p3);
  scene.add(p4);
  scene.add(p5);
  scene.add(p6);
  
  const amb = new THREE.AmbientLight( 0xffffff, 0.4);
  scene.add(amb);


  //geometry!

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(Skull, (skull) => {
    const sk = skull.scene;
    sk.children[0].castShadow = true;
    sk.children[0].receiveShadow = false;
    skullObj = sk;
    scene.add(sk);
    postprocessing.selectedObjects.push(skullObj)
    loaded = true;
  });
  

  //postporocessing stuff
  initPostprocessing();
  renderer.autoClear = false;

  //animation controls and state
  firstAnimate = false;
  renderer.domElement.addEventListener( 'dblclick', toggleAutorotate);


  //set up resize listener and let it rip!
  window.addEventListener( 'resize', onWindowResize );
  
  animate();
}


function initPostprocessing() {
  const sizer = computeCanvasSize()
  //renderrender
  const renderPass = new RenderPass( scene, camera);
  //halftone
  const params = {
    shape: 4, //acid hits are square!  saving circles and lines for other projects...
    radius: feet.pattern.sizeVal,
    rotateR: feet.pattern.anglesVals.r , // all could be features...
    rotateB: feet.pattern.anglesVals.g,
    rotateG: feet.pattern.anglesVals.b,
    scatter: feet.pattern.scatterVal,
    blending: 0,
    blendingMode: 4,
    greyscale: false, //maybe for another project!
    disable: false
  };
  const halftonePass = new HalftonePass(sizer.w, sizer.h, params)
  

  const composer = new EffectComposer( renderer );

  //render
  composer.addPass(renderPass);
  //halftone pass
  composer.addPass(halftonePass)

  postprocessing.composer = composer;
}

function computeCanvasSize() {
  
  //get the window width and height
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  let smallEdgeSize = ((ww + wh)/2) * 0.05

  //return object to populate
  const ret = {}

  //we want to draw a rectangle with a border, as big as possible
  //does the horizontal dimension drive, or vertical
  if ( ww/wh >= 1 ) {
    //window is wide - let height drive
    ret.h = Math.round(wh - (smallEdgeSize * 2));
    ret.w = Math.round(ret.h * 1 );
  } else {
    //window is tall - let width drive
    ret.w = Math.round(ww - (smallEdgeSize * 2));
    ret.h = Math.round(ret.w / 1 );
  }

  smallEdgeSize = ret.w * 0.05
  
  ret.topPadding = (wh/2) - (ret.h/2)
  ret.nearEdgeOffset = smallEdgeSize

  return ret;
}


// threejs animation stuff
function onWindowResize() {

  let w = computeCanvasSize();

  camera.aspect = w.w / (w.h/1.25);
  camera.updateProjectionMatrix();
  renderer.setPixelRatio( window.devicePixelRatio);
 

  document.body.style.height = window.innerHeight.toString() + 'px'
  renderer.setSize( w.w-(w.nearEdgeOffset*2), (w.h-(w.nearEdgeOffset*2))/1.25);
  outerDiv.style.height = w.w.toString() + 'px'
  innerDiv.style.padding = w.nearEdgeOffset.toString() + 'px'

}

function animate() {

  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

  requestAnimationFrame( animate );
  render();

}

function render() {

  const seconds = performance.now() / 5555 ;
  if (seconds > 1 && !firstAnimate && !controls.autoRotate) {
    controls.autoRotate = true;
    firstAnimate = true
  }


  postprocessing.composer.render( scene, camera );

  if(previewed == false && loaded == true){
    fxpreview();
    previewed = true;
    download();
  } 

}

function toggleAutorotate() {
  controls.autoRotate = !controls.autoRotate;
}

function download() {
  var link = document.createElement('a');
  link.download = 'AcidWarning.png';
  link.href = document.getElementById('hashish').toDataURL()
  link.click();
}
