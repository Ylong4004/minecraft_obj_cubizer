const assert = require('node:assert/strict');
const {Worker} = require('node:worker_threads');
const zlib = require('node:zlib');
const {createHost} = require('./run.cjs');

function string(value) { const bytes = Buffer.from(value); const length = Buffer.alloc(2); length.writeUInt16BE(bytes.length); return Buffer.concat([length, bytes]); }
function payload(type, value) {
  if (type === 8) return string(value);
  if (type === 10) return Buffer.concat([...Object.entries(value).map(([name, [tag, v]]) => Buffer.concat([Buffer.from([tag]), string(name), payload(tag, v)])), Buffer.from([0])]);
  if (type === 9) { const [tag, list] = value; const n = Buffer.alloc(4); n.writeInt32BE(list.length); return Buffer.concat([Buffer.from([tag]), n, ...list.map(v => payload(tag, v))]); }
  if (type === 7) { const n = Buffer.alloc(4); n.writeInt32BE(value.length); return Buffer.concat([n, Buffer.from(value)]); }
  if (type === 12) { const bytes = Buffer.alloc(4 + value.length * 8); bytes.writeInt32BE(value.length); value.forEach((v, i) => bytes.writeBigInt64BE(BigInt.asIntN(64, v), 4 + i * 8)); return bytes; }
  const sizes = {1: 1, 2: 2, 3: 4}; const bytes = Buffer.alloc(sizes[type]);
  if (type === 1) bytes.writeInt8(value); else if (type === 2) bytes.writeInt16BE(value); else bytes.writeInt32BE(value);
  return bytes;
}
function nbt(value) { return Buffer.concat([Buffer.from([10, 0, 0]), payload(10, value)]); }

function workerSession(host) {
  const source = `const {parentPort}=require('node:worker_threads'); globalThis.self=globalThis; self.postMessage=(data, transfer)=>parentPort.postMessage(data,transfer); parentPort.on('message',data=>self.onmessage({data}));\n` + host.__direct.getStructureWorkerSource();
  const worker = new Worker(source, {eval: true});
  let seq = 0; const pending = new Map();
  worker.on('message', data => { if (data.phase || data.current !== undefined) return; const item = pending.get(data.id); pending.delete(data.id); if (!item) return; data.error ? item.reject(new Error(data.error)) : item.resolve(data.result); });
  worker.on('error', error => { for (const item of pending.values()) item.reject(error); pending.clear(); });
  return {
    worker,
    call(command, data = {}) { return new Promise((resolve, reject) => { const id = ++seq; pending.set(id, {resolve, reject}); worker.postMessage({id, command, ...data}); }); },
    async close() { await worker.terminate(); }
  };
}

