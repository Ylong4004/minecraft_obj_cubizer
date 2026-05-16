(() => {
	const PLUGIN_ID = 'minecraft_obj_cubizer';
	const FACE_DIRECTIONS = ['north', 'east', 'south', 'west', 'up', 'down'];
	const EPSILON = 0.00001;
	const JAVA_COORDINATE_MIN = -16;
	const JAVA_COORDINATE_MAX = 32;
	const TRANSLATION_PREFIX = `plugin.${PLUGIN_ID}.`;
	const PROJECT_OPTIONS_PROPERTY = `${PLUGIN_ID}_options`;
	const IMPORTED_PROPERTY = `${PLUGIN_ID}_imported`;
	const SOURCE_PATH_PROPERTY = `${PLUGIN_ID}_source_path`;
	const STORAGE_KEY = `${PLUGIN_ID}_options`;
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
	const PLUGIN_DESCRIPTION =
		'将 Minecraft 风格的 OBJ 建筑导出转换为带纹理分配的 Java 版 Blockbench 方块模型。\n' +
		'Convert Minecraft-style OBJ exports into Java Blockbench cube models with texture assignments.';
	const PLUGIN_ABOUT =
		'导入由 Minecraft 方块生成的 OBJ，重建轴对齐长方体，读取 MTL 贴图，并添加到当前项目中，便于导出资源包 JSON。\n\n' +
		'Imports an OBJ made from Minecraft blocks, rebuilds axis-aligned cuboids, loads MTL textures, and adds them to the current project for resource-pack JSON export.';

	let import_action;
	let settings_action;
	let export_textures_action;
	let compile_listener;
	let project_options_property;
	let texture_imported_property;
	let texture_source_path_property;
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
			[TRANSLATION_PREFIX + 'message.bounds_warning']: 'The current scale %0 produces model coordinates outside the common Java Block/Item range -16 to 32.\n\nCurrent bounds:\n%1\n\nRecommended scale: %2\nRecommended bounds:\n%3\n\nFor Minecraft building OBJ files, scale 1 usually keeps one Minecraft block as one Blockbench unit. Scale 16 is normally too large for Java model JSON.',
			[TRANSLATION_PREFIX + 'message.summary']: 'Imported %0 cubes from %1 OBJ faces.\n\nTextures: %2\nSkipped non-cube faces: %3\n\nUse File > Export > Java Block/Item Model to save the JSON. Use File > Export > Export OBJ Textures to Resource Pack to copy the PNG textures.',
			[TRANSLATION_PREFIX + 'message.settings_saved']: 'Settings saved. Updated textures: %0. Updated cubes: %1.',
			[TRANSLATION_PREFIX + 'message.import_failed']: 'Import failed:\n\n%0'
		});
		Language.addTranslations('zh', {
			[TRANSLATION_PREFIX + 'title']: 'Minecraft OBJ 方块转换器',
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
			[TRANSLATION_PREFIX + 'message.bounds_warning']: '当前缩放 %0 会生成超出 Java Block/Item 常见范围 -16 到 32 的模型坐标。\n\n当前范围：\n%1\n\n推荐缩放：%2\n推荐范围：\n%3\n\n对于 Minecraft 建筑 OBJ，缩放 1 通常表示一个 Minecraft 方块等于一个 Blockbench 单位；缩放 16 对 Java 模型 JSON 通常太大。',
			[TRANSLATION_PREFIX + 'message.summary']: '已从 %1 个 OBJ 面导入 %0 个方块。\n\n贴图：%2\n跳过的非方块面：%3\n\n使用“文件 > 导出 > Java Block/Item Model”保存 JSON；使用“文件 > 导出 > 导出 OBJ 贴图到资源包”复制 PNG 贴图。',
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
			[TRANSLATION_PREFIX + 'message.bounds_warning']: '目前縮放 %0 會生成超出 Java Block/Item 常見範圍 -16 到 32 的模型座標。\n\n目前範圍：\n%1\n\n推薦縮放：%2\n推薦範圍：\n%3\n\n對於 Minecraft 建築 OBJ，縮放 1 通常表示一個 Minecraft 方塊等於一個 Blockbench 單位；縮放 16 對 Java 模型 JSON 通常太大。',
			[TRANSLATION_PREFIX + 'message.summary']: '已從 %1 個 OBJ 面匯入 %0 個方塊。\n\n貼圖：%2\n略過的非方塊面：%3\n\n使用「File > Export > Java Block/Item Model」儲存 JSON；使用「File > Export > 匯出 OBJ 貼圖到資源包」複製 PNG 貼圖。',
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
		}
		if (typeof Cube !== 'undefined' && !Cube.properties?.[IMPORTED_PROPERTY]) {
			cube_imported_property = new Property(Cube, 'boolean', IMPORTED_PROPERTY, {exposed: false});
		}
	}

	function unregisterProperties() {
		if (project_options_property) project_options_property.delete();
		if (texture_imported_property) texture_imported_property.delete();
		if (texture_source_path_property) texture_source_path_property.delete();
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

	addTranslations();

	Plugin.register(PLUGIN_ID, {
		title: translate('title'),
		author: 'Ylong',
		description: PLUGIN_DESCRIPTION,
		about: PLUGIN_ABOUT,
		icon: 'view_in_ar',
		tags: ['Minecraft', 'Java Edition', 'Import'],
		version: '0.1.3',
		min_version: '4.8.0',
		variant: 'desktop',
		onload() {
			registerProperties();
			loadStoredOptions();
			import_action = new Action('import_minecraft_obj_cubes', {
				name: translate('action.import'),
				icon: 'view_in_ar',
				category: 'file',
				click: pickOBJ
			});
			settings_action = new Action('open_minecraft_obj_cubizer_settings', {
				name: translate('action.settings'),
				icon: 'settings',
				category: 'file',
				click: showSettingsDialog
			});
			export_textures_action = new Action('export_minecraft_obj_textures', {
				name: translate('action.export_textures'),
				icon: 'folder',
				category: 'file',
				condition: () => Project && Texture.all.length,
				click: exportObjTextures
			});
			MenuBar.addAction(import_action, 'file.import.6');
			MenuBar.addAction(settings_action, 'file.import.7');
			MenuBar.addAction(export_textures_action, 'file.export.1');
			compile_listener = Codecs.java_block?.on('compile', patchJavaTextureNamespaces);
		},
		onunload() {
			if (import_action) import_action.delete();
			if (settings_action) settings_action.delete();
			if (export_textures_action) export_textures_action.delete();
			if (compile_listener) compile_listener.delete();
			unregisterProperties();
		}
	});
})();
