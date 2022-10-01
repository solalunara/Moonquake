"use strict";
exports.__esModule = true;
var http = require("http");
var glm = require("glm-js/build/glm-js.min.js");
var jsdom = require("jsdom");
var vsSource = "\nattribute vec4 aVertexPosition;\nattribute vec4 aVertexColor;\n\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\n\nvarying lowp vec4 vColor;\n\nvoid main(void) {\n  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;\n  vColor = aVertexColor;\n}\n";
var fsSource = "\nvoid main() {\n  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n}\n";
var hostname = '127.0.0.1';
var port = 3000;
var server = http.createServer(function (req, res) {
    res.statusCode = 200;
    var html = "\n    <!DOCTYPE html>\n    <head>\n        <title>Moonquake</title>\n    </head>\n    <body>\n        <canvas id='glCanvas' width='1920' height='1000'></canvas>\n    </body>";
    res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': html.length, 'Expires': new Date().toUTCString() });
    res.end(html);
});
server.listen(port, hostname, function () {
    console.log("Server running at http://".concat(hostname, ":").concat(port));
});
var JSDOM = jsdom.JSDOM;
var window = new JSDOM().window;
var document = (new JSDOM('')).window.document;
global.document = document;
var canvas = document.querySelector("#glCanvas");
var gl = canvas.getContext("webgl");
// Set clear color to black, fully opaque
gl.clearColor(0.0, 0.0, 0.0, 1.0);
// Clear the color buffer with specified clear color
gl.clear(gl.COLOR_BUFFER_BIT);
var shaderProgram = initShaderProgram(gl, vsSource, fsSource);
var programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
    }
};
drawScene(gl, programInfo, initBuffers(gl));
function loadShader(gl, type, source) {
    var shader = gl.createShader(type);
    if (shader === null) {
        alert("Unable to create shader");
        return;
    }
    // Send the source to the shader object
    gl.shaderSource(shader, source);
    // Compile the shader program
    gl.compileShader(shader);
    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: ".concat(gl.getShaderInfoLog(shader)));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
function initShaderProgram(gl, vsSource, fsSource) {
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (vertexShader === null || vertexShader === undefined) {
        alert("Couldn't read vertex shader data");
        return;
    }
    if (fragmentShader === null || fragmentShader === undefined) {
        alert("Couldn't read fragment shader data");
        return;
    }
    // Create the shader program
    var shaderProgram = gl.createProgram();
    if (shaderProgram === null) {
        alert("Couldn't create shader program");
        return;
    }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program: ".concat(gl.getProgramInfoLog(shaderProgram)));
        return null;
    }
    return shaderProgram;
}
function initBuffers(gl) {
    // Create a buffer for the square's positions.
    var positionBuffer = gl.createBuffer();
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Now create an array of positions for the square.
    var positions = [
        1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ];
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return {
        position: positionBuffer
    };
}
function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    var fieldOfView = 45 * Math.PI / 180; // in radians
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 0.1;
    var zFar = 100.0;
    var projectionMatrix = glm.mat4();
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    glm.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    var modelViewMatrix = glm.mat4();
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    glm.translate(modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -6.0]); // amount to translate
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        var numComponents = 2; // pull out 2 values per iteration
        var type = gl.FLOAT; // the data in the buffer is 32bit floats
        var normalize = false; // don't normalize
        var stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        var offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }
    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);
    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    {
        var offset = 0;
        var vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}
