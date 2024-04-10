import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
import { BaseChatModelParams, SimpleChatModel } from "@langchain/core/language_models/chat_models"
import { BaseMessage, BaseMessageChunk } from '@langchain/core/messages'
import { ChatGenerationChunk } from '@langchain/core/outputs'
import { ChatResult } from '@langchain/core/outputs'
import { ChatOllamaInput } from "@langchain/community/chat_models/ollama"

// 因為 BaseMessageChunk 必須要實現 concat 方法，所以這邊繼承 BaseMessageChunk 並實作 concat 方法
class ChatUMCMessageChunk extends BaseMessageChunk {
    constructor(fields: BaseMessageChunk) {
        super(fields)
    }

    concat(chunk: BaseMessageChunk): BaseMessageChunk {
        return new ChatUMCMessageChunk({
            content: this.content + chunk.content,
            additional_kwargs: chunk.additional_kwargs,
            response_metadata: chunk.response_metadata,
        })
    }
}

export class ChatUMC extends SimpleChatModel {
    baseUrl: string
    model: string

    constructor(fields: ChatOllamaInput & BaseChatModelParams) {
        super(fields)
        this.baseUrl = fields.baseUrl ?? 'http://172.16.128.9:3003'
        this.model = fields.model ?? 'gpt-4-turbo'
    }

    _llmType(): string {
        return "umc"
    }

    _call(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun | undefined): Promise<string> {
        throw new Error('Method not implemented.')
    }

    _generate(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun | undefined): Promise<ChatResult> {
        throw new Error('Method not implemented.')
    }

    // 外部呼叫 stream 時會執行這個方法
    async *_streamResponseChunks(
        _messages: BaseMessage[],
        _options: this["ParsedCallOptions"],
        _runManager?: CallbackManagerForLLMRun
    ): AsyncGenerator<ChatGenerationChunk> {
        try {
            const response = await fetch(this.baseUrl + '/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: _messages.map((msg) => {
                        return {
                            role: "user",
                            content: msg.content
                        }
                    }),
                    stream: true
                }),
            })

            const reader = response.body.getReader()
            let partialData = '', data: any, chunk: ChatGenerationChunk

            while (true) {
                const { done, value } = await reader.read()

                if (done) {
                    break
                }

                // 將接收到的部分資料轉換成字串，並且去掉前面的 data: 字串和後面的空白
                partialData = new TextDecoder().decode(value)
                partialData = partialData.replace("data: ", "").replace("\n\n", "")

                try {
                    data = JSON.parse(partialData)

                    // 將資料轉換成 ChatGenerationChunk 物件，不然 server/api/models/chat/index.post.ts:115 會接不到
                    chunk = new ChatGenerationChunk({
                        message: new ChatUMCMessageChunk({
                            content: data?.choices?.[0]?.delta?.content ?? "",
                            additional_kwargs: {},
                            response_metadata: {},
                        })
                    })
                    yield chunk
                } catch (err) { }
            }
        } catch (error) {
            return new ChatGenerationChunk({
                message: new ChatUMCMessageChunk({
                    content: "",
                    additional_kwargs: {},
                    response_metadata: {},
                })
            })
        }
    }
}