(() => {
  "use strict";
  const WA_NUMBER = "2348126309492";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const form = $("#bookingForm");

  // Navigation and header treatment
  const header = $("#siteHeader");
  const menuToggle = $("#menuToggle");
  const navigation = $("#navigation");
  const syncHeader = () => header?.classList.toggle("scrolled", window.scrollY > 35);
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
  menuToggle?.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(open));
    navigation?.classList.toggle("open", open);
  });
  $$(".navigation a").forEach(link => link.addEventListener("click", () => {
    navigation?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }));

  // Keep the supplied macro footage playing when the browser permits it.
  const heroVideo = $("#heroVideo");
  if (heroVideo) {
    heroVideo.muted = true;
    const tryPlay = () => heroVideo.play().catch(() => {});
    tryPlay();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });
  }

  // Appointment request: user reviews and sends the pre-filled WhatsApp message.
  if (form) {
    const steps = $$(".form-step", form);
    const counter = $("#stepCounter");
    const error = $("#formError");
    const appointmentType = $("#appointmentType");
    const homeFields = $(".home-fields");
    const dateInput = form.elements.date;
    let currentStep = 1;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const localISO = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, "0"),
      String(tomorrow.getDate()).padStart(2, "0")
    ].join("-");
    dateInput.min = localISO;

    function showStep(step) {
      currentStep = step;
      steps.forEach((panel, index) => panel.classList.toggle("active", index === step - 1));
      if (counter) counter.innerHTML = String(step).padStart(2, "0") + " <i>/</i> 02";
      if (error) error.textContent = "";
    }

    function requireValues(fields) {
      for (const fieldName of fields) {
        const input = form.elements[fieldName];
        if (!input || !String(input.value || "").trim()) {
          if (error) error.textContent = "Please complete " + fieldName.replace(/([A-Z])/g, " $1").toLowerCase() + ".";
          input?.focus();
          return false;
        }
      }
      return true;
    }

    $(".next-step", form)?.addEventListener("click", () => {
      if (!requireValues(["name", "phone", "service", "type"])) return;
      const phone = form.elements.phone.value.replace(/[\s().-]/g, "");
      if (!/^\+?[1-9][0-9]{7,14}$/.test(phone)) {
        error.textContent = "Enter a valid phone number, including the country code.";
        form.elements.phone.focus();
        return;
      }
      showStep(2);
    });

    $(".prev-step", form)?.addEventListener("click", () => showStep(1));

    appointmentType?.addEventListener("change", () => {
      const home = appointmentType.value === "Home service";
      homeFields.hidden = !home;
      ["address", "area"].forEach(name => { form.elements[name].required = home; });
    });

    // Service cards fill the booking form without submitting it.
    $$("[data-service]").forEach(link => link.addEventListener("click", () => {
      const select = form.elements.service;
      const wanted = link.dataset.service.toLowerCase();
      const option = [...select.options].find(item => item.value.toLowerCase() === wanted || item.text.toLowerCase() === wanted);
      if (option) select.value = option.value;
    }));

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (error) error.textContent = "";
      if (currentStep !== 2) { showStep(1); return; }
      if (!requireValues(["date", "time"])) return;

      const dateValue = dateInput.value;
      const chosenDate = new Date(dateValue + "T12:00:00");
      const earliestDate = new Date();
      earliestDate.setHours(0, 0, 0, 0);
      if (Number.isNaN(chosenDate.getTime()) || chosenDate < earliestDate) {
        error.textContent = "Please choose a valid future date.";
        dateInput.focus();
        return;
      }
      const home = appointmentType.value === "Home service";
      if (home && !requireValues(["address", "area"])) return;

      const value = name => String(form.elements[name]?.value || "").trim();
      const prettyDate = new Intl.DateTimeFormat("en-NG", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }).format(chosenDate);

      const lines = [
        "Hello Craig's Nails Studio, I would like to request an appointment.",
        "",
        "CUSTOMER DETAILS",
        "Name: " + value("name"),
        "Phone: " + value("phone"),
        "",
        "APPOINTMENT DETAILS",
        "Service: " + value("service"),
        "Appointment type: " + value("type"),
        "Preferred date: " + prettyDate,
        "Preferred time: " + value("time")
      ];
      if (home) {
        lines.push("", "HOME SERVICE LOCATION", "Address: " + value("address"), "Area: " + value("area"));
        if (value("directions")) lines.push("Directions: " + value("directions"));
      }
      if (value("notes")) lines.push("", "DESIGN / SPECIAL REQUESTS", value("notes"));
      lines.push("", "Please confirm availability, service duration and pricing. I understand this is a request only and is not confirmed until the studio replies.", "Thank you.");

      const url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        error.textContent = "Your browser blocked WhatsApp. Open the direct booking link below or allow pop-ups.";
        const fallback = document.createElement("a");
        fallback.href = url;
        fallback.target = "_blank";
        fallback.rel = "noopener noreferrer";
        fallback.className = "underlined-link";
        fallback.textContent = "Open WhatsApp booking message ↗";
        error.append(" ", fallback);
        return;
      }
      // The page only reports that WhatsApp was opened, never that the appointment is confirmed.
      const note = $(".request-note span", form);
      if (note) note.textContent = "Your request is open in WhatsApp. Please press Send there. The studio will confirm availability and pricing in its reply.";
    });
  }

  // Gallery lightbox with keyboard and touch-friendly controls.
  const galleryButtons = $$(".gallery-item");
  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxCount = $("#lightboxCount");
  let galleryIndex = 0;
  function openGallery(index) {
    if (!galleryButtons.length || !lightbox) return;
    galleryIndex = (index + galleryButtons.length) % galleryButtons.length;
    const item = galleryButtons[galleryIndex];
    lightboxImage.src = item.dataset.full;
    lightboxImage.alt = $("img", item)?.alt || "Craig's Nails Studio nail design";
    lightboxCount.textContent = String(galleryIndex + 1).padStart(2, "0") + " / " + String(galleryButtons.length).padStart(2, "0");
    lightbox.hidden = false;
    document.body.classList.add("locked");
    $(".lightbox-close", lightbox)?.focus();
  }
  function closeGallery() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("locked");
  }
  galleryButtons.forEach((item, index) => item.addEventListener("click", () => openGallery(index)));
  $(".lightbox-close")?.addEventListener("click", closeGallery);
  $(".lightbox-prev")?.addEventListener("click", () => openGallery(galleryIndex - 1));
  $(".lightbox-next")?.addEventListener("click", () => openGallery(galleryIndex + 1));
  lightbox?.addEventListener("click", event => { if (event.target === lightbox) closeGallery(); });
  document.addEventListener("keydown", event => {
    if (!lightbox || lightbox.hidden) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowLeft") openGallery(galleryIndex - 1);
    if (event.key === "ArrowRight") openGallery(galleryIndex + 1);
  });

  // Year and no-motion-friendly reveals.
  $("#year").textContent = new Date().getFullYear();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    $$(".intro-top, .intro-grid, .intro-rule, .section-heading, .service-card, .service-footnote, .gallery-heading, .gallery-item, .story-copy, .booking-intro, .booking-form, .contact-section").forEach(el => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  }

  window.addEventListener("load", () => {
    $(".preloader")?.classList.add("done");
    if (!reducedMotion && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(".hero-eyebrow", { y: 16, opacity: 0, duration: .8, delay: .12, ease: "power3.out" });
      gsap.from(".hero h1", { y: 34, opacity: 0, duration: 1.1, delay: .22, ease: "power3.out" });
      gsap.from(".hero-copy, .hero-actions", { y: 18, opacity: 0, duration: .9, delay: .48, stagger: .13, ease: "power3.out" });
    }
  });
  window.setTimeout(() => $(".preloader")?.classList.add("done"), 1800);
})();