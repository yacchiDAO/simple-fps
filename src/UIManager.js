// UI要素の表示・非表示、ポインターロック時のUI制御を担当します。
export class UIManager {
    constructor(blockerId, instructionsId, crosshairId) {
        this.blocker = document.getElementById(blockerId);
        this.instructions = document.getElementById(instructionsId);
        this.crosshair = document.getElementById(crosshairId); // 将来的に使うかもしれない
    }

    setupPointerLock(controls) {
        this.instructions.addEventListener('click', () => {
            controls.lock();
        });

        controls.addEventListener('lock', () => {
            this.instructions.style.display = 'none';
            this.blocker.style.display = 'none';
            document.body.classList.add('locked');
        });

        controls.addEventListener('unlock', () => {
            this.blocker.style.display = 'flex';
            this.instructions.style.display = 'block';
            document.body.classList.remove('locked');
        });
    }
}
