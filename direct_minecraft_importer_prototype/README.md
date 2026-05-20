# Minecraft Direct Import Prototype

> This prototype has been merged into `minecraft_obj_cubizer/minecraft_obj_cubizer.js` as of version 1.1.0. Keep this folder only as development reference.

> 该实验导入器已在 1.1.0 合并进 `minecraft_obj_cubizer/minecraft_obj_cubizer.js`。此文件夹现在只作为开发参考保留。

## What This Tries To Do

This prototype skips OBJ and reads Minecraft NBT-based files directly, then creates Blockbench Java cubes.

Supported first-pass inputs:

| Format | Status | Notes |
| --- | --- | --- |
| `.schematic` | Experimental | Classic MCEdit-style schematic with `Blocks` and `Data` arrays. |
| `.schem` | Experimental | Sponge-style schematic with `Palette` and VarInt `BlockData`. |
| `.nbt` | Experimental | Minecraft structure block files with `size`, `palette`, and `blocks`. |
| `.litematic` | Experimental | Litematica files with `Regions`, `BlockStatePalette`, and packed `BlockStates`. |
| `.mca` | Very experimental | Single Anvil region file only, with cube limit. Full world-folder import is not wired yet. |

## How To Test

1. Open Blockbench desktop.
2. Load this file as a local plugin:

```text
direct_minecraft_importer_prototype/direct_minecraft_importer_prototype.js
```

3. Use:

```text
File > Import > Import Minecraft Structure Prototype
```

4. Pick a `.schematic`, `.schem`, `.nbt`, `.litematic`, or small `.mca` file.

## Texture Source

NBT structure files usually do not contain PNG textures. The prototype now tries these sources:

1. The newest local Minecraft version jar under `%APPDATA%\.minecraft\versions`.
2. A resource pack root folder selected from:

```text
File > Import > Texture source folder or Minecraft jar
```

3. A manually pasted jar/zip/folder path in the import/settings dialog.

Supported texture source layouts:

```text
resource_pack/
└─ assets/minecraft/textures/block/stone.png
```

```text
textures/block/stone.png
```

```text
block/stone.png
```

## Special Block Models

The importer can now read Minecraft Java block model data from the selected texture source:

```text
assets/<namespace>/blockstates/<block>.json
assets/<namespace>/models/block/<model>.json
assets/<namespace>/textures/<texture>.png
```

This means blocks such as slabs, stairs, fences, walls, carpets, torches, buttons, panes, rails, pressure plates, and other normal JSON-modeled blocks can be imported as their actual small cuboid model pieces instead of a full cube.

Some renderer-only blocks do not contain normal cube elements in their block model JSON. The prototype now adds approximate Blockbench cuboids and entity texture paths for common cases:

```text
chest / trapped_chest / ender_chest / copper chest variants
sign / wall_sign / hanging_sign
bed
banner / wall_banner
player and mob heads
decorated_pot
copper_golem_statue variants
```

These models are meant as editable Blockbench geometry. Text data, inventories, banner patterns, decorated pot sherd NBT, skull owner skins, and other block entity data are still ignored.

The import settings include:

```text
Read Minecraft block models
```

Keep it enabled for special block shapes. Turn it off only when testing the old full-cube fallback.

## Current Limits

- Blocks with standard Java blockstate/model JSON are converted into model elements.
- Blocks without normal block model elements fall back to a full 1x1x1 cube.
- Many common block entities and entity-rendered blocks now use approximate editable cuboids, but detailed NBT payloads are ignored.
- Some renderer-only blocks may not have enough JSON model data in the vanilla assets.
- `.mca` import is only for testing a single region file. It is not a friendly world selection workflow yet.
- Textures can be loaded from a resource pack folder or Minecraft jar, but missing/custom mod textures still become placeholders.
- Large files should use a cube limit. Blockbench can become slow with thousands of cubes.

## Why This Is Separate

The released plugin already works for OBJ-to-cube conversion. This folder is a safe lab for direct NBT/world import logic. Once a format is stable here, the useful parts can be merged into the main plugin.
