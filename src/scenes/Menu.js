class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");

		this.shader = null;
		this.cameraPos = new Phaser.Math.Vector3(0, 0, 0);
		this.cameraAngle = { yaw: 45, pitch: 0 };
		this.moveSpeed = 0.03;
		this.xSense = 0.06;
		this.ySense = 0.1;
		this.mouseMovementX = 0;
		this.mouseMovementY = 0;
    }
	
	camToList() {
		return [this.cameraPos.x, this.cameraPos.y, this.cameraPos.z];
	}

	init(data) {
		// happens once, flows top to bottom
		// can recive data when adding/starting new scene
	}
	
	preload() {
		// happens once, flows top to bottom

		this.load.glsl('shaderSrc', 'assets/CustomShader.glsl.js');
	}
	
	// REQUIRED
	create(data) {
		// happens once, flows top to bottom
		// can receive data when adding/starting new scene

		const tesseract = new Phaser.Display.BaseShader(
            'tesseract',
            shaderSrc,
            null,
            {
				cameraPosX: { type: '1f', value: this.cameraPos.x },
				cameraPosY: { type: '1f', value: this.cameraPos.y },
				cameraPosZ: { type: '1f', value: this.cameraPos.z },
				cameraAngleYaw: { type: '1f', value: Phaser.Math.DegToRad(this.cameraAngle.yaw) },
				cameraAnglePitch: { type: '1f', value: Phaser.Math.DegToRad(this.cameraAngle.pitch) },
            }
        );

		this.shader = this.add.shader(tesseract, 400, 300, 800, 600);

		this.shader.setPointer(this.input.activePointer);



		this.input.on('pointerdown', function (pointer) {
			this.input.mouse.requestPointerLock();
		}, this);

		this.input.on('pointermove', function (pointer) {
			if (this.input.mouse.locked) {
				this.mouseMovementX = pointer.movementX;
				this.mouseMovementY = pointer.movementY;
			}
		}, this);

		this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
		this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
		this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
		this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
	}
	
	update(time, delta) {
		// happens EVERY FRAME, flows top to bottom
		// automatically receives time/delta parameters

		const keys = this.input.keyboard.createCursorKeys();

		const vec = new Phaser.Math.Vector2(0, 0);
		if (keys.up.isDown || this.keyW.isDown) vec.y += 1;
		if (keys.down.isDown || this.keyS.isDown) vec.y -= 1;
		if (keys.left.isDown || this.keyA.isDown) vec.x -= 1;
		if (keys.right.isDown || this.keyD.isDown) vec.x += 1;

		this.cameraAngle.yaw += this.mouseMovementX * this.xSense;
		this.cameraAngle.pitch += this.mouseMovementY * this.ySense;
		this.cameraAngle.pitch = Math.min(90, Math.max(-90, this.cameraAngle.pitch));

		if (vec.x !== 0 || vec.y !== 0) {
			vec.normalize()
			vec.scale(this.moveSpeed);

			vec.rotate(Phaser.Math.DegToRad(-this.cameraAngle.yaw));

			this.cameraPos.x -= vec.x;
			this.cameraPos.z -= vec.y;
		};

		this.shader.setUniform("cameraPosX.value", this.cameraPos.x);
		this.shader.setUniform("cameraPosY.value", this.cameraPos.y);
		this.shader.setUniform("cameraPosZ.value", this.cameraPos.z);
		this.shader.setUniform("cameraAngleYaw.value", Phaser.Math.DegToRad(this.cameraAngle.yaw));
		this.shader.setUniform("cameraAnglePitch.value", Phaser.Math.DegToRad(this.cameraAngle.pitch));

		this.mouseMovementX = 0;
		this.mouseMovementY = 0;
	}
}

