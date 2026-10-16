const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

function instrument(source) {
  const direct = ['sanitizeOptions', 'blockMatchesFilters', 'parseClassicSchematic', 'parseLitematic', 'parseNbtStructure',
    'decodePackedCompact', 'decodePackedPadded', 'extractPaletteSectionBlocks', 'parseAnvilRegion',
    'encodeRgbaPng', 'decodePngToRgba', 'pngChunk', 'fullCubeTemplate', 'growFullCubeBox', 'createMergedCube',
    'importBlocksIntoProject', 'createModelElementFaces', 'createTextureForInfo', 'resolveTextureReference', 'javaUvForTexture',
    'getStructureWorkerSource', 'unpackWorkerStructure', 'createZipIndex', 'extractZipEntry', 'cropTextureFace', 'animationPartForBlock',
    'showStructurePreview', 'renderStructurePreview', 'disposeStructurePreview', 'createStructureWorkerSession', 'openStructureWorker'];
  source = source.replace('\t\treturn {\n\t\t\taddTranslations,', `\t\tglobalThis.__direct = {${direct.join(',')}};\n\t\treturn {\n\t\t\taddTranslations,`);
  const outer = ['beginImportTask', 'yieldImport', 'endImportTask', 'uvForProject', 'compiledTextureLink', 'setCompiledTextureLink', 'importOBJAsCubes', 'buildViewportBatch', 'viewportBatchStatus'];
  const end = source.lastIndexOf('\n})();');
  return source.slice(0, end) + `\nglobalThis.__outer = {${outer.join(',')}};` + source.slice(end);
}

function createHost() {
  let seq = 0;
  class Group {
    static all = [];
    constructor(data) { Object.assign(this, typeof data === 'string' ? {name: data} : data); this.children = []; this.uuid = 'g' + seq++; }
    sanitizeName() { this.name = this.name.replace(/[^a-zA-Z0-9_]/g, '_'); }
    createUniqueName() { const base = this.name; let n = 1; while (Group.all.some(g => g.name === this.name)) this.name = base + '_' + n++; }
    addTo(parent) { this.parent = parent; parent.children.push(this); return this; }
    init() { Group.all.push(this); return this; }
    remove() { Group.all.splice(Group.all.indexOf(this), 1); if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); }
  }
  class Cube {
    static all = [];
    constructor(data) { Object.assign(this, data); this.uuid = 'c' + seq++; }
    addTo(parent) { this.parent = parent; parent.children.push(this); return this; }
    init() { Cube.all.push(this); return this; }
    remove() { Cube.all.splice(Cube.all.indexOf(this), 1); this.parent?.children.splice(this.parent.children.indexOf(this), 1); }
  }
  class Texture {
    static all = [];
    constructor(data) { Object.assign(this, data); this.uuid = 't' + seq++; this.flags = new Set(); this.uv_width = this.uv_height = 16; }
    fromDataURL(source) { this.source = source; return this; }
    fromPath(file) { this.path = file; this.source = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64'); return this; }
    loadEmpty() { this.error = 3; return this; }
    add() { Texture.all.push(this); return this; }
    enableParticle() { this.particle = true; }
  }
  class Dialog {
    constructor(options) { Object.assign(this, options); this.progress_bar = {setProgress() {}}; this.content_vue = {status: ''}; }
    show() { return this; }
    hide() { this.hidden = true; }
  }
  const context = {
    console, Buffer, Uint8Array, ArrayBuffer, DataView, TextDecoder, TextEncoder, require, setTimeout, clearTimeout, Group, Cube, Texture, Dialog,
    isApp: true, Language: {addTranslations() {}}, tl: key => key,
    Plugin: {register(id, data) { context.plugin = data; }},
    Project: {name: 'existing', texture_width: 128, texture_height: 64, box_uv: true, saved: true},
    Format: {id: 'animated-java:format/blueprint', bone_rig: true, optional_box_uv: true, edit_mode: true},
    Blockbench: {showMessageBox() {}, showQuickMessage() {}}, Canvas: {updateView() {}, updateAll() {}},
    Validator: {validate() {}}, updateSelection() {},
    Undo: {
      initEdit(aspects) { this.current_save = {aspects, cubes: Cube.all.slice(), textures: Texture.all.slice(), groups: Group.all.slice()}; },
      finishEdit() { delete this.current_save; this.completed = (this.completed || 0) + 1; },
      cancelEdit(revert) { assert.equal(revert, true); Cube.all = this.current_save.cubes; Texture.all = this.current_save.textures; Group.all = this.current_save.groups; delete this.current_save; }
    }
  };
  vm.createContext(context);
  vm.runInContext('Math.clamp = (value, min, max) => Math.min(max, Math.max(min, value));', context);
  vm.runInContext(instrument(fs.readFileSync(path.join(__dirname, '../minecraft_obj_cubizer/minecraft_obj_cubizer.js'), 'utf8')), context);
  return context;
}

