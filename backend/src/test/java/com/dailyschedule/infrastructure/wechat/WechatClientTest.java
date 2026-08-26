package com.dailyschedule.infrastructure.wechat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * WechatClient 单测：mock 微信 jscode2session 响应，覆盖成功/40029/其他 errcode/HTTP 异常。
 * 微信真实响应 Content-Type 为 text/plain（非 application/json），用例按真实行为构造。
 */
@RestClientTest(WechatClient.class)
class WechatClientTest {

    @Autowired
    private WechatClient wechatClient;

    @Autowired
    private MockRestServiceServer server;

    @Test
    void resolveOpenId_成功响应_返回openid() {
        server.expect(requestTo(containsString("js_code=test-code")))
            .andRespond(withSuccess(
                "{\"session_key\":\"sk\",\"openid\":\"oX1xK4testopenid\"}",
                MediaType.TEXT_PLAIN));

        String openid = wechatClient.resolveOpenId("test-code");

        assertThat(openid).isEqualTo("oX1xK4testopenid");
    }

    @Test
    void resolveOpenId_成功响应带errcode0_返回openid() {
        server.expect(requestTo(containsString("jscode2session")))
            .andRespond(withSuccess(
                "{\"openid\":\"oX1xK4zero\",\"errcode\":0,\"errmsg\":\"ok\"}",
                MediaType.TEXT_PLAIN));

        assertThat(wechatClient.resolveOpenId("any-code")).isEqualTo("oX1xK4zero");
    }

    @Test
    void resolveOpenId_errcode40029_抛invalidCode异常() {
        server.expect(requestTo(containsString("jscode2session")))
            .andRespond(withSuccess(
                "{\"errcode\":40029,\"errmsg\":\"invalid code\"}",
                MediaType.TEXT_PLAIN));

        assertThatThrownBy(() -> wechatClient.resolveOpenId("expired-code"))
            .isInstanceOf(WechatApiException.class)
            .satisfies(e -> {
                WechatApiException ex = (WechatApiException) e;
                assertThat(ex.isInvalidCode()).isTrue();
                assertThat(ex.getErrcode()).isEqualTo(40029);
            });
    }

    @Test
    void resolveOpenId_其他errcode_抛非invalidCode异常() {
        server.expect(requestTo(containsString("jscode2session")))
            .andRespond(withSuccess(
                "{\"errcode\":40125,\"errmsg\":\"invalid appsecret\"}",
                MediaType.TEXT_PLAIN));

        assertThatThrownBy(() -> wechatClient.resolveOpenId("any-code"))
            .isInstanceOf(WechatApiException.class)
            .satisfies(e -> {
                WechatApiException ex = (WechatApiException) e;
                assertThat(ex.isInvalidCode()).isFalse();
                assertThat(ex.getErrcode()).isEqualTo(40125);
            });
    }

    @Test
    void resolveOpenId_微信服务5xx_抛network异常() {
        server.expect(requestTo(containsString("jscode2session")))
            .andRespond(withServerError());

        assertThatThrownBy(() -> wechatClient.resolveOpenId("any-code"))
            .isInstanceOf(WechatApiException.class)
            .satisfies(e -> assertThat(((WechatApiException) e).getErrcode())
                .isEqualTo(WechatApiException.ERR_NETWORK));
    }

    @Test
    void resolveOpenId_成功但缺openid字段_抛network异常() {
        server.expect(requestTo(containsString("jscode2session")))
            .andRespond(withSuccess("{\"session_key\":\"sk\"}", MediaType.TEXT_PLAIN));

        assertThatThrownBy(() -> wechatClient.resolveOpenId("any-code"))
            .isInstanceOf(WechatApiException.class)
            .satisfies(e -> assertThat(((WechatApiException) e).getErrcode())
                .isEqualTo(WechatApiException.ERR_NETWORK));
    }

    @Test
    void resolveOpenId_非200状态码_抛network异常() {
        server.expect(requestTo(containsString("jscode2session")))
            .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        assertThatThrownBy(() -> wechatClient.resolveOpenId("any-code"))
            .isInstanceOf(WechatApiException.class)
            .satisfies(e -> assertThat(((WechatApiException) e).getErrcode())
                .isEqualTo(WechatApiException.ERR_NETWORK));
    }
}
