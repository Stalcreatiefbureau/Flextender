  function initFilterBasic() {
  // Find all filter groups on the page
  const groups = document.querySelectorAll('[data-filter-group]');

  groups.forEach((group) => {
    const buttons = group.querySelectorAll('[data-filter-target]');
    const items = group.querySelectorAll('[data-filter-name]');
    const transitionDelay = 300; // Delay for transition effect (in milliseconds)

    // Function to update the status and accessibility attributes of items
    const updateStatus = (element, shouldBeActive) => {
      // If the item should be active, set it to "active", otherwise "not-active"
      element.setAttribute('data-filter-status', shouldBeActive ? 'active' : 'not-active');
      element.setAttribute('aria-hidden', shouldBeActive ? 'false' : 'true');
    };

    // Function to handle filtering logic when a button is clicked
    const handleFilter = (target) => {
      // Loop through all items and ensure every item transitions out first
      items.forEach((item) => {
        const shouldBeActive = target === 'all' || item.getAttribute('data-filter-name') === target;
        const currentStatus = item.getAttribute('data-filter-status');

        // Only transition items currently visible (status: active)
        if (currentStatus === 'active') {
          item.setAttribute('data-filter-status', 'transition-out');
          // After the transition delay, set the final status
          setTimeout(() => updateStatus(item, shouldBeActive), transitionDelay);
        } else {
          // For items not currently visible, simply update their status after the delay
          setTimeout(() => updateStatus(item, shouldBeActive), transitionDelay);
        }
      });

      // Update the active status for all buttons
      buttons.forEach((button) => {
        const isActive = button.getAttribute('data-filter-target') === target;
        button.setAttribute('data-filter-status', isActive ? 'active' : 'not-active');
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false'); // Accessibility: indicate active state
      });
    };

    // Attach click event listeners to each button
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.getAttribute('data-filter-target');

        // If the button is already active, do nothing
        if (button.getAttribute('data-filter-status') === 'active') return;

        // Trigger the filter logic with the selected target
        handleFilter(target);
      });
    });
  });
}

// Initialize Basic Filter Setup
document.addEventListener('DOMContentLoaded', () => {
  initFilterBasic();
});
