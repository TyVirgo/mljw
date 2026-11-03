## Decisions

1. 退课/加课搜索：全部条件进同一 `.search-fields`；去掉 `search-row-secondary`；加课不再强制 `nowrap`，控件约 120–132px。
2. 名额 sticky 列：`min/max-width` 提到约 14em；`white-space: normal`；曾修列 `right` 联动。
3. 附件：`form.attachments: { name, size }[]`，最多 5；兼容旧 `attachmentName`；按钮浅蓝底；详情遍历全部。
