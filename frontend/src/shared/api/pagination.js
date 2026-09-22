import client from './client'

// 后端统一分页信封：
//   { data: [...], meta: { current_page, per_page, total, last_page } }
// 请求参数：?page=1&per_page=15，per_page 上限 50。
//
// 现有列表多依赖「完整数据」：榜单要做客户端筛选/图表/名次计算，收藏要拿到收藏 id 全集。
// 为不破坏这些功能、同时适配分页信封，这里翻页拉取全部数据再拼成完整数组返回。
// 数据量小时通常一次请求即完成；仅当某接口数据超过单页上限时才会多请求几次。
const PER_PAGE = 50 // 取后端上限，尽量减少请求次数

// 拉取某列表接口的全部分页数据。
// path：接口路径（如 '/cars'）；params：附加查询参数（筛选条件等）。
// 返回 { items, meta }：items 为全部数据数组，meta 为最后一页的分页信息。
export async function fetchAllPages(path, params = {}) {
  const items = []
  let page = 1
  let meta = {}
  // 循环直到最后一页；某页空数据也兜底跳出，避免异常时死循环。
  while (true) {
    const res = await client.get(path, { params: { ...params, page, per_page: PER_PAGE } })
    const body = res.data || {}
    const pageItems = Array.isArray(body.data) ? body.data : []
    items.push(...pageItems)
    meta = body.meta || {}
    const lastPage = Number(meta.last_page) || 1
    if (page >= lastPage || pageItems.length === 0) break
    page += 1
  }
  return { items, meta }
}
