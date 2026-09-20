// @ts-check

import getSentence from "../../services/hitokoto.js";
import getAcg from "../../services/acg.js";
import getSunGirl from "../../data/sunbatwo-girls.js";
import recorder from "../../llm/recorder.js";
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

/** 紫薯娘图片限流状态（全群共享） */
let girlCount = 0;
let girlLastTime = Date.now();

CMD_MAP.set("来只紫薯娘", async (ctx) => {
    const nowTime = Date.now();
    if (nowTime - girlLastTime > GIRL_IMAGE_LIMIT_TIME) {
        girlLastTime = nowTime;
        girlCount = 0;
    }
    if (girlCount >= GIRL_IMAGE_LIMIT_COUNT) {
        ctx.adapter.sendGroupMsg(
            ctx.event.group_id,
            "本小时的紫薯娘已经发完啦，过会儿再来",
        );
        return;
    }
    girlCount++;
    ctx.adapter.sendGroupMsg(ctx.event.group_id, [
        { type: "image", data: { file: getSunGirl() } },
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