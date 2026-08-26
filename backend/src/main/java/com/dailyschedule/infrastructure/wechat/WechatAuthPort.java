package com.dailyschedule.infrastructure.wechat;

/**
 * 微信认证端口（依赖倒置）——应用层只依赖此接口，
 * 单测可用 mock 覆盖登录分流逻辑，无需真实微信调用。
 */
public interface WechatAuthPort {

    /**
     * 用 wx.login 的临时 code 换取 openid。
     *
     * @throws WechatApiException code 无效（errcode 40029）或微信上游错误
     */
    String resolveOpenId(String code);
}
