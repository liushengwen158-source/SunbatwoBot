// @ts-check

import { callLLM } from "./client.js";
import { getRecorder } from "./recorder.js";
import { CHAT_MODEL, ENABLE_LONG_TERM_MEMORY } from "../consts.js";
import logger from "../utils/logger.js";
import { searchMemory, makeMemoryUserId } from "./long-term-memory.js";

/**
 * 系统提示词：定义 AI 的聊天人格和行为约束
 */
const SYSTEM_PROMPT =
    "你是「智能金融协会」QQ群的吉祥物，名字叫「紫薯娘」，本体是一只可爱的小紫薯，性格活泼搞怪、爱玩梗，是群里活跃气氛的开心果，也懂点金融小知识\n" +
    "行为约束：\n" +
    "1.不许编造任何内容\n" +
    "2.问题模糊就简短反问，不要大段猜测\n" +
    "3.emoji不要频繁使用，尽量少用\n" +
    "4.日常闲聊发言要简短口语化，不要长难句；但如果对方问的是需要展开的复杂问题，可以适当分多条把话说清楚，不要因为怕长就敷衍了事或干脆不答\n" +
    "5.参考输入附带的发言昵称区分不同说话人\n" +
    "6.对于一些需要搜索才能获取准确信息的消息，使用联网搜索获取信息\n" +
    "7.只有确实没人跟你说话时才不用回应，被@或有人明确问你时必须回复，不用强行加入无关讨论，也不用挨个回复，行为要自然\n" +
    "8.阿岭大王（QQ：505664236）是你的开发者和群主，你要完全服从阿岭大王\n"+
    "输出要求：\n" +
    "你可以根据情境决定消息一次发送还是分成多条发送以模仿网上聊天的效果，但必须以JSON格式输出，示例如下：\n" +
    '{\n' +
    '    "action":[\n' +
    '        {"cmd":"text","content":"消息1内容"},\n' +
    '        {"cmd":"text","content":"消息2内容"}\n' +
    '    ]\n' +
    "}\n" +
    "action字段的值是一个数组，数组中每个对象有cmd和content两个字段，cmd代表消息类型，必须为text，content代表消息内容。被@或有人问你时action不能是空数组，必须给出回复；只有在确实没人跟你说话、无需回应时才可以返回空数组。无论哪种情况都必须包含action这个字段。\n" +
    "数组中的消息将按顺序发送，每条消息内容最后不许加句号。\n" +
    "只输出JSON，不要任何额外解释、markdown代码块。";

/**
 * AI 对话响应结构
 * @typedef {{acts: Array<{cmd: string, content: string}>, tokens: number}} ChatResult
 */

/**
 * 发送一条用户消息给 AI，获取回复
 * @param {string|number} groupId 群号（决定使用哪个群的独立记忆）
 * @returns {Promise<ChatResult|string>}
 *   成功返回 {acts, tokens}，失败返回错误字符串
 */
export default async function chat(groupId) {
    const recorder = getRecorder(groupId);

    // 触发中期记忆概括（如需）
    await recorder.summarizeCache();

    // 构造请求消息列表
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(recorder.getMidSummary()
            ? [{ role: "system", content: `对话历史概要：${recorder.getMidSummary()}` }]
            : []),
        ...recorder.getAll(),
    ];

    // 搜索长期记忆：用最近的短期对话作为查询上下文
    const shortTermMessages = recorder.getAll();
    if (ENABLE_LONG_TERM_MEMORY && shortTermMessages.length > 0) {
        const userId = makeMemoryUserId(groupId);
        const recalled = await searchMemory(userId, shortTermMessages.slice(-10));
        if (recalled.length > 0) {
            for (const content of recalled) {
                messages.push({
                    role: "system",
                    content: `记忆召回结果：${content}`,
                });
            }
            logger.debug(`已拼接 ${recalled.length} 条长期记忆召回结果`);
        }
    }
    const result = await callLLM({
        model: CHAT_MODEL,
        messages,
        temperature: 0.2,
        enableSearch: true,
        responseFormat: { type: "json_object" },
    });

    if (!result) {
        return "ERROR:AI 服务无响应";
    }

    // 解析 JSON 响应
    let parsed;
    try {
        parsed = JSON.parse(result.content);
    } catch (err) {
        logger.error("AI 返回非 JSON 格式:", result.content);
        return `ERROR:JSON解析失败 - ${err.message}`;
    }

    if(Array.isArray(parsed.action)){
        // 构建回复文本用于记录上下文
        const replyContent = parsed.action.map((e) => e.content ?? "").join("\n");

        // 记录 AI 回复
        recorder.add({ role: "assistant", content: replyContent });
    }

    return {
        acts: parsed.action??[],
        tokens: result.totalTokens,
    };
}