import type { UsersResponse } from "../types";

type UsersTableProps = {
  users: UsersResponse["data"]["data"];
};

export function UsersTable({ users }: UsersTableProps) {
  return (
    <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-(--brand-900)">Manajemen Pengguna</h2>
        <span className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">MVP</span>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-(--text-mid)">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Peran</th>
              <th className="px-3 py-2">Kota</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-(--text-mid)" colSpan={4}>
                  Belum ada data pengguna.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="rounded-2xl bg-(--brand-50) text-(--brand-900)">
                  <td className="rounded-l-2xl px-3 py-3">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-(--text-mid)">{user.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    {user.is_admin ? "Admin" : user.role === "donatur" ? "Donatur" : "Penerima"}
                  </td>
                  <td className="px-3 py-3">{user.city ?? "-"}</td>
                  <td className="rounded-r-2xl px-3 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.is_active
                            ? "bg-(--brand-100) text-(--brand-800)"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
