window.onload = main;

import * as jquery from "jquery";
var $ = jquery;

function main() 
{
    const canvas = document.querySelector("#glCanvas") as HTMLCanvasElement;

    $.post( "/request", canvas,
    function( data, status ) {
        console.log( data );
    });

}