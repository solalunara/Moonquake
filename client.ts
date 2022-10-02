window.onload = main;

///<reference path="./math.ts" />

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
type Transform = {
    rot: m4,
    scl: v3,
    pos: v3,
}
function GetMatrix( t: Transform )
{
    let m: m4 = Identity();
    m = Scale( m, t.scl );
    m = MatMultiply( m, t.rot ) as m4;
    m = Translate( m, t.pos );
    return m;
}
type Mesh = {
    ArrayBuffer: WebGLBuffer,
    transform: Transform,
    verts: number[],
}
function CreateMesh( gl: WebGLRenderingContext, verts: number[] ): Mesh
{
    let fa: Float32Array = new Float32Array( verts.length );
    for ( let i = 0; i < verts.length; ++i )
        fa[ i ] = verts[ i ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
                  fa,
                  gl.STATIC_DRAW);

    return {
        ArrayBuffer: positionBuffer!,
        transform: {
            rot: Identity(),
            scl: [ 1, 1, 1 ],
            pos: [ 0, 0, 0 ],
        },
        verts: verts
    };
}
type Sphere = {
    ArrayBuffer: WebGLBuffer,
    ElementArrayBuffer: WebGLBuffer,
    transform: Transform,
    radius: number,
    rings: number,
    sectors: number,
    verts: number[],
    norms: number[],
    texcs: number[],
    inds: number[]
}
function CreateSphere( gl: WebGLRenderingContext, radius: number, rings: number, sectors: number ): Sphere
{
    const R: number = 1.0/(rings-1);
    const S: number = 1.0/(sectors-1);
    let r: number, s: number = 0;

    let verts: number[] = []; let v = 0;
    let norms: number[] = []; let n = 0;
    let texcs: number[] = []; let t = 0;

    for ( r = 0; r < rings; ++r ) for ( s = 0; s < sectors; ++s )
    {
        const y: number = Math.sin( -Math.PI / 2 + Math.PI * r * R );
        const x: number = Math.cos( 2 * Math.PI * s * S ) * Math.sin( Math.PI * r * R );
        const z: number = Math.sin( 2 * Math.PI * s * S ) * Math.sin( Math.PI * r * R );

        texcs[ t++ ] = s*S;
        texcs[ t++ ] = r*R;

        verts[ v++ ] = x * radius;
        verts[ v++ ] = y * radius;
        verts[ v++ ] = z * radius;

        norms[ n++ ] = x;
        norms[ n++ ] = y;
        norms[ n++ ] = z;
    }

    let inds: number[] = []; let i = 0;
    for ( r = 0; r < rings; ++r ) for ( s = 0; s < sectors; s++ )
    {
        inds[ i++ ] = r * sectors + s;
        inds[ i++ ] = r * sectors + ( s + 1 );
        inds[ i++ ] = ( r + 1 ) * sectors + ( s + 1 );
        inds[ i++ ] = ( r + 1 ) * sectors + s;
    }

    let fa: Float32Array = new Float32Array( verts.length );
    for ( let i = 0; i < verts.length; ++i )
        fa[ i ] = verts[ i ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fa, gl.STATIC_DRAW);
    
    let ia: Int32Array = new Int32Array( verts.length );
    for ( let i = 0; i < inds.length; ++i )
        ia[ i ] = inds[ i ];
    const ebo = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, ebo );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, ia, gl.STATIC_DRAW );

    return {
        ArrayBuffer: positionBuffer!,
        ElementArrayBuffer: ebo!,
        transform: {
            rot: Identity(),
            scl: [ 1, 1, 1 ],
            pos: [ 0, 0, 0 ],
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

function main()
{
    const canvas = document.querySelector( "#glCanvas" ) as HTMLCanvasElement;

    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

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
          projectionMatrix: gl.getUniformLocation(shaderProgram!, 'uProjectionMatrix')!,
          modelViewMatrix: gl.getUniformLocation(shaderProgram!, 'uModelViewMatrix')!,
        },
    }


    let s1 = CreateSphere( gl, 1.0, 10, 10 );
    s1.transform.pos[ 2 ] += 4;

    let prevt = 0;
    function render( t: number ): void
    {
        t *= .001;
        const dt = t - prevt;
        prevt = t;

        g_theta += 10;

        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        gl!.viewport( 0, 0, canvas.width, canvas.height );
        drawScene( gl!, programInfo, [], [s1] );

        requestAnimationFrame( render );
    }

    requestAnimationFrame( render );
}

let g_theta = 0;

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
function drawScene( gl: WebGLRenderingContext, programInfo: ProgramInfo, Meshes: Mesh[], Spheres: Sphere[] ) {
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
  
  
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        M4ToFloat32List( projectionMatrix ) );

    for ( let i = 0; i < Meshes.length; ++i )
    {
        gl.bindBuffer( gl.ARRAY_BUFFER, Meshes[ i ].ArrayBuffer );
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

        let modelViewMatrix = GetMatrix( Meshes[ i ].transform );

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
    for ( let i = 0; i < Spheres.length; ++i )
    {
        gl.bindBuffer( gl.ARRAY_BUFFER, Spheres[ i ].ArrayBuffer );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, Spheres[ i ].ElementArrayBuffer );

        gl.vertexAttribPointer( programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( programInfo.attribLocations.vertexPosition );

        let modelViewMatrix = GetMatrix( Spheres[ i ].transform );

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            M4ToFloat32List( modelViewMatrix ) );
    
        gl.drawElements( gl.TRIANGLES, Spheres[ i ].inds.length, gl.UNSIGNED_SHORT, 0 )
    }
}
