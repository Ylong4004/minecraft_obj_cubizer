(() => {
	const PLUGIN_ID = 'minecraft_obj_cubizer';
	const PLUGIN_VERSION = '1.4.0';
	const FACE_DIRECTIONS = ['north', 'east', 'south', 'west', 'up', 'down'];
	const EPSILON = 0.00001;
	const JAVA_COORDINATE_MIN = -16;
	const JAVA_COORDINATE_MAX = 32;
	const CUBE_WARNING_COUNT = 5000;
	const CUBE_DANGER_COUNT = 10000;
	const TRANSLATION_PREFIX = `plugin.${PLUGIN_ID}.`;
	const PROJECT_OPTIONS_PROPERTY = `${PLUGIN_ID}_options`;
	const IMPORTED_PROPERTY = `${PLUGIN_ID}_imported`;
	const SOURCE_PATH_PROPERTY = `${PLUGIN_ID}_source_path`;
	const TEXTURE_FULL_PATH_PROPERTY = `${PLUGIN_ID}_texture_full_path`;
	const STORAGE_KEY = `${PLUGIN_ID}_options`;
	const MENU_ID = `${PLUGIN_ID}_menu`;
	const PLUGIN_ACTION_IDS = [
		'import_minecraft_obj_cubes',
		'open_minecraft_obj_cubizer_settings',
		'export_minecraft_obj_textures',
		'import_minecraft_structure_cubes',
		'open_minecraft_structure_import_settings'
	];
	const DEFAULT_OPTIONS = {
		scale: 1,
		default_depth: 1,
		texture_size: 16,
		texture_namespace: 'minecraft',
		texture_folder: 'block',
		load_textures: true,
		center_model: false,
		auto_create_project: true,
		cull_faces: false,
		apply_texture_settings: true,
		apply_cull_faces: true
	};
	const PLUGIN_DESCRIPTION = 'Convert Minecraft OBJ exports and Minecraft structure files into editable Blockbench Java cube models. / 将 Minecraft OBJ 和结构文件转换为可编辑的 Blockbench Java 方块模型。';

	let import_action;
	let settings_action;
	let export_textures_action;
	let direct_import_action;
	let direct_settings_action;
	let plugin_menu;
	let compile_listener;
	let project_options_property;
	let texture_imported_property;
	let texture_source_path_property;
	let texture_full_path_property;
	let cube_imported_property;
	let cubizer_options = Object.assign({}, DEFAULT_OPTIONS);

	function addTranslations() {
		if (typeof Language === 'undefined' || !Language.addTranslations) return;

		Language.addTranslations('en', {
			[TRANSLATION_PREFIX + 'title']: 'Minecraft OBJ Cubizer',
			[TRANSLATION_PREFIX + 'action.import']: 'Import Minecraft OBJ as Cubes',
			[TRANSLATION_PREFIX + 'action.settings']: 'Minecraft OBJ Cubizer Settings',
			[TRANSLATION_PREFIX + 'dialog.title']: 'Import Minecraft OBJ as Cubes',
			[TRANSLATION_PREFIX + 'dialog.settings_title']: 'Minecraft OBJ Cubizer Settings',
			[TRANSLATION_PREFIX + 'form.create_project']: 'Auto-create Java Block project',
			[TRANSLATION_PREFIX + 'form.scale']: 'OBJ block scale',
			[TRANSLATION_PREFIX + 'form.default_depth']: 'Default cube depth',
			[TRANSLATION_PREFIX + 'form.texture_size']: 'Texture size',
			[TRANSLATION_PREFIX + 'form.load_textures']: 'Load PNG textures for preview',
			[TRANSLATION_PREFIX + 'form.texture_namespace']: 'Texture namespace',
			[TRANSLATION_PREFIX + 'form.texture_folder']: 'Texture folder',
			[TRANSLATION_PREFIX + 'form.center_model']: 'Center model on origin',
			[TRANSLATION_PREFIX + 'form.cull_faces']: 'Set Java cullfaces',
			[TRANSLATION_PREFIX + 'form.apply_texture_settings']: 'Apply namespace and folder to imported textures now',
			[TRANSLATION_PREFIX + 'form.apply_cull_faces']: 'Apply cullface setting to imported cubes now',
			[TRANSLATION_PREFIX + 'action.export_textures']: 'Export OBJ Textures to Resource Pack',
			[TRANSLATION_PREFIX + 'button.use_recommended_scale']: 'Use Recommended Scale',
			[TRANSLATION_PREFIX + 'button.continue_anyway']: 'Continue Anyway',
			[TRANSLATION_PREFIX + 'undo.import']: 'Import Minecraft OBJ as Cubes',
			[TRANSLATION_PREFIX + 'undo.settings']: 'Update Minecraft OBJ Cubizer Settings',
			[TRANSLATION_PREFIX + 'message.pick_resource_pack_root']: 'Select the resource pack root folder',
			[TRANSLATION_PREFIX + 'message.no_textures']: 'No imported OBJ textures were found in this project.',
			[TRANSLATION_PREFIX + 'message.no_filesystem']: 'The plugin cannot access the desktop file system in this environment.',
			[TRANSLATION_PREFIX + 'message.export_textures_done']: 'Exported %0 textures to:\n\n%1\n\nFailed: %2',
			[TRANSLATION_PREFIX + 'message.desktop_only']: 'This plugin needs the desktop app to read MTL and PNG files.',
			[TRANSLATION_PREFIX + 'message.fs_permission']: 'Read the OBJ material file and texture PNGs next to the selected model.',
			[TRANSLATION_PREFIX + 'message.no_project_to_import']: 'No project is open. Enable automatic Java Block project creation in the cubizer settings, or create/open a project before importing.',
			[TRANSLATION_PREFIX + 'message.empty_obj']: 'The selected OBJ file does not contain readable vertices and faces.',
			[TRANSLATION_PREFIX + 'message.no_cubes']: 'The OBJ was readable, but no axis-aligned cube faces could be converted.',
			[TRANSLATION_PREFIX + 'message.cube_count_warning']: 'This OBJ will create %0 Blockbench cubes.\n\nRecommended range: up to %1 cubes.\nHeavy range: %2+ cubes may make Blockbench slow or unresponsive.\n\nFor very large Minecraft buildings, consider splitting the OBJ into smaller parts before importing.',
			[TRANSLATION_PREFIX + 'message.bounds_warning']: 'The current scale %0 produces model coordinates outside the common Java Block/Item range -16 to 32.\n\nCurrent bounds:\n%1\n\nRecommended scale: %2\nRecommended bounds:\n%3\n\nFor Minecraft building OBJ files, scale 1 usually keeps one Minecraft block as one Blockbench unit. Scale 16 is normally too large for Java model JSON.',
			[TRANSLATION_PREFIX + 'message.summary']: 'Imported %0 cubes from %1 OBJ faces.\n\nTextures: %2\nSkipped non-cube faces: %3\n\nUse Blockbench Java Block/Item Model export to save the JSON. Use the Minecraft Cubizer menu to copy PNG textures into a resource pack.',
			[TRANSLATION_PREFIX + 'message.settings_saved']: 'Settings saved. Updated textures: %0. Updated cubes: %1.',
			[TRANSLATION_PREFIX + 'message.import_failed']: 'Import failed:\n\n%0'
		});
		Language.addTranslations('zh', {
			[TRANSLATION_PREFIX + 'title']: 'Minecraft OBJ Cubizer',
			[TRANSLATION_PREFIX + 'action.import']: '将 Minecraft OBJ 导入为方块',
			[TRANSLATION_PREFIX + 'action.settings']: 'Minecraft OBJ 方块转换器设置',
			[TRANSLATION_PREFIX + 'dialog.title']: '将 Minecraft OBJ 导入为方块',
			[TRANSLATION_PREFIX + 'dialog.settings_title']: 'Minecraft OBJ 方块转换器设置',
			[TRANSLATION_PREFIX + 'form.create_project']: '自动创建 Java Block 项目',
			[TRANSLATION_PREFIX + 'form.scale']: 'OBJ 方块缩放',
			[TRANSLATION_PREFIX + 'form.default_depth']: '默认方块厚度',
			[TRANSLATION_PREFIX + 'form.texture_size']: '贴图尺寸',
			[TRANSLATION_PREFIX + 'form.load_textures']: '加载 PNG 贴图用于预览',
			[TRANSLATION_PREFIX + 'form.texture_namespace']: '贴图命名空间',
			[TRANSLATION_PREFIX + 'form.texture_folder']: '贴图文件夹',
			[TRANSLATION_PREFIX + 'form.center_model']: '将模型居中到原点',
			[TRANSLATION_PREFIX + 'form.cull_faces']: '设置 Java cullface',
			[TRANSLATION_PREFIX + 'form.apply_texture_settings']: '立即应用命名空间和文件夹到已导入贴图',
			[TRANSLATION_PREFIX + 'form.apply_cull_faces']: '立即应用 cullface 设置到已导入方块',
			[TRANSLATION_PREFIX + 'action.export_textures']: '导出 OBJ 贴图到资源包',
			[TRANSLATION_PREFIX + 'button.use_recommended_scale']: '使用推荐缩放',
			[TRANSLATION_PREFIX + 'button.continue_anyway']: '仍然继续',
			[TRANSLATION_PREFIX + 'undo.import']: '将 Minecraft OBJ 导入为方块',
			[TRANSLATION_PREFIX + 'undo.settings']: '更新 Minecraft OBJ 方块转换器设置',
			[TRANSLATION_PREFIX + 'message.pick_resource_pack_root']: '选择资源包根目录',
			[TRANSLATION_PREFIX + 'message.no_textures']: '当前项目中没有找到由 OBJ 导入的贴图。',
			[TRANSLATION_PREFIX + 'message.no_filesystem']: '当前环境无法访问桌面文件系统。',
			[TRANSLATION_PREFIX + 'message.export_textures_done']: '已导出 %0 张贴图到：\n\n%1\n\n失败：%2',
			[TRANSLATION_PREFIX + 'message.desktop_only']: '该插件需要 Blockbench 桌面版来读取 MTL 和 PNG 文件。',
			[TRANSLATION_PREFIX + 'message.fs_permission']: '读取所选 OBJ 旁边的材质文件和 PNG 贴图。',
			[TRANSLATION_PREFIX + 'message.no_project_to_import']: '当前没有打开项目。请在转换器设置中开启自动创建 Java Block 项目，或先创建/打开一个项目再导入。',
			[TRANSLATION_PREFIX + 'message.empty_obj']: '所选 OBJ 文件中没有可读取的顶点和面。',
			[TRANSLATION_PREFIX + 'message.no_cubes']: 'OBJ 可以读取，但没有找到可转换的轴对齐方块面。',
			[TRANSLATION_PREFIX + 'message.cube_count_warning']: '这个 OBJ 预计会生成 %0 个 Blockbench 方块。\n\n推荐范围：最多 %1 个方块。\n较重范围：%2 个以上可能会让 Blockbench 明显变慢，甚至无响应。\n\n如果是很大的 Minecraft 建筑，建议先把 OBJ 拆成几个部分再分别导入。',
			[TRANSLATION_PREFIX + 'message.bounds_warning']: '当前缩放 %0 会生成超出 Java Block/Item 常见范围 -16 到 32 的模型坐标。\n\n当前范围：\n%1\n\n推荐缩放：%2\n推荐范围：\n%3\n\n对于 Minecraft 建筑 OBJ，缩放 1 通常表示一个 Minecraft 方块等于一个 Blockbench 单位；缩放 16 对 Java 模型 JSON 通常太大。',
			[TRANSLATION_PREFIX + 'message.summary']: '已从 %1 个 OBJ 面导入 %0 个方块。\n\n贴图：%2\n跳过的非方块面：%3\n\n使用 Blockbench 的 Java Block/Item Model 导出 JSON；使用插件菜单里的“导出 OBJ 贴图到资源包”复制 PNG 贴图。',
			[TRANSLATION_PREFIX + 'message.settings_saved']: '设置已保存。已更新贴图：%0。已更新方块：%1。',
			[TRANSLATION_PREFIX + 'message.import_failed']: '导入失败：\n\n%0'
		});
		Language.addTranslations('zh_tw', {
			[TRANSLATION_PREFIX + 'title']: 'Minecraft OBJ 方塊轉換器',
			[TRANSLATION_PREFIX + 'action.import']: '將 Minecraft OBJ 匯入為方塊',
			[TRANSLATION_PREFIX + 'action.settings']: 'Minecraft OBJ 方塊轉換器設定',
			[TRANSLATION_PREFIX + 'dialog.title']: '將 Minecraft OBJ 匯入為方塊',
			[TRANSLATION_PREFIX + 'dialog.settings_title']: 'Minecraft OBJ 方塊轉換器設定',
			[TRANSLATION_PREFIX + 'form.create_project']: '自動建立 Java Block 專案',
			[TRANSLATION_PREFIX + 'form.scale']: 'OBJ 方塊縮放',
			[TRANSLATION_PREFIX + 'form.default_depth']: '預設方塊厚度',
			[TRANSLATION_PREFIX + 'form.texture_size']: '貼圖尺寸',
			[TRANSLATION_PREFIX + 'form.load_textures']: '載入 PNG 貼圖用於預覽',
			[TRANSLATION_PREFIX + 'form.texture_namespace']: '貼圖命名空間',
			[TRANSLATION_PREFIX + 'form.texture_folder']: '貼圖資料夾',
			[TRANSLATION_PREFIX + 'form.center_model']: '將模型置中到原點',
			[TRANSLATION_PREFIX + 'form.cull_faces']: '設定 Java cullface',
			[TRANSLATION_PREFIX + 'form.apply_texture_settings']: '立即套用命名空間和資料夾到已匯入貼圖',
			[TRANSLATION_PREFIX + 'form.apply_cull_faces']: '立即套用 cullface 設定到已匯入方塊',
			[TRANSLATION_PREFIX + 'action.export_textures']: '匯出 OBJ 貼圖到資源包',
			[TRANSLATION_PREFIX + 'button.use_recommended_scale']: '使用推薦縮放',
			[TRANSLATION_PREFIX + 'button.continue_anyway']: '仍然繼續',
			[TRANSLATION_PREFIX + 'undo.import']: '將 Minecraft OBJ 匯入為方塊',
			[TRANSLATION_PREFIX + 'undo.settings']: '更新 Minecraft OBJ 方塊轉換器設定',
			[TRANSLATION_PREFIX + 'message.pick_resource_pack_root']: '選擇資源包根目錄',
			[TRANSLATION_PREFIX + 'message.no_textures']: '目前專案中沒有找到由 OBJ 匯入的貼圖。',
			[TRANSLATION_PREFIX + 'message.no_filesystem']: '目前環境無法存取桌面檔案系統。',
			[TRANSLATION_PREFIX + 'message.export_textures_done']: '已匯出 %0 張貼圖到：\n\n%1\n\n失敗：%2',
			[TRANSLATION_PREFIX + 'message.desktop_only']: '此外掛需要 Blockbench 桌面版來讀取 MTL 和 PNG 檔案。',
			[TRANSLATION_PREFIX + 'message.fs_permission']: '讀取所選 OBJ 旁邊的材質檔和 PNG 貼圖。',
			[TRANSLATION_PREFIX + 'message.no_project_to_import']: '目前沒有開啟專案。請在轉換器設定中啟用自動建立 Java Block 專案，或先建立/開啟一個專案再匯入。',
			[TRANSLATION_PREFIX + 'message.empty_obj']: '所選 OBJ 檔案中沒有可讀取的頂點和面。',
			[TRANSLATION_PREFIX + 'message.no_cubes']: 'OBJ 可以讀取，但沒有找到可轉換的軸對齊方塊面。',
			[TRANSLATION_PREFIX + 'message.cube_count_warning']: '這個 OBJ 預計會生成 %0 個 Blockbench 方塊。\n\n推薦範圍：最多 %1 個方塊。\n較重範圍：%2 個以上可能會讓 Blockbench 明顯變慢，甚至無回應。\n\n如果是很大的 Minecraft 建築，建議先把 OBJ 拆成幾個部分再分別匯入。',
			[TRANSLATION_PREFIX + 'message.bounds_warning']: '目前縮放 %0 會生成超出 Java Block/Item 常見範圍 -16 到 32 的模型座標。\n\n目前範圍：\n%1\n\n推薦縮放：%2\n推薦範圍：\n%3\n\n對於 Minecraft 建築 OBJ，縮放 1 通常表示一個 Minecraft 方塊等於一個 Blockbench 單位；縮放 16 對 Java 模型 JSON 通常太大。',
			[TRANSLATION_PREFIX + 'message.summary']: '已從 %1 個 OBJ 面匯入 %0 個方塊。\n\n貼圖：%2\n略過的非方塊面：%3\n\n使用 Blockbench 的 Java Block/Item Model 匯出 JSON；使用外掛選單裡的「匯出 OBJ 貼圖到資源包」複製 PNG 貼圖。',
			[TRANSLATION_PREFIX + 'message.settings_saved']: '設定已儲存。已更新貼圖：%0。已更新方塊：%1。',
			[TRANSLATION_PREFIX + 'message.import_failed']: '匯入失敗：\n\n%0'
		});
	}

	function translate(key, variables) {
		return tl(TRANSLATION_PREFIX + key, variables);
	}

	function registerProperties() {
		if (typeof Property === 'undefined') return;
		if (typeof ModelProject !== 'undefined' && !ModelProject.properties?.[PROJECT_OPTIONS_PROPERTY]) {
			project_options_property = new Property(ModelProject, 'object', PROJECT_OPTIONS_PROPERTY, {exposed: false});
		}
		if (typeof Texture !== 'undefined') {
			if (!Texture.properties?.[IMPORTED_PROPERTY]) {
				texture_imported_property = new Property(Texture, 'boolean', IMPORTED_PROPERTY, {exposed: false});
			}
			if (!Texture.properties?.[SOURCE_PATH_PROPERTY]) {
				texture_source_path_property = new Property(Texture, 'string', SOURCE_PATH_PROPERTY, {exposed: false});
			}
			if (!Texture.properties?.[TEXTURE_FULL_PATH_PROPERTY]) {
				texture_full_path_property = new Property(Texture, 'string', TEXTURE_FULL_PATH_PROPERTY, {exposed: false});
			}
		}
		if (typeof Cube !== 'undefined' && !Cube.properties?.[IMPORTED_PROPERTY]) {
			cube_imported_property = new Property(Cube, 'boolean', IMPORTED_PROPERTY, {exposed: false});
		}
	}

	function unregisterProperties() {
		if (project_options_property) project_options_property.delete();
		if (texture_imported_property) texture_imported_property.delete();
		if (texture_source_path_property) texture_source_path_property.delete();
		if (texture_full_path_property) texture_full_path_property.delete();
		if (cube_imported_property) cube_imported_property.delete();
	}

	function cleanName(name) {
		return String(name || 'texture')
			.replace(/\.[a-z0-9]{2,8}$/i, '')
			.replace(/[^a-zA-Z0-9_./-]+/g, '_')
			.replace(/^_+|_+$/g, '') || 'texture';
	}

	function pathBasename(path) {
		return String(path || '')
			.replace(/\\/g, '/')
			.split('/')
			.pop() || 'model.obj';
	}

	function pathStem(path) {
		return pathBasename(path).replace(/\.[^.]+$/, '');
	}

	function getNativeModule(name, options) {
		if (typeof requireNativeModule === 'function') {
			try {
				return requireNativeModule(name, options);
			} catch (error) {
				console.warn(error);
			}
		}
		if (typeof require === 'function') {
			try {
				return require(name);
			} catch (error) {
				console.warn(error);
			}
		}
		return null;
	}

	function getDirname(file_path) {
		let path = String(file_path || '');
		let index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
		return index >= 0 ? path.substring(0, index) : '';
	}

	function resolveRelativePath(base_dir, relative_path, path_module) {
		let clean_path = String(relative_path || '').replace(/^"|"$/g, '');
		if (!clean_path) return '';
		if (clean_path.match(/^[a-zA-Z]:[\\/]/) || clean_path.startsWith('/') || clean_path.startsWith('\\')) {
			return clean_path;
		}
		if (path_module) {
			return path_module.resolve(base_dir, clean_path.replace(/[\\/]/g, path_module.sep));
		}
		let separator = base_dir.includes('\\') ? '\\' : '/';
		return base_dir.replace(/[\\/]+$/, '') + separator + clean_path.replace(/[\\/]/g, separator);
	}

	function joinPath(path_module, ...parts) {
		if (path_module) return path_module.join(...parts);
		let separator = parts.find(part => String(part).includes('\\')) ? '\\' : '/';
		return parts
			.filter(part => part !== undefined && part !== null && part !== '')
			.map((part, index) => {
				part = String(part);
				if (index === 0) return part.replace(/[\\/]+$/, '');
				return part.replace(/^[\\/]+|[\\/]+$/g, '');
			})
			.join(separator);
	}

	function fileExists(fs, path) {
		if (!fs || !fs.existsSync) return true;
		try {
			return fs.existsSync(path);
		} catch (error) {
			console.warn(error);
			return false;
		}
	}

	function readTextFile(path, fs) {
		if (!path) return Promise.resolve('');
		if (fs && fs.readFileSync && fileExists(fs, path)) {
			try {
				return Promise.resolve(fs.readFileSync(path, 'utf8'));
			} catch (error) {
				console.warn(error);
			}
		}
		return new Promise(resolve => {
			let done = false;
			function finish(content) {
				if (done) return;
				done = true;
				resolve(content);
			}
			setTimeout(() => finish(''), 1500);
			try {
				Blockbench.read([path], {errorbox: false}, files => {
					finish(files && files[0] ? String(files[0].content || '') : '');
				});
			} catch (error) {
				console.warn(error);
				finish('');
			}
		});
	}

	function writeTextureFile(texture, destination_path, path_module) {
		let source_path = texture[SOURCE_PATH_PROPERTY] || texture.minecraft_obj_cubizer_source_path || texture.path;
		if (source_path) source_path = String(source_path).replace(/\?\d+$/, '');

		if (source_path) {
			if (path_module && path_module.resolve(source_path) === path_module.resolve(destination_path)) {
				return true;
			}
			Blockbench.writeFile(destination_path, {content: source_path, savetype: 'image'});
			return true;
		}
		if (texture.source && texture.source.startsWith('data:image')) {
			Blockbench.writeFile(destination_path, {content: texture.source, savetype: 'image'});
			return true;
		}
		return false;
	}

	function ensureDirectory(fs, directory_path) {
		if (!directory_path || fileExists(fs, directory_path)) return;
		fs.mkdirSync(directory_path, {recursive: true});
	}

	function uniqueTextureId(base_id) {
		let id = cleanName(base_id).replace(/[./-]+/g, '_').toLowerCase();
		if (!id.match(/^[a-z_]/)) id = 'tex_' + id;
		let candidate = id;
		let index = 2;
		while (Texture.all.some(texture => texture.id === candidate)) {
			candidate = `${id}_${index++}`;
		}
		return candidate;
	}

	function toNumber(value, fallback) {
		let number = parseFloat(value);
		return Number.isFinite(number) ? number : fallback;
	}

	function splitObjLine(line) {
		let trimmed = line.trim();
		let hash_index = trimmed.indexOf('#');
		if (hash_index >= 0) trimmed = trimmed.substring(0, hash_index).trim();
		return trimmed ? trimmed.split(/\s+/) : [];
	}

	function resolveObjIndex(value, length) {
		if (!value) return undefined;
		let index = parseInt(value, 10);
		if (!Number.isFinite(index)) return undefined;
		return index < 0 ? length + index : index - 1;
	}

	function parseOBJ(content) {
		let vertices = [];
		let uvs = [];
		let normals = [];
		let faces = [];
		let mtllibs = [];
		let current_material = 'default';

		String(content || '').split(/\r?\n/).forEach(line => {
			let parts = splitObjLine(line);
			if (!parts.length) return;

			if (parts[0] === 'v') {
				vertices.push([
					toNumber(parts[1], 0),
					toNumber(parts[2], 0),
					toNumber(parts[3], 0)
				]);
			} else if (parts[0] === 'vt') {
				uvs.push([
					toNumber(parts[1], 0),
					toNumber(parts[2], 0)
				]);
			} else if (parts[0] === 'vn') {
				normals.push([
					toNumber(parts[1], 0),
					toNumber(parts[2], 0),
					toNumber(parts[3], 0)
				]);
			} else if (parts[0] === 'usemtl') {
				current_material = parts.slice(1).join(' ') || 'default';
			} else if (parts[0] === 'mtllib') {
				mtllibs.push(parts.slice(1).join(' '));
			} else if (parts[0] === 'f') {
				let refs = parts.slice(1).map(token => {
					let ref = token.split('/');
					return {
						v: resolveObjIndex(ref[0], vertices.length),
						vt: resolveObjIndex(ref[1], uvs.length),
						vn: resolveObjIndex(ref[2], normals.length)
					};
				});
				faces.push({
					material: current_material,
					refs
				});
			}
		});

		return {vertices, uvs, normals, faces, mtllibs};
	}

	function parseMTL(content) {
		let materials = {};
		let current;

		String(content || '').split(/\r?\n/).forEach(line => {
			let parts = splitObjLine(line);
			if (!parts.length) return;

			if (parts[0] === 'newmtl') {
				current = parts.slice(1).join(' ') || 'default';
				materials[current] = materials[current] || {name: current};
			} else if (current && (parts[0] === 'map_Kd' || parts[0] === 'map_Ka')) {
				let texture_path = parts[parts.length - 1];
				if (texture_path) materials[current].map = texture_path.replace(/^"|"$/g, '');
			}
		});

		return materials;
	}

	async function readMaterials(obj, obj_path, fs, path_module) {
		let materials = {};
		if (!obj_path) return materials;

		let base_dir = path_module ? path_module.dirname(obj_path) : getDirname(obj_path);
		for (let mtl_path of obj.mtllibs) {
			let absolute_mtl_path = resolveRelativePath(base_dir, mtl_path, path_module);
			let content = await readTextFile(absolute_mtl_path, fs);
			if (content) Object.assign(materials, parseMTL(content));
		}
		return materials;
	}

	function vectorSubtract(a, b) {
		return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
	}

	function vectorCross(a, b) {
		return [
			a[1] * b[2] - a[2] * b[1],
			a[2] * b[0] - a[0] * b[2],
			a[0] * b[1] - a[1] * b[0]
		];
	}

	function normalize(vector) {
		let length = Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
		if (!length) return [0, 0, 0];
		return [vector[0] / length, vector[1] / length, vector[2] / length];
	}

	function getFaceNormal(face, vertices, normals) {
		let normal = [0, 0, 0];
		let normal_count = 0;

		face.refs.forEach(ref => {
			if (normals[ref.vn]) {
				normal[0] += normals[ref.vn][0];
				normal[1] += normals[ref.vn][1];
				normal[2] += normals[ref.vn][2];
				normal_count++;
			}
		});

		if (normal_count) return normalize(normal);

		let points = face.refs.map(ref => vertices[ref.v]).filter(Boolean);
		if (points.length < 3) return [0, 0, 0];
		return normalize(vectorCross(
			vectorSubtract(points[1], points[0]),
			vectorSubtract(points[2], points[0])
		));
	}

	function directionFromNormal(normal) {
		let axis = 0;
		if (Math.abs(normal[1]) > Math.abs(normal[axis])) axis = 1;
		if (Math.abs(normal[2]) > Math.abs(normal[axis])) axis = 2;
		let sign = normal[axis] >= 0 ? 1 : -1;
		if (Math.abs(normal[axis]) < 0.9) return null;

		if (axis === 0) return {axis, sign, direction: sign > 0 ? 'east' : 'west'};
		if (axis === 1) return {axis, sign, direction: sign > 0 ? 'up' : 'down'};
		return {axis, sign, direction: sign > 0 ? 'south' : 'north'};
	}

	function getBounds(points) {
		let min = [Infinity, Infinity, Infinity];
		let max = [-Infinity, -Infinity, -Infinity];
		points.forEach(point => {
			for (let axis = 0; axis < 3; axis++) {
				min[axis] = Math.min(min[axis], point[axis]);
				max[axis] = Math.max(max[axis], point[axis]);
			}
		});
		return {min, max};
	}

	function getFaceUV(face, obj, texture_size) {
		let uv_points = face.refs
			.map(ref => obj.uvs[ref.vt])
			.filter(Boolean)
			.map(uv => [uv[0] * texture_size, (1 - uv[1]) * texture_size]);

		if (!uv_points.length) return [0, 0, texture_size, texture_size];

		let min_u = Math.min(...uv_points.map(uv => uv[0]));
		let max_u = Math.max(...uv_points.map(uv => uv[0]));
		let min_v = Math.min(...uv_points.map(uv => uv[1]));
		let max_v = Math.max(...uv_points.map(uv => uv[1]));
		return [
			Math.clamp(min_u, 0, texture_size),
			Math.clamp(min_v, 0, texture_size),
			Math.clamp(max_u, 0, texture_size),
			Math.clamp(max_v, 0, texture_size)
		];
	}

	function defaultDepthForMaterial(material, default_depth) {
		let name = String(material || '').toLowerCase();
		if (name.match(/ladder|vine|painting|item_frame/)) return Math.min(default_depth, 1 / 16);
		if (name.match(/glass_pane|iron_bars|chain/)) return Math.min(default_depth, 2 / 16);
		return default_depth;
	}

	function createCubizerFace(face, obj, textures, options) {
		if (face.refs.length !== 4) return null;

		let points = face.refs.map(ref => obj.vertices[ref.v]).filter(Boolean);
		if (points.length !== 4) return null;

		let normal = getFaceNormal(face, obj.vertices, obj.normals);
		let direction = directionFromNormal(normal);
		if (!direction) return null;

		let bounds = getBounds(points);
		let plane = (bounds.min[direction.axis] + bounds.max[direction.axis]) / 2;
		if (Math.abs(bounds.max[direction.axis] - bounds.min[direction.axis]) > EPSILON) return null;

		let box = {
			min: bounds.min.slice(),
			max: bounds.max.slice()
		};
		let depth = defaultDepthForMaterial(face.material, options.default_depth);
		if (direction.sign > 0) {
			box.min[direction.axis] = plane - depth;
			box.max[direction.axis] = plane;
		} else {
			box.min[direction.axis] = plane;
			box.max[direction.axis] = plane + depth;
		}

		return {
			material: face.material,
			texture: textures[face.material] || textures.default || null,
			uv: getFaceUV(face, obj, options.texture_size),
			direction: direction.direction,
			axis: direction.axis,
			sign: direction.sign,
			plane,
			face_min: bounds.min,
			face_max: bounds.max,
			box
		};
	}

	function boxesIntersect(a, b) {
		for (let axis = 0; axis < 3; axis++) {
			if (Math.min(a.max[axis], b.max[axis]) - Math.max(a.min[axis], b.min[axis]) <= EPSILON) {
				return false;
			}
		}
		return true;
	}

	function intersectBoxes(a, b) {
		return {
			min: [
				Math.max(a.min[0], b.min[0]),
				Math.max(a.min[1], b.min[1]),
				Math.max(a.min[2], b.min[2])
			],
			max: [
				Math.min(a.max[0], b.max[0]),
				Math.min(a.max[1], b.max[1]),
				Math.min(a.max[2], b.max[2])
			]
		};
	}

	function faceFitsBox(face, box) {
		let boundary = face.sign > 0 ? box.max[face.axis] : box.min[face.axis];
		if (Math.abs(face.plane - boundary) > EPSILON) return false;

		for (let axis = 0; axis < 3; axis++) {
			if (axis === face.axis) continue;
			if (face.face_min[axis] < box.min[axis] - EPSILON) return false;
			if (face.face_max[axis] > box.max[axis] + EPSILON) return false;
		}
		return true;
	}

	function sameFaceRect(a, b) {
		if (a.direction !== b.direction) return false;
		if (Math.abs(a.plane - b.plane) > EPSILON) return false;
		for (let axis = 0; axis < 3; axis++) {
			if (Math.abs(a.face_min[axis] - b.face_min[axis]) > EPSILON) return false;
			if (Math.abs(a.face_max[axis] - b.face_max[axis]) > EPSILON) return false;
		}
		return true;
	}

	function hasDirectionConflict(faces) {
		let by_direction = {};
		for (let face of faces) {
			if (!by_direction[face.direction]) {
				by_direction[face.direction] = face;
			} else if (!sameFaceRect(by_direction[face.direction], face)) {
				return true;
			}
		}
		return false;
	}

	function groupFitsBox(faces, box) {
		if (hasDirectionConflict(faces)) return false;
		return faces.every(face => faceFitsBox(face, box));
	}

	function mergeFacesIntoCuboids(faces) {
		let groups = faces.map(face => ({
			box: {
				min: face.box.min.slice(),
				max: face.box.max.slice()
			},
			faces: [face]
		}));

		let changed = true;
		while (changed) {
			changed = false;

			for (let i = 0; i < groups.length && !changed; i++) {
				for (let j = i + 1; j < groups.length; j++) {
					if (!boxesIntersect(groups[i].box, groups[j].box)) continue;

					let box = intersectBoxes(groups[i].box, groups[j].box);
					let faces_to_merge = groups[i].faces.concat(groups[j].faces);
					if (!groupFitsBox(faces_to_merge, box)) continue;

					groups[i] = {box, faces: faces_to_merge};
					groups.splice(j, 1);
					changed = true;
					break;
				}
			}
		}

		return groups;
	}

	function getTexturePath(material, materials, base_dir, path_module) {
		let map = materials[material]?.map;
		if (!map || !base_dir) return '';
		return resolveRelativePath(base_dir, map, path_module);
	}

	function createTextures(obj, materials, options, obj_path, fs, path_module, new_textures) {
		let textures = {};
		let base_dir = obj_path ? (path_module ? path_module.dirname(obj_path) : getDirname(obj_path)) : '';
		let material_names = Array.from(new Set(obj.faces.map(face => face.material || 'default')));

		material_names.forEach(material_name => {
			let texture_id = uniqueTextureId(material_name);
			let texture_path = getTexturePath(material_name, materials, base_dir, path_module);
			let texture_name = texture_path ? pathBasename(texture_path) : cleanName(material_name) + '.png';
			let texture = new Texture({id: texture_id, name: texture_name});
			texture[SOURCE_PATH_PROPERTY] = texture_path;
			texture[IMPORTED_PROPERTY] = true;

			if (options.load_textures && texture_path && fileExists(fs, texture_path)) {
				texture.fromPath(texture_path);
			} else {
				texture.loadEmpty(3);
			}

			texture.id = texture_id;
			texture.name = texture_name;
			texture.folder = cleanName(options.texture_folder).replace(/^minecraft[:/]/, '');
			texture.namespace = cleanName(options.texture_namespace).replace(/[/:].*$/, '') || 'minecraft';
			texture.flags.add(PLUGIN_ID);
			texture.add(false, true);

			textures[material_name] = texture;
			new_textures.push(texture);
		});

		if (new_textures[0]) new_textures[0].enableParticle();
		return textures;
	}

	function getModelBounds(groups) {
		let min = [Infinity, Infinity, Infinity];
		let max = [-Infinity, -Infinity, -Infinity];
		groups.forEach(group => {
			for (let axis = 0; axis < 3; axis++) {
				min[axis] = Math.min(min[axis], group.box.min[axis]);
				max[axis] = Math.max(max[axis], group.box.max[axis]);
			}
		});
		return {min, max};
	}

	function getImportOffset(groups, options) {
		let bounds = getModelBounds(groups);
		if (options.center_model) {
			return [
				(bounds.min[0] + bounds.max[0]) / 2,
				(bounds.min[1] + bounds.max[1]) / 2,
				(bounds.min[2] + bounds.max[2]) / 2
			];
		}
		return [0, 0, 0];
	}

	function getScaledCoordinateBounds(groups, options, scale) {
		let bounds = getModelBounds(groups);
		let offset = getImportOffset(groups, options);
		let min = [0, 1, 2].map(axis => Math.min(
			(bounds.min[axis] - offset[axis]) * scale,
			(bounds.max[axis] - offset[axis]) * scale
		));
		let max = [0, 1, 2].map(axis => Math.max(
			(bounds.min[axis] - offset[axis]) * scale,
			(bounds.max[axis] - offset[axis]) * scale
		));
		return {min, max};
	}

	function exceedsJavaCoordinateRange(bounds) {
		return [0, 1, 2].some(axis => {
			return bounds.min[axis] < JAVA_COORDINATE_MIN - EPSILON ||
				bounds.max[axis] > JAVA_COORDINATE_MAX + EPSILON;
		});
	}

	function formatCoordinateBounds(bounds) {
		let min = bounds.min.map(roundCoordinate).join(', ');
		let max = bounds.max.map(roundCoordinate).join(', ');
		return `[${min}] -> [${max}]`;
	}

	function getRecommendedScale(groups, options) {
		let one_scale_bounds = getScaledCoordinateBounds(groups, options, 1);
		if (!exceedsJavaCoordinateRange(one_scale_bounds)) return 1;

		let raw_bounds = getScaledCoordinateBounds(groups, options, 1);
		let scale = Infinity;
		raw_bounds.min.concat(raw_bounds.max).forEach(value => {
			if (value > EPSILON) {
				scale = Math.min(scale, JAVA_COORDINATE_MAX / value);
			} else if (value < -EPSILON) {
				scale = Math.min(scale, JAVA_COORDINATE_MIN / value);
			}
		});
		if (!Number.isFinite(scale)) return options.scale;
		return Math.max(Math.floor(scale * 10000) / 10000, 0.001);
	}

	function confirmCubeCount(cuboids) {
		let count = cuboids.length;
		if (count <= CUBE_WARNING_COUNT) return Promise.resolve(true);

		return new Promise(resolve => {
			Blockbench.showMessageBox({
				title: translate('title'),
				icon: count >= CUBE_DANGER_COUNT ? 'error' : 'warning',
				width: 560,
				message: translate('message.cube_count_warning', [
					count,
					CUBE_WARNING_COUNT,
					CUBE_DANGER_COUNT
				]),
				buttons: [
					translate('button.continue_anyway'),
					'dialog.cancel'
				],
				confirm: 0,
				cancel: 1
			}, result => {
				resolve(result === 0);
			});
		});
	}

	function confirmJavaCoordinateRange(groups, options) {
		let bounds = getScaledCoordinateBounds(groups, options, options.scale);
		if (!exceedsJavaCoordinateRange(bounds)) return Promise.resolve(true);

		let recommended_scale = getRecommendedScale(groups, options);
		let recommended_bounds = getScaledCoordinateBounds(groups, options, recommended_scale);

		return new Promise(resolve => {
			Blockbench.showMessageBox({
				title: translate('title'),
				icon: 'warning',
				width: 560,
				message: translate('message.bounds_warning', [
					roundCoordinate(options.scale),
					formatCoordinateBounds(bounds),
					roundCoordinate(recommended_scale),
					formatCoordinateBounds(recommended_bounds)
				]),
				buttons: [
					translate('button.use_recommended_scale'),
					translate('button.continue_anyway'),
					'dialog.cancel'
				],
				confirm: 0,
				cancel: 2
			}, result => {
				if (result === 0) {
					options.scale = recommended_scale;
					resolve(true);
				} else if (result === 1) {
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});
	}

	function roundCoordinate(value) {
		let rounded = Math.round(value * 100000) / 100000;
		return Object.is(rounded, -0) ? 0 : rounded;
	}

	function scalePoint(point, scale, offset) {
		return [
			roundCoordinate((point[0] - offset[0]) * scale),
			roundCoordinate((point[1] - offset[1]) * scale),
			roundCoordinate((point[2] - offset[2]) * scale)
		];
	}

	function cubeFacesFromGroup(group, options) {
		let faces = {};
		FACE_DIRECTIONS.forEach(direction => {
			faces[direction] = {texture: null};
		});

		group.faces.forEach(face => {
			if (faces[face.direction].texture !== null) return;

			faces[face.direction] = {
				uv: face.uv.slice(),
				texture: face.texture ? face.texture.uuid : false
			};
			if (options.cull_faces) faces[face.direction].cullface = face.direction;
		});

		return faces;
	}

	function createCubes(groups, options, root_group, new_cubes) {
		let offset = getImportOffset(groups, options);

		groups.forEach((group, index) => {
			let from = scalePoint(group.box.min, options.scale, offset);
			let to = scalePoint(group.box.max, options.scale, offset);

			let cube = new Cube({
				name: `obj_cube_${index + 1}`,
				autouv: 0,
				from,
				to,
				origin: [0, 0, 0],
				faces: cubeFacesFromGroup(group, options)
			}).addTo(root_group).init();

			cube[IMPORTED_PROPERTY] = true;
			new_cubes.push(cube);
		});
	}

	function sanitizeOptions(options) {
		options = options || {};
		return {
			scale: Math.max(toNumber(options.scale, DEFAULT_OPTIONS.scale), 0.001),
			default_depth: Math.max(toNumber(options.default_depth, DEFAULT_OPTIONS.default_depth), 0.001),
			texture_size: Math.max(parseInt(options.texture_size, 10) || DEFAULT_OPTIONS.texture_size, 1),
			texture_namespace: options.texture_namespace || DEFAULT_OPTIONS.texture_namespace,
			texture_folder: options.texture_folder || DEFAULT_OPTIONS.texture_folder,
			load_textures: options.load_textures !== undefined ? !!options.load_textures : DEFAULT_OPTIONS.load_textures,
			center_model: !!options.center_model,
			auto_create_project: options.auto_create_project !== undefined
				? !!options.auto_create_project
				: (options.create_project !== undefined ? !!options.create_project : DEFAULT_OPTIONS.auto_create_project),
			cull_faces: !!options.cull_faces,
			apply_texture_settings: options.apply_texture_settings !== undefined
				? !!options.apply_texture_settings
				: DEFAULT_OPTIONS.apply_texture_settings,
			apply_cull_faces: options.apply_cull_faces !== undefined
				? !!options.apply_cull_faces
				: DEFAULT_OPTIONS.apply_cull_faces
		};
	}

	function normalizeOptions(form) {
		return sanitizeOptions(Object.assign({}, getActiveOptions(), form || {}));
	}

	function loadStoredOptions() {
		let stored_options = {};
		try {
			if (typeof localStorage !== 'undefined') {
				stored_options = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
			}
		} catch (error) {
			console.warn(error);
		}
		cubizer_options = sanitizeOptions(Object.assign({}, DEFAULT_OPTIONS, stored_options));
	}

	function getActiveOptions() {
		let options = Object.assign({}, DEFAULT_OPTIONS, cubizer_options);
		if (Project && typeof Project[PROJECT_OPTIONS_PROPERTY] === 'object') {
			Object.assign(options, Project[PROJECT_OPTIONS_PROPERTY]);
		}
		return sanitizeOptions(options);
	}

	function saveActiveOptions(options) {
		let normalized = sanitizeOptions(Object.assign({}, getActiveOptions(), options || {}));
		cubizer_options = Object.assign({}, normalized);

		try {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
			}
		} catch (error) {
			console.warn(error);
		}

		if (Project) {
			Project[PROJECT_OPTIONS_PROPERTY] = Object.assign({}, normalized);
			Project.saved = false;
		}
		return normalized;
	}

	function createOptionsForm(options, include_apply_options) {
		let form = {
			create_project: {
				label: translate('form.create_project'),
				type: 'checkbox',
				value: options.auto_create_project
			},
			scale: {
				label: translate('form.scale'),
				type: 'number',
				value: options.scale,
				min: 0.001
			},
			default_depth: {
				label: translate('form.default_depth'),
				type: 'number',
				value: options.default_depth,
				min: 0.001,
				step: 0.0625
			},
			texture_size: {
				label: translate('form.texture_size'),
				type: 'number',
				value: options.texture_size,
				min: 1,
				step: 1
			},
			load_textures: {
				label: translate('form.load_textures'),
				type: 'checkbox',
				value: options.load_textures
			},
			texture_namespace: {
				label: translate('form.texture_namespace'),
				type: 'text',
				value: options.texture_namespace
			},
			texture_folder: {
				label: translate('form.texture_folder'),
				type: 'text',
				value: options.texture_folder
			},
			center_model: {
				label: translate('form.center_model'),
				type: 'checkbox',
				value: options.center_model
			},
			cull_faces: {
				label: translate('form.cull_faces'),
				type: 'checkbox',
				value: options.cull_faces
			}
		};

		if (include_apply_options) {
			form.apply_texture_settings = {
				label: translate('form.apply_texture_settings'),
				type: 'checkbox',
				value: options.apply_texture_settings
			};
			form.apply_cull_faces = {
				label: translate('form.apply_cull_faces'),
				type: 'checkbox',
				value: options.apply_cull_faces
			};
		}
		return form;
	}

	function showImportSummary(stats) {
		Blockbench.showMessageBox({
			title: translate('title'),
			icon: 'view_in_ar',
			width: 520,
			message: translate('message.summary', [stats.cubes, stats.faces, stats.textures, stats.skipped])
		});
	}

	function isCubizerTexture(texture) {
		return !!texture && (
			texture[IMPORTED_PROPERTY] ||
			texture.minecraft_obj_cubizer_source_path ||
			(texture.flags && texture.flags.has(PLUGIN_ID))
		);
	}

	function isCubizerCube(cube) {
		return !!cube && cube[IMPORTED_PROPERTY];
	}

	function applyCullfaceToCube(cube, enabled) {
		if (!cube || !cube.faces) return;
		FACE_DIRECTIONS.forEach(direction => {
			let face = cube.faces[direction];
			if (!face) return;
			face.cullface = enabled && face.texture !== null ? direction : '';
		});
	}

	function applyOptionsToProject(options) {
		if (!Project) return {textures: 0, cubes: 0};

		let imported_textures = Texture.all.filter(isCubizerTexture);
		let imported_cubes = Cube.all.filter(isCubizerCube);
		let undo_payload = {};
		if (options.apply_texture_settings && imported_textures.length) undo_payload.textures = imported_textures;
		if (options.apply_cull_faces && imported_cubes.length) undo_payload.elements = imported_cubes;
		let has_undo = undo_payload.textures || undo_payload.elements;
		if (has_undo) Undo.initEdit(undo_payload);

		Project.texture_width = options.texture_size;
		Project.texture_height = options.texture_size;
		Project.box_uv = false;

		if (options.apply_texture_settings) {
			imported_textures.forEach(texture => {
				texture.namespace = cleanName(options.texture_namespace).replace(/[/:].*$/, '') || 'minecraft';
				texture.folder = cleanName(options.texture_folder).replace(/^minecraft[:/]/, '').replace(/^textures\//, '') || 'block';
				texture[IMPORTED_PROPERTY] = true;
				if (texture.flags) texture.flags.add(PLUGIN_ID);
			});
		}

		if (options.apply_cull_faces) {
			imported_cubes.forEach(cube => applyCullfaceToCube(cube, options.cull_faces));
		}

		if (has_undo) Undo.finishEdit(translate('undo.settings'));
		Canvas.updateAll();
		updateSelection();
		Validator.validate();
		Project.saved = false;

		return {
			textures: options.apply_texture_settings ? imported_textures.length : 0,
			cubes: options.apply_cull_faces ? imported_cubes.length : 0
		};
	}

	async function importOBJAsCubes(file, options) {
		try {
			let path_module = isApp ? getNativeModule('path') : null;
			let base_dir = file.path ? (path_module ? path_module.dirname(file.path) : getDirname(file.path)) : '';
			let fs = isApp && file.path ? getNativeModule('fs', {
				scope: base_dir,
				optional: true,
				message: translate('message.fs_permission')
			}) : null;

			let obj = parseOBJ(file.content);
			let materials = await readMaterials(obj, file.path, fs, path_module);

			if (!obj.vertices.length || !obj.faces.length) {
				Blockbench.showMessageBox({
					title: translate('title'),
					icon: 'error',
					message: translate('message.empty_obj')
				});
				return;
			}

			let cubizer_faces = [];
			let skipped_faces = 0;
			obj.faces.forEach(face => {
				let cubizer_face = createCubizerFace(face, obj, {}, options);
				if (cubizer_face) {
					cubizer_faces.push(cubizer_face);
				} else {
					skipped_faces++;
				}
			});

			let cuboids = mergeFacesIntoCuboids(cubizer_faces);
			if (!cuboids.length) {
				Blockbench.showMessageBox({
					title: translate('title'),
					icon: 'error',
					message: translate('message.no_cubes')
				});
				return;
			}
			if (!await confirmCubeCount(cuboids)) return;
			if (!await confirmJavaCoordinateRange(cuboids, options)) return;

			if (!Project) {
				if (!options.auto_create_project) {
					Blockbench.showMessageBox({
						title: translate('title'),
						icon: 'info',
						message: translate('message.no_project_to_import')
					});
					return;
				}
				setupProject(Formats.java_block);
				Project.name = pathStem(file.name || file.path);
			}

			options = saveActiveOptions(options);

			Project.texture_width = options.texture_size;
			Project.texture_height = options.texture_size;
			Project.box_uv = false;

			let new_cubes = [];
			let new_textures = [];
			let new_groups = [];
			Undo.initEdit({elements: new_cubes, textures: new_textures, groups: new_groups, outliner: true});

			let textures = createTextures(obj, materials, options, file.path, fs, path_module, new_textures);
			cubizer_faces.forEach(face => {
				face.texture = textures[face.material] || textures.default || null;
			});

			let root_group = new Group(pathStem(file.name || file.path)).init();
			root_group.isOpen = true;
			new_groups.push(root_group);

			createCubes(cuboids, options, root_group, new_cubes);

			Undo.finishEdit(translate('undo.import'));
			root_group.select();
			Canvas.updateAll();
			updateSelection();
			Validator.validate();

			showImportSummary({
				cubes: new_cubes.length,
				faces: obj.faces.length,
				textures: new_textures.length,
				skipped: skipped_faces
			});
		} catch (error) {
			console.error(error);
			Blockbench.showMessageBox({
				title: translate('title'),
				icon: 'error',
				width: 520,
				message: translate('message.import_failed', [error?.message || error])
			});
		}
	}

	function showOptionsDialog(file) {
		let options = getActiveOptions();
		new Dialog({
			id: 'minecraft_obj_cubizer_options',
			title: translate('dialog.title'),
			width: 520,
			form: createOptionsForm(options, false),
			onConfirm(form) {
				importOBJAsCubes(file, normalizeOptions(form));
			}
		}).show();
	}

	function showSettingsDialog() {
		let options = getActiveOptions();
		new Dialog({
			id: 'minecraft_obj_cubizer_settings',
			title: translate('dialog.settings_title'),
			width: 520,
			form: createOptionsForm(options, true),
			onConfirm(form) {
				let options = saveActiveOptions(normalizeOptions(form));
				let updated = applyOptionsToProject(options);
				Blockbench.showQuickMessage(translate('message.settings_saved', [updated.textures, updated.cubes]), 3000);
			}
		}).show();
	}

	function pickOBJ() {
		if (!isApp) {
			Blockbench.showQuickMessage(translate('message.desktop_only'), 2500);
			return;
		}

		Blockbench.import({
			resource_id: 'obj',
			type: 'Minecraft OBJ',
			extensions: ['obj'],
			readtype: 'text',
			multiple: false
		}, files => {
			if (files && files[0]) showOptionsDialog(files[0]);
		});
	}

	function getObjImportedTextures() {
		let imported_textures = Texture.all.filter(isCubizerTexture);
		if (imported_textures.length) return imported_textures;
		return Texture.all.filter(texture => texture.path && texture.folder);
	}

	function exportObjTextures() {
		if (!isApp) {
			Blockbench.showQuickMessage(translate('message.desktop_only'), 2500);
			return;
		}

		let textures = getObjImportedTextures();
		if (!textures.length) {
			Blockbench.showMessageBox({
				title: translate('title'),
				icon: 'info',
				message: translate('message.no_textures')
			});
			return;
		}

		let root_path = Blockbench.pickDirectory({
			resource_id: 'texture',
			title: translate('message.pick_resource_pack_root')
		});
		if (!root_path) return;

		let path_module = getNativeModule('path');
		let fs = getNativeModule('fs', {
			scope: root_path,
			optional: true,
			message: translate('message.fs_permission')
		});
		if (!fs || !fs.mkdirSync) {
			Blockbench.showMessageBox({
				title: translate('title'),
				icon: 'error',
				message: translate('message.no_filesystem')
			});
			return;
		}

		let copied = 0;
		let failed = 0;
		textures.forEach(texture => {
			let namespace = cleanName(texture.namespace || 'minecraft').replace(/[/:].*$/, '') || 'minecraft';
			let folder = cleanName(texture.folder || 'block').replace(/^textures\//, '');
			let destination_folder = joinPath(path_module, root_path, 'assets', namespace, 'textures', folder);
			let destination_path = joinPath(path_module, destination_folder, texture.name || `${texture.id}.png`);
			try {
				ensureDirectory(fs, destination_folder);
				if (writeTextureFile(texture, destination_path, path_module)) {
					copied++;
				} else {
					failed++;
				}
			} catch (error) {
				console.warn(error);
				failed++;
			}
		});

		Blockbench.showMessageBox({
			title: translate('title'),
			icon: 'folder',
			width: 520,
			message: translate('message.export_textures_done', [copied, root_path, failed])
		});
	}

	function patchJavaTextureNamespaces(event) {
		if (!event || !event.model || !event.model.textures) return;

		Texture.all.forEach(texture => {
			if (!isCubizerTexture(texture)) return;
			let namespace = cleanName(texture.namespace || 'minecraft').replace(/[/:].*$/, '') || 'minecraft';
			let folder = cleanName(texture.folder || 'block').replace(/^textures\//, '') || 'block';
			let name = pathStem(texture.name || texture.id);
			let link = `${namespace}:${folder}/${name}`;

			for (let key in event.model.textures) {
				if (key === texture.id || event.model.textures[key] === texture.javaTextureLink()) {
					event.model.textures[key] = link;
				}
			}
			if (texture.particle && event.model.textures.particle === texture.javaTextureLink()) {
				event.model.textures.particle = link;
			}
		});
	}

	function patchAllJavaTextureNamespaces(event) {
		patchJavaTextureNamespaces(event);
		DirectMinecraftImporter.patchJavaTextureNamespaces(event);
		DirectMinecraftImporter.patchMissingMinecraftTextureNamespaces(event);
	}

	const DirectMinecraftImporter = (() => {
		'use strict';

		const PLUGIN_ID = 'minecraft_obj_cubizer';
		const TRANSLATION_PREFIX = `plugin.${PLUGIN_ID}.direct.`;
		const STORAGE_KEY = `${PLUGIN_ID}_direct_options`;
		const LEGACY_STORAGE_KEYS = [
			'direct_minecraft_importer_prototype_options'
		];
		const IMPORTED_PROPERTY = `${PLUGIN_ID}_imported`;
		const FACE_DIRECTIONS = ['north', 'east', 'south', 'west', 'up', 'down'];
		const DIRECTIONS = {
			north: {delta: [0, 0, -1]},
			south: {delta: [0, 0, 1]},
			west: {delta: [-1, 0, 0]},
			east: {delta: [1, 0, 0]},
			up: {delta: [0, 1, 0]},
			down: {delta: [0, -1, 0]}
		};
		const DEFAULT_OPTIONS = {
			create_project: true,
			texture_namespace: 'minecraft',
			texture_folder: 'block',
			texture_source_path: '',
			use_block_models: true,
			cube_limit: 5000,
			visible_faces_only: false,
			move_to_origin: true,
			center_model: false,
			cull_faces: false
		};
		const AIR_BLOCKS = new Set(['minecraft:air', 'minecraft:cave_air', 'minecraft:void_air', 'air']);
		const COLOR_NAMES = [
			'white',
			'orange',
			'magenta',
			'light_blue',
			'yellow',
			'lime',
			'pink',
			'gray',
			'light_gray',
			'cyan',
			'purple',
			'blue',
			'brown',
			'green',
			'red',
			'black'
		];
		const LEGACY_BLOCKS = {
			0: 'minecraft:air',
			1: 'minecraft:stone',
			2: 'minecraft:grass_block',
			3: 'minecraft:dirt',
			4: 'minecraft:cobblestone',
			5: 'minecraft:oak_planks',
			7: 'minecraft:bedrock',
			12: 'minecraft:sand',
			13: 'minecraft:gravel',
			17: 'minecraft:oak_log',
			18: 'minecraft:oak_leaves',
			20: 'minecraft:glass',
			24: 'minecraft:sandstone',
			26: 'minecraft:white_bed',
			35: 'minecraft:white_wool',
			41: 'minecraft:gold_block',
			42: 'minecraft:iron_block',
			43: 'minecraft:smooth_stone',
			44: 'minecraft:smooth_stone_slab',
			45: 'minecraft:bricks',
			48: 'minecraft:mossy_cobblestone',
			49: 'minecraft:obsidian',
			53: 'minecraft:oak_stairs',
			54: 'minecraft:chest',
			57: 'minecraft:diamond_block',
			61: 'minecraft:furnace',
			63: 'minecraft:oak_sign',
			65: 'minecraft:ladder',
			67: 'minecraft:stone_stairs',
			68: 'minecraft:oak_wall_sign',
			79: 'minecraft:ice',
			80: 'minecraft:snow_block',
			82: 'minecraft:clay',
			85: 'minecraft:oak_fence',
			87: 'minecraft:netherrack',
			89: 'minecraft:glowstone',
			95: 'minecraft:white_stained_glass',
			98: 'minecraft:stone_bricks',
			102: 'minecraft:glass_pane',
			108: 'minecraft:brick_stairs',
			109: 'minecraft:stone_brick_stairs',
			112: 'minecraft:nether_bricks',
			113: 'minecraft:nether_brick_fence',
			114: 'minecraft:nether_brick_stairs',
			121: 'minecraft:end_stone',
			130: 'minecraft:ender_chest',
			133: 'minecraft:emerald_block',
			134: 'minecraft:spruce_stairs',
			135: 'minecraft:birch_stairs',
			136: 'minecraft:jungle_stairs',
			139: 'minecraft:cobblestone_wall',
			146: 'minecraft:trapped_chest',
			155: 'minecraft:quartz_block',
			156: 'minecraft:quartz_stairs',
			159: 'minecraft:white_terracotta',
			160: 'minecraft:white_stained_glass_pane',
			162: 'minecraft:acacia_log',
			163: 'minecraft:acacia_stairs',
			164: 'minecraft:dark_oak_stairs',
			168: 'minecraft:prismarine',
			169: 'minecraft:sea_lantern',
			172: 'minecraft:terracotta',
			179: 'minecraft:red_sandstone',
			180: 'minecraft:red_sandstone_stairs',
			201: 'minecraft:purpur_block',
			202: 'minecraft:purpur_pillar',
			203: 'minecraft:purpur_stairs',
			251: 'minecraft:white_concrete',
			252: 'minecraft:white_concrete_powder'
		};
		const TEXTURE_ALIASES = {
			grass_block: 'grass_block_side',
			smooth_stone_slab: 'smooth_stone_slab_side',
			glass_pane: 'glass',
			oak_log: 'oak_log',
			spruce_log: 'spruce_log',
			birch_log: 'birch_log',
			jungle_log: 'jungle_log',
			acacia_log: 'acacia_log',
			dark_oak_log: 'dark_oak_log',
			cherry_log: 'cherry_log',
			mangrove_log: 'mangrove_log',
			oak_stairs: 'oak_planks',
			spruce_stairs: 'spruce_planks',
			birch_stairs: 'birch_planks',
			jungle_stairs: 'jungle_planks',
			acacia_stairs: 'acacia_planks',
			dark_oak_stairs: 'dark_oak_planks',
			stone_stairs: 'stone',
			brick_stairs: 'bricks',
			stone_brick_stairs: 'stone_bricks',
			nether_brick_stairs: 'nether_bricks',
			red_sandstone_stairs: 'red_sandstone',
			purpur_stairs: 'purpur_block',
			oak_fence: 'oak_planks',
			nether_brick_fence: 'nether_bricks',
			cobblestone_wall: 'cobblestone',
			quartz_block: 'quartz_block_side',
			quartz_stairs: 'quartz_block_side',
			redstone_wire: 'redstone_dust_line0',
			furnace: 'furnace_side'
		};

		let import_action;
		let settings_action;
		let texture_source_action;
		let compile_listener;
		let texture_imported_property;
		let importer_options = Object.assign({}, DEFAULT_OPTIONS);
		let texture_source_cache = {path: null, context: null};
		let asset_cache = {};
		let model_cache = {};

		function addTranslations() {
			if (typeof Language === 'undefined' || !Language.addTranslations) return;

			Language.addTranslations('en', {
				[TRANSLATION_PREFIX + 'title']: 'Minecraft Structure Import',
				[TRANSLATION_PREFIX + 'action.import']: 'Import Minecraft Structure',
				[TRANSLATION_PREFIX + 'action.settings']: 'Minecraft Structure Import Settings',
				[TRANSLATION_PREFIX + 'dialog.import_title']: 'Import Minecraft Structure',
				[TRANSLATION_PREFIX + 'dialog.settings_title']: 'Minecraft Structure Import Settings',
				[TRANSLATION_PREFIX + 'form.create_project']: 'Auto-create Java Block project',
				[TRANSLATION_PREFIX + 'form.texture_namespace']: 'Texture namespace',
				[TRANSLATION_PREFIX + 'form.texture_folder']: 'Texture folder',
				[TRANSLATION_PREFIX + 'form.texture_source_path']: 'Texture source folder or Minecraft jar',
				[TRANSLATION_PREFIX + 'form.use_block_models']: 'Read Minecraft block models',
				[TRANSLATION_PREFIX + 'form.cube_limit']: 'Maximum cubes to create',
				[TRANSLATION_PREFIX + 'form.visible_faces_only']: 'Only keep visible faces',
				[TRANSLATION_PREFIX + 'form.move_to_origin']: 'Move import to origin',
				[TRANSLATION_PREFIX + 'form.center_model']: 'Center model on origin',
				[TRANSLATION_PREFIX + 'form.cull_faces']: 'Set Java cullfaces',
				[TRANSLATION_PREFIX + 'message.desktop_only']: 'This importer needs the Blockbench desktop app.',
				[TRANSLATION_PREFIX + 'message.no_project']: 'No project is open. Enable automatic project creation or create/open a Java Block project first.',
				[TRANSLATION_PREFIX + 'message.empty']: 'No blocks were found in this file.',
				[TRANSLATION_PREFIX + 'message.pick_texture_source']: 'Select a resource pack root folder, or paste a Minecraft jar path in settings',
				[TRANSLATION_PREFIX + 'message.texture_source_saved']: 'Texture source saved.',
				[TRANSLATION_PREFIX + 'message.import_failed']: 'Import failed:\n\n%0',
				[TRANSLATION_PREFIX + 'message.summary']: 'Imported %0 Blockbench cubes from %1 non-air blocks.\n\nFormat: %2.\nTextures: %3.\nSkipped hidden blocks: %4.\nTruncated by limit: %5.\nBlocks rendered from model JSON: %6.\nFallback full cubes: %7.\n\nBlock entity data such as chest contents is not read.',
				[TRANSLATION_PREFIX + 'message.settings_saved']: 'Settings saved.'
			});

			Language.addTranslations('zh', {
				[TRANSLATION_PREFIX + 'title']: 'Minecraft 直接导入实验版',
				[TRANSLATION_PREFIX + 'action.import']: '导入 Minecraft 建筑实验版',
				[TRANSLATION_PREFIX + 'action.settings']: 'Minecraft 建筑导入设置',
				[TRANSLATION_PREFIX + 'dialog.import_title']: '导入 Minecraft 建筑实验版',
				[TRANSLATION_PREFIX + 'dialog.settings_title']: 'Minecraft 建筑导入设置',
				[TRANSLATION_PREFIX + 'form.create_project']: '自动创建 Java Block 项目',
				[TRANSLATION_PREFIX + 'form.texture_namespace']: '贴图命名空间',
				[TRANSLATION_PREFIX + 'form.texture_folder']: '贴图文件夹',
				[TRANSLATION_PREFIX + 'form.texture_source_path']: '贴图来源目录或 Minecraft jar',
				[TRANSLATION_PREFIX + 'form.cube_limit']: '最多创建方块数',
				[TRANSLATION_PREFIX + 'form.visible_faces_only']: '只保留可见面',
				[TRANSLATION_PREFIX + 'form.move_to_origin']: '导入后移动到原点',
				[TRANSLATION_PREFIX + 'form.center_model']: '模型居中到原点',
				[TRANSLATION_PREFIX + 'form.cull_faces']: '设置 Java cullface',
				[TRANSLATION_PREFIX + 'message.desktop_only']: '这个实验版需要 Blockbench 桌面版。',
				[TRANSLATION_PREFIX + 'message.no_project']: '当前没有打开项目。请启用自动创建项目，或者先创建/打开 Java Block 项目。',
				[TRANSLATION_PREFIX + 'message.empty']: '这个文件里没有找到可导入的方块。',
				[TRANSLATION_PREFIX + 'message.pick_texture_source']: '选择资源包根目录，或者在设置里粘贴 Minecraft jar 路径',
				[TRANSLATION_PREFIX + 'message.texture_source_saved']: '贴图来源已保存。',
				[TRANSLATION_PREFIX + 'message.import_failed']: '导入失败：\n\n%0',
				[TRANSLATION_PREFIX + 'message.summary']: '已从 %1 个非空气方块导入 %0 个 Blockbench 方块。\n\n格式：%2\n贴图：%3\n跳过的隐藏方块：%4\n因数量限制截断：%5\n\n这是完整方块导入实验版。非完整方块模型、实体、方块实体暂时还不会转换。',
				[TRANSLATION_PREFIX + 'message.settings_saved']: '设置已保存。'
			});
			Language.addTranslations('zh', {
				[TRANSLATION_PREFIX + 'form.use_block_models']: '读取 Minecraft 方块模型',
				[TRANSLATION_PREFIX + 'message.summary']: '已从 %1 个非空气方块导入 %0 个 Blockbench 方块。\n\n格式：%2。\n贴图：%3。\n跳过的隐藏方块：%4。\n因数量限制截断：%5。\n使用模型 JSON 的方块：%6。\n退回完整方块：%7。\n\n不会读取箱子物品、告示牌文字等方块实体数据。'
			});
		}

		function translate(key, variables) {
			if (typeof tl === 'function') return tl(TRANSLATION_PREFIX + key, variables);
			return key;
		}

		function getNativeModule(name, options) {
			if (typeof requireNativeModule === 'function') {
				try {
					return requireNativeModule(name, options);
				} catch (error) {
					console.warn(error);
				}
			}
			if (typeof require === 'function') {
				try {
					return require(name);
				} catch (error) {
					console.warn(error);
				}
			}
			return null;
		}

		function cleanName(name) {
			return String(name || 'texture')
				.replace(/\.[a-z0-9]{2,8}$/i, '')
				.replace(/[^a-zA-Z0-9_./-]+/g, '_')
				.replace(/^_+|_+$/g, '') || 'texture';
		}

		function pathBasename(path) {
			return String(path || '')
				.replace(/\\/g, '/')
				.split('/')
				.pop() || 'structure';
		}

		function pathStem(path) {
			return pathBasename(path).replace(/\.[^.]+$/, '');
		}

		function joinPath(path_module, ...parts) {
			if (path_module) return path_module.join(...parts);
			let separator = parts.find(part => String(part).includes('\\')) ? '\\' : '/';
			return parts
				.filter(part => part !== undefined && part !== null && part !== '')
				.map((part, index) => {
					part = String(part);
					if (index === 0) return part.replace(/[\\/]+$/, '');
					return part.replace(/^[\\/]+|[\\/]+$/g, '');
				})
				.join(separator);
		}

		function fileExists(fs, path) {
			try {
				return !!(fs && path && fs.existsSync(path));
			} catch (error) {
				console.warn(error);
				return false;
			}
		}

		function isDirectory(fs, path) {
			try {
				return !!(fs && path && fs.existsSync(path) && fs.statSync(path).isDirectory());
			} catch (error) {
				return false;
			}
		}

		function isFile(fs, path) {
			try {
				return !!(fs && path && fs.existsSync(path) && fs.statSync(path).isFile());
			} catch (error) {
				return false;
			}
		}

		function uniqueTextureId(base_id) {
			let id = cleanName(base_id).replace(/[./:-]+/g, '_').toLowerCase();
			if (!id.match(/^[a-z_]/)) id = 'tex_' + id;
			let candidate = id;
			let index = 2;
			while (Texture.all.some(texture => texture.id === candidate)) {
				candidate = `${id}_${index++}`;
			}
			return candidate;
		}

		function sanitizeOptions(options) {
			options = options || {};
			return {
				create_project: options.create_project !== undefined ? !!options.create_project : DEFAULT_OPTIONS.create_project,
				texture_namespace: cleanName(options.texture_namespace || DEFAULT_OPTIONS.texture_namespace).replace(/[/:].*$/, '') || 'minecraft',
				texture_folder: cleanName(options.texture_folder || DEFAULT_OPTIONS.texture_folder).replace(/^textures\//, '') || 'block',
				texture_source_path: String(options.texture_source_path || '').trim().replace(/^"|"$/g, ''),
				use_block_models: options.use_block_models !== undefined ? !!options.use_block_models : DEFAULT_OPTIONS.use_block_models,
				cube_limit: Math.max(parseInt(options.cube_limit, 10) || DEFAULT_OPTIONS.cube_limit, 1),
				visible_faces_only: options.visible_faces_only !== undefined ? !!options.visible_faces_only : DEFAULT_OPTIONS.visible_faces_only,
				move_to_origin: options.move_to_origin !== undefined ? !!options.move_to_origin : DEFAULT_OPTIONS.move_to_origin,
				center_model: !!options.center_model,
				cull_faces: !!options.cull_faces
			};
		}

		function loadStoredOptions() {
			try {
				if (typeof localStorage !== 'undefined') {
					let stored_options = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
					if (!stored_options.texture_source_path) {
						for (let key of LEGACY_STORAGE_KEYS) {
							let legacy_options = JSON.parse(localStorage.getItem(key) || '{}') || {};
							if (legacy_options.texture_source_path) {
								stored_options = Object.assign({}, legacy_options, stored_options);
								localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeOptions(Object.assign({}, DEFAULT_OPTIONS, stored_options))));
								break;
							}
						}
					}
					importer_options = sanitizeOptions(Object.assign({}, DEFAULT_OPTIONS, stored_options));
					return;
				}
			} catch (error) {
				console.warn(error);
			}
			importer_options = Object.assign({}, DEFAULT_OPTIONS);
		}

		function saveOptions(options) {
			let previous_texture_source = importer_options.texture_source_path;
			importer_options = sanitizeOptions(Object.assign({}, importer_options, options || {}));
			if (previous_texture_source !== importer_options.texture_source_path) {
				texture_source_cache = {path: null, context: null};
				asset_cache = {};
				model_cache = {};
			}
			try {
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(importer_options));
				}
			} catch (error) {
				console.warn(error);
			}
			return Object.assign({}, importer_options);
		}

		function updateTextureSourcePathInputs(texture_source_path) {
			if (typeof document === 'undefined') return;
			document.querySelectorAll('.form_bar_texture_source_path input#texture_source_path').forEach(input => {
				input.value = texture_source_path || '';
				input.dispatchEvent(new Event('input', {bubbles: true}));
			});
		}

		function createOptionsForm(options) {
			return {
				create_project: {
					label: translate('form.create_project'),
					type: 'checkbox',
					value: options.create_project
				},
				texture_namespace: {
					label: translate('form.texture_namespace'),
					type: 'text',
					value: options.texture_namespace
				},
				texture_folder: {
					label: translate('form.texture_folder'),
					type: 'text',
					value: options.texture_folder
				},
				texture_source_path: {
					label: translate('form.texture_source_path'),
					type: 'text',
					value: options.texture_source_path
				},
				texture_source_picker: {
					label: translate('form.texture_source_picker'),
					type: 'buttons',
					buttons: [
						translate('button.pick_texture_source_folder'),
						translate('button.pick_texture_source_jar')
					],
					click(index) {
						if (index === 0) pickTextureSourceFolder();
						if (index === 1) pickTextureSourceJar();
					}
				},
				use_block_models: {
					label: translate('form.use_block_models'),
					type: 'checkbox',
					value: options.use_block_models
				},
				cube_limit: {
					label: translate('form.cube_limit'),
					type: 'number',
					value: options.cube_limit,
					min: 1,
					step: 100
				},
				cube_limit_note: {
					type: 'info',
					text: translate('form.cube_limit_note')
				},
				move_to_origin: {
					label: translate('form.move_to_origin'),
					type: 'checkbox',
					value: options.move_to_origin
				},
				center_model: {
					label: translate('form.center_model'),
					type: 'checkbox',
					value: options.center_model
				},
				cull_faces: {
					label: translate('form.cull_faces'),
					type: 'checkbox',
					value: options.cull_faces
				}
			};
		}

		function toUint8Array(buffer) {
			if (buffer instanceof Uint8Array) return buffer;
			if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
			if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
			if (ArrayBuffer.isView(buffer)) return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
			if (typeof buffer === 'string') {
				let bytes = new Uint8Array(buffer.length);
				for (let i = 0; i < buffer.length; i++) bytes[i] = buffer.charCodeAt(i) & 255;
				return bytes;
			}
			throw new Error('Unsupported binary content');
		}

		function toNodeBuffer(bytes) {
			bytes = toUint8Array(bytes);
			if (typeof Buffer !== 'undefined') return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			return bytes;
		}

		function toDataUrl(bytes, mime) {
			bytes = toUint8Array(bytes);
			if (typeof Buffer !== 'undefined') {
				return `data:${mime || 'image/png'};base64,${Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64')}`;
			}
			let binary = '';
			for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
			return `data:${mime || 'image/png'};base64,${btoa(binary)}`;
		}

		function readFileBuffer(file) {
			if (isApp && file.path) {
				let fs = getNativeModule('fs', {
					scope: file.path,
					optional: true,
					message: 'Read Minecraft structure files'
				});
				if (fs && fs.readFileSync) return fs.readFileSync(file.path);
			}
			return toUint8Array(file.content || file.contents || '');
		}

		function decodeUtf8(bytes) {
			if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
			if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('utf8');
			let binary = '';
			for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
			return decodeURIComponent(escape(binary));
		}

		function readUInt16LE(bytes, offset) {
			return (bytes[offset] | (bytes[offset + 1] << 8)) >>> 0;
		}

		function readUInt32LE(bytes, offset) {
			return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
		}

		function findZipEndOfCentralDirectory(bytes) {
			let min = Math.max(0, bytes.length - 0xffff - 22);
			for (let offset = bytes.length - 22; offset >= min; offset--) {
				if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4b && bytes[offset + 2] === 0x05 && bytes[offset + 3] === 0x06) {
					return offset;
				}
			}
			return -1;
		}

		function createZipIndex(zip_path) {
			let fs = getNativeModule('fs', {optional: true});
			if (!fs || !fs.readFileSync) throw new Error('Cannot read zip or jar file');
			let bytes = toUint8Array(fs.readFileSync(zip_path));
			let end = findZipEndOfCentralDirectory(bytes);
			if (end < 0) throw new Error('Invalid zip or jar file');

			let entry_count = readUInt16LE(bytes, end + 10);
			let central_offset = readUInt32LE(bytes, end + 16);
			let entries = {};
			let offset = central_offset;

			for (let i = 0; i < entry_count && offset + 46 <= bytes.length; i++) {
				if (readUInt32LE(bytes, offset) !== 0x02014b50) break;
				let method = readUInt16LE(bytes, offset + 10);
				let compressed_size = readUInt32LE(bytes, offset + 20);
				let uncompressed_size = readUInt32LE(bytes, offset + 24);
				let name_length = readUInt16LE(bytes, offset + 28);
				let extra_length = readUInt16LE(bytes, offset + 30);
				let comment_length = readUInt16LE(bytes, offset + 32);
				let local_offset = readUInt32LE(bytes, offset + 42);
				let name = decodeUtf8(bytes.slice(offset + 46, offset + 46 + name_length)).replace(/\\/g, '/');
				entries[name] = {method, compressed_size, uncompressed_size, local_offset};
				if (name.toLowerCase() !== name) entries[name.toLowerCase()] = entries[name];
				offset += 46 + name_length + extra_length + comment_length;
			}

			return {path: zip_path, bytes, entries};
		}

		function extractZipEntry(zip, entry_name) {
			if (!zip || !zip.entries) return null;
			let entry = zip.entries[entry_name] || zip.entries[entry_name.toLowerCase()];
			if (!entry) return null;
			let bytes = zip.bytes;
			let offset = entry.local_offset;
			if (readUInt32LE(bytes, offset) !== 0x04034b50) return null;
			let name_length = readUInt16LE(bytes, offset + 26);
			let extra_length = readUInt16LE(bytes, offset + 28);
			let data_start = offset + 30 + name_length + extra_length;
			let compressed = bytes.slice(data_start, data_start + entry.compressed_size);

			if (entry.method === 0) return compressed;
			if (entry.method === 8) {
				let zlib = getNativeModule('zlib');
				if (!zlib) return null;
				return toUint8Array(zlib.inflateRawSync(toNodeBuffer(compressed)));
			}
			return null;
		}

		function findLatestMinecraftJar(fs, path_module) {
			try {
				let appdata = typeof process !== 'undefined' && process.env ? process.env.APPDATA : '';
				if (!appdata || !fs || !path_module) return '';
				let versions_dir = path_module.join(appdata, '.minecraft', 'versions');
				if (!isDirectory(fs, versions_dir)) return '';
				let candidates = [];
				fs.readdirSync(versions_dir, {withFileTypes: true}).forEach(entry => {
					if (!entry.isDirectory()) return;
					let folder = path_module.join(versions_dir, entry.name);
					let preferred = path_module.join(folder, `${entry.name}.jar`);
					if (isFile(fs, preferred)) {
						candidates.push(preferred);
						return;
					}
					fs.readdirSync(folder)
						.filter(name => name.toLowerCase().endsWith('.jar'))
						.forEach(name => candidates.push(path_module.join(folder, name)));
				});
				candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
				return candidates[0] || '';
			} catch (error) {
				console.warn(error);
				return '';
			}
		}

		function getTextureSourceContext(options) {
			let fs = getNativeModule('fs', {optional: true});
			let path_module = getNativeModule('path');
			let source_path = String(options.texture_source_path || '').trim().replace(/^"|"$/g, '');

			if (!source_path) {
				source_path = findLatestMinecraftJar(fs, path_module);
			}
			if (!source_path && typeof settings !== 'undefined' && settings.default_path?.value) {
				source_path = settings.default_path.value;
			}

			if (!source_path || !fs || !path_module) return {type: 'none', path: ''};
			if (texture_source_cache.path === source_path && texture_source_cache.context) {
				return texture_source_cache.context;
			}

			let lower = source_path.toLowerCase();
			let context = {type: 'none', path: source_path, fs, path_module};
			try {
				if ((lower.endsWith('.jar') || lower.endsWith('.zip')) && isFile(fs, source_path)) {
					context = {type: 'zip', path: source_path, zip: createZipIndex(source_path)};
				} else {
					context = {type: 'folder', path: source_path, fs, path_module};
				}
			} catch (error) {
				console.warn(error);
			}

			texture_source_cache = {path: source_path, context};
			return context;
		}

		class NbtReader {
			constructor(buffer) {
				this.bytes = toUint8Array(buffer);
				this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
				this.offset = 0;
			}

			ensure(length) {
				if (this.offset + length > this.bytes.length) throw new Error('Unexpected end of NBT data');
			}

			readUnsignedByte() {
				this.ensure(1);
				return this.view.getUint8(this.offset++);
			}

			readByte() {
				this.ensure(1);
				return this.view.getInt8(this.offset++);
			}

			readShort() {
				this.ensure(2);
				let value = this.view.getInt16(this.offset, false);
				this.offset += 2;
				return value;
			}

			readUnsignedShort() {
				this.ensure(2);
				let value = this.view.getUint16(this.offset, false);
				this.offset += 2;
				return value;
			}

			readInt() {
				this.ensure(4);
				let value = this.view.getInt32(this.offset, false);
				this.offset += 4;
				return value;
			}

			readLong() {
				this.ensure(8);
				let high = BigInt(this.view.getInt32(this.offset, false));
				let low = BigInt(this.view.getUint32(this.offset + 4, false));
				this.offset += 8;
				return BigInt.asIntN(64, (high << 32n) | low);
			}

			readFloat() {
				this.ensure(4);
				let value = this.view.getFloat32(this.offset, false);
				this.offset += 4;
				return value;
			}

			readDouble() {
				this.ensure(8);
				let value = this.view.getFloat64(this.offset, false);
				this.offset += 8;
				return value;
			}

			readString() {
				let length = this.readUnsignedShort();
				this.ensure(length);
				let bytes = this.bytes.slice(this.offset, this.offset + length);
				this.offset += length;
				return decodeUtf8(bytes);
			}

			readByteArray() {
				let length = this.readInt();
				if (length < 0) throw new Error('Invalid NBT byte array length');
				this.ensure(length);
				let bytes = this.bytes.slice(this.offset, this.offset + length);
				this.offset += length;
				return bytes;
			}

			readIntArray() {
				let length = this.readInt();
				if (length < 0) throw new Error('Invalid NBT int array length');
				let values = [];
				for (let i = 0; i < length; i++) values.push(this.readInt());
				return values;
			}

			readLongArray() {
				let length = this.readInt();
				if (length < 0) throw new Error('Invalid NBT long array length');
				let values = [];
				for (let i = 0; i < length; i++) values.push(this.readLong());
				return values;
			}

			readPayload(type) {
				switch (type) {
					case 0: return null;
					case 1: return this.readByte();
					case 2: return this.readShort();
					case 3: return this.readInt();
					case 4: return this.readLong();
					case 5: return this.readFloat();
					case 6: return this.readDouble();
					case 7: return this.readByteArray();
					case 8: return this.readString();
					case 9: {
						let element_type = this.readUnsignedByte();
						let length = this.readInt();
						if (length < 0) throw new Error('Invalid NBT list length');
						let values = [];
						for (let i = 0; i < length; i++) values.push(this.readPayload(element_type));
						return values;
					}
					case 10: {
						let value = {};
						while (true) {
							let child_type = this.readUnsignedByte();
							if (child_type === 0) break;
							let name = this.readString();
							value[name] = this.readPayload(child_type);
						}
						return value;
					}
					case 11: return this.readIntArray();
					case 12: return this.readLongArray();
					default: throw new Error(`Unsupported NBT tag type ${type}`);
				}
			}
		}

		function parseNbt(buffer) {
			let reader = new NbtReader(buffer);
			let type = reader.readUnsignedByte();
			if (type !== 10) throw new Error(`Expected NBT root compound, got tag type ${type}`);
			let name = reader.readString();
			return {name, value: reader.readPayload(type)};
		}

		function parseNbtMaybeCompressed(buffer) {
			let zlib = getNativeModule('zlib');
			let bytes = toUint8Array(buffer);
			let attempts = [];

			if (bytes[0] === 0x1f && bytes[1] === 0x8b && zlib) {
				attempts.push(zlib.gunzipSync(toNodeBuffer(bytes)));
			} else {
				attempts.push(bytes);
				if (zlib) {
					try {
						attempts.push(zlib.gunzipSync(toNodeBuffer(bytes)));
					} catch (error) {
						// Try zlib next.
					}
					try {
						attempts.push(zlib.inflateSync(toNodeBuffer(bytes)));
					} catch (error) {
						// Uncompressed NBT is still allowed.
					}
				}
			}

			let last_error = null;
			for (let attempt of attempts) {
				try {
					return parseNbt(attempt);
				} catch (error) {
					last_error = error;
				}
			}
			throw last_error || new Error('Could not parse NBT data');
		}

		function readInt32BE(bytes, offset) {
			return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) | 0;
		}

		function toNumber(value, fallback = 0) {
			if (typeof value === 'bigint') return Number(value);
			let number = Number(value);
			return Number.isFinite(number) ? number : fallback;
		}

		function vectorFrom(value, fallback = [0, 0, 0]) {
			if (Array.isArray(value)) return [toNumber(value[0]), toNumber(value[1]), toNumber(value[2])];
			if (value && typeof value === 'object') return [toNumber(value.x), toNumber(value.y), toNumber(value.z)];
			return fallback.slice();
		}

		function normalizeBlockName(name) {
			name = String(name || 'minecraft:air');
			if (!name.includes(':')) name = `minecraft:${name}`;
			return name;
		}

		function stringifyBlockState(name, properties) {
			name = normalizeBlockName(name);
			if (!properties || typeof properties !== 'object' || !Object.keys(properties).length) return name;
			let keys = Object.keys(properties).sort();
			return `${name}[${keys.map(key => `${key}=${properties[key]}`).join(',')}]`;
		}

		function blockStateFromPaletteEntry(entry) {
			if (typeof entry === 'string') return normalizeBlockName(entry);
			if (!entry || typeof entry !== 'object') return 'minecraft:air';
			return stringifyBlockState(entry.Name || entry.name || 'minecraft:air', entry.Properties || entry.properties);
		}

		function blockNameFromState(state) {
			return normalizeBlockName(String(state || 'minecraft:air').split('[')[0]);
		}

		function isAirState(state) {
			return AIR_BLOCKS.has(blockNameFromState(state));
		}

		function legacyBlockName(id, data) {
			id = Number(id) & 255;
			data = Number(data) & 15;
			if (id === 35) return `minecraft:${COLOR_NAMES[data] || 'white'}_wool`;
			if (id === 95) return `minecraft:${COLOR_NAMES[data] || 'white'}_stained_glass`;
			if (id === 159) return `minecraft:${COLOR_NAMES[data] || 'white'}_terracotta`;
			if (id === 160) return `minecraft:${COLOR_NAMES[data] || 'white'}_stained_glass_pane`;
			if (id === 251) return `minecraft:${COLOR_NAMES[data] || 'white'}_concrete`;
			if (id === 252) return `minecraft:${COLOR_NAMES[data] || 'white'}_concrete_powder`;
			if (id === 5) {
				let woods = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'];
				return `minecraft:${woods[data] || 'oak'}_planks`;
			}
			if (id === 17 || id === 162) {
				let woods = id === 17 ? ['oak', 'spruce', 'birch', 'jungle'] : ['acacia', 'dark_oak'];
				return `minecraft:${woods[data & 3] || 'oak'}_log`;
			}
			return LEGACY_BLOCKS[id] || `minecraft:legacy_${id}_${data}`;
		}

		function getNibble(bytes, index) {
			if (!bytes || index < 0) return 0;
			let value = bytes[index >> 1] || 0;
			return (index & 1) ? ((value >> 4) & 15) : (value & 15);
		}

		function texturePathFromState(state) {
			let name = blockNameFromState(state);
			let parts = name.split(':');
			let path = parts[1] || parts[0];
			path = path.replace(/^block\//, '');
			path = getFallbackTexturePath(path);
			if (path.endsWith('_stained_glass_pane')) path = path.replace(/_pane$/, '');
			path = TEXTURE_ALIASES[path] || path;
			return path;
		}

		function withTextureUvHint(info) {
			let full_path = String(info.full_path || '');
			let size = null;
			if (/^entity\/chest\//.test(full_path)) size = [64, 64];
			else if (/^entity\/signs\//.test(full_path)) size = [64, 32];
			else if (/^entity\/bed\//.test(full_path)) size = [64, 64];
			else if (full_path === 'entity/banner/base' || full_path === 'entity/banner_base') size = [64, 64];
			else if (full_path === 'entity/decorated_pot/decorated_pot_base') size = [32, 32];
			else if (/^entity\/decorated_pot\//.test(full_path)) size = [16, 16];
			else if (/^entity\/copper_golem\//.test(full_path)) size = [64, 64];
			else if (/^entity\/player\//.test(full_path)) size = [64, 64];
			else if (/^entity\/zombie\//.test(full_path)) size = [64, 64];
			else if (/^entity\/piglin\//.test(full_path)) size = [64, 64];
			else if (/^entity\/skeleton\//.test(full_path)) size = [64, 32];
			else if (/^entity\/creeper\//.test(full_path)) size = [64, 32];
			else if (/^entity\/enderdragon\//.test(full_path)) size = [256, 256];
			if (size) {
				info.uv_width = size[0];
				info.uv_height = size[1];
			}
			return info;
		}

		function textureInfoForFullPath(namespace, path, full_path) {
			return withTextureUvHint({
				namespace: namespace || 'minecraft',
				path: path || pathBasename(full_path),
				full_path
			});
		}

		function textureInfoFromState(state) {
			let name = blockNameFromState(state);
			let parts = name.split(':');
			let block_path = parts[1] || parts[0];
			let path = texturePathFromState(state);
			let full_path = getFallbackFullTexturePath(block_path, path);
			return withTextureUvHint({
				namespace: parts[0] || 'minecraft',
				path,
				full_path
			});
		}

		function textureInfoFromLink(link, fallback_state, default_namespace) {
			link = String(link || '').replace(/^#/, '');
			if (!link || link === 'missing') return textureInfoFromState(fallback_state || 'minecraft:stone');
			if (!link.includes(':')) link = `${default_namespace || 'minecraft'}:${link}`;
			let parts = link.split(':');
			let namespace = parts[0] || 'minecraft';
			let full_path = (parts.slice(1).join(':') || '').replace(/^textures\//, '').replace(/\.png$/i, '');
			let path = full_path.replace(/^block\//, '');
			return withTextureUvHint({namespace, path, full_path});
		}

		function redstoneWireTintRgb(state) {
			let parsed = parseBlockState(state);
			if (parsed.name !== 'redstone_wire') return null;
			let power = Math.max(0, Math.min(15, parseInt(parsed.properties.power, 10) || 0));
			let strength = power / 15;
			let red = power === 0 ? 0.3 : strength * 0.6 + 0.4;
			let green = Math.max(0, strength * strength * 0.7 - 0.5);
			let blue = Math.max(0, strength * strength * 0.6 - 0.7);
			return {
				id: `redstone_${power}`,
				rgb: [
					Math.round(red * 255),
					Math.round(green * 255),
					Math.round(blue * 255)
				]
			};
		}

		function tintInfoForBlockFace(state, tintindex) {
			if (tintindex !== 0) return null;
			return redstoneWireTintRgb(state);
		}

		function getFallbackFullTexturePath(block_path, texture_path) {
			if (block_path.endsWith('_wall_hanging_sign') || block_path.endsWith('_hanging_sign')) {
				let wood = block_path.replace(/_wall_hanging_sign$|_hanging_sign$/g, '');
				if (wood) return `entity/signs/hanging/${wood}`;
			}
			if (block_path.endsWith('_wall_sign') || block_path.endsWith('_sign')) {
				let wood = block_path.replace(/_wall_sign$|_sign$/g, '');
				if (wood) return `entity/signs/${wood}`;
			}
			for (let color of COLOR_NAMES) {
				if (block_path === `${color}_bed`) return `entity/bed/${color}`;
				if (block_path === `${color}_banner` || block_path === `${color}_wall_banner`) return 'entity/banner/base';
			}
			if (block_path === 'chest') return 'entity/chest/normal';
			if (block_path === 'trapped_chest') return 'entity/chest/trapped';
			if (block_path === 'ender_chest') return 'entity/chest/ender';
			if (block_path === 'copper_chest' || block_path === 'waxed_copper_chest') return 'entity/chest/copper';
			if (block_path === 'exposed_copper_chest' || block_path === 'waxed_exposed_copper_chest') return 'entity/chest/copper_exposed';
			if (block_path === 'weathered_copper_chest' || block_path === 'waxed_weathered_copper_chest') return 'entity/chest/copper_weathered';
			if (block_path === 'oxidized_copper_chest' || block_path === 'waxed_oxidized_copper_chest') return 'entity/chest/copper_oxidized';
			if (block_path === 'player_head' || block_path === 'player_wall_head') return 'entity/player/wide/steve';
			if (block_path === 'skeleton_skull' || block_path === 'skeleton_wall_skull') return 'entity/skeleton/skeleton';
			if (block_path === 'wither_skeleton_skull' || block_path === 'wither_skeleton_wall_skull') return 'entity/skeleton/wither_skeleton';
			if (block_path === 'zombie_head' || block_path === 'zombie_wall_head') return 'entity/zombie/zombie';
			if (block_path === 'creeper_head' || block_path === 'creeper_wall_head') return 'entity/creeper/creeper';
			if (block_path === 'piglin_head' || block_path === 'piglin_wall_head') return 'entity/piglin/piglin';
			if (block_path === 'dragon_head' || block_path === 'dragon_wall_head') return 'entity/enderdragon/dragon';
			if (block_path === 'decorated_pot') return 'entity/decorated_pot/decorated_pot_base';
			if (block_path === 'copper_golem_statue' || block_path === 'waxed_copper_golem_statue') return 'entity/copper_golem/copper_golem';
			if (block_path === 'exposed_copper_golem_statue' || block_path === 'waxed_exposed_copper_golem_statue') return 'entity/copper_golem/exposed_copper_golem';
			if (block_path === 'weathered_copper_golem_statue' || block_path === 'waxed_weathered_copper_golem_statue') return 'entity/copper_golem/weathered_copper_golem';
			if (block_path === 'oxidized_copper_golem_statue' || block_path === 'waxed_oxidized_copper_golem_statue') return 'entity/copper_golem/oxidized_copper_golem';
			return `block/${texture_path}`;
		}

		function getFallbackTexturePath(path) {
			let direct = {
				redstone_wall_torch: 'redstone_torch',
				soul_wall_torch: 'soul_torch',
				wall_torch: 'torch',
				oak_wall_sign: 'oak',
				spruce_wall_sign: 'spruce',
				birch_wall_sign: 'birch',
				jungle_wall_sign: 'jungle',
				acacia_wall_sign: 'acacia',
				dark_oak_wall_sign: 'dark_oak',
				mangrove_wall_sign: 'mangrove',
				cherry_wall_sign: 'cherry',
				bamboo_wall_sign: 'bamboo',
				crimson_wall_sign: 'crimson',
				warped_wall_sign: 'warped',
				hopper: 'hopper_outside',
				cauldron: 'cauldron_side',
				comparator: 'comparator',
				repeater: 'repeater',
				lever: 'lever',
				tripwire_hook: 'tripwire_hook',
				bell: 'bell_body',
				lantern: 'lantern',
				soul_lantern: 'soul_lantern',
				chain: 'chain'
			};
			if (direct[path]) return direct[path];
			if (path.endsWith('_wall_torch')) return path.replace(/_wall_torch$/, '_torch');
			if (path.endsWith('_stained_glass_pane')) return path.replace(/_pane$/, '');
			if (path.endsWith('_pane')) return path.replace(/_pane$/, '');
			if (path.endsWith('_carpet')) return path.replace(/_carpet$/, '_wool');
			if (path.endsWith('_slab')) return materialTextureFromBase(path.replace(/_slab$/, ''));
			if (path.endsWith('_stairs')) return materialTextureFromBase(path.replace(/_stairs$/, ''));
			if (path.endsWith('_wall')) return materialTextureFromBase(path.replace(/_wall$/, ''));
			if (path.endsWith('_fence_gate')) return materialTextureFromBase(path.replace(/_fence_gate$/, ''));
			if (path.endsWith('_fence')) return materialTextureFromBase(path.replace(/_fence$/, ''));
			if (path.endsWith('_button')) return materialTextureFromBase(path.replace(/_button$/, ''));
			if (path.endsWith('_pressure_plate')) return materialTextureFromBase(path.replace(/_pressure_plate$/, ''));
			if (path.endsWith('_wall_sign')) return path.replace(/_wall_sign$/, '');
			if (path.endsWith('_sign')) return path.replace(/_sign$/, '');
			return path;
		}

		function materialTextureFromBase(base) {
			const wood_types = [
				'oak',
				'spruce',
				'birch',
				'jungle',
				'acacia',
				'dark_oak',
				'mangrove',
				'cherry',
				'bamboo',
				'crimson',
				'warped'
			];
			if (wood_types.includes(base)) {
				return base === 'crimson' || base === 'warped' ? `${base}_planks` : `${base}_planks`;
			}
			let aliases = {
				quartz: 'quartz_block_side',
				smooth_quartz: 'quartz_block_bottom',
				stone_brick: 'stone_bricks',
				mossy_stone_brick: 'mossy_stone_bricks',
				nether_brick: 'nether_bricks',
				red_nether_brick: 'red_nether_bricks',
				polished_blackstone_brick: 'polished_blackstone_bricks',
				smooth_stone: 'smooth_stone_slab_side',
				cut_copper: 'cut_copper',
				exposed_cut_copper: 'exposed_cut_copper',
				weathered_cut_copper: 'weathered_cut_copper',
				oxidized_cut_copper: 'oxidized_cut_copper'
			};
			return aliases[base] || base;
		}

		function getTextureCandidates(info, options) {
			let namespaces = Array.from(new Set([
				info.namespace || 'minecraft',
				options.texture_namespace || 'minecraft',
				'minecraft'
			]));
			let folders = Array.from(new Set([
				options.texture_folder || 'block',
				'block'
			]));
			let candidates = [];
			namespaces.forEach(namespace => {
				if (info.full_path) {
					candidates.push(`assets/${namespace}/textures/${info.full_path}.png`);
				}
				folders.forEach(folder => {
					candidates.push(`assets/${namespace}/textures/${folder}/${info.path}.png`);
				});
			});
			folders.forEach(folder => {
				candidates.push(`textures/${folder}/${info.path}.png`);
				candidates.push(`${folder}/${info.path}.png`);
			});
			candidates.push(`${info.path}.png`);
			return Array.from(new Set(candidates.map(path => path.replace(/\\/g, '/'))));
		}

		function folderAssetCandidates(asset_path) {
			let normalized = String(asset_path || '').replace(/\\/g, '/').replace(/^\/+/, '');
			let candidates = [normalized];
			if (normalized.startsWith('assets/')) {
				candidates.push(normalized.substring('assets/'.length));
			}
			if (normalized.startsWith('assets/minecraft/')) {
				candidates.push(normalized.substring('assets/minecraft/'.length));
			}
			return Array.from(new Set(candidates.filter(Boolean)));
		}

		function findTextureFileInFolder(context, info, options) {
			if (!context || context.type !== 'folder') return '';
			let root = context.path;
			let fs = context.fs;
			let path_module = context.path_module;
			let candidates = getTextureCandidates(info, options);
			for (let candidate of candidates) {
				for (let folder_candidate of folderAssetCandidates(candidate)) {
					let full_path = joinPath(path_module, root, folder_candidate.replace(/\//g, path_module.sep));
					if (isFile(fs, full_path)) return full_path;
				}
			}
			return '';
		}

		function findTextureDataInZip(context, info, options) {
			if (!context || context.type !== 'zip') return null;
			let candidates = getTextureCandidates(info, options);
			for (let candidate of candidates) {
				let bytes = extractZipEntry(context.zip, candidate);
				if (bytes) return bytes;
			}
			return null;
		}

		function readUint32BEUnsigned(bytes, offset) {
			return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
		}

		function concatUint8Arrays(arrays) {
			let length = arrays.reduce((total, array) => total + array.length, 0);
			let result = new Uint8Array(length);
			let offset = 0;
			arrays.forEach(array => {
				result.set(toUint8Array(array), offset);
				offset += array.length;
			});
			return result;
		}

		function paethPredictor(left, up, up_left) {
			let p = left + up - up_left;
			let pa = Math.abs(p - left);
			let pb = Math.abs(p - up);
			let pc = Math.abs(p - up_left);
			if (pa <= pb && pa <= pc) return left;
			if (pb <= pc) return up;
			return up_left;
		}

		function decodePngToRgba(bytes) {
			bytes = toUint8Array(bytes);
			let signature = [137, 80, 78, 71, 13, 10, 26, 10];
			if (!signature.every((value, index) => bytes[index] === value)) return null;

			let width = 0;
			let height = 0;
			let bit_depth = 0;
			let color_type = 0;
			let palette = null;
			let transparency = null;
			let idat_chunks = [];
			let offset = 8;
			while (offset + 12 <= bytes.length) {
				let length = readUint32BEUnsigned(bytes, offset);
				let type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
				let data_start = offset + 8;
				let data = bytes.slice(data_start, data_start + length);
				if (type === 'IHDR') {
					width = readUint32BEUnsigned(data, 0);
					height = readUint32BEUnsigned(data, 4);
					bit_depth = data[8];
					color_type = data[9];
					if (data[12]) return null;
				} else if (type === 'PLTE') {
					palette = data;
				} else if (type === 'tRNS') {
					transparency = data;
				} else if (type === 'IDAT') {
					idat_chunks.push(data);
				} else if (type === 'IEND') {
					break;
				}
				offset = data_start + length + 4;
			}
			if (!width || !height || bit_depth !== 8 || !idat_chunks.length) return null;

			let zlib = getNativeModule('zlib');
			if (!zlib) return null;
			let inflated = toUint8Array(zlib.inflateSync(toNodeBuffer(concatUint8Arrays(idat_chunks))));
			let bpp = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color_type];
			if (!bpp) return null;
			let stride = width * bpp;
			let rgba = new Uint8Array(width * height * 4);
			let previous = new Uint8Array(stride);
			let source = 0;
			for (let y = 0; y < height; y++) {
				let filter = inflated[source++];
				let row = new Uint8Array(stride);
				for (let i = 0; i < stride; i++) {
					let raw = inflated[source++];
					let left = i >= bpp ? row[i - bpp] : 0;
					let up = previous[i] || 0;
					let up_left = i >= bpp ? previous[i - bpp] || 0 : 0;
					let value = raw;
					if (filter === 1) value += left;
					else if (filter === 2) value += up;
					else if (filter === 3) value += Math.floor((left + up) / 2);
					else if (filter === 4) value += paethPredictor(left, up, up_left);
					else if (filter !== 0) return null;
					row[i] = value & 255;
				}
				for (let x = 0; x < width; x++) {
					let input = x * bpp;
					let output = (y * width + x) * 4;
					if (color_type === 6) {
						rgba[output] = row[input];
						rgba[output + 1] = row[input + 1];
						rgba[output + 2] = row[input + 2];
						rgba[output + 3] = row[input + 3];
					} else if (color_type === 2) {
						rgba[output] = row[input];
						rgba[output + 1] = row[input + 1];
						rgba[output + 2] = row[input + 2];
						rgba[output + 3] = 255;
					} else if (color_type === 3) {
						let index = row[input] * 3;
						rgba[output] = palette ? palette[index] || 0 : 0;
						rgba[output + 1] = palette ? palette[index + 1] || 0 : 0;
						rgba[output + 2] = palette ? palette[index + 2] || 0 : 0;
						rgba[output + 3] = transparency && transparency[row[input]] !== undefined ? transparency[row[input]] : 255;
					} else if (color_type === 4) {
						rgba[output] = row[input];
						rgba[output + 1] = row[input];
						rgba[output + 2] = row[input];
						rgba[output + 3] = row[input + 1];
					} else {
						rgba[output] = row[input];
						rgba[output + 1] = row[input];
						rgba[output + 2] = row[input];
						rgba[output + 3] = 255;
					}
				}
				previous = row;
			}
			return {width, height, rgba};
		}

		let png_crc_table = null;
		function pngCrc32(bytes) {
			if (!png_crc_table) {
				png_crc_table = [];
				for (let n = 0; n < 256; n++) {
					let c = n;
					for (let k = 0; k < 8; k++) {
						c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
					}
					png_crc_table[n] = c >>> 0;
				}
			}
			let crc = 0xffffffff;
			for (let i = 0; i < bytes.length; i++) {
				crc = png_crc_table[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
			}
			return (crc ^ 0xffffffff) >>> 0;
		}

		function writeUint32BETo(bytes, offset, value) {
			bytes[offset] = (value >>> 24) & 255;
			bytes[offset + 1] = (value >>> 16) & 255;
			bytes[offset + 2] = (value >>> 8) & 255;
			bytes[offset + 3] = value & 255;
		}

		function pngChunk(type, data) {
			data = data || new Uint8Array(0);
			let type_bytes = new Uint8Array(type.length);
			for (let i = 0; i < type.length; i++) type_bytes[i] = type.charCodeAt(i);
			let chunk = new Uint8Array(12 + data.length);
			writeUint32BETo(chunk, 0, data.length);
			chunk.set(type_bytes, 4);
			chunk.set(data, 8);
			let crc_data = concatUint8Arrays([type_bytes, data]);
			writeUint32BETo(chunk, 8 + data.length, pngCrc32(crc_data));
			return chunk;
		}

		function encodeRgbaPng(width, height, rgba) {
			let zlib = getNativeModule('zlib');
			if (!zlib) return null;
			let stride = width * 4;
			let scanlines = new Uint8Array((stride + 1) * height);
			for (let y = 0; y < height; y++) {
				let row_start = y * (stride + 1);
				scanlines[row_start] = 0;
				scanlines.set(rgba.slice(y * stride, y * stride + stride), row_start + 1);
			}
			let ihdr = new Uint8Array(13);
			writeUint32BETo(ihdr, 0, width);
			writeUint32BETo(ihdr, 4, height);
			ihdr[8] = 8;
			ihdr[9] = 6;
			let idat = toUint8Array(zlib.deflateSync(toNodeBuffer(scanlines)));
			return concatUint8Arrays([
				new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
				pngChunk('IHDR', ihdr),
				pngChunk('IDAT', idat),
				pngChunk('IEND')
			]);
		}

		function tintPngBytes(bytes, tint_rgb) {
			let decoded = decodePngToRgba(bytes);
			if (!decoded) return null;
			let rgba = decoded.rgba.slice();
			for (let i = 0; i < rgba.length; i += 4) {
				if (!rgba[i + 3]) continue;
				let intensity = Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) / 255;
				rgba[i] = Math.round(tint_rgb[0] * intensity);
				rgba[i + 1] = Math.round(tint_rgb[1] * intensity);
				rgba[i + 2] = Math.round(tint_rgb[2] * intensity);
			}
			return encodeRgbaPng(decoded.width, decoded.height, rgba);
		}

		function markPreviewOnlyTexture(texture) {
			// Jar/zip and generated tint previews are only used inside Blockbench.
			// The exported Java JSON still points to the original Minecraft/resource-pack path.
			texture.saved = true;
			texture.internal = false;
			texture.path = '';
		}

		function loadTintedTextureImage(texture, info, options) {
			if (!info.tint_rgb) return false;
			let context = getTextureSourceContext(options);
			let bytes = null;
			let file_path = findTextureFileInFolder(context, info, options);
			try {
				if (file_path && context?.fs) bytes = context.fs.readFileSync(file_path);
				if (!bytes) bytes = findTextureDataInZip(context, info, options);
				if (!bytes) return false;
				let tinted = tintPngBytes(bytes, info.tint_rgb);
				if (!tinted) return false;
				texture.fromDataURL(toDataUrl(tinted, 'image/png'));
				markPreviewOnlyTexture(texture);
				return true;
			} catch (error) {
				console.warn('Failed to tint Minecraft texture', info.full_path || info.path, error);
				return false;
			}
		}

		function loadTextureImage(texture, info, options) {
			if (loadTintedTextureImage(texture, info, options)) {
				return true;
			}
			let context = getTextureSourceContext(options);
			let file_path = findTextureFileInFolder(context, info, options);
			if (file_path) {
				texture.fromPath(file_path);
				return true;
			}

			let zip_data = findTextureDataInZip(context, info, options);
			if (zip_data) {
				texture.fromDataURL(toDataUrl(zip_data, 'image/png'));
				markPreviewOnlyTexture(texture);
				return true;
			}

			if (typeof texture.fromDefaultPack === 'function' && texture.fromDefaultPack()) {
				return true;
			}

			texture.loadEmpty(3);
			return false;
		}

		function createTextureForInfo(info, options, texture_map, new_textures) {
			let tint_key = info.tint_id || (info.tint_rgb ? info.tint_rgb.join('_') : '');
			let texture_key = `${info.namespace || 'minecraft'}:${info.full_path || info.path}${tint_key ? `|${tint_key}` : ''}`;
			if (texture_map[texture_key]) return texture_map[texture_key];

			let texture_base = info.path || info.full_path || 'texture';
			let texture_id = uniqueTextureId(tint_key ? `${texture_base}_${tint_key}` : texture_base);
			let texture_name = pathBasename(tint_key ? `${texture_base}_${tint_key}` : texture_base) + '.png';
			let texture = new Texture({id: texture_id, name: texture_name});
			texture.id = texture_id;
			texture.name = texture_name;
			texture.folder = options.texture_folder;
			texture.namespace = options.texture_namespace;
			loadTextureImage(texture, info, options);
			if (info.uv_width && info.uv_height) {
				texture.uv_width = info.uv_width;
				texture.uv_height = info.uv_height;
			}
			texture.id = texture_id;
			texture.name = texture_name;
			texture.folder = options.texture_folder;
			texture.namespace = options.texture_namespace;
			texture[IMPORTED_PROPERTY] = true;
			texture[TEXTURE_FULL_PATH_PROPERTY] = cleanTextureFullPath(info.full_path || `${options.texture_folder || 'block'}/${info.path || texture_id}`);
			if (texture.flags) texture.flags.add(PLUGIN_ID);
			texture.add(false, true);
			texture_map[texture_key] = texture;
			new_textures.push(texture);
			return texture;
		}

		function cleanTextureFullPath(path) {
			return String(path || '')
				.replace(/\\/g, '/')
				.replace(/^\/+/, '')
				.replace(/^assets\/[^/]+\/textures\//, '')
				.replace(/^textures\//, '')
				.replace(/\.png$/i, '');
		}

		function normalizeResourceLocation(value, default_prefix) {
			value = String(value || '').replace(/^#/, '').replace(/\.json$/i, '');
			let namespace = 'minecraft';
			let path = value;
			if (value.includes(':')) {
				let parts = value.split(':');
				namespace = parts.shift() || 'minecraft';
				path = parts.join(':');
			}
			if (default_prefix && path && !path.includes('/')) {
				path = `${default_prefix}/${path}`;
			}
			return {namespace, path};
		}

		function assetCacheKey(context, asset_path) {
			return `${context?.path || 'none'}|${asset_path}`;
		}

		function readAssetText(context, asset_path) {
			if (!context || context.type === 'none') return null;
			asset_path = asset_path.replace(/\\/g, '/');
			let key = assetCacheKey(context, asset_path);
			if (Object.prototype.hasOwnProperty.call(asset_cache, key)) return asset_cache[key];

			let text = null;
			try {
				if (context.type === 'zip') {
					let bytes = extractZipEntry(context.zip, asset_path) || extractZipEntry(context.zip, asset_path.toLowerCase());
					if (bytes) text = decodeUtf8(bytes);
				} else if (context.type === 'folder') {
					for (let folder_candidate of folderAssetCandidates(asset_path)) {
						let full_path = joinPath(context.path_module, context.path, folder_candidate.replace(/\//g, context.path_module.sep));
						if (isFile(context.fs, full_path)) {
							text = context.fs.readFileSync(full_path, 'utf8');
							break;
						}
					}
				}
			} catch (error) {
				console.warn(error);
			}
			asset_cache[key] = text;
			return text;
		}

		function readJsonAsset(context, asset_path) {
			let text = readAssetText(context, asset_path);
			if (!text) return null;
			try {
				return JSON.parse(text);
			} catch (error) {
				console.warn(`Invalid JSON asset ${asset_path}`, error);
				return null;
			}
		}

		function parseBlockState(state) {
			let raw = String(state || 'minecraft:air');
			let property_text = '';
			let bracket = raw.indexOf('[');
			if (bracket >= 0) {
				property_text = raw.substring(bracket + 1, raw.lastIndexOf(']') >= 0 ? raw.lastIndexOf(']') : raw.length);
				raw = raw.substring(0, bracket);
			}
			raw = normalizeBlockName(raw);
			let parts = raw.split(':');
			let properties = {};
			property_text.split(',').forEach(part => {
				if (!part) return;
				let eq = part.indexOf('=');
				if (eq < 0) return;
				properties[part.substring(0, eq)] = part.substring(eq + 1);
			});
			return {
				id: raw,
				namespace: parts[0] || 'minecraft',
				name: parts[1] || parts[0],
				properties
			};
		}

		function variantKeyMatches(key, properties) {
			if (!key) return true;
			return String(key).split(',').every(part => {
				let eq = part.indexOf('=');
				if (eq < 0) return true;
				let name = part.substring(0, eq);
				let allowed = part.substring(eq + 1).split('|');
				return allowed.includes(String(properties[name]));
			});
		}

		function multipartWhenMatches(when, properties) {
			if (!when) return true;
			if (Array.isArray(when)) return when.some(child => multipartWhenMatches(child, properties));
			if (when.OR && Array.isArray(when.OR)) return when.OR.some(child => multipartWhenMatches(child, properties));
			if (when.AND && Array.isArray(when.AND)) return when.AND.every(child => multipartWhenMatches(child, properties));
			return Object.keys(when).every(key => {
				let allowed = String(when[key]).split('|');
				return allowed.includes(String(properties[key]));
			});
		}

		function firstModelApply(apply) {
			if (Array.isArray(apply)) return apply[0] || null;
			return apply || null;
		}

		function normalizeRotationAngle(angle) {
			if (angle === undefined || angle === null || angle === '') return undefined;
			let normalized = -toNumber(angle);
			normalized %= 360;
			if (normalized < 0) normalized += 360;
			return normalized || undefined;
		}

		function blockbenchModelRef(apply) {
			if (!apply || !apply.model) return null;
			let ref = Object.assign({}, apply);
			let x = normalizeRotationAngle(ref.x);
			let y = normalizeRotationAngle(ref.y);
			delete ref.x;
			delete ref.y;
			if (x !== undefined) ref.x = x;
			if (y !== undefined) ref.y = y;
			return ref;
		}

		function readBlockstateForParsed(parsed, options) {
			let context = getTextureSourceContext(options);
			let blockstate_path = `assets/${parsed.namespace}/blockstates/${parsed.name}.json`;
			let blockstate = readJsonAsset(context, blockstate_path);
			if (!blockstate && parsed.namespace !== 'minecraft') {
				blockstate = readJsonAsset(context, `assets/minecraft/blockstates/${parsed.name}.json`);
			}
			return blockstate;
		}

		function selectBlockModelRefs(state, options) {
			if (!options.use_block_models) return [];
			let parsed = parseBlockState(state);
			let blockstate = readBlockstateForParsed(parsed, options);
			if (!blockstate) return [];

			let refs = [];
			if (blockstate.variants && typeof blockstate.variants === 'object') {
				let exact_key = Object.keys(parsed.properties).sort().map(key => `${key}=${parsed.properties[key]}`).join(',');
				let variant = blockstate.variants[exact_key];
				if (!variant) {
					let matching_key = Object.keys(blockstate.variants).find(key => variantKeyMatches(key, parsed.properties));
					variant = matching_key !== undefined ? blockstate.variants[matching_key] : null;
				}
				let apply = firstModelApply(variant);
				let ref = blockbenchModelRef(apply);
				if (ref) refs.push(ref);
			}
			if (Array.isArray(blockstate.multipart)) {
				blockstate.multipart.forEach(part => {
					if (!multipartWhenMatches(part.when, parsed.properties)) return;
					let apply = firstModelApply(part.apply);
					let ref = blockbenchModelRef(apply);
					if (ref) refs.push(ref);
				});
			}
			return refs;
		}

		function blockIdFromState(state) {
			return parseBlockState(state).id;
		}

		function fallbackReasonForBlock(block, options, model_source_ok) {
			if (!options.use_block_models) return {reason: 'model_disabled'};
			if (!model_source_ok) return {reason: 'model_source_missing'};

			let parsed = parseBlockState(block.state);
			let blockstate = readBlockstateForParsed(parsed, options);
			if (!blockstate) return {reason: 'blockstate_missing'};

			let refs = selectBlockModelRefs(block.state, options);
			if (!refs.length) return {reason: 'no_matching_model'};

			for (let ref of refs) {
				let model = loadResolvedModel(ref.model, options);
				if (!model || !Array.isArray(model.elements) || !model.elements.length) {
					return {reason: 'model_missing_or_empty', detail: ref.model || ''};
				}
			}
			return {reason: 'model_hidden'};
		}

		function recordFallbackDetail(detail_map, block, options, model_source_ok) {
			let info = fallbackReasonForBlock(block, options, model_source_ok);
			let id = blockIdFromState(block.state);
			let key = `${id}|${info.reason}|${info.detail || ''}`;
			if (!detail_map[key]) {
				detail_map[key] = {
					id,
					reason: info.reason,
					detail: info.detail || '',
					count: 0
				};
			}
			detail_map[key].count++;
		}

		function fallbackDetailsFromMap(detail_map) {
			return Object.keys(detail_map).map(key => detail_map[key]).sort((a, b) => {
				if (b.count !== a.count) return b.count - a.count;
				return a.id.localeCompare(b.id);
			});
		}

		function mergeModel(parent, child) {
			let merged = Object.assign({}, parent || {}, child || {});
			let child_textures = child?.textures || {};
			let parent_textures = parent?.textures || {};
			merged.textures = Object.assign({}, parent_textures, child_textures);
			merged.__texture_scopes = [];
			if (Object.keys(child_textures).length) {
				merged.__texture_scopes.push({
					textures: child_textures,
					namespace: child?.__namespace || 'minecraft'
				});
			}
			if (parent?.__texture_scopes?.length) {
				parent.__texture_scopes.forEach(scope => merged.__texture_scopes.push(scope));
			} else if (Object.keys(parent_textures).length) {
				merged.__texture_scopes.push({
					textures: parent_textures,
					namespace: parent?.__namespace || 'minecraft'
				});
			}
			if (!child || !child.elements) merged.elements = parent?.elements ? JSON.parse(JSON.stringify(parent.elements)) : [];
			else merged.elements = JSON.parse(JSON.stringify(child.elements));
			return merged;
		}

		function loadResolvedModel(model_id, options, stack) {
			let loc = normalizeResourceLocation(model_id, 'block');
			let key = `${loc.namespace}:${loc.path}`;
			if (model_cache[key]) return model_cache[key];
			if (stack && stack.includes(key)) return null;
			stack = (stack || []).concat(key);

			let context = getTextureSourceContext(options);
			let model = readJsonAsset(context, `assets/${loc.namespace}/models/${loc.path}.json`);
			if (!model && loc.namespace !== 'minecraft') {
				model = readJsonAsset(context, `assets/minecraft/models/${loc.path}.json`);
			}
			if (!model) return null;
			model.__id = key;
			model.__namespace = loc.namespace;

			let resolved = model;
			if (model.parent) {
				let parent = loadResolvedModel(model.parent, options, stack);
				resolved = mergeModel(parent, model);
			} else {
				resolved = mergeModel(null, model);
			}
			resolved.__id = key;
			resolved.__namespace = loc.namespace;
			model_cache[key] = resolved;
			return resolved;
		}

		function resolveTextureReference(model, reference) {
			if (!reference) return {link: '', namespace: model?.__namespace || 'minecraft'};
			let value = String(reference);
			let scopes = model?.__texture_scopes?.length
				? model.__texture_scopes
				: [{textures: model?.textures || {}, namespace: model?.__namespace || 'minecraft'}];
			let namespace = model?.__namespace || 'minecraft';
			let guard = 0;
			while (value.startsWith('#') && guard++ < 16) {
				let key = value.substring(1);
				let found = false;
				for (let scope of scopes) {
					let textures = scope?.textures || scope;
					if (textures && textures[key] !== undefined) {
						value = String(textures[key]);
						namespace = scope?.namespace || namespace;
						found = true;
						break;
					}
				}
				if (!found) break;
			}
			return {
				link: value.startsWith('#') ? '' : value,
				namespace
			};
		}

		function rotatePointAroundAxis(point, axis, degrees, center) {
			if (!degrees) return point.slice();
			let radians = degrees * Math.PI / 180;
			let sin = Math.sin(radians);
			let cos = Math.cos(radians);
			let x = point[0] - center[0];
			let y = point[1] - center[1];
			let z = point[2] - center[2];
			let nx = x;
			let ny = y;
			let nz = z;
			if (axis === 'x') {
				ny = y * cos - z * sin;
				nz = y * sin + z * cos;
			} else if (axis === 'y') {
				nx = x * cos + z * sin;
				nz = -x * sin + z * cos;
			} else if (axis === 'z') {
				nx = x * cos - y * sin;
				ny = x * sin + y * cos;
			}
			return [nx + center[0], ny + center[1], nz + center[2]];
		}

		function rotateBlockPoint(point, variant) {
			let rotated = point.slice();
			let center = [0.5, 0.5, 0.5];
			rotated = rotatePointAroundAxis(rotated, 'x', toNumber(variant.x), center);
			rotated = rotatePointAroundAxis(rotated, 'y', toNumber(variant.y), center);
			return rotated;
		}

		function directionVector(direction) {
			return {
				north: [0, 0, -1],
				south: [0, 0, 1],
				west: [-1, 0, 0],
				east: [1, 0, 0],
				up: [0, 1, 0],
				down: [0, -1, 0],
				x: [1, 0, 0],
				y: [0, 1, 0],
				z: [0, 0, 1]
			}[direction] || [0, 0, 0];
		}

		function vectorDirection(vector) {
			let directions = [
				['east', [1, 0, 0]],
				['west', [-1, 0, 0]],
				['up', [0, 1, 0]],
				['down', [0, -1, 0]],
				['south', [0, 0, 1]],
				['north', [0, 0, -1]]
			];
			let best = directions[0];
			let best_dot = -Infinity;
			directions.forEach(entry => {
				let dot = vector[0] * entry[1][0] + vector[1] * entry[1][1] + vector[2] * entry[1][2];
				if (dot > best_dot) {
					best_dot = dot;
					best = entry;
				}
			});
			return best[0];
		}

		function axisFromVector(vector) {
			let abs = vector.map(Math.abs);
			let axis_index = abs[0] >= abs[1] && abs[0] >= abs[2] ? 0 : (abs[1] >= abs[2] ? 1 : 2);
			let axis = ['x', 'y', 'z'][axis_index];
			let sign = vector[axis_index] < 0 ? -1 : 1;
			return {axis, sign};
		}

		function rotateVectorForVariant(vector, variant) {
			let rotated = rotatePointAroundAxis(vector.slice(), 'x', toNumber(variant.x), [0, 0, 0]);
			rotated = rotatePointAroundAxis(rotated, 'y', toNumber(variant.y), [0, 0, 0]);
			return rotated;
		}

		function rotateDirection(direction, variant) {
			return vectorDirection(rotateVectorForVariant(directionVector(direction), variant));
		}

		function normalizeFaceRotation(rotation) {
			rotation = Math.round(toNumber(rotation) / 90) * 90;
			rotation %= 360;
			if (rotation < 0) rotation += 360;
			return rotation || 0;
		}

		function faceUvBaseAxes(direction) {
			return {
				east: [[0, 0, -1], [0, -1, 0]],
				west: [[0, 0, 1], [0, -1, 0]],
				up: [[1, 0, 0], [0, 0, 1]],
				down: [[1, 0, 0], [0, 0, -1]],
				south: [[1, 0, 0], [0, -1, 0]],
				north: [[-1, 0, 0], [0, -1, 0]]
			}[direction] || [[1, 0, 0], [0, -1, 0]];
		}

		function faceUvAxes(direction, rotation) {
			let axes = faceUvBaseAxes(direction).map(axis => axis.slice());
			rotation = normalizeFaceRotation(rotation);
			while (rotation > 0) {
				axes = [axes[1], axes[0].map(value => -value)];
				rotation -= 90;
			}
			return axes;
		}

		function vectorsMatch(a, b) {
			return Math.abs(a[0] - b[0]) < 0.0001 &&
				Math.abs(a[1] - b[1]) < 0.0001 &&
				Math.abs(a[2] - b[2]) < 0.0001;
		}

		function matchedFaceUvRotation(output_direction, u_axis, v_axis) {
			for (let rotation of [0, 90, 180, 270]) {
				let axes = faceUvAxes(output_direction, rotation);
				if (vectorsMatch(u_axis, axes[0]) && vectorsMatch(v_axis, axes[1])) return rotation;
			}
			return null;
		}

		function rotatedFaceUvRotation(input_direction, output_direction, read_face, variant) {
			let rotation = toNumber(read_face?.rotation, 0);
			if (toNumber(variant?.x, 0) || toNumber(variant?.y, 0)) {
				let axes = faceUvAxes(input_direction, rotation).map(axis => rotateVectorForVariant(axis, variant));
				let matched_rotation = matchedFaceUvRotation(output_direction, axes[0], axes[1]);
				if (matched_rotation !== null) return matched_rotation;
			}
			if ((input_direction === 'up' || input_direction === 'down') &&
				(output_direction === 'up' || output_direction === 'down')) {
				let y = toNumber(variant?.y, 0);
				if (y) rotation += output_direction === 'down' ? -y : y;
			}
			return normalizeFaceRotation(rotation);
		}

		function defaultJavaFaceUv(element, direction) {
			let from = (element.from || [0, 0, 0]).map(value => toNumber(value));
			let to = (element.to || [16, 16, 16]).map(value => toNumber(value));
			let uv_width = 16;
			let uv_height = 16;
			let uv = [0, 0, 16, 16];
			switch (direction) {
				case 'north':
					uv = [uv_width - to[0], uv_height - to[1], uv_width - from[0], uv_height - from[1]];
					break;
				case 'south':
					uv = [from[0], uv_height - to[1], to[0], uv_height - from[1]];
					break;
				case 'west':
					uv = [from[2], uv_height - to[1], to[2], uv_height - from[1]];
					break;
				case 'east':
					uv = [uv_width - to[2], uv_height - to[1], uv_width - from[2], uv_height - from[1]];
					break;
				case 'up':
					uv = [from[0], from[2], to[0], to[2]];
					break;
				case 'down':
					uv = [from[0], uv_height - to[2], to[0], uv_height - from[2]];
					break;
			}
			return uv.map(roundUv);
		}

		function getElementBounds(element, variant, block, offset) {
			let from = (element.from || [0, 0, 0]).map(value => toNumber(value) / 16);
			let to = (element.to || [16, 16, 16]).map(value => toNumber(value) / 16);
			let corners = [];
			[from[0], to[0]].forEach(x => {
				[from[1], to[1]].forEach(y => {
					[from[2], to[2]].forEach(z => {
						corners.push(rotateBlockPoint([x, y, z], variant));
					});
				});
			});
			let min = [Infinity, Infinity, Infinity];
			let max = [-Infinity, -Infinity, -Infinity];
			corners.forEach(point => {
				for (let axis = 0; axis < 3; axis++) {
					min[axis] = Math.min(min[axis], point[axis]);
					max[axis] = Math.max(max[axis], point[axis]);
				}
			});
			return {
				from: [block.x + min[0] - offset[0], block.y + min[1] - offset[1], block.z + min[2] - offset[2]],
				to: [block.x + max[0] - offset[0], block.y + max[1] - offset[1], block.z + max[2] - offset[2]]
			};
		}

		function getElementRotation(element, variant, block, offset) {
			if (!element.rotation || !element.rotation.axis || !element.rotation.angle) return null;
			let origin = (element.rotation.origin || [8, 8, 8]).map(value => toNumber(value) / 16);
			origin = rotateBlockPoint(origin, variant);
			let rotated_axis = axisFromVector(rotateVectorForVariant(directionVector(element.rotation.axis), variant));
			let rotation = [0, 0, 0];
			let axis_index = {x: 0, y: 1, z: 2}[rotated_axis.axis];
			rotation[axis_index] = toNumber(element.rotation.angle) * rotated_axis.sign;
			return {
				origin: [block.x + origin[0] - offset[0], block.y + origin[1] - offset[1], block.z + origin[2] - offset[2]],
				rotation,
				axis: rotated_axis.axis,
				rescale: !!element.rotation.rescale
			};
		}

		function createModelElementFaces(element, model, variant, block, options, occupied, texture_map, new_textures) {
			let faces = {};
			FACE_DIRECTIONS.forEach(direction => {
				faces[direction] = {texture: null};
			});
			let has_face = false;

			Object.keys(element.faces || {}).forEach(direction => {
				let read_face = element.faces[direction];
				let output_direction = rotateDirection(direction, variant);
				let cullface = read_face.cullface ? rotateDirection(read_face.cullface, variant) : '';
				let resolved_texture = resolveTextureReference(model, read_face.texture);
				let texture_info = resolved_texture.link
					? textureInfoFromLink(resolved_texture.link, block.state, resolved_texture.namespace)
					: textureInfoFromState(block.state);
				let tint_info = typeof read_face.tintindex === 'number' ? tintInfoForBlockFace(block.state, read_face.tintindex) : null;
				if (tint_info) {
					texture_info = Object.assign({}, texture_info, {
						tint_rgb: tint_info.rgb,
						tint_id: tint_info.id
					});
				}
				let texture = createTextureForInfo(texture_info, options, texture_map, new_textures);
				let face_rotation = rotatedFaceUvRotation(direction, output_direction, read_face, variant);
				let face_uv = Array.isArray(read_face.uv) ? read_face.uv.slice() : defaultJavaFaceUv(element, direction);
				faces[output_direction] = {
					uv: face_uv,
					texture: texture ? texture.uuid : false,
					rotation: face_rotation
				};
				if (typeof read_face.tintindex === 'number') faces[output_direction].tint = read_face.tintindex;
				if (options.cull_faces && cullface) faces[output_direction].cullface = cullface;
				has_face = true;
			});
			return has_face ? faces : null;
		}

		function decodeVarInts(bytes, expected_count) {
			let values = [];
			let value = 0;
			let shift = 0;
			for (let i = 0; i < bytes.length && values.length < expected_count; i++) {
				let byte = bytes[i];
				value |= (byte & 0x7f) << shift;
				if ((byte & 0x80) === 0) {
					values.push(value >>> 0);
					value = 0;
					shift = 0;
				} else {
					shift += 7;
					if (shift > 35) throw new Error('Invalid Sponge schematic VarInt data');
				}
			}
			return values;
		}

		function longAsUnsigned(value) {
			return BigInt.asUintN(64, BigInt(value || 0));
		}

		function decodePackedPadded(longs, count, bits) {
			let values = [];
			let values_per_long = Math.max(Math.floor(64 / bits), 1);
			let mask = (1n << BigInt(bits)) - 1n;
			for (let i = 0; i < count; i++) {
				let long_index = Math.floor(i / values_per_long);
				let start = BigInt((i % values_per_long) * bits);
				let word = longAsUnsigned(longs[long_index]);
				values.push(Number((word >> start) & mask));
			}
			return values;
		}

		function decodePackedCompact(longs, count, bits) {
			let values = [];
			let mask = (1n << BigInt(bits)) - 1n;
			for (let i = 0; i < count; i++) {
				let bit_index = i * bits;
				let long_index = Math.floor(bit_index / 64);
				let start = bit_index % 64;
				let word = longAsUnsigned(longs[long_index]) >> BigInt(start);
				if (start + bits > 64 && long_index + 1 < longs.length) {
					word |= longAsUnsigned(longs[long_index + 1]) << BigInt(64 - start);
				}
				values.push(Number(word & mask));
			}
			return values;
		}

		function decodePackedStates(longs, count, palette_size, minimum_bits) {
			if (!longs || !longs.length) return new Array(count).fill(0);
			let bits = Math.max(minimum_bits || 1, Math.ceil(Math.log2(Math.max(palette_size, 1))));
			let padded = decodePackedPadded(longs, count, bits);
			let compact = decodePackedCompact(longs, count, bits);
			let padded_invalid = padded.reduce((total, value) => total + (value >= palette_size ? 1 : 0), 0);
			let compact_invalid = compact.reduce((total, value) => total + (value >= palette_size ? 1 : 0), 0);
			return padded_invalid <= compact_invalid ? padded : compact;
		}

		function makeStructure(name, format, blocks, extra) {
			return Object.assign({
				name,
				format,
				blocks,
				source_blocks: blocks.length
			}, extra || {});
		}

		function parseClassicSchematic(nbt, source_name) {
			let width = toNumber(nbt.Width);
			let height = toNumber(nbt.Height);
			let length = toNumber(nbt.Length);
			let block_ids = nbt.Blocks;
			let data = nbt.Data;
			if (!width || !height || !length || !block_ids) throw new Error('Invalid classic .schematic data');

			let blocks = [];
			for (let y = 0; y < height; y++) {
				for (let z = 0; z < length; z++) {
					for (let x = 0; x < width; x++) {
						let index = (y * length + z) * width + x;
						let state = legacyBlockName(block_ids[index], getNibble(data, index));
						if (!isAirState(state)) blocks.push({x, y, z, state});
					}
				}
			}
			return makeStructure(source_name, 'Classic Schematic', blocks, {size: [width, height, length]});
		}

		function parseSpongeSchematic(nbt, source_name) {
			let width = toNumber(nbt.Width || nbt.width);
			let height = toNumber(nbt.Height || nbt.height);
			let length = toNumber(nbt.Length || nbt.length);
			let blocks_tag = nbt.Blocks || nbt.blocks || {};
			let palette = nbt.Palette || nbt.palette || blocks_tag.Palette || blocks_tag.palette;
			let block_data = nbt.BlockData || nbt.blockData || blocks_tag.Data || blocks_tag.data;
			if (!width || !height || !length || !palette || !block_data) throw new Error('Invalid Sponge .schem data');

			let reverse_palette = [];
			Object.keys(palette).forEach(name => {
				reverse_palette[toNumber(palette[name])] = normalizeBlockName(name);
			});

			let volume = width * height * length;
			let indices = decodeVarInts(block_data, volume);
			let blocks = [];
			for (let i = 0; i < Math.min(indices.length, volume); i++) {
				let state = reverse_palette[indices[i]] || 'minecraft:air';
				if (isAirState(state)) continue;
				let x = i % width;
				let z = Math.floor(i / width) % length;
				let y = Math.floor(i / (width * length));
				blocks.push({x, y, z, state});
			}
			return makeStructure(source_name, 'Sponge Schematic', blocks, {size: [width, height, length]});
		}

		function parseStructureNbt(nbt, source_name) {
			let size = vectorFrom(nbt.size || nbt.Size, [0, 0, 0]);
			let palette = nbt.palette || nbt.Palette;
			if (!palette && Array.isArray(nbt.palettes) && nbt.palettes.length) palette = nbt.palettes[0];
			let blocks_tag = nbt.blocks || nbt.Blocks;
			if (!Array.isArray(palette) || !Array.isArray(blocks_tag)) throw new Error('Invalid Minecraft structure .nbt data');

			let palette_states = palette.map(blockStateFromPaletteEntry);
			let blocks = [];
			blocks_tag.forEach(entry => {
				if (!entry) return;
				let pos = vectorFrom(entry.pos || entry.Pos);
				let state = palette_states[toNumber(entry.state || entry.State)] || 'minecraft:air';
				if (!isAirState(state)) blocks.push({x: pos[0], y: pos[1], z: pos[2], state});
			});
			return makeStructure(source_name, 'Structure NBT', blocks, {size});
		}

		function parseLitematic(nbt, source_name) {
			let regions = nbt.Regions || nbt.regions;
			if (!regions || typeof regions !== 'object') throw new Error('Invalid Litematica file: missing Regions');

			let blocks = [];
			Object.keys(regions).forEach(region_name => {
				let region = regions[region_name];
				if (!region) return;
				let size = vectorFrom(region.Size || region.size, [0, 0, 0]);
				let position = vectorFrom(region.Position || region.position, [0, 0, 0]);
				let width = Math.abs(size[0]);
				let height = Math.abs(size[1]);
				let length = Math.abs(size[2]);
				let palette = region.BlockStatePalette || region.blockStatePalette || [];
				let states = region.BlockStates || region.blockStates || [];
				if (!width || !height || !length || !Array.isArray(palette)) return;

				let palette_states = palette.map(blockStateFromPaletteEntry);
				let count = width * height * length;
				let indices = decodePackedStates(states, count, palette_states.length, 2);
				for (let i = 0; i < count; i++) {
					let state = palette_states[indices[i]] || 'minecraft:air';
					if (isAirState(state)) continue;
					let local_x = i % width;
					let local_z = Math.floor(i / width) % length;
					let local_y = Math.floor(i / (width * length));
					let x = position[0] + (size[0] < 0 ? -local_x : local_x);
					let y = position[1] + (size[1] < 0 ? -local_y : local_y);
					let z = position[2] + (size[2] < 0 ? -local_z : local_z);
					blocks.push({x, y, z, state, region: region_name});
				}
			});

			return makeStructure(source_name, 'Litematica', blocks);
		}

		function parseNbtStructure(root, source_name, extension) {
			let nbt = root.value || {};
			if (extension === 'litematic' || nbt.Regions || nbt.regions) return parseLitematic(nbt, source_name);
			if ((nbt.size || nbt.Size) && (nbt.palette || nbt.Palette || nbt.palettes) && (nbt.blocks || nbt.Blocks)) {
				return parseStructureNbt(nbt, source_name);
			}
			if ((nbt.Palette || nbt.palette || (nbt.Blocks && (nbt.Blocks.Palette || nbt.Blocks.palette))) &&
				(nbt.BlockData || nbt.blockData || (nbt.Blocks && (nbt.Blocks.Data || nbt.Blocks.data)))) {
				return parseSpongeSchematic(nbt, source_name);
			}
			if (nbt.Blocks && nbt.Width && nbt.Height && nbt.Length) return parseClassicSchematic(nbt, source_name);
			throw new Error(`Unsupported NBT structure format in ${source_name}`);
		}

		function decompressRegionChunk(compression_type, payload) {
			let zlib = getNativeModule('zlib');
			if (compression_type === 3) return payload;
			if (!zlib) throw new Error('zlib is not available for compressed region chunks');
			if (compression_type === 1) return zlib.gunzipSync(toNodeBuffer(payload));
			if (compression_type === 2) return zlib.inflateSync(toNodeBuffer(payload));
			throw new Error(`Unsupported region chunk compression type ${compression_type}`);
		}

		function extractLegacySectionBlocks(section, chunk_x, chunk_z, blocks, limit) {
			let section_y = toNumber(section.Y || section.y);
			let block_ids = section.Blocks;
			let data = section.Data;
			if (!block_ids) return;
			for (let i = 0; i < 4096 && blocks.length < limit; i++) {
				let state = legacyBlockName(block_ids[i], getNibble(data, i));
				if (isAirState(state)) continue;
				let x = chunk_x * 16 + (i & 15);
				let z = chunk_z * 16 + ((i >> 4) & 15);
				let y = section_y * 16 + (i >> 8);
				blocks.push({x, y, z, state});
			}
		}

		function extractPaletteSectionBlocks(section, chunk_x, chunk_z, blocks, limit) {
			let block_states = section.block_states || section.BlockStatesCompound || null;
			let palette = block_states ? block_states.palette : (section.Palette || section.palette);
			let packed = block_states ? block_states.data : (section.BlockStates || section.blockStates);
			if (!Array.isArray(palette)) return false;
			let section_y = toNumber(section.Y !== undefined ? section.Y : section.y);
			let palette_states = palette.map(blockStateFromPaletteEntry);
			let indices = decodePackedStates(packed || [], 4096, palette_states.length, 4);

			for (let i = 0; i < 4096 && blocks.length < limit; i++) {
				let state = palette_states[indices[i]] || 'minecraft:air';
				if (isAirState(state)) continue;
				let x = chunk_x * 16 + (i & 15);
				let z = chunk_z * 16 + ((i >> 4) & 15);
				let y = section_y * 16 + (i >> 8);
				blocks.push({x, y, z, state});
			}
			return true;
		}

		function extractChunkBlocks(root, chunk_x, chunk_z, blocks, limit) {
			let chunk = root.value || {};
			let level = chunk.Level || chunk;
			let sections = level.sections || level.Sections || [];
			if (!Array.isArray(sections)) return;
			for (let section of sections) {
				if (blocks.length >= limit) break;
				if (!extractPaletteSectionBlocks(section, chunk_x, chunk_z, blocks, limit)) {
					extractLegacySectionBlocks(section, chunk_x, chunk_z, blocks, limit);
				}
			}
		}

		function parseAnvilRegion(buffer, source_name, options) {
			let bytes = toUint8Array(buffer);
			if (bytes.length < 8192) throw new Error('Invalid .mca region file');
			let match = pathBasename(source_name).match(/^r\.(-?\d+)\.(-?\d+)\.mca$/i);
			let region_x = match ? parseInt(match[1], 10) : 0;
			let region_z = match ? parseInt(match[2], 10) : 0;
			let blocks = [];
			let parsed_chunks = 0;
			let failed_chunks = 0;
			let limit = options.cube_limit * 2;

			for (let index = 0; index < 1024 && blocks.length < limit; index++) {
				let offset = index * 4;
				let sector = (bytes[offset] << 16) | (bytes[offset + 1] << 8) | bytes[offset + 2];
				let sector_count = bytes[offset + 3];
				if (!sector || !sector_count) continue;

				let chunk_start = sector * 4096;
				if (chunk_start + 5 > bytes.length) continue;
				let length = readInt32BE(bytes, chunk_start);
				let compression_type = bytes[chunk_start + 4];
				if (length <= 1 || chunk_start + 4 + length > bytes.length) continue;

				try {
					let payload = bytes.slice(chunk_start + 5, chunk_start + 4 + length);
					let nbt_buffer = decompressRegionChunk(compression_type, payload);
					let root = parseNbt(nbt_buffer);
					let local_x = index & 31;
					let local_z = index >> 5;
					let chunk_x = region_x * 32 + local_x;
					let chunk_z = region_z * 32 + local_z;
					extractChunkBlocks(root, chunk_x, chunk_z, blocks, limit);
					parsed_chunks++;
				} catch (error) {
					console.warn(error);
					failed_chunks++;
				}
			}

			return makeStructure(source_name, 'Anvil Region MCA', blocks, {parsed_chunks, failed_chunks});
		}

		function keyForBlock(block) {
			return `${block.x},${block.y},${block.z}`;
		}

		function isLikelyFullCubeState(state) {
			let name = blockNameFromState(state).split(':').pop();
			return !/(slab|stairs|fence|wall|pane|torch|button|sign|carpet|rail|pressure_plate|trapdoor|door|ladder|lever|redstone|repeater|comparator|flower|sapling|grass|fern|crop|stem|vine|snow|candle|chain|lantern|bell|skull|head|bed|chest|banner|pot|rod|dripstone|lichen|coral|kelp|seagrass|bamboo|cocoa|cake|cauldron|anvil|hopper)/.test(name);
		}

		function calculateBounds(blocks) {
			let min = [Infinity, Infinity, Infinity];
			let max = [-Infinity, -Infinity, -Infinity];
			blocks.forEach(block => {
				min[0] = Math.min(min[0], block.x);
				min[1] = Math.min(min[1], block.y);
				min[2] = Math.min(min[2], block.z);
				max[0] = Math.max(max[0], block.x + 1);
				max[1] = Math.max(max[1], block.y + 1);
				max[2] = Math.max(max[2], block.z + 1);
			});
			if (!blocks.length) return {min: [0, 0, 0], max: [0, 0, 0]};
			return {min, max};
		}

		function getImportOffset(blocks, options) {
			let bounds = calculateBounds(blocks);
			if (options.center_model) {
				return [
					(bounds.min[0] + bounds.max[0]) / 2,
					(bounds.min[1] + bounds.max[1]) / 2,
					(bounds.min[2] + bounds.max[2]) / 2
				];
			}
			if (options.move_to_origin) return bounds.min;
			return [0, 0, 0];
		}

		function visibleFacesForBlock(block, occupied, options) {
			let faces = {};
			FACE_DIRECTIONS.forEach(direction => {
				faces[direction] = true;
			});
			return faces;
		}

		function hasAnyVisibleFace(faces) {
			return FACE_DIRECTIONS.some(direction => faces[direction]);
		}

		function blockGroupName(block) {
			return parseBlockState(block.state).name;
		}

		function createBlockGroup(block, root_group, new_groups) {
			let group = new Group(blockGroupName(block)).addTo(root_group).init();
			group.isOpen = false;
			group[IMPORTED_PROPERTY] = true;
			new_groups.push(group);
			return group;
		}

		function removeEmptyBlockGroup(group, new_groups) {
			if (!group || group.children.length) return;
			group.remove(false);
			let index = new_groups.indexOf(group);
			if (index >= 0) new_groups.splice(index, 1);
		}

		function createTextureForState(state, options, texture_map, new_textures) {
			return createTextureForInfo(textureInfoFromState(state), options, texture_map, new_textures);
		}

		function cubeFaces(state, visible_faces, texture, options) {
			let faces = {};
			FACE_DIRECTIONS.forEach(direction => {
				if (!visible_faces[direction]) {
					faces[direction] = {texture: null};
					return;
				}
				faces[direction] = {
					uv: [0, 0, 16, 16],
					texture: texture ? texture.uuid : false
				};
				if (options.cull_faces) faces[direction].cullface = direction;
			});
			return faces;
		}

		function boxUvForCuboid(from, to, origin) {
			return boxUvForDimensions([
				Math.abs(to[0] - from[0]),
				Math.abs(to[1] - from[1]),
				Math.abs(to[2] - from[2])
			], origin);
		}

		function boxUvForDimensions(size, origin) {
			origin = origin || [0, 0];
			let u = origin[0];
			let v = origin[1];
			let w = Math.abs(size[0]);
			let h = Math.abs(size[1]);
			let d = Math.abs(size[2]);
			return {
				west: [u, v + d, u + d, v + d + h],
				north: [u + d, v + d, u + d + w, v + d + h],
				east: [u + d + w, v + d, u + d + w + d, v + d + h],
				south: [u + d + w + d, v + d, u + d + w + d + w, v + d + h],
				up: [u + d, v, u + d + w, v + d],
				down: [u + d + w, v, u + d + w + w, v + d]
			};
		}

		function repeatedSideUvMap(side_uv, top_uv, bottom_uv) {
			return {
				north: side_uv.slice(),
				east: side_uv.slice(),
				south: side_uv.slice(),
				west: side_uv.slice(),
				up: (top_uv || side_uv).slice(),
				down: (bottom_uv || top_uv || side_uv).slice()
			};
		}

		function decoratedPotUvMap() {
			return repeatedSideUvMap([0, 0, 16, 16], [0, 0, 16, 16], [0, 16, 16, 32]);
		}

		function chestBaseUvMap() {
			let uv_map = boxUvForCuboid([1, 0, 1], [15, 10, 15], [0, 19]);
			uv_map.down = uv_map.up.slice();
			return uv_map;
		}

		function chestLidUvMap() {
			let uv_map = boxUvForCuboid([1, 10, 1], [15, 15, 15], [0, 0]);
			uv_map.up = uv_map.down.slice();
			return uv_map;
		}

		function uvFace(uv, rotation) {
			return rotation ? {uv, rotation} : uv;
		}

		function signBoardUvMap() {
			return {
				north: [2, 2, 50, 14],
				east: [50, 2, 52, 14],
				south: [2, 2, 50, 14],
				west: [0, 2, 2, 14],
				up: [2, 0, 25, 2],
				down: [25, 0, 50, 2]
			};
		}

		function signPostUvMap() {
			return {
				north: [2, 16, 4, 30],
				east: [4, 16, 6, 30],
				south: [6, 16, 8, 30],
				west: [0, 16, 2, 30],
				up: [2, 14, 4, 16],
				down: [4, 14, 6, 16]
			};
		}

		function bedMattressUvMap(part) {
			if (part === 'head') {
				return {
					north: uvFace([22, 6, 28, 22], 90),
					east: uvFace([22, 22, 38, 28], 180),
					south: uvFace([0, 6, 6, 22], 270),
					west: uvFace([6, 0, 22, 6], 180),
					up: uvFace([6, 6, 22, 22], 270),
					down: [28, 6, 44, 22]
				};
			}
			return {
				north: uvFace([22, 28, 28, 44], 90),
				east: uvFace([0, 28, 6, 44], 270),
				south: uvFace([22, 28, 28, 44], 90),
				west: uvFace([22, 22, 38, 28], 180),
				up: uvFace([6, 28, 22, 44], 180),
				down: [28, 28, 44, 44]
			};
		}

		function decoratedPotBodyUvMap() {
			return repeatedSideUvMap([1, 0, 15, 16], [14, 13, 28, 27], [0, 13, 14, 27]);
		}

		function decoratedPotNeckUvMap() {
			return repeatedSideUvMap([1, 0, 15, 16], [8, 0, 16, 8], [16, 0, 24, 8]);
		}

		function uvMapFromJavaUv(uv_map, texture_width, texture_height) {
			let u_scale = (texture_width || 16) / 16;
			let v_scale = (texture_height || texture_width || 16) / 16;
			let scaled = {};
			Object.keys(uv_map || {}).forEach(direction => {
				let uv = uv_map[direction];
				scaled[direction] = [
					uv[0] * u_scale,
					uv[1] * v_scale,
					uv[2] * u_scale,
					uv[3] * v_scale
				];
			});
			return scaled;
		}

		function copperGolemBodyUvMap() {
			return uvMapFromJavaUv({
				west: [0, 5.25, 1.5, 6.75],
				north: [1.5, 5.25, 3.5, 6.75],
				east: [3.5, 5.25, 5, 6.75],
				south: [5, 5.25, 7, 6.75],
				up: [1.5, 3.75, 3.5, 5.25],
				down: [3.5, 3.75, 5.5, 5.25]
			}, 64, 64);
		}

		function copperGolemHeadUvMap() {
			return uvMapFromJavaUv({
				west: [0, 2.5, 2.5, 3.75],
				north: [7, 2.5, 9, 3.75],
				east: [4.5, 2.5, 7, 3.75],
				south: [2.5, 2.5, 4.5, 3.75],
				up: [2.5, 0, 4.5, 2.5],
				down: [4.5, 0, 6.5, 2.5]
			}, 64, 64);
		}

		function copperGolemNoseUvMap() {
			return uvMapFromJavaUv({
				west: [14, 0.5, 14.5, 1.25],
				north: [14.5, 0.5, 15, 1.25],
				east: [15, 0.5, 15.5, 1.25],
				south: [15.5, 0.5, 16, 1.25],
				up: [14.5, 0, 15, 0.5],
				down: [15, 0, 15.5, 0.5]
			}, 64, 64);
		}

		function manualCubeFaces(texture, options, uv_map, face_textures) {
			let faces = {};
			uv_map = uv_map || {};
			face_textures = face_textures || {};
			FACE_DIRECTIONS.forEach(direction => {
				let face_texture = Object.prototype.hasOwnProperty.call(face_textures, direction) ? face_textures[direction] : texture;
				let uv_entry = uv_map[direction] || uv_map.all || [0, 0, 16, 16];
				let uv = Array.isArray(uv_entry) ? uv_entry : (uv_entry.uv || [0, 0, 16, 16]);
				faces[direction] = {
					uv: javaUvForTexture(uv, face_texture),
					texture: face_texture ? face_texture.uuid : false
				};
				if (!Array.isArray(uv_entry) && uv_entry.rotation) faces[direction].rotation = uv_entry.rotation;
				if (options.cull_faces) faces[direction].cullface = direction;
			});
			return faces;
		}

		function roundUv(value) {
			return Math.round(value * 10000) / 10000;
		}

		function javaUvForTexture(uv, texture) {
			uv = uv && uv.slice ? uv.slice() : [0, 0, 16, 16];
			let project_width = Project?.texture_width || 16;
			let project_height = Project?.texture_height || 16;
			let texture_width = texture?.uv_width || project_width;
			let texture_height = texture?.uv_height || project_height;
			if (!texture_width || !texture_height ||
				(texture_width === project_width && texture_height === project_height)) {
				return uv;
			}
			return [
				roundUv(uv[0] * project_width / texture_width),
				roundUv(uv[1] * project_height / texture_height),
				roundUv(uv[2] * project_width / texture_width),
				roundUv(uv[3] * project_height / texture_height)
			];
		}

		function facingYaw(facing) {
			return {
				north: 180,
				east: 90,
				south: 0,
				west: -90
			}[facing] || 0;
		}

		function standingRotationYaw(value) {
			let rotation = parseInt(value, 10);
			if (!Number.isFinite(rotation)) return 0;
			return 180 - ((rotation & 15) * 22.5);
		}

		function colorFromBlockName(name, suffix, fallback) {
			for (let color of COLOR_NAMES) {
				if (name === `${color}_${suffix}`) return color;
				if (name === `${color}_wall_${suffix}`) return color;
			}
			return fallback || 'white';
		}

		function woodFromSignName(name) {
			let wood = name.replace(/_wall_hanging_sign$|_hanging_sign$|_wall_sign$|_sign$/g, '');
			return wood && wood !== name ? wood : 'oak';
		}

		function isChestBlockName(name) {
			return name === 'chest' ||
				name === 'trapped_chest' ||
				name === 'ender_chest' ||
				/^(waxed_)?(exposed_|weathered_|oxidized_)?copper_chest$/.test(name);
		}

		function isSignBlockName(name) {
			return /(^|_)(wall_)?(hanging_)?sign$/.test(name);
		}

		function isBedBlockName(name) {
			return COLOR_NAMES.some(color => name === `${color}_bed`);
		}

		function isBannerBlockName(name) {
			return COLOR_NAMES.some(color => name === `${color}_banner` || name === `${color}_wall_banner`);
		}

		function isHeadBlockName(name) {
			return name === 'player_head' ||
				name === 'player_wall_head' ||
				/_(wall_)?(head|skull)$/.test(name);
		}

		function isCopperGolemStatueName(name) {
			return /^(waxed_)?(exposed_|weathered_|oxidized_)?copper_golem_statue$/.test(name);
		}

		function chestTextureInfo(parsed) {
			let name = parsed.name;
			let full_path = 'entity/chest/normal';
			if (name === 'trapped_chest') full_path = 'entity/chest/trapped';
			else if (name === 'ender_chest') full_path = 'entity/chest/ender';
			else if (name === 'copper_chest' || name === 'waxed_copper_chest') full_path = 'entity/chest/copper';
			else if (name === 'exposed_copper_chest' || name === 'waxed_exposed_copper_chest') full_path = 'entity/chest/copper_exposed';
			else if (name === 'weathered_copper_chest' || name === 'waxed_weathered_copper_chest') full_path = 'entity/chest/copper_weathered';
			else if (name === 'oxidized_copper_chest' || name === 'waxed_oxidized_copper_chest') full_path = 'entity/chest/copper_oxidized';
			return textureInfoForFullPath(parsed.namespace, name, full_path);
		}

		function chestLatchBoxForFacing(facing) {
			if (facing === 'south') return {from: [7, 7, 15], to: [9, 11, 16]};
			if (facing === 'east') return {from: [15, 7, 7], to: [16, 11, 9]};
			if (facing === 'west') return {from: [0, 7, 7], to: [1, 11, 9]};
			return {from: [7, 7, 0], to: [9, 11, 1]};
		}

		function createBuiltinChestCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit) {
			let parsed = parseBlockState(block.state);
			if (!isChestBlockName(parsed.name)) return {used_model: false, created: 0, truncated: 0, hidden: 0};

			let texture = createTextureForInfo(chestTextureInfo(parsed), options, texture_map, new_textures);
			let latch = chestLatchBoxForFacing(parsed.properties.facing || 'north');
			let specs = [
				{
					name: `${parsed.name}_builtin_base`,
					from: [1, 0, 1],
					to: [15, 10, 15],
					texture,
					uv: chestBaseUvMap()
				},
				{
					name: `${parsed.name}_builtin_lid`,
					from: [1, 10, 1],
					to: [15, 15, 15],
					texture,
					uv: chestLidUvMap()
				},
				{
					name: `${parsed.name}_builtin_latch`,
					from: latch.from,
					to: latch.to,
					texture,
					uv: boxUvForCuboid([7, 7, 0], [9, 11, 1], [0, 0])
				}
			];

			let result = createManualCuboids(block, specs, options, offset, root_group, new_cubes, cube_limit);
			return {used_model: result.created > 0, created: result.created, truncated: result.truncated, hidden: 0};
		}

		function createBuiltinSignCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit) {
			let parsed = parseBlockState(block.state);
			if (!isSignBlockName(parsed.name)) return {used_model: false, created: 0, truncated: 0, hidden: 0};

			let wood = woodFromSignName(parsed.name);
			let hanging = parsed.name.endsWith('_wall_hanging_sign') || parsed.name.endsWith('_hanging_sign');
			let wall = parsed.name.endsWith('_wall_sign') || parsed.name.endsWith('_wall_hanging_sign');
			let full_path = hanging ? `entity/signs/hanging/${wood}` : `entity/signs/${wood}`;
			let texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, wood, full_path), options, texture_map, new_textures);
			let specs = [];

			if (wall) {
				let rotate_y = facingYaw(parsed.properties.facing || 'north');
				specs.push({name: `${parsed.name}_builtin_board`, from: [2, 4, 0], to: [14, 12, 2], texture, rotate_y, uv: signBoardUvMap()});
				specs.push({name: `${parsed.name}_builtin_handle`, from: [7, 6, 2], to: [9, 10, 4], texture, rotate_y, uv: signPostUvMap()});
				if (hanging) {
					specs.push({name: `${parsed.name}_builtin_chain_left`, from: [3, 12, 0], to: [4, 16, 2], texture, rotate_y, uv: boxUvForCuboid([3, 12, 0], [4, 16, 2], [28, 0])});
					specs.push({name: `${parsed.name}_builtin_chain_right`, from: [12, 12, 0], to: [13, 16, 2], texture, rotate_y, uv: boxUvForCuboid([12, 12, 0], [13, 16, 2], [28, 0])});
				}
			} else {
				let cube_rotation_y = standingRotationYaw(parsed.properties.rotation);
				let board_from = hanging ? [2, 4, 7] : [0, 8, 7];
				let board_to = hanging ? [14, 12, 9] : [16, 16, 9];
				specs.push({name: `${parsed.name}_builtin_board`, from: board_from, to: board_to, texture, cube_rotation_y, uv: signBoardUvMap()});
				if (hanging) {
					specs.push({name: `${parsed.name}_builtin_chain_left`, from: [3, 12, 7], to: [4, 16, 9], texture, cube_rotation_y, uv: boxUvForCuboid([3, 12, 7], [4, 16, 9], [28, 0])});
					specs.push({name: `${parsed.name}_builtin_chain_right`, from: [12, 12, 7], to: [13, 16, 9], texture, cube_rotation_y, uv: boxUvForCuboid([12, 12, 7], [13, 16, 9], [28, 0])});
				} else {
					specs.push({name: `${parsed.name}_builtin_post`, from: [7, 0, 7], to: [9, 8, 9], texture, cube_rotation_y, uv: signPostUvMap()});
				}
			}

			let result = createManualCuboids(block, specs, options, offset, root_group, new_cubes, cube_limit);
			return {used_model: result.created > 0, created: result.created, truncated: result.truncated, hidden: 0};
		}

		function createBuiltinBedCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit) {
			let parsed = parseBlockState(block.state);
			if (!isBedBlockName(parsed.name)) return {used_model: false, created: 0, truncated: 0, hidden: 0};

			let color = colorFromBlockName(parsed.name, 'bed', 'white');
			let texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, parsed.name, `entity/bed/${color}`), options, texture_map, new_textures);
			let rotate_y = facingYaw(parsed.properties.facing || 'north');
			let part = parsed.properties.part === 'head' ? 'head' : 'foot';
			let specs = [
				{
					name: `${parsed.name}_builtin_${part}_mattress`,
					from: [0, 3, 0],
					to: [16, 9, 16],
					texture,
					rotate_y,
					uv: bedMattressUvMap(part)
				}
			];
			if (part === 'head') {
				specs.push({name: `${parsed.name}_builtin_head_leg_left`, from: [0, 0, 13], to: [3, 3, 16], texture, rotate_y, uv: boxUvForCuboid([0, 0, 13], [3, 3, 16], [50, 12])});
				specs.push({name: `${parsed.name}_builtin_head_leg_right`, from: [13, 0, 13], to: [16, 3, 16], texture, rotate_y, uv: boxUvForCuboid([13, 0, 13], [16, 3, 16], [50, 18])});
			} else {
				specs.push({name: `${parsed.name}_builtin_foot_leg_left`, from: [0, 0, 0], to: [3, 3, 3], texture, rotate_y, uv: boxUvForCuboid([0, 0, 0], [3, 3, 3], [50, 0])});
				specs.push({name: `${parsed.name}_builtin_foot_leg_right`, from: [13, 0, 0], to: [16, 3, 3], texture, rotate_y, uv: boxUvForCuboid([13, 0, 0], [16, 3, 3], [50, 6])});
			}

			let result = createManualCuboids(block, specs, options, offset, root_group, new_cubes, cube_limit);
			return {used_model: result.created > 0, created: result.created, truncated: result.truncated, hidden: 0};
		}

		function createBuiltinDecoratedPotCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit) {
			let parsed = parseBlockState(block.state);
			if (parsed.name !== 'decorated_pot') return {used_model: false, created: 0, truncated: 0, hidden: 0};

			let side_texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, 'decorated_pot_side', 'entity/decorated_pot/decorated_pot_side'), options, texture_map, new_textures);
			let base_texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, 'decorated_pot_base', 'entity/decorated_pot/decorated_pot_base'), options, texture_map, new_textures);
			let rotate_y = facingYaw(parsed.properties.facing || 'north');
			let top_bottom = {up: base_texture, down: base_texture};
			let body_uv = decoratedPotBodyUvMap();
			let neck_uv = decoratedPotNeckUvMap();
			let specs = [
				{name: 'decorated_pot_builtin_foot', from: [5, 0, 5], to: [11, 1, 11], texture: side_texture, face_textures: top_bottom, rotate_y, uv: body_uv},
				{name: 'decorated_pot_builtin_lower', from: [3, 1, 3], to: [13, 4, 13], texture: side_texture, face_textures: top_bottom, rotate_y, uv: body_uv},
				{name: 'decorated_pot_builtin_body', from: [2, 4, 2], to: [14, 13, 14], texture: side_texture, face_textures: top_bottom, rotate_y, uv: body_uv},
				{name: 'decorated_pot_builtin_neck', from: [4, 13, 4], to: [12, 16, 12], texture: side_texture, face_textures: top_bottom, rotate_y, uv: neck_uv}
			];

			let result = createManualCuboids(block, specs, options, offset, root_group, new_cubes, cube_limit);
			return {used_model: result.created > 0, created: result.created, truncated: result.truncated, hidden: 0};
		}

		function createBuiltinCopperGolemStatueCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit) {
			let parsed = parseBlockState(block.state);
			if (!isCopperGolemStatueName(parsed.name)) return {used_model: false, created: 0, truncated: 0, hidden: 0};

			let texture = createTextureForInfo(copperGolemTextureInfo(parsed), options, texture_map, new_textures);
			let rotate_y = facingYaw(parsed.properties.facing || 'north');
			let specs = [
				{name: `${parsed.name}_builtin_base`, from: [3, 0, 3], to: [13, 2, 13], texture, rotate_y, uv: boxUvForCuboid([3, 0, 3], [13, 2, 13], [0, 48])},
				{name: `${parsed.name}_builtin_body`, from: [5, 3, 5], to: [11, 10, 11], texture, rotate_y, uv: copperGolemBodyUvMap()},
				{name: `${parsed.name}_builtin_head`, from: [4, 10, 4], to: [12, 16, 12], texture, rotate_y, uv: copperGolemHeadUvMap()},
				{name: `${parsed.name}_builtin_nose`, from: [7, 11, 2], to: [9, 13, 4], texture, rotate_y, uv: copperGolemNoseUvMap()},
				{name: `${parsed.name}_builtin_left_arm`, from: [2, 4, 5], to: [5, 10, 11], texture, rotate_y, uv: boxUvForCuboid([2, 4, 5], [5, 10, 11], [40, 16])},
				{name: `${parsed.name}_builtin_right_arm`, from: [11, 4, 5], to: [14, 10, 11], texture, rotate_y, uv: boxUvForCuboid([11, 4, 5], [14, 10, 11], [40, 16])},
				{name: `${parsed.name}_builtin_left_leg`, from: [5, 2, 5], to: [7, 4, 7], texture, rotate_y, uv: boxUvForCuboid([5, 2, 5], [7, 4, 7], [0, 32])},
				{name: `${parsed.name}_builtin_right_leg`, from: [9, 2, 9], to: [11, 4, 11], texture, rotate_y, uv: boxUvForCuboid([9, 2, 9], [11, 4, 11], [0, 32])}
			];

			let result = createManualCuboids(block, specs, options, offset, root_group, new_cubes, cube_limit);
			return {used_model: result.created > 0, created: result.created, truncated: result.truncated, hidden: 0};
		}

		function createBuiltinBlockEntityCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit) {
			let parsed = parseBlockState(block.state);
			if (isChestBlockName(parsed.name)) return createBuiltinChestCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit);
			if (isSignBlockName(parsed.name)) return createBuiltinSignCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit);
			if (isBedBlockName(parsed.name)) return createBuiltinBedCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit);
			if (parsed.name === 'decorated_pot') return createBuiltinDecoratedPotCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit);
			if (isCopperGolemStatueName(parsed.name)) return createBuiltinCopperGolemStatueCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit);
			return {used_model: false, created: 0, truncated: 0, hidden: 0};
		}

		function headTextureInfo(parsed) {
			let name = parsed.name;
			let full_path = 'entity/player/wide/steve';
			if (name === 'skeleton_skull' || name === 'skeleton_wall_skull') full_path = 'entity/skeleton/skeleton';
			else if (name === 'wither_skeleton_skull' || name === 'wither_skeleton_wall_skull') full_path = 'entity/skeleton/wither_skeleton';
			else if (name === 'zombie_head' || name === 'zombie_wall_head') full_path = 'entity/zombie/zombie';
			else if (name === 'creeper_head' || name === 'creeper_wall_head') full_path = 'entity/creeper/creeper';
			else if (name === 'piglin_head' || name === 'piglin_wall_head') full_path = 'entity/piglin/piglin';
			else if (name === 'dragon_head' || name === 'dragon_wall_head') full_path = 'entity/enderdragon/dragon';
			return textureInfoForFullPath(parsed.namespace, name, full_path);
		}

		function copperGolemTextureInfo(parsed) {
			let name = parsed.name;
			let full_path = 'entity/copper_golem/copper_golem';
			if (name === 'exposed_copper_golem_statue' || name === 'waxed_exposed_copper_golem_statue') full_path = 'entity/copper_golem/exposed_copper_golem';
			else if (name === 'weathered_copper_golem_statue' || name === 'waxed_weathered_copper_golem_statue') full_path = 'entity/copper_golem/weathered_copper_golem';
			else if (name === 'oxidized_copper_golem_statue' || name === 'waxed_oxidized_copper_golem_statue') full_path = 'entity/copper_golem/oxidized_copper_golem';
			return textureInfoForFullPath(parsed.namespace, name, full_path);
		}

		function createManualCuboid(block, spec, options, offset, root_group, new_cubes, cube_limit) {
			if (new_cubes.length >= cube_limit) return false;
			try {
				let bounds;
				let rotate_y = spec.rotate_y || 0;
				if (spec.cube_rotation_y) {
					let from = spec.from.map(value => value / 16);
					let to = spec.to.map(value => value / 16);
					bounds = {
						from: [block.x + from[0] - offset[0], block.y + from[1] - offset[1], block.z + from[2] - offset[2]],
						to: [block.x + to[0] - offset[0], block.y + to[1] - offset[1], block.z + to[2] - offset[2]]
					};
				} else {
					bounds = getElementBounds({from: spec.from, to: spec.to}, {x: 0, y: rotate_y}, block, offset);
				}
				let cube_data = {
					name: `${spec.name || texturePathFromState(block.state)}_${new_cubes.length + 1}`,
					autouv: 0,
					from: bounds.from,
					to: bounds.to,
					origin: [0, 0, 0],
					faces: manualCubeFaces(spec.texture, options, spec.uv, spec.face_textures),
					shade: spec.shade !== false
				};
				if (spec.cube_rotation_y) {
					cube_data.origin = [block.x + 0.5 - offset[0], block.y + 0.5 - offset[1], block.z + 0.5 - offset[2]];
					cube_data.rotation = [0, spec.cube_rotation_y, 0];
				}
				let cube = new Cube(cube_data).addTo(root_group).init();
				if (spec.cube_rotation_y) cube.rotation_axis = 'y';
				cube[IMPORTED_PROPERTY] = true;
				new_cubes.push(cube);
				return true;
			} catch (error) {
				console.warn('Failed to create manual Minecraft block cuboid', block.state, spec.name, error);
				return false;
			}
		}

		function createManualCuboids(block, specs, options, offset, root_group, new_cubes, cube_limit) {
			let created = 0;
			let truncated = 0;
			for (let spec of specs) {
				if (createManualCuboid(block, spec, options, offset, root_group, new_cubes, cube_limit)) {
					created++;
				} else {
					truncated++;
				}
			}
			return {created, truncated};
		}

		function createSpecialBlockEntityCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit) {
			let parsed = parseBlockState(block.state);
			let name = parsed.name;
			let specs = [];

			if (isChestBlockName(name)) {
				return createBuiltinChestCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, cube_limit);
			} else if (isSignBlockName(name)) {
				let wood = woodFromSignName(name);
				let hanging = name.endsWith('_wall_hanging_sign') || name.endsWith('_hanging_sign');
				let wall = name.endsWith('_wall_sign') || name.endsWith('_wall_hanging_sign');
				let full_path = hanging ? `entity/signs/hanging/${wood}` : `entity/signs/${wood}`;
				let texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, wood, full_path), options, texture_map, new_textures);
				let rotate_y = wall ? facingYaw(parsed.properties.facing || 'north') : 0;
				let cube_rotation_y = wall ? 0 : standingRotationYaw(parsed.properties.rotation);
				if (wall) {
					specs.push({name: `${name}_board`, from: [2, 4, 0], to: [14, 12, 2], texture, rotate_y, uv: signBoardUvMap()});
					specs.push({name: `${name}_support`, from: [7, 6, 2], to: [9, 10, 4], texture, rotate_y, uv: signPostUvMap()});
					if (hanging) {
						specs.push({name: `${name}_chain_left`, from: [3, 12, 0], to: [4, 16, 2], texture, rotate_y, uv: boxUvForCuboid([3, 12, 0], [4, 16, 2], [28, 0])});
						specs.push({name: `${name}_chain_right`, from: [12, 12, 0], to: [13, 16, 2], texture, rotate_y, uv: boxUvForCuboid([12, 12, 0], [13, 16, 2], [28, 0])});
					}
				} else {
					let board_from = hanging ? [2, 4, 7] : [0, 8, 7];
					let board_to = hanging ? [14, 12, 9] : [16, 16, 9];
					specs.push({name: `${name}_board`, from: board_from, to: board_to, texture, cube_rotation_y, uv: signBoardUvMap()});
					if (hanging) {
						specs.push({name: `${name}_chain_left`, from: [3, 12, 7], to: [4, 16, 9], texture, cube_rotation_y, uv: boxUvForCuboid([3, 12, 7], [4, 16, 9], [28, 0])});
						specs.push({name: `${name}_chain_right`, from: [12, 12, 7], to: [13, 16, 9], texture, cube_rotation_y, uv: boxUvForCuboid([12, 12, 7], [13, 16, 9], [28, 0])});
					} else {
						specs.push({name: `${name}_post`, from: [7, 0, 7], to: [9, 8, 9], texture, cube_rotation_y, uv: signPostUvMap()});
					}
				}
			} else if (isBedBlockName(name)) {
				let color = colorFromBlockName(name, 'bed', 'white');
				let texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, name, `entity/bed/${color}`), options, texture_map, new_textures);
				let rotate_y = facingYaw(parsed.properties.facing || 'north');
				let bed_part = parsed.properties.part === 'head' ? 'head' : 'foot';
				specs.push({name: `${name}_${bed_part}`, from: [0, 3, 0], to: [16, 9, 16], texture, rotate_y, uv: bedMattressUvMap(bed_part)});
				let leg_origins = bed_part === 'head' ? [[0, 0, 13], [13, 0, 13]] : [[0, 0, 0], [13, 0, 0]];
				leg_origins.forEach((from, index) => {
					let to = [from[0] + 3, 3, from[2] + 3];
					let uv_origin = [50, bed_part === 'head' ? 12 + index * 6 : index * 6];
					specs.push({name: `${name}_${bed_part}_leg_${index + 1}`, from, to, texture, rotate_y, uv: boxUvForCuboid(from, to, uv_origin)});
				});
			} else if (isBannerBlockName(name)) {
				let color = colorFromBlockName(name, 'banner', 'white');
				let wall = name.endsWith('_wall_banner');
				let texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, `${color}_banner`, 'entity/banner/base'), options, texture_map, new_textures);
				if (wall) {
					let rotate_y = facingYaw(parsed.properties.facing || 'north');
					specs.push({name: `${name}_cloth`, from: [4, 2, 0], to: [12, 14, 1], texture, rotate_y, uv: boxUvForCuboid([4, 2, 0], [12, 14, 1], [0, 0])});
				} else {
					let cube_rotation_y = standingRotationYaw(parsed.properties.rotation);
					specs.push({name: `${name}_cloth`, from: [4, 3, 7.5], to: [12, 15, 8.5], texture, cube_rotation_y, uv: boxUvForCuboid([4, 3, 7.5], [12, 15, 8.5], [0, 0])});
					specs.push({name: `${name}_pole`, from: [7.5, 0, 7.5], to: [8.5, 16, 8.5], texture, cube_rotation_y, uv: boxUvForCuboid([7.5, 0, 7.5], [8.5, 16, 8.5], [44, 0])});
				}
			} else if (isHeadBlockName(name)) {
				let texture = createTextureForInfo(headTextureInfo(parsed), options, texture_map, new_textures);
				let wall = name.includes('_wall_');
				let rotate_y = wall ? facingYaw(parsed.properties.facing || 'north') : 0;
				let cube_rotation_y = wall ? 0 : standingRotationYaw(parsed.properties.rotation);
				let from = wall ? [4, 4, 0] : [4, 0, 4];
				let to = wall ? [12, 12, 8] : [12, 8, 12];
				specs.push({name: `${name}_head`, from, to, texture, rotate_y, cube_rotation_y, uv: boxUvForCuboid(from, to, [0, 0])});
			} else if (name === 'decorated_pot') {
				let side_texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, 'decorated_pot_side', 'entity/decorated_pot/decorated_pot_side'), options, texture_map, new_textures);
				let base_texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, 'decorated_pot_base', 'entity/decorated_pot/decorated_pot_base'), options, texture_map, new_textures);
				let rotate_y = facingYaw(parsed.properties.facing || 'north');
				let top_bottom = {up: base_texture, down: base_texture};
				let body_uv = decoratedPotBodyUvMap();
				let neck_uv = decoratedPotNeckUvMap();
				specs.push({name: `${name}_foot`, from: [5, 0, 5], to: [11, 1, 11], texture: side_texture, face_textures: top_bottom, rotate_y, uv: body_uv});
				specs.push({name: `${name}_lower`, from: [3, 1, 3], to: [13, 4, 13], texture: side_texture, face_textures: top_bottom, rotate_y, uv: body_uv});
				specs.push({name: `${name}_body`, from: [2, 4, 2], to: [14, 13, 14], texture: side_texture, face_textures: top_bottom, rotate_y, uv: body_uv});
				specs.push({name: `${name}_neck`, from: [4, 13, 4], to: [12, 16, 12], texture: side_texture, face_textures: top_bottom, rotate_y, uv: neck_uv});
			} else if (isCopperGolemStatueName(name)) {
				let texture = createTextureForInfo(copperGolemTextureInfo(parsed), options, texture_map, new_textures);
				let rotate_y = facingYaw(parsed.properties.facing || 'north');
				specs.push({name: `${name}_base`, from: [3, 0, 3], to: [13, 2, 13], texture, rotate_y, uv: boxUvForCuboid([3, 0, 3], [13, 2, 13], [0, 48])});
				specs.push({name: `${name}_body`, from: [5, 3, 5], to: [11, 10, 11], texture, rotate_y, uv: copperGolemBodyUvMap()});
				specs.push({name: `${name}_head`, from: [4, 10, 4], to: [12, 16, 12], texture, rotate_y, uv: copperGolemHeadUvMap()});
				specs.push({name: `${name}_nose`, from: [7, 11, 2], to: [9, 13, 4], texture, rotate_y, uv: copperGolemNoseUvMap()});
				specs.push({name: `${name}_left_arm`, from: [2, 4, 5], to: [5, 10, 11], texture, rotate_y, uv: boxUvForCuboid([2, 4, 5], [5, 10, 11], [40, 16])});
				specs.push({name: `${name}_right_arm`, from: [11, 4, 5], to: [14, 10, 11], texture, rotate_y, uv: boxUvForCuboid([11, 4, 5], [14, 10, 11], [40, 16])});
				specs.push({name: `${name}_left_leg`, from: [5, 2, 5], to: [7, 4, 7], texture, rotate_y, uv: boxUvForCuboid([5, 2, 5], [7, 4, 7], [0, 32])});
				specs.push({name: `${name}_right_leg`, from: [9, 2, 9], to: [11, 4, 11], texture, rotate_y, uv: boxUvForCuboid([9, 2, 9], [11, 4, 11], [0, 32])});
			}

			if (!specs.length) return {used_model: false, created: 0, truncated: 0, hidden: 0};
			let result = createManualCuboids(block, specs, options, offset, root_group, new_cubes, cube_limit);
			return {used_model: result.created > 0, created: result.created, truncated: result.truncated, hidden: 0};
		}

		function createFallbackCube(block, visible_faces, options, offset, root_group, texture_map, new_textures, new_cubes, index) {
			let texture = createTextureForState(block.state, options, texture_map, new_textures);
			let from = [
				block.x - offset[0],
				block.y - offset[1],
				block.z - offset[2]
			];
			let to = [from[0] + 1, from[1] + 1, from[2] + 1];
			let cube = new Cube({
				name: `${texturePathFromState(block.state)}_${index + 1}`,
				autouv: 0,
				from,
				to,
				origin: [0, 0, 0],
				faces: cubeFaces(block.state, visible_faces, texture, options)
			}).addTo(root_group).init();
			cube[IMPORTED_PROPERTY] = true;
			new_cubes.push(cube);
		}

		function createModelCubesForBlock(block, options, offset, occupied, root_group, texture_map, new_textures, new_cubes, cube_limit) {
			let refs = selectBlockModelRefs(block.state, options);
			if (!refs.length) return {used_model: false, created: 0, truncated: 0, hidden: 0};

			let created = 0;
			let truncated = 0;
			let hidden = 0;
			for (let ref of refs) {
				let model = loadResolvedModel(ref.model, options);
				if (!model || !Array.isArray(model.elements) || !model.elements.length) continue;

				for (let element_index = 0; element_index < model.elements.length; element_index++) {
					if (new_cubes.length >= cube_limit) {
						truncated++;
						continue;
					}
					let element = model.elements[element_index];
					let faces = createModelElementFaces(element, model, ref, block, options, occupied, texture_map, new_textures);
					if (!faces) {
						hidden++;
						continue;
					}
					let bounds = getElementBounds(element, ref, block, offset);
					let rotation_data = getElementRotation(element, ref, block, offset);
					let cube_data = {
						name: `${texturePathFromState(block.state)}_${new_cubes.length + 1}`,
						autouv: 0,
						from: bounds.from,
						to: bounds.to,
						origin: rotation_data ? rotation_data.origin : [0, 0, 0],
						faces,
						shade: element.shade !== false
					};
					if (rotation_data) {
						cube_data.rotation = rotation_data.rotation;
						cube_data.rescale = rotation_data.rescale;
					}
					let cube = new Cube(cube_data).addTo(root_group).init();
					if (rotation_data) cube.rotation_axis = rotation_data.axis;
					cube[IMPORTED_PROPERTY] = true;
					new_cubes.push(cube);
					created++;
				}
			}
			return {used_model: created > 0 || hidden > 0 || truncated > 0, created, truncated, hidden};
		}

		function importBlocksIntoProject(structure, options) {
			let source_blocks = structure.blocks.filter(block => !isAirState(block.state));
			if (!source_blocks.length) {
				Blockbench.showMessageBox({
					title: translate('title'),
					icon: 'info',
					message: translate('message.empty')
				});
				return null;
			}

			if (!Project) {
				if (!options.create_project) {
					Blockbench.showMessageBox({
						title: translate('title'),
						icon: 'info',
						message: translate('message.no_project')
					});
					return null;
				}
				setupProject(Formats.java_block);
				Project.name = pathStem(structure.name);
			}

			options = saveOptions(options);
			Project.texture_width = 16;
			Project.texture_height = 16;
			Project.box_uv = false;

			let model_source_ok = true;
			if (options.use_block_models) {
				let context = getTextureSourceContext(options);
				model_source_ok = !!readJsonAsset(context, 'assets/minecraft/blockstates/stone.json');
			}

			let occupied = new Set(source_blocks.map(keyForBlock));
			let solid_occupied = new Set(source_blocks.filter(block => isLikelyFullCubeState(block.state)).map(keyForBlock));
			let offset = getImportOffset(source_blocks, options);
			let hidden = 0;
			let truncated = 0;
			let model_blocks = 0;
			let fallback_blocks = 0;
			let fallback_detail_map = {};

			let new_cubes = [];
			let new_textures = [];
			let new_groups = [];
			let texture_map = {};
			Undo.initEdit({elements: new_cubes, textures: new_textures, groups: new_groups, outliner: true});

			let root_group = new Group(pathStem(structure.name)).init();
			root_group.isOpen = true;
			new_groups.push(root_group);

			for (let block of source_blocks) {
				if (new_cubes.length >= options.cube_limit) {
					truncated++;
					continue;
				}

				let block_group = createBlockGroup(block, root_group, new_groups);
				let handled = false;

				let builtin_result = createBuiltinBlockEntityCubesForBlock(block, options, offset, block_group, texture_map, new_textures, new_cubes, options.cube_limit);
				if (builtin_result.used_model) {
					model_blocks++;
					truncated += builtin_result.truncated;
					handled = true;
				}

				if (!handled) {
					let special_result = createSpecialBlockEntityCubesForBlock(block, options, offset, block_group, texture_map, new_textures, new_cubes, options.cube_limit);
					if (special_result.used_model) {
						model_blocks++;
						truncated += special_result.truncated;
						handled = true;
					}
				}

				if (!handled) {
					let model_result = createModelCubesForBlock(block, options, offset, solid_occupied, block_group, texture_map, new_textures, new_cubes, options.cube_limit);
					if (model_result.used_model) {
						model_blocks++;
						hidden += model_result.created ? 0 : model_result.hidden;
						truncated += model_result.truncated;
						handled = true;
					}
				}

				if (!handled) {
					let visible_faces = visibleFacesForBlock(block, occupied, options);
					if (!hasAnyVisibleFace(visible_faces)) {
						hidden++;
					} else {
						createFallbackCube(block, visible_faces, options, offset, block_group, texture_map, new_textures, new_cubes, new_cubes.length);
						fallback_blocks++;
						recordFallbackDetail(fallback_detail_map, block, options, model_source_ok);
					}
				}

				removeEmptyBlockGroup(block_group, new_groups);
			}

			if (new_textures[0]) new_textures[0].enableParticle();
			Undo.finishEdit(translate('action.import'));
			root_group.select();
			Canvas.updateAll();
			updateSelection();
			Validator.validate();
			Project.saved = false;

			return {
				cubes: new_cubes.length,
				textures: new_textures.length,
				source_blocks: source_blocks.length,
				hidden,
				truncated,
				model_blocks,
				fallback_blocks,
				fallback_details: fallbackDetailsFromMap(fallback_detail_map),
				cube_limit: options.cube_limit,
				model_source_ok,
				texture_source_path: options.texture_source_path || ''
			};
		}

		function fallbackReasonText(entry) {
			let key = `message.fallback_reason.${entry.reason || 'unknown'}`;
			let text = translate(key, [entry.detail || '']);
			return text === key ? translate('message.fallback_reason.unknown') : text;
		}

		function formatFallbackDetails(details) {
			if (!details || !details.length) return '';
			let max_details = 12;
			let lines = details.slice(0, max_details).map(entry => {
				let count = entry.count > 1 ? ` x${entry.count}` : '';
				return translate('message.fallback_detail_line', [
					entry.id,
					count,
					fallbackReasonText(entry)
				]);
			});
			if (details.length > max_details) {
				lines.push(translate('message.fallback_more', [details.length - max_details]));
			}
			return `${translate('message.fallback_details_title')}\n${lines.join('\n')}`;
		}

		function showImportSummary(structure, stats) {
			if (!stats) return;
			let message = translate('message.summary', [
				stats.cubes,
				stats.source_blocks,
				structure.format,
				stats.textures,
				stats.hidden,
				stats.truncated,
				stats.model_blocks || 0,
				stats.fallback_blocks || 0
			]);
			message += '\n\n' + translate('message.limit_note', [stats.cube_limit || DEFAULT_OPTIONS.cube_limit]);
			if (!stats.model_source_ok) {
				message += '\n\n' + translate('message.model_source_warning', [stats.texture_source_path || translate('message.model_source_auto')]);
			}
			let fallback_details = formatFallbackDetails(stats.fallback_details);
			if (fallback_details) message += '\n\n' + fallback_details;
			Blockbench.showMessageBox({
				title: translate('title'),
				icon: 'view_in_ar',
				width: 640,
				message
			});
		}

		function extensionFromFile(file) {
			let name = file.name || file.path || '';
			let match = String(name).match(/\.([a-z0-9]+)$/i);
			return match ? match[1].toLowerCase() : '';
		}

		function importMinecraftStructure(file, options) {
			try {
				let buffer = readFileBuffer(file);
				let extension = extensionFromFile(file);
				let source_name = file.name || pathBasename(file.path) || 'minecraft_structure';
				let structure;

				if (extension === 'mca') {
					structure = parseAnvilRegion(buffer, source_name, options);
				} else {
					let root = parseNbtMaybeCompressed(buffer);
					structure = parseNbtStructure(root, source_name, extension);
				}

				let stats = importBlocksIntoProject(structure, options);
				showImportSummary(structure, stats);
			} catch (error) {
				console.error(error);
				Blockbench.showMessageBox({
					title: translate('title'),
					icon: 'error',
					width: 560,
					message: translate('message.import_failed', [error?.message || error])
				});
			}
		}

		function showImportDialog(file) {
			let options = sanitizeOptions(importer_options);
			new Dialog({
				id: `${PLUGIN_ID}_direct_import`,
				title: translate('dialog.import_title'),
				width: 520,
				form: createOptionsForm(options),
				onConfirm(form) {
					importMinecraftStructure(file, sanitizeOptions(Object.assign({}, options, form)));
				}
			}).show();
		}

		function pickMinecraftStructure() {
			if (!isApp) {
				Blockbench.showQuickMessage(translate('message.desktop_only'), 2500);
				return;
			}
			Blockbench.import({
				resource_id: 'minecraft_structure',
				type: 'Minecraft Structure',
				extensions: ['schematic', 'schem', 'litematic', 'nbt', 'mca'],
				readtype: 'binary',
				multiple: false
			}, files => {
				if (files && files[0]) showImportDialog(files[0]);
			});
		}

		function setTextureSourcePath(texture_source_path) {
			if (!texture_source_path) return;
			let saved_options = saveOptions({texture_source_path});
			updateTextureSourcePathInputs(saved_options.texture_source_path);
			texture_source_cache = {path: null, context: null};
			asset_cache = {};
			model_cache = {};
			Blockbench.showQuickMessage(translate('message.texture_source_saved'), 2500);
		}

		function pickTextureSourceFolder() {
			if (!isApp) {
				Blockbench.showQuickMessage(translate('message.desktop_only'), 2500);
				return;
			}
			let texture_source_path = Blockbench.pickDirectory({
				resource_id: 'minecraft_texture_source_folder',
				title: translate('message.pick_texture_source')
			});
			setTextureSourcePath(texture_source_path);
		}

		function pickTextureSourceJar() {
			if (!isApp) {
				Blockbench.showQuickMessage(translate('message.desktop_only'), 2500);
				return;
			}
			Blockbench.import({
				resource_id: 'minecraft_texture_source_jar',
				type: 'Minecraft Jar or Zip',
				extensions: ['jar', 'zip'],
				readtype: 'none',
				multiple: false
			}, files => {
				if (files && files[0]) setTextureSourcePath(files[0].path);
			});
		}

		function pickTextureSource() {
			if (!isApp) {
				Blockbench.showQuickMessage(translate('message.desktop_only'), 2500);
				return;
			}
			Blockbench.showMessageBox({
				title: translate('form.texture_source_path'),
				icon: 'folder',
				width: 480,
				message: translate('message.pick_texture_source'),
				buttons: [
					translate('button.pick_texture_source_folder'),
					translate('button.pick_texture_source_jar'),
					tl('dialog.cancel')
				],
				confirm: 0,
				cancel: 2
			}, button => {
				if (button === 0) pickTextureSourceFolder();
				if (button === 1) pickTextureSourceJar();
			});
		}

		function showSettingsDialog() {
			let options = sanitizeOptions(importer_options);
			new Dialog({
				id: `${PLUGIN_ID}_direct_settings`,
				title: translate('dialog.settings_title'),
				width: 520,
				form: createOptionsForm(options),
				onConfirm(form) {
					saveOptions(Object.assign({}, options, form));
					Blockbench.showQuickMessage(translate('message.settings_saved'), 2500);
				}
			}).show();
		}

		function isDirectImportTexture(texture) {
			return !!texture && (
				texture[IMPORTED_PROPERTY] ||
				(texture.flags && texture.flags.has(PLUGIN_ID))
			);
		}

		function patchJavaTextureNamespaces(event) {
			if (!event || !event.model || !event.model.textures) return;
			Texture.all.forEach(texture => {
				if (!isDirectImportTexture(texture)) return;
				let namespace = cleanName(texture.namespace || 'minecraft').replace(/[/:].*$/, '') || 'minecraft';
				let full_path = cleanTextureFullPath(texture[TEXTURE_FULL_PATH_PROPERTY] || '');
				let link;
				if (full_path) {
					link = `${namespace}:${full_path}`;
				} else {
					let folder = cleanName(texture.folder || 'block').replace(/^textures\//, '') || 'block';
					let name = pathStem(texture.name || texture.id);
					link = `${namespace}:${folder}/${name}`;
				}

				for (let key in event.model.textures) {
					if (key === texture.id || event.model.textures[key] === texture.javaTextureLink()) {
						event.model.textures[key] = link;
					}
				}
				if (texture.particle && event.model.textures.particle === texture.javaTextureLink()) {
					event.model.textures.particle = link;
				}
			});
		}

		function patchMissingMinecraftTextureNamespaces(event) {
			if (!event || !event.model || !event.model.textures) return;
			let has_imported_content = Texture.all.some(isDirectImportTexture);
			if (!has_imported_content && typeof Cube !== 'undefined' && Cube.all) {
				has_imported_content = Cube.all.some(cube => cube && cube[IMPORTED_PROPERTY]);
			}
			if (!has_imported_content) return;
			for (let key in event.model.textures) {
				let value = event.model.textures[key];
				if (typeof value !== 'string' || value.includes(':') || value.startsWith('#')) continue;
				let clean = value.replace(/^textures\//, '').replace(/^\/+/, '');
				if (/^(block|item|entity)\//.test(clean)) {
					event.model.textures[key] = `minecraft:${clean}`;
				}
			}
		}

		function registerProperties() {
			if (typeof Property !== 'undefined' && typeof Texture !== 'undefined' && !Texture.properties?.[IMPORTED_PROPERTY]) {
				texture_imported_property = new Property(Texture, 'boolean', IMPORTED_PROPERTY, {exposed: false});
			}
		}

		function unregisterProperties() {
			if (texture_imported_property) texture_imported_property.delete();
		}


		return {
			addTranslations,
			loadStoredOptions,
			pickMinecraftStructure,
			showSettingsDialog,
			pickTextureSource,
			patchJavaTextureNamespaces,
			patchMissingMinecraftTextureNamespaces
		};
	})();

	function directTranslate(key, variables) {
		if (typeof tl === 'function') return tl(`${TRANSLATION_PREFIX}direct.${key}`, variables);
		return key;
	}

	function addMergedTranslations() {
		if (typeof Language === 'undefined' || !Language.addTranslations) return;

		Language.addTranslations('en', {
			[TRANSLATION_PREFIX + 'title']: 'Minecraft OBJ Cubizer',
			[TRANSLATION_PREFIX + 'menu.title']: 'Minecraft Cubizer',
			[TRANSLATION_PREFIX + 'action.import']: 'Import Minecraft OBJ as Cubes',
			[TRANSLATION_PREFIX + 'action.import.desc']: 'Import a Minecraft-style OBJ with MTL/PNG textures and rebuild it as editable Java cubes.',
			[TRANSLATION_PREFIX + 'action.settings']: 'OBJ Import Settings',
			[TRANSLATION_PREFIX + 'action.settings.desc']: 'Edit OBJ import defaults, texture namespace, texture folder, scale, and cullface behavior.',
			[TRANSLATION_PREFIX + 'action.export_textures']: 'Export OBJ Textures to Resource Pack',
			[TRANSLATION_PREFIX + 'action.export_textures.desc']: 'Copy imported OBJ texture PNG files into a Minecraft resource pack folder.',
			[TRANSLATION_PREFIX + 'dialog.settings_title']: 'OBJ Import Settings',
			[TRANSLATION_PREFIX + 'message.summary']: 'Imported %0 cubes from %1 OBJ faces.\n\nTextures: %2\nSkipped non-cube faces: %3\n\nUse Blockbench Java Block/Item Model export to save the JSON. Use the Minecraft Cubizer menu to copy PNG textures into a resource pack.',
			[TRANSLATION_PREFIX + 'direct.title']: 'Minecraft Structure Import',
			[TRANSLATION_PREFIX + 'direct.action.import']: 'Import Minecraft Structure',
			[TRANSLATION_PREFIX + 'direct.action.import.desc']: 'Import schematic, schem, litematic, structure NBT, or single MCA region files with Minecraft model JSON and textures.',
			[TRANSLATION_PREFIX + 'direct.action.settings']: 'Structure Import Settings',
			[TRANSLATION_PREFIX + 'direct.action.settings.desc']: 'Edit structure import defaults, cube limit, texture source, model loading, origin, and cullface options.',
			[TRANSLATION_PREFIX + 'direct.dialog.import_title']: 'Import Minecraft Structure',
			[TRANSLATION_PREFIX + 'direct.dialog.settings_title']: 'Minecraft Structure Import Settings',
			[TRANSLATION_PREFIX + 'direct.form.texture_source_path']: 'Texture source folder or Minecraft jar',
			[TRANSLATION_PREFIX + 'direct.form.create_project']: 'Auto-create Java Block project',
			[TRANSLATION_PREFIX + 'direct.form.texture_namespace']: 'Texture namespace',
			[TRANSLATION_PREFIX + 'direct.form.texture_folder']: 'Texture folder',
			[TRANSLATION_PREFIX + 'direct.form.use_block_models']: 'Read Minecraft block models',
			[TRANSLATION_PREFIX + 'direct.form.cube_limit']: 'Maximum cubes to create',
			[TRANSLATION_PREFIX + 'direct.form.move_to_origin']: 'Move import to origin',
			[TRANSLATION_PREFIX + 'direct.form.center_model']: 'Center model on origin',
			[TRANSLATION_PREFIX + 'direct.form.cull_faces']: 'Set Java cullfaces',
			[TRANSLATION_PREFIX + 'direct.message.desktop_only']: 'This importer needs the Blockbench desktop app.',
			[TRANSLATION_PREFIX + 'direct.message.no_project']: 'No project is open. Enable automatic project creation or create/open a Java Block project first.',
			[TRANSLATION_PREFIX + 'direct.message.empty']: 'No blocks were found in this file.',
			[TRANSLATION_PREFIX + 'direct.message.pick_texture_source']: 'Select a resource pack root folder or Minecraft jar',
			[TRANSLATION_PREFIX + 'direct.message.texture_source_saved']: 'Texture source saved.',
			[TRANSLATION_PREFIX + 'direct.message.import_failed']: 'Import failed:\n\n%0',
			[TRANSLATION_PREFIX + 'direct.message.settings_saved']: 'Settings saved.',
			[TRANSLATION_PREFIX + 'direct.message.summary']: 'Imported %0 Blockbench cubes from %1 non-air blocks.\n\nFormat: %2.\nTextures: %3.\nSkipped hidden blocks: %4.\nTruncated by limit: %5.\nBlocks rendered from model JSON: %6.\nFallback full cubes: %7.\n\nBlock entity data such as chest contents and sign text is not read.'
		});

		Language.addTranslations('zh', {
			[TRANSLATION_PREFIX + 'title']: 'Minecraft OBJ Cubizer',
			[TRANSLATION_PREFIX + 'menu.title']: 'Minecraft 方块转换器',
			[TRANSLATION_PREFIX + 'action.import']: '将 Minecraft OBJ 导入为方块',
			[TRANSLATION_PREFIX + 'action.import.desc']: '导入带 MTL/PNG 贴图的 Minecraft 建筑 OBJ，并重建为可编辑的 Java 方块。',
			[TRANSLATION_PREFIX + 'action.settings']: 'OBJ 导入设置',
			[TRANSLATION_PREFIX + 'action.settings.desc']: '修改 OBJ 导入默认值、贴图命名空间、贴图文件夹、缩放和 cullface 行为。',
			[TRANSLATION_PREFIX + 'action.export_textures']: '导出 OBJ 贴图到资源包',
			[TRANSLATION_PREFIX + 'action.export_textures.desc']: '把已导入 OBJ 使用的 PNG 贴图复制到 Minecraft 资源包目录。',
			[TRANSLATION_PREFIX + 'dialog.title']: '将 Minecraft OBJ 导入为方块',
			[TRANSLATION_PREFIX + 'dialog.settings_title']: 'OBJ 导入设置',
			[TRANSLATION_PREFIX + 'form.create_project']: '自动创建 Java Block 项目',
			[TRANSLATION_PREFIX + 'form.scale']: 'OBJ 方块缩放',
			[TRANSLATION_PREFIX + 'form.default_depth']: '默认方块厚度',
			[TRANSLATION_PREFIX + 'form.texture_size']: '贴图尺寸',
			[TRANSLATION_PREFIX + 'form.load_textures']: '加载 PNG 贴图用于预览',
			[TRANSLATION_PREFIX + 'form.texture_namespace']: '贴图命名空间',
			[TRANSLATION_PREFIX + 'form.texture_folder']: '贴图文件夹',
			[TRANSLATION_PREFIX + 'form.center_model']: '将模型居中到原点',
			[TRANSLATION_PREFIX + 'form.cull_faces']: '设置 Java cullface',
			[TRANSLATION_PREFIX + 'form.apply_texture_settings']: '立即应用命名空间和文件夹到已导入贴图',
			[TRANSLATION_PREFIX + 'form.apply_cull_faces']: '立即应用 cullface 设置到已导入方块',
			[TRANSLATION_PREFIX + 'button.use_recommended_scale']: '使用推荐缩放',
			[TRANSLATION_PREFIX + 'button.continue_anyway']: '仍然继续',
			[TRANSLATION_PREFIX + 'undo.import']: '将 Minecraft OBJ 导入为方块',
			[TRANSLATION_PREFIX + 'undo.settings']: '更新 OBJ 导入设置',
			[TRANSLATION_PREFIX + 'message.pick_resource_pack_root']: '选择资源包根目录',
			[TRANSLATION_PREFIX + 'message.no_textures']: '当前项目中没有找到由 OBJ 导入的贴图。',
			[TRANSLATION_PREFIX + 'message.no_filesystem']: '当前环境无法访问桌面文件系统。',
			[TRANSLATION_PREFIX + 'message.export_textures_done']: '已导出 %0 张贴图到：\n\n%1\n\n失败：%2',
			[TRANSLATION_PREFIX + 'message.desktop_only']: '该插件需要 Blockbench 桌面版来读取 MTL 和 PNG 文件。',
			[TRANSLATION_PREFIX + 'message.fs_permission']: '读取所选 OBJ 旁边的材质文件和 PNG 贴图。',
			[TRANSLATION_PREFIX + 'message.no_project_to_import']: '当前没有打开项目。请在 OBJ 导入设置中启用自动创建 Java Block 项目，或先创建/打开一个项目再导入。',
			[TRANSLATION_PREFIX + 'message.empty_obj']: '所选 OBJ 文件中没有可读取的顶点和面。',
			[TRANSLATION_PREFIX + 'message.no_cubes']: 'OBJ 可以读取，但没有找到可转换的轴对齐方块面。',
			[TRANSLATION_PREFIX + 'message.cube_count_warning']: '这个 OBJ 预计会生成 %0 个 Blockbench 方块。\n\n推荐范围：最多 %1 个方块。\n较重范围：%2 个以上可能会让 Blockbench 变慢或无响应。\n\n如果是很大的 Minecraft 建筑，建议先把 OBJ 拆成几个部分再导入。',
			[TRANSLATION_PREFIX + 'message.bounds_warning']: '当前缩放 %0 会生成超出 Java Block/Item 常见范围 -16 到 32 的模型坐标。\n\n当前范围：\n%1\n\n推荐缩放：%2\n推荐范围：\n%3\n\n对于 Minecraft 建筑 OBJ，缩放 1 通常表示一个 Minecraft 方块等于一个 Blockbench 单位；缩放 16 对 Java 模型 JSON 通常太大。',
			[TRANSLATION_PREFIX + 'message.summary']: '已从 %1 个 OBJ 面导入 %0 个方块。\n\n贴图：%2\n跳过的非方块面：%3\n\n使用 Blockbench 的 Java Block/Item Model 导出 JSON；使用插件菜单里的“导出 OBJ 贴图到资源包”复制 PNG 贴图。',
			[TRANSLATION_PREFIX + 'message.settings_saved']: '设置已保存。已更新贴图：%0。已更新方块：%1。',
			[TRANSLATION_PREFIX + 'message.import_failed']: '导入失败：\n\n%0',
			[TRANSLATION_PREFIX + 'direct.title']: 'Minecraft 结构导入',
			[TRANSLATION_PREFIX + 'direct.action.import']: '导入 Minecraft 结构',
			[TRANSLATION_PREFIX + 'direct.action.import.desc']: '导入 schematic、schem、litematic、结构 NBT 或单个 MCA 区域文件，并读取 Minecraft 模型 JSON 与贴图。',
			[TRANSLATION_PREFIX + 'direct.action.settings']: '结构导入设置',
			[TRANSLATION_PREFIX + 'direct.action.settings.desc']: '修改结构导入默认值、方块数量限制、贴图来源、模型读取、原点和 cullface 选项。',
			[TRANSLATION_PREFIX + 'direct.dialog.import_title']: '导入 Minecraft 结构',
			[TRANSLATION_PREFIX + 'direct.dialog.settings_title']: 'Minecraft 结构导入设置',
			[TRANSLATION_PREFIX + 'direct.form.texture_source_path']: '贴图来源文件夹或 Minecraft jar',
			[TRANSLATION_PREFIX + 'direct.form.create_project']: '自动创建 Java Block 项目',
			[TRANSLATION_PREFIX + 'direct.form.texture_namespace']: '贴图命名空间',
			[TRANSLATION_PREFIX + 'direct.form.texture_folder']: '贴图文件夹',
			[TRANSLATION_PREFIX + 'direct.form.use_block_models']: '读取 Minecraft 方块模型',
			[TRANSLATION_PREFIX + 'direct.form.cube_limit']: '最多创建方块数',
			[TRANSLATION_PREFIX + 'direct.form.move_to_origin']: '导入后移动到原点',
			[TRANSLATION_PREFIX + 'direct.form.center_model']: '模型居中到原点',
			[TRANSLATION_PREFIX + 'direct.form.cull_faces']: '设置 Java cullface',
			[TRANSLATION_PREFIX + 'direct.message.desktop_only']: '这个导入器需要 Blockbench 桌面版。',
			[TRANSLATION_PREFIX + 'direct.message.no_project']: '当前没有打开项目。请启用自动创建项目，或先创建/打开 Java Block 项目。',
			[TRANSLATION_PREFIX + 'direct.message.empty']: '这个文件里没有找到可导入的方块。',
			[TRANSLATION_PREFIX + 'direct.message.pick_texture_source']: '选择资源包根目录或 Minecraft jar',
			[TRANSLATION_PREFIX + 'direct.message.texture_source_saved']: '贴图来源已保存。',
			[TRANSLATION_PREFIX + 'direct.message.import_failed']: '导入失败：\n\n%0',
			[TRANSLATION_PREFIX + 'direct.message.settings_saved']: '设置已保存。',
			[TRANSLATION_PREFIX + 'direct.message.summary']: '已从 %1 个非空气方块导入 %0 个 Blockbench 方块。\n\n格式：%2。\n贴图：%3。\n跳过的隐藏方块：%4。\n因数量限制截断：%5。\n使用模型 JSON 的方块：%6。\n退回完整方块：%7。\n\n不会读取箱子物品、告示牌文字等方块实体数据。'
		});

		Language.addTranslations('zh_tw', {
			[TRANSLATION_PREFIX + 'title']: 'Minecraft OBJ 方塊轉換器',
			[TRANSLATION_PREFIX + 'menu.title']: 'Minecraft 方塊轉換器',
			[TRANSLATION_PREFIX + 'action.import']: '將 Minecraft OBJ 匯入為方塊',
			[TRANSLATION_PREFIX + 'action.import.desc']: '匯入帶 MTL/PNG 貼圖的 Minecraft 建築 OBJ，並重建為可編輯的 Java 方塊。',
			[TRANSLATION_PREFIX + 'action.settings']: 'OBJ 匯入設定',
			[TRANSLATION_PREFIX + 'action.settings.desc']: '修改 OBJ 匯入預設值、貼圖命名空間、貼圖資料夾、縮放和 cullface 行為。',
			[TRANSLATION_PREFIX + 'action.export_textures']: '匯出 OBJ 貼圖到資源包',
			[TRANSLATION_PREFIX + 'action.export_textures.desc']: '把已匯入 OBJ 使用的 PNG 貼圖複製到 Minecraft 資源包目錄。',
			[TRANSLATION_PREFIX + 'dialog.title']: '將 Minecraft OBJ 匯入為方塊',
			[TRANSLATION_PREFIX + 'dialog.settings_title']: 'OBJ 匯入設定',
			[TRANSLATION_PREFIX + 'form.create_project']: '自動建立 Java Block 專案',
			[TRANSLATION_PREFIX + 'form.scale']: 'OBJ 方塊縮放',
			[TRANSLATION_PREFIX + 'form.default_depth']: '預設方塊厚度',
			[TRANSLATION_PREFIX + 'form.texture_size']: '貼圖尺寸',
			[TRANSLATION_PREFIX + 'form.load_textures']: '載入 PNG 貼圖用於預覽',
			[TRANSLATION_PREFIX + 'form.texture_namespace']: '貼圖命名空間',
			[TRANSLATION_PREFIX + 'form.texture_folder']: '貼圖資料夾',
			[TRANSLATION_PREFIX + 'form.center_model']: '將模型置中到原點',
			[TRANSLATION_PREFIX + 'form.cull_faces']: '設定 Java cullface',
			[TRANSLATION_PREFIX + 'form.apply_texture_settings']: '立即套用命名空間和資料夾到已匯入貼圖',
			[TRANSLATION_PREFIX + 'form.apply_cull_faces']: '立即套用 cullface 設定到已匯入方塊',
			[TRANSLATION_PREFIX + 'button.use_recommended_scale']: '使用建議縮放',
			[TRANSLATION_PREFIX + 'button.continue_anyway']: '仍然繼續',
			[TRANSLATION_PREFIX + 'undo.import']: '將 Minecraft OBJ 匯入為方塊',
			[TRANSLATION_PREFIX + 'undo.settings']: '更新 OBJ 匯入設定',
			[TRANSLATION_PREFIX + 'message.pick_resource_pack_root']: '選擇資源包根目錄',
			[TRANSLATION_PREFIX + 'message.no_textures']: '目前專案中沒有找到由 OBJ 匯入的貼圖。',
			[TRANSLATION_PREFIX + 'message.no_filesystem']: '目前環境無法存取桌面檔案系統。',
			[TRANSLATION_PREFIX + 'message.export_textures_done']: '已匯出 %0 張貼圖到：\n\n%1\n\n失敗：%2',
			[TRANSLATION_PREFIX + 'message.desktop_only']: '此外掛需要 Blockbench 桌面版來讀取 MTL 和 PNG 檔案。',
			[TRANSLATION_PREFIX + 'message.fs_permission']: '讀取所選 OBJ 旁邊的材質檔案和 PNG 貼圖。',
			[TRANSLATION_PREFIX + 'message.no_project_to_import']: '目前沒有開啟專案。請在 OBJ 匯入設定中啟用自動建立 Java Block 專案，或先建立/開啟一個專案再匯入。',
			[TRANSLATION_PREFIX + 'message.empty_obj']: '所選 OBJ 檔案中沒有可讀取的頂點和面。',
			[TRANSLATION_PREFIX + 'message.no_cubes']: 'OBJ 可以讀取，但沒有找到可轉換的軸對齊方塊面。',
			[TRANSLATION_PREFIX + 'message.cube_count_warning']: '這個 OBJ 預計會生成 %0 個 Blockbench 方塊。\n\n建議範圍：最多 %1 個方塊。\n較重範圍：%2 個以上可能會讓 Blockbench 變慢或無回應。\n\n如果是很大的 Minecraft 建築，建議先把 OBJ 拆成幾個部分再匯入。',
			[TRANSLATION_PREFIX + 'message.bounds_warning']: '目前縮放 %0 會生成超出 Java Block/Item 常見範圍 -16 到 32 的模型座標。\n\n目前範圍：\n%1\n\n建議縮放：%2\n建議範圍：\n%3\n\n對於 Minecraft 建築 OBJ，縮放 1 通常表示一個 Minecraft 方塊等於一個 Blockbench 單位；縮放 16 對 Java 模型 JSON 通常太大。',
			[TRANSLATION_PREFIX + 'message.summary']: '已從 %1 個 OBJ 面匯入 %0 個方塊。\n\n貼圖：%2\n略過的非方塊面：%3\n\n使用 Blockbench 的 Java Block/Item Model 匯出 JSON；使用外掛選單裡的「匯出 OBJ 貼圖到資源包」複製 PNG 貼圖。',
			[TRANSLATION_PREFIX + 'message.settings_saved']: '設定已儲存。已更新貼圖：%0。已更新方塊：%1。',
			[TRANSLATION_PREFIX + 'message.import_failed']: '匯入失敗：\n\n%0',
			[TRANSLATION_PREFIX + 'direct.title']: 'Minecraft 結構匯入',
			[TRANSLATION_PREFIX + 'direct.action.import']: '匯入 Minecraft 結構',
			[TRANSLATION_PREFIX + 'direct.action.import.desc']: '匯入 schematic、schem、litematic、結構 NBT 或單個 MCA 區域檔，並讀取 Minecraft 模型 JSON 與貼圖。',
			[TRANSLATION_PREFIX + 'direct.action.settings']: '結構匯入設定',
			[TRANSLATION_PREFIX + 'direct.action.settings.desc']: '修改結構匯入預設值、方塊數量限制、貼圖來源、模型讀取、原點和 cullface 選項。',
			[TRANSLATION_PREFIX + 'direct.dialog.import_title']: '匯入 Minecraft 結構',
			[TRANSLATION_PREFIX + 'direct.dialog.settings_title']: 'Minecraft 結構匯入設定',
			[TRANSLATION_PREFIX + 'direct.form.texture_source_path']: '貼圖來源資料夾或 Minecraft jar',
			[TRANSLATION_PREFIX + 'direct.form.create_project']: '自動建立 Java Block 專案',
			[TRANSLATION_PREFIX + 'direct.form.texture_namespace']: '貼圖命名空間',
			[TRANSLATION_PREFIX + 'direct.form.texture_folder']: '貼圖資料夾',
			[TRANSLATION_PREFIX + 'direct.form.use_block_models']: '讀取 Minecraft 方塊模型',
			[TRANSLATION_PREFIX + 'direct.form.cube_limit']: '最多建立方塊數',
			[TRANSLATION_PREFIX + 'direct.form.move_to_origin']: '匯入後移動到原點',
			[TRANSLATION_PREFIX + 'direct.form.center_model']: '模型置中到原點',
			[TRANSLATION_PREFIX + 'direct.form.cull_faces']: '設定 Java cullface',
			[TRANSLATION_PREFIX + 'direct.message.desktop_only']: '這個匯入器需要 Blockbench 桌面版。',
			[TRANSLATION_PREFIX + 'direct.message.no_project']: '目前沒有開啟專案。請啟用自動建立專案，或先建立/開啟 Java Block 專案。',
			[TRANSLATION_PREFIX + 'direct.message.empty']: '這個檔案中沒有找到可匯入的方塊。',
			[TRANSLATION_PREFIX + 'direct.message.pick_texture_source']: '選擇資源包根目錄或 Minecraft jar',
			[TRANSLATION_PREFIX + 'direct.message.texture_source_saved']: '貼圖來源已儲存。',
			[TRANSLATION_PREFIX + 'direct.message.import_failed']: '匯入失敗：\n\n%0',
			[TRANSLATION_PREFIX + 'direct.message.settings_saved']: '設定已儲存。',
			[TRANSLATION_PREFIX + 'direct.message.summary']: '已從 %1 個非空氣方塊匯入 %0 個 Blockbench 方塊。\n\n格式：%2。\n貼圖：%3。\n略過的隱藏方塊：%4。\n因數量限制截斷：%5。\n使用模型 JSON 的方塊：%6。\n退回完整方塊：%7。\n\n不會讀取箱子物品、告示牌文字等方塊實體資料。'
		});
	}

	function addDirectImportHotfixTranslations() {
		if (typeof Language === 'undefined' || !Language.addTranslations) return;
		Language.addTranslations('en', {
			[TRANSLATION_PREFIX + 'direct.form.texture_source_picker']: 'Choose texture source',
			[TRANSLATION_PREFIX + 'direct.button.pick_texture_source_folder']: 'Folder',
			[TRANSLATION_PREFIX + 'direct.button.pick_texture_source_jar']: 'Jar / Zip',
			[TRANSLATION_PREFIX + 'direct.form.cube_limit_note']: 'This limit counts generated Blockbench cubes, not original Minecraft blocks. The default is 5000 cubes. For Java Block/Item Model export, keep the final model roughly within 48 x 48 x 48 blocks when possible.',
			[TRANSLATION_PREFIX + 'direct.message.limit_note']: 'Cube limit for this import: %0 generated Blockbench cubes. This is not the original Minecraft block count. For Java Block/Item Model export, keep the final model roughly within 48 x 48 x 48 blocks when possible.',
			[TRANSLATION_PREFIX + 'direct.message.model_source_auto']: 'automatic Minecraft jar detection',
			[TRANSLATION_PREFIX + 'direct.message.model_source_warning']: 'Warning: Minecraft blockstate/model JSON could not be read from %0.\n\nChoose a Minecraft jar, a resource-pack root, an assets folder, or an assets/minecraft folder in the structure import dialog or Structure Import Settings. Without these model files, many special blocks will import as fallback full cubes.',
			[TRANSLATION_PREFIX + 'direct.message.summary']: 'Imported %0 Blockbench cubes from %1 non-air blocks.\n\nFormat: %2.\nTextures: %3.\nSkipped hidden blocks: %4.\nTruncated by limit: %5.\nBlocks rendered from model JSON: %6.\nFallback full cubes: %7.\n\nBlock entity data such as chest contents and sign text is not read.',
			[TRANSLATION_PREFIX + 'direct.message.fallback_details_title']: 'Fallback full cube details:',
			[TRANSLATION_PREFIX + 'direct.message.fallback_detail_line']: '- %0%1: %2',
			[TRANSLATION_PREFIX + 'direct.message.fallback_more']: '- ...and %0 more.',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_disabled']: 'Minecraft block model reading is disabled.',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_source_missing']: 'No readable vanilla blockstate/model JSON was found in the texture source.',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.blockstate_missing']: 'No blockstate JSON was found for this block.',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.no_matching_model']: 'The blockstate JSON has no model matching this state.',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_missing_or_empty']: 'The model JSON is missing or has no elements: %0.',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_hidden']: 'The model produced no visible faces, so a full cube was used.',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.unknown']: 'Unknown fallback reason.'
		});
		Language.addTranslations('zh_tw', {
			[TRANSLATION_PREFIX + 'direct.form.texture_source_picker']: '選擇貼圖來源',
			[TRANSLATION_PREFIX + 'direct.form.cube_limit_note']: '這裡限制的是導入後生成的 Blockbench cube 數，不是原始 Minecraft 方塊數。預設上限是 5000 個 cube。若要匯出為 Java Block/Item Model，建議最終模型盡量控制在約 48 x 48 x 48 格以內。',
			[TRANSLATION_PREFIX + 'direct.message.limit_note']: '本次導入的 cube 上限設定為 %0。這裡統計的是生成的 Blockbench cube，不是原始 Minecraft 方塊數。若要匯出為 Java Block/Item Model，建議最終模型盡量控制在約 48 x 48 x 48 格以內。'
		});
		Language.addTranslations('zh', {
			[TRANSLATION_PREFIX + 'direct.form.texture_source_picker']: '选择贴图来源',
			[TRANSLATION_PREFIX + 'direct.button.pick_texture_source_folder']: '文件夹',
			[TRANSLATION_PREFIX + 'direct.button.pick_texture_source_jar']: 'Jar / Zip',
			[TRANSLATION_PREFIX + 'direct.form.cube_limit_note']: '这里限制的是导入后生成的 Blockbench cube 数，不是原始 Minecraft 方块数。默认上限是 5000 个 cube。若要导出为 Java Block/Item Model，建议最终模型尽量控制在约 48 x 48 x 48 格以内。',
			[TRANSLATION_PREFIX + 'direct.message.limit_note']: '本次导入的 cube 上限设置为 %0。这里统计的是生成的 Blockbench cube，不是原始 Minecraft 方块数。若要导出为 Java Block/Item Model，建议最终模型尽量控制在约 48 x 48 x 48 格以内。',
			[TRANSLATION_PREFIX + 'direct.message.model_source_auto']: '自动查找 Minecraft jar',
			[TRANSLATION_PREFIX + 'direct.message.model_source_warning']: '警告：无法从 %0 读取 Minecraft 方块状态/模型 JSON。\n\n请在导入结构弹窗或“结构导入设置”里选择 Minecraft jar、资源包根目录、assets 文件夹，或 assets/minecraft 文件夹。没有这些模型文件时，很多特殊方块会退回成普通完整方块。',
			[TRANSLATION_PREFIX + 'direct.message.summary']: '已从 %1 个非空气方块导入 %0 个 Blockbench 方块。\n\n格式：%2。\n贴图：%3。\n跳过的隐藏方块：%4。\n因数量限制截断：%5。\n使用模型 JSON 的方块：%6。\n退回完整方块：%7。\n\n不会读取箱子物品、告示牌文字等方块实体数据。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_details_title']: '退回完整方块详情：',
			[TRANSLATION_PREFIX + 'direct.message.fallback_detail_line']: '- %0%1：%2',
			[TRANSLATION_PREFIX + 'direct.message.fallback_more']: '- ……另外还有 %0 项。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_disabled']: '未启用“读取 Minecraft 方块模型”。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_source_missing']: '贴图来源中没有可读取的原版 blockstate/model JSON。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.blockstate_missing']: '没有找到该方块的 blockstate JSON。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.no_matching_model']: 'blockstate JSON 中没有匹配当前状态的模型。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_missing_or_empty']: '模型 JSON 未找到，或没有 elements：%0。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_hidden']: '模型没有可显示的面，因此使用完整方块。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.unknown']: '未知退回原因。'
		});
		Language.addTranslations('zh_tw', {
			[TRANSLATION_PREFIX + 'direct.button.pick_texture_source_folder']: '資料夾',
			[TRANSLATION_PREFIX + 'direct.button.pick_texture_source_jar']: 'Jar / Zip',
			[TRANSLATION_PREFIX + 'direct.form.cube_limit_note']: '這裡限制的是導入後生成的 Blockbench cube 數，不是原始 Minecraft 方塊數。預設上限是 5000 個 cube。若要匯出為 Java Block/Item Model，建議最終模型盡量控制在約 48 x 48 x 48 格以內。',
			[TRANSLATION_PREFIX + 'direct.message.limit_note']: '本次導入的 cube 上限設定為 %0。這裡統計的是生成的 Blockbench cube，不是原始 Minecraft 方塊數。若要匯出為 Java Block/Item Model，建議最終模型盡量控制在約 48 x 48 x 48 格以內。',
			[TRANSLATION_PREFIX + 'direct.message.model_source_auto']: '自動尋找 Minecraft jar',
			[TRANSLATION_PREFIX + 'direct.message.model_source_warning']: '警告：無法從 %0 讀取 Minecraft 方塊狀態/模型 JSON。\n\n請在匯入結構彈窗或「結構匯入設定」裡選擇 Minecraft jar、資源包根目錄、assets 資料夾，或 assets/minecraft 資料夾。沒有這些模型檔時，很多特殊方塊會退回成普通完整方塊。',
			[TRANSLATION_PREFIX + 'direct.message.summary']: '已從 %1 個非空氣方塊匯入 %0 個 Blockbench 方塊。\n\n格式：%2。\n貼圖：%3。\n略過的隱藏方塊：%4。\n因數量限制截斷：%5。\n使用模型 JSON 的方塊：%6。\n退回完整方塊：%7。\n\n不會讀取箱子物品、告示牌文字等方塊實體資料。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_details_title']: '退回完整方塊詳情：',
			[TRANSLATION_PREFIX + 'direct.message.fallback_detail_line']: '- %0%1：%2',
			[TRANSLATION_PREFIX + 'direct.message.fallback_more']: '- ……另外還有 %0 項。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_disabled']: '未啟用「讀取 Minecraft 方塊模型」。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_source_missing']: '貼圖來源中沒有可讀取的原版 blockstate/model JSON。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.blockstate_missing']: '沒有找到該方塊的 blockstate JSON。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.no_matching_model']: 'blockstate JSON 中沒有符合目前狀態的模型。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_missing_or_empty']: '模型 JSON 未找到，或沒有 elements：%0。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.model_hidden']: '模型沒有可顯示的面，因此使用完整方塊。',
			[TRANSLATION_PREFIX + 'direct.message.fallback_reason.unknown']: '未知退回原因。'
		});
	}

	function createPluginMenu() {
		let MenuClass = typeof BarMenu !== 'undefined' ? BarMenu : (typeof Blockbench !== 'undefined' && Blockbench.BarMenu);
		if (!MenuClass || typeof MenuBar === 'undefined') return;
		if (MenuBar.menus && MenuBar.menus[MENU_ID]) {
			MenuBar.menus[MENU_ID].delete();
		}
		plugin_menu = new MenuClass(MENU_ID, [
			import_action,
			direct_import_action,
			'_',
			settings_action,
			direct_settings_action,
			'_',
			export_textures_action
		], {
			name: translate('menu.title')
		});
		MenuBar.addMenu(plugin_menu, 'file');
	}

	function deletePluginMenu() {
		if (plugin_menu) {
			plugin_menu.delete();
			plugin_menu = null;
		}
	}

	function fileExistsSync(file_path) {
		try {
			let fs = getNativeModule('fs', file_path ? {scope: file_path} : undefined);
			return !!(fs && file_path && fs.existsSync(file_path));
		} catch (error) {
			return false;
		}
	}

	function defaultPersistentPluginPath() {
		let path_module = getNativeModule('path');
		if (typeof Plugins !== 'undefined' && Plugins.path) {
			return path_module ? path_module.join(Plugins.path, PLUGIN_ID, `${PLUGIN_ID}.js`) : `${Plugins.path}${PLUGIN_ID}/${PLUGIN_ID}.js`;
		}
		if (typeof process !== 'undefined' && process.env && process.env.APPDATA) {
			return path_module
				? path_module.join(process.env.APPDATA, 'Blockbench', 'plugins', PLUGIN_ID, `${PLUGIN_ID}.js`)
				: `${process.env.APPDATA}\\Blockbench\\plugins\\${PLUGIN_ID}\\${PLUGIN_ID}.js`;
		}
		return '';
	}

	function samePluginPath(a, b) {
		let left = normalizePluginPath(a).toLowerCase();
		let right = normalizePluginPath(b).toLowerCase();
		return !!left && left === right;
	}

	function pluginSiblingPath(file_path, filename, path_module) {
		let directory = getDirname(file_path);
		return directory ? joinPath(path_module, directory, filename) : '';
	}

	function readablePluginFile(candidates) {
		return candidates.find(fileExistsSync) || '';
	}

	function copyPluginFile(fs, source, target) {
		try {
			if (!fs || !source || !target) return false;
			if (samePluginPath(source, target)) return true;
			if (fs.existsSync(source)) {
				fs.copyFileSync(source, target);
				return true;
			}
		} catch (error) {
			console.warn('Could not copy Minecraft OBJ Cubizer sidecar file', source, target, error);
		}
		return false;
	}

	function readPluginTextFile(file_path) {
		try {
			let fs = getNativeModule('fs', file_path ? {scope: file_path} : undefined);
			if (fs && file_path && fs.existsSync(file_path)) {
				return fs.readFileSync(file_path, 'utf8');
			}
		} catch (error) {
			console.warn('Could not read Minecraft OBJ Cubizer plugin page file', file_path, error);
		}
		return '';
	}

	function refreshPluginPageText(current_plugin, plugin_path) {
		if (!current_plugin || !plugin_path) return;
		let path_module = getNativeModule('path');
		let about_path = pluginSiblingPath(plugin_path, 'about.md', path_module);
		let changelog_path = pluginSiblingPath(plugin_path, 'changelog.json', path_module);
		let about = readPluginTextFile(about_path);
		if (about) {
			current_plugin.about = about;
			current_plugin.about_fetched = true;
		} else {
			current_plugin.about_fetched = false;
		}
		let changelog = readPluginTextFile(changelog_path);
		if (changelog) {
			try {
				current_plugin.changelog = JSON.parse(changelog);
				current_plugin.changelog_fetched = true;
			} catch (error) {
				console.warn('Could not parse Minecraft OBJ Cubizer changelog', error);
				current_plugin.changelog_fetched = false;
			}
		} else {
			current_plugin.changelog_fetched = false;
		}
	}

	function ensurePersistentPluginFiles(current_plugin) {
		let target_path = normalizePluginPath(defaultPersistentPluginPath());
		if (!target_path) return '';
		let path_module = getNativeModule('path');
		let target_dir = getDirname(target_path);
		let fs_scope = (typeof Plugins !== 'undefined' && Plugins.path) ? Plugins.path : target_dir;
		let fs = getNativeModule('fs', fs_scope ? {scope: fs_scope} : undefined);
		try {
			if (fs && target_dir && !fs.existsSync(target_dir)) fs.mkdirSync(target_dir, {recursive: true});
		} catch (error) {
			console.warn('Could not create Minecraft OBJ Cubizer plugin folder', error);
		}

		let current_path = normalizePluginPath(current_plugin && current_plugin.path);
		let copied_current = false;
		if (current_path && fileExistsSync(current_path)) {
			copied_current = copyPluginFile(fs, current_path, target_path);
		}
		if ((!fileExistsSync(target_path) || (current_path && !copied_current)) && current_path) return current_path;

		['about.md', 'changelog.json', 'icon.svg'].forEach(filename => {
			let target_file = pluginSiblingPath(target_path, filename, path_module);
			let source_file = readablePluginFile([
				current_path ? pluginSiblingPath(current_path, filename, path_module) : '',
				current_path ? pluginSiblingPath(current_path, `${PLUGIN_ID}.${filename}`, path_module) : '',
				current_path ? pluginSiblingPath(current_path, `${PLUGIN_ID}_${filename}`, path_module) : '',
				target_file
			]);
			copyPluginFile(fs, source_file, target_file);
		});
		return fileExistsSync(target_path) ? target_path : current_path;
	}

	function normalizePluginPath(file_path) {
		if (!file_path) return '';
		file_path = String(file_path).replace(/\?\d+$/, '');
		let path_module = getNativeModule('path');
		try {
			if (path_module && path_module.normalize) return path_module.normalize(file_path);
		} catch (error) {}
		return file_path;
	}

	function pickPersistentPluginPath(entry, memory_entry, current_plugin) {
		let default_path = defaultPersistentPluginPath();
		let candidates = [
			default_path,
			current_plugin && current_plugin.path,
			entry && entry.path,
			memory_entry && memory_entry.path
		].map(normalizePluginPath).filter(Boolean);
		return candidates.find(fileExistsSync) || candidates[0] || '';
	}

	function cleanupForeignPluginFeatures() {
		let allowed_actions = new Set(PLUGIN_ACTION_IDS);
		if (typeof Keybinds !== 'undefined' && Array.isArray(Keybinds.actions)) {
			Keybinds.actions.forEach(action => {
				if (action && action.plugin === PLUGIN_ID && !allowed_actions.has(action.id)) {
					action.plugin = '';
				}
			});
		}
		if (typeof BarItems !== 'undefined') {
			Object.keys(BarItems).forEach(id => {
				let item = BarItems[id];
				if (item && item.plugin === PLUGIN_ID && !allowed_actions.has(item.id)) {
					item.plugin = '';
				}
			});
		}
		if (typeof settings !== 'undefined') {
			Object.keys(settings).forEach(id => {
				if (settings[id] && settings[id].plugin === PLUGIN_ID) settings[id].plugin = '';
			});
		}
	}

	function deleteStalePluginActions() {
		if (typeof BarItems === 'undefined') return;
		PLUGIN_ACTION_IDS.forEach(id => {
			let action = BarItems[id];
			if (action && action.plugin === PLUGIN_ID && typeof action.delete === 'function') {
				action.delete();
			}
		});
	}

	function upsertPluginInstallation(list, entry_data) {
		if (!Array.isArray(list)) return null;
		let entry = list.find(plugin => plugin && plugin.id === PLUGIN_ID);
		if (!entry) {
			entry = {id: PLUGIN_ID};
			list.push(entry);
		}
		Object.assign(entry, entry_data);
		return entry;
	}

	function rememberPluginInstallation() {
		try {
			if (typeof localStorage === 'undefined') return;
			let install_key = 'StateMemory.installed_plugins';
			let installed = [];
			try {
				installed = JSON.parse(localStorage.getItem(install_key) || '[]');
			} catch (error) {
				installed = [];
			}
			if (!Array.isArray(installed)) installed = [];

			let current_plugin = typeof Plugins !== 'undefined' && Plugins.registered ? Plugins.registered[PLUGIN_ID] : null;
			let state_list = typeof StateMemory !== 'undefined' && Array.isArray(StateMemory.installed_plugins)
				? StateMemory.installed_plugins
				: null;
			let plugins_list = typeof Plugins !== 'undefined' && Array.isArray(Plugins.installed)
				? Plugins.installed
				: null;
			let persistent_path = ensurePersistentPluginFiles(current_plugin);
			if (current_plugin && persistent_path) {
				current_plugin.path = persistent_path;
				current_plugin.source = 'file';
				current_plugin.has_changelog = true;
				current_plugin.new_repository_format = true;
				refreshPluginPageText(current_plugin, persistent_path);
			}
			let state_entry = state_list ? state_list.find(plugin => plugin && plugin.id === PLUGIN_ID) : null;
			let installed_entry = installed.find(plugin => plugin && plugin.id === PLUGIN_ID);
			let plugin_path = persistent_path || pickPersistentPluginPath(installed_entry, state_entry, current_plugin);
			let entry_data = {
				id: PLUGIN_ID,
				version: PLUGIN_VERSION,
				source: 'file',
				path: plugin_path
			};

			upsertPluginInstallation(installed, entry_data);
			if (typeof StateMemory !== 'undefined' && Array.isArray(StateMemory.installed_plugins)) {
				upsertPluginInstallation(StateMemory.installed_plugins, entry_data);
				if (typeof StateMemory.save === 'function') StateMemory.save('installed_plugins');
			} else {
				localStorage.setItem(install_key, JSON.stringify(installed));
			}
			if (plugins_list) upsertPluginInstallation(plugins_list, entry_data);
		} catch (error) {
			console.warn('Could not remember Minecraft OBJ Cubizer installation', error);
		}
	}

	function scheduleRememberPluginInstallation() {
		rememberPluginInstallation();
		if (typeof setTimeout === 'function') {
			setTimeout(rememberPluginInstallation, 0);
			setTimeout(rememberPluginInstallation, 100);
			setTimeout(rememberPluginInstallation, 1000);
		}
	}

	addTranslations();
	DirectMinecraftImporter.addTranslations();
	addMergedTranslations();
	addDirectImportHotfixTranslations();

	Plugin.register(PLUGIN_ID, {
		title: translate('title'),
		author: 'Ylong',
		description: PLUGIN_DESCRIPTION,
		icon: 'icon.svg',
		tags: ['Minecraft', 'Java Edition', 'Import', 'Schematic', 'Litematic'],
		version: PLUGIN_VERSION,
		min_version: '4.8.0',
		has_changelog: true,
		variant: 'desktop',
		oninstall() {
			scheduleRememberPluginInstallation();
		},
		onload() {
			try {
				scheduleRememberPluginInstallation();
				cleanupForeignPluginFeatures();
				deleteStalePluginActions();
				registerProperties();
				loadStoredOptions();
				DirectMinecraftImporter.loadStoredOptions();
				import_action = new Action('import_minecraft_obj_cubes', {
					name: translate('action.import'),
					description: translate('action.import.desc'),
					icon: 'view_in_ar',
					category: 'tools',
					plugin: PLUGIN_ID,
					click: pickOBJ
				});
				settings_action = new Action('open_minecraft_obj_cubizer_settings', {
					name: translate('action.settings'),
					description: translate('action.settings.desc'),
					icon: 'settings',
					category: 'tools',
					plugin: PLUGIN_ID,
					click: showSettingsDialog
				});
				export_textures_action = new Action('export_minecraft_obj_textures', {
					name: translate('action.export_textures'),
					description: translate('action.export_textures.desc'),
					icon: 'folder',
					category: 'tools',
					plugin: PLUGIN_ID,
					condition: () => Project && Texture.all.length,
					click: exportObjTextures
				});
				direct_import_action = new Action('import_minecraft_structure_cubes', {
					name: directTranslate('action.import'),
					description: directTranslate('action.import.desc'),
					icon: 'account_tree',
					category: 'tools',
					plugin: PLUGIN_ID,
					click: DirectMinecraftImporter.pickMinecraftStructure
				});
				direct_settings_action = new Action('open_minecraft_structure_import_settings', {
					name: directTranslate('action.settings'),
					description: directTranslate('action.settings.desc'),
					icon: 'settings',
					category: 'tools',
					plugin: PLUGIN_ID,
					click: DirectMinecraftImporter.showSettingsDialog
				});
				createPluginMenu();
				compile_listener = Codecs.java_block?.on('compile', patchAllJavaTextureNamespaces);
			} catch (error) {
				console.error('Minecraft OBJ Cubizer failed to load', error);
			}
		},
		onunload() {
			deletePluginMenu();
			if (import_action) import_action.delete();
			if (settings_action) settings_action.delete();
			if (export_textures_action) export_textures_action.delete();
			if (direct_import_action) direct_import_action.delete();
			if (direct_settings_action) direct_settings_action.delete();
			if (compile_listener) compile_listener.delete();
			unregisterProperties();
		}
	});
})();
