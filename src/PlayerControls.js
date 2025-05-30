// プレイヤーの移動、視点操作（PointerLockControls）、キーボード入力を担当します。
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class PlayerControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);
        this.domElement = domElement;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        this.playerHeight = 10; // プレイヤーの目の高さ、地面からの距離
        this.canJump = true; // ジャンプは削除または変更
    }

    init(scene) {
        scene.add(this.controls.object); // カメラをコントロールのオブジェクトに追加
        this.setupEventListeners();
        this.controls.object.position.y = this.playerHeight;
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space': this.moveUp = true; break;
            case 'ControlLeft': this.moveDown = true; break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'Space': this.moveUp = false; break;
            case 'ControlLeft': this.moveDown = false; break;
        }
    }

    update(delta) {
        if (this.controls.isLocked === true) {
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.y -= this.velocity.y * 10.0 * delta; // Y軸の減衰も追加
            this.velocity.z -= this.velocity.z * 10.0 * delta;

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.y = Number(this.moveUp) - Number(this.moveDown); // Y軸の移動方向
            this.direction.normalize(); // どの方向にも同じ速度で移動するため

            const speed = 400.0;
            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta;
            if (this.moveUp || this.moveDown) this.velocity.y -= this.direction.y * speed * delta; // Y軸移動を速度に加える

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
            this.controls.object.position.y -= this.velocity.y * delta; // カメラの位置をY軸方向に更新


            // 地面より下に落ちないようにする
            if (this.controls.object.position.y < this.playerHeight) {
                this.velocity.y = 0;
                this.controls.object.position.y = this.playerHeight;
            }
        }
    }

    getControls() {
        return this.controls;
    }

    isLocked() {
        return this.controls.isLocked;
    }
}
