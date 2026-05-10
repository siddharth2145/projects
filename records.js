window.deleteRecord = function(id) {
  if (!confirm('Delete this record? This cannot be undone.')) return;
  records = records.filter(r => r.id !== id);
  saveToStorage();
  renderRecords();
};

/* ── Events ── */
addRecordBtn.addEventListener('click', () => {
  resetForm();
  recordForm.classList.toggle('active');
});

cancelBtn.addEventListener('click', () => {
  recordForm.classList.remove('active');
  resetForm();
});

saveBtn.addEventListener('click', saveRecord);

/* ── Init ── */
document.addEventListener('DOMContentLoaded', renderRecords);
