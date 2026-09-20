// @ts-check

import getRandomInt from "../utils/random.js";
import logger from "../utils/logger.js";

const API_URL = "https://api.yppp.net/pc.php?return=json";

/** 本地图片 URL 列表（与外部 API 随机混合发送） */
const LOCAL_IMAGE_URLS = [
    "https://picui.ogmua.cn/s1/2026/09/20/6aafed961fc76.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafed9647898.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafed963427a.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafed969e849.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafed96b0952.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafedc29cff4.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafedc2c0df6.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafedc2e6c63.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafedc2c6024.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafedc42e9e4.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafedec80b11.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafedf35b3e0.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aafedf35b396.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aaff0ad4fcf4.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aaff0b8266b0.webp",
    "https://picui.ogmua.cn/s1/2026/09/20/6aaff0bbae7d0.webp",
];

/**
 * 获取随机 ACG 图片
 * @returns {Promise<Array<{type: "image", data: {file: string}}>|null>}
 */
export default async function getAcgImage() {
    if (Math.random() < 0.5) {
        const idx = getRandomInt(0, LOCAL_IMAGE_URLS.length - 1);
        return [{ type: "image", data: { file: LOCAL_IMAGE_URLS[idx] } }];
    }
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (!data.acgurl) {
            logger.warn("ACG API 返回格式异常:", data);
            return null;
        }
        return [{ type: "image", data: { file: data.acgurl } }];
    } catch (err) {
        logger.error("获取 ACG 图片失败:", err);
        return null;
    }
}