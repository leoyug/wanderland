export function LibrarySkeleton() {
  return (
    <div className="library-skeleton-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="library-skeleton-card" key={index}>
          <i className="library-skeleton-source" />
          <i className="library-skeleton-media" />
          <div className="library-skeleton-lines"><i /><i /><i /></div>
        </div>
      ))}
    </div>
  );
}
