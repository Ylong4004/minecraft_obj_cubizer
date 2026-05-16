# Minecraft OBJ Cubizer / Minecraft OBJ 方块转换器

Minecraft OBJ Cubizer converts Minecraft-style OBJ building exports into textured Java Block/Item cube models in Blockbench.

Minecraft OBJ 方块转换器可以把 Minecraft 建筑导出的 OBJ 模型转换成 Blockbench 里的 Java Block/Item 方块模型，并保留 OBJ/MTL 中的贴图引用。

## Features / 功能

- Import OBJ files generated from Minecraft buildings. / 导入由 Minecraft 建筑生成的 OBJ 文件。
- Read MTL material files and PNG texture paths. / 读取 MTL 材质文件和 PNG 贴图路径。
- Rebuild axis-aligned OBJ quad faces into Blockbench cubes. / 将轴对齐的 OBJ 四边形面重组为 Blockbench 方块。
- Add imported cubes to the current project when one is open. / 当前已有项目时，直接把导入方块加入当前项目。
- Auto-create a Java Block project when no project is open. / 当前没有项目时，可以自动创建 Java Block 项目。
- Export texture paths with explicit namespaces, such as `minecraft:block/iron_block` or `fo:block/iron_block`. / 导出带命名空间的贴图路径，例如 `minecraft:block/iron_block` 或 `fo:block/iron_block`。
- Copy OBJ textures into a resource pack folder. / 将 OBJ 贴图复制到资源包目录。
- Warn when an import may create too many cubes for comfortable Blockbench performance. / 当预计生成过多方块、可能影响 Blockbench 性能时给出提示。

## Recommended Workflow / 推荐流程

1. Export your Minecraft building as OBJ. Mineways is a good tool for this. / 使用 Mineways 等工具把 Minecraft 建筑导出为 OBJ。
2. Keep the `.obj`, `.mtl`, and texture files in the same exported folder structure. / 保持 `.obj`、`.mtl` 和贴图文件的原始导出目录结构。
3. In Blockbench, use `File > Import > Import Minecraft OBJ as Cubes`. / 在 Blockbench 中使用“文件 > 导入 > 将 Minecraft OBJ 导入为方块”。
4. Keep `OBJ block scale` at `1` for most Mineways exports. / 对大多数 Mineways 导出文件，`OBJ 方块缩放` 建议保持 `1`。
5. Set the texture namespace and texture folder for your resource pack. / 按资源包需要填写贴图命名空间和贴图文件夹。
6. Export the Java Block/Item JSON. / 导出 Java Block/Item 模型 JSON。
7. Use `File > Export > Export OBJ Textures to Resource Pack` to copy textures. / 使用“文件 > 导出 > 导出 OBJ 贴图到资源包”复制贴图。
8. Continue animation work in Animated Java if needed. / 如有需要，再交给 Animated Java 继续制作原版动画。

## Notes / 注意事项

This plugin is designed for Minecraft buildings made from axis-aligned blocks. It is not intended for ordinary triangulated mesh models, curved models, or heavily slanted geometry.

本插件主要适合由轴对齐方块组成的 Minecraft 建筑，不适合普通三角网格模型、曲面模型或大量斜面结构。

For large buildings, imports above 5,000 generated cubes may become slow. Imports above 10,000 generated cubes should usually be split into smaller OBJ parts.

对于大型建筑，预计生成超过 5,000 个 Cube 时可能会变慢；超过 10,000 个 Cube 时通常建议先拆成多个 OBJ 分批导入。

