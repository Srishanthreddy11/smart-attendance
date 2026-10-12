
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const studentSelect = $("studentSelect");
  const attendanceDate = $("attendanceDate");
  const attendanceForm = $("attendanceForm");

  const STUDENTS_KEY = "anuragStudents";
  const RECORDS_KEY = "anuragAttendanceRecords";

  let stream = null;
  let capturedPhoto = "";

  function readArray(key) {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  }

  function writeMessage(text, type = "") {
    $("attendanceMessage").textContent = text;
    $("attendanceMessage").className = "message " + type;
  }

  function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function loadStudents() {
    const students = readArray(STUDENTS_KEY);
    studentSelect.innerHTML = '<option value="">Select a student</option>';

    students.forEach(student => {
      const option = document.createElement("option");
      option.value = student.studentId;
      option.textContent = `${student.studentId} — ${student.fullName}`;
      studentSelect.appendChild(option);
    });

    if (students.length === 0) {
      studentSelect.innerHTML =
        '<option value="">No students registered yet</option>';
      $("studentDetails").textContent =
        "Register a student before marking attendance.";
    }
  }

  function showStudentDetails() {
    const student = readArray(STUDENTS_KEY).find(s =>
      s.studentId === studentSelect.value
    );

    $("studentDetails").textContent = student
      ? `${student.fullName} · ${student.department} · ${student.course}`
      : "Select a student to view their details.";
  }

  function renderTodayAttendance() {
    const records = readArray(RECORDS_KEY).filter(record =>
      record.date === attendanceDate.value
    );

    const tbody = $("todayAttendanceBody");
    tbody.replaceChildren();

    if (!records.length) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 5;
      cell.className = "empty-state";
      cell.textContent = "No attendance records for this date.";
      return;
    }

    records.slice().reverse().forEach(record => {
      const row = tbody.insertRow();

      [
        record.studentId,
        record.fullName,
        record.department,
        record.time,
        "Present"
      ].forEach((value, index) => {
        const cell = row.insertCell();

        if (index === 4) {
          const badge = document.createElement("span");
          badge.className = "status-pill";
          badge.textContent = value;
          cell.appendChild(badge);
        } else {
          cell.textContent = value || "—";
        }
      });
    });
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      $("photoStatus").textContent = "Camera unavailable. Use HTTPS or localhost.";
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });

      $("cameraVideo").srcObject = stream;
      await $("cameraVideo").play();

      $("cameraVideo").classList.add("visible");
      $("photoPreview").classList.remove("visible");
      $("cameraPlaceholder").hidden = true;

      $("photoStatus").textContent = "Camera ready.";
      updateCameraButtons();
    } catch (error) {
      stopCamera();
      $("photoStatus").textContent =
        "Camera could not start. Check camera permission.";
    }
  }

  function capturePhoto() {
    const video = $("cameraVideo");
    const canvas = $("photoCanvas");

    if (!stream || !video.videoWidth) {
      $("photoStatus").textContent = "Start the camera first.";
      return;
    }

    const scale = Math.min(1, 800 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    canvas.getContext("2d").drawImage(
      video, 0, 0, canvas.width, canvas.height
    );

    capturedPhoto = canvas.toDataURL("image/jpeg", 0.6);
    $("photoPreview").src = capturedPhoto;
    $("photoPreview").classList.add("visible");
    $("photoStatus").textContent = "Photo captured. It will be attached to the attendance record.";
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    $("cameraVideo").srcObject = null;
    $("cameraVideo").classList.remove("visible");

    if (capturedPhoto) {
      $("photoPreview").classList.add("visible");
      $("cameraPlaceholder").hidden = true;
    } else {
      $("photoPreview").classList.remove("visible");
      $("cameraPlaceholder").hidden = false;
    }

    updateCameraButtons();
  }

  function updateCameraButtons() {
    $("startCameraButton").disabled = Boolean(stream);
    $("captureButton").disabled = !stream;
    $("stopCameraButton").disabled = !stream;
  }

  studentSelect.addEventListener("change", showStudentDetails);
  attendanceDate.addEventListener("change", renderTodayAttendance);

  $("menuToggle").addEventListener("click", () => {
    $("mainNav").classList.toggle("open");
  });

  $("startCameraButton").addEventListener("click", startCamera);
  $("captureButton").addEventListener("click", capturePhoto);
  $("stopCameraButton").addEventListener("click", stopCamera);

  attendanceForm.addEventListener("submit", event => {
    event.preventDefault();
    writeMessage("");

    const studentId = studentSelect.value;
    const date = attendanceDate.value;

    if (!studentId) {
      writeMessage("Please select a registered student.", "error");
      return;
    }

    if (!date) {
      writeMessage("Please select an attendance date.", "error");
      return;
    }

    const students = readArray(STUDENTS_KEY);
    const student = students.find(s => s.studentId === studentId);

    if (!student) {
      writeMessage("Student not found. Refresh and try again.", "error");
      loadStudents();
      return;
    }

    try {
      const records = readArray(RECORDS_KEY);

      const alreadyMarked = records.some(record =>
        record.studentId === studentId && record.date === date
      );

      if (alreadyMarked) {
        writeMessage("Attendance is already recorded for this student on this date.", "error");
        return;
      }

      const record = {
        studentId: student.studentId,
        fullName: student.fullName,
        department: student.department,
        course: student.course,
        date,
        time: new Date().toLocaleTimeString(),
        status: "Present",
        photo: capturedPhoto
      };

      records.push(record);
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));

      capturedPhoto = "";
      $("photoPreview").removeAttribute("src");
      $("photoPreview").classList.remove("visible");
      stopCamera();

      $("photoStatus").textContent = "Photo is optional.";
      writeMessage("Attendance marked successfully for " + student.fullName + ".", "success");
      renderTodayAttendance();
    } catch (error) {
      writeMessage("Could not save attendance. Browser storage may be full.", "error");
    }
  });

  attendanceDate.value = todayString();
  $("menuToggle").addEventListener("click", () => {
    $("menuToggle").setAttribute(
      "aria-expanded",
      String($("mainNav").classList.contains("open"))
    );
  });

  loadStudents();
  showStudentDetails();
  renderTodayAttendance();
  updateCameraButtons();

  window.addEventListener("pagehide", stopCamera);
});
