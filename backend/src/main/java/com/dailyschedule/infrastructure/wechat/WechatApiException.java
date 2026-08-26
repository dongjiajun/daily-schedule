package com.dailyschedule.infrastructure.wechat;

/**
 * 微信 API 调用异常，携带微信 errcode。
 * <ul>
 *   <li>{@code 40029} — code 无效/已使用（客户端语义 → HTTP 400）</li>
 *   <li>{@code -1} — 网络异常（无微信 errcode）</li>
 *   <li>其余 errcode — 微信上游服务错误（→ HTTP 502）</li>
 * </ul>
 */
public class WechatApiException extends RuntimeException {

    /** 微信「code 无效」errcode。 */
    public static final int ERR_INVALID_CODE = 40029;

    /** 网络异常等无 errcode 场景的占位值。 */
    public static final int ERR_NETWORK = -1;

    private final int errcode;

    public WechatApiException(int errcode, String message) {
        super(message);
        this.errcode = errcode;
    }

    public int getErrcode() {
        return errcode;
    }

    public boolean isInvalidCode() {
        return errcode == ERR_INVALID_CODE;
    }
}
