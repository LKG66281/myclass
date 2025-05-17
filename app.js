// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKtxYXuB_2BswQQ7yHpe4ALHjg35sF1Dg",
  authDomain: "myclass-32abb.firebaseapp.com",
  projectId: "myclass-32abb",
  storageBucket: "myclass-32abb.firebasestorage.app",
  messagingSenderId: "117216760305",
  appId: "1:117216760305:web:59a19d4a54ce4f4c9cb450",
  measurementId: "G-W9YHHWZVR8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize FirebaseUI
const ui = new firebaseui.auth.AuthUI(auth);
const uiConfig = {
  signInOptions: ["password"],
  signInSuccessUrl: window.location.href,
  signInFlow: "redirect"
};

// DOM Elements
const content = document.getElementById("content");
const loader = document.getElementById("loader");
const usernameSelect = document.getElementById("username-select");
const adminPanel = document.getElementById("admin-panel");
const publicView = document.getElementById("public-view");
const usernameDropdown = document.getElementById("username-dropdown");
const usernameInput = document.getElementById("username-input");
const subjectInput = document.getElementById("subject-input");
const addAdmissionBtn = document.getElementById("add-admission-btn");
const maxPeopleInput = document.getElementById("max-people-input");
const updateMaxPeopleBtn = document.getElementById("update-max-people-btn");
const peopleDropdown = document.getElementById("people-dropdown");
const logoutBtn = document.getElementById("logout-btn");
const pdfInput = document.getElementById("pdf-input");
const uploadPdfBtn = document.getElementById("upload-pdf-btn");
const pdfList = document.getElementById("pdf-list");

// Admin email
const ADMIN_EMAIL = "siddharth";

// Authentication state listener
onAuthStateChanged(auth, (user) => {
  loader.style.display = "none";
  content.style.display = "block";
  if (user) {
    if (user.email === ADMIN_EMAIL) {
      usernameSelect.style.display = "block";
      adminPanel.style.display = "none";
      publicView.style.display = "none";
      loadUsernameDropdown();
    } else {
      usernameSelect.style.display = "none";
      adminPanel.style.display = "none";
      publicView.style.display = "block";
      loadPeopleDropdown();
    }
  } else {
    usernameSelect.style.display = "none";
    adminPanel.style.display = "none";
    publicView.style.display = "none";
    ui.start("#firebaseui-auth-container", uiConfig);
  }
});

// Username dropdown change handler
usernameDropdown.addEventListener("change", () => {
  if (usernameDropdown.value) {
    usernameSelect.style.display = "none";
    adminPanel.style.display = "block";
    loadPeopleDropdown();
    loadPdfList();
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// Add Admission
addAdmissionBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const subject = subjectInput.value.trim();
  if (username && subject) {
    try {
      await addDoc(collection(db, "admissions"), {
        username,
        subject,
        timestamp: new Date()
      });
      alert("Admission added!");
      usernameInput.value = "";
      subjectInput.value = "";
      loadUsernameDropdown(); // Refresh username dropdown
    } catch (error) {
      alert("Error adding admission: " + error.message);
    }
  } else {
    alert("Please enter both username and subject.");
  }
});

// Update Total People Dropdown
updateMaxPeopleBtn.addEventListener("click", async () => {
  const maxPeople = parseInt(maxPeopleInput.value);
  if (maxPeople > 0 && maxPeople <= 100) {
    try {
      await setDoc(doc(db, "settings", "maxPeople"), {
        maxPeople,
        updated: new Date()
      });
      alert("Dropdown updated!");
      maxPeopleInput.value = "";
      loadPeopleDropdown();
    } catch (error) {
      alert("Error updating dropdown: " + error.message);
    }
  } else {
    alert("Please enter a number between 1 and 100.");
  }
});

// Load Username Dropdown
function loadUsernameDropdown() {
  onSnapshot(collection(db, "admissions"), (snapshot) => {
    usernameDropdown.innerHTML = '<option value="">Select a username</option>';
    const usernames = new Set();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!usernames.has(data.username)) {
        usernames.add(data.username);
        const option = document.createElement("option");
        option.value = data.username;
        option.text = data.username;
        usernameDropdown.appendChild(option);
      }
    });
  }, (error) => {
    console.error("Error loading usernames:", error);
    usernameDropdown.innerHTML = '<option value="">Error loading usernames</option>';
  });
}

// Load Total People Dropdown
async function loadPeopleDropdown() {
  try {
    const docRef = doc(db, "settings", "maxPeople");
    const docSnap = await getDoc(docRef);
    peopleDropdown.innerHTML = "";
    if (docSnap.exists()) {
      const maxPeople = docSnap.data().maxPeople;
      for (let i = 1; i <= maxPeople; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.text = i;
        peopleDropdown.appendChild(option);
      }
    } else {
      peopleDropdown.innerHTML = "<option>No options available</option>";
    }
  } catch (error) {
    console.error("Error loading dropdown:", error);
    peopleDropdown.innerHTML = "<option>Error loading options</option>";
  }
}

// Upload PDF
uploadPdfBtn.addEventListener("click", async () => {
  const file = pdfInput.files[0];
  if (file && file.type === "application/pdf") {
    try {
      const storageRef = ref(storage, `pdfs/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await addDoc(collection(db, "pdfs"), {
        name: file.name,
        url: downloadURL,
        timestamp: new Date()
      });
      alert("PDF uploaded!");
      pdfInput.value = "";
    } catch (error) {
      alert("Error uploading PDF: " + error.message);
    }
  } else {
    alert("Please select a valid PDF file.");
  }
});

// Load PDF List
function loadPdfList() {
  onSnapshot(collection(db, "pdfs"), (snapshot) => {
    pdfList.innerHTML = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = data.url;
      a.textContent = data.name;
      a.target = "_blank";
      li.appendChild(a);
      pdfList.appendChild(li);
    });
  }, (error) => {
    console.error("Error loading PDFs:", error);
    pdfList.innerHTML = "<li>Error loading PDFs</li>";
  });
}
