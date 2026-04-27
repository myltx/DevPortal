import crypto from "crypto";

export interface DingTalkMarkdownMessage {
  msgtype: "markdown";
  markdown: {
    title: string;
    text: string;
  };
  at?: {
    atMobiles?: string[];
    atUserIds?: string[];
    isAtAll?: boolean;
  };
}

/**
 * 发送钉钉机器人通知
 * @param webhookUrl 钉钉机器人 Webhook 地址
 * @param secret 钉钉机器人加签密钥 (可选)
 * @param message 消息内容
 */
export async function sendDingTalkMessage(
  webhookUrl: string | undefined,
  secret: string | undefined,
  message: DingTalkMarkdownMessage
) {
  if (!webhookUrl) {
    console.warn("[DingTalk] Webhook URL is missing, skipping notification.");
    return;
  }

  let finalUrl = webhookUrl;

  // 如果配置了 secret，则进行加签
  if (secret) {
    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${secret}`;
    const sign = crypto
      .createHmac("sha256", secret)
      .update(stringToSign)
      .digest("base64");
    
    const params = new URLSearchParams({
      timestamp: timestamp.toString(),
      sign: sign,
    });
    finalUrl = `${webhookUrl}&${params.toString()}`;
  }

  try {
    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const responseText = await response.text();
    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[DingTalk] Failed to parse response as JSON. Status: ${response.status}. Body: ${responseText}`);
      throw new Error(`DingTalk returned non-JSON response: ${responseText.substring(0, 100)}`);
    }

    if (result.errcode !== 0) {
      console.error("[DingTalk] Failed to send message:", result.errmsg);
    } else {
      console.log("[DingTalk] Message sent successfully.");
    }
    return result;
  } catch (error: any) {
    console.error("[DingTalk] Error sending message:", error.message);
    throw error;
  }
}
