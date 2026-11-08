const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 6;

// Calculate slots to show for current page
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentSlots = filteredSlots.slice(indexOfFirstItem, indexOfLastItem);

// Render page buttons at bottom of grid
<div className="pagination">
  <button 
    disabled={currentPage === 1} 
    onClick={() => setCurrentPage(prev => prev - 1)}
  >
    Previous
  </button>
  <span>Page {currentPage}</span>
  <button 
    disabled={indexOfLastItem >= filteredSlots.length} 
    onClick={() => setCurrentPage(prev => prev + 1)}
  >
    Next
  </button>
</div>
