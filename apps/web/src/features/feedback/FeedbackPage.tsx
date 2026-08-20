import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { useSession } from "../account/useSession";
import { usePreferences } from "../../state/preferences";
import "./feedback.css";

type FeedbackItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  resolvedReleaseTag: string | null;
};
type Attachment = { name: string; mime: string; dataUrl: string };

async function compressImage(file: File): Promise<Attachment> {
  if (file.size > 10 * 1024 * 1024) throw new Error("attachment-too-large");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.78),
  );
  if (!blob) throw new Error("attachment-compress-failed");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return { name: file.name.replace(/\.[^.]+$/, ".webp"), mime: "image/webp", dataUrl };
}

export default function FeedbackPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const session = useSession();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<"bug" | "suggestion" | "data">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reproduction, setReproduction] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sentId, setSentId] = useState<string | null>(null);
  const feedback = useQuery({
    queryKey: ["feedback"],
    queryFn: () => apiRequest<FeedbackItem[]>("/feedback"),
    enabled: !!session.data?.user && !session.data.user.isGuest,
  });
  const submit = useMutation({
    mutationFn: () =>
      apiRequest<{ id: string }>("/feedback", {
        method: "POST",
        body: JSON.stringify({
          category,
          title,
          description,
          reproduction,
          sourceUrl,
          contactEmail,
          attachments,
        }),
      }),
    onSuccess: ({ id }) => {
      setSentId(id);
      setTitle("");
      setDescription("");
      setReproduction("");
      setSourceUrl("");
      setAttachments([]);
      void queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).slice(0, 5 - attachments.length);
    try {
      const compressed = await Promise.all(picked.map(compressImage));
      setAttachments((current) => [...current, ...compressed]);
    } catch {
      /* 浏览器端提示由表单状态承接 */
    }
  };
  const registered = !!session.data?.user && !session.data.user.isGuest;
  return (
    <main className="page-shell feedback-page">
      <PageHeader
        eyebrow={t("nav.feedback")}
        title={
          locale === "zh-CN"
            ? "Bug / 意见反馈"
            : locale === "ja"
              ? "不具合・ご意見"
              : "Bug / feedback"
        }
        intro={
          locale === "zh-CN"
            ? "提交后会生成编号，你可以在本页查看处理状态。"
            : "Send feedback without leaving the site and track its status here."
        }
      />
      {!registered ? (
        <div className="feedback-login-note">
          {locale === "zh-CN"
            ? "反馈需要注册账号，避免重复和匿名滥用。"
            : "Please sign in with a registered account to send feedback."}
        </div>
      ) : null}
      <form
        className="feedback-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (registered) submit.mutate();
        }}
      >
        <label>
          {locale === "zh-CN" ? "分类" : "Category"}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
          >
            <option value="bug">Bug</option>
            <option value="suggestion">{locale === "zh-CN" ? "功能建议" : "Suggestion"}</option>
            <option value="data">{locale === "zh-CN" ? "数据纠错" : "Data correction"}</option>
          </select>
        </label>
        <label>
          {locale === "zh-CN" ? "标题" : "Title"}
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
          />
        </label>
        <label>
          {locale === "zh-CN" ? "描述" : "Description"}
          <textarea
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            maxLength={20000}
          />
        </label>
        <label>
          {locale === "zh-CN" ? "复现步骤 / 建议目标" : "Steps or desired outcome"}
          <textarea
            value={reproduction}
            onChange={(event) => setReproduction(event.target.value)}
            rows={4}
          />
        </label>
        <label>
          {locale === "zh-CN" ? "资料来源链接（可选）" : "Source link (optional)"}
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </label>
        <label>
          {locale === "zh-CN" ? "联系邮箱（可选）" : "Contact email (optional)"}
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </label>
        <label className="feedback-file">
          <span>
            <Paperclip size={16} />
            {locale === "zh-CN"
              ? `截图（最多 5 张，单张 10MB，自动压缩）${attachments.length ? ` · 已选 ${attachments.length}` : ""}`
              : `Screenshots (up to 5, 10MB each)${attachments.length ? ` · ${attachments.length} selected` : ""}`}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </label>
        <button
          className="feedback-submit"
          type="submit"
          disabled={!registered || submit.isPending}
        >
          <Send size={16} />
          {locale === "zh-CN" ? "发送" : locale === "ja" ? "送信" : "Send"}
        </button>
      </form>
      {sentId ? (
        <div className="feedback-sent">
          <CheckCircle2 size={18} />
          {locale === "zh-CN" ? `已发送，编号 ${sentId}` : `Sent. Reference ${sentId}`}
        </div>
      ) : null}
      <section className="feedback-history">
        <h2>{locale === "zh-CN" ? "我的反馈" : "My feedback"}</h2>
        {(feedback.data ?? []).map((item) => (
          <div className="feedback-row" key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.id}</span>
            <em>
              {item.status}
              {item.resolvedReleaseTag ? ` · ${item.resolvedReleaseTag}` : ""}
            </em>
          </div>
        ))}
      </section>
    </main>
  );
}
