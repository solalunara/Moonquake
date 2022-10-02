function Add( v3a, v3b )
{
    let v3 = [];
    for ( let i = 0; i < 3; ++i )
        v3[ i ] = v3a[ i ] + v3b[ i ];
    return v3;
}
function Neg( v3 )
{
    let v3n = [];
    for ( let i = 0; i < 3; ++i )
        v3n[ i ] = -v3[ i ];
    return v3n;
}
function Sbt( v3a, v3b )
{
    v3b = Neg( v3b );
    return Add( v3a, v3b );
}

function MatMultiply( m4a, m4a_sizex, m4a_sizey, m4b, m4b_sizex, m4b_sizey )
{
    let m = m4a_sizex;
    let n = m4a_sizey;
    let p = m4b_sizex;
    let q = m4b_sizey;

    if ( n !== p )
    {
        alert( `Unable to multiply ${n}x${m} matrix and ${p}x${q} matrix: incompatable sizes` );
        return null;
    }

    //size mxq where m is x(cols) and q is y(rows) 
    let m4c = [];
    for ( let i = 0; i < q; ++i )
        m4c[ i ] = [];

    //there's no reason these are seperate other than it made more logical sense to me at the time of writing
    for ( let i = 0; i < m; ++i )
    {
        for ( let j = 0; j < q; ++j )
        {
            for ( let k = 0; k < p; ++k )
            {
                // ?? check neccesary b/c on first k m4c[ i ][ j ] is undefined
                m4c[ j ][ i ] = ( m4c[ j ][ i ] ?? 0 ) + ( m4a[ k ][ i ] * m4b[ j ][ k ] );
            }
        }
    }
    return m4c;
}

function Identity()
{
    return [
        [ 1, 0, 0, 0 ],
        [ 0, 1, 0, 0 ],
        [ 0, 0, 1, 0 ],
        [ 0, 0, 0, 1 ]
    ];
}
function GetColumn( m4, n )
{
    return [ m4[ 0 ][ n ], m4[ 1 ][ n ], m4[ 2 ][ n ], m4[ 3 ][ n ] ];
}
function SetColumn( m4, n, v4 )
{
    for ( let i = 0; i < 4; ++i )
        m4[ i ][ n ] = v4[ i ];
}
function Translate( m4, v3 )
{
    let m4t = m4;
    SetColumn( m4t, 3, Add( GetColumn( m4, 3 ), v3 ).concat( GetColumn( m4, 3 )[ 3 ] ) );
    return m4t;
}
function Rotate( m4, axis, theta )
{
    let m4r = null;
    switch ( axis )
    {
        case 0:
        case '0':
        case 'x':
        m4r = [
            [ 1,  0,                 0,                 0 ],
            [ 0,  Math.cos( theta ), Math.sin( theta ), 0 ],
            [ 0, -Math.sin( theta ), Math.cos( theta ), 0 ],
            [ 0,  0,                 0,                 1 ],
        ]
        break;

        case 1:
        case '1':
        case 'y':
        m4r = [
            [ Math.cos( theta ), 0, -Math.sin( theta ), 0 ],
            [ 0,                 1,  0,                 0 ],
            [ Math.sin( theta ), 0,  Math.cos( theta ), 0 ],
            [ 0,                 0,  0,                 1 ],
        ]
        break;

        case 2:
        case '2':
        case 'z':
        m4r = [
            [  Math.cos( theta ), Math.sin( theta ), 0, 0 ],
            [ -Math.sin( theta ), Math.cos( theta ), 0, 0 ],
            [  0,                 0,                 1, 0 ],
            [  0,                 0,                 0, 1 ],
        ]
        break;
    }
    return MatMultiply( m4, 4, 4, m4r, 4, 4 );
}
function Scale( m4, v3 )
{
    let m4s = [ [], [], [], [] ];
    for ( let i = 0; i < 3; ++i )
        m4s[ i ][ i ] = v3[ i ] * m4[ i ][ i ];
    return m4s;
}