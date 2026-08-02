# Fireflydle 角色数据源调研

调研日期：**2026-08-02**。本文只评估可重复、可审计的自动同步来源；“接口当前可访问”不等于服务方承诺长期兼容，也不等于获得了游戏素材再分发许可。

## 结论

没有单一来源能同时稳定提供“正式实装名单、三语名称、游戏 ID、属性、命途、稀有度、首发版本、组织派系和图片”。建议保留多源合并，但重新划清职责：

1. **HoYoverse `content_v2_user` 继续作为正式名单、三语名称和官网图片的主来源。** 它直接服务官网 Character 页，最适合决定“网站何时收录一个角色”，但它的页签是展示分组，不是完整的剧情势力模型。
2. **新增官方 HoYoWiki 作为第二个一手校验源。** 它结构化提供属性、命途、稀有度和可多选的宽泛阵营；Sunday 在英文接口中同时属于 `Penacony` 与 `Cosmos`，比 Character 页的单值 `cha_tab_6` 更完整。不过它仍没有 `Family` 这种组织级派系。
3. **StarRailRes 只补游戏 ID、属性、命途和稀有度，并固定到 commit SHA。** 不用它决定正式实装名单、版本或剧情势力；其上游 Dimbreath/StarRailData 已因 DMCA 被 GitHub 禁用，法律和持续供应风险都高于官方来源。
4. **Biligame 星铁 Wiki 只作为中文派系/首发版本的补充与审核输入。** 必须分别保存 `阵营`、`初始阵营`、`派系[]`，不能把任一字段直接覆盖为网站唯一的 `factionId`。它是社区数据，适合发现缺漏和生成待审核差异，不适合无审核地决定每日答案。

推荐的优先级为：

| 等级 | 来源                             | 推荐角色                                               |
| ---- | -------------------------------- | ------------------------------------------------------ |
| A    | HoYoverse Character `content-v2` | 正式名单、三语展示名、官网图片、官网展示分组、发布时间 |
| A-   | 官方 HoYoWiki API                | 属性/命途/稀有度复核、宽泛多阵营复核、备用官方图片     |
| B    | Mar-7th/StarRailRes              | 游戏内部 ID、开拓者形态、结构化属性/命途/稀有度        |
| B-   | Biligame Semantic MediaWiki API  | 中文阵营/初始阵营/派系、实装版本的社区交叉验证         |
| C    | Fandom MediaWiki API             | 英文人工抽查；不进入自动合并主链路                     |

## 字段覆盖矩阵

“部分”表示字段可见但不够稳定或语义不等同于 Fireflydle 所需字段。

| 来源                   | 角色名/多语言                              | 属性                        | 命途 | 稀有度 | 版本                                 | 阵营/派系                                  | 图片                                |
| ---------------------- | ------------------------------------------ | --------------------------- | ---- | ------ | ------------------------------------ | ------------------------------------------ | ----------------------------------- |
| HoYoverse `content-v2` | 是，`zh-cn/en-us/ja-jp`                    | 部分，`property` 是元素图标 | 否   | 否     | 部分，可用官方版本公告与生效时间对齐 | 部分，Character 页单值展示页签             | 是，头像/海报官方 CDN URL           |
| 官方 HoYoWiki          | 是，至少中/英/日；不同语言发布数量可能不同 | 是                          | 是   | 是     | 否                                   | 是，宽泛阵营可多选；没有组织级 Family      | 是，列表图标及详情素材              |
| StarRailRes            | 是，`cn/cht/en/jp/...` 12 种索引           | 是                          | 是   | 是     | 否                                   | 否                                         | 是，头像/预览/立绘资源路径          |
| Biligame Wiki          | 中文名                                     | 是                          | 是   | 是     | 是，`实装版本`                       | 是，分别有 `阵营`、`初始阵营`、多值 `派系` | 是，可经 MediaWiki 页面图片接口取得 |
| Fandom Wiki            | 英文为主                                   | 是                          | 是   | 是     | 通常可从页面取得                     | 部分，infobox 多为单值宽泛 faction         | 是，页面图片接口                    |

## 1. HoYoverse Character `content_v2_user`

### 已验证的访问方式与字段

