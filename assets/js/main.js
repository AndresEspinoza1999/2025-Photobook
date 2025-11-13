const timeline = document.querySelector("#timeline");

const highlights = [
  {
    month: "January 2025",
    title: "Storyboard Sprint",
    summary:
      "Editorial team drafts the 2025 theme pillars and assigns photographers to each chapter.",
  },
  {
    month: "March 2025",
    title: "Studio Portrait Week",
    summary:
      "Lighting labs are transformed into portrait studios to capture seniors and faculty mentors.",
  },
  {
    month: "May 2025",
    title: "Field Documentary Trips",
    summary:
      "Outdoor shoots and interviews gather stories from partner organizations across the city.",
  },
  {
    month: "July 2025",
    title: "Color Grading Marathon",
    summary:
      "Volunteers refine tone and contrast to create a cohesive visual language for the book.",
  },
  {
    month: "September 2025",
    title: "Layout Finalization",
    summary:
      "Designers lock in page order, pull quotes, and captions before exporting the print-ready files.",
  },
  {
    month: "November 2025",
    title: "Launch & Gallery Night",
    summary:
      "Pre-orders ship, the digital photobook goes live, and we celebrate with a community gallery event.",
  },
];

if (timeline) {
  const fragment = document.createDocumentFragment();

  highlights.forEach(({ month, title, summary }) => {
    const item = document.createElement("li");
    item.className = "timeline-item";

    const time = document.createElement("time");
    time.textContent = month;
    time.setAttribute("datetime", month.replace(" ", "-"));

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = summary;

    item.append(time, heading, paragraph);
    fragment.appendChild(item);
  });

  timeline.appendChild(fragment);
}
