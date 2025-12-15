(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

// Multi-language support for page content
window.updatePageLanguage = function() {
  if (typeof i18next === 'undefined' || !i18next.isInitialized) {
    console.warn('i18next not ready');
    return;
  }
  
  console.log('=== Updating page to language:', i18next.language, '===');
  
  try {
    // First, re-mark all elements (because content may have changed)
    window.markTranslatableElements();
    
    // Update marked elements using their translation keys
    if (window.translatableElements && window.translatableElements.length > 0) {
      console.log('Updating', window.translatableElements.length, 'marked elements');
      window.translatableElements.forEach(el => {
        if (el.dataset.translationKey && el.parentElement) {
          const key = el.dataset.translationKey;
          const translated = i18next.t(key);
          if (translated && translated !== key) {
            console.log('  Updating:', key, '→', translated);
            el.textContent = translated;
          }
        }
      });
    }
    
    // Update search input placeholder
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.placeholder = i18next.t('where_go');
      console.log('Updated search placeholder');
    }
    
    // Update all input placeholders that contain search text
    const allInputs = document.querySelectorAll('input[type="text"], input[type="search"]');
    allInputs.forEach(input => {
      if (input.placeholder && input.id === 'searchInput') {
        input.placeholder = i18next.t('where_go');
      }
    });
    
    // Update search buttons  
    const searchBtns = document.querySelectorAll('.search-btn');
    searchBtns.forEach(btn => {
      const text = i18next.t('search_btn');
      if (btn.innerHTML.includes('fa-search')) {
        btn.innerHTML = '<i class="fa-solid fa-search"></i><span>' + text + '</span>';
      }
    });
    
    console.log('✓ Page language updated successfully');
  } catch (e) {
    console.error('Error updating page language:', e);
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded, checking for i18next...');
  
  const checkI18next = function() {
    if (typeof i18next !== 'undefined' && i18next.isInitialized && window.i18nextReady) {
      console.log('i18next ready, updating page');
      if (typeof window.markTranslatableElements === 'function') {
        window.markTranslatableElements();
      }
      if (typeof window.updatePageLanguage === 'function') {
        window.updatePageLanguage();
      }
    } else {
      setTimeout(checkI18next, 100);
    }
  };
  
  checkI18next();
});