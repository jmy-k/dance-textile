fetch("/heatmap-list")
  .then(res => res.json())
  .then(filenames => {
    const list = document.getElementById("heatmapList");
    const noHeatmaps = document.getElementById("noHeatmaps");
    
    if (filenames.length === 0) {
      noHeatmaps.style.display = "block";
      return;
    }
    
    // Filenames are initially in order from oldest to newest
    
    // First, get the total count
    const totalCount = filenames.length;
    

    
    // Now create the grid items
    filenames.forEach((filename, index) => {
      const item = document.createElement("div");
      item.className = "heatmap-item";
      
      const link = document.createElement("a");
      link.href = `/view-textile.html?file=${filename}`;
      link.className = "heatmap-link";
      
      // Number from highest to lowest
      const displayNumber = totalCount - index;
      link.textContent = displayNumber;
      
      item.appendChild(link);
      list.appendChild(item);
    });
  })
  .catch(err => {
    console.error("failed to load textile list:", err);
    alert("error loading textiles. please try again later.");
  });

document.getElementById("deleteAll").addEventListener("click", async () => {
  if (!confirm("are you sure you want to delete ALL textiles?")) return;
  try {
    const res = await fetch("/delete-all-heatmaps", { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      alert(`deleted ${result.deletedCount} textiles.`);
      location.reload(); // Reload the page to refresh the list
    } else {
      alert("failed to delete textiles.");
    }
  } catch (err) {
    console.error("delete request failed:", err);
    alert("error sending delete request.");
  }
});