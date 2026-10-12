
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const STUDENTS_KEY = "anuragStudents";
  const RECORDS_KEY = "anuragAttendanceRecords";

  const $ = id => document.getElementById(id);

  function readArray(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value + "T00:00:00");

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
  }

  function makeCell(row, value) {
    const cell = row.insertCell();
    cell.textContent = value || "—";
    return cell;
  }

  function emptyRow(tbody, columnCount, text) {
    tbody.replaceChildren();

    const row = tbody.insertRow();
    const cell = row.insertCell();

    cell.colSpan = columnCount;
    cell.className = "empty-state";
    cell.textContent = text;
  }

  function renderStudents(students) {
    const tbody = $("studentsTableBody");
    tbody.replaceChildren();

    if (!students.length) {
      emptyRow(tbody, 5, "No students registered yet.");
      return;
    }

    students.slice().reverse().forEach(student => {
      const row = tbody.insertRow();

      makeCell(row, student.studentId);
      makeCell(row, student.fullName);
      makeCell(row, student.department);
      makeCell(row, student.course);
      makeCell(
        row,
        student.registeredAt
          ? formatDate(student.registeredAt.slice(0, 10))
          : "—"
      );
    });
  }

  function renderAttendance(records) {
    const tbody = $("recentAttendanceBody");
    tbody.replaceChildren();

    if (!records.length) {
      emptyRow(tbody, 5, "No attendance records yet.");
      return;
    }

    records.slice().reverse().slice(0, 10).forEach(record => {
      const row = tbody.insertRow();

      makeCell(row, record.studentId);
      makeCell(row, record.fullName);
      makeCell(row, formatDate(record.date));
      makeCell(row, record.time);

      const cell = row.insertCell();
      const badge = document.createElement("span");
      badge.className = "status-pill";
      badge.textContent = record.status || "Present";
      cell.appendChild(badge);
    });
  }

  function renderDashboard() {
    const students = readArray(STUDENTS_KEY);
    const records = readArray(RECORDS_KEY);
    const today = todayString();

    const todayRecords = records.filter(record => record.date === today);

    // Count each student only once in today's total.
    const presentStudentIds = new Set(
      todayRecords.map(record => record.studentId)
    );

    const percentage = students.length
      ? Math.round((presentStudentIds.size / students.length) * 100)
      : 0;

    $("totalStudents").textContent = students.length;
    $("presentToday").textContent = presentStudentIds.size;
    $("attendancePercentage").textContent = percentage + "%";
    $("totalRecords").textContent = records.length;

    $("dashboardDate").textContent =
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

    renderStudents(students);
    renderAttendance(records);
  }

  $("menuToggle").addEventListener("click", () => {
    $("mainNav").classList.toggle("open");
  });

  renderDashboard();
});
