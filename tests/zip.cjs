const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const {createHost} = require('./run.cjs');

function archive(zip64) {
  const records = [], directories = [];
  let offset = 0;
  const entries = [
    ['assets/minecraft/models/block/test.json', Buffer.from('{"elements":[]}'), 8],
    ['assets/minecraft/textures/block/test.png', Buffer.from('sample PNG bytes'), 0],
    ['ignored.bin', Buffer.alloc(1024 * 1024), 0]
  ];
  for (const [name, raw, method] of entries) {
    const nameBytes = Buffer.from(name), data = method === 8 ? zlib.deflateRawSync(raw) : raw;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(45, 4); local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameBytes.length, 26);
    records.push(local, nameBytes, data);
    const extra = Buffer.alloc(zip64 ? 28 : 0);
    if (zip64) { extra.writeUInt16LE(1); extra.writeUInt16LE(24, 2); extra.writeBigUInt64LE(BigInt(raw.length), 4); extra.writeBigUInt64LE(BigInt(data.length), 12); extra.writeBigUInt64LE(BigInt(offset), 20); }
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50); central.writeUInt16LE(45, 4); central.writeUInt16LE(45, 6); central.writeUInt16LE(method, 10);
    central.writeUInt32LE(zip64 ? 0xffffffff : data.length, 20); central.writeUInt32LE(zip64 ? 0xffffffff : raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28); central.writeUInt16LE(extra.length, 30); central.writeUInt32LE(zip64 ? 0xffffffff : offset, 42);
    directories.push(central, nameBytes, extra); offset += local.length + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(directories), trailer = [];
  if (zip64) {
    const record = Buffer.alloc(56), locator = Buffer.alloc(20);
    record.writeUInt32LE(0x06064b50); record.writeBigUInt64LE(44n, 4);
    record.writeBigUInt64LE(BigInt(entries.length), 24); record.writeBigUInt64LE(BigInt(entries.length), 32);
    record.writeBigUInt64LE(BigInt(directory.length), 40); record.writeBigUInt64LE(BigInt(offset), 48);
    locator.writeUInt32LE(0x07064b50); locator.writeBigUInt64LE(BigInt(offset + directory.length), 8); locator.writeUInt32LE(1, 16);
    trailer.push(record, locator);
  }
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(zip64 ? 65535 : entries.length, 8); end.writeUInt16LE(zip64 ? 65535 : entries.length, 10);
  end.writeUInt32LE(zip64 ? 0xffffffff : directory.length, 12); end.writeUInt32LE(zip64 ? 0xffffffff : offset, 16);
  return Buffer.concat([...records, directory, ...trailer, end]);
}

function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cubizer-zip-'));
  try {
    const d = createHost().__direct;
    for (const zip64 of [false, true]) {
      const file = path.join(directory, zip64 ? 'zip64.jar' : 'normal.jar'); fs.writeFileSync(file, archive(zip64));
      const index = d.createZipIndex(file);
      assert.equal(Object.keys(index.entries).length, 2);
      assert.equal(index.bytes, undefined, 'archive payload must not stay loaded in memory');
      const model = d.extractZipEntry(index, 'assets/minecraft/models/block/test.json');
      assert.equal(Buffer.from(model).toString(), '{"elements":[]}');
      assert.equal(d.extractZipEntry(index, 'assets/minecraft/models/block/test.json'), model);
      assert.equal(Buffer.from(d.extractZipEntry(index, 'assets/minecraft/textures/block/test.png')).toString(), 'sample PNG bytes');
      assert.equal(d.extractZipEntry(index, 'ignored.bin'), null);
      assert.ok(index.cache_bytes < 100);
      console.log('PASS ' + (zip64 ? 'ZIP64' : 'ZIP') + ' asset-only index, random access, deflate/store and cache');
    }
    const host = createHost();
    host.requireNativeModule = name => name === 'fs' ? {readFileSync: fs.readFileSync, statSync: fs.statSync} : require(name);
    const scoped = host.__direct.createZipIndex(path.join(directory, 'zip64.jar'));
    assert.equal(Buffer.from(host.__direct.extractZipEntry(scoped, 'assets/minecraft/models/block/test.json')).toString(), '{"elements":[]}');
    console.log('PASS Blockbench scoped FS without open/read/close methods');
  } finally { fs.rmSync(directory, {recursive: true, force: true}); }
}
if (require.main === module) run();
