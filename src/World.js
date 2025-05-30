// シーン内の環境オブジェクト（床、障害物、光源など）のセットアップを担当します。
import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.collidableObjects = []; // 衝突判定用のオブジェクト
    }

    init() {
        // 光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);


        // 床
        const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
        floorGeometry.rotateX(-Math.PI / 2);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8, metalness: 0.2 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.scene.add(floor);

        // ボックス (障害物)
        const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
        const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(0, 10, -50);
        box.name = "ObstacleBox"; // デバッグ用に名前を設定
        this.scene.add(box);
        this.collidableObjects.push(box);
    }

    getCollidableObjects() {
        return this.collidableObjects;
    }
}
