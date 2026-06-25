// Lightweight prose primitives for the legal pages — styled with app tokens so
// they don't depend on a typography plugin.

export function LegalTitle({ title, updated }: { title: string; updated: string }) {
  return (
    <header className="mb-8 pb-6 border-b border-border">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-navy font-lato">{title}</h1>
      <p className="mt-2 text-sm text-body font-lato">Last updated: {updated}</p>
    </header>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-navy font-lato mt-9 mb-3">{children}</h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] leading-relaxed text-body font-lato mb-4">{children}</p>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-5 space-y-2 mb-4 text-[15px] leading-relaxed text-body font-lato">
      {children}
    </ul>
  );
}
