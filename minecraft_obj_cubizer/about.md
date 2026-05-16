# Minecraft OBJ Cubizer

Minecraft OBJ Cubizer converts Minecraft-style OBJ building exports into textured Java Block/Item cube models in Blockbench.

Minecraft OBJ 方块转换器可以把 Minecraft 建筑导出的 OBJ 模型转换成 Blockbench 里的 Java Block/Item 方块模型，并保留 OBJ/MTL 中的贴图引用。

## What It Does

- Imports OBJ files generated from Minecraft buildings.
- Reads MTL material files and PNG texture paths.
- Rebuilds axis-aligned OBJ quad faces into Blockbench cubes.
- Adds imported cubes to the current project when one is open.
- Exports texture paths with a namespace, such as `minecraft:block/iron_block` or `fo:block/iron_block`.
- Copies OBJ textures into a resource pack folder.
- Warns when an import is likely to generate too many cubes for comfortable Blockbench performance.

## Recommended Workflow

1. Export your Minecraft building as OBJ. Mineways is a good tool for this.
2. Keep the `.obj`, `.mtl`, and texture files in the same exported folder structure.
3. In Blockbench, use `File > Import > Import Minecraft OBJ as Cubes`.
4. Keep `OBJ block scale` at `1` for most Mineways exports.
5. Set the texture namespace and texture folder for your resource pack.
6. Export the Java Block/Item JSON.
7. Use `File > Export > Export OBJ Textures to Resource Pack` to copy textures.
8. Continue animation work in Animated Java if needed.

## Notes

This plugin is designed for Minecraft buildings made from axis-aligned blocks. It is not intended for ordinary triangulated mesh models, curved models, or heavily slanted geometry.

For large buildings, imports above 5,000 generated cubes may become slow. Imports above 10,000 generated cubes should usually be split into smaller OBJ parts.