const shaderSrc = `
#ifdef GL_ES
precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform float cameraPosX;
uniform float cameraPosY;
uniform float cameraPosZ;
vec3 cameraPos;

uniform float cameraAngleYaw;
uniform float cameraAnglePitch;
vec2 cameraAngle;

varying vec2 fragCoord;

#define MAX_LENGTH 128

vec3 green = vec3(0.2, 1.0, 0.5);
// vec3 red = vec3(1.0, 0.5, 0.2);
// vec3 blue = vec3(0.2, 0.5, 1.0);

struct Vec3Pair {
    vec3 a;
    vec3 b;
    vec3 col;
};

Vec3Pair createVec3Pair(vec3 a, vec3 b, vec3 col) {
    Vec3Pair pair;
    pair.a = a;
    pair.b = b;
    pair.col = col;
    return pair;
}
Vec3Pair createVec3Pair(float ax, float ay, float az, float bx, float by, float bz, vec3 col) {
    return createVec3Pair(vec3(ax, ay, az), vec3(bx, by, bz), col);
}

vec2 rotateVector(vec2 p, float angle) {
	float x = p.x;
    float y = p.y;

	p.x = cos(angle)*x - sin(angle)*y;
    p.y = sin(angle)*x + cos(angle)*y;

	return p;
}

vec3 rotateVectorY(vec3 p, float angle) {
	vec2 r = rotateVector(p.xz, angle);
	return vec3(r.x, p.y, r.y);
}

vec3 rotateVectorX(vec3 p, float angle) {
	vec2 r = rotateVector(p.yz, angle);
	return vec3(p.x, r.xy);
}

vec3 rotateVectorZ(vec3 p, float angle) {
	vec2 r = rotateVector(p.xy, angle);
	return vec3(r.xy, p.z);
}

vec3 morphPoint(vec3 p) {
	p -= cameraPos;
	p = rotateVectorY(p, cameraAngle.x);
	p = rotateVectorX(p, -cameraAngle.y);
	return p;
}

vec2 threeDeeToTwoDee(vec3 p) {
    return p.xy / p.z;
}

Vec3Pair cropVec3(Vec3Pair pair) {
	if (pair.a.z < 0.0 && pair.b.z < 0.0) return pair;d
	float Zc = 1.0;

}

vec4 threeDeeToTwoDee(Vec3Pair pair) {

	pair.a = morphPoint(pair.a);
	pair.b = morphPoint(pair.b);

	if (pair.a.z >= 0.0 && pair.b.z >= 0.0) {
		return vec4(0);
	}

    return vec4(
                threeDeeToTwoDee(pair.a),
                threeDeeToTwoDee(pair.b)
                );
}


Vec3Pair lines[MAX_LENGTH];
int numLines = 0;

void addLine(vec3 a, vec3 b, vec3 col) {
	for (int j = 0; j < MAX_LENGTH; j++) {
		if (j == numLines) {
			lines[j] = createVec3Pair(a, b, col);
			break;
		}
	}
    numLines++;
}
void addLine(float ax, float ay, float az, float bx, float by, float bz, vec3 col) {
    for (int j = 0; j < MAX_LENGTH; j++) {
		if (j == numLines) {
			lines[j] = createVec3Pair(vec3(ax, ay, az), vec3(bx, by, bz), col);
			break;
		}
	}
	
    numLines++;
}

void setUp() {
    vec3 ruf = vec3( 1,  1,  1);
    vec3 luf = vec3(-1,  1,  1);
    vec3 rdf = vec3( 1, -1,  1);
    vec3 ldf = vec3(-1, -1,  1);
    vec3 rub = vec3( 1,  1, -1);
    vec3 lub = vec3(-1,  1, -1);
    vec3 rdb = vec3( 1, -1, -1);
    vec3 ldb = vec3(-1, -1, -1);
    
    vec3 col = green; //vec3(testtest, 0.0, 1.0);
    
    float mul = 0.75;
    
    addLine(ruf*mul, luf*mul, col*0.75);
    addLine(luf*mul, ldf*mul, col*0.75);
    addLine(ldf*mul, rdf*mul, col*0.75);
    addLine(rdf*mul, ruf*mul, col*0.75);
    
    addLine(rub*mul, lub*mul, col*0.75);
    addLine(lub*mul, ldb*mul, col*0.75);
    addLine(ldb*mul, rdb*mul, col*0.75);
    addLine(rdb*mul, rub*mul, col*0.75);
    
    addLine(rub*mul, ruf*mul, col*0.75);
    addLine(rdb*mul, rdf*mul, col*0.75);
    addLine(lub*mul, luf*mul, col*0.75);
    addLine(ldb*mul, ldf*mul, col*0.75);
    
    mul = 1.25;
    
    addLine(ruf*mul, luf*mul, col);
    addLine(luf*mul, ldf*mul, col);
    addLine(ldf*mul, rdf*mul, col);
    addLine(rdf*mul, ruf*mul, col);
    
    addLine(rub*mul, lub*mul, col);
    addLine(lub*mul, ldb*mul, col);
    addLine(ldb*mul, rdb*mul, col);
    addLine(rdb*mul, rub*mul, col);
    
    addLine(rub*mul, ruf*mul, col);
    addLine(rdb*mul, rdf*mul, col);
    addLine(lub*mul, luf*mul, col);
    addLine(ldb*mul, ldf*mul, col);
    
    addLine(ruf*1.25, ruf*0.75, col*0.75);
    addLine(luf*1.25, luf*0.75, col*0.75);
    addLine(rdf*1.25, rdf*0.75, col*0.75);
    addLine(ldf*1.25, ldf*0.75, col*0.75);
    addLine(rub*1.25, rub*0.75, col*0.75);
    addLine(lub*1.25, lub*0.75, col*0.75);
    addLine(rdb*1.25, rdb*0.75, col*0.75);
    addLine(ldb*1.25, ldb*0.75, col*0.75);
}

float distanceToLine(vec2 p, vec4 beam) {
    vec2 a = beam.xy;
    vec2 b = beam.zw;
    
    vec2 pa = p - a;
    vec2 ba = b - a;
    float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * t);
}

vec3 getCol(vec2 p) {
    vec3 col = vec3(0.0);
    float minDist = 10000.0;
	
    for (int i = 0; i < MAX_LENGTH; i++) {
		if (i > numLines) {
			break;
		}
		vec4 point = threeDeeToTwoDee(lines[i]);
		if (length(point) == 0.0) continue;
        minDist = distanceToLine(p, point);
        col += 0.02 / minDist * lines[i].col; // Adjust color and intensity here
    }
        
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	cameraPos = vec3(cameraPosX, cameraPosY, cameraPosZ);
	cameraAngle = vec2(cameraAngleYaw, cameraAnglePitch);

    setUp();

    vec2 uv = fragCoord / resolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;
    
    vec3 col = getCol(uv);
    
    fragColor = vec4(col, 1.0);
}

void main(void)
{
    mainImage(gl_FragColor, fragCoord.xy);
}
`;