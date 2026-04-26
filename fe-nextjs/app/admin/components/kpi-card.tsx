type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
};

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <article className="rounded-[1.25rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)">
      <p className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">{label}</p>
      <p className="bagi-display mt-3 text-4xl text-(--brand-900)">{value}</p>
      <p className="mt-2 text-sm text-(--text-mid)">{hint}</p>
    </article>
  );
}
