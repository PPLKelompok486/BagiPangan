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
    <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-(--brand-900)">Aktivitas Terbaru</h2>
        <span className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">Audit</span>
      </header>

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-2xl bg-(--brand-50) px-4 py-3 text-sm text-(--text-mid)">
            Belum ada aktivitas admin.
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-(--brand-100) bg-(--brand-50) px-4 py-3"
            >
              <p className="font-medium text-(--brand-900)">{formatAction(item.action)}</p>
              <p className="mt-1 text-sm text-(--text-mid)">
                {item.entity_type} #{item.entity_id ?? "-"}
              </p>
              <p className="mt-1 text-xs text-(--text-mid)">
                {new Date(item.created_at).toLocaleString("id-ID")}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
