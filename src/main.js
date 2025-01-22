"use strict"

let config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    scene: [ Menu, Play ]
};

let game = new Phaser.Game(config);
