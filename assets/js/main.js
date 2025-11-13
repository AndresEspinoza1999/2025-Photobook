document.addEventListener("DOMContentLoaded", () => {
  const book = document.getElementById("book");
  if (!book) {
    return;
  }

  const pages = Array.from(book.querySelectorAll(".page"));
  const prevButton = document.getElementById("prevPage");
  const nextButton = document.getElementById("nextPage");
  const pageStatus = document.getElementById("pageStatus");
  const progressLabels = pages.map((page, index) => {
    const summary = page.dataset.summary;
    return summary || `Spread ${index + 1}`;
  });

  let currentTurn = 0; // number of pages currently flipped

  const setZIndices = () => {
    pages.forEach((page, index) => {
      // Stack pages so the cover sits on top initially
      page.style.zIndex = pages.length - index;
    });
  };

  const updateIndicator = () => {
    let label;
    if (currentTurn === 0) {
      label = "Cover • Ready to open";
    } else if (currentTurn === pages.length) {
      label = "Back cover • End of preview";
    } else {
      label = progressLabels[currentTurn - 1];
    }

    if (pageStatus) {
      pageStatus.textContent = label;
    }

    if (prevButton) {
      prevButton.disabled = currentTurn === 0;
    }

    if (nextButton) {
      nextButton.disabled = currentTurn === pages.length;
    }
  };

  const goToNext = () => {
    if (currentTurn >= pages.length) {
      return;
    }
    pages[currentTurn].classList.add("flipped");
    pages[currentTurn].setAttribute("aria-hidden", "true");
    currentTurn += 1;
    updateIndicator();
  };

  const goToPrevious = () => {
    if (currentTurn <= 0) {
      return;
    }
    currentTurn -= 1;
    pages[currentTurn].classList.remove("flipped");
    pages[currentTurn].setAttribute("aria-hidden", "false");
    updateIndicator();
  };

  setZIndices();
  pages.forEach((page) => page.setAttribute("aria-hidden", "false"));
  updateIndicator();

  if (prevButton) {
    prevButton.addEventListener("click", goToPrevious);
  }

  if (nextButton) {
    nextButton.addEventListener("click", goToNext);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    }
  });
});
