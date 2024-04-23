# 更新日誌

## Unreleased - 2024-04-23
### Changed:
- 與 2024/04/24 的 main 分支合併，然後重新實作 UMC OpenAI。

## 0.2.0 - 2024-04-09
### Added:
- 加入 UMC GPT 的連線 API。
- 新增 `server/utils/model-umc.ts`，處理與 UMC GPT 的對接。

## 0.1.0 - 2024-04-08 - first commit
- 複製自 [sugarforever/chat-ollama](https://github.com/sugarforever/chat-ollama)
- 加入 UMC OpenAI。
- 手動下載 `prisma/schema-engine.sha256`，解決生產環境無法下載 binary 的問題。