async function run() {
  const host = createHost(), d = host.__direct, session = workerSession(host);
  try {
    const width = 128, height = 64, length = 128, volume = width * height * length;
    const raw = nbt({Width: [2, width], Height: [2, height], Length: [2, length], Blocks: [7, Buffer.alloc(volume, 1)], Data: [7, Buffer.alloc(volume)], Entities: [9, [10, [{payload: [7, Buffer.alloc(100000)]}]]]});
    const gzip = zlib.gzipSync(raw);
    let ticks = 0; const timer = setInterval(() => ticks++, 2); timer.unref();
    const started = performance.now();
    await session.call('open', {buffer: gzip.buffer.slice(gzip.byteOffset, gzip.byteOffset + gzip.length), name: 'large.schematic', extension: 'schematic'});
    const options = d.sanitizeOptions({filter_bounds: true, bounds_min: [10, 20, 30], bounds_max: [14, 24, 34]});
    const preview = await session.call('preview', {options});
    assert.equal(preview.count, 125);
    assert.ok(preview.cells.length <= 2048);
    const selected = await session.call('select', {options});
    assert.equal(selected.packed.length, 125 * 4);
    const unpacked = d.unpackWorkerStructure(selected);
    assert.deepEqual(JSON.parse(JSON.stringify(unpacked.blocks.at(0))), {x: 10, y: 20, z: 30, state: 'minecraft:stone'});
    clearInterval(timer);
    assert.ok(ticks > 0, 'main event loop must keep running during parse');
    console.log(`PASS background gzip parse and bounded selection (${Math.round(performance.now() - started)} ms, ${ticks} event-loop ticks)`);

    const all = await session.call('preview', {options: d.sanitizeOptions({})});
    assert.equal(all.count, volume);
    assert.ok(all.cells.length <= 2048);
    console.log('PASS million-block coarse preview stays below 2048 instances');

    const schematic = nbt({Schematic: [10, {Width: [2, 2], Height: [2, 1], Length: [2, 1], Blocks: [10, {Palette: [10, {'minecraft:stone': [3, 0], 'minecraft:oak_planks': [3, 1]}], Data: [7, Buffer.from([0, 1])]}]}]});
    await session.call('open', {buffer: schematic, name: 'test.schem', extension: 'schem'});
    const sponge = await session.call('select', {options: d.sanitizeOptions({include_blocks: '*_planks'})});
    assert.equal(sponge.packed.length, 4);
    assert.equal(sponge.palette[0], 'minecraft:oak_planks');
    console.log('PASS worker Sponge v3 and wildcard filtering');

    const lite = nbt({Regions: [10, {negative: [10, {Size: [10, {x: [3, -2], y: [3, 1], z: [3, 1]}], Position: [10, {x: [3, 10], y: [3, 0], z: [3, 0]}], BlockStatePalette: [9, [10, [{Name: [8, 'minecraft:stone']}, {Name: [8, 'minecraft:oak_planks']}]]], BlockStates: [12, [4n]]}]}]});
    await session.call('open', {buffer: zlib.deflateSync(lite), name: 'negative.litematic', extension: 'litematic'});
    const litematic = await session.call('select', {options: d.sanitizeOptions({})});
    assert.equal(litematic.packed[0], 9);
    assert.equal(litematic.packed[4], 10);
    assert.deepEqual(litematic.palette, ['minecraft:stone', 'minecraft:oak_planks']);
    console.log('PASS worker zlib, negative litematic and compact palette');

    const chunk = nbt({DataVersion: [3, 3000], sections: [9, [10, [{Y: [1, 0], block_states: [10, {palette: [9, [10, [{Name: [8, 'minecraft:stone']}]]]}]}]]]});
    const compressed = zlib.deflateSync(chunk), region = Buffer.alloc(12288);
    region[10 * 4 + 2] = 2; region[10 * 4 + 3] = 1;
    region.writeInt32BE(compressed.length + 1, 8192); region[8196] = 2; compressed.copy(region, 8197);
    await session.call('open', {buffer: region, name: 'r.0.0.mca', extension: 'mca'});
    const mca = await session.call('select', {options: d.sanitizeOptions({filter_bounds: true, bounds_min: [160, 0, 0], bounds_max: [161, 0, 0]})});
    assert.equal(mca.packed.length, 8);
    assert.equal(mca.packed[0], 160);
    console.log('PASS MCA only decodes the selected distant chunk');

    const sparse = nbt({size: [9, [3, [2050 * 4096, 1, 1]]], palette: [9, [10, [{Name: [8, 'minecraft:stone']}]]], blocks: [9, [10, Array.from({length: 2050}, (_, i) => ({pos: [9, [3, [i * 4096, 0, 0]]], state: [3, 0]}))]]});
    await session.call('open', {buffer: sparse, name: 'sparse.nbt', extension: 'nbt'});
    const sparsePreview = await session.call('preview', {options: d.sanitizeOptions({})});
    assert.equal(sparsePreview.count, 2050);
    assert.ok(sparsePreview.cells.length <= 2048, 'widely separated blocks must also obey the instance budget');
    console.log('PASS sparse distant structures also stay below the preview budget');
  } finally { await session.close(); }

  const cancel = workerSession(host);
  const oversized = nbt({Width: [2, 128], Height: [2, 64], Length: [2, 128], Blocks: [7, Buffer.alloc(1048576, 1)], Data: [7, Buffer.alloc(1048576)]});
  await cancel.call('open', {buffer: oversized, name: 'cancel.schematic', extension: 'schematic'});
  cancel.call('preview', {options: d.sanitizeOptions({})});
  await cancel.close();
  console.log('PASS worker can terminate during a large scan');
}

module.exports = {nbt, workerSession};
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
