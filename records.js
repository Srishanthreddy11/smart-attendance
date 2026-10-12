
"use strict";

const tbody = document.getElementById("recordsTableBody");
const recordsMessage = document.getElementById("recordsMessage");

function loadAttendanceRecords() {
  try {
    const raw = localStorage.getItem("anuragAttendanceRecords");
    const records = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(records)) {
      throw new Error("Invalid records format.");
    }

    tbody.replaceChildren();

    if (records.length === 0) {
      recordsMessage.textContent = "No attendance records found.";
      return;
    }

    recordsMessage.textContent =
      "Total attendance records: " + records.length;

    records.slice().reverse().forEach(record => {
      const row = document.createElement("tr");

      [
        record.studentId,
        record.studentName,
        record.subject,
        record.date,
        record.time,
        record.status
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.style.padding = "12px";
        cell.style.borderBottom = "1px solid #e2e8f0";
        cell.textContent = value ?? "";
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });
  } catch (error) {
    recordsMessage.textContent =
      "Unable to load attendance records from browser storage.";
  }
}

loadAttendanceRecords();
