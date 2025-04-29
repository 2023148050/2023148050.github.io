// regularOctahedron.js

export class RegularOctahedron {
    constructor(gl) {
        this.gl = gl;

        // 정팔면체의 6개 정점: 위/아래 극점 + 중간에 정사각형 꼭짓점
        this.vertices = new Float32Array([
            0, 1, 0,     // 0: top
           -1, 0, 0,     // 1: left
            0, 0, 1,     // 2: front
            1, 0, 0,     // 3: right
            0, 0, -1,    // 4: back
            0, -1, 0     // 5: bottom
        ]);

        // 인덱스로 정의된 8개 삼각형 face
        this.indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 1,
            5, 2, 1,
            5, 3, 2,
            5, 4, 3,
            5, 1, 4
        ]);

        // 정점 개수만큼 텍스처 좌표 지정 (기본 래핑)
        this.texCoords = new Float32Array([
            0.5, 1.0,  // 0: top
            0.0, 0.5,  // 1: left
            0.5, 0.5,  // 2: front
            1.0, 0.5,  // 3: right
            0.5, 0.0,  // 4: back
            0.5, 0.0   // 5: bottom
        ]);

        this.setupBuffers();
    }

    setupBuffers() {
        const gl = this.gl;

        // VAO 생성 및 바인딩
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // 위치 속성: layout(location = 0)
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        // 텍스처 좌표 속성: layout(location = 3)
        this.texBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.texCoords, gl.STATIC_DRAW);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, 0);  // ✔ location 3
        gl.enableVertexAttribArray(3);                        // ✔ location 3

        // 인덱스 버퍼 바인딩
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null); // 바인딩 해제
    }

    draw(shader) {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
        console.log('[LOG] draw 호출됨');
    }
}
