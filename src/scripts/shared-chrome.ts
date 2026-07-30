const setExpanded = (button: HTMLButtonElement, expanded: boolean) => {
  button.setAttribute('aria-expanded', String(expanded));
};

export const bootSharedChrome = () => {
  const header = document.querySelector<HTMLElement>('[data-shared-header]');
  if (!header || header.dataset.ready === 'true') return;
  header.dataset.ready = 'true';
  const desktopToggle = header.querySelector<HTMLButtonElement>('.rk-nav__toggle');
  const desktopMenu = header.querySelector<HTMLElement>('.rk-nav__services');
  const menuButton = header.querySelector<HTMLButtonElement>('.rk-menu-button');
  const drawer = header.querySelector<HTMLElement>('.rk-drawer');
  const backdrop = header.querySelector<HTMLButtonElement>('.rk-drawer-backdrop');
  const closeButton = header.querySelector<HTMLButtonElement>('.rk-drawer__close');
  const submenuButton = header.querySelector<HTMLButtonElement>('.rk-submenu-button');

  const closeDropdown = () => {
    desktopMenu?.classList.remove('is-open');
    if (desktopToggle) setExpanded(desktopToggle, false);
  };
  const openDropdown = () => {
    desktopMenu?.classList.add('is-open');
    if (desktopToggle) setExpanded(desktopToggle, true);
  };
  desktopToggle?.addEventListener('click', openDropdown);
  desktopMenu?.addEventListener('pointerenter', openDropdown);
  desktopMenu?.addEventListener('pointerleave', closeDropdown);

  const closeDrawer = () => {
    header.classList.remove('is-drawer-open');
    drawer?.setAttribute('aria-hidden', 'true');
    drawer?.setAttribute('inert', '');
    if (menuButton) setExpanded(menuButton, false);
    document.documentElement.classList.remove('rk-scroll-locked');
    menuButton?.focus({ preventScroll: true });
  };
  const openDrawer = () => {
    header.classList.add('is-drawer-open');
    drawer?.setAttribute('aria-hidden', 'false');
    drawer?.removeAttribute('inert');
    if (menuButton) setExpanded(menuButton, true);
    document.documentElement.classList.add('rk-scroll-locked');
    menuButton?.blur();
  };
  menuButton?.addEventListener('click', openDrawer);
  closeButton?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  submenuButton?.addEventListener('click', () => {
    const open = submenuButton.getAttribute('aria-expanded') !== 'true';
    setExpanded(submenuButton, open);
    header.classList.toggle('is-submenu-open', open);
    submenuButton.textContent = open ? '⌃' : '⌄';
  });
  header.querySelector<HTMLFormElement>('[data-local-search]')?.addEventListener('submit', (event) => event.preventDefault());

  const applyStickyState = () => {
    const threshold = 149;
    const stuck = scrollY > threshold;
    header.classList.toggle('is-stuck', stuck);
    header.dataset.state = stuck ? 'stuck' : 'initial';
  };
  applyStickyState();
  addEventListener('scroll', applyStickyState, { passive: true });
  document.addEventListener('click', (event) => {
    if (desktopMenu && !desktopMenu.contains(event.target as Node)) closeDropdown();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') return;
  });

  document.querySelector<HTMLFormElement>('[data-footer-newsletter]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector<HTMLElement>('.rk-newsletter-status');
    if (status) status.textContent = 'Thank you. This staging form does not send data.';
  });
};
