// Párrafo cuyas palabras se encienden al hacer scroll (CSS scroll-timeline; sin JS en el cliente).
export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(/\s+/);
  return (
    <p className={`a-words ${className}`}>
      {words.map((w, i) => (
        <span key={i} className="w" style={{ ["--i" as string]: i }}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
