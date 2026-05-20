# Format Notes From Local Research

## NBTExplorer

NBTExplorer is a generic NBT editor. It relies on `Substrate.dll` for Minecraft NBT and region IO.

Useful files in the local source tree:

- `E:\实用小工具\NBTExplorer-1\NBTModel\Data\Nodes\NbtFileDataNode.cs`
- `E:\实用小工具\NBTExplorer-1\NBTModel\Data\Nodes\RegionFileDataNode.cs`
- `E:\实用小工具\NBTExplorer-1\NBTModel\Data\Nodes\RegionChunkDataNode.cs`
- `E:\实用小工具\NBTExplorer-1\NBTUtil\Ops\JsonOperation.cs`

Key idea:

- `.dat`, `.nbt`, `.schematic` files are read as full NBT trees.
- Region files are expanded into chunks, and each chunk is read as NBT.
- Save/export rewrites the NBT tree.
- JSON export serializes a selected NBT tag.

This is good inspiration for a generic NBT reader/editor, but it does not translate Minecraft blocks into Blockbench cubes by itself.

## Mineways

Mineways is closer to this plugin goal. It manually reads Minecraft files and turns block data into geometry.

Useful files in the local source tree:

- `E:\实用小工具\Mineways-1\Win\nbt.h`
- `E:\实用小工具\Mineways-1\Win\nbt.cpp`
- `E:\实用小工具\Mineways-1\Win\region.cpp`
- `E:\实用小工具\Mineways-1\Win\MinewaysMap.cpp`
- `E:\实用小工具\Mineways-1\Win\ObjFileManip.cpp`

Key ideas:

- `level.dat` is read as gzip NBT.
- `.mca` files are read by the Anvil sector table.
- Chunk payloads are decompressed with zlib.
- Chunk NBT is scanned for `Sections` / `sections`.
- Old worlds use `Blocks` and `Data`.
- Modern worlds use `Palette` / `BlockStates` or `block_states.palette` / `block_states.data`.
- Export then writes OBJ, MTL, PNG, schematic, and other formats.

This prototype follows the same general direction:

1. Read compressed or uncompressed NBT.
2. Decode block palettes.
3. Decode packed block-state arrays.
4. Convert non-air blocks to Blockbench cubes.