官网 [Character 页](https://hsr.hoyoverse.com/en-us/character)使用以下公开读取端点：

```text
GET https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList
    ?iChanId=242&iPage=1&iPageSize=500&sLangKey=en-us
```

- 频道 242：角色条目的 `sTitle`、`sExt.name`、`sExt.cha-id`、头像/海报 URL、`sCategoryName`、`dtStartTime`、`dtEndTime`、`iInfoId`。可分别请求 [中文](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=242&iPage=1&iPageSize=500&sLangKey=zh-cn)、[英文](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=242&iPage=1&iPageSize=500&sLangKey=en-us)和[日文](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=242&iPage=1&iPageSize=500&sLangKey=ja-jp)。
- [频道 241](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=241&iPage=1&iPageSize=500&sLangKey=en-us)：官网 Character 页签的本地化名称。
- [频道 250](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=250&iPage=1&iPageSize=500&sLangKey=en-us)：正式版本公告，可把角色生效时间对齐到首发版本。

2026-08-02 实测三种语言的频道 242 均返回 85 条。Sunday 的英文条目为 `sCategoryName=cha_tab_6`，但 `sExt.property` 只是带有 `Imaginary.png` 文件名的图片，不是有契约的元素枚举；接口也没有结构化命途或稀有度。因此继续用 StarRailRes/HoYoWiki 校验这些字段是合理的。

### 更新、版本化和风险

- 优点：第一方、与官网上线同步、条目有生效/失效时间和稳定的 `iInfoId`，最适合充当正式名单的发布闸门。
- 风险：这是官网内部内容接口，没有公开 API 文档、版本号或 SLA；app ID、频道 ID、字段结构和 CDN URL 都可能变化。实测响应也没有可依赖的 `ETag` 或 `Last-Modified`。
- 建议：继续保存完整请求 URL、响应摘要哈希、抓取时间和上次有效缓存；三语 ID 集、最低数量、未知页签和素材魔数校验失败时停止发布。

### 许可与署名

公开可读不构成开放数据/素材许可证。角色名称、图片和商标仍受权利人条款约束，应继续保留非官方声明、素材来源 URL、内容哈希和 takedown 流程；参见 HoYoverse [Terms of Service](https://www.hoyoverse.com/en-us/company/terms)。

## 2. 官方 HoYoWiki API

### 已验证的访问方式与字段

官方入口是 [HoYoWiki HSR](https://wiki.hoyolab.com/pc/hsr/home)，API base 为：

```text
https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/
```

请求需带 `x-rpc-wiki_app: hsr`、`x-rpc-language`、`x-rpc-client_type: 4` 等网页客户端头。已验证的只读调用为：

- `GET` [`get_menus`](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/get_menus)：角色菜单为 `menu_id=104`。
- `GET` `get_menu_filters?menu_id=104`：返回 element、path、rarity、faction 的枚举。
- `POST` `get_entry_page_list`，body 为 `{"filters":[],"menu_id":"104","page_num":1,"page_size":50,"use_es":true}`：返回 `entry_page_id`、本地化名称、`icon_url` 和 `filter_values`。
- `GET` [`entry_page?entry_page_id=3150`](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/entry_page?entry_page_id=3150)：Sunday 详情页；Robin 的 `entry_page_id` 为 2366。

英文角色列表中：

- Sunday：`character_factions.values = ["Penacony", "Cosmos"]`；
- Robin：`character_factions.values = ["Penacony"]`。

这证明官网 Character 页的单一 `cha_tab_*` 不能被解释成角色唯一势力。HoYoWiki 的宽泛阵营数组更适合保存成 `officialFactionGroups[]`，但它仍没有 `Family`/“家族”这种组织级派系。

### 更新、版本化和风险

- 2026-08-02 实测英文、日文列表各 92 条，中文 90 条；不同语言会短暂不同步，不能假设一次抓取即可按名称一一对齐。
- 列表含新角色且结构化程度高，更新及时；但 `entry_page_id` 不是游戏角色 ID，也没有首发版本字段。
- API 同样没有公开开发者 SLA或稳定 schema，`POST` 还依赖网页客户端头；应按语言分页抓取、记录响应哈希，并以 HoYoverse Character 页决定是否正式收录。

### 许可与署名

它是 HoYoverse/HoYoLAB 第一方页面，但没有开放数据许可。数据事实可用于交叉校验，图片仍应执行与官网素材相同的来源记录、最小化保存和下架策略，并遵守 [HoYoverse Terms of Service](https://www.hoyoverse.com/en-us/company/terms)。

## 3. Mar-7th/StarRailRes

### 已验证的访问方式与字段

[StarRailRes 仓库](https://github.com/Mar-7th/StarRailRes)的 [README](https://github.com/Mar-7th/StarRailRes/blob/master/README.md)说明 `index_new/[language]/characters.json` 是角色基本信息，仓库还包含图标、预览和立绘资源。`index_min` 当前有 `cn/cht/de/en/es/fr/id/jp/kr/pt/ru/th/vi` 等本地化目录；角色记录包含游戏 ID、名称、`rarity`、`path`、`element` 和素材路径。

推荐通过 [GitHub commits API](https://api.github.com/repos/Mar-7th/StarRailRes/commits/master)先解析 40 位 SHA，再读取例如：

```text
https://raw.githubusercontent.com/Mar-7th/StarRailRes/<commit>/index_min/en/characters.json
```

这样一次发布不会混用浮动 `master` 的多个时点。2026-08-02 验证到当前 commit 为 `b95e75c7e1273d819d20c530c0b7e13a3ef19fb4`，提交时间 2026-07-18。

### 更新、版本化和风险

- Git commit 本身提供良好的不可变修订键；仓库仍活跃，结构简单，特别适合补齐官网缺少的游戏 ID 和开拓者形态。
- 它不提供可靠的正式实装日期、首发版本或剧情派系，且可能先出现尚未正式上线的数据，所以不能控制 roster。
- README 明确声明游戏数据源是 [Dimbreath/StarRailData](https://github.com/Dimbreath/StarRailData)；该上游当前返回 HTTP 451，GitHub 页面注明因 [HoYoverse DMCA notice](https://github.com/github/dmca/blob/master/2024/10/2024-10-10-hoyoverse.md)被禁用。这是供应链和内容权利风险，必须保留官方名单闸门与缓存降级，不能将 StarRailRes 升为唯一主源。

### 许可与署名

仓库标注 [AGPL-3.0](https://github.com/Mar-7th/StarRailRes/blob/master/LICENSE)。该许可证覆盖仓库贡献者可许可的内容，但不能替 HoYoverse 授权游戏美术、商标或原始游戏数据。Fireflydle 目前只抽取少量事实枚举并记录 commit/许可证链接，比复制整套素材库风险更低；如复制其代码或形成衍生数据库，应单独评估 AGPL 义务。

## 4. Biligame 星铁 Wiki Semantic MediaWiki API

### 已验证的访问方式与字段

[角色图鉴](https://wiki.biligame.com/sr/%E8%A7%92%E8%89%B2%E5%9B%BE%E9%89%B4)运行在 MediaWiki 1.37，并开放只读 [`api.php`](https://wiki.biligame.com/sr/api.php?action=query&meta=siteinfo&siprop=general%7Crightsinfo&format=json)。可用 Semantic MediaWiki 的 `action=ask` 批量查询，也可用 `action=browsebysubject`检查单页全部属性，例如：

- [星期日结构化属性](https://wiki.biligame.com/sr/api.php?action=browsebysubject&subject=%E6%98%9F%E6%9C%9F%E6%97%A5&format=json)
- [知更鸟结构化属性](https://wiki.biligame.com/sr/api.php?action=browsebysubject&subject=%E7%9F%A5%E6%9B%B4%E9%B8%9F&format=json)
- [批量角色字段示例](https://wiki.biligame.com/sr/api.php?action=ask&query=%5B%5B%E5%88%86%E7%B1%BB%3A%E8%A7%92%E8%89%B2%5D%5D%7C%3F%E5%85%83%E7%B4%A0%E5%B1%9E%E6%80%A7%7C%3F%E5%91%BD%E9%80%94%7C%3F%E7%A8%80%E6%9C%89%E5%BA%A6%7C%3F%E5%AE%9E%E8%A3%85%E7%89%88%E6%9C%AC%7C%3F%E9%98%B5%E8%90%A5%7C%3F%E5%88%9D%E5%A7%8B%E9%98%B5%E8%90%A5%7C%3F%E6%B4%BE%E7%B3%BB%7Climit%3D50&format=json)

已验证 Sunday 与 Robin 的语义差异：

| 角色   | `阵营`   | `初始阵营` | `派系`           |
| ------ | -------- | ---------- | ---------------- |
| 星期日 | 银河     | 匹诺康尼   | 家族、天外合唱班 |
| 知更鸟 | 匹诺康尼 | 空         | 家族             |

因此 BWiki 的 `阵营` 是当前宽泛展示阵营，`初始阵营`是历史/出身分组，`派系`才是可多值的组织归属。把星期日的 `阵营=银河`直接写成网站唯一势力会重现当前问题；正确做法是把三个字段分开保存，再由版本控制的游戏规则选择本轮用于判题的 `quizFactionId`。

### 更新、版本化和风险

- 优点：中文字段丰富，包含 `实装版本`和组织级多派系，Semantic 查询无需解析页面 HTML；MediaWiki revision ID/timestamp 可用于审计变化。
- 风险：社区维护、字段可能缺失或改名；中文名称对齐可能遇到形态后缀；没有稳定 SLA。Biligame 的边缘安全策略会限制高频页面请求，因此应走 API、分页、限速并缓存，不要抓 HTML。
- 建议：每天或随网站发布时抓取一次，输出差异报告；只让无争议的基本字段自动通过。派系、初始阵营和多重身份进入人工审核 override，并记录页面 revision ID。

### 许可与署名

其 `siteinfo&siprop=rightsinfo` 当前返回空的 `url/text`，即 API 没有机器可读地声明内容许可证。不能默认套用 MediaWiki 常见的 CC 许可。建议只引用少量事实字段、在数据来源页署名并链接对应页面；不要复制 BWiki 图片或长篇文本，除非另行确认授权。

## 5. 已验证但不建议进入主链路的候选

### Fandom Honkai: Star Rail Wiki

[MediaWiki API](https://honkai-star-rail.fandom.com/api.php?action=query&meta=siteinfo&siprop=general%7Crightsinfo&format=json)可读，`rightsinfo` 明确为 [CC-BY-SA](https://www.fandom.com/licensing)，页面 revision 可固定时间点，英文角色页通常含名称、稀有度、属性、命途、版本和图片。问题是该站没有开放 Cargo 查询，结构化字段多埋在 infobox wikitext 中；页面 HTML还可能返回 403。Sunday infobox 的单值 faction 也是 `Cosmos`，没有解决 Family 细分。它可作人工英文交叉验证，但引入自动主链路的解析成本和 CC-BY-SA 署名/相同方式共享义务不划算。

### Dimbreath/StarRailData

不采用。GitHub 仓库已经因 [DMCA 通知](https://github.com/github/dmca/blob/master/2024/10/2024-10-10-hoyoverse.md)禁用，当前返回 HTTP 451；即便能从镜像取得，也没有比 StarRailRes 更低的法律或稳定性风险。

## 建议的数据模型与同步决策

官网展示页签不能直接当成角色的唯一阵营。发布数据严格采用 BWiki 角色图鉴的 `阵营` 字段；`初始阵营`与`派系`只参与同步期审核，不进入角色记录：

```text
factionId                     # BWiki 图鉴的唯一阵营
factionGroupId                # 只用于“接近”判定的父级，不作为第二阵营显示
```

推荐同步顺序：

1. 抓取并校验 HoYoverse 242/241/250 三语频道，确定正式名单、显示名、图片和版本。
2. 抓取 HoYoWiki 三语分页列表，以游戏/网页映射 ID 对齐，复核属性、命途、稀有度并生成阵营差异报告；语言数量不一致只报警，不自动删角色。
3. 固定 StarRailRes commit，补游戏 ID、开拓者形态和结构化枚举；任何社区独有新角色不得越过官方名单闸门。
4. 限速抓取 BWiki Semantic API，把 `实装版本`和阵营相关字段生成差异报告；只把`阵营`写入审核 override，不能用`初始阵营`或`派系`替换。
5. 生成物记录每个来源的 URL、响应哈希、Git SHA或 MediaWiki revision、抓取时间和字段级 provenance；任一主源异常时保留上次有效快照，不部分发布。

对当前具体问题，Sunday 的公开角色记录采用图鉴的银河阵营，即 `factionId=cosmic` 与 `factionGroupId=cosmic`；Robin 采用匹诺康尼。其他来源值只参与同步期审核，不进入角色 JSON、API 响应或界面。
