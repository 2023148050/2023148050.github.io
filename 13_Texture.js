/*-----------------------------------------------------------------------------------
13_Texture.js (Modified for Regular Octahedron)

- Rendering a regular octahedron with perspective projection
- Rotating the octahedron using ArcBall interface
- Applying image texture ("sunrise.jpg") wrapped over all 8 faces
-----------------------------------------------------------------------------------*/

import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Arcball } from '../util/arcball.js';
import { loadTexture } from '../util/texture.js';
import { RegularOctahedron } from './regularOctahedron.js';

let canvas, gl;
let shader;
let isInitialized = false;
let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let axes, arcball, texture, octahedron;


document.addEventListener('DOMContentLoaded', () => {
    console.log('[LOG] DOMContentLoaded 실행됨');

    canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl2');

    if (isInitialized) {
        console.log('[LOG] 이미 초기화됨');
        return;
    }

    main().then(success => {
        console.log('[LOG] main() then 실행, 성공 여부:', success);
    }).catch(error => {
        console.error('[LOG] main() 에러:', error);
    });
});


function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    console.log('[LOG] render() 호출됨');

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    viewMatrix = arcball.getViewMatrix();

    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    octahedron.draw(shader);

    axes.draw(viewMatrix, projMatrix);
    requestAnimationFrame(render);
}


async function main() {
    console.log('[LOG] main() 시작');

    if (!initWebGL()) {
        console.error('[ERROR] WebGL 초기화 실패');
        return false;
    }

    console.log('[LOG] shader init 시작');
    await initShader();
    console.log('[LOG] shader init 완료');

    shader.use();

    console.log('[LOG] 카메라 & 모델 행렬 설정 완료');

    mat4.perspective(
        projMatrix,
        glMatrix.toRadian(60),
        canvas.width / canvas.height,
        0.1,
        1000.0
    );
    console.log('[LOG] 투영행렬 설정 완료');

    // WebGL 초기화 이후에 생성!
    octahedron = new RegularOctahedron(gl);

    texture = loadTexture(gl, true, 'sunrise.jpg');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    shader.setInt('u_texture', 0);
    console.log('[LOG] 텍스처 바인딩 완료');

    axes = new Axes(gl, 1.5);
    arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

    requestAnimationFrame(render);
    console.log('[LOG] 렌더 시작');
    return true;
}
