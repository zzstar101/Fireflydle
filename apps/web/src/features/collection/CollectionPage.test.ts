import { describe, expect, it } from "vitest";
import { pathRewardImagePositions, pathRewardImages } from "./CollectionPage";

describe("图鉴命途奖励", () => {
  it("每个命途使用对应星神的官方图片", () => {
    expect(pathRewardImages).toEqual({
      destruction: "/assets/aeons/11.webp",
      hunt: "/assets/aeons/08.webp",
      erudition: "/assets/aeons/12.webp",
      harmony: "/assets/aeons/17.webp",
      nihility: "/assets/aeons/07.webp",
      preservation: "/assets/aeons/14.webp",
      abundance: "/assets/aeons/18.webp",
      remembrance: "/assets/aeons/04.webp",
      elation: "/assets/aeons/01.webp",
    });
  });

  it("铺满奖励卡片时保留每位星神的主体焦点", () => {
    expect(pathRewardImagePositions).toEqual({
      destruction: "50% 42%",
      hunt: "52% 43%",
      erudition: "50% 48%",
      harmony: "50% 42%",
      nihility: "50% 50%",
      preservation: "50% 47%",
      abundance: "50% 44%",
      remembrance: "50% 48%",
      elation: "50% 48%",
    });
  });
});
