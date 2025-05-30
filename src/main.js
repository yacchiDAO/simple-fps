import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as TWEEN from '@tweenjs/tween.js';
const animationGroup = new TWEEN.Group();

let camera, scene, renderer;
let controls;

const objects = []; // 衝突判定用のオブジェクトを格納する配列（今回は未使用だが概念として）

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;    // 上昇用
let moveDown = false;  // 下降用

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

let prevTime = performance.now();

const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');
const crosshair = document.getElementById('crosshair'); 

let pistol;

const raycaster = new THREE.Raycaster();
const clickPoint = new THREE.Vector2(); // マウスのクリック座標は使わないが、Raycasterに必要
let canShoot = true; // 射撃クールダウン用
const shotCooldown = 0.5; // 射撃間隔（秒）

let shootTimeout; // クールダウン用タイマーの参照

init();
animate();

function init() {
    // シーンの設定
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // 空の色
    scene.fog = new THREE.Fog(0x87ceeb, 0, 750); // 霧

    // カメラの設定
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10; // プレイヤーの目の高さ

    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ポインターロックコントロールの設定
    // これはThree.jsのヘルパーで、マウスを隠して視点移動に使う
    controls = new PointerLockControls(camera, document.body);

    // ポインターロックのイベントリスナー
    instructions.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
        document.body.classList.add('locked');
    });

    controls.addEventListener('unlock', function () {
        blocker.style.display = 'flex';
        instructions.style.display = 'block';
        document.body.classList.remove('locked');
    });

    scene.add(controls.object); // カメラをコントロールのオブジェクトに追加

    // キーボードイベントのリスナー
    const onKeyDown = function (event) {
        switch (event.code) {
            case 'KeyW': // Wキー
                moveForward = true;
                break;
            case 'KeyA': // Aキー
                moveLeft = true;
                break;
            case 'KeyS': // Sキー
                moveBackward = true;
                break;
            case 'KeyD': // Dキー
                moveRight = true;
                break;
            case 'Space': // Spaceキー
                moveUp = true;
                break;
            case 'ControlLeft': // 左Controlキー (または 'ControlRight' で右も)
                moveDown = true;
                break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
            case 'Space':
                moveUp = false;
                break;
            case 'ControlLeft':
                moveDown = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown, false);

    // 光源の追加
    const light = new THREE.HemisphereLight(0xffeeee, 0x111122, 1);
    scene.add(light);

    // 床の作成
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(- Math.PI / 2); // X軸周りに-90度回転させて床にする

    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // 灰色
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);

    // ボックスの追加（障害物として）
    const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // 赤色
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 10, -50); // 地面から10の高さ
    scene.add(box);
    objects.push(box); // （将来的には衝突判定に使う）

    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', onWindowResize);

    const loader = new GLTFLoader();
    loader.load(
        // モデルファイルのパス (public ディレクトリからの相対パス)
        './models/pistol/scene.gltf',
        function (gltf) {
            pistol = gltf.scene;

            // 銃のスケールを調整（モデルによって適切なサイズに調整してください）
            // 例: 0.1 は元のサイズの10分の1
            pistol.scale.set(4.0, 4.0, 4.0); 

            // 銃の初期位置を調整（カメラの右下あたりに表示されるように調整）
            // 数値は試行錯誤して調整してください
            pistol.position.set(0.7, -0.5, -1.5); 

            // 銃の向きを調整（モデルの向きによっては回転が必要）
            // このモデルでは必要ないかもしれませんが、一般的な調整です
            pistol.rotation.y = Math.PI; // 例: 180度回転

            // カメラの子要素として追加することで、カメラと一緒に動く
            camera.add(pistol);
        },
        // ロード中の進捗を表示したい場合はここに関数を定義
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // エラー発生時の処理
        function (error) {
            console.error('An error occurred while loading the gun model:', error);
        }
    );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate); // ゲームループ

    const time = performance.now(); // 現在時刻を取得

    animationGroup.update(time);

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000; // 前回のフレームからの経過時間（秒）

        velocity.x -= velocity.x * 10.0 * delta; // 摩擦による減速
        velocity.y -= velocity.y * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // velocity.y -= 9.8 * 100.0 * delta; // 重力（今回は地面をすり抜けないためコメントアウト）

        direction.z = Number(moveForward) - Number(moveBackward); // 前後方向の移動量
        direction.x = Number(moveRight) - Number(moveLeft); // 左右方向の移動量
        direction.y = Number(moveUp) - Number(moveDown);
        direction.normalize(); // ベクトルを正規化して、斜め移動が速くならないようにする

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta; // 前後移動
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;     // 左右移動
        if (moveUp || moveDown) velocity.y += direction.y * 400.0 * delta; // Y軸の移動を適用
        

        controls.moveRight(- velocity.x * delta); // x方向の移動を適用
        controls.moveForward(- velocity.z * delta); // z方向の移動を適用
        controls.object.position.y += velocity.y * delta;

        // 地面からの落下を防ぐ（簡易的な処理）
        // 実際には物理エンジンや正確な衝突判定が必要
        if (controls.object.position.y < 10) {
            velocity.y = 0;
            controls.object.position.y = 10; // 地面に着地
        }
    }

    prevTime = time; // 前回の時刻を更新

    renderer.render(scene, camera); // シーンをレンダリング
}

