/**
 * WebGLタンパク質構造ビューア - コントロール
 * カメラコントロールとキーボードショートカットを担当
 */

class Controls {
    constructor(app) {
        // アプリケーションの参照
        this.app = app;
        
        // キーボードの状態
        this.keys = {
            shift: false,
            ctrl: false,
            alt: false
        };
        
        // 現在のアミノ酸インデックス
        this.currentResidueIndex = 0;
        
        // イベントリスナーの設定
        this.setupEventListeners();
    }
    
    // イベントリスナーの設定
    setupEventListeners() {
        // キーボードイベント
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        
        // マウスイベント
        this.app.elements.viewer.addEventListener('click', (event) => this.handleClick(event));
        this.app.elements.viewer.addEventListener('dblclick', (event) => this.handleDoubleClick(event));
        this.app.elements.viewer.addEventListener('contextmenu', (event) => {
            // 右クリックメニューを無効化
            event.preventDefault();
        });
        
        // マウスドラッグイベント
        this.app.elements.viewer.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.app.elements.viewer.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.app.elements.viewer.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        
        console.log('Controls initialized');
    }
    
    // マウスダウンイベントの処理
    handleMouseDown(event) {
        // OrbitControlsが処理するので何もしない
    }
    
    // マウスムーブイベントの処理
    handleMouseMove(event) {
        // OrbitControlsが処理するので何もしない
    }
    
    // マウスアップイベントの処理
    handleMouseUp(event) {
        // OrbitControlsが処理するので何もしない
    }
    
    // キーダウンイベントの処理
    handleKeyDown(event) {
        // 修飾キーの状態を更新
        if (event.key === 'Shift') this.keys.shift = true;
        if (event.key === 'Control') this.keys.ctrl = true;
        if (event.key === 'Alt') this.keys.alt = true;
        
        // フォーカスがテキスト入力にある場合は処理しない
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        // Shiftキーでアミノ酸を進む
        if (this.keys.shift && !this.keys.ctrl && !event.repeat) {
            this.navigateToNextResidue();
        }
        
        // Ctrl+Shiftでアミノ酸を戻る
        if (this.keys.shift && this.keys.ctrl && !event.repeat) {
            this.navigateToPreviousResidue();
        }
        
        // その他のショートカットキー
        switch (event.key) {
            case 'r':
                // リボン表示に切り替え
                this.app.switchProteinDisplayMode('ribbon');
                break;
            case 'l':
                // ライン表示に切り替え
                this.app.switchProteinDisplayMode('line');
                break;
            case 's':
                // スティック表示に切り替え
                this.app.switchProteinDisplayMode('stick');
                break;
            case 'm':
                // メッシュ表示に切り替え
                this.app.switchMapDisplayMode('mesh');
                break;
            case 'v':
                // ボリューム表示に切り替え
                this.app.switchMapDisplayMode('volume');
                break;
            case '+':
            case '=':
                // 等値面レベルを上げる
                this.increaseContourLevel();
                break;
            case '-':
            case '_':
                // 等値面レベルを下げる
                this.decreaseContourLevel();
                break;
            case 'h':
                // ヘルプ表示
                this.showHelp();
                break;
        }
    }
    
    // キーアップイベントの処理
    handleKeyUp(event) {
        // 修飾キーの状態を更新
        if (event.key === 'Shift') this.keys.shift = false;
        if (event.key === 'Control') this.keys.ctrl = false;
        if (event.key === 'Alt') this.keys.alt = false;
    }
    
