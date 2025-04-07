import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let axesVAO;
let cubeVAO;
let finalTransform;
let rotationAngle = 0;
let currentTransformType = null;
let isAnimating = false;
let lastTime = 0;
let textOverlay; 

let earthOrbitAngle = 0;
let earthSpinAngle = 0;
let moonOrbitAngle = 0;
let moonSpinAngle = 0;


document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function drawSquare(transformMatrix, color) {
    shader.setMat4("u_transform", transformMatrix);
    gl.bindVertexArray(cubeVAO);

    // 정사각형은 단색이므로 color를 모든 정점에 동일하게 설정
    const colorData = new Float32Array([
        ...color, ...color, ...color, ...color
    ]);
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}


function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupAxesBuffers(shader) {
    axesVAO = gl.createVertexArray();
    gl.bindVertexArray(axesVAO);

    const axesVertices = new Float32Array([
        -0.8, 0.0, 0.8, 0.0,  // x축
        0.0, -0.8, 0.0, 0.8   // y축
    ]);

    const axesColors = new Float32Array([
        1.0, 0.3, 0.0, 1.0, 1.0, 0.3, 0.0, 1.0,  // x축 색상
        0.0, 1.0, 0.5, 1.0, 0.0, 1.0, 0.5, 1.0   // y축 색상
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function setupCubeBuffers(shader) {
    const cubeVertices = new Float32Array([
        -0.5,  0.5,  // 좌상단
        -0.5, -0.5,  // 좌하단
         0.5, -0.5,  // 우하단
         0.5,  0.5   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);


    cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shader.use();

    shader.setMat4("u_transform", mat4.create());
    gl.bindVertexArray(axesVAO);
    gl.drawArrays(gl.LINES, 0, 4);

    // 태양: 빨강
    const sun = mat4.create();
    mat4.rotate(sun, sun, rotationAngle, [0, 0, 1]);
    mat4.scale(sun, sun, [0.2, 0.2, 1]);
    drawSquare(sun, [1.0, 0.0, 0.0, 1.0]);

    // 지구 공전까지 matrix 따로 만듦
    const earthBaseMatrix = mat4.create();
    mat4.rotate(earthBaseMatrix, earthBaseMatrix, earthOrbitAngle, [0, 0, 1]);
    mat4.translate(earthBaseMatrix, earthBaseMatrix, [0.6, 0, 0]);

    // 지구: earthBaseMatrix + 지구 자전 + 지구 스케일
    const earth = mat4.clone(earthBaseMatrix);
    mat4.rotate(earth, earth, earthSpinAngle, [0, 0, 1]);
    mat4.scale(earth, earth, [0.1, 0.1, 1]);
    drawSquare(earth, [0.0, 1.0, 1.0, 1.0]); // 하늘색

    const moon = mat4.clone(earthBaseMatrix);
    mat4.rotate(moon, moon, moonOrbitAngle, [0, 0, 1]);
    mat4.translate(moon, moon, [0.2, 0, 0]);
    mat4.rotate(moon, moon, moonSpinAngle, [0, 0, 1]);
    mat4.scale(moon, moon, [0.05, 0.05, 1]);
    drawSquare(moon, [1.0, 1.0, 0.0, 1.0]); // 노랑

    gl.bindVertexArray(null);
}


function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    rotationAngle += Math.PI / 4 * deltaTime;         // Sun 자전: 45도/sec
    earthOrbitAngle += Math.PI / 6 * deltaTime;       // Earth 공전: 30도/sec
    earthSpinAngle += Math.PI * deltaTime;            // Earth 자전: 180도/sec
    moonOrbitAngle += Math.PI * 2 * deltaTime;        // Moon 공전: 360도/sec
    moonSpinAngle += Math.PI * deltaTime;             // Moon 자전: 180도/sec


    render();
    requestAnimationFrame(animate);
}


async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        finalTransform = mat4.create();
        
        shader = await initShader();
        setupAxesBuffers(shader);
        setupCubeBuffers(shader);
        
        shader.use();
        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
