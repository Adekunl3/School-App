"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import Modal from "@/components/Modal";
import { Loader } from "@/components/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { useList } from "@/hooks/useList";
import { ApiError } from "@/lib/apiClient";
import { useSession } from "@/providers/SessionProvider";
import { messageService, teacherService } from "@/services/school";
import type { Message } from "@/types/school";
import { displayAddress, toAddress } from "@/utils/messageAddress";

const SUBJECT_MAX = 120;
const BODY_MAX = 2000;

const inputClass =
  "ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full dark:ring-gray-600 dark:bg-gray-800 dark:text-gray-200";

const columns: ListColumn[] = [
  { header: "From / To", accessor: "who", sortProperty: "SenderUsername" },
  { header: "Subject", accessor: "subject", sortProperty: "Subject" },
  { header: "Date", accessor: "date", className: "hidden md:table-cell", sortProperty: "SentDate" },
];

const formatWhen = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

// ---------------------------------------------------------------- compose

interface Draft {
  to: string;
  subject: string;
  body: string;
}

const Compose = ({
  draft,
  onClose,
  onSent,
}: {
  draft: Draft;
  onClose: () => void;
  onSent: () => void;
}) => {
  const { user } = useSession();
  const me = user?.uniqueName ?? "";

  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  // Teachers are the only records that carry a login, so they are the
  // suggestions; any other username can still be typed in.
  const teachers = useAsync(
    useCallback(
      () =>
        teacherService
          .list({ page: 1, itemsPerPage: 100, sortProperty: "LastName" })
          .then((r) => r.items.filter((t) => t.username)),
      []
    )
  );

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const recipient = to.trim();

    if (!recipient) next.to = "Who is this to?";
    else if (me && toAddress(recipient, me).toLowerCase() === me.toLowerCase()) {
      next.to = "You cannot send a message to yourself.";
    }
    if (!body.trim()) next.body = "Write a message.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    try {
      const result = await messageService.send({
        recipientUsername: toAddress(recipient, me),
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      toast.success(result.message || "Message sent.");
      onSent();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal onClose={onClose} closeDisabled={sending}>
      <form onSubmit={send} className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">New message</h1>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-300">To (username)</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            list="message-recipients"
            className={inputClass}
            placeholder="e.g. jdoe"
            autoComplete="off"
          />
          <datalist id="message-recipients">
            {(teachers.data ?? []).map((t) => (
              <option key={t.teacherId} value={t.username ?? ""}>
                {t.name}
              </option>
            ))}
          </datalist>
          {errors.to && <p className="text-xs text-red-400">{errors.to}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-300">Subject</label>
          <input
            value={subject}
            maxLength={SUBJECT_MAX}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-300">Message</label>
          <textarea
            value={body}
            maxLength={BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className={inputClass}
          />
          <div className="flex justify-between text-xs">
            <span className="text-red-400">{errors.body}</span>
            <span className="text-gray-400">
              {body.length.toLocaleString()} / {BODY_MAX.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={sending}
          aria-busy={sending}
          className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </Modal>
  );
};

// ------------------------------------------------------------------- read

const ReadMessage = ({
  messageId,
  onClose,
  onReply,
  onDeleted,
  onOpened,
}: {
  messageId: string;
  onClose: () => void;
  onReply: (message: Message) => void;
  onDeleted: () => void;
  /** The server marks a received message read when it is opened. */
  onOpened: () => void;
}) => {
  const { user } = useSession();
  const me = user?.uniqueName ?? "";
  const [deleting, setDeleting] = useState(false);

  const { data: message, loading, error } = useAsync<Message>(
    useCallback(() => messageService.byId(messageId), [messageId]),
    [messageId]
  );

  useEffect(() => {
    if (message && !message.isOutgoing) onOpened();
    // Only once the message has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.messageId]);

  const remove = async () => {
    if (!window.confirm("Delete this message?")) return;
    setDeleting(true);
    try {
      const result = await messageService.remove(messageId);
      toast.success(result.message || "Message deleted.");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to delete message.");
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={onClose} closeDisabled={deleting}>
      {loading ? (
        <Loader label="Loading message..." />
      ) : error || !message ? (
        <p className="p-4 text-sm text-red-600">{error?.detail ?? "Message not found."}</p>
      ) : (
        <div className="flex flex-col gap-4 pr-6">
          <div>
            <h1 className="text-xl font-semibold break-words">{message.subject || "(no subject)"}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              {message.isOutgoing ? (
                <>To <span className="font-medium">{displayAddress(message.recipientUsername, me)}</span></>
              ) : (
                <>From <span className="font-medium">{displayAddress(message.senderUsername, me)}</span></>
              )}
              {" · "}
              {message.sentDate ? new Date(message.sentDate).toLocaleString() : "-"}
            </p>
            {message.isOutgoing && (
              <p className="text-xs text-gray-400 mt-1">
                {message.readDate ? `Read ${new Date(message.readDate).toLocaleString()}` : "Not read yet"}
              </p>
            )}
          </div>

          <div className="text-sm whitespace-pre-wrap break-words rounded-md bg-slate-50 dark:bg-gray-700 p-4">
            {message.body}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              aria-busy={deleting}
              className="py-2 px-4 rounded-md border border-red-300 text-red-700 text-sm disabled:opacity-60 dark:border-red-500 dark:text-red-400"
            >
              Delete
            </button>
            {!message.isOutgoing && (
              <button
                type="button"
                onClick={() => onReply(message)}
                className="py-2 px-4 rounded-md bg-blue-400 text-white text-sm"
              >
                Reply
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

// ------------------------------------------------------------------- page

const MessagesPage = () => {
  const { user } = useSession();
  const me = user?.uniqueName ?? "";

  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const list = useList<Message>({
    fetcher: useCallback((query) => messageService.list(query), []),
    itemsPerPage: 10,
  });

  const reply = (message: Message) => {
    setOpenId(null);
    const subject = message.subject ?? "";
    setDraft({
      to: displayAddress(message.senderUsername, me),
      subject: /^re:/i.test(subject) ? subject : `Re: ${subject}`.trim(),
      body: "",
    });
  };

  const renderRow = (item: Message) => {
    const unread = !item.isOutgoing && !item.isRead;
    return (
      <tr
        key={item.id}
        onClick={() => setOpenId(item.messageId)}
        className={`border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight cursor-pointer dark:even:bg-gray-700/50 dark:hover:bg-gray-700 dark:border-gray-700 ${
          unread ? "font-semibold" : ""
        }`}
      >
        <td className="p-4">
          <div className="flex items-center gap-2">
            {unread && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" aria-label="Unread" />}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-normal ${
                item.isOutgoing
                  ? "bg-gray-100 text-gray-600"
                  : "bg-lamaSkyLight text-sky-800 dark:bg-sky-900 dark:text-sky-100"
              }`}
            >
              {item.isOutgoing ? "To" : "From"}
            </span>
            <span className="truncate">
              {displayAddress(item.isOutgoing ? item.recipientUsername : item.senderUsername, me)}
            </span>
          </div>
        </td>
        <td>
          <p className="truncate max-w-[16rem] md:max-w-md">{item.subject || "(no subject)"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-300 font-normal truncate max-w-[16rem] md:max-w-md">
            {item.body}
          </p>
        </td>
        <td className="hidden md:table-cell whitespace-nowrap">{formatWhen(item.sentDate)}</td>
      </tr>
    );
  };

  return (
    <>
      <ListPageShell<Message>
        title="Messages"
        columns={columns}
        renderRow={renderRow}
        list={list}
        noun="messages"
        searchPlaceholder="Search messages..."
        canImport={false}
        emptyText="No messages yet. Use New message to send one."
        toolbar={
          <button
            type="button"
            onClick={() => setDraft({ to: "", subject: "", body: "" })}
            className="h-8 px-3 flex items-center rounded-full bg-lamaYellow text-xs font-medium text-gray-800"
          >
            New message
          </button>
        }
      />

      {openId && (
        <ReadMessage
          messageId={openId}
          onClose={() => setOpenId(null)}
          onReply={reply}
          onOpened={list.refetch}
          onDeleted={() => {
            setOpenId(null);
            list.refetch();
          }}
        />
      )}

      {draft && (
        <Compose
          draft={draft}
          onClose={() => setDraft(null)}
          onSent={() => {
            setDraft(null);
            list.refetch();
          }}
        />
      )}
    </>
  );
};

export default MessagesPage;
