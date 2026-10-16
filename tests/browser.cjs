const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const zlib = require('node:zlib');
const {instrument} = require('./run.cjs');
const {nbt} = require('./worker.cjs');
const dependencies = process.argv[2] || 'C:/Temp/cubizer-browser-check/node_modules';
const {chromium} = require(path.join(dependencies, 'playwright'));

const bootstrap = `
Math.clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
window.Project={name:'browser test',texture_width:128,texture_height:64,saved:true,box_uv:true};
window.Format={id:'animated-java:format/blueprint',bone_rig:true,edit_mode:true,optional_box_uv:true};
window.isApp=true; window.Plugin={register(){}};
const translations={}; window.Language={addTranslations(lang,entries){if(lang==='zh')Object.assign(translations,entries)}};
window.tl=(key,values=[])=>values.reduce((s,v,i)=>s.replaceAll('%'+i,v),translations[key]||key);
window.Texture=class {static all=[];constructor(data){Object.assign(this,data);this.uuid='t'+Texture.all.length;this.flags=new Set()}loadEmpty(){this.error=3}add(){Texture.all.push(this)}enableParticle(){this.particle=true}};
window.Cube=class {static all=[];static selected=[];constructor(data){Object.assign(this,data);this.uuid='c'+Math.random()}addTo(g){this.parent=g;g.children.push(this);return this}init(){Cube.all.push(this);return this}remove(){Cube.all.splice(Cube.all.indexOf(this),1)}};
window.Group=class {static all=[];constructor(data){Object.assign(this,data);this.children=[]}sanitizeName(){}createUniqueName(){}addTo(g){this.parent=g;g.children.push(this);return this}init(){Group.all.push(this);return this}remove(){Group.all.splice(Group.all.indexOf(this),1)}};
window.Canvas={updateView(){},updateAll(){}};window.Validator={validate(){}};window.updateSelection=()=>{};
window.Undo={initEdit(){this.current_save={}},finishEdit(){delete this.current_save},cancelEdit(){delete this.current_save}};
window.Blockbench={messages:[],showMessageBox(data){this.messages.push(data)},showQuickMessage(){}};
window.Preview={selected:{controls:{constructor:function(camera,preview){return new THREE.OrbitControls(camera,preview.canvas)}}}};
window.Dialog=class {
  static open;
  constructor(options){Object.assign(this,options);this.options=options;this.values=Object.fromEntries(Object.entries(options.form||{}).map(([k,v])=>[k,v.value]));this.progress_bar={setProgress(){}}}
  getFormResult(){return this.values}
  show(){
    const shell=document.createElement('section');shell.className='dialog';shell.id=this.id;
    const title=document.createElement('h2');title.textContent=this.title;shell.append(title);
    const fields=document.createElement('div');fields.className='fields';shell.append(fields);
    for(const [key,field] of Object.entries(this.options.form||{})){
      const label=document.createElement('label');label.textContent=field.label||key;label.dataset.field=key;
      const types=field.type==='vector'?field.value:[field.value];
      types.forEach((value,index)=>{
        const input=document.createElement(field.type==='select'?'select':'input');
        if(field.type==='select')for(const [id,name]of Object.entries(field.options)){const o=document.createElement('option');o.value=id;o.textContent=name;input.append(o)}
        else input.type=field.type==='checkbox'?'checkbox':field.type==='vector'||field.type==='number'?'number':'text';
        if(input.type==='checkbox')input.checked=value;else input.value=value;
        input.addEventListener('input',()=>{let v=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;if(field.type==='vector')this.values[key][index]=v;else this.values[key]=v});
        label.append(input);
      });fields.append(label);
    }
    const mount=document.createElement('div');shell.append(mount);document.body.append(shell);this.shell=shell;
    if(this.component)this.content_vue=new Vue(this.component).$mount(mount);
    const footer=document.createElement('footer');shell.append(footer);
    (this.buttons||['确定','取消']).forEach((name,index)=>{const button=document.createElement('button');button.textContent=name;button.dataset.button=index;button.onclick=()=>{if(index===(this.cancelIndex??1)){this.onCancel?.();this.hide()}else{const result=this.onConfirm?.(this.getFormResult());if(result!==false)this.hide()}};footer.append(button)});
    Dialog.open=this;return this;
  }
  hide(){this.content_vue?.$destroy();this.shell?.remove();if(Dialog.open===this)Dialog.open=null}
};
window.start=async()=>{
  const bytes=new Uint8Array(await(await fetch('/building')).arrayBuffer());
  await __direct.showStructurePreview({name:'building.schematic',content:bytes},__direct.sanitizeOptions({}));
};`;

