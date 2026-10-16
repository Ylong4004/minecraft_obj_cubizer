const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {instrument} = require('./run.cjs');
const {chromium} = require('C:/Temp/cubizer-browser-check/node_modules/playwright');

async function run() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cubizer-desktop-'));
  fs.writeFileSync(path.join(profile, 'plugin_permissions.json'), JSON.stringify({minecraft_obj_cubizer: {allowed: {fs: true, process: true}}}));
  const pluginDirectory = path.join(profile, 'source'); fs.mkdirSync(pluginDirectory);
  const root = path.join(__dirname, '../minecraft_obj_cubizer');
  for (const file of ['about.md', 'changelog.json', 'icon.svg', 'members.yml']) fs.copyFileSync(path.join(root, file), path.join(pluginDirectory, file));
  const source = instrument(fs.readFileSync(path.join(root, 'minecraft_obj_cubizer.js'), 'utf8'));
  const file = path.join(pluginDirectory, 'minecraft_obj_cubizer.js'); fs.writeFileSync(file, source);
  const port = 9337, app = spawn('D:/Program Files/Blockbench/Blockbench.exe', ['--userData', profile, '--remote-debugging-port=' + port, '--remote-debugging-address=127.0.0.1', '--disable-background-timer-throttling'], {windowsHide: true, stdio: 'ignore'});
  let browser;
  const watchdog = setTimeout(() => app.kill(), 90000);
  try {
    for (let i = 0; i < 100; i++) {
      try { browser = await chromium.connectOverCDP('http://127.0.0.1:' + port); break; }
      catch { await new Promise(r => setTimeout(r, 200)); }
    }
    if (!browser) throw new Error('Isolated Blockbench did not start');
    const page = browser.contexts()[0].pages()[0];
    await page.waitForFunction(() => typeof Blockbench !== 'undefined' && Blockbench.setup_successful === true && typeof Plugin !== 'undefined');
    page.on('pageerror', error => console.log('PAGE ERROR', error.stack));
    if (process.argv.includes('--optimizer')) {
      const optimizer = 'E:/bb建模项目/multi_cube_mesh_optimizer.js';
      await page.evaluate(async ({file, source}) => { await new Plugin().loadFromFile({path: file, content: source}, true); }, {file: optimizer, source: fs.readFileSync(optimizer, 'utf8')});
    }
    await page.evaluate(async ({file, source}) => { await new Plugin().loadFromFile({path: file, content: source}, true); }, {file, source});
    const result = await page.evaluate(async ({pixelGrid, allUV, optimizerActive}) => {
      setupProject(Formats.free);
      Project.name = 'tower_performance_test';
      if (pixelGrid) settings.pixel_grid.value = true;
      if (allUV) { settings.display_uv.value = 'all_elements'; UVEditor.vue.display_uv = 'all_elements'; }
      if (optimizerActive) {
        const group = new Group({name:'existing'}).init(); new Cube({from:[20,0,0],to:[21,1,1]}).addTo(group).init();
        BarItems.mcmo_optimize_model.click(); await new Promise(r=>setTimeout(r,300));
        console.log('optimizer enabled', window.__mcmo_api?.isEnabled());
      }
      const d = __direct, outer = __outer;
      const metrics = {}, probes = [
        [Cube.prototype, 'init'], [Cube.preview_controller, 'setup'], [Cube.preview_controller, 'updateFaces'],
        [Cube.preview_controller, 'updateUV'], [Cube.preview_controller, 'updateGeometry'], [Canvas, 'updateView'],
        [Canvas, 'updateAllFaces'], [Cube.preview_controller, 'updatePixelGrid'], [Validator, 'validate'], [Undo, 'finishEdit']
      ];
      for (const [target, key] of probes) {
        const original = target[key]; if (!original) continue;
        target[key] = function(...args) { const start = performance.now(); try { return original.apply(this, args); } finally { const m = metrics[key] ||= {calls: 0, ms: 0}; m.calls++; m.ms += performance.now() - start; } };
      }
      const source = 'D:/PCL2/MinecraftPcl/versions/26.2-Fabric_0.19.3/saves/[剧透过多的rpg]最后的敌人是勇者的父亲/generated/minecraft/structure/tower.nbt';
      const options = d.sanitizeOptions({texture_source_path: 'D:/PCL2/MinecraftPcl/versions/26.2-Fabric_0.19.3/26.2-Fabric_0.19.3.jar', merge_full_cubes: true, grouping: 'parts', center_model: true, cube_limit: 110000, cull_faces: true});
      const session = d.createStructureWorkerSession(), start = performance.now();
      await d.openStructureWorker({path: source, name: 'tower.nbt'}, session);
      const structure = d.unpackWorkerStructure(await session.request('select', {options})); session.dispose();
      const parsed = performance.now(); const task = outer.beginImportTask();
      let stats;
      try { stats = await d.importBlocksIntoProject(structure, options, task); outer.endImportTask(task, false); }
      catch (error) { outer.endImportTask(task, true); throw error; }
      const imported = performance.now();
      await new Promise(r => setTimeout(r, 500));
      const frameStart = performance.now(); Preview.selected.render();
      return {version: Blockbench.version, parseMs: parsed - start, importMs: imported - parsed, frameMs: performance.now() - frameStart, stats, metrics, renderer: {...Preview.selected.renderer.info.render}, textures: Texture.all.length, errors: Texture.all.filter(t => t.error).map(t => t.name)};
    }, {pixelGrid: process.argv.includes('--pixel-grid'), allUV: process.argv.includes('--all-uv'), optimizerActive:process.argv.includes('--optimizer-active')});
    console.log(JSON.stringify(result, null, 2));
    assert.equal(result.stats.source_blocks, 2509); assert.equal(result.stats.cubes, 3677); assert.deepEqual(result.errors, []);
    assert.ok(result.importMs < 15000, 'tower import must finish within the regression budget');
    assert.ok(result.renderer.calls < 100, 'static building must use batched viewport drawing');
    const checks = await page.evaluate(async () => {
      const view = Preview.selected, gl = view.renderer.getContext();
      // The fast view deliberately suppresses unselected pixel-grid helpers; compare model pixels only.
      settings.pixel_grid.value=false;Canvas.updatePixelGrid();
      view.controls.target.set(0,0,0); view.controls.object.position.set(50,35,65); view.controls.update();
      function pixels() { view.render(); const bytes = new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4); gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,bytes); return bytes; }
      const batch = pixels(), nativeCallsBefore = view.renderer.info.render.calls;
      Project.minecraft_obj_cubizer_performance = false; Blockbench.dispatchEvent('update_view', {element_aspects:{}}); await new Promise(r=>setTimeout(r,200));
      const native = pixels(); let difference = 0;
      for(let i=0;i<batch.length;i++) if(Math.abs(batch[i]-native[i])>3) difference++;
      const cube=Cube.all.find(c=>c.name.startsWith('stripped_oak_log') && !c.name.includes('merged'))||Cube.all[0], snapshot=JSON.stringify({from:cube.from,to:cube.to,faces:cube.getSaveCopy().faces});
      Project.minecraft_obj_cubizer_performance = true; Blockbench.dispatchEvent('update_view', {element_aspects:{}}); await new Promise(r=>setTimeout(r,500));
      await __outer.buildViewportBatch();
      const layersBefore=cube.mesh.layers.mask, batchState=__outer.viewportBatchStatus();
      cube.select(); updateSelection(); await new Promise(r=>setTimeout(r,500)); view.render();
      const selectedNative=cube.mesh.layers.mask===1;
      Undo.initEdit({elements:[cube]}); cube.from[0]+=0.25;cube.to[0]+=0.25;cube.preview_controller.updateGeometry(cube);Undo.finishEdit('Test edit');Undo.undo();
      const restored=snapshot===JSON.stringify({from:cube.from,to:cube.to,faces:cube.getSaveCopy().faces});
      unselectAllElements();updateSelection();await new Promise(r=>setTimeout(r,500));
      const center=new THREE.Vector3(...cube.from.map((v,i)=>(v+cube.to[i])/2));center.project(view.camera);
      const rect=view.canvas.getBoundingClientRect(),picked=view.raycast({clientX:rect.left+(center.x+1)*rect.width/2,clientY:rect.top+(1-center.y)*rect.height/2}, {elements:true});
      const saved=Codecs.project.compile({raw:true});
      return {differenceRatio:difference/batch.length,nativeCallsBefore,selectedNative,restored,layersBefore,batchState,picked:!!picked?.element,serializedElements:saved.elements.length,proxyInElements:saved.elements.some(e=>e.name==='cubizer_viewport_batch')};
    });
    console.log('Interaction checks: '+JSON.stringify(checks));
    assert.ok(checks.differenceRatio < 0.01, 'batched and native textured pictures must match');
    assert.ok(checks.selectedNative);assert.ok(checks.restored);assert.ok(checks.picked);assert.equal(checks.serializedElements,3677);assert.equal(checks.proxyInElements,false);
    const oldModel=JSON.parse(fs.readFileSync('C:/Users/柳浪一/Desktop/model.bbmodel','utf8'));
    const reopened=await page.evaluate(async model=>{
      Project.saved=true;await Project.close(true);Codecs.project.load(model,{path:'C:/Users/柳浪一/Desktop/model.bbmodel'},false);
      await new Promise(r=>setTimeout(r,700));await __outer.buildViewportBatch();Preview.selected.render();
      const calls=Preview.selected.renderer.info.render.calls,proxies=__outer.viewportBatchStatus();
      Group.all.find(g=>g.name==='part_1').select();updateSelection();await new Promise(r=>setTimeout(r,100));
      const overlays=UVEditor.vue.getDisplayedUVElements().length;
      unselectAllElements();updateSelection();await new Promise(r=>setTimeout(r,500));
      return {calls,proxies,cubes:Cube.all.length,overlays,errors:Texture.all.filter(t=>t.error).map(t=>t.name)};
    },oldModel);
    console.log('Existing bbmodel checks: '+JSON.stringify(reopened));assert.ok(reopened.calls<100);assert.ok(reopened.overlays<=64);assert.deepEqual(reopened.errors,[]);
    if(process.argv.includes('--save-verified')){
      const compiled=await page.evaluate(()=>Codecs.project.compile({raw:true}));
      const output=path.join(__dirname,'../info/tower_performance_verified.bbmodel');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(compiled));console.log('Verified copy: '+output);
    }
    await page.screenshot({path: path.join(profile, 'tower.png')});
    console.log('Isolated profile and screenshot: ' + profile);
  } finally { clearTimeout(watchdog); await browser?.close(); app.kill(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
