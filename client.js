import * as glm from "./node_modules/glm-js/build/glm-js.min.js";

window.onload = main;

function main()
{
    const canvas = document.querySelector( "#glCanvas" );
    const gl = canvas.getContext( "webgl" );

    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    var v3 = glm.vec3( 0, 0, 0 );
    v3 += glm.vec3( 1, 1, 1 );
    console.log( v3.x );
}