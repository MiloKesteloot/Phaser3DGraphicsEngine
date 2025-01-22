class Play extends Phaser.Scene {
    constructor() {
        super("playScene");
    }
	
	init(data) {
		// happens once, flows top to bottom
		// can recive data when adding/starting new scene
	}
	
	preload() {
		// happens once, flows top to bottom
	}
	
	// REQUIRED
	create(data) {
		// happens once, flows top to bottom
		// can receive data when adding/starting new scene
	}
	
	update(time, delta) {
		// happens EVERY FRAME, flows top to bottom
		// automatically receives time/delta parameters
	}
}