const plain = value => JSON.parse(JSON.stringify(value));
module.exports = {createHost, instrument};
const fixture = require.main === module ? fs.mkdtempSync(path.join(os.tmpdir(), 'cubizer-test-')) : null;
let passed = 0;
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }

function createAssets(host) {
  const root = path.join(fixture, 'assets/minecraft');
  for (const folder of ['blockstates', 'models/block', 'textures/block']) fs.mkdirSync(path.join(root, folder), {recursive: true});
  const faces = Object.fromEntries(['north', 'south', 'east', 'west', 'up', 'down'].map(d => [d, {texture: '#all', cullface: d, uv: [0, 0, 16, 16]}]));
  for (const name of ['stone', 'glass']) {
    fs.writeFileSync(path.join(root, `blockstates/${name}.json`), JSON.stringify({variants: {'': {model: `minecraft:block/${name}`}}}));
    fs.writeFileSync(path.join(root, `models/block/${name}.json`), JSON.stringify({textures: {all: `minecraft:block/${name}`}, elements: [{from: [0, 0, 0], to: [16, 16, 16], faces}]}));
    const rgba = new Uint8Array(16 * 16 * 4);
    for (let i = 0; i < rgba.length; i += 4) { rgba[i] = (i / 4) % 16; rgba[i + 1] = Math.floor(i / 64); rgba[i + 2] = 128; rgba[i + 3] = name === 'glass' ? 128 : 255; }
    fs.writeFileSync(path.join(root, `textures/block/${name}.png`), host.__direct.encodeRgbaPng(16, 16, rgba));
  }
  const defaultFaces = Object.fromEntries(Object.keys(faces).map(d => [d, {texture: '#all', cullface: d}]));
  function model(name, elements, texture = 'stone', variant = {}) {
    fs.writeFileSync(path.join(root, `blockstates/${name}.json`), JSON.stringify({variants: {'': {model: `minecraft:block/${name}`, ...variant}}}));
    fs.writeFileSync(path.join(root, `models/block/${name}.json`), JSON.stringify({textures: {all: `minecraft:block/${texture}`}, elements}));
  }
  model('slab_test', [{from: [0, 0, 0], to: [16, 8, 16], faces: defaultFaces}]);
  model('stairs_test', [{from: [0, 0, 0], to: [16, 8, 16], faces: defaultFaces}, {from: [8, 8, 0], to: [16, 16, 16], faces: defaultFaces}]);
  model('rotated_test', [{from: [0, 0, 0], to: [16, 16, 16], faces}], 'stone', {y: 90, uvlock: true});
  model('tinted_test', [{from: [0, 0, 0], to: [16, 16, 16], faces: Object.fromEntries(Object.entries(faces).map(([d, f]) => [d, {...f, tintindex: 0}]))}]);
  const animated = new Uint8Array(16 * 32 * 4);
  for (let i = 0; i < animated.length; i += 4) { animated[i] = i < 16 * 16 * 4 ? 20 : 210; animated[i + 3] = 255; }
  fs.writeFileSync(path.join(root, 'textures/block/animated_test.png'), host.__direct.encodeRgbaPng(16, 32, animated));
  fs.writeFileSync(path.join(root, 'textures/block/animated_test.png.mcmeta'), JSON.stringify({animation: {frametime: 5, frames: [1, {index: 0, time: 9}]}}));
  model('animated_test', [{from: [0, 0, 0], to: [16, 16, 16], faces}], 'animated_test');
  return faces;
}

