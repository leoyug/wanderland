# 4. AI Provider 使用按需域名权限

Date: 2026-09-09

## Status

Accepted

## Context

V0.6 允许用户配置 OpenAI-compatible Endpoint。Manifest V3 扩展从 Service Worker 请求跨域 Provider 时需要对应 Host Permission，但当前页采集仍必须遵守 `activeTab + scripting` 的最小权限边界。

## Decision

Manifest 仅声明 HTTPS 为可选 Host Permission，不在安装时授予。用户启用 AI 并保存设置时，扩展根据 Endpoint 解析出单一 Provider 域名，通过 `permissions.request` 明确请求该域名权限。AI 请求由 Service Worker 发送、禁止跟随重定向，页面采集不复用此权限，也不增加常驻 Content Script。

## Consequences

- 未启用 AI 的用户不会授予任何 Provider 访问权限。
- 更换 Endpoint 时需要对新域名单独授权。
- 切换 Provider 或禁用 AI 时撤销不再需要的旧域名权限。
- 用户拒绝授权时，AI 保持不可用，但本地收藏、编辑、搜索和快照不受影响。
- 可选权限声明范围较广，但实际运行时只请求用户当前填写的单一域名。
