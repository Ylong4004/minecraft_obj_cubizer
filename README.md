# Minecraft OBJ Cubizer / Minecraft OBJ 方块转换器

> 作者 / Author: Ylong
> 版本 / Version: 1.4.0
> 适用 / For: Blockbench 桌面版、Minecraft Java 版资源包模型、Animated Java 流程

Minecraft OBJ Cubizer 可以把 Minecraft 建筑 OBJ 转成 Blockbench Java 方块模型，也可以直接导入 Minecraft 结构文件。


## 功能 / Features

- OBJ 导入：读取 `.obj`、`.mtl`、PNG 贴图，并重建轴对齐方块。
- 直接导入：支持 `.schematic`、`.schem`、`.litematic`、结构 `.nbt`、单个 `.mca` 区域文件。
- 特殊方块：可读取原版 blockstate/model JSON，并内置箱子、床、告示牌、陶罐、铜傀儡像等基础模型。
- 贴图来源：可使用资源包根目录或 Minecraft jar 作为模型与贴图来源。
- Jar 预览贴图：从 Minecraft jar/zip 读取的贴图只用于预览，不会在保存时自动另存 PNG。
- 模型 UV：原版模型没有显式写 UV 的小面，会按 cube 实际像素尺寸自动计算 UV。
- 结构分组：直接导入结构时，同一个源方块生成的所有 cube 会放入同名组中。
- 红石预览：红石线会按 power 给贴图着色，并修正旋转连接的 UV 方向。
- 资源包路径：导出时自动补全 `minecraft:block/...` 或自定义命名空间路径。
- 导入提示：结构导入完成后会列出退回完整方块的方块 ID、数量和原因。
- 插件页面：自动修复 About、Changelog 和 Features 的本地显示来源。
- 顶栏菜单：所有插件功能已移动到 Blockbench 顶栏的 `Minecraft 方块转换器` 菜单。

## 菜单 / Menu

加载插件后，Blockbench 顶栏会出现：

```text
Minecraft 方块转换器
```

里面包含：

```text
将 Minecraft OBJ 导入为方块
导入 Minecraft 结构
OBJ 导入设置
结构导入设置
导出 OBJ 贴图到资源包
```

原先挂在 `文件 > 导入/导出` 里的插件功能已经移动到这个独立菜单。

## 推荐流程 / Recommended Workflow

1. OBJ 流程：用 Mineways 等工具把 Minecraft 建筑导出为 OBJ，然后用本插件导入。
2. 直接结构流程：准备 `.schematic`、`.schem`、`.litematic`、结构 `.nbt` 或小型 `.mca` 文件。
3. 在导入结构弹窗或“结构导入设置”里设置贴图来源，建议选择解包后的 Minecraft 资源目录或版本 jar。
4. 导入后检查模型、贴图和方块数量。
5. 使用 Blockbench 自带 Java Block/Item Model 导出 JSON。
6. 需要做原版动画时，再交给 Animated Java。

另一个插件下载链接：

https://treehey.github.io/Fimel/#/works/tools

## 注意 / Notes

- OBJ 转换适合由 Minecraft 方块组成、轴对齐的建筑模型，不适合普通三角网格或曲面模型。
- 直接结构导入会读取方块模型，但不会读取箱子物品、告示牌文字等方块实体数据。
- 结构导入里的方块上限统计的是生成后的 Blockbench cube，不是原始 Minecraft 方块数；默认上限是 5,000 个 cube。
- 若要导出为 Java Block/Item Model，建议最终模型尽量控制在约 48 x 48 x 48 格以内。
- 大型建筑建议拆分导入。超过 5,000 个 cube 可能变慢，超过 10,000 个 cube 通常建议分批处理。
- 修改插件后，需要在 Blockbench 里重新加载插件。
