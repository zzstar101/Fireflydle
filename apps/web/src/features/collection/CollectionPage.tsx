import { useQuery } from "@tanstack/react-query";
import {
  characterSkins,
  characters,
  elementLabels,
  getFactionName,
  getRegionName,
  pathLabels,
} from "@fireflydle/game-data";
import { Award, Check, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import { localTestMode } from "../../dev/local-test-mode";
import introductions from "./introductions.zh-CN.json";
import "./collection.css";

type CollectionCharacter = {
  id: string;
  officialId?: string;
  names: { "zh-CN": string; en: string; ja: string };
  path: string;
  factionId: string;
  element: string;
  rarity: number;
  regionId?: string | undefined;
  releaseVersionId: string;
  assets: { portraitPath: string; avatarPath: string };
  unlocked: boolean;
};

type CollectionResponse = {
  characters: CollectionCharacter[];
  unlockedCount: number;
  total: number;
  pathProgress: Record<string, { unlocked: number; total: number }>;
  factionProgress: Record<string, { unlocked: number; total: number }>;
  skins: Array<{
    id: string;
    characterId: string;
    names: { "zh-CN": string; en: string; ja: string };
    imagePath: string;
  }>;
};

function localCollection(): CollectionResponse {
  const pathProgress: CollectionResponse["pathProgress"] = {};
  const factionProgress: CollectionResponse["factionProgress"] = {};
  for (const character of characters) {
    const path = pathProgress[character.path] ?? { unlocked: 0, total: 0 };
    path.unlocked += 1;
    path.total += 1;
    pathProgress[character.path] = path;
    const faction = factionProgress[character.factionId] ?? { unlocked: 0, total: 0 };
    faction.unlocked += 1;
    faction.total += 1;
    factionProgress[character.factionId] = faction;
  }
  return {
    characters: characters.map((character) => ({ ...character, unlocked: true })),
    skins: [...characterSkins],
    unlockedCount: characters.length,
    total: characters.length,
    pathProgress,
    factionProgress,
  };
}

function localizedPath(path: string, locale: "zh-CN" | "en" | "ja"): string {
  return pathLabels[path as keyof typeof pathLabels]?.[locale] ?? path;
}

function localizedFaction(factionId: string, locale: "zh-CN" | "en" | "ja"): string {
  if (locale === "zh-CN" && factionId === "fate-stay-night") return "异界（命运之夜）";
  return getFactionName(factionId, locale);
}

function localizedElement(element: string, locale: "zh-CN" | "en" | "ja"): string {
  return elementLabels[element as keyof typeof elementLabels]?.[locale] ?? element;
}

function localizedCharacterName(
  character: CollectionCharacter,
  locale: "zh-CN" | "en" | "ja",
): string {
  if (locale === "zh-CN") {
    if (character.id === "archer") return "弓兵";
    if (character.id === "saber") return "剑士";
    if (character.id === "silver-wolf-lv-999") return "银狼·999级";
  }
  return character.names[locale];
}

function collectionImagePath(character: CollectionCharacter): string {
  return character.officialId
    ? `/assets/collection/${character.officialId}.png`
    : character.assets.portraitPath || character.assets.avatarPath;
}

export const pathRewardImages: Record<string, string> = {
  destruction: "/assets/aeons/11.webp",
  hunt: "/assets/aeons/08.webp",
  erudition: "/assets/aeons/12.webp",
  harmony: "/assets/aeons/17.webp",
  nihility: "/assets/aeons/07.webp",
  preservation: "/assets/aeons/14.webp",
  abundance: "/assets/aeons/18.webp",
  remembrance: "/assets/aeons/04.webp",
  elation: "/assets/aeons/01.webp",
};

export const pathRewardImagePositions: Record<string, string> = {
  destruction: "50% 42%",
  hunt: "52% 43%",
  erudition: "50% 48%",
  harmony: "50% 42%",
  nihility: "50% 50%",
  preservation: "50% 47%",
  abundance: "50% 44%",
  remembrance: "50% 48%",
  elation: "50% 48%",
};

const characterIntroductions = introductions as Record<string, string>;

const factionRewardImages: Record<string, string> = {
  belobog: "/assets/faction-wallpapers/belobog.jpg",
  penacony: "/assets/faction-wallpapers/penacony.jpg",
  "xianzhou-alliance": "/assets/faction-wallpapers/xianzhou-alliance.jpg",
  "xianzhou-luofu": "/assets/faction-wallpapers/xianzhou-luofu.jpg",
  "xianzhou-yaoqing": "/assets/faction-wallpapers/xianzhou-yaoqing.jpg",
  "xianzhou-yuque": "/assets/faction-wallpapers/xianzhou-yuque.jpg",
  "xianzhou-zhuming": "/assets/faction-wallpapers/xianzhou-alliance.jpg",
  "herta-space-station": "/assets/faction-wallpapers/herta-space-station.jpg",
  "astral-express": "/assets/faction-wallpapers/astral-express.jpg",
  "stellaron-hunters": "/assets/faction-wallpapers/stellaron-hunters.jpg",
  ipc: "/assets/faction-wallpapers/ipc.jpg",
  "galaxy-rangers": "/assets/faction-wallpapers/galaxy-rangers.jpg",
  amphoreus: "/assets/faction-wallpapers/amphoreus.jpg",
  "masked-fools": "/assets/faction-wallpapers/masked-fools.jpg",
  "garden-of-recollection": "/assets/faction-wallpapers/garden-of-recollection.jpg",
  cosmic: "/assets/faction-wallpapers/galaxy-rangers.jpg",
  "intelligentsia-guild": "/assets/faction-wallpapers/herta-space-station.jpg",
  "knights-of-beauty": "/assets/faction-wallpapers/galaxy-rangers.jpg",
  "self-annihilators": "/assets/faction-wallpapers/galaxy-rangers.jpg",
  "the-cremators": "/assets/faction-wallpapers/galaxy-rangers.jpg",
  planarcadia: "/assets/faction-wallpapers/penacony.jpg",
};

function useCollectionData() {
  return useQuery({
    queryKey: ["collection"],
    queryFn: () =>
      localTestMode
        ? Promise.resolve(localCollection())
        : apiRequest<CollectionResponse>("/collection"),
    retry: false,
  });
}

export default function CollectionPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const collection = useCollectionData();
  const data = collection.data;
  const selectedRewardId = usePreferences((state) => state.collectionRewardId);
  const setCollectionReward = usePreferences((state) => state.setCollectionReward);
  const title =
    locale === "zh-CN" ? "角色图鉴" : locale === "ja" ? "キャラクター図鑑" : "Character collection";
  const unlockedLabel = locale === "zh-CN" ? "已解锁" : locale === "ja" ? "解放済み" : "Unlocked";
  const lockedLabel =
    locale === "zh-CN" ? "猜中后解锁" : locale === "ja" ? "正解で解放" : "Guess to unlock";
  const rewardCards = [
    ...Object.entries(data?.pathProgress ?? {}).map(([path, progress]) => ({
      id: `path:${path}`,
      kind: locale === "zh-CN" ? "命途主题" : locale === "ja" ? "運命テーマ" : "Path theme",
      name: localizedPath(path, locale),
      progress,
      imagePath: pathRewardImages[path] ?? "/assets/aeons/12.webp",
      imagePosition: pathRewardImagePositions[path] ?? "center",
    })),
    ...Object.entries(data?.factionProgress ?? {})
      .filter(([factionId, progress]) => progress.total >= 3 && factionId !== "fate-stay-night")
      .map(([factionId, progress]) => {
        return {
          id: `faction:${factionId}`,
          kind: locale === "zh-CN" ? "阵营主题" : locale === "ja" ? "陣営テーマ" : "Faction theme",
          name: localizedFaction(factionId, locale),
          progress,
          imagePath:
            factionRewardImages[factionId] ?? "/assets/faction-wallpapers/astral-express.jpg",
          imagePosition: "center",
        };
      }),
  ];
  return (
    <main className="page-shell collection-page">
      <PageHeader
        eyebrow={t("nav.collection")}
        title={title}
        intro={
          locale === "zh-CN"
            ? "猜中角色后收集官方立绘与资料。命途和阵营的完整收集会点亮专属奖励。"
            : locale === "ja"
              ? "正解したキャラクターの公式立ち絵と資料を集めます。"
              : "Collect official art and details by solving character puzzles."
        }
        aside={
          <div className="collection-counter">
            <strong>{data?.unlockedCount ?? 0}</strong>
            <span>
              / {data?.total ?? "—"} {unlockedLabel}
            </span>
          </div>
        }
      />
      <section className="collection-progress" aria-label={title}>
        {Object.entries(data?.pathProgress ?? {}).map(([path, progress]) => (
          <div key={path} className="collection-progress-item">
            <span>{localizedPath(path, locale)}</span>
            <strong>
              {progress.unlocked}/{progress.total}
            </strong>
            <i>
              <b style={{ width: `${(progress.unlocked / Math.max(1, progress.total)) * 100}%` }} />
            </i>
          </div>
        ))}
      </section>
      <section className="collection-rewards" aria-labelledby="collection-rewards-title">
        <div className="collection-rewards-head">
          <div>
            <p className="eyebrow">
              {locale === "zh-CN"
                ? "收集奖励"
                : locale === "ja"
                  ? "コレクション報酬"
                  : "Collection rewards"}
            </p>
            <h2 id="collection-rewards-title">
              {locale === "zh-CN"
                ? "点满命途或阵营，解锁专属视觉奖励"
                : locale === "ja"
                  ? "運命や陣営を完成して限定ビジュアルを解放"
                  : "Complete a path or faction to unlock its visual reward"}
            </h2>
          </div>
          <span className="collection-reward-count">
            <Award size={16} />{" "}
            {
              rewardCards.filter((reward) => reward.progress.unlocked >= reward.progress.total)
                .length
            }
            /{rewardCards.length}
          </span>
        </div>
        <div className="collection-reward-grid">
          {rewardCards.map((reward) => {
            const unlocked = reward.progress.unlocked >= reward.progress.total;
            const selected = selectedRewardId === reward.id;
            const factionId = reward.id.startsWith("faction:") ? reward.id.slice(8) : "";
            return (
              <article
                className={`collection-reward-card${reward.id.startsWith("faction:") ? " is-faction" : ""}${unlocked ? " is-unlocked" : " is-locked"}${selected ? " is-selected" : ""}`}
                key={reward.id}
              >
                <div
                  className="collection-reward-art"
                  data-faction={factionId || undefined}
                  aria-hidden="true"
                >
                  {reward.imagePath ? (
                    <img
                      className="collection-reward-image"
                      src={reward.imagePath}
                      alt=""
                      style={{ objectPosition: reward.imagePosition }}
                    />
                  ) : null}
                </div>
                <div className="collection-reward-copy">
                  <span className="collection-reward-kind">{reward.kind}</span>
                  <h3>{reward.name}</h3>
                  <span className="collection-reward-progress">
                    {reward.progress.unlocked}/{reward.progress.total}{" "}
                    {unlocked
                      ? locale === "zh-CN"
                        ? "已完成"
                        : "Complete"
                      : locale === "zh-CN"
                        ? `还差 ${reward.progress.total - reward.progress.unlocked} 名`
                        : `${reward.progress.total - reward.progress.unlocked} remaining`}
                  </span>
                  {unlocked ? (
                    <button
                      className="collection-reward-apply"
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setCollectionReward(reward.id, reward.imagePath)}
                    >
                      {selected ? <Check size={14} /> : null}
                      {selected
                        ? locale === "zh-CN"
                          ? "当前使用"
                          : "Active"
                        : locale === "zh-CN"
                          ? "应用全站主题"
                          : locale === "ja"
                            ? "全サイトテーマを適用"
                            : "Apply site theme"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="collection-grid">
        {(data?.characters ?? []).map((character) => {
          const name = localizedCharacterName(character, locale);
          return (
            <Link
              className={`collection-card${character.unlocked ? " is-unlocked" : " is-locked"}`}
              key={character.id}
              to={`/character/${character.id}`}
            >
              <div className="collection-art-wrap">
                <img
                  src={collectionImagePath(character)}
                  alt={character.unlocked ? name : lockedLabel}
                  loading="lazy"
                />
                {!character.unlocked ? <LockKeyhole size={19} aria-hidden="true" /> : null}
                <ArrowUpRight className="collection-card-arrow" size={15} aria-hidden="true" />
              </div>
              <div className="collection-card-body">
                <strong>{character.unlocked ? name : "????"}</strong>
                <span>
                  {character.unlocked
                    ? `${localizedPath(character.path, locale)} · ${localizedFaction(character.factionId, locale)}`
                    : lockedLabel}
                </span>
                {character.unlocked
                  ? (data?.skins ?? [])
                      .filter((skin) => skin.characterId === character.id)
                      .map((skin) => (
                        <div className="collection-skin" key={skin.id}>
                          <img src={skin.imagePath} alt={skin.names[locale]} loading="lazy" />
                          <span>{skin.names[locale]}</span>
                        </div>
                      ))
                  : null}
              </div>
            </Link>
          );
        })}
      </section>
      {collection.isError ? (
        <p className="collection-error">
          {locale === "zh-CN" ? "图鉴需要登录后同步。" : "Sign in to sync your collection."}
        </p>
      ) : null}
    </main>
  );
}

export function CollectionCharacterPage() {
  const { characterId } = useParams();
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const collection = useCollectionData();
  const character = collection.data?.characters.find((item) => item.id === characterId);
  const name = character ? localizedCharacterName(character, locale) : "角色";
  const skins = character
    ? (collection.data?.skins ?? []).filter((skin) => skin.characterId === character.id)
    : [];
  const introduction = character ? characterIntroductions[character.id] : undefined;

  if (collection.isLoading) {
    return (
      <main className="page-shell collection-detail-page">
        <p className="collection-error">{t("common.loading")}</p>
      </main>
    );
  }

  if (!character) {
    return (
      <main className="page-shell collection-detail-page">
        <Link className="collection-back-link" to="/collection">
          <ArrowLeft size={16} /> 返回图鉴
        </Link>
        <p className="collection-error">未找到这个角色。</p>
      </main>
    );
  }

  return (
    <main className="page-shell collection-detail-page">
      <Link className="collection-back-link" to="/collection">
        <ArrowLeft size={16} /> 返回图鉴
      </Link>
      <section className={`collection-detail${character.unlocked ? "" : " is-locked"}`}>
        <div className="collection-detail-art">
          <img
            src={collectionImagePath(character)}
            alt={character.unlocked ? name : "未解锁角色"}
          />
          {!character.unlocked ? <LockKeyhole size={26} aria-hidden="true" /> : null}
        </div>
        <div className="collection-detail-copy">
          <p className="eyebrow">{t("nav.collection")}</p>
          <h1>{character.unlocked ? name : "????"}</h1>
          {character.unlocked ? (
            <>
              <p className="collection-detail-meta">
                {localizedPath(character.path, locale)} ·{" "}
                {localizedFaction(character.factionId, locale)}
              </p>
              {introduction ? (
                <section className="collection-introduction">
                  <h2>角色简介</h2>
                  <p>{introduction}</p>
                  <a href="https://wiki.biligame.com/sr/角色图鉴" target="_blank" rel="noreferrer">
                    资料来源：BWiki 角色图鉴
                  </a>
                </section>
              ) : null}
              <dl className="collection-facts">
                <div>
                  <dt>属性</dt>
                  <dd>{localizedElement(character.element, locale)}</dd>
                </div>
                <div>
                  <dt>稀有度</dt>
                  <dd>{character.rarity} 星</dd>
                </div>
                <div>
                  <dt>地区</dt>
                  <dd>{getRegionName(character.regionId, locale)}</dd>
                </div>
                <div>
                  <dt>实装版本</dt>
                  <dd>{character.releaseVersionId}</dd>
                </div>
              </dl>
              {skins.length > 0 ? (
                <div className="collection-skin-gallery">
                  <h2>官方皮肤</h2>
                  <div>
                    {skins.map((skin) => (
                      <figure key={skin.id}>
                        <img src={skin.imagePath} alt={skin.names[locale]} />
                        <figcaption>{skin.names[locale]}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="collection-detail-locked">猜中这个角色后解锁资料。</p>
          )}
        </div>
      </section>
    </main>
  );
}
