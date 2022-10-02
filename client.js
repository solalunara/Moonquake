window.onload = main;
///<reference path="./math.ts" />
var vsSource = "\nattribute vec4 aVertexPosition;\nattribute vec2 aTextureCoord;\nvarying highp vec2 vTextureCoord;\n\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\n\nvoid main() {\n  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;\n  vTextureCoord = aTextureCoord;\n}\n";
var fsSource = "\nvarying highp vec2 vTextureCoord;\nuniform sampler2D tex;\nvoid main() {\n  gl_FragColor = texture2D( tex, vTextureCoord );\n}\n";
function GetMatrix(t) {
    var m = Identity();
    m = Scale(m, t.scl);
    m = MatMultiply(m, t.rot);
    m = Translate(m, t.pos);
    return m;
}
function CreateMesh(gl, verts) {
    var fa = new Float32Array(verts.length);
    for (var i = 0; i < verts.length; ++i)
        fa[i] = verts[i];
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fa, gl.STATIC_DRAW);
    return {
        ArrayBuffer: positionBuffer,
        transform: {
            rot: Identity(),
            scl: [1, 1, 1],
            pos: [0, 0, 0]
        },
        verts: verts
    };
}
function CreateSphere(gl, radius, rings, sectors, programInfo, Texture) {
    var R = 1.0 / (rings - 1);
    var S = 1.0 / (sectors - 1);
    var r = 0;
    var s = 0;
    var verts = [];
    var v = 0;
    var norms = [];
    var n = 0;
    var texcs = [];
    var t = 0;
    for (r = 0; r < rings; ++r)
        for (s = 0; s < sectors; ++s) {
            var x = Math.cos(2 * Math.PI * s * S) * Math.sin(Math.PI * r * R);
            var y = Math.sin(2 * Math.PI * s * S) * Math.sin(Math.PI * r * R);
            var z = Math.sin(-Math.PI / 2 + Math.PI * r * R);
            texcs[t++] = s * S;
            texcs[t++] = r * R;
            verts[v++] = x * radius;
            verts[v++] = y * radius;
            verts[v++] = z * radius;
            norms[n++] = x;
            norms[n++] = y;
            norms[n++] = z;
        }
    var inds = [];
    var i = 0;
    for (r = 0; r < rings - 1; ++r)
        for (s = 0; s < sectors; s++) {
            inds[i++] = r * sectors + s;
            inds[i++] = r * sectors + (s + 1);
            inds[i++] = (r + 1) * sectors + s;
            inds[i++] = (r + 1) * sectors + (s + 1);
        }
    var fa = new Float32Array(verts.length);
    for (var i_1 = 0; i_1 < verts.length; ++i_1)
        fa[i_1] = verts[i_1];
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fa, gl.STATIC_DRAW);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    var ia = new Uint16Array(verts.length);
    for (var i_2 = 0; i_2 < inds.length; ++i_2)
        ia[i_2] = inds[i_2];
    var ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ia, gl.STATIC_DRAW);
    var textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcs), gl.STATIC_DRAW);
    gl.useProgram(programInfo.program);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoordinate, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoordinate);
    return {
        ArrayBuffer: positionBuffer,
        ElementArrayBuffer: ebo,
        TexCoordBuffer: textureCoordBuffer,
        Texture: Texture,
        transform: {
            rot: Identity(),
            scl: [1, 1, 1],
            pos: [0, 0, 0]
        },
        radius: radius,
        rings: rings,
        sectors: sectors,
        verts: verts,
        norms: norms,
        texcs: texcs,
        inds: inds
    };
}
function main() {
    var canvas = document.querySelector("#glCanvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    var gl = canvas.getContext("webgl");
    if (gl === null) {
        alert("Couldn't find webgl context - try updating your browser");
        return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    var programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoordinate: gl.getAttribLocation(shaderProgram, 'aTextureCoord')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler')
        }
    };
    var s1 = CreateSphere(gl, 1.0, 100, 100, programInfo, loadTexture(gl, "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif"));
    s1.transform.pos[2] += 4;
    var prevt = 0;
    function render(t) {
        t *= .001;
        var dt = t - prevt;
        prevt = t;
        s1.transform.rot = Rotate(s1.transform.rot, 'x', 1 * Math.PI / 180);
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        drawScene(gl, programInfo, [], [s1]);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
//source: mozilla webgl tutorial
function initShaderProgram(gl, vsSource, fsSource) {
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    if (vertexShader === null) {
        alert("Vert shader compilation issue");
        return null;
    }
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (fragmentShader === null) {
        alert("Frag shader compilation issue");
        return null;
    }
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program: ".concat(gl.getProgramInfoLog(shaderProgram)));
        return null;
    }
    return shaderProgram;
}
function loadShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: ".concat(gl.getShaderInfoLog(shader)));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
function drawScene(gl, programInfo, Meshes, Spheres) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var fieldOfView = 90 * Math.PI / 180; // in radians
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 0.1;
    var zFar = 100.0;
    var projectionMatrix = Perspective(zFar, zNear, fieldOfView, aspect);
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, M4ToFloat32List(projectionMatrix));
    for (var i = 0; i < Meshes.length; ++i) {
        gl.bindBuffer(gl.ARRAY_BUFFER, Meshes[i].ArrayBuffer);
        var numComponents = 2; // pull out 2 values per iteration
        var type = gl.FLOAT; // the data in the buffer is 32bit floats
        var normalize = false; // don't normalize
        var stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        var offset = 0; // how many bytes inside the buffer to start from
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        var modelViewMatrix = GetMatrix(Meshes[i].transform);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, M4ToFloat32List(modelViewMatrix));
        {
            var offset_1 = 0;
            var vertexCount = 4;
            gl.drawArrays(gl.TRIANGLE_STRIP, offset_1, vertexCount);
        }
    }
    for (var i = 0; i < Spheres.length; ++i) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Spheres[i].Texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, Spheres[i].ArrayBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Spheres[i].ElementArrayBuffer);
        var modelViewMatrix = GetMatrix(Spheres[i].transform);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, M4ToFloat32List(modelViewMatrix));
        gl.drawElements(gl.TRIANGLE_STRIP, Spheres[i].verts.length, gl.UNSIGNED_SHORT, 0);
    }
}
function loadTexture(gl, url) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    var level = 0;
    var internalFormat = gl.RGBA;
    var width = 1;
    var height = 1;
    var border = 0;
    var srcFormat = gl.RGBA;
    var srcType = gl.UNSIGNED_BYTE;
    var pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
    var image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;
    return texture;
}
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}
