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
  "Dose Size" : feet.pattern.sizeTag,
  "Background": feet.background.tag,
  "Pattern" : feet.pattern.anglesTag,
  //"Align" : feet.lighting.doRotation ? "Center" : "North",
  //"Tops" : feet.lighting.darkTops ? "Light" : "Dark"
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
let controls, renderer, scene, camera, skullObj, animateSkull;
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

  //let div float in a frame and always be a horizontal rect
  let w = computeCanvasSize()
  renderer.setPixelRatio( w.w/w.h );
  renderer.setSize( w.w, w.h );
  renderer.shadowMap.enabled = true;
  //renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.domElement.id = "hashish";
  renderer.domElement.style.backgroundColor = feet.background.value
  document.body.style.backgroundColor = feet.background.value
  document.body.style.display = 'flex';
  document.body.style.justifyContent = 'center';
  document.body.style.alignItems = 'center'
  renderer.domElement.style.paddingTop = w.topPadding.toString() + 'px'
  
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 60, w.w / w.h, 0.01, 100 );
  //camera.position.set( feet.map(fxrand(), 0, 1, -10, 10), 20, 37 );
  camera.position.set( 0, 20, 37 );

  //lights
  const p1 = new THREE.DirectionalLight( );
  p1.intensity = 0.6
  p1.position.set( -15, 15, 15);
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


  const invertLighting = feet.lighting.invertLighting; 
  const p3Col = invertLighting ? feet.invertColor(feet.interpolateFn(0.85)) : feet.interpolateFn(0.15);
  const p4Col = invertLighting ? feet.interpolateFn(0.33) : feet.invertColor(feet.interpolateFn(0.66));
  const p5Col = invertLighting ? feet.invertColor(feet.interpolateFn(0.66)) : feet.interpolateFn(0.33);
  const p6Col = invertLighting ? feet.interpolateFn(0.15) : feet.invertColor(feet.interpolateFn(0.85));
  
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


  // controls
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target = new THREE.Vector3(0, 10, 0)
  controls.enableDamping=true;
  controls.dampingFactor = 0.2;
  //controls.autoRotate= true;
  controls.autoRotateSpeed = 1.0;
  controls.maxDistance = 50;
  controls.minDistance = 18;

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
  animateSkull = false;
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

  const smallEdgeSize = ((ww + wh)/2) * 0.02

  //return object to populate
  const ret = {}

  //we want to draw a horizontal golden rectangle with a border, as big as possible
  //does the horizontal dimension drive, or vertical
  if ( ww/wh >= 1 ) {
    //window is wide - let height drive
    ret.h = Math.round(wh - (smallEdgeSize * 2.5));
    ret.w = Math.round(ret.h);
  } else {
    //window is tall - let width drive
    ret.w = Math.round(ww - (smallEdgeSize * 2));
    ret.h = Math.round(ret.w);
  }

  
  ret.topPadding = (wh/2) - (ret.h/2)

  return ret;
}


// threejs animation stuff
function onWindowResize() {

  let w = computeCanvasSize();

  camera.aspect = w.w / w.h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio( w.w / w.h);
  renderer.setSize( w.w, w.h );

  renderer.domElement.style.paddingTop = w.topPadding.toString() + 'px'

}

function animate() {

  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

  requestAnimationFrame( animate );
  render();

}

function render() {

  if (animateSkull) {
	  const seconds = performance.now() / 500;
	  skullObj.children[0].rotation.z = feet.map(Math.cos(seconds / 4), -1, 1, -0.2, 0.2)
	  skullObj.children[0].rotation.x = feet.map(Math.cos(seconds), -1, 1, (-Math.PI/2) - 0.1, (-Math.PI/2) + 0.1 )
  }

  postprocessing.composer.render( scene, camera );

  if(previewed == false && loaded == true){
    fxpreview();
    previewed = true;
    //download();
  } 

}

function toggleAutorotate() {
  //controls.autoRotate = !controls.autoRotate;
  animateSkull = !animateSkull;
}

function download() {
  var link = document.createElement('a');
  link.download = 'AcidWarning.png';
  link.href = document.getElementById('hashish').toDataURL()
  link.click();
}