async function run() {
  const width=64,height=24,length=64,blocks=Buffer.alloc(width*height*length),data=Buffer.alloc(blocks.length);
  for(let y=0;y<height;y++)for(let z=0;z<length;z++)for(let x=0;x<width;x++){
    if(y===0 || (y<9&&(x===3||x===60||z===3||z===60)) || (y<20&&((x<12&&z<12)||(x>51&&z>51))))blocks[(y*length+z)*width+x]=y>12?5:1;
  }
  const bytes=zlib.gzipSync(nbt({Width:[2,width],Height:[2,height],Length:[2,length],Blocks:[7,blocks],Data:[7,data]}));
  const plugin=instrument(fs.readFileSync(path.join(__dirname,'../minecraft_obj_cubizer/minecraft_obj_cubizer.js'),'utf8'));
  const html=`<!doctype html><meta charset="utf-8"><style>
  :root{--color-back:#191c21}*{box-sizing:border-box}body{margin:0;padding:16px;background:#15171b;color:#d9dce2;font:14px 'Segoe UI','Microsoft YaHei',sans-serif;letter-spacing:0}.dialog{width:820px;max-width:100%;margin:0 auto;background:#292d35;padding:16px;max-height:calc(100vh - 32px);overflow:auto}h2{font-size:18px;margin:0 0 12px}.fields{display:grid;gap:6px;margin-bottom:12px}.fields label{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.fields input,.fields select{margin-left:auto;max-width:52%;width:180px}.fields label[data-field^='bounds'] input{width:80px;max-width:20%;margin-left:0}input,select,button{font:inherit;border:1px solid #40454e;background:#1e2128;color:#d9dce2;min-height:28px}input{padding:3px 6px}button{cursor:pointer;padding:3px 10px}button:disabled{opacity:.5}footer{display:flex;justify-content:flex-end;gap:8px;padding-top:10px}.material-icons{font-size:16px;font-style:normal}canvas{display:block;max-width:100%}
  </style><script src="/three"></script><script src="/controls"></script><script src="/vue"></script><script src="/bootstrap"></script><script src="/plugin"></script>`;
  const server=http.createServer((request,response)=>{
    const files={'/three':'three/build/three.min.js','/controls':'three/examples/js/controls/OrbitControls.js','/vue':'vue/dist/vue.js'};
    response.setHeader('Content-Type',request.url==='/'?'text/html; charset=utf-8':'text/javascript; charset=utf-8');
    if(files[request.url])response.end(fs.readFileSync(path.join(dependencies,files[request.url])));
    else if(request.url==='/bootstrap')response.end(bootstrap);
    else if(request.url==='/plugin')response.end(plugin);
    else if(request.url==='/building')response.end(bytes);
    else response.end(html);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'cubizer-preview-'));
  try{
    browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(()=>window.start());
    const initial=await page.evaluate(()=>{
      const v=Dialog.open.content_vue,p=v._structure_preview;p.renderer.render(p.scene,p.controls.object);
      const gl=p.renderer.getContext(),pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let visible=0,clipped=0;const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]){visible++;if(x===0||y===0||x===width-1||y===height-1)clipped++}
      return {count:v.preview_data.count,instances:v.preview_data.cells.length,visible,clipped,camera:p.controls.object.position.toArray()};
    });
    assert.ok(initial.visible>1000);assert.ok(initial.instances<=2048);
    assert.equal(initial.clipped,0,'preview must fit inside its viewport');
    await page.screenshot({path:path.join(output,'desktop.png')});
    const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+120);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+160,{steps:10});await page.mouse.up();
    const camera=await page.evaluate(()=>Dialog.open.content_vue._structure_preview.controls.object.position.toArray());assert.notDeepEqual(camera,initial.camera);
    await page.evaluate(()=>{const d=Dialog.open;d.values.filter_bounds=true;d.values.bounds_min=[3,0,3];d.values.bounds_max=[15,12,15];return d.content_vue.refresh()});
    await page.evaluate(()=>Dialog.open.content_vue.addPart());
    assert.equal(await page.evaluate(()=>Dialog.open.content_vue.parts.length),1);
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'mobile.png')});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);assert.equal(overflow,false);
    await page.evaluate(()=>{const d=Dialog.open;d.onConfirm(d.getFormResult())});
    await page.waitForFunction(()=>!Project.locked && Cube.all.length>0);
    assert.ok(await page.evaluate(()=>Group.all.some(g=>g.name==='part_1')));assert.deepEqual(errors,[]);
    console.log('PASS browser Worker, nonblank 3D preview, orbit interaction, range refresh, part editor and import');
    console.log('PASS desktop/mobile layout; screenshots: '+output);
    console.log('Preview cells: '+initial.instances+', source blocks: '+initial.count);
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1});
