// 武器モデルのロード、射撃ロジック、アニメーション、ヒット判定を担当します。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as TWEEN from '@tweenjs/tween.js';

export class Weapon {
    constructor(camera, scene, animationGroup) {
        this.camera = camera;
        this.scene = scene;
        this.animationGroup = animationGroup; // TWEEN.Groupインスタンス
        this.pistol = null;
        this.raycaster = new THREE.Raycaster();
        this.clickPoint = new THREE.Vector2(0, 0); // スクリーン中央を指す

        this.canShoot = true;
        this.shotCooldown = 0.5; // 秒
        this.shootTimeout = null;

        this.hitMarkerLifetime = 500; // ms
    }

    init(modelPath) {
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                this.pistol = gltf.scene;
                // スケール、位置、回転を調整
                this.pistol.scale.set(0.07, 0.07, 0.07);
                this.pistol.position.set(1.0, -0.8, -1.5); // 微調整
                this.pistol.rotation.y = Math.PI * 0.55; // 微調整

                this.camera.add(this.pistol); // カメラの子にする
            },
            (xhr) => {
                console.log(`Weapon: ${(xhr.loaded / xhr.total * 100)}% loaded`);
            },
            (error) => {
                console.error('An error occurred while loading the weapon model:', error);
            }
        );
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
    }

    onMouseDown(event) {
        // PlayerControlsからisLocked状態を取得するか、Gameクラス経由で渡す必要がある
        // ここでは仮に常にtrueとしておくか、GameクラスからisLocked状態を渡す
        // GameクラスでisLocked()をPlayerControlsに問い合わせるのが良い
        if (event.button === 0 && this.canShoot /* && isPointerLocked */) {
            this.canShoot = false;
            this.performShoot();

            this.shootTimeout = setTimeout(() => {
                this.canShoot = true;
            }, this.shotCooldown * 1000);
        }
    }

    performShoot(collidableObjects = []) {
        if (!this.pistol) return;

        // 銃の発射アニメーション
        const initialPos = this.pistol.position.clone();
        const initialRot = this.pistol.rotation.clone(); // x回転だけでなく全体を保存

        const recoilOffset = new THREE.Vector3(0, -0.1, 0.3); // 後退量と少し下がる動き
        const recoilRotation = new THREE.Euler(initialRot.x + Math.PI * 0.15, initialRot.y, initialRot.z);


        new TWEEN.Tween(this.pistol.position, this.animationGroup)
            .to({
                x: initialPos.x + recoilOffset.x,
                y: initialPos.y + recoilOffset.y,
                z: initialPos.z + recoilOffset.z
            }, 80)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                new TWEEN.Tween(this.pistol.position, this.animationGroup)
                    .to(initialPos, 150)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .start();
            })
            .start();

        new TWEEN.Tween(this.pistol.rotation, this.animationGroup)
            .to({ x: recoilRotation.x, y: recoilRotation.y, z: recoilRotation.z }, 30)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                new TWEEN.Tween(this.pistol.rotation, this.animationGroup)
                    .to({ x: initialRot.x, y: initialRot.y, z: initialRot.z }, 150)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .start();
            })
            .start();

        // レイキャスト (カメラの中心から)
        this.raycaster.setFromCamera(this.clickPoint, this.camera);
        const intersects = this.raycaster.intersectObjects(collidableObjects, true);

        if (intersects.length > 0) {
            const firstHit = intersects[0];
            console.log('Hit object:', firstHit.object.name || 'Unnamed Object', 'at', firstHit.point);

            // ヒットエフェクト
            const hitGeometry = new THREE.SphereGeometry(0.2, 16, 16); // 少し大きく
            const hitMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
            const hitMarker = new THREE.Mesh(hitGeometry, hitMaterial);
            hitMarker.position.copy(firstHit.point);
            this.scene.add(hitMarker);

            setTimeout(() => {
                this.scene.remove(hitMarker);
                hitMarker.geometry.dispose();
                hitMaterial.dispose();
            }, this.hitMarkerLifetime);

            // ここでヒットしたオブジェクトに対する処理（ダメージなど）を追加できる
            if (firstHit.object.name === "ObstacleBox") {
                // 例えばボックスの色を変えるなど
                // firstHit.object.material.color.setHex(Math.random() * 0xffffff);
            }

        } else {
            console.log('Missed');
        }
    }

    update(time) {
        // 武器に関連する時間ベースの更新があればここに追加
        // (例: 継続的なアニメーション、パーティクルエフェクトなど)
        // this.animationGroup.update(time); // GameクラスのメインループでTWEEN.update()を呼ぶので不要
    }

    // マウスダウンイベントのリスナーをGameクラスで管理する場合、このメソッドを公開する
    handleMouseDown(event, isPointerLocked, collidableObjects) {
        if (isPointerLocked && event.button === 0 && this.canShoot) {
            this.canShoot = false;
            this.performShoot(collidableObjects);

            this.shootTimeout = setTimeout(() => {
                this.canShoot = true;
            }, this.shotCooldown * 1000);
        }
    }
}
