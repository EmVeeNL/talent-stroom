export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBlock: "var(--ts-space-8)" }}>
      <h2 style={{ font: "var(--ts-font-section-title)" }}>{title}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ts-space-4)", alignItems: "flex-start" }}>
        {children}
      </div>
    </section>
  );
}
