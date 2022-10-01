"use strict";
exports.__esModule = true;
window.onload = main;
var jquery = require("jquery");
var $ = jquery;
function main() {
    var canvas = document.querySelector("#glCanvas");
    $.post("/request", canvas, function (data, status) {
        console.log(data);
    });
}
