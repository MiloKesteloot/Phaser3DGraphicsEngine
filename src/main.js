"use strict"

let config = {
    type: Phaser.WEBGL,
    // width: 800,
    // height: 600,
    scale: {
        mode: Phaser.Scale.RESIZE, // Fit the game to the screen
        autoCenter: Phaser.Scale.CENTER_BOTH // Center the game canvas
    },
    scene: [ Menu, Play ]
};

let game = new Phaser.Game(config);
