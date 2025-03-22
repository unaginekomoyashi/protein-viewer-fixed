/**
 * WebGLタンパク質構造ビューア - マップ表示モード
 * マップの表示モード（メッシュ、ボリューム）を管理
 */

class MapDisplay {
    constructor(renderer) {
        // レンダラーの参照
        this.renderer = renderer;
        
        // 表示モード
        this.displayModes = {
            mesh: {
                object: null,
                visible: true,
                color: 0x00ff00 // デフォルト色: 緑
            },
            volume: {
                object: null,
                visible: false,
                color: 0x00ff00 // デフォルト色: 緑
            }
        };
        
        // 現在のモード
        this.currentMode = 'mesh';
        
        // マップデータ
        this.mapData = null;
        this.mapFormat = null;
        
        // 等値面レベル
        this.contourLevel = 1.0;
        
        console.log('MapDisplay initialized');
    }
    
    // マップデータの読み込み
    loadMap(mapData, format) {
        // 既存の表示をクリア
        this.clearDisplay();
        
        // マップデータを保存
        this.mapData = mapData;
        this.mapFormat = format;
        
        // 各表示モードを作成
        this.createMeshRepresentation();
        this.createVolumeRepresentation();
        
        // 現在のモードを表示
        this.switchMode(this.currentMode);
        
        console.log(`Map loaded (${format})`);
    }
    
    // メッシュ表示の作成
    createMeshRepresentation() {
        if (!this.mapData) return;
        
        // メッシュ表示用のオブジェクト
        const meshObject = new THREE.Group();
        meshObject.name = 'mesh';
        meshObject.userData.type = 'map';
        
        try {
            // マップ形式に応じた処理
            switch (this.mapFormat) {
                case 'mrc':
                    this.createMrcMeshRepresentation(meshObject);
                    break;
                case 'mtz':
                    this.createMtzMeshRepresentation(meshObject);
                    break;
                case 'map':
                    this.createMapMeshRepresentation(meshObject);
                    break;
                default:
                    console.error(`Unsupported map format: ${this.mapFormat}`);
                    return;
            }
            
            // 表示モードに設定
            this.displayModes.mesh.object = meshObject;
            
            // シーンに追加（非表示状態）
            this.renderer.addToScene(meshObject);
            meshObject.visible = this.displayModes.mesh.visible;
            
        } catch (error) {
            console.error('Error creating mesh representation:', error);
        }
    }
    
    // MRCマップのメッシュ表示の作成
    createMrcMeshRepresentation(meshObject) {
        // MRCマップデータからメッシュを作成
        // 実際の実装では、MRCデータから等値面を抽出してメッシュを生成
        
        // 簡易的な実装として、ダミーのメッシュを作成
        this.createDummyMeshRepresentation(meshObject);
    }
    
    // MTZマップのメッシュ表示の作成
    createMtzMeshRepresentation(meshObject) {
        // MTZマップデータからメッシュを作成
        // 実際の実装では、MTZデータから等値面を抽出してメッシュを生成
        
        // 簡易的な実装として、ダミーのメッシュを作成
        this.createDummyMeshRepresentation(meshObject);
    }
    