async function importStructure(host, blocks, overrides = {}) {
  const task = host.__outer.beginImportTask();
  const options = host.__direct.sanitizeOptions({texture_source_path: fixture, ...overrides});
  try { const stats = await host.__direct.importBlocksIntoProject({name: 'building.nbt', blocks}, options, task); host.__outer.endImportTask(task, false); return stats; }
  catch (error) { host.__outer.endImportTask(task, true); throw error; }
}

if (require.main === module) (async () => {
  const host = createHost();
  createAssets(host);
  const d = host.__direct;

  await test('inclusive coordinate filters and wildcard IDs', () => {
    const o = d.sanitizeOptions({filter_bounds: true, bounds_min: [-2, -64, 4], bounds_max: [1, 10, 7], include_blocks: '*_planks,mod:*', exclude_blocks: 'spruce_planks'});
    assert.equal(d.blockMatchesFilters({x: -2, y: -64, z: 4, state: 'minecraft:oak_planks'}, o), true);
    assert.equal(d.blockMatchesFilters({x: 1, y: 10, z: 7, state: 'mod:brick'}, o), true);
    assert.equal(d.blockMatchesFilters({x: 0, y: 0, z: 4, state: 'minecraft:spruce_planks'}, o), false);
    assert.equal(d.blockMatchesFilters({x: 2, y: 0, z: 4, state: 'minecraft:oak_planks'}, o), false);
  });

  await test('classic schematic uses one metadata byte per block and AddBlocks', () => {
    const result = d.parseClassicSchematic({Width: 2, Height: 1, Length: 1, Blocks: [35, 35], Data: [14, 11]}, 'colors');
    assert.deepEqual(plain(result.blocks.map(b => b.state)), ['minecraft:red_wool', 'minecraft:blue_wool']);
    const extended = d.parseClassicSchematic({Width: 1, Height: 1, Length: 1, Blocks: [1], Data: [0], AddBlocks: [1]}, 'modded');
    assert.notEqual(extended.blocks[0].state, 'minecraft:stone');
  });

  await test('Sponge v3 wrapped Schematic compound', () => {
    const result = d.parseNbtStructure({value: {Schematic: {Width: 1, Height: 1, Length: 1, Blocks: {Palette: {'minecraft:stone': 0}, Data: [0]}}}}, 'v3', 'schem');
    assert.equal(result.blocks[0].state, 'minecraft:stone');
  });

  await test('litematic compact states cross long boundaries and negative regions start at minimum', () => {
    const ids = Array.from({length: 30}, (_, i) => i % 5);
    const bits = 3n;
    let packed = 0n;
    ids.forEach((id, i) => packed |= BigInt(id) << (BigInt(i) * bits));
    const longs = [packed & ((1n << 64n) - 1n), packed >> 64n];
    assert.deepEqual(plain(d.decodePackedCompact(longs, ids.length, 3)), ids);
    const palette = ids.slice(0, 5).map(i => ({Name: 'minecraft:test_' + i}));
    const result = d.parseLitematic({Regions: {region: {Size: {x: -30, y: 1, z: 1}, Position: {x: 40, y: 0, z: 0}, BlockStatePalette: palette, BlockStates: longs}}}, 'negative');
    assert.equal(result.blocks[0].x, 11);
    assert.equal(result.blocks[29].x, 40);
    assert.deepEqual(plain(result.blocks.map(b => b.state)), ids.map(i => 'minecraft:test_' + i));
  });

  await test('MCA palette storage follows DataVersion, not index validity heuristic', () => {
    const palette = Array.from({length: 17}, (_, i) => ({Name: 'minecraft:test_' + i}));
    const ids = Array.from({length: 4096}, (_, i) => i % 17);
    const longs = Array(342).fill(0n);
    ids.forEach((id, i) => longs[Math.floor(i / 12)] |= BigInt(id) << BigInt((i % 12) * 5));
    const blocks = [];
    d.extractPaletteSectionBlocks({Y: -1, block_states: {palette, data: longs}}, 0, 0, blocks, 4096, undefined, 3000);
    assert.deepEqual(plain(blocks.slice(0, 20).map(b => b.state)), ids.slice(0, 20).map(i => 'minecraft:test_' + i));
    assert.equal(blocks[0].y, -16);
  });

  await test('Java UV normalization honors project dimensions and per-texture UV formats', () => {
    assert.deepEqual(plain(host.__outer.uvForProject([0, 0, 16, 16])), [0, 0, 128, 64]);
    assert.deepEqual(plain(d.javaUvForTexture([0, 19, 14, 29], {uv_width: 64, uv_height: 64})), [0, 19, 28, 29]);
    host.Format.per_texture_uv_size = true;
    assert.deepEqual(plain(host.__outer.uvForProject([0, 0, 16, 16], 16, 16, {uv_width: 16, uv_height: 16})), [0, 0, 16, 16]);
    host.Format.per_texture_uv_size = false;
  });

  await test('object texture references retain metadata when namespace changes', () => {
    const textures = {stone: {sprite: 'block/stone', force_translucent: true}};
    host.__outer.setCompiledTextureLink(textures, 'stone', 'minecraft:block/stone');
    assert.deepEqual(textures.stone, {sprite: 'minecraft:block/stone', force_translucent: true});
    const reference = d.resolveTextureReference({textures: {all: {sprite: 'minecraft:block/stone', force_translucent: true}}}, '#all');
    assert.equal(reference.link, 'minecraft:block/stone');
    assert.equal(reference.force_translucent, true);
  });

  await test('opaque full cubes are eligible; transparent cubes are not', () => {
    const options = d.sanitizeOptions({texture_source_path: fixture});
    assert.ok(d.fullCubeTemplate('minecraft:stone', options, new Map()));
    assert.equal(d.fullCubeTemplate('minecraft:glass', options, new Map()), null);
  });

  await test('RGB PNG transparency keys do not become opaque occluders', () => {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 2;
    const png = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      d.pngChunk('IHDR', header), d.pngChunk('tRNS', Buffer.from([0, 200, 0, 150, 0, 100])),
      d.pngChunk('IDAT', require('node:zlib').deflateSync(Buffer.from([0, 200, 150, 100]))), d.pngChunk('IEND', Buffer.alloc(0))
    ]);
    assert.equal(d.decodePngToRgba(png).rgba[3], 0);
  });

  await test('merging 8 blocks keeps texel density and preserves existing Animated Java project', async () => {
    const h = createHost();
    const blocks = [];
    for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) blocks.push({x, y, z, state: 'minecraft:stone'});
    const stats = await importStructure(h, blocks, {merge_full_cubes: true, block_scale: 16});
    assert.equal(stats.cubes, 1);
    assert.equal(stats.merged_blocks, 7);
    assert.equal(stats.groups, 2);
    assert.deepEqual([h.Project.texture_width, h.Project.texture_height, h.Project.box_uv], [128, 64, true]);
    assert.equal(h.Cube.all[0].box_uv, false);
    assert.deepEqual(plain(h.Cube.all[0].to), [32, 32, 32]);
    const t = h.Texture.all[0];
    const image = d.decodePngToRgba(Buffer.from(t.source.split(',')[1], 'base64'));
    const uv = h.Cube.all[0].faces.north.uv;
    assert.equal((uv[2] / h.Project.texture_width) * image.width, 32);
    assert.equal(image.rgba[16 * 4], image.rgba[0]);
    assert.equal(t.saved, false);
    assert.ok(t.minecraft_obj_cubizer_texture_full_path.includes('/cubizer/'));
  });

  await test('merges never cross a spatial chunk boundary', async () => {
    const h = createHost();
    const stats = await importStructure(h, [15, 16].map(x => ({x, y: 0, z: 0, state: 'minecraft:stone'})), {merge_full_cubes: true, grouping: 'chunk'});
    assert.equal(stats.cubes, 2);
    assert.equal(stats.groups, 3);
    assert.notEqual(h.Group.all[1].name, h.Group.all[2].name);
  });

  await test('occlusion drops an interior cube but keeps the surface next to glass', async () => {
    const h = createHost();
    const blocks = [];
    for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) blocks.push({x, y, z, state: 'minecraft:stone'});
    let stats = await importStructure(h, blocks, {visible_faces_only: true});
    assert.equal(stats.cubes, 26);
    assert.equal(stats.hidden, 1);
    const mixed = createHost();
    stats = await importStructure(mixed, [{x: 0, y: 0, z: 0, state: 'minecraft:stone'}, {x: 1, y: 0, z: 0, state: 'minecraft:glass'}], {visible_faces_only: true});
    assert.equal(stats.cubes, 2);
    assert.notEqual(mixed.Cube.all[0].faces.east.texture, null);
  });

  await test('overlapping regions deduplicate and repeated imports reuse textures', async () => {
    const h = createHost();
    const blocks = [{x: 0, y: 0, z: 0, state: 'minecraft:stone'}, {x: 0, y: 0, z: 0, state: 'minecraft:stone'}];
    assert.equal((await importStructure(h, blocks)).source_blocks, 1);
    assert.equal((await importStructure(h, blocks)).textures, 0);
    assert.equal(h.Texture.all.length, 1);
  });

  await test('cube budget does not leave a partial chest', async () => {
    const h = createHost();
    const stats = await importStructure(h, [{x: 0, y: 0, z: 0, state: 'minecraft:chest'}], {cube_limit: 1});
    assert.equal(stats.cubes, 0);
    assert.equal(stats.truncated, 1);
    assert.equal(h.Cube.all.length, 0);
  });

  await test('cancellation after a creation batch rolls back the whole import', async () => {
    const h = createHost();
	let time = 0; h.performance = {now() { return time += 20; }};
    const task = h.__outer.beginImportTask();
    h.setTimeout = callback => setTimeout(() => { if (h.Cube.all.length >= 128) task.cancelled = true; callback(); }, 0);
    const blocks = Array.from({length: 400}, (_, x) => ({x, y: 0, z: 0, state: 'minecraft:stone'}));
    await assert.rejects(h.__direct.importBlocksIntoProject({name: 'cancel', blocks}, h.__direct.sanitizeOptions({use_block_models: false}), task), error => error.import_cancelled);
    h.__outer.endImportTask(task, true);
    assert.equal(h.Cube.all.length, 0);
    assert.equal(h.Texture.all.length, 0);
    assert.equal(h.Group.all.length, 0);
    assert.equal(h.Undo.current_save, undefined);
    assert.equal(h.Project.saved, true);
  });

  await test('OBJ import preserves an existing Animated Java UV canvas', async () => {
    const h = createHost();
    const obj = [
      'v 0 0 0', 'v 1 0 0', 'v 1 1 0', 'v 0 1 0',
      'v 0 0 1', 'v 1 0 1', 'v 1 1 1', 'v 0 1 1',
      'vt 0 0', 'vt 1 0', 'vt 1 1', 'vt 0 1',
      'f 4/4 3/3 2/2 1/1', 'f 5/1 6/2 7/3 8/4',
      'f 1/1 5/2 8/3 4/4', 'f 6/1 2/2 3/3 7/4',
      'f 4/1 8/2 7/3 3/4', 'f 1/1 2/2 6/3 5/4'
    ].join('\n');
    await h.__outer.importOBJAsCubes({name: 'block.obj', content: obj}, {scale: 1, default_depth: 1, texture_size: 16, texture_namespace: 'minecraft', texture_folder: 'block'});
    assert.ok(h.Cube.all.length > 0);
    assert.deepEqual([h.Project.texture_width, h.Project.texture_height, h.Project.box_uv], [128, 64, true]);
    for (const cube of h.Cube.all) {
      assert.equal(cube.box_uv, false);
      for (const face of Object.values(cube.faces)) if (face.texture !== null) assert.deepEqual(plain(face.uv), [0, 0, 128, 64]);
    }
  });

  await test('source limit is independent of output cube budget and reports truncation', async () => {
    const h = createHost();
    const stats = await importStructure(h, Array.from({length: 10}, (_, x) => ({x, y: 0, z: 0, state: 'minecraft:stone'})), {source_block_limit: 3, cube_limit: 100});
    assert.equal(stats.cubes, 3);
    assert.equal(stats.read_limited, true);
    assert.equal(stats.truncated, 0);
  });

  await test('generated texture budget leaves source blocks available for individual cubes', () => {
    const h = createHost();
    const options = h.__direct.sanitizeOptions({texture_source_path: fixture});
    const template = h.__direct.fullCubeTemplate('minecraft:stone', options, new Map());
    const block = {x: 0, y: 0, z: 0, state: 'minecraft:stone'};
    const candidates = new Map([['0,0,0', template], ['1,0,0', template]]);
    const consumed = new Set();
    const box = h.__direct.growFullCubeBox(block, candidates, consumed, options);
    const map = {__tiled_pixels: 16 * 1024 * 1024};
    assert.equal(h.__direct.createMergedCube(box, options, [0, 0, 0], new h.Group({name: 'test'}).init(), map, [], []), false);
    assert.equal(consumed.size, 0);
    assert.equal(h.Cube.all.length, 0);
    assert.equal(map.__merge_limited, true);
  });

  await test('import task guards pending edits and restores the project lock after cancellation', () => {
    const h = createHost();
    h.Undo.current_save = {};
    assert.throws(() => h.__outer.beginImportTask());
    delete h.Undo.current_save;
    const task = h.__outer.beginImportTask();
    assert.equal(h.Project.locked, true);
    task.dialog.onCancel();
    assert.equal(task.cancelled, true);
    h.__outer.endImportTask(task, true);
    assert.equal(h.Project.locked, false);
  });

  await test('half slabs merge horizontally with an 8-pixel side, never across a vertical gap', async () => {
    const h = createHost();
    const stats = await importStructure(h, [0, 1, 2].map(x => ({x, y: 0, z: 0, state: 'minecraft:slab_test'})), {merge_full_cubes: true, block_scale: 16});
    assert.equal(stats.cubes, 1);
    assert.deepEqual(plain(h.Cube.all[0].to), [48, 8, 16]);
    const face = h.Cube.all[0].faces.north, texture = h.Texture.all.find(t => t.uuid === face.texture);
    const pixels = d.decodePngToRgba(Buffer.from(texture.source.split(',')[1], 'base64'));
    assert.equal(face.uv[3] / h.Project.texture_height * pixels.width, 8);
    const vertical = createHost();
    assert.equal((await importStructure(vertical, [0, 1].map(y => ({x: 0, y, z: 0, state: 'minecraft:slab_test'})), {merge_full_cubes: true})).cubes, 2);
  });

  await test('three equal stairs become two continuous cubes with shape preserved', async () => {
    const h = createHost();
    const stats = await importStructure(h, [0, 1, 2].map(z => ({x: 0, y: 0, z, state: 'minecraft:stairs_test'})), {merge_full_cubes: true, block_scale: 16});
    assert.equal(stats.cubes, 2); assert.equal(stats.merged_blocks, 4);
    assert.deepEqual(plain(h.Cube.all[1].from), [8, 8, 0]);
    assert.deepEqual(plain(h.Cube.all[1].to), [16, 16, 48]);
  });

  await test('90 degree variants and tint indices survive merging', async () => {
    for (const state of ['minecraft:rotated_test', 'minecraft:tinted_test']) {
      const h = createHost();
      assert.equal((await importStructure(h, [0, 1].map(x => ({x, y: 0, z: 0, state})), {merge_full_cubes: true})).cubes, 1);
      if (state.includes('tinted')) assert.equal(h.Cube.all[0].faces.north.tint, 0);
    }
  });

  await test('transparent merging is opt-in and never supplies opaque neighbor culling', async () => {
    const h = createHost();
    const stats = await importStructure(h, [0, 1].map(x => ({x, y: 0, z: 0, state: 'minecraft:glass'})), {merge_full_cubes: true, merge_transparent: true, visible_faces_only: true});
    assert.equal(stats.cubes, 1);
    const decoded = d.decodePngToRgba(Buffer.from(h.Texture.all[0].source.split(',')[1], 'base64'));
    assert.equal(decoded.rgba[3], 128);
    const options = d.sanitizeOptions({texture_source_path: fixture, merge_transparent: true});
    assert.equal(h.__direct.fullCubeTemplate('minecraft:glass', options, new Map()).occludes, false);
  });

  await test('animated merge retains all frames, sequence, durations and actual frame size', async () => {
    const h = createHost();
    assert.equal((await importStructure(h, [0, 1].map(x => ({x, y: 0, z: 0, state: 'minecraft:animated_test'})), {merge_full_cubes: true})).cubes, 1);
    const texture = h.Texture.all[0], png = d.decodePngToRgba(Buffer.from(texture.source.split(',')[1], 'base64'));
    assert.equal(png.width, 32); assert.equal(png.height, 64);
    assert.equal(png.rgba[0], 20); assert.equal(png.rgba[32 * 32 * 4], 210);
    assert.equal(texture.frameCount, 2); assert.equal(texture.frame_order, '1 0:9');
    assert.deepEqual(plain(texture.getMCMetaContent().animation.frames), [1, {index: 0, time: 9}]);
    assert.equal(texture.getMCMetaContent().animation.height, 32);
    const staticTexture = createHost();
    await importStructure(staticTexture, [{x: 0, y: 0, z: 0, state: 'minecraft:stone'}]);
    assert.equal(staticTexture.Texture.all[0].frameCount, undefined);
  });

  await test('motion regions have independent pivots and merges do not cross their boundary', async () => {
    const h = createHost();
    const stats = await importStructure(h, [0, 1, 2, 3].map(x => ({x, y: 0, z: 0, state: 'minecraft:stone'})), {
      merge_full_cubes: true, grouping: 'parts', block_scale: 16,
      animation_parts: [{name: 'rotor', min: [2, 0, 0], max: [3, 0, 0], pivot: [2.5, 0.5, 0.5]}]
    });
    assert.equal(stats.cubes, 2); assert.equal(stats.groups, 3);
    const part = h.Group.all.find(g => g.name === 'rotor');
    assert.deepEqual(plain(part.origin), [40, 8, 8]); assert.equal(part.children.length, 1);
    assert.ok(h.Group.all.find(g => g.name === 'body'));
  });

  await test('packed prepared sources stop reading immediately when the cube budget is full', async () => {
    const h = createHost(); let reads = 0;
    const blocks = {length: 1000000, at(x) { reads++; return {x, y: 0, z: 0, state: 'minecraft:stone'}; }};
    const task = h.__outer.beginImportTask();
    const stats = await h.__direct.importBlocksIntoProject({name: 'packed', prepared: true, blocks, bounds: {min: [0, 0, 0], max: [1000000, 1, 1]}}, h.__direct.sanitizeOptions({cube_limit: 2, use_block_models: false}), task);
    h.__outer.endImportTask(task, false);
    assert.equal(stats.cubes, 2); assert.equal(stats.truncated, 999998); assert.ok(reads <= 3);
  });

  await test('native previews stay deferred until completion and do not receive a second geometry rebuild', async () => {
    const h = createHost(), init = h.Cube.prototype.init;
    h.Cube.prototype.init = function() { this.mesh = {layers: {mask: 1, set(bit) {this.mask = 1 << bit;}}}; return init.call(this); };
    let view;
    h.Canvas.updateView = value => {view = value;};
    const task = h.__outer.beginImportTask();
    await h.__direct.importBlocksIntoProject({name:'defer',blocks:[{x:0,y:0,z:0,state:'minecraft:stone'}]},h.__direct.sanitizeOptions({texture_source_path:fixture}),task);
    assert.equal(h.Cube.all[0].mesh.layers.mask,1 << 29);
    h.__outer.endImportTask(task,false);
    assert.equal(h.Cube.all[0].mesh.layers.mask,1);
    assert.deepEqual(plain(view.element_aspects),{});
  });

  await test('texture pixel dimensions are known before native image completion without changing UV units', async () => {
    const h=createHost(), adds=[];
    h.Texture.prototype.getOwnMaterial=function(){return this.material ||= {map:{width:0,height:0}};};
    const add=h.Texture.prototype.add;
    h.Texture.prototype.add=function(undo, resize){adds.push(resize);return add.call(this);};
    await importStructure(h,[0,1].map(x=>({x,y:0,z:0,state:'minecraft:stone'})),{merge_full_cubes:true});
    const texture=h.Texture.all[0];
    assert.equal(texture.width,32);assert.equal(texture.height,32);assert.equal(texture.uv_width,16);
    assert.equal(texture.getOwnMaterial().map.width,32);assert.equal(texture.getOwnMaterial().map.height,32);
    assert.deepEqual(adds,[false]);
  });

  console.log(`${passed} tests passed`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  if (process.argv.includes('--keep-fixtures')) console.log('FIXTURE ' + fixture);
  else fs.rmSync(fixture, {recursive: true, force: true});
});
