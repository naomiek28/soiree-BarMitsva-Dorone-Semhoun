document.addEventListener("DOMContentLoaded", function () {
  window.__doroneBooted = true;

  const body = document.body;
  const openButton = document.getElementById("openInvitation");
  const music = document.getElementById("backgroundMusic");
  const musicButton = document.getElementById("musicToggle");
  let musicHasStarted = false;
  const form = document.getElementById("rsvpForm");
  const googleScriptUrl = "https://script.google.com/macros/s/AKfycbwD_z-36nKFTdlXVTAczIheRID0xgtHmOb1j9_8REmtL8c22D7fPjLtwmfnVPgWmvb9/exec";
  const attendanceEvents = Array.from(document.querySelectorAll(".attendance-event"));
  const notAttending = document.getElementById("notAttending");

  prepareHebrewName();
  prepareElegantDelays();

  window.setTimeout(function () {
    body.classList.remove("is-loading");
    body.classList.add("loaded", "welcome-visible");
  }, 3400);

  if (openButton) {
    openButton.addEventListener("click", function () {
      body.classList.remove("welcome-visible");
      body.classList.add("invitation-open", "motion-ready");

      window.scrollTo(0, 0);

      startMusic();

      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(revealSections);
      });
    });
  }

  if (musicButton && music) {
    musicButton.addEventListener("click", function () {
      if (music.paused) {
        startMusic();
      } else {
        music.pause();
        updateMusicButton(false);
      }
    });

    music.addEventListener("play", function () {
      updateMusicButton(true);
    });

    music.addEventListener("pause", function () {
      updateMusicButton(false);
    });
  }

  attendanceEvents.forEach(function (eventBlock) {
    const checkbox = eventBlock.querySelector('.event-choice input[type="checkbox"]');
    const counts = eventBlock.querySelector(".guest-counts");
    const numberInputs = Array.from(eventBlock.querySelectorAll('input[type="number"]'));

    checkbox.addEventListener("change", function () {
      counts.hidden = !checkbox.checked;
      numberInputs.forEach(function (input) {
        input.disabled = !checkbox.checked;
      });

      if (checkbox.checked && notAttending) {
        notAttending.checked = false;
      }
    });
  });

  if (notAttending) {
    notAttending.addEventListener("change", function () {
      if (!notAttending.checked) return;

      attendanceEvents.forEach(function (eventBlock) {
        const checkbox = eventBlock.querySelector('.event-choice input[type="checkbox"]');
        const counts = eventBlock.querySelector(".guest-counts");
        const numberInputs = Array.from(eventBlock.querySelectorAll('input[type="number"]'));
        checkbox.checked = false;
        counts.hidden = true;
        numberInputs.forEach(function (input, index) {
          input.disabled = true;
          input.value = index === 0 ? "1" : "0";
        });
      });
    });
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const status = document.getElementById("rsvpStatus");
      const submitButton = form.querySelector(".submit-rsvp");
      const formData = new FormData(form);
      const hasAttendance = attendanceEvents.some(function (eventBlock) {
        const checkbox = eventBlock.querySelector('.event-choice input[type="checkbox"]');
        return checkbox.checked;
      });

      if (!hasAttendance && !(notAttending && notAttending.checked)) {
        status.textContent = "Cochez au moins un événement ou indiquez que vous ne pourrez pas être présents.";
        status.className = "rsvp-status error";
        return;
      }

      const absenceComplete = Boolean(notAttending && notAttending.checked);
      const texteAbsence = "Ne pourront pas être présents";
      const data = {
        nom: String(formData.get("nom") || "").trim(),
        presenceTefilines: absenceComplete ? texteAbsence : formData.get("presenceTefilines") || "",
        adultesTefilines: !absenceComplete && formData.get("presenceTefilines") ? formData.get("adultesTefilines") || "0" : "",
        enfantsTefilines: !absenceComplete && formData.get("presenceTefilines") ? formData.get("enfantsTefilines") || "0" : "",
        presenceChabbat: absenceComplete ? texteAbsence : formData.get("presenceChabbat") || "",
        adultesChabbat: !absenceComplete && formData.get("presenceChabbat") ? formData.get("adultesChabbat") || "0" : "",
        enfantsChabbat: !absenceComplete && formData.get("presenceChabbat") ? formData.get("enfantsChabbat") || "0" : "",
        presenceSoiree: absenceComplete ? texteAbsence : formData.get("presenceSoiree") || "",
        adultesSoiree: !absenceComplete && formData.get("presenceSoiree") ? formData.get("adultesSoiree") || "0" : "",
        enfantsSoiree: !absenceComplete && formData.get("presenceSoiree") ? formData.get("enfantsSoiree") || "0" : "",
        message: String(formData.get("message") || "").trim()
      };

      status.textContent = "Envoi de votre réponse…";
      status.className = "rsvp-status";
      submitButton.disabled = true;

      try {
        await fetch(googleScriptUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data)
        });

        localStorage.setItem("dorone-rsvp", JSON.stringify(data));
        status.textContent = "Merci, votre réponse a bien été envoyée.";
        status.className = "rsvp-status success";
        form.reset();

        attendanceEvents.forEach(function (eventBlock) {
          const counts = eventBlock.querySelector(".guest-counts");
          const numberInputs = Array.from(eventBlock.querySelectorAll('input[type="number"]'));
          counts.hidden = true;
          numberInputs.forEach(function (input, index) {
            input.disabled = true;
            input.value = index === 0 ? "1" : "0";
          });
        });
      } catch (error) {
        status.textContent = "L’envoi n’a pas fonctionné. Merci de réessayer.";
        status.className = "rsvp-status error";
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  function prepareHebrewName() {
    const hebrewName = document.querySelector(".hebrew-name");

    if (!hebrewName || hebrewName.dataset.prepared === "true") return;

    const text = hebrewName.textContent.trim();
    hebrewName.textContent = "";
    hebrewName.dataset.prepared = "true";

    Array.from(text).forEach(function (character, index) {
      const letter = document.createElement("span");
      letter.textContent = character === " " ? "\u00A0" : character;
      letter.style.setProperty(
        "--letter-delay",
        0.35 + index * 0.11 + "s"
      );
      hebrewName.appendChild(letter);
    });
  }

  function startMusic() {
    if (!music) return;

    if (!musicHasStarted) {
      try {
        music.currentTime = 55;
      } catch (error) {
        /* Le navigateur appliquera le départ dès que l'audio sera prêt. */
      }
      musicHasStarted = true;
    }

    const playPromise = music.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        updateMusicButton(false);
      });
    }
  }

  function updateMusicButton(isPlaying) {
    if (!musicButton) return;

    musicButton.classList.toggle("is-paused", !isPlaying);
    musicButton.setAttribute(
      "aria-label",
      isPlaying ? "Mettre la musique en pause" : "Relancer la musique"
    );
  }

  function prepareElegantDelays() {
    document
      .querySelectorAll(".paper, .event-card, .rsvp-card")
      .forEach(function (card) {
        Array.from(card.children).forEach(function (item, index) {
          if (item.classList.contains("hebrew-name")) return;
          item.style.setProperty(
            "--item-delay",
            0.08 + index * 0.09 + "s"
          );
        });
      });
  }

  function revealSections() {
    const items = Array.from(document.querySelectorAll(".reveal"));

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -35px 0px"
      }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });

    if (items.length) {
      items[0].classList.add("visible");
    }
  }
});
