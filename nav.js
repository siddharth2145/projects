// nav.js — Navigation controller

const NAV_ACTIVE_CLASS = 'active';
const PAGE_SUFFIX      = '-page';

function getPageId(button) {
  return button.dataset.page + PAGE_SUFFIX;
}

function clearActive(buttons, pages) {
  buttons.forEach(btn  => btn.classList.remove(NAV_ACTIVE_CLASS));
  pages.forEach(page => page.classList.remove(NAV_ACTIVE_CLASS));
}

function activate(button) {
  button.classList.add(NAV_ACTIVE_CLASS);
  const target = document.getElementById(getPageId(button));
  if (!target) {
    console.warn(`[Nav] Page not found: "${getPageId(button)}"`);
    return;
  }
  target.classList.add(NAV_ACTIVE_CLASS);
}

function initNav() {
  const buttons = document.querySelectorAll('.nav-btn');
  const pages   = document.querySelectorAll('.page');

  if (!buttons.length) {
    console.warn('[Nav] No .nav-btn elements found.');
    return;
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      clearActive(buttons, pages);
      activate(btn);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // improvement: scroll to top on page switch
    });
  });
}

document.addEventListener('DOMContentLoaded', initNav);
