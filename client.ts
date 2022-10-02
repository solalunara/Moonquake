window.onload = main;

///<reference path="./math.ts" />

const vsSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
varying highp vec2 vTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;  
const fsSource = `
varying highp vec2 vTextureCoord;
uniform sampler2D tex;
void main() {
  gl_FragColor = texture2D( tex, vTextureCoord );
}
`;

type ProgramInfo = {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: number,
        textureCoordinate: number,
    },
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation,
        modelViewMatrix: WebGLUniformLocation,
        uSampler: WebGLUniformLocation,
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
    TexCoordBuffer: WebGLBuffer,
    Texture: WebGLTexture,
    transform: Transform,
    radius: number,
    rings: number,
    sectors: number,
    verts: number[],
    norms: number[],
    texcs: number[],
    inds: number[]
}
function CreateSphere( gl: WebGLRenderingContext, radius: number, rings: number, sectors: number, programInfo: ProgramInfo, Texture: WebGLTexture ): Sphere
{
    const R: number = 1.0/(rings-1);
    const S: number = 1.0/(sectors-1);
    let r: number = 0; let s: number = 0;

    let verts: number[] = []; let v = 0;
    let norms: number[] = []; let n = 0;
    let texcs: number[] = []; let t = 0;

    for ( r = 0; r < rings; ++r ) for ( s = 0; s < sectors; ++s )
    {
        const x: number = Math.cos( 2 * Math.PI * s * S ) * Math.sin( Math.PI * r * R );
        const y: number = Math.sin( 2 * Math.PI * s * S ) * Math.sin( Math.PI * r * R );
        const z: number = Math.sin( -Math.PI / 2 + Math.PI * r * R );

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
    for ( r = 0; r < rings - 1; ++r ) for ( s = 0; s < sectors; s++ )
    {
        inds[ i++ ] = r * sectors + s;
        inds[ i++ ] = r * sectors + ( s + 1 );
        inds[ i++ ] = ( r + 1 ) * sectors + s;
        inds[ i++ ] = ( r + 1 ) * sectors + ( s + 1 );
    }

    let fa: Float32Array = new Float32Array( verts.length );
    for ( let i = 0; i < verts.length; ++i )
        fa[ i ] = verts[ i ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fa, gl.STATIC_DRAW);
    gl.vertexAttribPointer( programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( programInfo.attribLocations.vertexPosition );
    
    let ia: Uint16Array = new Uint16Array( verts.length );
    for ( let i = 0; i < inds.length; ++i )
        ia[ i ] = inds[ i ];
    const ebo = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, ebo );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, ia, gl.STATIC_DRAW );

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( texcs ), gl.STATIC_DRAW );
    gl.useProgram( programInfo.program );
    gl.vertexAttribPointer( programInfo.attribLocations.textureCoordinate, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( programInfo.attribLocations.textureCoordinate );

    return {
        ArrayBuffer: positionBuffer!,
        ElementArrayBuffer: ebo!,
        TexCoordBuffer: textureCoordBuffer!,
        Texture: Texture,
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
          textureCoordinate: gl.getAttribLocation( shaderProgram!, 'aTextureCoord' ),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram!, 'uProjectionMatrix')!,
          modelViewMatrix: gl.getUniformLocation(shaderProgram!, 'uModelViewMatrix')!,
          uSampler: gl.getUniformLocation( shaderProgram!, 'uSampler' )!,
        },
    }

    let s1 = CreateSphere( gl, 1.0, 100, 100, programInfo, loadTexture( gl, "moon.tif" ) );
    s1.transform.pos[ 2 ] += 4;

    let prevt = 0;
    function render( t: number ): void
    {
        t *= .001;
        const dt = t - prevt;
        prevt = t;

        s1.transform.rot = Rotate( s1.transform.rot, 'x', 1 * Math.PI / 180 );

        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        gl!.viewport( 0, 0, canvas.width, canvas.height );
        drawScene( gl!, programInfo, [], [s1] );

        requestAnimationFrame( render );
    }

    requestAnimationFrame( render );
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
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Spheres[ i ].Texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        gl.bindBuffer( gl.ARRAY_BUFFER, Spheres[ i ].ArrayBuffer );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, Spheres[ i ].ElementArrayBuffer );


        let modelViewMatrix = GetMatrix( Spheres[ i ].transform );

        gl.uniformMatrix4fv( programInfo.uniformLocations.modelViewMatrix, false, M4ToFloat32List( modelViewMatrix ) );
    
        gl.drawElements( gl.TRIANGLE_STRIP, Spheres[ i ].verts.length, gl.UNSIGNED_SHORT, 0 )
    }
}

function loadTexture(gl: WebGLRenderingContext, url: string): WebGLTexture
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);
  
    const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                            srcFormat, srcType, image);
    
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;
  
    return texture!;
}
function isPowerOf2( value: number ) 
{
    return ( value & (value - 1) ) === 0;
}