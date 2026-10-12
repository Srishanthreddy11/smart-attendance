
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const form = $("registrationForm");
  const video = $("cameraVideo");
  const canvas = $("photoCanvas");
  const preview = $("photoPreview");
  const placeholder = $("cameraPlaceholder");

  let stream = null;
  let capturedPhoto = "";

  const message = (text, type = "") => {
    const el = $("formMessage");
    el.textContent = text;
    el.className = "message " + type;
  };

  const photoMessage = text => {
    $("photoStatus").textContent = text;
  };

  const updateButtons = () => {
    $("startCameraButton").disabled = Boolean(stream);
    $("captureButton").disabled = !stream;
    $("stopCameraButton").disabled = !stream;
  };

  const readStudents = () => {
    const data = JSON.parse(localStorage.getItem("anuragStudents") || "[]");
    return Array.isArray(data) ? data : [];
  };

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      photoMessage("Camera unavailable. Use HTTPS or localhost.");
      return;
    }

    try {
      $("startCameraButton").disabled = true;
      photoMessage("Requesting camera permission...");

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });

      video.srcObject = stream;
      await video.play();
      video.classList.add("visible");
      preview.classList.remove("visible");
      placeholder.hidden = true;

      photoMessage("Camera ready. Capture your photo.");
    } catch (error) {
      stopCamera();
      photoMessage("Camera could not start. Check browser permission and camera connection.");
    } finally {
      updateButtons();
    }
  }

  function capturePhoto() {
    if (!stream || !video.videoWidth) {
      photoMessage("Wait until the camera preview appears.");
      return;
    }

    const maxWidth = 800;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedPhoto = canvas.toDataURL("image/jpeg", 0.65);
    preview.src = capturedPhoto;
    preview.classList.add("visible");
    photoMessage("Photo captured successfully.");
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    video.srcObject = null;
    video.classList.remove("visible");

    if (capturedPhoto) {
      preview.classList.add("visible");
      placeholder.hidden = true;
    } else {
      preview.classList.remove("visible");
      placeholder.hidden = false;
    }

    updateButtons();
  }

  $("startCameraButton").addEventListener("click", startCamera);
  $("captureButton").addEventListener("click", capturePhoto);
  $("stopCameraButton").addEventListener("click", stopCamera);

  $("menuToggle").addEventListener("click", () => {
    $("mainNav").classList.toggle("open");
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    message("");

    const student = {
      studentId: $("studentId").value.trim(),
      fullName: $("fullName").value.trim(),
      email: $("email").value.trim(),
      department: $("department").value,
      course: $("course").value.trim(),
      photo: capturedPhoto,
      registeredAt: new Date().toISOString()
    };

    if (!student.studentId || !student.fullName ||
        !student.department || !student.course) {
      message("Please complete all required fields.", "error");
      return;
    }

    if (student.email && !$("email").checkValidity()) {
      message("Enter a valid email address.", "error");
      return;
    }

    try {
      const students = readStudents();

      if (students.some(s =>
        String(s.studentId).toLowerCase() === student.studentId.toLowerCase()
      )) {
        message("That Student ID is already registered.", "error");
        return;
      }

      students.push(student);
      localStorage.setItem("anuragStudents", JSON.stringify(students));

      form.reset();
      capturedPhoto = "";
      preview.removeAttribute("src");
      preview.classList.remove("visible");
      stopCamera();

      photoMessage("No photo captured yet.");
      message("Student registered successfully!", "success");
    } catch (error) {
      message("Could not save. Browser storage may be full, especially if photos are large.", "error");
    }
  });

  window.addEventListener("pagehide", stopCamera);
  updateButtons();
});
