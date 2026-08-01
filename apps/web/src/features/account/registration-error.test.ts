import { describe, expect, it } from "vitest";
import { ApiClientError } from "../../api/client";
import { registrationErrorDetails } from "./registration-error";

describe("注册错误提示", () => {
  it("保留接口错误码与请求编号", () => {
    expect(registrationErrorDetails(new ApiClientError("AUTH_NAME_TAKEN", "request-1"))).toEqual({
      code: "AUTH_NAME_TAKEN",
      requestId: "request-1",
    });
  });

  it("未知异常归类为服务异常，而不是名称冲突", () => {
    expect(registrationErrorDetails(new Error("network"))).toEqual({
      code: "INTERNAL_ERROR",
    });
  });
});