    // MAPマップのメッシュ表示の作成
    createMapMeshRepresentation(meshObject) {
        if (!this.mapData || !this.mapData.header || !this.mapData.data) {
            console.error('Invalid MAP data');
            return;
        }
        
        try {
            // マップデータから等値面を抽出
            const isoLevel = this.contourLevel;
            const header = this.mapData.header;
            const data = this.mapData.data;
            
            // マーチングキューブアルゴリズムを使用して等値面を抽出
            const geometry = new THREE.BufferGeometry();
            
            // マーチングキューブアルゴリズムの実装
            // 簡易的な実装として、Three.jsのMarchingCubesを使用
            const marchingCubes = new MarchingCubes(
                header.nx,
                header.ny,
                header.nz,
                data,
                isoLevel
            );
            
            // ジオメトリを生成
            const { vertices, normals, indices } = marchingCubes.generateGeometry();
            
            // ジオメトリにデータを設定
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            geometry.setIndex(indices);
            
            // マテリアルを作成
            const material = new THREE.MeshPhongMaterial({
                color: this.displayModes.mesh.color,
                wireframe: false,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            // メッシュを作成
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData.type = 'map_mesh';
            
            // メッシュオブジェクトに追加
            meshObject.add(mesh);
            
        } catch (error) {
            console.error('Error creating MAP mesh representation:', error);
            // エラーが発生した場合はダミーのメッシュを作成
            this.createDummyMeshRepresentation(meshObject);
        }
    }
    
    // マーチングキューブアルゴリズムの簡易実装
    // 実際のプロジェクトでは、Three.jsのMarchingCubesを使用するか、
    // 完全なマーチングキューブアルゴリズムを実装する必要があります
    MarchingCubes(nx, ny, nz, data, isoLevel) {
        return {
            generateGeometry: function() {
                // 簡易的な実装として、球体のジオメトリを生成
                const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
                const vertices = [];
                const normals = [];
                const indices = [];
                
                // 頂点データを抽出
                const positionAttribute = sphereGeometry.getAttribute('position');
                const normalAttribute = sphereGeometry.getAttribute('normal');
                
                for (let i = 0; i < positionAttribute.count; i++) {
                    vertices.push(
                        positionAttribute.getX(i),
                        positionAttribute.getY(i),
                        positionAttribute.getZ(i)
                    );
                    
                    normals.push(
                        normalAttribute.getX(i),
                        normalAttribute.getY(i),
                        normalAttribute.getZ(i)
                    );
                }
                
                // インデックスデータを抽出
                if (sphereGeometry.index) {
                    for (let i = 0; i < sphereGeometry.index.count; i++) {
                        indices.push(sphereGeometry.index.getX(i));
                    }
                } else {
                    // インデックスがない場合は連番で生成
                    for (let i = 0; i < positionAttribute.count; i++) {
                        indices.push(i);
                    }
                }
                
                sphereGeometry.dispose();
                
                return { vertices, normals, indices };
            }
        };
    }
    
    // ダミーのメッシュ表示の作成（実装例）
    createDummyMeshRepresentation(meshObject) {
        // ダミーのジオメトリを作成
        const geometry = new THREE.IcosahedronGeometry(5, 1);
        
        // ワイヤーフレームマテリアルを作成
        const material = new THREE.MeshBasicMaterial({
            color: this.displayModes.mesh.color,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        // メッシュを作成
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.type = 'map_mesh';
        
        // メッシュオブジェクトに追加
        meshObject.add(mesh);
    }
    
    // ボリューム表示の作成
    createVolumeRepresentation() {
        if (!this.mapData) return;
        
        // ボリューム表示用のオブジェクト
        const volumeObject = new THREE.Group();
        volumeObject.name = 'volume';
        volumeObject.userData.type = 'map';
        
        try {
            // マップ形式に応じた処理
            switch (this.mapFormat) {
                case 'mrc':
                    this.createMrcVolumeRepresentation(volumeObject);
                    break;
                case 'mtz':
                    this.createMtzVolumeRepresentation(volumeObject);
                    break;
                case 'map':
                    this.createMapVolumeRepresentation(volumeObject);
                    break;
                default:
                    console.error(`Unsupported map format: ${this.mapFormat}`);
                    return;
            }
            
            // 表示モードに設定
            this.displayModes.volume.object = volumeObject;
            
            // シーンに追加（非表示状態）
            this.renderer.addToScene(volumeObject);
            volumeObject.visible = this.displayModes.volume.visible;
            
        } catch (error) {
            console.error('Error creating volume representation:', error);
        }
    }
    
    // MRCマップのボリューム表示の作成
    createMrcVolumeRepresentation(volumeObject) {
        // MRCマップデータからボリュームを作成
        // 実際の実装では、MRCデータからボリュームレンダリングを生成
        
        // 簡易的な実装として、ダミーのボリュームを作成
        this.createDummyVolumeRepresentation(volumeObject);
    }
    
    // MTZマップのボリューム表示の作成
    createMtzVolumeRepresentation(volumeObject) {
        // MTZマップデータからボリュームを作成
        // 実際の実装では、MTZデータからボリュームレンダリングを生成
        
        // 簡易的な実装として、ダミーのボリュームを作成
        this.createDummyVolumeRepresentation(volumeObject);
    }
    
    // MAPマップのボリューム表示の作成
    createMapVolumeRepresentation(volumeObject) {
        // MAPマップデータからボリュームを作成
        // 実際の実装では、MAPデータからボリュームレンダリングを生成
        
        // 簡易的な実装として、ダミーのボリュームを作成
        this.createDummyVolumeRepresentation(volumeObject);
    }
    
    // ダミーのボリューム表示の作成（実装例）
    createDummyVolumeRepresentation(volumeObject) {
        // ダミーのジオメトリを作成
        const geometry = new THREE.IcosahedronGeometry(5, 2);
        
        // ボリュームマテリアルを作成
        const material = new THREE.MeshPhongMaterial({
            color: this.displayModes.volume.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        // メッシュを作成
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.type = 'map_volume';
        
        // ボリュームオブジェクトに追加
        volumeObject.add(mesh);
    }
    
    // 表示モードの切替
    switchMode(mode) {
        if (!this.displayModes[mode]) {
            console.error(`Invalid display mode: ${mode}`);
            return;
        }
        
        // 現在のモードを更新
        this.currentMode = mode;
        
        // 各モードの表示状態を更新
        for (const [modeName, modeData] of Object.entries(this.displayModes)) {
            if (modeData.object) {
                modeData.object.visible = modeName === mode ? true : modeData.visible;
            }
        }
        
        console.log(`Switched to ${mode} mode`);
    }
    
    // 表示モードの表示/非表示
    setDisplayModeVisibility(mode, visible) {
        if (!this.displayModes[mode]) {
            console.error(`Invalid display mode: ${mode}`);
            return;
        }
        
        this.displayModes[mode].visible = visible;
        
        if (this.displayModes[mode].object) {
            this.displayModes[mode].object.visible = visible;
        }
    }
    
    // 等値面レベルの設定
    setContourLevel(level) {
        this.contourLevel = level;
        
        // 等値面レベルを更新
        this.updateContourLevel();
        
        console.log(`Contour level set to ${level}`);
    }
    
    // 等値面レベルの更新
    updateContourLevel() {
        // 実際の実装では、等値面レベルに応じてメッシュやボリュームを更新
        
        // 簡易的な実装として、スケールを変更
        const scale = 0.5 + this.contourLevel * 0.5;
        
        // メッシュモードの更新
        if (this.displayModes.mesh.object) {
            this.displayModes.mesh.object.scale.set(scale, scale, scale);
        }
        
        // ボリュームモードの更新
        if (this.displayModes.volume.object) {
            this.displayModes.volume.object.scale.set(scale, scale, scale);
        }
    }
    
    // 色の設定
    setColor(color) {
        // 現在のモードの色を変更
        this.displayModes[this.currentMode].color = color;
        
        // 表示オブジェクトの色を更新
        const object = this.displayModes[this.currentMode].object;
        
        if (object) {
            object.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            material.color.set(color);
                        });
                    } else {
                        child.material.color.set(color);
                    }
                }
            });
        }
    }
    
