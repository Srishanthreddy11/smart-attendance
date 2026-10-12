
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".navbar nav a, .sidebar .side-link").forEach(function (link) {
        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
            link.classList.add("active");
            link.classList.add("selected");
        }
    });

    const totalElement = document.getElementById("totalClasses");
    const presentElement = document.getElementById("presentCount");
    const absentElement = document.getElementById("absentCount");
    const percentElement = document.getElementById("attendancePercent");
    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");
    const progressPresent = document.getElementById("progressPresent");
    const progressTotal = document.getElementById("progressTotal");

    if (!totalElement || !presentElement || !absentElement) {
        return;
    }

    const total = Number(totalElement.textContent);
    const present = Number(presentElement.textContent);
    const absent = Math.max(0, total - present);
    const percentage = total > 0 ? (present / total) * 100 : 0;
    const formatted = percentage.toFixed(1) + "%";

    absentElement.textContent = absent;

    if (percentElement) percentElement.textContent = formatted;
    if (progressText) progressText.textContent = formatted;
    if (progressBar) progressBar.style.width = formatted;
    if (progressPresent) progressPresent.textContent = present;
    if (progressTotal) progressTotal.textContent = total;
});
