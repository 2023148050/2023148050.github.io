// Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let camera;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 100);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const gui = new GUI();
const cameraFolder = gui.addFolder('Camera');
const cameraParams = { perspective: true };
cameraFolder.add(cameraParams, 'perspective').name('Use Perspective').onChange(val => {
  const aspect = window.innerWidth / window.innerHeight;
  if (val) {
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  } else {
    const frustumSize = 100;
    camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
  }
  camera.position.set(0, 50, 100);
  controls.object = camera;
  controls.update();
});

// Light
const ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 12, 8);
dirLight.castShadow = true;
scene.add(dirLight);

const textureLoader = new THREE.TextureLoader();

function createPlanet({ name, radius, distance, texture, rotationSpeed, orbitSpeed }) {
  const mat = new THREE.MeshStandardMaterial({
    map: textureLoader.load(texture)
  });
  const geo = new THREE.SphereGeometry(radius, 64, 64);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.x = distance;

  const pivot = new THREE.Object3D();
  pivot.add(mesh);
  scene.add(pivot);

  const speed = { rotationSpeed, orbitSpeed };
  const folder = gui.addFolder(name);
  folder.add(speed, 'rotationSpeed', 0, 0.1).name('Rotation Speed');
  folder.add(speed, 'orbitSpeed', 0, 0.1).name('Orbit Speed');

  return { mesh, pivot, speed };
}

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(10, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
sun.castShadow = false;
scene.add(sun);

const planets = [
  createPlanet({ name: 'Mercury', radius: 1.5, distance: 20, texture: 'Mercury.jpg', rotationSpeed: 0.02, orbitSpeed: 0.02 }),
  createPlanet({ name: 'Venus', radius: 3, distance: 35, texture: 'Venus.jpg', rotationSpeed: 0.015, orbitSpeed: 0.015 }),
  createPlanet({ name: 'Earth', radius: 3.5, distance: 50, texture: 'Earth.jpg', rotationSpeed: 0.01, orbitSpeed: 0.01 }),
  createPlanet({ name: 'Mars', radius: 2.5, distance: 65, texture: 'Mars.jpg', rotationSpeed: 0.008, orbitSpeed: 0.008 })
];

window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (camera.isPerspectiveCamera) {
    camera.aspect = aspect;
  } else {
    const frustumSize = 100;
    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
  }
  camera.updateProjectionMatrix();
});

function animate() {
  requestAnimationFrame(animate);
  planets.forEach(p => {
    p.mesh.rotation.y += p.speed.rotationSpeed;
    p.pivot.rotation.y += p.speed.orbitSpeed;
  });
  controls.update();
  stats.update();
  renderer.render(scene, camera);
}

animate();