    // 表示をクリア
    clearDisplay() {
        // 各表示モードをクリア
        for (const mode of Object.keys(this.displayModes)) {
            if (this.displayModes[mode].object) {
                this.renderer.removeFromScene(this.displayModes[mode].object);
                this.displayModes[mode].object = null;
            }
        }
    }
    
    // マップを削除
    removeMap(fileName) {
        this.clearDisplay();
        this.mapData = null;
        this.mapFormat = null;
    }
    
    // マップオブジェクトを取得
    getMapObject() {
        return this.displayModes[this.currentMode].object;
    }
    
    // 実際のマップデータ処理（MRC形式）
    processMrcData(data) {
        // MRCデータの処理
        // 実際の実装では、MRCファイルのバイナリデータを解析して3Dグリッドデータを抽出
        
        // 簡易的な実装として、ダミーデータを返す
        return {
            grid: {
                nx: 10,
                ny: 10,
                nz: 10,
                data: new Float32Array(10 * 10 * 10)
            },
            header: {
                cellDimensions: { x: 10, y: 10, z: 10 },
                origin: { x: 0, y: 0, z: 0 }
            }
        };
    }
    
    // 実際のマップデータ処理（MTZ形式）
    processMtzData(data) {
        // MTZデータの処理
        // 実際の実装では、MTZファイルのバイナリデータを解析して構造因子を抽出し、
        // フーリエ変換によって電子密度マップを計算
        
        // 簡易的な実装として、ダミーデータを返す
        return {
            grid: {
                nx: 10,
                ny: 10,
                nz: 10,
                data: new Float32Array(10 * 10 * 10)
            },
            header: {
                cellDimensions: { x: 10, y: 10, z: 10 },
                origin: { x: 0, y: 0, z: 0 }
            }
        };
    }
    
    // 実際のマップデータ処理（MAP形式）
    processMapData(data) {
        // MAPデータの処理
        // 実際の実装では、MAPファイルのバイナリデータを解析して3Dグリッドデータを抽出
        
        // 簡易的な実装として、ダミーデータを返す
        return {
            grid: {
                nx: 10,
                ny: 10,
                nz: 10,
                data: new Float32Array(10 * 10 * 10)
            },
            header: {
                cellDimensions: { x: 10, y: 10, z: 10 },
                origin: { x: 0, y: 0, z: 0 }
            }
        };
    }
    
    // 等値面の抽出（マーチングキューブアルゴリズム）
    extractIsosurface(gridData, level) {
        // マーチングキューブアルゴリズムを使用して等値面を抽出
        // 実際の実装では、Three.jsのMarchingCubesを使用するか、
        // カスタムのマーチングキューブアルゴリズムを実装
        
        // 簡易的な実装として、ダミーのジオメトリを返す
        return new THREE.IcosahedronGeometry(5, 1);
    }
    
    // ボリュームレンダリングの作成
    createVolumeRendering(gridData) {
        // ボリュームレンダリングの作成
        // 実際の実装では、Three.jsのWebGLVolumeRenderingを使用するか、
        // カスタムのボリュームレンダリングを実装
        
        // 簡易的な実装として、ダミーのジオメトリを返す
        return new THREE.IcosahedronGeometry(5, 2);
    }
}