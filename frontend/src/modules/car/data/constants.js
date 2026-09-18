/**
 * 纯前端展示/筛选常量（与后端无关，不随数据变化）。
 * 车型数据本身已改为从后端 API 获取（见 src/api/cars.js），不再有写死的本地数组。
 * energy: ev=纯电, phev=插混, fuel=燃油 ; level: 轿车 / SUV / MPV
 */

// 统计年度（与后端 cars.year 一致；用于页面标题展示）
export const YEAR = 2023

// 供筛选使用的选项
export const LEVELS = ['SUV', '轿车', 'MPV']

export const ENERGY_TYPES = [
  { key: 'ev', label: '纯电' },
  { key: 'phev', label: '插混' },
  { key: 'fuel', label: '燃油' },
]

export const PRICE_RANGES = [
  { key: '0-10', label: '10万以下', min: 0, max: 10 },
  { key: '10-20', label: '10-20万', min: 10, max: 20 },
  { key: '20-30', label: '20-30万', min: 20, max: 30 },
  { key: '30-50', label: '30-50万', min: 30, max: 50 },
  { key: '50+', label: '50万以上', min: 50, max: Infinity },
]

export const ENERGY_LABEL = { ev: '纯电', phev: '插混', fuel: '燃油' }

// 品牌列表由车型数据派生（传入 API 返回的车型数组）
export function deriveBrands(cars) {
  return [...new Set(cars.map((c) => c.brand))].sort()
}
