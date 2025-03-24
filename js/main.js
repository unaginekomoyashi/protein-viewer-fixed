/**
 * WebGLタンパク質構造ビューア - メインアプリケーションロジック
 */

// アプリケーションのメインクラス
class ProteinViewer {
    constructor() {
        // 状態管理
        this.state = {
            loadedFiles: {},
            activeProteinDisplayMode: 'ribbon',
            activeMapDisplayMode: 'mesh',
            contourLevel: 1.0,
            selectedResidues: new Set(),
            currentResidue: null
        };
        
        // コンポーネント
        this.renderer = null;
        this.commandParser = null;
        this.controls = null;
        this.proteinDisplay = null;
        this.mapDisplay = null;
        
        // ファイルパーサー
        this.parsers = {
            pdb: null,
            mrc: null,
            mtz: null,
            map: null
        };
        
    // DOM要素
        this.elements = {
            viewer: document.getElementById('protein-viewer'),
            fileInput: document.getElementById('file-input'),
            fileName: document.getElementById('file-name'),
            loadedFilesList: document.getElementById('loaded-files-list'),
            commandInput: document.getElementById('command-input'),
            executeCommand: document.getElementById('execute-command'),
            commandOutput: document.getElementById('command-output'),
            commandHistory: document.getElementById('command-history'),
            structureInfo: document.getElementById('structure-info'),
            selectionInfo: document.getElementById('selection-info'),
            loadingOverlay: document.getElementById('loading-overlay'),
            contourLevel: document.getElementById('contour-level'),
            contourLevelValue: document.getElementById('contour-level-value'),
            centerView: document.getElementById('center-view'),
            displayModeButtons: {
                ribbon: document.getElementById('ribbon-mode'),
                line: document.getElementById('line-mode'),
                stick: document.getElementById('stick-mode'),
                mesh: document.getElementById('mesh-mode'),
                volume: document.getElementById('volume-mode')
            }
        };
        
        // 初期化
        this.init();
    }
    
    // アプリケーションの初期化
    init() {
        // レンダラーの初期化
        this.renderer = new Renderer(this.elements.viewer);
        
        // コマンドパーサーの初期化
        this.commandParser = new CommandParser(this);
        
        // コントロールの初期化
        this.controls = new Controls(this);
        
        // パーサーの初期化
        this.parsers.pdb = new PdbParser();
        this.parsers.mrc = new MrcParser();
        this.parsers.mtz = new MtzParser();
        this.parsers.map = new MapParser();
        
        // 表示モードの初期化
        this.proteinDisplay = new ProteinDisplay(this.renderer);
        this.mapDisplay = new MapDisplay(this.renderer);
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // レンダリングループの開始
        this.renderer.startRenderLoop();
        
        console.log('ProteinViewer initialized');
    }
    
