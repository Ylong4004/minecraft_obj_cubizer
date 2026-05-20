# Minecraft OBJ Cubizer / Minecraft OBJ 方块转换器

Minecraft OBJ 方块转换器可以把 Minecraft 建筑导入为可编辑的 Blockbench Java 方块模型。

## 功能

- 导入带 MTL/PNG 贴图的 Minecraft 建筑 OBJ。
- 直接导入 `.schematic`、`.schem`、`.litematic`、结构 `.nbt` 和单个 `.mca` 区域文件。
- 读取原版或资源包中的 blockstate/model JSON，支持半砖、楼梯、栅栏、石墙、按钮、火把等特殊方块。
- 按 cube 面的真实像素尺寸计算原版模型缺省 UV。
- 导出或修正带命名空间的贴图路径。
- 结构导入完成后显示退回完整方块的方块 ID、数量和原因。
- 将导入的 OBJ 贴图复制到资源包目录。
- 所有功能都位于 Blockbench 顶栏独立菜单中。
- 保持本地插件安装记录可在重启 Blockbench 后继续加载。

## 菜单

加载插件后，Blockbench 顶栏会出现：

```text
Minecraft Cubizer / Minecraft 方块转换器
```

菜单中包含 OBJ 导入、直接结构导入、两套设置和贴图导出。

贴图来源文件夹和 Minecraft Jar/Zip 文件可以直接在导入结构弹窗和“结构导入设置”中选择。

直接结构导入会把同一个源方块生成的所有 cube 放进同一个组，组名使用该方块名字。

从 Minecraft Jar/Zip 读取的贴图会被视为仅预览资源，保存模型时不会自动另存原版 PNG 贴图。

## 注意

直接导入不会读取箱子物品、告示牌文字、旗帜图案或自定义头颅主人等方块实体数据。

结构导入里的方块上限统计的是生成后的 Blockbench cube，不是原始 Minecraft 方块数。默认上限是 5000 个 cube。若要导出为 Java Block/Item Model，建议最终模型尽量控制在约 48 x 48 x 48 格以内。
