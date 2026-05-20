(() => {
	'use strict';

	const PLUGIN_ID = 'direct_minecraft_importer_prototype';
	const TRANSLATION_PREFIX = `plugin.${PLUGIN_ID}.`;
	const STORAGE_KEY = `${PLUGIN_ID}_options`;
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
			[TRANSLATION_PREFIX + 'title']: 'Direct Minecraft Import Prototype',
			[TRANSLATION_PREFIX + 'action.import']: 'Import Minecraft Structure Prototype',
			[TRANSLATION_PREFIX + 'action.settings']: 'Minecraft Structure Import Settings',
			[TRANSLATION_PREFIX + 'dialog.import_title']: 'Import Minecraft Structure Prototype',
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
			[TRANSLATION_PREFIX + 'message.desktop_only']: 'This prototype needs the Blockbench desktop app.',
			[TRANSLATION_PREFIX + 'message.no_project']: 'No project is open. Enable automatic project creation or create/open a Java Block project first.',
			[TRANSLATION_PREFIX + 'message.empty']: 'No blocks were found in this file.',
			[TRANSLATION_PREFIX + 'message.pick_texture_source']: 'Select a resource pack root folder, or paste a Minecraft jar path in settings',
			[TRANSLATION_PREFIX + 'message.texture_source_saved']: 'Texture source saved.',
			[TRANSLATION_PREFIX + 'message.import_failed']: 'Import failed:\n\n%0',
			[TRANSLATION_PREFIX + 'message.summary']: 'Imported %0 cubes from %1 non-air blocks.\n\nFormat: %2\nTextures: %3\nSkipped hidden blocks: %4\nTruncated by limit: %5\nBlocks rendered from model JSON: %6\nFallback full cubes: %7\n\nBlock entity data such as chest contents is not read.',
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
			[TRANSLATION_PREFIX + 'message.summary']: '已从 %1 个非空气方块导入 %0 个 Blockbench 方块。\n\n格式：%2\n贴图：%3\n跳过的隐藏方块：%4\n因数量限制截断：%5\n使用模型 JSON 的方块：%6\n退回完整方块：%7\n\n不会读取箱子物品、告示牌文字等方块实体数据。'
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
				importer_options = sanitizeOptions(Object.assign({}, DEFAULT_OPTIONS, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}));
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

	function findTextureFileInFolder(context, info, options) {
		if (!context || context.type !== 'folder') return '';
		let root = context.path;
		let fs = context.fs;
		let path_module = context.path_module;
		let candidates = getTextureCandidates(info, options);
		for (let candidate of candidates) {
			let full_path = joinPath(path_module, root, candidate.replace(/\//g, path_module.sep));
			if (isFile(fs, full_path)) return full_path;
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

	function loadTextureImage(texture, info, options) {
		let context = getTextureSourceContext(options);
		let file_path = findTextureFileInFolder(context, info, options);
		if (file_path) {
			texture.fromPath(file_path);
			return true;
		}

		let zip_data = findTextureDataInZip(context, info, options);
		if (zip_data) {
			texture.fromDataURL(toDataUrl(zip_data, 'image/png'));
			return true;
		}

		if (typeof texture.fromDefaultPack === 'function' && texture.fromDefaultPack()) {
			return true;
		}

		texture.loadEmpty(3);
		return false;
	}

	function createTextureForInfo(info, options, texture_map, new_textures) {
		let texture_key = `${info.namespace || 'minecraft'}:${info.full_path || info.path}`;
		if (texture_map[texture_key]) return texture_map[texture_key];

		let texture_id = uniqueTextureId(info.path || info.full_path || 'texture');
		let texture_name = pathBasename(info.path || info.full_path || texture_id) + '.png';
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
		if (texture.flags) texture.flags.add(PLUGIN_ID);
		texture.add(false, true);
		texture_map[texture_key] = texture;
		new_textures.push(texture);
		return texture;
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
				let full_path = joinPath(context.path_module, context.path, asset_path.replace(/\//g, context.path_module.sep));
				if (isFile(context.fs, full_path)) text = context.fs.readFileSync(full_path, 'utf8');
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

	function selectBlockModelRefs(state, options) {
		if (!options.use_block_models) return [];
		let parsed = parseBlockState(state);
		let context = getTextureSourceContext(options);
		let blockstate_path = `assets/${parsed.namespace}/blockstates/${parsed.name}.json`;
		let blockstate = readJsonAsset(context, blockstate_path);
		if (!blockstate && parsed.namespace !== 'minecraft') {
			blockstate = readJsonAsset(context, `assets/minecraft/blockstates/${parsed.name}.json`);
		}
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
			let texture = resolved_texture.link
				? createTextureForInfo(textureInfoFromLink(resolved_texture.link, block.state, resolved_texture.namespace), options, texture_map, new_textures)
				: createTextureForInfo(textureInfoFromState(block.state), options, texture_map, new_textures);
			faces[output_direction] = {
				uv: Array.isArray(read_face.uv) ? read_face.uv.slice() : [0, 0, 16, 16],
				texture: texture ? texture.uuid : false,
				rotation: toNumber(read_face.rotation, 0)
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
		origin = origin || [0, 0];
		let u = origin[0];
		let v = origin[1];
		let w = Math.abs(to[0] - from[0]);
		let h = Math.abs(to[1] - from[1]);
		let d = Math.abs(to[2] - from[2]);
		return {
			west: [u, v + d, u + d, v + d + h],
			north: [u + d, v + d, u + d + w, v + d + h],
			east: [u + d + w, v + d, u + d + w + d, v + d + h],
			south: [u + d + w + d, v + d, u + d + w + d + w, v + d + h],
			up: [u + d, v, u + d + w, v + d],
			down: [u + d + w, v, u + d + w + w, v + d]
		};
	}

	function manualCubeFaces(texture, options, uv_map, face_textures) {
		let faces = {};
		uv_map = uv_map || {};
		face_textures = face_textures || {};
		FACE_DIRECTIONS.forEach(direction => {
			let face_texture = Object.prototype.hasOwnProperty.call(face_textures, direction) ? face_textures[direction] : texture;
			let uv = uv_map[direction] || uv_map.all || [0, 0, 16, 16];
			faces[direction] = {
				uv: uv.slice ? uv.slice() : [0, 0, 16, 16],
				texture: face_texture ? face_texture.uuid : false
			};
			if (options.cull_faces) faces[direction].cullface = direction;
		});
		return faces;
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
				uv: boxUvForCuboid([1, 0, 1], [15, 10, 15], [0, 19])
			},
			{
				name: `${parsed.name}_builtin_lid`,
				from: [1, 10, 1],
				to: [15, 15, 15],
				texture,
				uv: boxUvForCuboid([1, 10, 1], [15, 15, 15], [0, 0])
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
			specs.push({name: `${parsed.name}_builtin_board`, from: [2, 4, 0], to: [14, 12, 2], texture, rotate_y, uv: boxUvForCuboid([2, 4, 0], [14, 12, 2], [0, 0])});
			specs.push({name: `${parsed.name}_builtin_handle`, from: [7, 6, 2], to: [9, 10, 4], texture, rotate_y, uv: boxUvForCuboid([7, 6, 2], [9, 10, 4], [0, 14])});
			if (hanging) {
				specs.push({name: `${parsed.name}_builtin_chain_left`, from: [3, 12, 0], to: [4, 16, 2], texture, rotate_y, uv: boxUvForCuboid([3, 12, 0], [4, 16, 2], [28, 0])});
				specs.push({name: `${parsed.name}_builtin_chain_right`, from: [12, 12, 0], to: [13, 16, 2], texture, rotate_y, uv: boxUvForCuboid([12, 12, 0], [13, 16, 2], [28, 0])});
			}
		} else {
			let cube_rotation_y = standingRotationYaw(parsed.properties.rotation);
			let board_from = hanging ? [2, 4, 7] : [2, 7, 7];
			let board_to = hanging ? [14, 12, 9] : [14, 15, 9];
			specs.push({name: `${parsed.name}_builtin_board`, from: board_from, to: board_to, texture, cube_rotation_y, uv: boxUvForCuboid(board_from, board_to, [0, 0])});
			if (hanging) {
				specs.push({name: `${parsed.name}_builtin_chain_left`, from: [3, 12, 7], to: [4, 16, 9], texture, cube_rotation_y, uv: boxUvForCuboid([3, 12, 7], [4, 16, 9], [28, 0])});
				specs.push({name: `${parsed.name}_builtin_chain_right`, from: [12, 12, 7], to: [13, 16, 9], texture, cube_rotation_y, uv: boxUvForCuboid([12, 12, 7], [13, 16, 9], [28, 0])});
			} else {
				specs.push({name: `${parsed.name}_builtin_post`, from: [7, 0, 7], to: [9, 7, 9], texture, cube_rotation_y, uv: boxUvForCuboid([7, 0, 7], [9, 7, 9], [0, 14])});
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
				uv: boxUvForCuboid([0, 3, 0], [16, 9, 16], part === 'head' ? [0, 0] : [0, 22])
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
		let specs = [
			{name: 'decorated_pot_builtin_foot', from: [5, 0, 5], to: [11, 1, 11], texture: side_texture, face_textures: top_bottom, rotate_y, uv: boxUvForCuboid([5, 0, 5], [11, 1, 11], [0, 0])},
			{name: 'decorated_pot_builtin_lower', from: [3, 1, 3], to: [13, 4, 13], texture: side_texture, face_textures: top_bottom, rotate_y, uv: boxUvForCuboid([3, 1, 3], [13, 4, 13], [0, 0])},
			{name: 'decorated_pot_builtin_body', from: [2, 4, 2], to: [14, 13, 14], texture: side_texture, face_textures: top_bottom, rotate_y, uv: boxUvForCuboid([2, 4, 2], [14, 13, 14], [0, 0])},
			{name: 'decorated_pot_builtin_neck', from: [4, 13, 4], to: [12, 16, 12], texture: side_texture, face_textures: top_bottom, rotate_y, uv: boxUvForCuboid([4, 13, 4], [12, 16, 12], [0, 0])}
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
			{name: `${parsed.name}_builtin_body`, from: [5, 3, 5], to: [11, 10, 11], texture, rotate_y, uv: boxUvForCuboid([5, 3, 5], [11, 10, 11], [16, 16])},
			{name: `${parsed.name}_builtin_head`, from: [4, 10, 4], to: [12, 16, 12], texture, rotate_y, uv: boxUvForCuboid([4, 10, 4], [12, 16, 12], [0, 0])},
			{name: `${parsed.name}_builtin_nose`, from: [7, 11, 2], to: [9, 13, 4], texture, rotate_y, uv: boxUvForCuboid([7, 11, 2], [9, 13, 4], [32, 0])},
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
				specs.push({name: `${name}_board`, from: [2, 4, 0], to: [14, 12, 2], texture, rotate_y, uv: boxUvForCuboid([2, 4, 0], [14, 12, 2], [0, 0])});
				specs.push({name: `${name}_support`, from: [7, 6, 2], to: [9, 10, 4], texture, rotate_y, uv: boxUvForCuboid([7, 6, 2], [9, 10, 4], [0, 14])});
				if (hanging) {
					specs.push({name: `${name}_chain_left`, from: [3, 12, 0], to: [4, 16, 2], texture, rotate_y, uv: boxUvForCuboid([3, 12, 0], [4, 16, 2], [28, 0])});
					specs.push({name: `${name}_chain_right`, from: [12, 12, 0], to: [13, 16, 2], texture, rotate_y, uv: boxUvForCuboid([12, 12, 0], [13, 16, 2], [28, 0])});
				}
			} else {
				let board_from = hanging ? [2, 4, 7] : [2, 7, 7];
				let board_to = hanging ? [14, 12, 9] : [14, 15, 9];
				specs.push({name: `${name}_board`, from: board_from, to: board_to, texture, cube_rotation_y, uv: boxUvForCuboid(board_from, board_to, [0, 0])});
				if (hanging) {
					specs.push({name: `${name}_chain_left`, from: [3, 12, 7], to: [4, 16, 9], texture, cube_rotation_y, uv: boxUvForCuboid([3, 12, 7], [4, 16, 9], [28, 0])});
					specs.push({name: `${name}_chain_right`, from: [12, 12, 7], to: [13, 16, 9], texture, cube_rotation_y, uv: boxUvForCuboid([12, 12, 7], [13, 16, 9], [28, 0])});
				} else {
					specs.push({name: `${name}_post`, from: [7, 0, 7], to: [9, 7, 9], texture, cube_rotation_y, uv: boxUvForCuboid([7, 0, 7], [9, 7, 9], [0, 14])});
				}
			}
		} else if (isBedBlockName(name)) {
			let color = colorFromBlockName(name, 'bed', 'white');
			let texture = createTextureForInfo(textureInfoForFullPath(parsed.namespace, name, `entity/bed/${color}`), options, texture_map, new_textures);
			let rotate_y = facingYaw(parsed.properties.facing || 'north');
			let bed_part = parsed.properties.part === 'head' ? 'head' : 'foot';
			let mattress_uv_origin = bed_part === 'head' ? [0, 0] : [0, 22];
			specs.push({name: `${name}_${bed_part}`, from: [0, 3, 0], to: [16, 9, 16], texture, rotate_y, uv: boxUvForCuboid([0, 3, 0], [16, 9, 16], mattress_uv_origin)});
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
			specs.push({name: `${name}_body`, from: [2, 3, 2], to: [14, 14, 14], texture: side_texture, face_textures: top_bottom, rotate_y, uv: boxUvForCuboid([2, 3, 2], [14, 14, 14], [0, 0])});
			specs.push({name: `${name}_neck`, from: [4, 14, 4], to: [12, 16, 12], texture: side_texture, face_textures: top_bottom, rotate_y, uv: boxUvForCuboid([4, 14, 4], [12, 16, 12], [0, 0])});
			specs.push({name: `${name}_base`, from: [4, 0, 4], to: [12, 3, 12], texture: side_texture, face_textures: top_bottom, rotate_y, uv: boxUvForCuboid([4, 0, 4], [12, 3, 12], [0, 0])});
		} else if (isCopperGolemStatueName(name)) {
			let texture = createTextureForInfo(copperGolemTextureInfo(parsed), options, texture_map, new_textures);
			let rotate_y = facingYaw(parsed.properties.facing || 'north');
			specs.push({name: `${name}_base`, from: [3, 0, 3], to: [13, 2, 13], texture, rotate_y, uv: boxUvForCuboid([3, 0, 3], [13, 2, 13], [0, 48])});
			specs.push({name: `${name}_head`, from: [4, 10, 4], to: [12, 16, 12], texture, rotate_y, uv: boxUvForCuboid([4, 10, 4], [12, 16, 12], [0, 0])});
			specs.push({name: `${name}_body`, from: [5, 3, 5], to: [11, 10, 11], texture, rotate_y, uv: boxUvForCuboid([5, 3, 5], [11, 10, 11], [16, 16])});
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

		let occupied = new Set(source_blocks.map(keyForBlock));
		let solid_occupied = new Set(source_blocks.filter(block => isLikelyFullCubeState(block.state)).map(keyForBlock));
		let offset = getImportOffset(source_blocks, options);
		let hidden = 0;
		let truncated = 0;
		let model_blocks = 0;
		let fallback_blocks = 0;

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

			let builtin_result = createBuiltinBlockEntityCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, options.cube_limit);
			if (builtin_result.used_model) {
				model_blocks++;
				truncated += builtin_result.truncated;
				continue;
			}

			let special_result = createSpecialBlockEntityCubesForBlock(block, options, offset, root_group, texture_map, new_textures, new_cubes, options.cube_limit);
			if (special_result.used_model) {
				model_blocks++;
				truncated += special_result.truncated;
				continue;
			}

			let model_result = createModelCubesForBlock(block, options, offset, solid_occupied, root_group, texture_map, new_textures, new_cubes, options.cube_limit);
			if (model_result.used_model) {
				model_blocks++;
				hidden += model_result.created ? 0 : model_result.hidden;
				truncated += model_result.truncated;
				continue;
			}

			let visible_faces = visibleFacesForBlock(block, occupied, options);
			if (!hasAnyVisibleFace(visible_faces)) {
				hidden++;
				continue;
			}
			createFallbackCube(block, visible_faces, options, offset, root_group, texture_map, new_textures, new_cubes, new_cubes.length);
			fallback_blocks++;
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
			fallback_blocks
		};
	}

	function showImportSummary(structure, stats) {
		if (!stats) return;
		Blockbench.showMessageBox({
			title: translate('title'),
			icon: 'view_in_ar',
			width: 560,
			message: translate('message.summary', [
				stats.cubes,
				stats.source_blocks,
				structure.format,
				stats.textures,
				stats.hidden,
				stats.truncated,
				stats.model_blocks || 0,
				stats.fallback_blocks || 0
			])
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
			id: `${PLUGIN_ID}_import`,
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
			resource_id: 'minecraft_structure_prototype',
			type: 'Minecraft Structure',
			extensions: ['schematic', 'schem', 'litematic', 'nbt', 'mca'],
			readtype: 'binary',
			multiple: false
		}, files => {
			if (files && files[0]) showImportDialog(files[0]);
		});
	}

	function pickTextureSource() {
		if (!isApp) {
			Blockbench.showQuickMessage(translate('message.desktop_only'), 2500);
			return;
		}
		let texture_source_path = Blockbench.pickDirectory({
			resource_id: 'texture',
			title: translate('message.pick_texture_source')
		});
		if (!texture_source_path) return;
		saveOptions({texture_source_path});
		texture_source_cache = {path: null, context: null};
		asset_cache = {};
		model_cache = {};
		Blockbench.showQuickMessage(translate('message.texture_source_saved'), 2500);
	}

	function showSettingsDialog() {
		let options = sanitizeOptions(importer_options);
		new Dialog({
			id: `${PLUGIN_ID}_settings`,
			title: translate('dialog.settings_title'),
			width: 520,
			form: createOptionsForm(options),
			onConfirm(form) {
				saveOptions(Object.assign({}, options, form));
				Blockbench.showQuickMessage(translate('message.settings_saved'), 2500);
			}
		}).show();
	}

	function isPrototypeTexture(texture) {
		return !!texture && (
			texture[IMPORTED_PROPERTY] ||
			(texture.flags && texture.flags.has(PLUGIN_ID))
		);
	}

	function patchJavaTextureNamespaces(event) {
		if (!event || !event.model || !event.model.textures) return;
		Texture.all.forEach(texture => {
			if (!isPrototypeTexture(texture)) return;
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

	function registerProperties() {
		if (typeof Property !== 'undefined' && typeof Texture !== 'undefined' && !Texture.properties?.[IMPORTED_PROPERTY]) {
			texture_imported_property = new Property(Texture, 'boolean', IMPORTED_PROPERTY, {exposed: false});
		}
	}

	function unregisterProperties() {
		if (texture_imported_property) texture_imported_property.delete();
	}

	addTranslations();

	Plugin.register(PLUGIN_ID, {
		title: translate('title'),
		author: 'Ylong',
		description: 'Experimental direct importer for Minecraft schematic, litematic, structure NBT, and region MCA files. / Minecraft 建筑、schematic、litematic、结构 NBT、MCA 区域文件直接导入实验版。',
		about: 'This prototype reads Minecraft NBT-based structure files directly and creates Blockbench Java cubes. It currently treats blocks as full cubes and skips entities/block entities. / 该实验版会直接读取 Minecraft 的 NBT 建筑文件并生成 Blockbench Java 方块。目前先按完整方块处理，暂不转换实体和方块实体。',
		icon: 'view_in_ar',
		tags: ['Minecraft', 'NBT', 'Import', 'Prototype'],
		version: '0.1.0',
		min_version: '4.8.0',
		variant: 'desktop',
		onload() {
			registerProperties();
			loadStoredOptions();
			import_action = new Action('import_minecraft_structure_prototype', {
				name: translate('action.import'),
				icon: 'view_in_ar',
				category: 'file',
				click: pickMinecraftStructure
			});
			settings_action = new Action('minecraft_structure_import_prototype_settings', {
				name: translate('action.settings'),
				icon: 'settings',
				category: 'file',
				click: showSettingsDialog
			});
			texture_source_action = new Action('minecraft_structure_import_prototype_texture_source', {
				name: translate('form.texture_source_path'),
				icon: 'folder',
				category: 'file',
				click: pickTextureSource
			});
			MenuBar.addAction(import_action, 'file.import.8');
			MenuBar.addAction(settings_action, 'file.import.9');
			MenuBar.addAction(texture_source_action, 'file.import.10');
			compile_listener = Codecs.java_block?.on('compile', patchJavaTextureNamespaces);
		},
		onunload() {
			if (import_action) import_action.delete();
			if (settings_action) settings_action.delete();
			if (texture_source_action) texture_source_action.delete();
			if (compile_listener) compile_listener.delete();
			unregisterProperties();
		}
	});
})();