    // イベントリスナーの設定
    setupEventListeners() {
        // ファイル選択
        this.elements.fileInput.addEventListener('change', (event) => this.handleFileSelect(event));
        
        // コマンド実行
        this.elements.executeCommand.addEventListener('click', () => this.executeCommand());
        this.elements.commandInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.executeCommand();
            }
        });
        
        // 表示モード切替ボタン
        this.elements.displayModeButtons.ribbon.addEventListener('click', () => this.switchProteinDisplayMode('ribbon'));
        this.elements.displayModeButtons.line.addEventListener('click', () => this.switchProteinDisplayMode('line'));
        this.elements.displayModeButtons.stick.addEventListener('click', () => this.switchProteinDisplayMode('stick'));
        this.elements.displayModeButtons.mesh.addEventListener('click', () => this.switchMapDisplayMode('mesh'));
        this.elements.displayModeButtons.volume.addEventListener('click', () => this.switchMapDisplayMode('volume'));
        
        // 中心に配置ボタン
        this.elements.centerView.addEventListener('click', () => this.centerView());
        
        // 等値面レベルスライダー
        this.elements.contourLevel.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            this.setContourLevel(value);
        });
        
        // ウィンドウリサイズ
        window.addEventListener('resize', () => this.renderer.handleResize());
    }
    
    // ファイル選択ハンドラ
    handleFileSelect(event) {
        const files = event.target.files;
        if (files.length === 0) return;
        
        this.showLoading();
        
        // ファイル名の表示
        if (files.length === 1) {
            this.elements.fileName.textContent = files[0].name;
        } else {
            this.elements.fileName.textContent = `${files.length} files selected`;
        }
        
        // 各ファイルを処理
        Array.from(files).forEach(file => {
            this.loadFile(file);
        });
    }
    
    // ファイルの読み込み
    loadFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const fileContent = event.target.result;
            
            try {
                let parsedData;
                
                // ファイル形式に応じたパーサーを使用
                switch (fileExtension) {
                    case 'pdb':
                        parsedData = this.parsers.pdb.parse(fileContent);
                        this.loadProteinStructure(file.name, parsedData);
                        break;
                    case 'mrc':
                        parsedData = this.parsers.mrc.parse(fileContent);
                        this.loadDensityMap(file.name, parsedData, 'mrc');
                        break;
                    case 'mtz':
                        parsedData = this.parsers.mtz.parse(fileContent);
                        this.loadDensityMap(file.name, parsedData, 'mtz');
                        break;
                    case 'map':
                        parsedData = this.parsers.map.parse(fileContent);
                        this.loadDensityMap(file.name, parsedData, 'map');
                        break;
                    default:
                        console.error(`Unsupported file format: ${fileExtension}`);
                        this.showCommandOutput(`エラー: サポートされていないファイル形式です: ${fileExtension}`);
                }
                
                // 読み込んだファイルをリストに追加
                this.addFileToList(file.name, fileExtension);
                
            } catch (error) {
                console.error(`Error parsing file ${file.name}:`, error);
                this.showCommandOutput(`エラー: ファイル ${file.name} の解析中にエラーが発生しました: ${error.message}`);
            }
            
            this.hideLoading();
        };
        
        reader.onerror = (error) => {
            console.error(`Error reading file ${file.name}:`, error);
            this.showCommandOutput(`エラー: ファイル ${file.name} の読み込み中にエラーが発生しました`);
            this.hideLoading();
        };
        
        // ファイル形式に応じた読み込み方法
        if (fileExtension === 'pdb') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }
    
    // タンパク質構造の読み込み
    loadProteinStructure(fileName, data) {
        this.state.loadedFiles[fileName] = {
            type: 'protein',
            data: data
        };
        
        // タンパク質表示の更新
        this.proteinDisplay.loadStructure(data);
        this.proteinDisplay.switchMode(this.state.activeProteinDisplayMode);
        
        // 構造情報の表示
        this.updateStructureInfo(data);
        
        // 分子を中心に配置
        this.centerView();
        
        console.log(`Loaded protein structure: ${fileName}`);
        this.showCommandOutput(`タンパク質構造を読み込みました: ${fileName}`);
    }
    
    // 電子密度マップの読み込み
    loadDensityMap(fileName, data, format) {
        this.state.loadedFiles[fileName] = {
            type: 'map',
            format: format,
            data: data
        };
        
        // マップ表示の更新
        this.mapDisplay.loadMap(data, format);
        this.mapDisplay.switchMode(this.state.activeMapDisplayMode);
        this.mapDisplay.setContourLevel(this.state.contourLevel);
        
        // 分子を中心に配置
        this.centerView();
        
        console.log(`Loaded density map: ${fileName} (${format})`);
        this.showCommandOutput(`電子密度マップを読み込みました: ${fileName} (${format})`);
    }
    
    // 分子を中心に配置
    centerView() {
        // タンパク質構造がある場合
        if (this.proteinDisplay && this.proteinDisplay.getProteinObject()) {
            const proteinObject = this.proteinDisplay.getProteinObject();
            this.renderer.fitCameraToObject(proteinObject, 1.5);
            console.log('Centered view on protein structure');
            return;
        }
        
        // マップがある場合
        if (this.mapDisplay && this.mapDisplay.getMapObject()) {
            const mapObject = this.mapDisplay.getMapObject();
            this.renderer.fitCameraToObject(mapObject, 1.5);
            console.log('Centered view on density map');
            return;
        }
        
        console.log('No objects to center view on');
    }
    
    // ファイルリストにファイルを追加
    addFileToList(fileName, fileType) {
        const fileItem = document.createElement('div');
        fileItem.className = 'loaded-file-item';
        
        const fileInfo = document.createElement('span');
        fileInfo.textContent = `${fileName} (${fileType})`;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'file-remove-btn';
        removeButton.textContent = '削除';
        removeButton.addEventListener('click', () => this.removeFile(fileName));
        
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeButton);
        
        this.elements.loadedFilesList.appendChild(fileItem);
    }
    
    // ファイルの削除
    removeFile(fileName) {
        if (this.state.loadedFiles[fileName]) {
            const fileType = this.state.loadedFiles[fileName].type;
            
            // ファイルタイプに応じた処理
            if (fileType === 'protein') {
                this.proteinDisplay.removeStructure(fileName);
            } else if (fileType === 'map') {
                this.mapDisplay.removeMap(fileName);
            }
            
            // 状態から削除
            delete this.state.loadedFiles[fileName];
            
            // リストから削除
            const fileItems = this.elements.loadedFilesList.querySelectorAll('.loaded-file-item');
            fileItems.forEach(item => {
                if (item.querySelector('span').textContent.startsWith(fileName)) {
                    this.elements.loadedFilesList.removeChild(item);
                }
            });
            
            console.log(`Removed file: ${fileName}`);
            this.showCommandOutput(`ファイルを削除しました: ${fileName}`);
        }
    }
    
    // タンパク質表示モードの切替
    switchProteinDisplayMode(mode) {
        if (this.state.activeProteinDisplayMode === mode) return;
        
        // ボタンの状態を更新
        Object.keys(this.elements.displayModeButtons).forEach(key => {
            if (['ribbon', 'line', 'stick'].includes(key)) {
                this.elements.displayModeButtons[key].classList.remove('active');
            }
        });
        this.elements.displayModeButtons[mode].classList.add('active');
        
        // 表示モードを切替
        this.state.activeProteinDisplayMode = mode;
        this.proteinDisplay.switchMode(mode);
        
        console.log(`Switched protein display mode to: ${mode}`);
    }
    
    // マップ表示モードの切替
    switchMapDisplayMode(mode) {
        if (this.state.activeMapDisplayMode === mode) return;
        
        // ボタンの状態を更新
        Object.keys(this.elements.displayModeButtons).forEach(key => {
            if (['mesh', 'volume'].includes(key)) {
                this.elements.displayModeButtons[key].classList.remove('active');
            }
        });
        this.elements.displayModeButtons[mode].classList.add('active');
        
        // 表示モードを切替
        this.state.activeMapDisplayMode = mode;
        this.mapDisplay.switchMode(mode);
        
        console.log(`Switched map display mode to: ${mode}`);
    }
    
    // 等値面レベルの設定
    setContourLevel(value) {
        this.state.contourLevel = value;
        this.elements.contourLevelValue.textContent = value.toFixed(1);
        this.mapDisplay.setContourLevel(value);
    }
    
    // コマンドの実行
    executeCommand() {
        const commandText = this.elements.commandInput.value.trim();
        if (!commandText) return;
        
        try {
            // コマンドパーサーを使用してコマンドを実行
            const result = this.commandParser.parseCommand(commandText);
            
            // コマンド履歴に追加
            this.addCommandToHistory(commandText);
            
            // 結果を表示
            this.showCommandOutput(result);
            
            // 入力フィールドをクリア
            this.elements.commandInput.value = '';
            
        } catch (error) {
            console.error('Command execution error:', error);
            this.showCommandOutput(`エラー: ${error.message}`);
        }
    }
    
    // コマンド履歴に追加
    addCommandToHistory(command) {
        const historyItem = document.createElement('div');
        historyItem.className = 'command-history-item';
        historyItem.textContent = `> ${command}`;
        this.elements.commandHistory.appendChild(historyItem);
        this.elements.commandHistory.scrollTop = this.elements.commandHistory.scrollHeight;
    }
    
    // コマンド出力の表示
    showCommandOutput(text) {
        this.elements.commandOutput.textContent = text;
    }
    
    // 構造情報の更新
    updateStructureInfo(data) {
        if (!data) return;
        
        const info = document.createElement('div');
        
        // 基本情報
        const basicInfo = document.createElement('p');
        basicInfo.textContent = `アトム数: ${data.atoms ? data.atoms.length : 'N/A'}`;
        info.appendChild(basicInfo);
        
        // 残基情報
        if (data.residues && data.residues.length > 0) {
            const residueInfo = document.createElement('p');
            residueInfo.textContent = `残基数: ${data.residues.length}`;
            info.appendChild(residueInfo);
        }
        
        // チェーン情報
        if (data.chains && data.chains.length > 0) {
            const chainInfo = document.createElement('p');
            chainInfo.textContent = `チェーン数: ${data.chains.length} (${data.chains.map(c => c.id).join(', ')})`;
            info.appendChild(chainInfo);
        }
        
        this.elements.structureInfo.innerHTML = '';
        this.elements.structureInfo.appendChild(info);
    }
    
    // 選択情報の更新
    updateSelectionInfo(selection) {
        if (!selection) return;
        
        const info = document.createElement('div');
        
        // 選択名
        const nameInfo = document.createElement('p');
        nameInfo.textContent = `選択名: ${selection.name}`;
        info.appendChild(nameInfo);
        
        // 選択されたアトム数
        const atomsInfo = document.createElement('p');
        atomsInfo.textContent = `選択されたアトム数: ${selection.atoms ? selection.atoms.length : 0}`;
        info.appendChild(atomsInfo);
        
        // 選択された残基
        if (selection.residues && selection.residues.length > 0) {
            const residuesInfo = document.createElement('p');
            residuesInfo.textContent = `選択された残基: ${selection.residues.length}`;
            info.appendChild(residuesInfo);
        }
        
        this.elements.selectionInfo.innerHTML = '';
        this.elements.selectionInfo.appendChild(info);
    }
    
    // ローディング表示
    showLoading() {
        this.elements.loadingOverlay.classList.add('active');
    }
    
    // ローディング非表示
    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
    }
}

// DOMの読み込み完了時にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    // 必要なコンポーネントが読み込まれたことを確認
    if (typeof Renderer === 'undefined' || 
        typeof CommandParser === 'undefined' || 
        typeof Controls === 'undefined' || 
        typeof PdbParser === 'undefined' || 
        typeof MrcParser === 'undefined' || 
        typeof MtzParser === 'undefined' || 
        typeof MapParser === 'undefined' || 
        typeof ProteinDisplay === 'undefined' || 
        typeof MapDisplay === 'undefined') {
        
        console.error('Required components are not loaded. Check script includes.');
        return;
    }
    
    // アプリケーションのインスタンスを作成
    window.proteinViewer = new ProteinViewer();
});