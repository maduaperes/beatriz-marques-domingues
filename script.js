/* ==========================================================================
   Beatriz Marques Domingues — Portfólio
   Interações: cabeçalho, menu mobile, seção ativa, revelação ao rolar,
   cópia de e-mail e ano do rodapé.
   ========================================================================== */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ---------- Cabeçalho: fundo ao rolar e ocultar ao descer ---------- */
  const initHeader = () => {
    const header = $("[data-header]");
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const menuOpen = document.body.classList.contains("menu-open");

      header.classList.toggle("is-scrolled", y > 24);
      header.classList.toggle(
        "is-hidden",
        !menuOpen && y > 480 && y > lastY + 4,
      );
      if (y < lastY - 4) header.classList.remove("is-hidden");

      lastY = y;
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );

    update();
  };

  /* ---------- Menu mobile ---------- */
  const initMenu = () => {
    const toggle = $("[data-nav-toggle]");
    const nav = $("[data-nav]");
    if (!toggle || !nav) return;

    const label = $(".sr-only", toggle);
    const links = $$("a", nav);

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (label) label.textContent = open ? "Fechar menu" : "Abrir menu";
      if (open) links[0]?.focus({ preventScroll: true });
    };

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    links.forEach((link) =>
      link.addEventListener("click", () => setOpen(false)),
    );

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Fecha o menu ao voltar para a largura de desktop
    window.matchMedia("(min-width: 861px)").addEventListener("change", (mq) => {
      if (mq.matches) setOpen(false);
    });
  };

  /* ---------- Destaque do link da seção visível ---------- */
  const initActiveSection = () => {
    const links = $$(".nav-link");
    const map = new Map(
      links.map((link) => [link.getAttribute("href").slice(1), link]),
    );
    const sections = [...map.keys()]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
          });
          const active = map.get(entry.target.id);
          if (active) {
            active.classList.add("is-active");
            active.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
  };

  /* ---------- Revelação ao rolar (com escalonamento por grupo) ---------- */
  const initReveal = () => {
    const items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Itens irmãos entram em sequência sutil
    items.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) =>
        c.classList.contains("reveal"),
      );
      const index = siblings.indexOf(el);
      el.style.setProperty("--stagger", `${Math.min(index, 5) * 90}ms`);
    });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    items.forEach((el) => observer.observe(el));
  };

  /* ---------- Hero: luz que acompanha o cursor ---------- */
  const initSpotlight = () => {
    const hero = $("[data-hero]");
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (!hero || prefersReducedMotion || !finePointer) return;

    let frame;
    hero.addEventListener("pointermove", (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty(
          "--mx",
          `${((event.clientX - rect.left) / rect.width) * 100}%`,
        );
        hero.style.setProperty(
          "--my",
          `${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
      });
    });
  };

  /* ---------- Toast ---------- */
  const toast = (() => {
    const el = $("[data-toast]");
    let timer;
    return (message) => {
      if (!el) return;
      el.textContent = message;
      el.classList.add("is-visible");
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove("is-visible"), 2400);
    };
  })();

  /* ---------- Copiar e-mail ---------- */
  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    // Alternativa para arquivos abertos localmente (file://)
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("copy failed");
  };

  const initCopy = () => {
    $$("[data-copy]").forEach((button) => {
      const label = $("[data-copy-label]", button);
      const original = label?.textContent ?? "";
      let timer;

      button.addEventListener("click", async () => {
        try {
          await copyText(button.dataset.copy);
          button.classList.add("is-copied");
          if (label) label.textContent = "Copiado";
          toast("E-mail copiado para a área de transferência");
        } catch {
          toast("Não foi possível copiar — use o link de e-mail");
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
          button.classList.remove("is-copied");
          if (label) label.textContent = original;
        }, 2200);
      });
    });
  };

  /* ---------- Ano atual no rodapé ---------- */
  const initYear = () => {
    const el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  };

  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initMenu();
    initActiveSection();
    initReveal();
    initSpotlight();
    initCopy();
    initYear();
  });
})();
