/**
 * WebGLタンパク質構造ビューア - レンダラー
 * Three.jsを使用した3Dレンダリングを担当
 */

class Renderer {
    constructor(container) {
        // コンテナ要素
        this.container = container;
        
        // Three.jsのコンポーネント
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.light = null;
        
        // アニメーションフレーム
        this.animationFrameId = null;
        
        // 初期化
        this.init();
    }
    
    // 初期化
    init() {
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // カメラの作成
        this.setupCamera();
        
        // レンダラーの作成
        this.setupRenderer();
        
        // ライトの設定
        this.setupLights();
        
        // コントロールの設定
        this.setupControls();
        
        // ウィンドウリサイズイベントの設定
        window.addEventListener('resize', () => this.handleResize());
        
        // 初期サイズの設定
        this.handleResize();
        
        console.log('Renderer initialized');
    }
    
    // カメラの設定
    setupCamera() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const aspect = width / height;
        
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 50);
        this.camera.lookAt(0, 0, 0);
    }
    
    // レンダラーの設定
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // コンテナに追加
        this.container.appendChild(this.renderer.domElement);
    }
    
    // ライトの設定
    setupLights() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // ディレクショナルライト（太陽光のような平行光源）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        
        // シャドウマップの設定
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        
        this.scene.add(directionalLight);
        this.light = directionalLight;
        
        // 半球光（空と地面からの光）
        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
        this.scene.add(hemisphereLight);
    }
    
    // コントロールの設定
    setupControls() {
        // OrbitControlsの設定
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 500;
        this.controls.maxPolarAngle = Math.PI;
        
        // コントロールの更新イベント
        this.controls.addEventListener('change', () => {
            this.render();
        });
    }
    
    // レンダリングループの開始
    startRenderLoop() {
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);
            
            // コントロールの更新
            if (this.controls) {
                this.controls.update();
            }
            
            // レンダリング
            this.render();
        };
        
        animate();
    }
    
    // レンダリングループの停止
    stopRenderLoop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    // レンダリング
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ウィンドウリサイズ時の処理
    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // カメラのアスペクト比を更新
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // レンダラーのサイズを更新
        this.renderer.setSize(width, height);
        
        // 再レンダリング
        this.render();
    }
    
    // シーンにオブジェクトを追加
    addToScene(object) {
        if (object) {
            this.scene.add(object);
            this.render();
        }
    }
    
    // シーンからオブジェクトを削除
    removeFromScene(object) {
        if (object) {
            this.scene.remove(object);
            this.render();
        }
    }
    
    // シーンをクリア（特定のタイプのオブジェクトを削除）
    clearScene(objectType = null) {
        const objectsToRemove = [];
        
        this.scene.traverse((object) => {
            if (objectType === null || object.userData.type === objectType) {
                if (object !== this.camera && !(object instanceof THREE.Light)) {
                    objectsToRemove.push(object);
                }
            }
        });
        
        objectsToRemove.forEach((object) => {
            this.scene.remove(object);
            
            // メモリリークを防ぐためにジオメトリとマテリアルを破棄
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.render();
    }
    
    // カメラを特定の位置に移動
    setCameraPosition(x, y, z) {
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
        this.render();
    }
    
    // カメラを特定のオブジェクトに合わせる
    fitCameraToObject(object, offset = 1.25) {
        const boundingBox = new THREE.Box3();
        
        // オブジェクトのバウンディングボックスを計算
        boundingBox.setFromObject(object);
        
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        // オブジェクトの最大サイズを取得
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * offset;
        
        // カメラの位置を更新
        this.camera.position.set(center.x, center.y, center.z + cameraZ);
        
        // カメラの注視点を更新
        this.controls.target.set(center.x, center.y, center.z);
        
        // カメラとコントロールを更新
        this.camera.updateProjectionMatrix();
        this.controls.update();
        
        // 再レンダリング
        this.render();
    }
    
    // スクリーン座標からレイキャスト（マウスピッキングなどに使用）
    rayCast(screenX, screenY) {
        // マウス位置を正規化（-1から1の範囲）
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((screenX - rect.left) / rect.width) * 2 - 1;
        const y = -((screenY - rect.top) / rect.height) * 2 + 1;
        
        // レイキャスターの作成
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(x, y);
        
        // レイの設定
        raycaster.setFromCamera(mouse, this.camera);
        
        // シーン内のオブジェクトとの交差を検出
        return raycaster.intersectObjects(this.scene.children, true);
    }
    
    // デバッグ用のグリッドを表示
    showGrid(size = 100, divisions = 100, color = 0x888888) {
        const grid = new THREE.GridHelper(size, divisions, color, color);
        grid.userData.type = 'helper';
        this.scene.add(grid);
        this.render();
        return grid;
    }
    
    // デバッグ用の座標軸を表示
    showAxes(size = 10) {
        const axes = new THREE.AxesHelper(size);
        axes.userData.type = 'helper';
        this.scene.add(axes);
        this.render();
        return axes;
    }
}

// OrbitControlsがロードされていない場合のフォールバック
if (typeof THREE.OrbitControls === 'undefined') {
    console.warn('THREE.OrbitControls is not loaded. Using a simple implementation.');
    
    // 簡易的なOrbitControlsの実装
    THREE.OrbitControls = class {
        constructor(camera, domElement) {
            this.camera = camera;
            this.domElement = domElement;
            this.target = new THREE.Vector3();
            this.enableDamping = false;
            this.dampingFactor = 0.25;
            this.screenSpacePanning = true;
            this.minDistance = 0;
            this.maxDistance = Infinity;
            this.maxPolarAngle = Math.PI;
            
            // イベントリスナー
            this._listeners = {};
            
            // マウスイベントの設定
            this._setupMouseEvents();
        }
        
        _setupMouseEvents() {
            // 簡易的なマウス操作
            let isDragging = false;
            let previousMousePosition = { x: 0, y: 0 };
            
            this.domElement.addEventListener('mousedown', (event) => {
                isDragging = true;
                previousMousePosition = {
                    x: event.clientX,
                    y: event.clientY
                };
            });
            
            this.domElement.addEventListener('mousemove', (event) => {
                if (!isDragging) return;
                
                const deltaMove = {
                    x: event.clientX - previousMousePosition.x,
                    y: event.clientY - previousMousePosition.y
                };
                
                // 回転操作
                if (event.buttons === 1) {
                    const rotationSpeed = 0.01;
                    
                    // カメラを回転
                    this.camera.position.x = 
                        this.camera.position.x * Math.cos(rotationSpeed * deltaMove.x) +
                        this.camera.position.z * Math.sin(rotationSpeed * deltaMove.x);
                    this.camera.position.z = 
                        -this.camera.position.x * Math.sin(rotationSpeed * deltaMove.x) +
                        this.camera.position.z * Math.cos(rotationSpeed * deltaMove.x);
                    
                    // カメラの上下回転
                    const deltaRotationY = rotationSpeed * deltaMove.y;
                    const distance = this.camera.position.distanceTo(this.target);
                    
                    // 現在の仰角を計算
                    let currentElevation = Math.asin(this.camera.position.y / distance);
                    currentElevation -= deltaRotationY;
                    
                    // 仰角の制限
                    currentElevation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, currentElevation));
                    
                    // 新しい位置を計算
                    this.camera.position.y = distance * Math.sin(currentElevation);
                    const radiusXZ = distance * Math.cos(currentElevation);
                    
                    // XZ平面での角度を維持
                    const angleXZ = Math.atan2(this.camera.position.z, this.camera.position.x);
                    this.camera.position.x = radiusXZ * Math.cos(angleXZ);
                    this.camera.position.z = radiusXZ * Math.sin(angleXZ);
                }
                
                // ズーム操作
                if (event.buttons === 2) {
                    const zoomSpeed = 0.1;
                    const direction = new THREE.Vector3().subVectors(this.camera.position, this.target).normalize();
                    const distance = this.camera.position.distanceTo(this.target);
                    
                    // 新しい距離を計算
                    let newDistance = distance * (1 + zoomSpeed * deltaMove.y / 100);
                    newDistance = Math.max(this.minDistance, Math.min(this.maxDistance, newDistance));
                    
                    // カメラ位置を更新
                    this.camera.position.copy(this.target).add(direction.multiplyScalar(newDistance));
                }
                
                // パン操作
                if (event.buttons === 4 || (event.buttons === 1 && event.shiftKey)) {
                    const panSpeed = 0.01;
                    
                    // カメラの右方向と上方向を計算
                    const right = new THREE.Vector3();
                    const up = new THREE.Vector3();
                    const forward = new THREE.Vector3();
                    
                    forward.subVectors(this.target, this.camera.position).normalize();
                    right.crossVectors(forward, this.camera.up).normalize();
                    up.crossVectors(right, forward).normalize();
                    
                    // 移動量を計算
                    const panX = -deltaMove.x * panSpeed * distance;
                    const panY = deltaMove.y * panSpeed * distance;
                    
                    // カメラとターゲットを移動
                    this.camera.position.add(right.multiplyScalar(panX));
                    this.camera.position.add(up.multiplyScalar(panY));
                    this.target.add(right.multiplyScalar(panX));
                    this.target.add(up.multiplyScalar(panY));
                }
                
                previousMousePosition = {
                    x: event.clientX,
                    y: event.clientY
                };
                
                // 変更イベントを発火
                this._dispatchEvent('change');
            });
            
            this.domElement.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            // ホイールでのズーム
            this.domElement.addEventListener('wheel', (event) => {
                event.preventDefault();
                
                const zoomSpeed = 0.1;
                const direction = new THREE.Vector3().subVectors(this.camera.position, this.target).normalize();
                const distance = this.camera.position.distanceTo(this.target);
                
                // ホイールの方向に応じてズーム
                const delta = event.deltaY > 0 ? 1 : -1;
                let newDistance = distance * (1 + zoomSpeed * delta / 10);
                newDistance = Math.max(this.minDistance, Math.min(this.maxDistance, newDistance));
                
                // カメラ位置を更新
                this.camera.position.copy(this.target).add(direction.multiplyScalar(newDistance));
                
                // 変更イベントを発火
                this._dispatchEvent('change');
            });
        }
        
        // イベントリスナーの追加
        addEventListener(type, listener) {
            if (!this._listeners[type]) {
                this._listeners[type] = [];
            }
            
            if (this._listeners[type].indexOf(listener) === -1) {
                this._listeners[type].push(listener);
            }
        }
        
        // イベントリスナーの削除
        removeEventListener(type, listener) {
            if (!this._listeners[type]) return;
            
            const index = this._listeners[type].indexOf(listener);
            if (index !== -1) {
                this._listeners[type].splice(index, 1);
            }
        }
        
        // イベントの発火
        _dispatchEvent(type) {
            if (!this._listeners[type]) return;
            
            const event = { type: type, target: this };
            
            for (let i = 0, l = this._listeners[type].length; i < l; i++) {
                this._listeners[type][i].call(this, event);
            }
        }
        
        // コントロールの更新
        update() {
            this.camera.lookAt(this.target);
            return true;
        }
        
        // 破棄
        dispose() {
            // イベントリスナーのクリーンアップ
            this._listeners = {};
        }
    };
}