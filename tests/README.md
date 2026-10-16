# 回归检查

在仓库根目录执行：

```powershell
node --check minecraft_obj_cubizer/minecraft_obj_cubizer.js
node tests/run.cjs
node tests/worker.cjs
node tests/zip.cjs
```

上述检查不需要安装依赖；Worker 检查需要带 DecompressionStream 的较新 Node.js（例如 Node.js 22）。测试使用内置模块、简化的 Blockbench API 和真实 worker_threads，临时资源包在系统临时目录创建，完成后删除。`run.cjs --keep-fixtures` 可保留临时资源用于实机检查。

`run.cjs` 的 28 项检查覆盖坐标与 ID 筛选、经典 schematic 元数据与高位 ID、Sponge v3、litematic 连续位存储与负尺寸、MCA DataVersion、不同 UV 尺寸、对象式纹理引用、透明度、完整方块/半砖/楼梯合并、旋转与着色限制、动画帧和真实帧尺寸、纹理密度、分块与运动部件边界、轴心、隐藏面、贴图复用、特殊方块完整性、取消回滚、OBJ 兼容、纹理预算、达到 cube 预算后停止遍历、暂缓渲染层恢复和图片尺寸预设。

## 大型建筑桌面检查

`desktop.cjs` 针对用户提供的 `tower.nbt`、26.2 客户端 JAR 和 `model.bbmodel`，使用本机安装的 Blockbench 5.2.2 与 Playwright/CDP。所有测试在独立临时 userData 中进行，不加载或修改用户日常工作区。路径为本机样例路径；异机运行需先调整路径，并安装浏览器检查所需的 Playwright。

```powershell
node tests/desktop.cjs
node tests/desktop.cjs --all-uv --pixel-grid
```

检查源方块数 2509、生成 cube 数 3677、纹理错误为零、导入低于 15 秒的回归预算和静态绘制调用低于 100 次。另检查代理/原生像素差异、原生拾取、选择后原生渲染、编辑/撤销、保存不混入代理，以及重新打开原 `model.bbmodel` 后的性能和 UV 控件限制。

2026-10-14 的独立桌面样例：旧流程约 3 秒、3892 次绘制调用；修复后约 1.5～1.8 秒、37 次调用；同时开启全模型 UV 与像素网格时约 3.5 秒。不是对所有硬件与插件组合的保证，也未完全复现原日常环境中半小时卡死的过程。

测试进程启动页会报原生 `Interface.Resizers.start_screen_width.update` 异步错误（安装包 bundle.js 第 3717 行），修改前后均有；模型生成和交互断言均通过。测试结束关闭其自身启动的应用进程。`--save-verified` 把重新打开的模型另存至 `info/tower_performance_verified.bbmodel`，不会覆盖原文件。

`worker.cjs` 检查真实后台 gzip/zlib 解压、选区读取、负尺寸 litematic、Sponge v3 和 MCA，并验证百万格预览不超过 2048 实例、后台任务可以终止。`zip.cjs` 检查普通 ZIP、ZIP64、存储/deflate、按资源索引和缓存，并模拟 Blockbench 受限文件接口没有 open/read/close 的情况。

## 浏览器检查

`browser.cjs` 使用真实浏览器 Worker、Three.js 和 Vue，Dialog 与模型 API 为测试替身，不能代替 Blockbench 实机验证。需要 Playwright、Three.js 0.129.x 和 Vue 2.7.x，可在单独的临时目录安装，然后传入该目录的 `node_modules`：

```powershell
npm install --prefix C:/Temp/cubizer-browser-check playwright@1.56.1 three@0.129.0 vue@2.7.16
node tests/browser.cjs C:/Temp/cubizer-browser-check/node_modules
```

测试默认使用 Windows Microsoft Edge。检查预览 canvas 非空、旋转交互、范围刷新、动画部件设置与导入，以及桌面/390 像素窄屏无横向溢出；截图路径打印在结果中。临时 HTTP 服务和浏览器会在结束时关闭。

## 实机记录

2026-10-13，使用 Blockbench 5.2.1、Animated Java 1.11.0 和 Minecraft 1.21.11 客户端 jar，在独立临时 Blueprint 中测试：

- 16 个相邻石头合并为 1 个 cube，保留原贴图重复密度。
- 同时导入箱子、告示牌、床的头尾、漏斗和炼药锅。
- 22 个源方块生成 32 个 cube，没有退回方块，11 张贴图全部加载成功。
- Animated Java `renderRig` 正常生成 1 个包含 cube 的骨骼。
- 原有 128x128 UV 尺寸保留；此前也检查了 128x64 的非正方形 UV 项目。
- 取消测试恢复导入前的 cube、组和贴图数量，没有残留 Undo 编辑事务。

同日通过 MCP 连接 Blockbench 5.2.2 与 Animated Java 1.11.0，对 1.6.0 使用独立临时项目验证：

- 原版 1.21.11 客户端 JAR 的模型、PNG 可读取，兼容新版受限文件接口。
- 百万格 schematic 在后台解析与扫描，低细节预览为 2048 个实例；本机样例耗时约 2.2 秒，不作为通用速度保证。
- 实际 Dialog 中的预览场景非空、拖动可旋转；关闭时释放控制器和 Worker。另有浏览器桌面/窄屏截图与像素检查。
- 8 个石头与 2 个海晶灯合并为 3 个 cube；海晶灯保留 5 帧动画、每帧 5 tick 的设置，所有贴图加载成功。
- `renderRig` 生成结构节点与 `body`、`moving` 两个骨骼；模型保留 128x64 项目 UV，帧布局写入项目数据。
- 箱子、床头和床尾模型与贴图可加载。水等没有可编辑 elements 的模型仍可能退回完整方块，并报告原因。
- 将两个 cube 整理为 `rotor` 部件后，坐标不变；撤销恢复到 `body`。取消 2000 个源方块的创建后，cube、组和贴图数量恢复，项目锁与 Undo 事务均已释放。
- 完整菜单流程：百万格文件进入预览后，缩小到 2x2x2 选区并添加动画部件；8 个源方块合并为 1 个 cube，无纹理错误，完成提示和 Undo 状态正常。

实机测试只关闭其自身创建并记录的临时项目，不关闭用户项目。未进行游戏内数据包导出与播放验证。
