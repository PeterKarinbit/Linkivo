document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const popup = document.getElementById('waitlistPopup');
  const openBtn = document.getElementById('openWaitlist');
  const closeBtn = document.getElementById('closeWaitlist');
  const backToForm = document.getElementById('backToForm');
  const form = document.getElementById('waitlistForm');
  const successMessage = document.getElementById('successMessage');
  
  // Open popup when clicking Join Waitlist buttons
  const joinButtons = document.querySelectorAll('.join-waitlist-btn');
  joinButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openPopup();
    });
  });
  
  // Close popup
  function closePopup() {
    popup.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  
  function openPopup() {
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Close when clicking close button
  if (closeBtn) {
    closeBtn.addEventListener('click', closePopup);
  }
  
  // Close when clicking outside the popup
  popup.addEventListener('click', function(e) {
    if (e.target === popup) {
      closePopup();
    }
  });
  
  // Back to form from success message
  if (backToForm) {
    backToForm.addEventListener('click', function() {
      successMessage.classList.add('d-none');
      form.classList.remove('d-none');
    });
  }
  
  // Form submission
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Show success message
      form.classList.add('d-none');
      successMessage.classList.remove('d-none');
      
      // Reset form after a delay
      setTimeout(() => {
        form.reset();
      }, 1000);
    });
  }
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closePopup();
    }
  });
});
