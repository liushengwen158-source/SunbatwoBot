// @ts-check

import getRandomInt from "../utils/random.js";

/**
 * 紫薯娘图片 URL 列表
 */

const IMAGE_URLS = [
    "https://img.remit.ee/i/v26zX3O539b5",
    "https://img.remit.ee/i/FYhtdJEEetL5",
    "https://img.remit.ee/i/xoEnSy9RIgMK",
    "https://img.remit.ee/i/J8FDUA9YI0Mh",
    "https://img.remit.ee/i/aCjE1PZ5TyT6",
    "https://img.remit.ee/i/2n5XjAXgGFK8",
    "https://img.remit.ee/i/aL1L84OWl5RD",
    "https://img.remit.ee/i/mMSq4yk9dZKK",
    "https://img.remit.ee/i/Zt73EeUmWIzT",
    "https://img.remit.ee/i/DOWqExFFfj4x",
];

/**
 * 随机获取一张紫薯娘图片 URL
 * @returns {string}
 */
export default function getRandomZishuGirl() {
    const idx = getRandomInt(0, IMAGE_URLS.length - 1);
    return IMAGE_URLS[idx];
}