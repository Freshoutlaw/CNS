(() => {
  const WA = "2348126309492";
  const form = document.querySelector("#bookingForm");
  if (!form) return;
  const steps = [...document.querySelectorAll(".form-step")];
  const stepLabel = document.querySelector("#stepLabel");
  const error = document.querySelector("#formError");
  const typeSelect = document.querySelector("#appointmentType");
  const homeFields = document.querySelector(".home-fields");
  const dateInput = form.elements.date;
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  dateInput.min = [tomorrow.getFullYear(), String(tomorrow.getMonth()+1).padStart(2,"0"), String(tomorrow.getDate()).padStart(2,"0")].join("-");
  let step = 1;

  function showStep(next) {
    step = next;
    steps.forEach((el, i) => el.classList.toggle("active", i === next - 1));
    stepLabel.textContent = String(next).padStart(2,"0") + " / 02";
    error.textContent = "";
    form.scrollIntoView({behavior:"smooth", block:"center"});
  }
  function validateFields(names) {
    for (const name of names) {
      const field = form.elements[name];
      if (!field || !String(field.value || "").trim()) {
        error.textContent = "Please complete " + (field?.labels?.[0]?.textContent || name.toLowerCase()) + ".";
        field?.focus();
        return false;
      }
    }
    return true;
  }
  document.querySelector(".next-step").addEventListener("click", () => {
    if (!validateFields(["name","phone","service","type"])) return;
    const phone = form.elements.phone.value.replace(/[\s()-]/g,"");
    if (!/^\+?[0-9]{10,15}$/.test(phone)) {
      error.textContent = "Enter a valid phone number, including the country code.";
      form.elements.phone.focus();
      return;
    }
    showStep(2);
  });
  document.querySelector(".prev-step").addEventListener("click", () => showStep(1));
  typeSelect.addEventListener("change", () => {
    const isHome = typeSelect.value === "Home service";
    homeFields.hidden = !isHome;
    ["address","area"].forEach(n => form.elements[n].required = isHome);
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    error.textContent = "";
    if (!validateFields(["date","time"])) return;
    const chosen = new Date(dateInput.value + "T23:59:59");
    if (Number.isNaN(chosen.getTime()) || chosen < new Date(new Date().setHours(0,0,0,0))) {
      error.textContent = "Choose a valid future date.";
      dateInput.focus();
      return;
    }
    if (typeSelect.value === "Home service" && !validateFields(["address","area"])) return;
    const v = name => String(form.elements[name]?.value || "").trim();
    const details = [
      "Hello Craig's Nails Studio, I'd like to request an appointment.",
      "",
      "CUSTOMER DETAILS",
      "Name: " + v("name"),
      "Phone: " + v("phone"),
      "",
      "APPOINTMENT REQUEST",
      "Service: " + v("service"),
      "Appointment type: " + v("type"),
      "Preferred date: " + v("date"),
      "Preferred time: " + v("time"),
      ...(v("type") === "Home service" ? ["","HOME SERVICE LOCATION","Address: " + v("address"),"Area: " + v("area"),...(v("directions") ? ["Directions: " + v("directions")] : [])] : []),
      ...(v("notes") ? ["","DESIGN / SPECIAL REQUESTS",v("notes")] : []),
      "",
      "Please confirm availability, duration and pricing. I understand this is a request and is not confirmed until the studio replies.",
      "Thank you."
    ];
    const url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(details.join("\n"));
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      error.textContent = "Your browser blocked the WhatsApp window. Please allow pop-ups or use the direct WhatsApp link below.";
      const fallback = document.createElement("a");
      fallback.href = url; fallback.target = "_blank"; fallback.rel = "noopener";
      fallback.textContent = "Open WhatsApp booking message";
      fallback.className = "text-link";
      error.append(" ", fallback);
      return;
    }
    document.querySelector("#requestSummary").textContent = "Your request message is ready in WhatsApp. Please press Send there; the studio will then confirm availability. Opening WhatsApp does not confirm your appointment.";
  });

  document.querySelectorAll("[data-service]").forEach(link => link.addEventListener("click", () => {
    const option = [...form.elements.service.options].find(o => o.text.toLowerCase() === link.dataset.service.toLowerCase());
    if (option) form.elements.service.value = option.value;
  }));
  document.querySelector("#year").textContent = new Date().getFullYear();
  document.querySelector(".menu-toggle").addEventListener("click", e => {
    const button = e.currentTarget, nav = document.querySelector(".nav");
    const open = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => {
    document.querySelector(".nav").classList.remove("open");
    document.querySelector(".menu-toggle").setAttribute("aria-expanded","false");
  }));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    }), {threshold:.12});
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
  } else document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
  window.addEventListener("load", () => {
    document.querySelector(".loader")?.classList.add("done");
    if (!reduce && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(".hero-copy > *", {y:24,opacity:0,duration:1,stagger:.12,ease:"power3.out",delay:.15});
      gsap.from(".art-image", {y:35,opacity:0,scale:.96,duration:1.2,ease:"power3.out",delay:.35});
    }
  });
})();