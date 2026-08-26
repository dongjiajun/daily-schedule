package com.dailyschedule.application.auth;

/** 微信小程序登录命令（wx.login 临时凭证）。 */
public record WechatLoginCommand(String code) {
}
