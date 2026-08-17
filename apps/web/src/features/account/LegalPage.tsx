import { usePreferences } from "../../state/preferences";

const copy = {
  "zh-CN": {
    title: "规则、隐私与权利说明",
    unofficialTitle: "非官方、非商业",
    unofficial:
      "萤一把（Fireflydle）是独立制作的免费粉丝项目，与 HoYoverse 无隶属、授权或合作关系。本项目不展示广告、不接受赞助或捐赠，也不提供付费功能。崩坏：星穹铁道的名称、角色、图像及相关素材权利归其权利人所有。",
    dataTitle: "数据与账号",
    data: "本地访客标识、游戏结果和隐藏匹配分用于提供游戏。注册或登录时，访客记录会安全合并到账号。登录名保持私密；个性化每日题不公开排名，Elo 榜只显示已注册用户的展示名与评分。邮箱可选，只用于找回密码。",
    retentionTitle: "保留与删除",
    retention:
      "详细回放默认私密并保留 30 天，之后仅保留匿名汇总。账号删除申请有 7 天撤销期；期满后清除个人信息和私人回放，历史比赛仅保留匿名结果。",
    takedownTitle: "素材下架",
    takedown:
      "如你是权利人并希望移除素材，请联系 takedown@fireflydle.games，并提供相关权利和素材信息。",
  },
  en: {
    title: "Rules, privacy, and rights",
    unofficialTitle: "Unofficial and non-commercial",
    unofficial:
      "Fireflydle is an independent, free fan project and is not affiliated with, endorsed by, or partnered with HoYoverse. It has no ads, payments, sponsorships, or donations. Honkai: Star Rail names, characters, images, and related materials belong to their respective rights holders.",
    dataTitle: "Data and accounts",
    data: "Local guest identifiers, game results, and hidden matchmaking ratings provide the game service. Guest progress merges safely when you register or sign in. Login names remain private; personalized daily puzzles have no public ranking, while the Elo board shows registered display names and ratings. Email is optional and used only for account recovery.",
    retentionTitle: "Retention and deletion",
    retention:
      "Detailed replays are private by default and retained for 30 days, after which only anonymized summaries remain. Account deletion has a 7-day grace period; personal data and private replays are then purged and historical results anonymized.",
    takedownTitle: "Asset takedown",
    takedown:
      "Rights holders may request asset removal at takedown@fireflydle.games with the relevant rights and asset details.",
  },
  ja: {
    title: "ルール・プライバシー・権利について",
    unofficialTitle: "非公式・非営利",
    unofficial:
      "Fireflydle（萤一把）は独立制作の無料ファンプロジェクトであり、HoYoverse との提携・公認・協力関係はありません。広告、課金、スポンサー、寄付は一切ありません。『崩壊：スターレイル』の名称、キャラクター、画像および関連素材の権利は各権利者に帰属します。",
    dataTitle: "データとアカウント",
    data: "ローカルゲスト識別子、ゲーム結果、非公開のマッチングレートをサービス提供に使用します。登録またはログイン時にゲスト記録を安全に統合します。ログイン名は非公開です。個別デイリー問題に公開ランキングはなく、Eloランキングには登録ユーザーの表示名とレートのみ表示されます。メールは任意で、アカウント復旧のみに使用します。",
    retentionTitle: "保存と削除",
    retention:
      "詳細リプレイは既定で非公開、保存期間は30日です。その後は匿名の集計のみ残ります。アカウント削除には7日間の取消期間があり、期限後に個人情報と非公開リプレイを削除し、過去の対戦結果を匿名化します。",
    takedownTitle: "素材の削除依頼",
    takedown:
      "権利者として素材の削除を希望する場合は、権利と対象素材の情報を添えて takedown@fireflydle.games までご連絡ください。",
  },
} as const;

export default function LegalPage() {
  const locale = usePreferences((state) => state.language);
  const text = copy[locale];
  return (
    <main className="page-shell legal-page">
      <p className="eyebrow">PROJECT NOTICE · PRIVACY</p>
      <h1>{text.title}</h1>
      <section>
        <h2>{text.unofficialTitle}</h2>
        <p>{text.unofficial}</p>
      </section>
      <section>
        <h2>{text.dataTitle}</h2>
        <p>{text.data}</p>
      </section>
      <section>
        <h2>{text.retentionTitle}</h2>
        <p>{text.retention}</p>
      </section>
      <section>
        <h2>{text.takedownTitle}</h2>
        <p>{text.takedown}</p>
      </section>
    </main>
  );
}
