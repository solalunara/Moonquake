window.onload = main;

function main()
{
    const canvas = document.querySelector( "#glCanvas" );
    const gl = canvas.getContext( "webgl" );

    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    var pt = [ 
        [ 1 ], 
        [ 0 ],  
        [ 0 ], 
        [ 1 ] 
    ];
    var m4 = Identity();
    m4 = Translate( m4, [ 1, 0, 0 ] );
    m4 = Rotate( m4, 'z', Math.PI / 180 * 90 );
    pt = MatMultiply( pt, 1, 4, m4, 4, 4 );
    for ( let i = 0; i < 4; ++i )
    {
        let s = "[ ";
        for ( let j = 0; j < 4; ++j )
            s += m4[ i ][ j ] + ", ";
        console.log( s + "]" );
    }
    console.log( 'newline' );
    for ( let i = 0; i < 4; ++i )
    {
        console.log( pt[ i ][ 0 ] );
    }
}