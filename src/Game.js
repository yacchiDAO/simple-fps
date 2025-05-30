// ゲーム全体の初期化、メインループ、各コンポーネントの連携を担当します。
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { UIManager } from './UIManager.js';
import { World } from './World.js';
import { PlayerControls } from './PlayerControls.js';
import { Weapon } from './Weapon.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.playerControls = null;
        this.world = null;
        this.uiManager = null;
        this.weapon = null;
        this.animationGroup = new TWEEN.Group(); // TWEENアニメーション用グループ

        this.prevTime = performance.now();
    }

    init() {
        // シーン
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 10, 750); // 霧の開始距離を調整

        // カメラ
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // PlayerControlsで初期位置を設定するため、ここではY位置を設定しない

        // レンダラー
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // UIマネージャー
        this.uiManager = new UIManager('blocker', 'instructions', 'crosshair');

        // ワールド
        this.world = new World(this.scene);
        this.world.init(); // ここで衝突判定オブジェクトが collidableObjects に追加される

        // プレイヤーコントロール
        this.playerControls = new PlayerControls(this.camera, this.renderer.domElement);
        this.playerControls.init(this.scene);

        this.uiManager.setupPointerLock(this.playerControls.getControls());

        // 武器
        this.weapon = new Weapon(this.camera, this.scene, this.animationGroup);
        this.weapon.init('./models/sheriff/scene.gltf');

        window.addEventListener('resize', this.onWindowResize.bind(this));

        document.addEventListener('mousedown', (event) => {
            if (this.playerControls.isLocked()) {
                // ここで this.world.getCollidableObjects() が正しいオブジェクトリストを返すか確認
                const collidables = this.world.getCollidableObjects();
                // console.log("[Game] Passing collidables to weapon:", collidables); // デバッグ用
                this.weapon.handleMouseDown(event, true, collidables);
            }
        });

        // アニメーションループ開始
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;

        this.animationGroup.update(); // TWEENアニメーションを更新 (引数なしでも良い場合がある)
        // TWEEN.update(time); // グローバルにTWEENを使う場合。Groupを使っているので上記で良い。

        this.playerControls.update(delta);
        // this.weapon.update(time); // Weaponクラスに時間ベースの更新があれば

        this.renderer.render(this.scene, this.camera);
        this.prevTime = time;
    }
}
