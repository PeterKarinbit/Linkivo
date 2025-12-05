// Wait for stylesheets to load before accessing layout properties
function waitForStylesheets(callback) {
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  let loadedCount = 0;
  const totalStylesheets = stylesheets.length;
  
  if (totalStylesheets === 0) {
    callback();
    return;
  }
  
  stylesheets.forEach(function(link) {
    if (link.sheet) {
      // Stylesheet already loaded
      loadedCount++;
      if (loadedCount === totalStylesheets) {
        callback();
      }
    } else {
      link.addEventListener('load', function() {
        loadedCount++;
        if (loadedCount === totalStylesheets) {
          callback();
        }
      });
      link.addEventListener('error', function() {
        loadedCount++;
        if (loadedCount === totalStylesheets) {
          callback();
        }
      });
    }
  });
  
  // Fallback timeout
  setTimeout(callback, 2000);
}

// Intersection Observer for section animations
document.addEventListener('DOMContentLoaded', function() {
  // Wait for stylesheets before accessing layout properties
  waitForStylesheets(function() {
    // Configure intersection observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    // Callback for intersection observer
    const handleIntersect = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Stop observing once visible
        }
      });
    };

    // Create observer
    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
      observer.observe(section);
    });

    // Smooth scroll for anchor links with offset for fixed header
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const headerOffset = 100; // Match scroll-padding-top
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  });
});
