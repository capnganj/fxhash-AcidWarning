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
import { OutlinePass }from 'three/examples/jsm/postprocessing/OutlinePass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'


//1) - generate fxhash features - global driving parameters
//new featuresClass
let feet = new Features();
window.$fxhashData = feet;

// FX Features
window.$fxhashFeatures = {
  "Palette" : feet.color.inverted ? feet.color.name + " Invert" : feet.color.name,
  //"Noise": feet.noise.tag,
  "Background": feet.background.tag,
  //"Lights" : feet.lighting.invertLighting ? "Inverted" : "Palette",
  //"Align" : feet.lighting.doRotation ? "Center" : "North",
  //"Tops" : feet.lighting.darkTops ? "Light" : "Dark"
};
console.log(window.$fxhashFeatures);
//console.log(feet);

//vars related to fxhash preview call
//previewed tracks whether preview has been called
let previewed = false;

//from fxhash webpack boilerplate
// these are the variables you can use as inputs to your algorithms
//console.log(fxhash)   // the 64 chars hex number fed to your algorithm
//console.log(fxrand()) // deterministic PRNG function, use it instead of Math.random()
//console.log("fxhash features", window.$fxhashFeatures);


//2) Initialize three.js scene and start the render loop
//all data driving geometry and materials and whatever else should be generated in step 2




//global vars 
let controls, renderer, scene, camera, skullObj;
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
  camera.position.set( feet.map(fxrand(), 0, 1, -10, 10), 20, 37 );

  //lights
  const p1 = new THREE.DirectionalLight( );
  p1.intensity = 0.7
  p1.position.set( 6, 3, 6);
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

  const p2 = new THREE.DirectionalLight( );
  p2.intensity = 0.3
  p2.position.set( 9, 4, -4.5);
  p2.castShadow = true;
  p2.shadow.mapSize.width = 2048;
  p2.shadow.mapSize.height = 2048;
  p2.shadow.camera.left = -d;
  p2.shadow.camera.right = d;
  p2.shadow.camera.top = d;
  p2.shadow.camera.bottom = -d;
  p2.shadow.camera.far = 1000;
  //scene.add(p2)

  const invertLighting = feet.lighting.invertLighting; 
  const p3Col = invertLighting ? feet.invertColor(feet.interpolateFn(0.33)) : feet.interpolateFn(0.33);
  const p4Col = invertLighting ? feet.invertColor(feet.interpolateFn(0.66)) : feet.interpolateFn(0.66);
  const p3 = new THREE.DirectionalLight(
    new THREE.Color(p3Col.r/255, p3Col.g/255, p3Col.b/255),
    1.0
  )
  p3.position.set(1,0,0);
  const p4 = new THREE.DirectionalLight(
    new THREE.Color(p4Col.r/255, p4Col.g/255, p4Col.b/255),
    1.0
  )
  p4.position.set(-1,0,2);
  scene.add(p3);
  scene.add(p4);
  
  const amb = new THREE.AmbientLight( 0xcccccc, 0.2);
  scene.add(amb);


  // controls
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target = new THREE.Vector3(0, 10, 0)
  controls.enableDamping=true;
  controls.dampingFactor = 0.2;
  controls.autoRotate= true;
  controls.autoRotateSpeed = 0.1;
  controls.maxDistance = 50;
  controls.minDistance = 5;
  //controls.enableZoom = false;
  //controls.enablePan = false;
  //controls.enableRotate = false;
  //controls.autoRotate= true;
  //controls.autoRotateSpeed = -1.3;

  //geometry!

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(Skull, (skull) => {
    const sk = skull.scene;
    sk.castShadow = true;
    sk.receiveShadow = false;
    skullObj = sk;
    scene.add(sk);
    postprocessing.selectedObjects.push(skullObj)
  });
  

  //shadow plane
  const plnGeom = new THREE.PlaneGeometry(100,100);
  plnGeom.rotateX(Math.PI/-2);
  const plnCol = feet.lightenColor(feet.interpolateFn(0.01), 0.1);
  const shadowMat = new THREE.ShadowMaterial({opacity:0.5})
  const plnMesh = new THREE.Mesh(plnGeom, shadowMat);
  plnMesh.position.y = -4;
  plnMesh.receiveShadow = true;
  scene.add(plnMesh)
  

  //postporocessing stuff
  initPostprocessing();
  renderer.autoClear = false;


  //set up resize listener and let it rip!
  window.addEventListener( 'resize', onWindowResize );
  renderer.domElement.addEventListener( 'dblclick', toggleAutorotate);
  animate();
}


function initPostprocessing() {
  const sizer = computeCanvasSize()
  //renderrender
  const renderPass = new RenderPass( scene, camera);
  //renderer.toneMappingExposure = Math.pow( 0.1, 4)
  //halftone
  const params = {
    shape: 1,
    radius: feet.map(fxrand(), 0, 1, 20, 30),
    rotateR: Math.PI / 4,
    rotateB: Math.PI / 6,
    rotateG: Math.PI / 8,
    scatter: 0,
    blending: 0,
    blendingMode: 2,
    greyscale: false,
    disable: false
  };
  const halftonePass = new HalftonePass(sizer.w, sizer.h, params)
  const outlinePass = new OutlinePass(
    new THREE.Vector2(sizer.w, sizer.h),
    scene,
    camera,
    postprocessing.selectedObjects
  )
  outlinePass.edgeGlow = 2
  outlinePass.edgeThickness = 2
  outlinePass.edgeStrength = 2
  const inv = feet.invertColor(feet.background.value)
  outlinePass.visibleEdgeColor = new THREE.Color(inv.r/255, inv.g/255, inv.b/255)
  outlinePass.overlayMaterial.blending = THREE.NormalBlending
  const unrealPass = new UnrealBloomPass(new THREE.Vector2(sizer.w, sizer.h), 1, 0.5, 0.1)

  const composer = new EffectComposer( renderer );

  //render
  composer.addPass(renderPass);
  //outline pass
  //composer.addPass(outlinePass)
  //halftone pass
  composer.addPass(halftonePass)
  //unreal
  //composer.addPass(unrealPass)

  postprocessing.composer = composer;
}

function computeCanvasSize() {
  
  //get the window width and height
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  const smallEdgeSize = ((ww + wh)/2) * 0.05

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

  postprocessing.composer.render( scene, camera );

  if(previewed == false && renderer.info.render.frame > 1){
    fxpreview();
    previewed = true;
    //download();
  } 

}

function toggleAutorotate() {
  controls.autoRotate= !controls.autoRotate;
}

function download() {
  var link = document.createElement('a');
  link.download = 'FibonacciDos.png';
  link.href = document.getElementById('hashish').toDataURL()
  link.click();
}