    // クリックイベントの処理
    handleClick(event) {
        // レイキャストでオブジェクトを選択
        const intersects = this.app.renderer.rayCast(event.clientX, event.clientY);
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            
            // 選択されたオブジェクトがアトムの場合
            if (selectedObject.userData && selectedObject.userData.type === 'atom') {
                const atom = selectedObject.userData.atom;
                this.selectAtom(atom);
            }
            // 選択されたオブジェクトが残基の場合
            else if (selectedObject.userData && selectedObject.userData.type === 'residue') {
                const residue = selectedObject.userData.residue;
                this.selectResidue(residue);
            }
        }
    }
    
    // ダブルクリックイベントの処理
    handleDoubleClick(event) {
        // レイキャストでオブジェクトを選択
        const intersects = this.app.renderer.rayCast(event.clientX, event.clientY);
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            
            // 選択されたオブジェクトにカメラをフォーカス
            this.app.renderer.fitCameraToObject(selectedObject, 1.5);
        }
    }
    
    // アトムを選択
    selectAtom(atom) {
        if (!atom) return;
        
        console.log('Selected atom:', atom);
        
        // アトムの情報を表示
        const info = `選択されたアトム: ${atom.name} (残基: ${atom.residue.name} ${atom.residue.number}, チェーン: ${atom.chain})`;
        this.app.showCommandOutput(info);
        
        // アトムをハイライト表示
        if (this.app.proteinDisplay) {
            this.app.proteinDisplay.highlightAtom(atom);
        }
    }
    
    // 残基を選択
    selectResidue(residue) {
        if (!residue) return;
        
        console.log('Selected residue:', residue);
        
        // 残基の情報を表示
        const info = `選択された残基: ${residue.name} ${residue.number} (チェーン: ${residue.chain})`;
        this.app.showCommandOutput(info);
        
        // 残基をハイライト表示
        if (this.app.proteinDisplay) {
            this.app.proteinDisplay.highlightResidue(residue);
        }
        
        // 現在の残基インデックスを更新
        if (this.app.state.loadedFiles) {
            for (const fileName in this.app.state.loadedFiles) {
                const file = this.app.state.loadedFiles[fileName];
                if (file.type === 'protein' && file.data && file.data.residues) {
                    const residues = file.data.residues;
                    this.currentResidueIndex = residues.findIndex(r => 
                        r.number === residue.number && r.chain === residue.chain
                    );
                    break;
                }
            }
        }
    }
    
    // 次のアミノ酸に移動
    navigateToNextResidue() {
        // タンパク質構造が読み込まれているか確認
        let residues = null;
        
        for (const fileName in this.app.state.loadedFiles) {
            const file = this.app.state.loadedFiles[fileName];
            if (file.type === 'protein' && file.data && file.data.residues) {
                residues = file.data.residues;
                break;
            }
        }
        
        if (!residues || residues.length === 0) {
            console.log('No protein structure loaded');
            return;
        }
        
        // 次の残基インデックスを計算
        this.currentResidueIndex = (this.currentResidueIndex + 1) % residues.length;
        const nextResidue = residues[this.currentResidueIndex];
        
        // 次の残基を選択
        this.selectResidue(nextResidue);
        
        // カメラを残基にフォーカス
        if (this.app.proteinDisplay) {
            const residueObject = this.app.proteinDisplay.getResidueObject(nextResidue);
            if (residueObject) {
                this.app.renderer.fitCameraToObject(residueObject, 2.0);
            }
        }
    }
    
    // 前のアミノ酸に移動
    navigateToPreviousResidue() {
        // タンパク質構造が読み込まれているか確認
        let residues = null;
        
        for (const fileName in this.app.state.loadedFiles) {
            const file = this.app.state.loadedFiles[fileName];
            if (file.type === 'protein' && file.data && file.data.residues) {
                residues = file.data.residues;
                break;
            }
        }
        
        if (!residues || residues.length === 0) {
            console.log('No protein structure loaded');
            return;
        }
        
        // 前の残基インデックスを計算
        this.currentResidueIndex = (this.currentResidueIndex - 1 + residues.length) % residues.length;
        const prevResidue = residues[this.currentResidueIndex];
        
        // 前の残基を選択
        this.selectResidue(prevResidue);
        
        // カメラを残基にフォーカス
        if (this.app.proteinDisplay) {
            const residueObject = this.app.proteinDisplay.getResidueObject(prevResidue);
            if (residueObject) {
                this.app.renderer.fitCameraToObject(residueObject, 2.0);
            }
        }
    }
    
    // 等値面レベルを上げる
    increaseContourLevel() {
        const currentLevel = parseFloat(this.app.elements.contourLevel.value);
        const step = parseFloat(this.app.elements.contourLevel.step);
        const max = parseFloat(this.app.elements.contourLevel.max);
        
        let newLevel = currentLevel + step;
        if (newLevel > max) newLevel = max;
        
        this.app.elements.contourLevel.value = newLevel;
        this.app.setContourLevel(newLevel);
    }
    
    // 等値面レベルを下げる
    decreaseContourLevel() {
        const currentLevel = parseFloat(this.app.elements.contourLevel.value);
        const step = parseFloat(this.app.elements.contourLevel.step);
        const min = parseFloat(this.app.elements.contourLevel.min);
        
        let newLevel = currentLevel - step;
        if (newLevel < min) newLevel = min;
        
        this.app.elements.contourLevel.value = newLevel;
        this.app.setContourLevel(newLevel);
    }
    
    // ヘルプ表示
    showHelp() {
        const helpText = `
キーボードショートカット:
-----------------------
r: リボン表示に切り替え
l: ライン表示に切り替え
s: スティック表示に切り替え
m: マップをメッシュ表示に切り替え
v: マップをボリューム表示に切り替え
+/=: 等値面レベルを上げる
-/_: 等値面レベルを下げる
Shift: 次のアミノ酸に移動
Ctrl+Shift: 前のアミノ酸に移動
h: このヘルプを表示

マウス操作:
---------
左クリック: オブジェクトを選択
ダブルクリック: 選択したオブジェクトにカメラをフォーカス
ドラッグ: カメラを回転
右ドラッグ: ズーム
中ドラッグ/Shift+左ドラッグ: パン
`;
        
        this.app.showCommandOutput(helpText);
    }
}