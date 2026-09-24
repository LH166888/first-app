/**
 * 一次性工具：处理 by_08.png（豆包生成的乌龟序列帧，导出时丢了透明通道，
 * 背景是灰白棋盘格实体像素）。
 *   1. 按颜色（低饱和 + 高亮 = 灰白格）判定背景，其余为前景；
 *   2. 全图连通域标记，取面积最大的 18 块 = 18 只乌龟，求各自真实包围盒与中心；
 *   3. 按行列还原帧顺序，打印逐帧坐标表；
 *   4. 传入 --write 时，输出一张真透明版覆盖 by_08.png（原图先备份为 by_08.original.png）。
 * 用法：node scripts/detect-turtle-frames.cjs [--write]
 */
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const IMG = path.resolve(__dirname, '../src/modules/fishing/assets/_demo_spine/by_08.png')
const WRITE = process.argv.includes('--write')

const png = PNG.sync.read(fs.readFileSync(IMG))
const { width, height, data } = png
const N = width * height

// 背景判定：灰白棋盘格 = 低饱和(R≈G≈B) 且偏亮
const isBg = (idx) => {
  const i = idx * 4
  const r = data[i], g = data[i + 1], b = data[i + 2]
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  return sat < 22 && Math.min(r, g, b) > 175
}

// 前景掩码
const fg = new Uint8Array(N)
for (let i = 0; i < N; i++) fg[i] = isBg(i) ? 0 : 1

// 连通域标记（4 邻接 BFS）
const label = new Int32Array(N).fill(-1)
const queue = new Int32Array(N)
const blocks = []
for (let start = 0; start < N; start++) {
  if (fg[start] === 0 || label[start] !== -1) continue
  let head = 0, tail = 0
  queue[tail++] = start
  label[start] = blocks.length
  let minX = width, minY = height, maxX = 0, maxY = 0, count = 0
  while (head < tail) {
    const p = queue[head++]
    const x = p % width, y = (p / width) | 0
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    count++
    // 4 邻接
    if (x > 0 && fg[p - 1] && label[p - 1] === -1) { label[p - 1] = blocks.length; queue[tail++] = p - 1 }
    if (x < width - 1 && fg[p + 1] && label[p + 1] === -1) { label[p + 1] = blocks.length; queue[tail++] = p + 1 }
    if (y > 0 && fg[p - width] && label[p - width] === -1) { label[p - width] = blocks.length; queue[tail++] = p - width }
    if (y < height - 1 && fg[p + width] && label[p + width] === -1) { label[p + width] = blocks.length; queue[tail++] = p + width }
  }
  blocks.push({ minX, minY, maxX, maxY, count })
}

// 取面积最大的 18 块（滤掉水花/噪点小块）
blocks.sort((a, b) => b.count - a.count)
const turtles = blocks.slice(0, 18)
console.log('连通块总数:', blocks.length, ' 取前 18 块像素数范围:',
  turtles[17].count, '~', turtles[0].count)

// 按行(cy)分组再按列(cx)排序，还原 6×3 帧顺序
turtles.forEach(t => { t.cx = (t.minX + t.maxX) / 2; t.cy = (t.minY + t.maxY) / 2 })
turtles.sort((a, b) => a.cy - b.cy)
const rows = [turtles.slice(0, 6), turtles.slice(6, 12), turtles.slice(12, 18)]
rows.forEach(r => r.sort((a, b) => a.cx - b.cx))
const ordered = rows.flat()

console.log('\n// by_08 (species 4) 乌龟逐帧坐标表（连通域检测，18 帧，按各帧中心对齐）')
console.log('const BY_08_FRAMES = [')
ordered.forEach((t, i) => {
  const w = t.maxX - t.minX + 1
  const h = t.maxY - t.minY + 1
  console.log(`  { x: ${t.minX}, y: ${t.minY}, w: ${w}, h: ${h}, cx: ${Math.round(t.cx)}, cy: ${Math.round(t.cy)} }, // 帧 ${i}`)
})
console.log(']')

const ws = ordered.map(t => t.maxX - t.minX + 1)
const hs = ordered.map(t => t.maxY - t.minY + 1)
console.log('\n宽度范围:', Math.min(...ws), '~', Math.max(...ws))
console.log('高度范围:', Math.min(...hs), '~', Math.max(...hs))

if (WRITE) {
  // 生成真透明版：背景像素 alpha=0
  const out = new PNG({ width, height })
  for (let i = 0; i < N; i++) {
    const o = i * 4
    out.data[o] = data[o]
    out.data[o + 1] = data[o + 1]
    out.data[o + 2] = data[o + 2]
    out.data[o + 3] = fg[i] ? 255 : 0
  }
  const backup = IMG.replace(/by_08\.png$/, 'by_08.original.png')
  if (!fs.existsSync(backup)) fs.copyFileSync(IMG, backup)
  fs.writeFileSync(IMG, PNG.sync.write(out))
  console.log('\n✅ 已生成透明版 by_08.png（原图备份为 by_08.original.png）')
}
