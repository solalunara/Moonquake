type v3 = [number, number, number];
type v4 = [number, number, number, number];
type MatVec = [[number], [number], [number], [number]];
type m4 = [v4, v4, v4, v4]; //v4s are rows not columns

function Add( a: v3 | v4, b: v3 | v4 ): v3 | v4
{
    let v: v3 | v4 = [ 0, 0, 0 ];
    let i = 0;
    for ( ; i < Math.min( a.length, b.length ); ++i )
        v[ i ] = a[ i ] + b[ i ];
    for ( ; i < Math.max( a.length, b.length ); ++i )
        v[ i ] = a.length > b.length ? a[ i ] : b[ i ];
    return v;
}
function Neg( v: v3 | v4 ): v3 | v4
{
    let n: v3 | v4 = [0, 0, 0];
    for ( let i = 0; i < v.length; ++i )
        n[ i ] = -v[ i ];
    return n;
}
function Sbt( a: v3 | v4, b: v3 | v4 ): v3 | v4
{
    b = Neg( b );
    return Add( a, b );
}

//Vectors are typically stored as horizontal arrays (e.g. [1, 1, 1]) for convenience, but technically
//  vectors should be vertical arrays (e.g. [[1], [1], [1]]) to work correctly with 4x4 matricies,
//  so these are the helper methods to convert between them, where a horizontal array is a Vec and a vertical array is a MatVec
function VecToMatVec( v: v4 ): MatVec
{
    let m: MatVec = [[0], [0], [0], [0]];
    for ( let i = 0; i < 4; ++i )
        m[ i ] = [ v[ i ] ];
    return m;
}
function MatVecToVec( v: MatVec ): v4
{
    let m: v4 = [ 0, 0, 0, 0 ];
    for ( let i = 0; i < 4; ++i )
        m[ i ] = v[ i ][ 0 ];
    return m;
}

//WebGL needs a float32 list rather than a 2d array
function M4ToFloat32List( m: m4 ): Float32List
{
    let l: Float32List = [];

    for ( let i = 0; i < 4; ++i )
        for ( let j = 0; j < 4; ++j )
            l[ i * 4 + j ] = m[ j ][ i ];

    return l;
}

function MatMultiply( a: m4 | MatVec, b: m4 ): m4 | MatVec | null
{
    let m = a[ 0 ].length;
    let n = 4;
    let p = 4;
    let q = 4;

    if ( n !== p )
    {
        alert( `Unable to multiply ${n}x${m} matrix and ${p}x${q} matrix: incompatable sizes` );
        return null;
    }

    //size mxq where m is x(cols) and q is y(rows) 
    //  on init we only need smallest possible size: MatVec
    let c: m4 | MatVec = [[0],[0],[0],[0]];

    for ( let i = 0; i < m; ++i )
    {
        for ( let j = 0; j < q; ++j )
        {
            for ( let k = 0; k < p; ++k )
            {
                // ?? check neccesary b/c on first k m4c[ i ][ j ] is undefined
                //  edit: don't know if this is true on transition to typescript anymore but we'll keep it anyway
                c[ j ][ i ] = ( c[ j ][ i ] ?? 0 ) + ( a[ k ][ i ] * b[ j ][ k ] );
            }
        }
    }
    return c;
}

function Identity(): m4
{
    return [
        [ 1, 0, 0, 0 ],
        [ 0, 1, 0, 0 ],
        [ 0, 0, 1, 0 ],
        [ 0, 0, 0, 1 ]
    ];
}
function GetColumn( m: m4, n: number ): v4
{
    return [ m[ 0 ][ n ], m[ 1 ][ n ], m[ 2 ][ n ], m[ 3 ][ n ] ];
}
function SetColumn( m: m4, n: number, v: v4): void
{
    for ( let i = 0; i < 4; ++i )
        m[ i ][ n ] = v[ i ];
}
function Perspective( far: number, near: number, fov: number, aspect: number ): m4
{
    return [
        [ 1/(aspect*Math.tan(fov/2 )), 0,                  0,                      0                       ],
        [ 0,                           1/Math.tan(fov/2 ), 0,                      0                       ],
        [ 0,                           0,                  (-near-far)/(near-far), (2*far*near)/(near-far) ],
        [ 0,                           0,                  1,                      0                       ],
    ]
}
function Translate( m: m4, v: v3 ): m4
{
    let t: m4 = [ [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0] ];

    for ( let i = 0; i < 4; ++i )
        for ( let j = 0; j < 4; ++j )
            t[ i ][ j ] = m[ i ][ j ];

    SetColumn( t, 3, Add( GetColumn( m, 3 ), v ) as v4 );
    return t;
}
function Rotate( m: m4, axis: number | string, theta: number ): m4
{
    let r: m4 | null = null;
    switch ( axis )
    {
        case 0:
        case '0':
        case 'x':
        r = [
            [ 1,  0,                 0,                 0 ],
            [ 0,  Math.cos( theta ), Math.sin( theta ), 0 ],
            [ 0, -Math.sin( theta ), Math.cos( theta ), 0 ],
            [ 0,  0,                 0,                 1 ],
        ]
        break;

        case 1:
        case '1':
        case 'y':
        r = [
            [ Math.cos( theta ), 0, -Math.sin( theta ), 0 ],
            [ 0,                 1,  0,                 0 ],
            [ Math.sin( theta ), 0,  Math.cos( theta ), 0 ],
            [ 0,                 0,  0,                 1 ],
        ]
        break;

        case 2:
        case '2':
        case 'z':
        r = [
            [  Math.cos( theta ), Math.sin( theta ), 0, 0 ],
            [ -Math.sin( theta ), Math.cos( theta ), 0, 0 ],
            [  0,                 0,                 1, 0 ],
            [  0,                 0,                 0, 1 ],
        ]
        break;

        default:
        alert( `Invalid axis ${axis}` );
    }
    return MatMultiply( m, r! ) as m4;
}
function Scale( m: m4, v: v3 ): m4
{
    let s: m4 = [ [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0] ];

    for ( let i = 0; i < 4; ++i )
        for ( let j = 0; j < 4; ++j )
            s[ i ][ j ] = m[ i ][ j ];

    for ( let i = 0; i < 3; ++i )
        s[ i ][ i ] = v[ i ] * s[ i ][ i ];
    return s;
}