function onMouseDown(event) {
    if (controls.isLocked === true && event.button === 0 && canShoot) { // 左クリック (button 0) かつポインターロック中
        canShoot = false; // 射撃を一時的に無効化
        shoot(); // 射撃処理を実行

        // クールダウンタイマーを開始
        shootTimeout = setTimeout(() => {
            canShoot = true;
        }, shotCooldown * 1000); // ミリ秒に変換
    }
}

function shoot() {
    // 銃の発射アニメーション（Tween.js を使う）
    if (pistol) {
        const initialZ = pistol.position.z;
        const initialY = pistol.position.y;
        const initialRotationX = pistol.rotation.x;
        const recoilZ = initialZ + 0.5;
        const recoilY = initialY - 0.2;
        const recoilRotationX = initialRotationX + Math.PI * 0.3;

        // 銃を後方に動かし、少し上に跳ね上げる Tween
        new TWEEN.Tween(pistol.position, animationGroup) // ★ 変更ここから：animationGroup を渡す ★
            .to({ z: recoilZ, y: recoilY }, 80)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                // 元の位置に戻す Tween
                new TWEEN.Tween(pistol.position, animationGroup) // ★ 変更ここから：animationGroup を渡す ★
                    .to({ z: initialZ, y: initialY }, 150)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .start();
            })
            .start();

        // 銃の回転のTween (位置のTweenと同時進行)
        new TWEEN.Tween(pistol.rotation, animationGroup) // rotationをアニメーション対象にする
            .to({ x: recoilRotationX }, 80) // 80ミリ秒で回転
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                // 元の回転に戻す Tween (少しゆっくり)
                new TWEEN.Tween(pistol.rotation, animationGroup)
                    .to({ x: initialRotationX }, 150) // 150ミリ秒で戻る
                    .easing(TWEEN.Easing.Quadratic.In)
                    .start();
            })
            .start();
    }


    // レイキャストの設定 (この部分は変更なし)
    raycaster.setFromCamera(clickPoint, camera);

    // シーン内の衝突可能なオブジェクトを検出 (この部分は変更なし)
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
        const firstHit = intersects[0];
        console.log('Hit object:', firstHit.object.name, 'at', firstHit.point);

        // ヒットエフェクトの表示 (この部分は変更なし)
        const hitGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const hitMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const hitMarker = new THREE.Mesh(hitGeometry, hitMaterial);
        hitMarker.position.copy(firstHit.point);
        scene.add(hitMarker);

        setTimeout(() => {
            scene.remove(hitMarker);
            hitMarker.geometry.dispose();
            hitMarker.material.dispose();
        }, 500);
    } else {
        console.log('Missed');
    }
}