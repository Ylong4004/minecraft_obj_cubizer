# 【Minecraft OBJ 方块转换器】使用说明

> 插件名：Minecraft OBJ 方块转换器 / Minecraft OBJ Cubizer  
> 作者：Ylong  
> 版本：1.0.0  
> 适用：Blockbench 桌面版、Minecraft Java 版资源包模型、Animated Java 原版动画流程

---

## 【插件用途】

这个插件用于把 Minecraft 建筑导出的 `.obj` 模型转换成 Blockbench 的 Java Block/Item 方块模型。

适合处理 Mineways 等工具导出的建筑 OBJ。插件会读取：

| 文件 | 用途 |
| --- | --- |
| `.obj` | 建筑模型数据 |
| `.mtl` | 材质和贴图引用 |
| `.png` | 方块贴图 |

插件会尽量把轴对齐的四边形面重组成 Blockbench 方块，并保留对应贴图，方便后续交给 Animated Java 做原版动画。

---

## English Quick Start

Minecraft OBJ Cubizer converts Minecraft building OBJ exports into textured Java Block/Item cube models in Blockbench.

Recommended workflow:

1. Export the Minecraft building as OBJ with Mineways or a similar tool.
2. Keep the `.obj`, `.mtl`, and texture files in their original exported folder structure.
3. Load `minecraft_obj_cubizer/minecraft_obj_cubizer.js` in Blockbench.
4. Use `File > Import > Import Minecraft OBJ as Cubes`.
5. Keep `OBJ block scale` at `1` for most Mineways exports.
6. Set the texture namespace and texture folder for your resource pack.
7. Export the Java Block/Item JSON.
8. Use `File > Export > Export OBJ Textures to Resource Pack` to copy textures.

Large imports may slow Blockbench down. The plugin warns above 5,000 generated cubes and shows a stronger warning above 10,000 generated cubes.

---

## 【适合与不适合】

| 类型 | 说明 |
| --- | --- |
| 适合 | 由 Minecraft 方块组成的建筑 OBJ |
| 适合 | Mineways 或类似工具导出的方块模型 |
| 适合 | 轴对齐、没有复杂斜面的模型 |
| 不适合 | 普通三角网格模型 |
| 不适合 | 非方块结构、复杂曲面、斜面模型 |

---

## 【文件准备】

备注：如果你还没有把 Minecraft 建筑转换成 OBJ，可以参考使用 Mineways 这个工具先导出建筑模型。

导入前，请确保 OBJ、MTL、贴图文件保持原本的导出目录结构，例如：

```text
helicopter_obj/
├─ helicopter.obj
├─ helicopter.mtl
└─ tex/
   ├─ iron_block.png
   ├─ red_concrete.png
   └─ ...
```

注意：不要只移动 `.obj` 文件。`.mtl` 和贴图路径丢失后，插件就无法正确读取材质。

---

## 【安装方法】

1. 打开 Blockbench 桌面版。
2. 打开插件窗口。
3. 选择从文件加载插件。
4. 选择插件文件：

```text
minecraft_obj_cubizer/minecraft_obj_cubizer.js
```

加载成功后，Blockbench 的文件菜单里会出现新的导入和导出功能。

---

## 【相关链接】

另一个插件下载链接：

```text
https://treehey.github.io/Fimel/#/works/tools
```

---

## 【导入方法】

打开菜单：

```text
文件 > 导入 > 将 Minecraft OBJ 导入为方块
```

然后选择你的 OBJ 文件，例如：

```text
helicopter_obj/helicopter.obj
```

确认参数后，如果当前窗口已经打开项目，插件会把 OBJ 中的方块结构直接导入到当前项目中。

如果当前没有打开项目，并且开启了“自动创建 Java Block 项目”，插件才会新建 Java Block/Item 项目。

---

## 【导入参数推荐】

| 参数 | 推荐值 | 说明 |
| --- | --- | --- |
| 自动创建 Java Block 项目 | 开启 | 仅在没有打开项目时自动创建适合导出资源包模型的项目 |
| OBJ 方块缩放 | `1` | Mineways 建筑 OBJ 通常 1 个方块等于 1 个 OBJ 单位 |
| 默认方块厚度 | `1` | 普通方块按完整方块处理 |
| 贴图尺寸 | `16` | Minecraft 默认方块贴图尺寸 |
| 贴图命名空间 | `minecraft` 或自定义 | 例如资源包命名空间为 `fo` 就填 `fo` |
| 贴图文件夹 | `block` | 对应资源包里的 `textures/block` |
| 将模型居中到原点 | 按需开启 | 需要模型围绕原点制作动画时可以开启 |
| 设置 Java cullface | 按需开启 | 需要自动设置面剔除时开启 |

