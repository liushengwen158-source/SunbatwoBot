// @ts-check

import chatAPI from "../../llm/chat.js";
import { getRecorder } from "../../llm/recorder.js";
import logger from "../../utils/logger.js";
import { PROACTIVE_CHAT_LIMIT } from "../../consts.js";
import {sendAiReply} from "./ai-chat.js";
/**
 * 主动聊天处理器
 * 当群内连续若干条消息无 AI 参与时，主动触发一次对话
 */

/** 各群的主动聊天状态（无 AI 参与计数 + 开关），按群隔离 */
const states = new Map();

/**
 * 获取指定群的主动聊天状态（不存在则创建）
 * @param {string|number} groupId 群号
 * @returns {{count: number, enable: boolean}}
 */
export function getProactiveState(groupId) {
    const key = groupId?.toString() ?? "default";
    let state = states.get(key);
    if (!state) {
        state = { count: 0, enable: true };
        states.set(key, state);
    }
    return state;
}

/**
 * @param {object} ctx
 * @returns {Promise<boolean>}
 */
export default async function proactiveChat(ctx) {
    const state = getProactiveState(ctx.event.group_id);
    if(!state.enable) return false;
    const text = ctx.text + (ctx.imageDescription ? `\n${ctx.imageDescription}` : "");
    const pre = `${ctx.senderName}:\n`;
    getRecorder(ctx.event.group_id).add({ role: "user", content: pre + text });
    // 检查是否达到主动触发阈值
    if (state.count >= PROACTIVE_CHAT_LIMIT) {
        logger.info("达到主动聊天阈值，触发 AI 对话");
        state.count = 0;
        const res = await chatAPI(ctx.event.group_id);
        if (typeof res !== "string") {
            await sendAiReply(ctx.adapter, ctx.event.group_id, res);
        }
        return true;
    }

    // 未达到阈值
    state.count++;
    return false;
}