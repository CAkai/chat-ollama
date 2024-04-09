import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
import { BaseLanguageModelInput, } from '@langchain/core/language_models/base'
import { BaseChatModelCallOptions, BaseChatModelParams, SimpleChatModel } from "@langchain/core/language_models/chat_models"
import { BaseMessage, BaseMessageChunk, BaseMessageLike, MessageContent, MessageType } from '@langchain/core/messages'
import { ChatResult } from '@langchain/core/outputs'
import { ChatOllamaInput } from "@langchain/community/chat_models/ollama"
import { StringWithAutocomplete } from '@langchain/core/utils/types'


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
        console.log(1)
        throw new Error('Method not implemented.')
    }

    _generate(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun | undefined): Promise<ChatResult> {
        console.log(2)
        throw new Error('Method not implemented.')
    }

    // 外部呼叫 stream 時會執行這個方法
    _streamIterator(input: BaseLanguageModelInput, options?: BaseChatModelCallOptions): AsyncGenerator<BaseMessageChunk> {
        return async function* (host: string, msg: BaseMessageLike[]): AsyncGenerator<BaseMessageChunk, any, unknown> {

            while (true) {
                yield fetch(host + '/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: msg.map((message) => {
                            const m = message as [
                                StringWithAutocomplete<MessageType | "user" | "assistant" | "placeholder">,
                                MessageContent
                            ]
                            return {
                                role: m[0],
                                content: m[1]
                            }
                        }),
                        stream: true
                    }),
                })
                    .then(async (res) => {
                        console.log(res)
                        return {
                            concat: (chunk: BaseMessageChunk) => {
                                return chunk
                            }
                        } as BaseMessageChunk
                    })
                    .catch((err) => {
                        console.error(err)
                        return {
                            concat: (chunk: BaseMessageChunk) => {
                                return chunk
                            }
                        } as BaseMessageChunk
                    })
            }
        }(this.baseUrl, input as BaseMessageLike[])
    }
}