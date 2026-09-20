// @ts-check

import getSentence from "../../services/hitokoto.js";
import getAcg from "../../services/acg.js";
import getZishuGirl from "../../data/sunbatwo-girls.js";
import { getRecorder } from "../../llm/recorder.js";
import {
    GIRL_IMAGE_LIMIT_COUNT,
    GIRL_IMAGE_LIMIT_TIME,
} from "../../consts.js";

/**
 * 关键词命令处理器
 * 精确匹配文本触发对应功能
 */

const CMD_MAP = new Map();

CMD_MAP.set("来句台词", async (ctx) => {
    const sentence = await getSentence();
    const recorder = getRecorder(ctx.event.group_id);
    if (sentence) {
        ctx.adapter.sendGroupMsg(ctx.event.group_id, sentence);
        recorder.add({ role: "assistant", content: sentence });
    } else {
        ctx.adapter.sendGroupMsg(ctx.event.group_id, "别急");
        recorder.add({ role: "assistant", content: "别急" });
    }
});

CMD_MAP.set("来张图", async (ctx) => {
    const img = await getAcg();
    if (img) {
        ctx.adapter.sendGroupMsg(ctx.event.group_id, img);
    }
});

/** 紫薯娘图片限流状态（按群独立，群内共享） */
const girlLimits = new Map();

/**
 * 获取指定群的紫薯娘限流状态（不存在则创建）
 * @param {string|number} groupId 群号
 * @returns {{count: number, lastTime: number}}
 */
function getGirlLimit(groupId) {
    const key = groupId?.toString() ?? "default";
    let limit = girlLimits.get(key);
    if (!limit) {
        limit = { count: 0, lastTime: Date.now() };
        girlLimits.set(key, limit);
    }
    return limit;
}

CMD_MAP.set("来只紫薯娘", async (ctx) => {
    const limit = getGirlLimit(ctx.event.group_id);
    const nowTime = Date.now();
    if (nowTime - limit.lastTime > GIRL_IMAGE_LIMIT_TIME) {
        limit.lastTime = nowTime;
        limit.count = 0;
    }
    if (limit.count >= GIRL_IMAGE_LIMIT_COUNT) {
        ctx.adapter.sendGroupMsg(
            ctx.event.group_id,
            "本小时的紫薯娘已经发完啦，过会儿再来",
        );
        return;
    }
    limit.count++;
    ctx.adapter.sendGroupMsg(ctx.event.group_id, [
        { type: "image", data: { file: getZishuGirl() } },
    ]);
});

/**
 * @param {object} ctx 管道上下文
 * @returns {Promise<boolean>} 是否已处理
 */
export default async function keywordCommands(ctx) {
    const handler = CMD_MAP.get(ctx.text);
    if (!handler) return false;

    await handler(ctx);
    return true;
}