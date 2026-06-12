type ActivityItem = {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  created_at: string;
};

type ActivityFeedProps = {
  items: ActivityItem[];
};

function formatAction(action: string) {
  return action.replaceAll(".", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card) h-full max-h-[600px] overflow-y-auto">
      <header className="mb-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-10 pb-2">
        <h2 className="text-lg font-semibold text-(--brand-900) flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Feed
        </h2>
        <span className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">Hari Ini</span>
      </header>

      <ul className="space-y-4">
        {items.length === 0 ? (
          <li className="rounded-2xl bg-(--brand-50) px-4 py-3 text-sm text-(--text-mid)">
            Belum ada aktivitas admin.
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-(--brand-500) after:absolute after:left-[11px] after:top-5 after:h-full after:w-px after:bg-(--brand-100) last:after:hidden"
            >
              <p className="text-sm font-medium text-(--brand-900) leading-snug">
                Sistem mencatat: <span className="font-semibold">{formatAction(item.action)}</span> pada {item.entity_type} <span className="text-(--brand-600)">#{item.entity_id ?? "-"}</span>
              </p>
              <p className="mt-1 text-xs text-(--text-light)">
                {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
