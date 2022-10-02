window.onload = main;

const vsSource = `
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`;  
const fsSource = `
void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

type ProgramInfo = {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: number,
    },
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation,
        modelViewMatrix: WebGLUniformLocation,
    }
}


function main()
{
    const canvas = document.querySelector( "#glCanvas" ) as HTMLCanvasElement;
    const gl = canvas!.getContext( "webgl" );
    if ( gl === null )
    {
        alert( "Couldn't find webgl context - try updating your browser" );
        return;
    }
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo: ProgramInfo = {
        program: shaderProgram!,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(shaderProgram!, 'aVertexPosition'),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram!, 'uProjectionMatrix'),
          modelViewMatrix: gl.getUniformLocation(shaderProgram!, 'uModelViewMatrix'),
        },
    }


    initBuffers( gl );
    drawScene( gl, programInfo );
}

//source: mozilla webgl tutorial
function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null
{
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    if ( vertexShader === null )
    {
        alert( "Vert shader compilation issue" );
        return null;
    }
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if ( fragmentShader === null )
    {
        alert( "Frag shader compilation issue" );
        return null;
    }
    const shaderProgram = gl.createProgram()!;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) 
    {
        alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }
    return shaderProgram;
}
function loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null 
{
    const shader = gl.createShader( type )!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
    {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
function initBuffers(gl: WebGLRenderingContext): { position: WebGLBuffer }
{
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
       1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
      -1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(positions),
                  gl.STATIC_DRAW);
    return {
      position: positionBuffer!,
    };
}
function drawScene(gl: WebGLRenderingContext, programInfo: ProgramInfo ) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 90 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = Perspective( zFar, zNear, fieldOfView, aspect );
  
    let modelViewMatrix = Identity();
    modelViewMatrix = Translate( modelViewMatrix, [0.0, 0.0, 6.0] );
  
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
      const numComponents = 2;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
                                // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexPosition);
    }
  
    // Tell WebGL to use our program when drawing
  
    gl.useProgram(programInfo.program);
  
    // Set the shader uniforms
  
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        M4ToFloat32List( projectionMatrix ) );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        M4ToFloat32List( modelViewMatrix ) );
  
    {
      const offset = 0;
      const vertexCount = 4;
      gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}
