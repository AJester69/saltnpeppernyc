const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('#site-nav');
const ticker = document.querySelector('[data-ticker]');
const yearNode = document.querySelector('[data-year]');
const menuTabs = document.querySelectorAll('[data-menu-tab]');
const menuPanels = document.querySelectorAll('[data-menu-panel]');

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('is-open', !expanded);
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      siteNav.classList.remove('is-open');
    });
  });
}

if (ticker) {
  const messages = [
    'Late-night combos. Fast pickup. NYC fried chicken with real crunch.',
    'Chicken, burgers, rice bowls, wraps, and wings built for quick decisions.',
    'Bold flavor, clear promo blocks, and a first-pass menu ready to refine.',
  ];

  let index = 0;
  window.setInterval(() => {
    index = (index + 1) % messages.length;
    ticker.textContent = messages[index];
  }, 3600);
}

if (menuTabs.length && menuPanels.length) {
  menuTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.menuTab;

      menuTabs.forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', String(isActive));
      });

      menuPanels.forEach((panel) => {
        const isActive = panel.dataset.menuPanel === target;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });
    });
  });
}
