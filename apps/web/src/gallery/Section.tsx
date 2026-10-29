export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBlock: 32 }}>
      <h2 style={{ fontSize: "var(--ts-font-size-lg)" }}>{title}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>{children}</div>
    </section>
  );
}
