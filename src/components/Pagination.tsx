type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Builds a compact page-number list with ellipses, e.g.:
 * [1, 2, 3, 4, 5] or [1, '...', 4, 5, 6, '...', 10]
 */
function buildPageList(currentPage: number, totalPages: number): Array<number | '...'> {
  const pages: Array<number | '...'> = [];
  const windowSize = 1;

  for (let page = 1; page <= totalPages; page++) {
    const isFirstOrLast = page === 1 || page === totalPages;
    const isNearCurrent = Math.abs(page - currentPage) <= windowSize;

    if (isFirstOrLast || isNearCurrent) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return pages;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageList = buildPageList(currentPage, totalPages);

  const buttonBaseStyle = {
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ ...buttonBaseStyle, color: '#1F2A24', border: '1px solid #E4DCC9' }}
      >
        Previous
      </button>

      {pageList.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm" style={{ color: '#8A8273', ...buttonBaseStyle }}>
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-9 h-9 text-sm rounded-md"
            style={{
              ...buttonBaseStyle,
              backgroundColor: page === currentPage ? '#2F6F4F' : 'transparent',
              color: page === currentPage ? '#FFFFFF' : '#1F2A24',
              border: page === currentPage ? 'none' : '1px solid #E4DCC9',
            }}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-sm rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ ...buttonBaseStyle, color: '#1F2A24', border: '1px solid #E4DCC9' }}
      >
        Next
      </button>
    </div>
  );
}