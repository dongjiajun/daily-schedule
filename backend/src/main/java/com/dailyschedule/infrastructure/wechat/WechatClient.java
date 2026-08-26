package com.dailyschedule.infrastructure.wechat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * 微信 jscode2session 客户端。
 *
 * <p>日志脱敏：不打印 code / app-secret / session_key。
 * appid/secret 从配置注入（环境变量优先），仓库不落明文。</p>
 */
@Component
public class WechatClient implements WechatAuthPort {

    private static final Logger log = LoggerFactory.getLogger(WechatClient.class);

    private static final String JSCODE2SESSION_URL =
        "https://api.weixin.qq.com/sns/jscode2session";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String appId;
    private final String appSecret;

    public WechatClient(RestClient.Builder restClientBuilder,
                        ObjectMapper objectMapper,
                        @Value("${wechat.app-id:}") String appId,
                        @Value("${wechat.app-secret:}") String appSecret) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.appId = appId;
        this.appSecret = appSecret;
    }

    @Override
    public String resolveOpenId(String code) {
        Map<String, Object> body;
        try {
            // 绝对 URI（含 host）：相对 URI 在真实 HTTP 请求工厂下不可用
            var uri = UriComponentsBuilder.fromHttpUrl(JSCODE2SESSION_URL)
                .queryParam("appid", appId)
                .queryParam("secret", appSecret)
                .queryParam("js_code", code)
                .queryParam("grant_type", "authorization_code")
                .build()
                .toUri();
            // 微信返回 Content-Type: text/plain（非 application/json），
            // 先用 String 接收（String 转换器接受任意 content-type）再手动解析 JSON
            String raw = restClient.get()
                .uri(uri)
                .retrieve()
                .body(String.class);
            if (raw == null || raw.isBlank()) {
                throw new WechatApiException(WechatApiException.ERR_NETWORK, "微信服务暂不可用");
            }
            body = objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
        } catch (RestClientException e) {
            log.warn("微信 jscode2session 调用失败（网络/HTTP 错误）: {}", e.getMessage());
            throw new WechatApiException(WechatApiException.ERR_NETWORK, "微信服务暂不可用");
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("微信 jscode2session 响应解析失败: {}", e.getMessage());
            throw new WechatApiException(WechatApiException.ERR_NETWORK, "微信服务暂不可用");
        }
        if (body == null) {
            throw new WechatApiException(WechatApiException.ERR_NETWORK, "微信服务暂不可用");
        }

        Object errcodeObj = body.get("errcode");
        int errcode = errcodeObj instanceof Number n ? n.intValue() : 0;
        if (errcode != 0) {
            // errmsg 可能含排查信息，但仅记录错误码，不泄露内部详情
            log.warn("微信 jscode2session 返回错误: errcode={}", errcode);
            if (errcode == WechatApiException.ERR_INVALID_CODE) {
                throw new WechatApiException(errcode, "登录凭证无效或已过期");
            }
            throw new WechatApiException(errcode, "微信登录服务错误");
        }

        Object openid = body.get("openid");
        if (!(openid instanceof String s) || s.isBlank()) {
            log.warn("微信 jscode2session 响应缺少 openid");
            throw new WechatApiException(WechatApiException.ERR_NETWORK, "微信登录服务错误");
        }
        return s;
    }
}