---

## 【方块数量提示】

插件本身没有写死最大导入数量，但 Blockbench 在处理大量 Cube 时会变慢。

导入前插件会根据预计生成的 Cube 数量进行提示：

| 预计生成 Cube 数量 | 提示 |
| --- | --- |
| `5000` 以下 | 通常比较稳 |
| `5000` 以上 | 弹出性能提醒 |
| `10000` 以上 | 弹出更强的性能警告，建议拆分 OBJ |

如果是很大的 Minecraft 建筑，建议先拆成几个 OBJ 分批导入。

---

## 【随时修改设置】

插件设置入口：

```text
文件 > 导入 > Minecraft OBJ 方块转换器设置
```

这里可以随时修改默认导入参数。修改后会影响后续导入，并且可以把贴图命名空间、贴图文件夹、贴图尺寸、cullface 等设置应用到当前项目里已导入的 OBJ 方块。

---

## 【重要：OBJ 方块缩放】

推荐保持：

```text
OBJ 方块缩放 = 1
```

Mineways 导出的 Minecraft 建筑 OBJ 通常是：

```text
1 个 Minecraft 方块 = 1 个 OBJ 单位
```

所以这里填 `1` 最合适。

不要随便填 `16`。如果填 `16`，每个方块都会被放大成 16 个模型单位，导出的 JSON 坐标可能变成：

```json
"from": [0, 112, 64],
"to": [16, 128, 80]
```

这种坐标容易超出 Java Block/Item 模型常见范围，导致游戏或 Blockbench 导出时报错。

如果插件提示坐标超出范围，建议选择：

```text
使用推荐缩放
```

---

## 【贴图命名空间】

导入时可以填写资源包命名空间。

默认值：

```text
minecraft
```

如果你的资源包命名空间是 `fo`，就填写：

```text
fo
```

贴图文件夹通常填写：

```text
block
```

导出的 JSON 贴图路径会变成：

```json
{
  "textures": {
    "particle": "fo:block/iron_block",
    "iron_block": "fo:block/iron_block",
    "red_concrete": "fo:block/red_concrete"
  }
}
```

如果命名空间保持默认，则会导出为：

```json
"iron_block": "minecraft:block/iron_block"
```

---

## 【导出模型 JSON】

导入完成后，使用 Blockbench 自带导出功能：

```text
文件 > 导出 > Java Block/Item Model
```

导出的文件就是 Minecraft Java 版资源包模型 JSON。

---

## 【导出贴图到资源包】

插件提供了贴图复制功能：

```text
文件 > 导出 > 导出 OBJ 贴图到资源包
```

选择资源包根目录，也就是包含 `pack.mcmeta` 的文件夹。

插件会自动把贴图复制到：

```text
assets/<命名空间>/textures/<贴图文件夹>/
```

示例：

| 导入参数 | 值 |
| --- | --- |
| 贴图命名空间 | `fo` |
| 贴图文件夹 | `block` |

贴图会导出到：

```text
assets/fo/textures/block/
```

---

## 【推荐工作流程】

1. 用 Mineways 或其他工具把 Minecraft 建筑导出为 OBJ。
2. 确认 `.obj`、`.mtl`、`.png` 贴图都在导出目录中。
3. 在 Blockbench 中加载 `minecraft_obj_cubizer/minecraft_obj_cubizer.js`。
4. 使用“将 Minecraft OBJ 导入为方块”导入 OBJ。
5. `OBJ 方块缩放` 保持 `1`。
6. 填写正确的贴图命名空间和贴图文件夹。
7. 使用 Blockbench 导出 Java Block/Item JSON。
8. 使用“导出 OBJ 贴图到资源包”复制贴图。
9. 把模型交给 Animated Java 继续制作原版动画。

---

## 【常见问题】

### 导出的 JSON 坐标太大怎么办？

把 `OBJ 方块缩放` 改回 `1`，或者在插件提示时选择“使用推荐缩放”。

### 为什么贴图没有显示？

请检查 `.obj`、`.mtl` 和贴图文件是否还保持原来的目录关系。只复制 OBJ 文件通常会导致贴图丢失。

### 自定义资源包命名空间怎么填？

如果你的资源包路径是：

```text
assets/fo/textures/block/
```

那么导入时填写：

```text
贴图命名空间 = fo
贴图文件夹 = block
```

### 修改插件后为什么没生效？

修改 `minecraft_obj_cubizer.js` 后，需要在 Blockbench 中重新加载插件。
