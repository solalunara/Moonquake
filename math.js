function Add(a, b) {
    var v = [0, 0, 0];
    var i = 0;
    for (; i < Math.min(a.length, b.length); ++i)
        v[i] = a[i] + b[i];
    for (; i < Math.max(a.length, b.length); ++i)
        v[i] = a.length > b.length ? a[i] : b[i];
    return v;
}
function Neg(v) {
    var n = [0, 0, 0];
    for (var i = 0; i < v.length; ++i)
        n[i] = -v[i];
    return n;
}
function Sbt(a, b) {
    b = Neg(b);
    return Add(a, b);
}
//Vectors are typically stored as horizontal arrays (e.g. [1, 1, 1]) for convenience, but technically
//  vectors should be vertical arrays (e.g. [[1], [1], [1]]) to work correctly with 4x4 matricies,
//  so these are the helper methods to convert between them, where a horizontal array is a Vec and a vertical array is a MatVec
function VecToMatVec(v) {
    var m = [[0], [0], [0], [0]];
    for (var i = 0; i < 4; ++i)
        m[i] = [v[i]];
    return m;
}
function MatVecToVec(v) {
    var m = [0, 0, 0, 0];
    for (var i = 0; i < 4; ++i)
        m[i] = v[i][0];
    return m;
}
//WebGL needs a float32 list rather than a 2d array
function M4ToFloat32List(m) {
    var l = [];
    for (var i = 0; i < 4; ++i)
        for (var j = 0; j < 4; ++j)
            l[i * 4 + j] = m[j][i];
    return l;
}
function MatMultiply(a, b) {
    var _a;
    var m = a[0].length;
    var n = 4;
    var p = 4;
    var q = 4;
    if (n !== p) {
        alert("Unable to multiply ".concat(n, "x").concat(m, " matrix and ").concat(p, "x").concat(q, " matrix: incompatable sizes"));
        return null;
    }
    //size mxq where m is x(cols) and q is y(rows) 
    //  on init we only need smallest possible size: MatVec
    var c = [[0], [0], [0], [0]];
    for (var i = 0; i < m; ++i) {
        for (var j = 0; j < q; ++j) {
            for (var k = 0; k < p; ++k) {
                // ?? check neccesary b/c on first k m4c[ i ][ j ] is undefined
                //  edit: don't know if this is true on transition to typescript anymore but we'll keep it anyway
                c[j][i] = ((_a = c[j][i]) !== null && _a !== void 0 ? _a : 0) + (a[k][i] * b[j][k]);
            }
        }
    }
    return c;
}
function Identity() {
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
}
function GetColumn(m, n) {
    return [m[0][n], m[1][n], m[2][n], m[3][n]];
}
function SetColumn(m, n, v) {
    for (var i = 0; i < 4; ++i)
        m[i][n] = v[i];
}
function Perspective(far, near, fov, aspect) {
    return [
        [1 / (aspect * Math.tan(fov / 2)), 0, 0, 0],
        [0, 1 / Math.tan(fov / 2), 0, 0],
        [0, 0, (-near - far) / (near - far), (2 * far * near) / (near - far)],
        [0, 0, 1, 0],
    ];
}
function Translate(m, v) {
    var t = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (var i = 0; i < 4; ++i)
        for (var j = 0; j < 4; ++j)
            t[i][j] = m[i][j];
    SetColumn(t, 3, Add(GetColumn(m, 3), v));
    return t;
}
function Rotate(m, axis, theta) {
    var r = null;
    switch (axis) {
        case 0:
        case '0':
        case 'x':
            r = [
                [1, 0, 0, 0],
                [0, Math.cos(theta), Math.sin(theta), 0],
                [0, -Math.sin(theta), Math.cos(theta), 0],
                [0, 0, 0, 1],
            ];
            break;
        case 1:
        case '1':
        case 'y':
            r = [
                [Math.cos(theta), 0, -Math.sin(theta), 0],
                [0, 1, 0, 0],
                [Math.sin(theta), 0, Math.cos(theta), 0],
                [0, 0, 0, 1],
            ];
            break;
        case 2:
        case '2':
        case 'z':
            r = [
                [Math.cos(theta), Math.sin(theta), 0, 0],
                [-Math.sin(theta), Math.cos(theta), 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1],
            ];
            break;
        default:
            alert("Invalid axis ".concat(axis));
    }
    return MatMultiply(m, r);
}
function Scale(m, v) {
    var s = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (var i = 0; i < 4; ++i)
        for (var j = 0; j < 4; ++j)
            s[i][j] = m[i][j];
    for (var i = 0; i < 3; ++i)
        s[i][i] = v[i] * s[i][i];
    return s;
}
