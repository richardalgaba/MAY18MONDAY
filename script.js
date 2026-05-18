document.addEventListener("DOMContentLoaded", () => {
  // --- Login & Registration Logic ---

  // Login
  const loginForm = document.querySelector("#login-form form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("login-email").value;
      const passwordInput = document.getElementById("login-password").value;
      const errorMsg = document.getElementById("login-error");

      // Check users
      const users = JSON.parse(localStorage.getItem("users")) || {};
      let matchedUserKey = null;
      const lowerInput = emailInput.trim().toLowerCase();

      for (const email in users) {
        const u = users[email];
        const uPrefix = email.split("@")[0].toLowerCase();
        
        if (email.toLowerCase() === lowerInput) {
          matchedUserKey = email;
          break;
        }
        if (uPrefix === lowerInput) {
          matchedUserKey = email;
          break;
        }
        if (u.name && u.name.toLowerCase() === lowerInput) {
          matchedUserKey = email;
          break;
        }
        if (u.publicId && String(u.publicId) === lowerInput.replace("#", "")) {
          matchedUserKey = email;
          break;
        }
      }

      if (matchedUserKey && users[matchedUserKey].password === passwordInput) {
        // Success
        const uName = users[matchedUserKey].name;
        localStorage.setItem("currentUser", uName);
        localStorage.setItem(`last_login_${uName}`, new Date().toISOString());

        // Sync or generate public ID in users database and localStorage
        let pId = users[matchedUserKey].publicId;
        if (!pId) {
          pId = String(Math.floor(1000 + Math.random() * 9000));
          users[matchedUserKey].publicId = pId;
          localStorage.setItem("users", JSON.stringify(users));
        }
        localStorage.setItem("userPublicId", pId);

        // Save to Session Logs list
        const sessionLogs = JSON.parse(localStorage.getItem(`session_history_${uName}`)) || [];
        sessionLogs.unshift({ type: "Login", time: new Date().toISOString() });
        localStorage.setItem(`session_history_${uName}`, JSON.stringify(sessionLogs.slice(0, 50)));

        localStorage.setItem("isAdminSession", "false"); // Normal users are never admin here
        window.location.href = "dashboard.html";
      } else {
        // Show error
        if (errorMsg) {
          errorMsg.classList.remove("hidden");
        }
      }
    });
  }

  // Register User
  const registerForm = document.querySelector("#register-form form");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;
      const confirmPassword = document.getElementById(
        "reg-confirm-password",
      ).value;
      const successMsg = document.getElementById("reg-success");
      const errorMsg = document.getElementById("reg-error");

      if (successMsg) successMsg.classList.add("hidden");
      if (errorMsg) errorMsg.classList.add("hidden");

      if (password !== confirmPassword) {
        if (errorMsg) {
          errorMsg.textContent = "Passwords do not match!";
          errorMsg.classList.remove("hidden");
        }
        return;
      }

      // Save user
      const users = JSON.parse(localStorage.getItem("users")) || {};
      if (users[email]) {
        if (errorMsg) {
          errorMsg.textContent = "Email already registered!";
          errorMsg.classList.remove("hidden");
        }
        return;
      }

      const username = email.split("@")[0];
      const formattedName =
        username.charAt(0).toUpperCase() + username.slice(1);

      const ageInput = document.getElementById("reg-age");
      const dobInput = document.getElementById("reg-dob");
      const gcashInput = document.getElementById("reg-gcash");
      const pId = String(Math.floor(1000 + Math.random() * 9000));

      users[email] = {
        name: formattedName,
        password: password,
        age: ageInput ? ageInput.value : "N/A",
        dob: dobInput ? dobInput.value : "N/A",
        gcash: gcashInput ? gcashInput.value : "N/A",
        isAdmin: false,
        publicId: pId
      };
      localStorage.setItem("users", JSON.stringify(users));

      // Success
      if (successMsg) {
        successMsg.textContent = "Registration Successful! Please login.";
        successMsg.classList.remove("hidden");
      }
      registerForm.reset();

      setTimeout(() => {
        const loginSwitchBtn = document.querySelector(
          '.switch-btn[data-target="login-form"]',
        );
        if (loginSwitchBtn) loginSwitchBtn.click();
      }, 2500);
    });
  }

  // Admin Login
  const adminLoginForm = document.querySelector("#admin-login-form form");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const userInput = document.getElementById("admin-login-user").value;
      const passwordInput = document.getElementById(
        "admin-login-password",
      ).value;
      const errorMsg = document.getElementById("admin-login-error");

      const savedAdminPwd = localStorage.getItem("admin_password") || "algaba";
      if (userInput === "richard" && passwordInput === savedAdminPwd) {
        localStorage.setItem("currentUser", "Admin Richard");
        localStorage.setItem("last_login_Admin Richard", new Date().toISOString());

        // Save to Session Logs list
        const sessionLogs = JSON.parse(localStorage.getItem("session_history_Admin Richard")) || [];
        sessionLogs.unshift({ type: "Login", time: new Date().toISOString() });
        localStorage.setItem("session_history_Admin Richard", JSON.stringify(sessionLogs.slice(0, 50)));

        localStorage.setItem("isAdminSession", "true");
        window.location.href = "dashboard.html";
      } else {
        if (errorMsg) errorMsg.classList.remove("hidden");
      }
    });
  }

  // Form Switcher (Login/Register/Forgot)
  const switchBtns = document.querySelectorAll(".switch-btn");
  switchBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute("data-target");
      document
        .querySelectorAll(".form-container")
        .forEach((form) => form.classList.add("hidden"));
      document.getElementById(targetId).classList.remove("hidden");

      // Change background video based on the form
      const bgVideoSource = document.querySelector('#bg-video source');
      const bgVideo = document.getElementById('bg-video');
      if (bgVideoSource && bgVideo && window.location.pathname.includes('login.html')) {
          const newSrc = targetId === 'admin-login-form' ? 'ai.4.mp4' : 'ai.mp4';
          if (!bgVideoSource.src.endsWith(newSrc)) {
              bgVideoSource.src = newSrc;
              bgVideo.load();
          }
      }
    });
  });

  // --- Dashboard & Inventory Logic ---
  const welcomeMessage = document.getElementById("welcome-message");
  const isAdminSession = localStorage.getItem("isAdminSession") === "true";

  if (welcomeMessage) {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      window.location.href = "login.html"; // Protect dashboard
    } else {
      welcomeMessage.textContent = `Welcome, ${currentUser}!`;
      // Assign a public Seller ID if the user doesn't have one yet
      if (!isAdminSession && !localStorage.getItem("userPublicId")) {
        localStorage.setItem(
          "userPublicId",
          String(Math.floor(1000 + Math.random() * 9000)),
        );
      }
      if (isAdminSession) {
        document.getElementById("admin-nav-item")?.classList.remove("hidden");
        document.getElementById("admin-users-nav")?.classList.remove("hidden");
        document.getElementById("market-nav-item")?.classList.remove("hidden");
        
        // Hide sidebar wallet card for admin session
        const sidebarWalletCard = document.getElementById("sidebar-wallet");
        if (sidebarWalletCard) {
            sidebarWalletCard.style.display = "none";
        }

        // Hide dashboard nav item
        const dashboardNavItem = document.querySelector('a[data-view="dashboard-view"]');
        if (dashboardNavItem && dashboardNavItem.parentElement) {
            dashboardNavItem.parentElement.style.display = 'none';
        }

        // Hide PC Parts nav item for admin session
        const pcPartsNavItem = document.querySelector('a[data-view="inventory-view"]');
        if (pcPartsNavItem && pcPartsNavItem.parentElement) {
            pcPartsNavItem.parentElement.style.display = 'none';
        }

        // Hide My Inventory nav item for admin session
        const userInventoryNavItem = document.querySelector('a[data-view="user-inventory-view"]');
        if (userInventoryNavItem && userInventoryNavItem.parentElement) {
            userInventoryNavItem.parentElement.style.display = 'none';
        }

        // Change background video for admin
        const bgVideoSource = document.querySelector('#bg-video source');
        const bgVideo = document.getElementById('bg-video');
        if (bgVideoSource && bgVideo) {
            bgVideoSource.src = 'ai.4.mp4';
            bgVideo.load();
        }

        // Switch to Admin Logs View by default
        setTimeout(() => {
            const adminLogsNavBtn = document.querySelector('a[data-view="admin-logs-view"]');
            if (adminLogsNavBtn) adminLogsNavBtn.click();
        }, 50);

        // Admin has no need for the "Add Product" button — users submit requests
        const addProdBtn = document.getElementById("add-product-btn");
        if (addProdBtn) addProdBtn.style.display = "none";
        // Relabel the Clear button so its purpose is obvious
        const clearBtn = document.getElementById("clear-inventory-btn");
        if (clearBtn) clearBtn.textContent = "Clear Requests";
        // Relabel the inventory section header for admin context
        const invH1 = document.querySelector("#inventory-view header h1");
        if (invH1) {
          invH1.innerHTML = "📋 User Product Requests";
          invH1.style.fontSize = "1.4rem";
        }
        const invSub = document.querySelector("#inventory-view header p");
        if (invSub)
          invSub.textContent =
            "Review and approve products submitted by users.";
      } else {
        // Change background video for regular user session
        const bgVideoSource = document.querySelector('#bg-video source');
        const bgVideo = document.getElementById('bg-video');
        if (bgVideoSource && bgVideo) {
            bgVideoSource.src = 'ai.mp4';
            bgVideo.load();
        }
      }
    }
  }

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        localStorage.setItem(`last_logout_${currentUser}`, new Date().toISOString());

        // Save to Session Logs list
        const sessionLogs = JSON.parse(localStorage.getItem(`session_history_${currentUser}`)) || [];
        sessionLogs.unshift({ type: "Logout", time: new Date().toISOString() });
        localStorage.setItem(`session_history_${currentUser}`, JSON.stringify(sessionLogs.slice(0, 50)));
      }
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isAdminSession");
      window.location.href = "login.html";
    });
  }

  // View Switcher (Dashboard/Profile/Inventory)
  const navLinks = document.querySelectorAll(".nav-btn");
  const viewSections = document.querySelectorAll(".view-section");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-view");
      navLinks.forEach((n) => n.classList.remove("active"));
      link.classList.add("active");

      viewSections.forEach((section) => {
        section.classList.remove("active");
        section.classList.add("hidden");
      });
      document.getElementById(targetId).classList.remove("hidden");
      document.getElementById(targetId).classList.add("active");

      // if inventory view is opened, render inventory
      if (targetId === "dashboard-view") {
        if (typeof window.renderDashboard === "function") window.renderDashboard();
      }
      if (targetId === "inventory-view") {
        renderInventory();
      }
      if (targetId === "user-inventory-view") {
        if (typeof window.renderUserInventory === "function") window.renderUserInventory();
      }
      if (targetId === "market-view") {
        renderMarket();
      }
      if (targetId === "profile-view") {
        renderProfile();
      }
      if (targetId === "admin-users-view") {
        if (typeof window.renderAdminUsers === "function") window.renderAdminUsers();
      }
    });
  });

  // --- Audit Logging Function ---
  function logActivity(action, itemDetails) {
    let logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
    logs.push({
      date: new Date().toISOString(),
      user: localStorage.getItem("currentUser") || "Unknown",
      action: action,
      itemName: itemDetails.name || "N/A",
      supplier: itemDetails.supplier || "N/A",
      amountQty: itemDetails.amountQty || "N/A",
    });
    localStorage.setItem("activityLogs", JSON.stringify(logs));
    renderAdminLogs();
  }

  // --- Inventory System Data & Functions ---
  let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

  const randNames = ["Alex", "JohnDoe", "TechLover99", "GamingPC_God", "PCBuilder101", "Mike", "Sarah", "David", "Chris", "Jessica"];

  // Migration: Change 'Admin Richard' to random names
  let migratedAdmin = false;
  inventory.forEach(p => {
    if (p.id < 2000) p.isCatalog = true;
    if (p.owner === "Admin Richard" && p.id < 2000) {
      p.owner = randNames[p.id % randNames.length];
      migratedAdmin = true;
    }
  });
  if (migratedAdmin) {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }

  // ── Default Product Catalog ──────────────────────────────────────────────
  const DEFAULT_PRODUCTS = [
    // ── CORE COMPONENTS: CPU ──
    {
      name: "Intel Core i3-12100F",
      description:
        "Budget desktop CPU, 4 cores/8 threads, 3.3GHz base, LGA1700 socket",
      category: "CPU",
      costPrice: 90,
      price: 110,
      quantity: 25,
      supplier: "Intel Philippines",
    },
    {
      name: "Intel Core i5-13600K",
      description:
        "Mid-range desktop CPU, 14 cores (6P+8E), 3.5GHz base, LGA1700",
      category: "CPU",
      costPrice: 250,
      price: 290,
      quantity: 20,
      supplier: "Intel Philippines",
    },
    {
      name: "Intel Core i7-13700K",
      description:
        "High-end desktop CPU, 16 cores (8P+8E), 3.4GHz base, LGA1700",
      category: "CPU",
      costPrice: 370,
      price: 420,
      quantity: 15,
      supplier: "Intel Philippines",
    },
    {
      name: "Intel Core i9-13900K",
      description:
        "Flagship desktop CPU, 24 cores (8P+16E), 3.0GHz base, LGA1700",
      category: "CPU",
      costPrice: 520,
      price: 590,
      quantity: 10,
      supplier: "Intel Philippines",
    },
    {
      name: "AMD Ryzen 3 4100",
      description:
        "Budget desktop CPU, 4 cores/8 threads, 3.8GHz base, AM4 socket",
      category: "CPU",
      costPrice: 75,
      price: 95,
      quantity: 25,
      supplier: "AMD Philippines",
    },
    {
      name: "AMD Ryzen 5 5600X",
      description:
        "Mid-range desktop CPU, 6 cores/12 threads, 3.7GHz base, AM4 socket",
      category: "CPU",
      costPrice: 160,
      price: 195,
      quantity: 20,
      supplier: "AMD Philippines",
    },
    {
      name: "AMD Ryzen 7 5800X",
      description:
        "High-end desktop CPU, 8 cores/16 threads, 3.8GHz base, AM4 socket",
      category: "CPU",
      costPrice: 250,
      price: 295,
      quantity: 15,
      supplier: "AMD Philippines",
    },
    {
      name: "AMD Ryzen 9 5900X",
      description:
        "Flagship desktop CPU, 12 cores/24 threads, 3.7GHz base, AM4 socket",
      category: "CPU",
      costPrice: 340,
      price: 390,
      quantity: 10,
      supplier: "AMD Philippines",
    },
    // ── CORE COMPONENTS: Motherboard ──
    {
      name: "ASUS Prime B660M-A",
      description:
        "LGA1700 Micro-ATX motherboard, DDR4 support, PCIe 4.0, M.2 slots",
      category: "Motherboard",
      costPrice: 110,
      price: 135,
      quantity: 15,
      supplier: "ASUS Philippines",
    },
    {
      name: "MSI PRO Z690-A",
      description: "LGA1700 ATX motherboard, DDR4/DDR5 support, PCIe 5.0, WiFi",
      category: "Motherboard",
      costPrice: 180,
      price: 215,
      quantity: 12,
      supplier: "MSI Philippines",
    },
    {
      name: "ASRock B550M Pro4",
      description:
        "AM4 Micro-ATX motherboard, DDR4 support, PCIe 4.0, dual M.2",
      category: "Motherboard",
      costPrice: 95,
      price: 118,
      quantity: 18,
      supplier: "ASRock Philippines",
    },
    {
      name: "Gigabyte B650 AORUS Elite",
      description:
        "AM5 ATX motherboard, DDR5 support, PCIe 5.0, 2.5G LAN, WiFi 6E",
      category: "Motherboard",
      costPrice: 200,
      price: 240,
      quantity: 10,
      supplier: "Gigabyte Philippines",
    },
    {
      name: "ASUS ROG STRIX X670E-F",
      description: "AM5 ATX premium motherboard, DDR5, PCIe 5.0, WiFi 6E, RGB",
      category: "Motherboard",
      costPrice: 320,
      price: 375,
      quantity: 8,
      supplier: "ASUS Philippines",
    },
    {
      name: "MSI MAG B650M Mortar",
      description: "AM5 Micro-ATX motherboard, DDR5, PCIe 5.0, dual M.2, WiFi",
      category: "Motherboard",
      costPrice: 165,
      price: 195,
      quantity: 14,
      supplier: "MSI Philippines",
    },
    // ── CORE COMPONENTS: RAM ──
    {
      name: "Kingston Fury Beast 8GB DDR4",
      description: "8GB DDR4-3200MHz gaming RAM, CL16, plug-and-play XMP",
      category: "RAM",
      costPrice: 22,
      price: 28,
      quantity: 50,
      supplier: "Kingston Philippines",
    },
    {
      name: "Corsair Vengeance 16GB DDR4",
      description: "16GB DDR4-3600MHz gaming RAM, CL18, aluminum heat spreader",
      category: "RAM",
      costPrice: 40,
      price: 50,
      quantity: 45,
      supplier: "Corsair Philippines",
    },
    {
      name: "Corsair Vengeance 32GB DDR4",
      description: "32GB DDR4-3600MHz high-performance RAM, XMP 2.0 support",
      category: "RAM",
      costPrice: 75,
      price: 90,
      quantity: 30,
      supplier: "Corsair Philippines",
    },
    {
      name: "G.Skill Trident Z5 16GB DDR5",
      description: "16GB DDR5-6000MHz ultra-fast gaming RAM, XMP 3.0, RGB",
      category: "RAM",
      costPrice: 85,
      price: 105,
      quantity: 25,
      supplier: "G.Skill Philippines",
    },
    {
      name: "Corsair Dominator 32GB DDR5",
      description: "32GB DDR5-6400MHz premium RAM, CL32, DHX cooling, iCUE RGB",
      category: "RAM",
      costPrice: 140,
      price: 170,
      quantity: 20,
      supplier: "Corsair Philippines",
    },
    {
      name: "Kingston Fury Beast 64GB DDR5",
      description:
        "64GB DDR5-5200MHz workstation RAM, ECC support, for content creators",
      category: "RAM",
      costPrice: 200,
      price: 240,
      quantity: 10,
      supplier: "Kingston Philippines",
    },
    // ── CORE COMPONENTS: GPU ──
    {
      name: "NVIDIA GeForce GTX 1650",
      description:
        "Entry-level GPU, 4GB GDDR6, excellent 1080p gaming, low power",
      category: "GPU",
      costPrice: 145,
      price: 175,
      quantity: 20,
      supplier: "ASUS Philippines",
    },
    {
      name: "NVIDIA GeForce RTX 3060",
      description:
        "Mid-range GPU, 12GB GDDR6, great 1080p and 1440p gaming, DLSS",
      category: "GPU",
      costPrice: 270,
      price: 320,
      quantity: 15,
      supplier: "MSI Philippines",
    },
    {
      name: "NVIDIA GeForce RTX 3070",
      description: "High-end GPU, 8GB GDDR6, top 1440p and capable 4K gaming",
      category: "GPU",
      costPrice: 380,
      price: 450,
      quantity: 12,
      supplier: "Gigabyte Philippines",
    },
    {
      name: "NVIDIA GeForce RTX 4070",
      description: "Latest gen GPU, 12GB GDDR6X, top 1440p performance, DLSS 3",
      category: "GPU",
      costPrice: 520,
      price: 600,
      quantity: 10,
      supplier: "ASUS Philippines",
    },
    {
      name: "NVIDIA GeForce RTX 4090",
      description:
        "Flagship GPU, 24GB GDDR6X, ultimate 4K gaming, AI rendering",
      category: "GPU",
      costPrice: 1400,
      price: 1600,
      quantity: 5,
      supplier: "MSI Philippines",
    },
    {
      name: "AMD Radeon RX 6600",
      description:
        "Mid-range GPU, 8GB GDDR6, excellent 1080p gaming, FSR support",
      category: "GPU",
      costPrice: 220,
      price: 260,
      quantity: 18,
      supplier: "Sapphire Philippines",
    },
    {
      name: "AMD Radeon RX 6700 XT",
      description:
        "High-end GPU, 12GB GDDR6, excellent 1440p gaming, FSR support",
      category: "GPU",
      costPrice: 330,
      price: 390,
      quantity: 12,
      supplier: "XFX Philippines",
    },
    {
      name: "AMD Radeon RX 7900 XTX",
      description:
        "Flagship AMD GPU, 24GB GDDR6, top 4K gaming, DisplayPort 2.1",
      category: "GPU",
      costPrice: 850,
      price: 980,
      quantity: 6,
      supplier: "Sapphire Philippines",
    },
    // ── CORE COMPONENTS: PSU ──
    {
      name: "Corsair CV450 80+ Bronze",
      description: "450W ATX power supply, 80+ Bronze certified, fixed cables",
      category: "PSU",
      costPrice: 45,
      price: 58,
      quantity: 30,
      supplier: "Corsair Philippines",
    },
    {
      name: "EVGA SuperNOVA 600W Bronze",
      description: "600W ATX PSU, 80+ Bronze certified, fully sleeved cables",
      category: "PSU",
      costPrice: 60,
      price: 75,
      quantity: 25,
      supplier: "EVGA Philippines",
    },
    {
      name: "Seasonic Focus GX-750 Gold",
      description:
        "750W ATX PSU, 80+ Gold certified, fully modular, 10yr warranty",
      category: "PSU",
      costPrice: 100,
      price: 125,
      quantity: 20,
      supplier: "Seasonic Philippines",
    },
    {
      name: "Corsair RM850x 80+ Gold",
      description: "850W ATX PSU, 80+ Gold, fully modular, zero RPM fan mode",
      category: "PSU",
      costPrice: 130,
      price: 160,
      quantity: 15,
      supplier: "Corsair Philippines",
    },
    {
      name: "be quiet! Dark Power 1000W",
      description:
        "1000W ATX PSU, 80+ Gold, fully modular, ultra-quiet operation",
      category: "PSU",
      costPrice: 180,
      price: 220,
      quantity: 10,
      supplier: "be quiet! Philippines",
    },
    // ── CORE COMPONENTS: Computer Case ──
    {
      name: "Cooler Master Q300L",
      description:
        "Mini-Tower Micro-ATX case, acrylic side panel, magnetic dust filter",
      category: "Computer Case",
      costPrice: 40,
      price: 52,
      quantity: 25,
      supplier: "Cooler Master Philippines",
    },
    {
      name: "NZXT H510",
      description:
        "Mid-Tower ATX case, tempered glass, integrated cable management bar",
      category: "Computer Case",
      costPrice: 70,
      price: 88,
      quantity: 20,
      supplier: "NZXT Philippines",
    },
    {
      name: "Lian Li PC-O11 Dynamic",
      description:
        "Mid-Tower ATX case, dual chamber, triple tempered glass panels",
      category: "Computer Case",
      costPrice: 120,
      price: 148,
      quantity: 15,
      supplier: "Lian Li Philippines",
    },
    {
      name: "Corsair 5000D Airflow",
      description:
        "Mid-Tower ATX case, high-airflow mesh front, tempered glass side",
      category: "Computer Case",
      costPrice: 130,
      price: 160,
      quantity: 12,
      supplier: "Corsair Philippines",
    },
    {
      name: "Fractal Design Torrent",
      description:
        "Full-Tower ATX case, front mesh, 3x140mm fans included, airflow",
      category: "Computer Case",
      costPrice: 160,
      price: 195,
      quantity: 10,
      supplier: "Fractal Design PH",
    },
    {
      name: "NZXT H510 Elite RGB",
      description:
        "Mid-Tower ATX case, pre-installed RGB fans, dual tempered glass",
      category: "Computer Case",
      costPrice: 155,
      price: 185,
      quantity: 12,
      supplier: "NZXT Philippines",
    },
    // ── STORAGE: SATA SSD ──
    {
      name: "Samsung 870 EVO 250GB",
      description:
        "2.5-inch SATA SSD, 550MB/s read, 520MB/s write, 3D MLC NAND",
      category: "SATA SSD",
      costPrice: 38,
      price: 48,
      quantity: 40,
      supplier: "Samsung Philippines",
    },
    {
      name: "Samsung 870 EVO 500GB",
      description:
        "2.5-inch SATA SSD, 560MB/s read, 530MB/s write, 3D MLC NAND",
      category: "SATA SSD",
      costPrice: 58,
      price: 72,
      quantity: 35,
      supplier: "Samsung Philippines",
    },
    {
      name: "Crucial MX500 1TB",
      description:
        "2.5-inch SATA SSD, 560MB/s read, AES-256 hardware encryption",
      category: "SATA SSD",
      costPrice: 75,
      price: 92,
      quantity: 30,
      supplier: "Crucial Philippines",
    },
    {
      name: "WD Blue 2TB SATA SSD",
      description:
        "2.5-inch SATA SSD, 560MB/s read, for large capacity storage needs",
      category: "SATA SSD",
      costPrice: 130,
      price: 160,
      quantity: 20,
      supplier: "WD Philippines",
    },
    // ── STORAGE: M.2 NVMe SSD ──
    {
      name: "WD Blue SN570 500GB NVMe",
      description:
        "M.2 NVMe PCIe 3.0 SSD, 3500MB/s read, mainstream performance",
      category: "M.2 NVMe SSD",
      costPrice: 45,
      price: 58,
      quantity: 40,
      supplier: "WD Philippines",
    },
    {
      name: "Samsung 980 Pro 1TB NVMe",
      description:
        "M.2 NVMe PCIe 4.0 SSD, 7000MB/s read, 5100MB/s write, gaming",
      category: "M.2 NVMe SSD",
      costPrice: 90,
      price: 115,
      quantity: 30,
      supplier: "Samsung Philippines",
    },
    {
      name: "Seagate FireCuda 530 2TB NVMe",
      description: "M.2 NVMe PCIe 4.0 SSD, 7300MB/s read, PS5 compatible",
      category: "M.2 NVMe SSD",
      costPrice: 160,
      price: 195,
      quantity: 20,
      supplier: "Seagate Philippines",
    },
    {
      name: "WD Black SN850X 4TB NVMe",
      description:
        "M.2 NVMe PCIe 4.0 SSD, 7300MB/s read, maximum capacity gaming",
      category: "M.2 NVMe SSD",
      costPrice: 290,
      price: 350,
      quantity: 10,
      supplier: "WD Philippines",
    },
    // ── STORAGE: HDD ──
    {
      name: "Seagate Barracuda 500GB HDD",
      description:
        "3.5-inch HDD, 7200RPM, 32MB cache, reliable desktop storage",
      category: "HDD",
      costPrice: 30,
      price: 40,
      quantity: 30,
      supplier: "Seagate Philippines",
    },
    {
      name: "WD Blue 1TB HDD",
      description:
        "3.5-inch HDD, 7200RPM, 64MB cache, dependable everyday storage",
      category: "HDD",
      costPrice: 38,
      price: 48,
      quantity: 35,
      supplier: "WD Philippines",
    },
    {
      name: "Seagate Barracuda 2TB HDD",
      description: "3.5-inch HDD, 7200RPM, 256MB cache, large desktop storage",
      category: "HDD",
      costPrice: 50,
      price: 65,
      quantity: 30,
      supplier: "Seagate Philippines",
    },
    {
      name: "WD Red Plus 4TB NAS HDD",
      description:
        "3.5-inch HDD, 7200RPM, NASware 3.0, optimized for NAS systems",
      category: "HDD",
      costPrice: 85,
      price: 105,
      quantity: 20,
      supplier: "WD Philippines",
    },
    {
      name: "Seagate IronWolf 8TB NAS HDD",
      description: "3.5-inch HDD, 7200RPM, NAS/server storage, IronWolf Health",
      category: "HDD",
      costPrice: 155,
      price: 190,
      quantity: 10,
      supplier: "Seagate Philippines",
    },
    // ── STORAGE: External Storage ──
    {
      name: "SanDisk Ultra 64GB USB 3.0",
      description:
        "USB Flash Drive, 130MB/s read, compact design, 5-year warranty",
      category: "External Storage",
      costPrice: 8,
      price: 12,
      quantity: 60,
      supplier: "SanDisk Philippines",
    },
    {
      name: "Samsung BAR Plus 128GB USB",
      description: "USB 3.1 Flash Drive, 300MB/s read, durable metal housing",
      category: "External Storage",
      costPrice: 14,
      price: 20,
      quantity: 50,
      supplier: "Samsung Philippines",
    },
    {
      name: "WD Elements 1TB External HDD",
      description:
        "USB 3.0 external HDD, plug-and-play, compatible with PC and Mac",
      category: "External Storage",
      costPrice: 45,
      price: 58,
      quantity: 30,
      supplier: "WD Philippines",
    },
    {
      name: "Seagate Backup Plus 2TB External",
      description:
        "USB 3.0 external HDD, 200GB OneDrive, automatic backup software",
      category: "External Storage",
      costPrice: 60,
      price: 75,
      quantity: 25,
      supplier: "Seagate Philippines",
    },
    {
      name: "Samsung T7 500GB External SSD",
      description:
        "USB 3.2 Gen 2 portable SSD, 1050MB/s read, compact metal design",
      category: "External Storage",
      costPrice: 65,
      price: 82,
      quantity: 20,
      supplier: "Samsung Philippines",
    },
    {
      name: "WD My Passport 4TB External HDD",
      description:
        "USB 3.0 external HDD, hardware AES-256 encryption, auto backup",
      category: "External Storage",
      costPrice: 95,
      price: 118,
      quantity: 15,
      supplier: "WD Philippines",
    },
    // ── PERIPHERALS: Monitor ──
    {
      name: 'LG 24" FHD IPS Monitor',
      description:
        "24-inch 1920x1080 IPS, 75Hz, AMD FreeSync, sRGB 99%, HDMI+VGA",
      category: "Monitor",
      costPrice: 115,
      price: 142,
      quantity: 18,
      supplier: "LG Philippines",
    },
    {
      name: 'ASUS 27" FHD IPS Monitor',
      description: "27-inch 1920x1080 IPS, 75Hz, EyeCare flicker-free, HDMI+DP",
      category: "Monitor",
      costPrice: 130,
      price: 160,
      quantity: 15,
      supplier: "ASUS Philippines",
    },
    {
      name: 'BenQ 27" QHD 165Hz Gaming',
      description:
        "27-inch 2560x1440 IPS, 165Hz, HDR400, 1ms MPRT, gaming panel",
      category: "Monitor",
      costPrice: 280,
      price: 340,
      quantity: 12,
      supplier: "BenQ Philippines",
    },
    {
      name: 'Samsung 27" Curved QHD 165Hz',
      description: "27-inch 2560x1440 VA Curved, 165Hz, AMD FreeSync, gaming",
      category: "Monitor",
      costPrice: 240,
      price: 290,
      quantity: 14,
      supplier: "Samsung Philippines",
    },
    {
      name: 'ASUS TUF 27" QHD 165Hz',
      description: "27-inch 1440p IPS, 165Hz, G-Sync Compatible, HDR, gaming",
      category: "Monitor",
      costPrice: 290,
      price: 350,
      quantity: 10,
      supplier: "ASUS Philippines",
    },
    {
      name: 'Dell 27" 4K USB-C Monitor',
      description:
        "27-inch 3840x2160 IPS, USB-C 65W charging, productivity monitor",
      category: "Monitor",
      costPrice: 330,
      price: 395,
      quantity: 10,
      supplier: "Dell Philippines",
    },
    {
      name: 'LG 32" 4K Ergo IPS Monitor',
      description:
        "32-inch 4K IPS Ergo stand, USB-C, HDR, for work and creation",
      category: "Monitor",
      costPrice: 650,
      price: 780,
      quantity: 8,
      supplier: "LG Philippines",
    },
    {
      name: 'Samsung 32" Curved 4K Monitor',
      description:
        "32-inch 3840x2160 VA Curved, ultra-wide view, home office use",
      category: "Monitor",
      costPrice: 380,
      price: 450,
      quantity: 8,
      supplier: "Samsung Philippines",
    },
    // ── PERIPHERALS: Keyboard ──
    {
      name: "Logitech K120 Wired Membrane",
      description:
        "Full-size wired membrane keyboard, spill-resistant, quiet typing",
      category: "Keyboard",
      costPrice: 12,
      price: 18,
      quantity: 60,
      supplier: "Logitech Philippines",
    },
    {
      name: "Redragon K552 Mechanical RGB",
      description:
        "Wired mechanical keyboard, red switches, RGB backlit, compact",
      category: "Keyboard",
      costPrice: 35,
      price: 48,
      quantity: 40,
      supplier: "Redragon Philippines",
    },
    {
      name: "Keychron K2 Wireless Mechanical",
      description:
        "Wireless/BT mechanical keyboard, hot-swap, RGB, compact 75%",
      category: "Keyboard",
      costPrice: 70,
      price: 90,
      quantity: 25,
      supplier: "Keychron Philippines",
    },
    {
      name: "SteelSeries Apex Pro Mechanical",
      description:
        "Wired mech keyboard, adjustable actuation OmniPoint, OLED display",
      category: "Keyboard",
      costPrice: 155,
      price: 190,
      quantity: 15,
      supplier: "SteelSeries Philippines",
    },
    {
      name: "Logitech MX Keys Wireless",
      description:
        "Wireless membrane keyboard, smart backlit, multi-device pairing",
      category: "Keyboard",
      costPrice: 80,
      price: 100,
      quantity: 20,
      supplier: "Logitech Philippines",
    },
    {
      name: "ASUS ROG Strix Scope RGB",
      description: "Wired mechanical gaming keyboard, Cherry MX switches, RGB",
      category: "Keyboard",
      costPrice: 90,
      price: 115,
      quantity: 18,
      supplier: "ASUS Philippines",
    },
    // ── PERIPHERALS: Mouse ──
    {
      name: "Logitech B100 Wired Mouse",
      description:
        "Basic wired optical mouse, 800 DPI, 3 buttons, plug-and-play",
      category: "Mouse",
      costPrice: 8,
      price: 12,
      quantity: 70,
      supplier: "Logitech Philippines",
    },
    {
      name: "Logitech M185 Wireless Mouse",
      description: "2.4GHz wireless mouse, 1000 DPI, 12-month battery life",
      category: "Mouse",
      costPrice: 18,
      price: 25,
      quantity: 55,
      supplier: "Logitech Philippines",
    },
    {
      name: "Razer DeathAdder V2 Gaming",
      description:
        "Wired gaming mouse, 20000 DPI optical, 8 buttons, Chroma RGB",
      category: "Mouse",
      costPrice: 45,
      price: 58,
      quantity: 30,
      supplier: "Razer Philippines",
    },
    {
      name: "Logitech G502 HERO Gaming",
      description:
        "Wired gaming mouse, 25600 DPI HERO sensor, 11 programmable btns",
      category: "Mouse",
      costPrice: 55,
      price: 70,
      quantity: 25,
      supplier: "Logitech Philippines",
    },
    {
      name: "Logitech MX Master 3 Wireless",
      description:
        "Wireless productivity mouse, MagSpeed scroll, ergonomic, USB-C",
      category: "Mouse",
      costPrice: 85,
      price: 108,
      quantity: 20,
      supplier: "Logitech Philippines",
    },
    {
      name: "Razer Viper Ultimate Wireless",
      description:
        "Wireless gaming mouse, 20000 DPI, 70-hour battery, charging dock",
      category: "Mouse",
      costPrice: 110,
      price: 138,
      quantity: 15,
      supplier: "Razer Philippines",
    },
    // ── PERIPHERALS: Headset ──
    {
      name: "Mpow PC Wired Headset",
      description:
        "Wired PC headset with noise-cancelling mic, office use, foldable",
      category: "Headset",
      costPrice: 18,
      price: 25,
      quantity: 45,
      supplier: "Mpow Philippines",
    },
    {
      name: "HyperX Cloud Stinger 2",
      description: "Wired gaming headset, 50mm drivers, mic with hardware mute",
      category: "Headset",
      costPrice: 35,
      price: 46,
      quantity: 35,
      supplier: "HyperX Philippines",
    },
    {
      name: "Logitech G Pro X Wired Gaming",
      description:
        "Wired gaming headset, Blue Voice mic technology, DTS 2.0 surround",
      category: "Headset",
      costPrice: 90,
      price: 115,
      quantity: 22,
      supplier: "Logitech Philippines",
    },
    {
      name: "SteelSeries Arctis 7 Wireless",
      description:
        "Wireless gaming headset, 30-hour battery, ClearCast bidirectional mic",
      category: "Headset",
      costPrice: 120,
      price: 150,
      quantity: 20,
      supplier: "SteelSeries Philippines",
    },
    {
      name: "Sony WH-1000XM5 Wireless ANC",
      description:
        "Wireless noise-cancelling headphones, 30-hour battery, premium audio",
      category: "Headset",
      costPrice: 280,
      price: 340,
      quantity: 12,
      supplier: "Sony Philippines",
    },
    {
      name: "Jabra Evolve2 55 Office Wireless",
      description:
        "Wireless office headset, ANC, Microsoft Teams certified, USB-C",
      category: "Headset",
      costPrice: 240,
      price: 295,
      quantity: 10,
      supplier: "Jabra Philippines",
    },
    // ── PERIPHERALS: Speakers ──
    {
      name: "Logitech S120 2.0 Speakers",
      description: "Stereo 2.0 PC speakers, 2.3W RMS, 3.5mm aux input",
      category: "Speakers",
      costPrice: 15,
      price: 22,
      quantity: 50,
      supplier: "Logitech Philippines",
    },
    {
      name: "Edifier R1280T 2.0 Bookshelf",
      description:
        "Powered 2.0 bookshelf speakers, 42W RMS, dual RCA input, wood",
      category: "Speakers",
      costPrice: 75,
      price: 95,
      quantity: 25,
      supplier: "Edifier Philippines",
    },
    {
      name: "Logitech Z313 2.1 Speaker System",
      description:
        "2.1 speaker system, 25W RMS, dedicated subwoofer, bass control",
      category: "Speakers",
      costPrice: 48,
      price: 62,
      quantity: 30,
      supplier: "Logitech Philippines",
    },
    {
      name: "Edifier S350DB 2.1 Bluetooth",
      description:
        "2.1 Bluetooth speaker system, 150W RMS, remote, optical/coaxial",
      category: "Speakers",
      costPrice: 155,
      price: 190,
      quantity: 15,
      supplier: "Edifier Philippines",
    },
    {
      name: "Logitech Z906 5.1 Surround Sound",
      description:
        "5.1 surround sound system, 500W peak, Dolby Digital, DTS decode",
      category: "Speakers",
      costPrice: 290,
      price: 350,
      quantity: 8,
      supplier: "Logitech Philippines",
    },
    // ── ACCESSORIES: CPU Cooler ──
    {
      name: "Cooler Master Hyper 212",
      description:
        "Air CPU cooler, 120mm fan, universal LGA1700/AM5/AM4 support",
      category: "CPU Cooler",
      costPrice: 35,
      price: 46,
      quantity: 35,
      supplier: "Cooler Master Philippines",
    },
    {
      name: "be quiet! Pure Rock 2",
      description:
        "Air CPU cooler, 120mm silent fan, compatible with LGA1700 and AM5",
      category: "CPU Cooler",
      costPrice: 30,
      price: 40,
      quantity: 30,
      supplier: "be quiet! Philippines",
    },
    {
      name: "Noctua NH-D15 Air Cooler",
      description:
        "Dual tower air cooler, 2x140mm fans, ultra-quiet, top TDP rating",
      category: "CPU Cooler",
      costPrice: 85,
      price: 108,
      quantity: 20,
      supplier: "Noctua Philippines",
    },
    {
      name: "NZXT Kraken X63 280mm AIO",
      description: "280mm AIO liquid cooler, dual 140mm fans, RGB pump head",
      category: "CPU Cooler",
      costPrice: 130,
      price: 165,
      quantity: 15,
      supplier: "NZXT Philippines",
    },
    {
      name: "Corsair H150i Elite 360mm AIO",
      description: "360mm AIO liquid cooler, 3x120mm fans, LCD display, iCUE",
      category: "CPU Cooler",
      costPrice: 200,
      price: 248,
      quantity: 10,
      supplier: "Corsair Philippines",
    },
    // ── ACCESSORIES: Case Fan ──
    {
      name: "be quiet! Silent Wings 3 120mm",
      description: "Ultra-silent 120mm case fan, 1450 RPM, 3-pin connector",
      category: "Case Fan",
      costPrice: 15,
      price: 22,
      quantity: 55,
      supplier: "be quiet! Philippines",
    },
    {
      name: "Corsair LL120 RGB 120mm Fan",
      description:
        "RGB 120mm case fan, 16 individual LEDs, 1500 RPM, iCUE support",
      category: "Case Fan",
      costPrice: 18,
      price: 25,
      quantity: 60,
      supplier: "Corsair Philippines",
    },
    {
      name: "NZXT Aer RGB 140mm Fan",
      description: "RGB 140mm case fan, Fluid Dynamic Bearing, 1500 RPM max",
      category: "Case Fan",
      costPrice: 22,
      price: 30,
      quantity: 50,
      supplier: "NZXT Philippines",
    },
    {
      name: "Lian Li Uni Fan SL140 ARGB",
      description: "140mm ARGB case fan, daisy-chain system, low-noise profile",
      category: "Case Fan",
      costPrice: 28,
      price: 38,
      quantity: 40,
      supplier: "Lian Li Philippines",
    },
    // ── ACCESSORIES: Cable & Adapter ──
    {
      name: "HDMI 2.1 Cable 2m",
      description: "High-speed HDMI 2.1 cable, supports 8K and 4K 120Hz gaming",
      category: "Cable & Adapter",
      costPrice: 8,
      price: 14,
      quantity: 80,
      supplier: "Generic Supplier PH",
    },
    {
      name: "DisplayPort 1.4 Cable 1.8m",
      description: "DP 1.4 cable, 8K/4K 144Hz support, 32.4Gbps bandwidth",
      category: "Cable & Adapter",
      costPrice: 10,
      price: 16,
      quantity: 70,
      supplier: "Generic Supplier PH",
    },
    {
      name: "USB-C to USB-A Cable 1m",
      description:
        "USB 3.1 Gen 2 cable, 10Gbps data transfer, 3A charging support",
      category: "Cable & Adapter",
      costPrice: 5,
      price: 9,
      quantity: 100,
      supplier: "Generic Supplier PH",
    },
    {
      name: "SATA III Data Cable 0.5m",
      description:
        "6Gbps SATA data cable for HDD/SSD, L-shape connector included",
      category: "Cable & Adapter",
      costPrice: 3,
      price: 6,
      quantity: 120,
      supplier: "Generic Supplier PH",
    },
    {
      name: "PCIe 4.0 x16 Riser Cable 200mm",
      description:
        "PCIe 4.0 vertical GPU riser cable, 200mm length, for case mods",
      category: "Cable & Adapter",
      costPrice: 22,
      price: 32,
      quantity: 25,
      supplier: "Generic Supplier PH",
    },
    // ── ACCESSORIES: Thermal Paste ──
    {
      name: "Arctic MX-4 Thermal Paste 4g",
      description:
        "High-performance thermal compound, 8.5 W/mK conductivity, non-conductive",
      category: "Thermal Paste",
      costPrice: 7,
      price: 12,
      quantity: 80,
      supplier: "Arctic Philippines",
    },
    {
      name: "Noctua NT-H1 Thermal Paste 3.5g",
      description:
        "Premium thermal paste, excellent stability, 5-year durability",
      category: "Thermal Paste",
      costPrice: 8,
      price: 14,
      quantity: 70,
      supplier: "Noctua Philippines",
    },
    {
      name: "Thermal Grizzly Kryonaut 1g",
      description:
        "Ultra-premium thermal compound, 12.5 W/mK, for extreme OC use",
      category: "Thermal Paste",
      costPrice: 9,
      price: 16,
      quantity: 60,
      supplier: "Thermal Grizzly PH",
    },
    // ── ACCESSORIES: Network Device ──
    {
      name: "TP-Link TL-WN823N USB WiFi",
      description: "300Mbps 2.4GHz USB WiFi adapter, mini size, plug-and-play",
      category: "Network Device",
      costPrice: 12,
      price: 18,
      quantity: 50,
      supplier: "TP-Link Philippines",
    },
    {
      name: "TP-Link Archer T3U Plus USB WiFi",
      description:
        "1300Mbps dual-band USB WiFi adapter, high-gain external antenna",
      category: "Network Device",
      costPrice: 22,
      price: 32,
      quantity: 40,
      supplier: "TP-Link Philippines",
    },
    {
      name: "TP-Link TG-3468 PCIe NIC",
      description:
        "Gigabit Ethernet PCIe network card, desktop upgrade, Wake-on-LAN",
      category: "Network Device",
      costPrice: 18,
      price: 26,
      quantity: 35,
      supplier: "TP-Link Philippines",
    },
    {
      name: "Intel AX200 WiFi 6 PCIe Card",
      description: "WiFi 6 + Bluetooth 5.2 PCIe card, 2400Mbps, MU-MIMO, OFDMA",
      category: "Network Device",
      costPrice: 28,
      price: 40,
      quantity: 30,
      supplier: "Intel Philippines",
    },
    {
      name: "TP-Link Archer AX21 WiFi 6 Router",
      description: "WiFi 6 AX1800 router, dual-band, MU-MIMO, OFDMA, OneMesh",
      category: "Network Device",
      costPrice: 60,
      price: 78,
      quantity: 20,
      supplier: "TP-Link Philippines",
    },
  ];

  // Initialize inventory with default products if empty
  if (inventory.length === 0) {
    inventory = DEFAULT_PRODUCTS.map((p, i) => ({
      id: 1000 + i,
      name: p.name,
      description: p.description,
      category: p.category,
      costPrice: p.costPrice,
      price: p.price,
      quantity: p.quantity,
      supplier: p.supplier,
      owner: randNames[(1000 + i) % randNames.length],
      isCatalog: true,
      purpose: "For Sale",
      approved: true,
      condition: "New",
      listedDate: new Date(
        Date.now() - Math.random() * 15 * 86400000,
      ).toISOString(),
    }));
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }

  // ── Market seed sellers (random demo listings) ──────────────────────
  const MARKET_SEEDS_DATA = [
    {
      name: "Intel Core i5-13600K",
      category: "CPU",
      price: 285,
      qty: 8,
      cond: "New",
      owner: "TechDealerPH",
      sid: "1847",
      desc: "Mid-range desktop CPU, 14 cores LGA1700, sealed box",
    },
    {
      name: "AMD Ryzen 7 5800X",
      category: "CPU",
      price: 278,
      qty: 5,
      cond: "Like New",
      owner: "TechDealerPH",
      sid: "1847",
      desc: "High-end AM4 CPU, lightly used, excellent condition",
    },
    {
      name: "NVIDIA GeForce RTX 3070",
      category: "GPU",
      price: 435,
      qty: 3,
      cond: "New",
      owner: "TechDealerPH",
      sid: "1847",
      desc: "High-end 8GB GDDR6 GPU, sealed box",
    },
    {
      name: "AMD Radeon RX 6600",
      category: "GPU",
      price: 248,
      qty: 6,
      cond: "Good",
      owner: "TechDealerPH",
      sid: "1847",
      desc: "Mid-range 8GB GPU, tested and fully working",
    },
    {
      name: "Corsair Vengeance 16GB DDR4",
      category: "RAM",
      price: 48,
      qty: 15,
      cond: "New",
      owner: "GadgetHubPH",
      sid: "2391",
      desc: "DDR4-3600MHz gaming RAM, brand new sealed",
    },
    {
      name: "G.Skill Trident Z5 16GB DDR5",
      category: "RAM",
      price: 99,
      qty: 10,
      cond: "New",
      owner: "GadgetHubPH",
      sid: "2391",
      desc: "DDR5-6000MHz ultra-fast gaming RAM, RGB",
    },
    {
      name: "Samsung 980 Pro 1TB NVMe",
      category: "M.2 NVMe SSD",
      price: 109,
      qty: 12,
      cond: "New",
      owner: "GadgetHubPH",
      sid: "2391",
      desc: "PCIe 4.0 NVMe SSD, 7000MB/s read, sealed",
    },
    {
      name: "WD Blue SN570 500GB NVMe",
      category: "M.2 NVMe SSD",
      price: 53,
      qty: 18,
      cond: "New",
      owner: "GadgetHubPH",
      sid: "2391",
      desc: "PCIe 3.0 NVMe, 3500MB/s, great budget upgrade",
    },
    {
      name: 'ASUS 27" FHD IPS Monitor',
      category: "Monitor",
      price: 148,
      qty: 4,
      cond: "New",
      owner: "PCWorldMNL",
      sid: "3052",
      desc: "27-inch 1080p IPS, 75Hz, EyeCare, HDMI+DP",
    },
    {
      name: 'BenQ 27" QHD 165Hz Gaming',
      category: "Monitor",
      price: 332,
      qty: 3,
      cond: "New",
      owner: "PCWorldMNL",
      sid: "3052",
      desc: "27-inch 1440p IPS gaming monitor, HDR400",
    },
    {
      name: "Logitech G502 HERO Gaming",
      category: "Mouse",
      price: 65,
      qty: 9,
      cond: "New",
      owner: "PCWorldMNL",
      sid: "3052",
      desc: "25600 DPI wired gaming mouse, 11 buttons",
    },
    {
      name: "Redragon K552 Mechanical RGB",
      category: "Keyboard",
      price: 45,
      qty: 11,
      cond: "New",
      owner: "PCWorldMNL",
      sid: "3052",
      desc: "Wired mech keyboard, red switches, RGB backlit",
    },
    {
      name: "HyperX Cloud Stinger 2",
      category: "Headset",
      price: 43,
      qty: 7,
      cond: "New",
      owner: "PCWorldMNL",
      sid: "3052",
      desc: "Wired gaming headset, 50mm drivers, mute button",
    },
    {
      name: "Seagate Barracuda 2TB HDD",
      category: "HDD",
      price: 61,
      qty: 14,
      cond: "New",
      owner: "ByteStorePH",
      sid: "4178",
      desc: "3.5-inch 7200RPM HDD, ideal for bulk storage",
    },
    {
      name: "WD My Passport 4TB External HDD",
      category: "External Storage",
      price: 113,
      qty: 6,
      cond: "Like New",
      owner: "ByteStorePH",
      sid: "4178",
      desc: "USB 3.0 portable HDD, AES-256 encryption",
    },
    {
      name: "Samsung T7 500GB External SSD",
      category: "External Storage",
      price: 79,
      qty: 8,
      cond: "New",
      owner: "ByteStorePH",
      sid: "4178",
      desc: "USB 3.2 Gen 2 SSD, 1050MB/s, compact metal",
    },
    {
      name: "Crucial MX500 1TB",
      category: "SATA SSD",
      price: 88,
      qty: 10,
      cond: "Good",
      owner: "ByteStorePH",
      sid: "4178",
      desc: "2.5-inch SATA SSD, 560MB/s, lightly used",
    },
    {
      name: "NVIDIA GeForce RTX 4070",
      category: "GPU",
      price: 575,
      qty: 2,
      cond: "New",
      owner: "GameSetupPH",
      sid: "5634",
      desc: "Latest-gen GPU, 12GB GDDR6X, DLSS 3, sealed",
    },
    {
      name: "SteelSeries Arctis 7 Wireless",
      category: "Headset",
      price: 143,
      qty: 4,
      cond: "Good",
      owner: "GameSetupPH",
      sid: "5634",
      desc: "Wireless gaming headset, 30hr battery, used",
    },
    {
      name: "Logitech MX Master 3 Wireless",
      category: "Mouse",
      price: 102,
      qty: 5,
      cond: "Like New",
      owner: "GameSetupPH",
      sid: "5634",
      desc: "Premium wireless mouse, MagSpeed scroll",
    },
    {
      name: "Keychron K2 Wireless Mechanical",
      category: "Keyboard",
      price: 87,
      qty: 6,
      cond: "New",
      owner: "GameSetupPH",
      sid: "5634",
      desc: "Wireless/BT mech keyboard, hot-swap, RGB",
    },
    {
      name: "Corsair 5000D Airflow",
      category: "Computer Case",
      price: 153,
      qty: 3,
      cond: "New",
      owner: "PCBuilderPro",
      sid: "6829",
      desc: "Mid-tower ATX, mesh front, high airflow",
    },
    {
      name: "Seasonic Focus GX-750 Gold",
      category: "PSU",
      price: 119,
      qty: 5,
      cond: "New",
      owner: "PCBuilderPro",
      sid: "6829",
      desc: "750W 80+ Gold fully modular PSU, 10-yr warranty",
    },
    {
      name: "NZXT Kraken X63 280mm AIO",
      category: "CPU Cooler",
      price: 158,
      qty: 4,
      cond: "New",
      owner: "PCBuilderPro",
      sid: "6829",
      desc: "280mm AIO liquid cooler, dual 140mm RGB fans",
    },
    {
      name: "be quiet! Pure Rock 2",
      category: "CPU Cooler",
      price: 37,
      qty: 8,
      cond: "Good",
      owner: "PCBuilderPro",
      sid: "6829",
      desc: "Silent air cooler, 120mm fan, LGA1700/AM5/AM4",
    },
  ];

  // Seed market items into localStorage once (separate from main inventory)
  if (!localStorage.getItem("marketSeeded")) {
    const seeds = MARKET_SEEDS_DATA.map((s, i) => ({
      id: 9000000 + i,
      name: s.name,
      description: s.desc,
      category: s.category,
      price: s.price,
      costPrice: parseFloat((s.price * 0.8).toFixed(2)),
      quantity: s.qty,
      supplier: s.owner,
      owner: s.owner,
      sellerId: s.sid,
      purpose: "For Sale",
      approved: true,
      isSeed: true,
      condition: s.cond,
      listedDate: new Date(
        Date.now() - Math.random() * 25 * 86400000,
      ).toISOString(),
    }));
    localStorage.setItem("marketSeedItems", JSON.stringify(seeds));
    localStorage.setItem("marketSeeded", "true");
  }

  // Merge seeds into in-memory inventory (never written back to storage)
  {
    const seeds = JSON.parse(localStorage.getItem("marketSeedItems") || "[]");
    seeds.forEach((s) => {
      if (!inventory.some((p) => p.id === s.id)) inventory.push(s);
    });
  }

  // Elements
  const inventoryTbody = document.getElementById("inventory-tbody");
  const productModal = document.getElementById("product-modal");
  const stockModal = document.getElementById("stock-modal");
  const addProductBtn = document.getElementById("add-product-btn");
  const clearInventoryBtn = document.getElementById("clear-inventory-btn");
  const buyModal = document.getElementById("buy-modal");
  const marketTbody = document.getElementById("market-tbody");

  // Category Dependent Dropdown Logic
  const mainCategorySelect = document.getElementById("prod-main-category");
  const subCategorySelect = document.getElementById("prod-category");

  const subCategories = {
    "Core Components": [
      "CPU",
      "Motherboard",
      "RAM",
      "GPU",
      "PSU",
      "Computer Case",
    ],
    "Storage Devices": ["SATA SSD", "M.2 NVMe SSD", "HDD", "External Storage"],
    Peripherals: ["Monitor", "Keyboard", "Mouse", "Headset", "Speakers"],
    Accessories: [
      "CPU Cooler",
      "Case Fan",
      "Cable & Adapter",
      "Thermal Paste",
      "Network Device",
    ],
  };

  if (mainCategorySelect && subCategorySelect) {
    mainCategorySelect.addEventListener("change", function () {
      subCategorySelect.innerHTML =
        '<option value="" disabled selected>Select Specific Part</option>';
      subCategorySelect.disabled = false;
      if (subCategories[this.value]) {
        subCategories[this.value].forEach((item) => {
          subCategorySelect.innerHTML += `<option value="${item}" style="background:#2c3e50;">${item}</option>`;
        });
      }
    });
  }

  // Stats Elements
  const elTotalProducts = document.getElementById("inv-total-products");
  const elTotalValue = document.getElementById("inv-total-value");
  const elTotalKeep = document.getElementById("inv-total-keep");
  const elTotalSale = document.getElementById("inv-total-sale");
  const elOutStock = document.getElementById("inv-out-stock");

  function saveInventory() {
    // Never persist seed items — they live only in memory
    const toSave = inventory.filter((p) => !p.isSeed);
    localStorage.setItem("inventory", JSON.stringify(toSave));
    renderInventory();
  }

  function renderInventory() {
    if (!inventoryTbody) return; // Not on dashboard page

    // Always pull the freshest data so admin approvals show instantly
    inventory = JSON.parse(localStorage.getItem("inventory")) || [];

    const searchTerm =
      document.getElementById("inventory-search")?.value.toLowerCase() || "";
    const filterCategory =
      document.getElementById("inventory-filter")?.value || "all";

    inventoryTbody.innerHTML = "";

    let totalValue = 0;
    let totalKeep = 0;
    let totalSale = 0;

    const currentUser = localStorage.getItem("currentUser") || "Unknown";

    // Render Table Rows
    inventory.forEach((product) => {
      if (product.isSeed) return; // never show market seeds in inventory view
      if (currentUser === "Admin Richard") {
        // Admin sees ONLY user-submitted requests, never their own catalog items
        if (product.isCatalog) return;
      } else {
        // Regular users see only their own listings that are listed for sale
        if (product.owner !== currentUser) return;
        if (product.purpose !== "For Sale") return;
      }

      totalValue += product.price * product.quantity;

      // Filter logic
      if (filterCategory !== "all" && product.category !== filterCategory) {
        return;
      }
      if (
        searchTerm &&
        !product.name.toLowerCase().includes(searchTerm) &&
        !product.category.toLowerCase().includes(searchTerm) &&
        !(product.description || "").toLowerCase().includes(searchTerm)
      ) {
        return;
      }

      const tr = document.createElement("tr");

      // Highlight low stock / out of stock
      let stockClass = "";
      let stockText = product.quantity;
      if (product.quantity === 0) {
        stockClass = "text-danger";
        stockText = "Out of Stock";
      } else if (product.quantity < 10) {
        stockClass = "text-warning";
      }

      // Hide specific numbers for Admin Richard
      if (currentUser === "Admin Richard") {
        stockText = product.quantity > 0 ? "Available" : "Out of Stock";
      }

      let actionButtons = "";
      if (currentUser === "Admin Richard") {
        if (product.purpose === "To Keep") {
          actionButtons = `
                        <span style="color: #f39c12; font-size: 0.9em; margin-right: 10px; font-weight: bold;">To Keep</span>
                        <button class="action-btn btn-delete" onclick="deleteProduct(${product.id})">Del</button>
                    `;
        } else {
          actionButtons = `
                        <button class="action-btn" style="background: ${product.approved ? "#96c93d" : "#f39c12"}; color: white;" onclick="approveProduct(${product.id})">${product.approved ? "Approved" : "Approve"}</button>
                        <button class="action-btn btn-delete" onclick="deleteProduct(${product.id})">Del</button>
                    `;
        }
      } else {
        const statusBadge = `<div style="margin-bottom:6px;"><span style="background:${product.approved ? "rgba(150,201,61,0.15)" : "rgba(255,159,67,0.12)"};color:${product.approved ? "#96c93d" : "#ff9f43"};padding:3px 10px;border-radius:20px;font-size:0.73rem;font-weight:700;border:1px solid ${product.approved ? "rgba(150,201,61,0.35)" : "rgba(255,159,67,0.3)"};transition:all .3s;">${product.approved ? "✅ Approved" : "⏳ Pending"}</span></div>`;
        actionButtons = `
          ${statusBadge}
          <button class="action-btn btn-edit" onclick="editProduct(${product.id})">Edit</button>
          <button class="action-btn btn-delete" onclick="deleteProduct(${product.id})">Del</button>
        `;
      }

      tr.innerHTML = `
                <td style="font-size:.8rem;">
                  <span style="color:rgba(255,255,255,0.5);">#${product.id}</span>
                </td>
                <td>
                  <span style="color:#4facfe;font-weight:600;font-size:.85rem;">${product.owner || "Unknown"}</span>
                </td>
                <td>
                  <strong>${product.name}</strong>
                  ${product.description ? `<br><small style="color:rgba(255,255,255,0.45);font-size:0.75rem;">${product.description.length > 60 ? product.description.substring(0, 60) + "\u2026" : product.description}</small>` : ""}
                  <br><small style="color:rgba(255,255,255,0.35)">📦 ${product.supplier}</small>
                </td>
                <td><span style="background:rgba(79,172,254,.1);color:#4facfe;padding:2px 8px;border-radius:6px;font-size:.78rem;">${product.category}</span></td>
                <td style="color:rgba(255,200,100,0.85);">$${parseFloat(product.costPrice || 0).toFixed(2)}</td>
                <td style="color:#96c93d;font-weight:700;">$${parseFloat(product.price).toFixed(2)}</td>
                <td class="${stockClass}">${stockText}</td>
                <td>
                    ${actionButtons}
                </td>
            `;
      inventoryTbody.innerHTML += tr.outerHTML;

      if (product.purpose === "To Keep") {
        totalKeep++;
      } else {
        totalSale++;
      }
    });

    // Show empty state for admin when no user requests exist
    if (currentUser === "Admin Richard" && inventoryTbody.innerHTML === "") {
      inventoryTbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:50px 20px;opacity:.45;font-size:.9rem;">
        📥 No user requests yet.<br><small>When users add products, they will appear here for your approval.</small>
      </td></tr>`;
    }

    if (elTotalProducts)
      elTotalProducts.textContent = document.querySelectorAll(
        "#inventory-tbody tr",
      ).length;
    if (elTotalKeep) elTotalKeep.textContent = totalKeep;
    if (elTotalSale) elTotalSale.textContent = totalSale;
    if (elTotalValue)
      elTotalValue.textContent = `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }

  // ── Render User Owned Inventory (Separate View) ──────────────────
  window.renderUserInventory = function() {
    const grid = document.getElementById("user-inventory-grid");
    if (!grid) return;

    // Get fresh data
    inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const currentUser = localStorage.getItem("currentUser") || "Unknown";

    grid.innerHTML = "";
    let totalQty = 0;
    let totalValue = 0;

    inventory.forEach((product) => {
      // Show only current user's owned items that are NOT currently listed for sale
      if (product.owner !== currentUser) return;
      if (product.purpose === "For Sale") return;

      totalQty += product.quantity;
      totalValue += product.price * product.quantity;

      const enriched = enrichProduct(product);
      const catClass = getCategoryClass(enriched.category);

      const card = document.createElement("div");
      card.className = `mkt-card ${catClass}`;
      card.innerHTML = `
        <div class="mkt-card-header">
          <span class="mkt-card-cat-badge font-bold">${enriched.category}</span>
          <span class="mkt-card-cond-badge ${COND_CLASS[enriched.condition] || "cond-good"} font-bold">
            ${COND_EMOJI[enriched.condition] || "✨"} ${enriched.condition || "New"}
          </span>
        </div>
        
        <h3 class="mkt-card-title font-bold" title="${enriched.name}">${enriched.name}</h3>
        
        <div class="mkt-card-meta">
          <span class="mkt-card-seller" style="color: #4facfe;">📦 ${enriched.supplier || "Supplier: N/A"}</span>
          <span class="mkt-card-time" style="font-size:0.75rem; opacity:0.6;">Asset ID: #${enriched.id}</span>
        </div>
        
        <p class="mkt-card-desc" title="${enriched.description || ""}">${enriched.description || "High quality components stored safely inside your vault."}</p>
        
        <div class="mkt-card-pricing-row">
          <div class="mkt-card-price-block">
            <span class="mkt-card-price-lbl">VALUE</span>
            <span class="mkt-card-price-val">$${parseFloat(enriched.price).toFixed(2)}</span>
          </div>
          <div class="mkt-card-stock-block">
            <div class="mkt-card-stock-status">
              <span class="status-badge status-high" style="background:rgba(0, 242, 254, 0.1); color:#00f2fe; border:1px solid rgba(0, 242, 254, 0.25);">
                ${enriched.quantity} Owned
              </span>
            </div>
            <div class="mkt-card-rating">${starsHtml(enriched.rating, enriched.totalSold)}</div>
          </div>
        </div>
        
        <div class="mkt-card-actions">
          <div class="mkt-card-row-1">
            <button class="mkt-card-btn btn-view" onclick="openMarketDetail(${enriched.id})">🔍 VIEW DETAILS</button>
          </div>
          <button class="mkt-card-btn btn-buy-now" style="background: linear-gradient(135deg, #00f2fe, #4facfe); box-shadow: 0 4px 15px rgba(0, 242, 254, 0.2);" onclick="listOwnedAssetForSale(${enriched.id})">
            🏷️ SELL THIS ASSET
          </button>
        </div>
      `;
      grid.appendChild(card);
    });

    if (grid.innerHTML === "") {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:60px 40px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color:rgba(255,255,255,0.45); font-size:1rem; font-family:'Outfit',sans-serif;">
        Walang laman ang iyong inventory.<br><small style="font-size: 0.8rem; margin-top: 8px; display: block; opacity: 0.65;">Pumunta sa 🌐 Global Market upang bumili ng PC parts, at dito sila mapupunta!</small>
      </div>`;
    }

    const elUserQty = document.getElementById("user-inv-total-qty");
    const elUserVal = document.getElementById("user-inv-total-value");
    if (elUserQty) elUserQty.textContent = totalQty;
    if (elUserVal) elUserVal.textContent = `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  window.listOwnedAssetForSale = function(id) {
    const product = inventory.find((p) => p.id == id);
    if (!product) return;

    const priceStr = prompt(`Enter listing price for ${product.name}:`, product.price);
    if (priceStr === null) return; // Cancelled
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid selling price!");
      return;
    }

    if (confirm(`List ${product.name} on the Global Market for $${price.toFixed(2)}?`)) {
      product.price = price;
      product.purpose = "For Sale";
      product.approved = true; // Automatically approved instantly!
      saveInventory();
      renderUserInventory();
      
      logActivity("🏷️ Listed Asset for Sale", {
        name: product.name,
        supplier: product.supplier,
        amountQty: `Listed for $${price.toFixed(2)} | Qty: ${product.quantity}`,
      });
      alert(`Success! ${product.name} has been listed on the marketplace! It is now instantly visible in the Global Market.`);
    }
  };

  // ── Market helpers ──────────────────────────────────────────────
  const CONDITIONS = ["New", "Like New", "Good", "Fair"];
  const COND_CLASS = {
    New: "cond-new",
    "Like New": "cond-likenew",
    Good: "cond-good",
    Fair: "cond-fair",
  };
  const COND_EMOJI = { New: "✨", "Like New": "👌", Good: "👍", Fair: "🔄" };

  // Build sales map from audit logs: { itemName -> totalQtySold }
  function buildSalesMap() {
    const logs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
    const map = {};
    logs.forEach((log) => {
      if (!log.action.includes("Sold")) return;
      const key = log.itemName;
      // Parse qty from amountQty string e.g. "Qty Sold: 3 | ..."
      const match = log.amountQty.match(/Qty(?:\s*Sold)?:\s*(\d+)/i);
      const qty = match ? parseInt(match[1]) : 1;
      map[key] = (map[key] || 0) + qty;
    });
    return map;
  }

  // Compute star rating from total units sold:
  // 0 sold = 3.0, 1-4 = 3.5, 5-9 = 4.0, 10-19 = 4.5, 20+ = 5.0
  function salesToRating(totalSold) {
    if (totalSold >= 20) return "5.0";
    if (totalSold >= 10) return "4.5";
    if (totalSold >= 5) return "4.0";
    if (totalSold >= 1) return "3.5";
    return "3.0";
  }

  // Get CSS category class based on category name
  function getCategoryClass(cat) {
    if (!cat) return "cat-peripheral";
    const c = cat.toLowerCase();
    if (c.includes("cpu") || c.includes("processor")) return "cat-cpu";
    if (c.includes("gpu") || c.includes("graphic")) return "cat-gpu";
    if (c.includes("ram") || c.includes("memory")) return "cat-ram";
    if (c.includes("ssd") || c.includes("hdd") || c.includes("storage")) return "cat-storage";
    if (c.includes("motherboard")) return "cat-motherboard";
    if (c.includes("psu") || c.includes("power supply")) return "cat-psu";
    if (c.includes("case")) return "cat-case";
    if (c.includes("cooler") || c.includes("fan") || c.includes("cooling")) return "cat-cooling";
    if (c.includes("monitor")) return "cat-monitor";
    if (c.includes("keyboard")) return "cat-keyboard";
    if (c.includes("mouse") || c.includes("mice")) return "cat-mouse";
    return "cat-peripheral";
  }

  // Enrich each product with extra market fields if missing
  function enrichProduct(p) {
    if (!p.condition)
      p.condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
    if (!p.listedDate)
      p.listedDate = new Date(
        Date.now() - Math.random() * 30 * 86400000,
      ).toISOString();
    // Rating is always recomputed from sales
    const salesMap = buildSalesMap();
    p.rating = salesToRating(salesMap[p.name] || 0);
    p.totalSold = salesMap[p.name] || 0;
    return p;
  }

  function starsHtml(rating, totalSold) {
    const r = parseFloat(rating);
    const full = Math.floor(r);
    const half = r - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    const soldTxt =
      totalSold > 0
        ? `<br><small style="color:#f39c12;opacity:.8;">${totalSold} sold</small>`
        : `<br><small style="opacity:.35;">No sales</small>`;
    return `<span class="star-rating">${"★".repeat(full)}${half ? "½" : ""}${"☆".repeat(empty)}</span> <small style="opacity:.6;">${rating}</small>${soldTxt}`;
  }

  function statusBadge(qty) {
    if (qty === 0)
      return `<span class="status-badge status-out">🔴 Out of Stock</span>`;
    if (qty < 10)
      return `<span class="status-badge status-low">🟡 Low Stock</span>`;
    return `<span class="status-badge status-high">🟢 In Stock</span>`;
  }

  function relativeDate(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return diff + "d ago";
  }

  // Cart state
  let cart = JSON.parse(localStorage.getItem("myapp_cart") || "[]");
  function saveCart() {
    localStorage.setItem("myapp_cart", JSON.stringify(cart));
    updateCartBadge();
  }

  function updateCartBadge() {
    const total = cart.reduce((s, c) => s + c.qty, 0);
    const badge = document.getElementById("cart-float-badge");
    const btn = document.getElementById("cart-float-btn");
    if (!btn) return;
    btn.style.display = total > 0 ? "flex" : "none";
    if (badge) badge.textContent = total;
  }

  // Favorites state
  let favorites = JSON.parse(localStorage.getItem("myapp_favs") || "[]");
  function saveFavs() {
    localStorage.setItem("myapp_favs", JSON.stringify(favorites));
  }

  // Render Market View
  window.renderMarket = function () {
    const marketGrid = document.getElementById("market-grid");
    if (!marketGrid) return;

    const searchTerm =
      document.getElementById("market-search")?.value.toLowerCase() || "";
    const filterCat =
      document.getElementById("market-filter-cat")?.value || "all";
    const sortBy =
      document.getElementById("market-filter-sort")?.value || "default";
    const filterCond =
      document.getElementById("market-filter-cond")?.value || "all";
    const currentUser = localStorage.getItem("currentUser") || "Unknown";

    // Seller search (supports "name", "#id", or "name #id")
    const sellerRaw =
      document.getElementById("market-seller-search")?.value.trim() || "";
    const sellerQ = sellerRaw.toLowerCase();

    // Enrich & filter — own items are INCLUDED (shown as My Listing)
    let items = inventory.map(enrichProduct).filter((p) => {
      if (p.quantity <= 0) return false;
      if (!p.approved) return false;
      if (p.purpose === "To Keep") return false;
      if (filterCat !== "all" && p.category !== filterCat) return false;
      if (filterCond !== "all" && p.condition !== filterCond) return false;
      if (
        searchTerm &&
        !p.name.toLowerCase().includes(searchTerm) &&
        !p.category.toLowerCase().includes(searchTerm) &&
        !(p.owner || "").toLowerCase().includes(searchTerm)
      )
        return false;
      // Seller search
      if (sellerQ) {
        const ownerL = (p.owner || "").toLowerCase();
        const sid = String(p.sellerId || "");
        if (sellerQ.includes("#")) {
          const parts = sellerQ.split("#");
          const namePart = parts[0].trim();
          const idPart = parts[1]?.trim() || "";
          if (namePart && !ownerL.includes(namePart)) return false;
          if (idPart && !sid.includes(idPart)) return false;
        } else {
          if (!ownerL.includes(sellerQ) && !sid.includes(sellerQ)) return false;
        }
      }
      return true;
    });

    // Sort
    if (sortBy === "price-asc") items.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") items.sort((a, b) => b.price - a.price);
    else if (sortBy === "stock-asc")
      items.sort((a, b) => a.quantity - b.quantity);
    else if (sortBy === "stock-desc")
      items.sort((a, b) => b.quantity - a.quantity);
    else if (sortBy === "newest")
      items.sort((a, b) => new Date(b.listedDate) - new Date(a.listedDate));

    // Market Stats
    const allMarket = inventory.filter(
      (p) =>
        p.approved &&
        p.purpose !== "To Keep" &&
        p.quantity > 0,
    );
    const sellers = [...new Set(allMarket.map((p) => p.owner))].length;

    // Total sales revenue from activity logs
    const allLogs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
    let totalRevenue = 0;
    allLogs.forEach((l) => {
      if (!l.action.includes("Bought from Market")) return;
      const m = l.amountQty.match(/Total:\s*\$([0-9.]+)/i);
      if (m) totalRevenue += parseFloat(m[1]);
    });

    const totalEl = document.getElementById("mstat-total");
    if (totalEl) totalEl.textContent = allMarket.length;
    const sellersEl = document.getElementById("mstat-sellers");
    if (sellersEl) sellersEl.textContent = sellers;
    const salesEl = document.getElementById("mstat-sales");
    if (salesEl)
      salesEl.textContent =
        "$" +
        totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 });

    // Featured — sorted by most total units sold (from Admin Logs), then by stock
    const salesMap = buildSalesMap();
    const featuredEl = document.getElementById("market-featured");
    if (featuredEl) {
      const featured = [...allMarket]
        .map((p) => ({ ...p, totalSold: salesMap[p.name] || 0 }))
        .sort((a, b) => b.totalSold - a.totalSold || b.quantity - a.quantity)
        .slice(0, 5);

      featuredEl.innerHTML = featured.length
        ? featured
            .map((p, i) => {
              const rank = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i];
              const rating = salesToRating(p.totalSold);
              const soldLabel =
                p.totalSold > 0
                  ? `<div style="font-size:.7rem;color:#f39c12;margin-top:3px;">${p.totalSold} sold</div>`
                  : `<div style="font-size:.7rem;color:rgba(255,255,255,.35);margin-top:3px;">No sales yet</div>`;
              const catClass = getCategoryClass(p.category);
              return `
              <div class="featured-card ${catClass}" onclick="openMarketDetail(${p.id})">
                <span class="featured-badge">${rank} Top Seller</span>
                <div class="featured-name">${p.name}</div>
                <div class="featured-price">$${parseFloat(p.price).toFixed(2)}</div>
                <div style="font-size:.72rem;color:rgba(255,255,255,.45);">by ${p.owner || "System"}</div>
                ${soldLabel}
                <div style="margin-top:4px;font-size:.75rem;color:#f39c12;">${"★".repeat(Math.floor(parseFloat(rating)))}${parseFloat(rating) % 1 >= 0.5 ? "½" : ""} ${rating}</div>
              </div>`;
            })
            .join("")
        : `<p style="opacity:.4;font-size:.85rem;">No featured items yet.</p>`;
    }

    // Grid rendering
    marketGrid.innerHTML = "";
    if (items.length === 0) {
      marketGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:60px 40px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color:rgba(255,255,255,0.45); font-size:1rem; font-family:'Outfit',sans-serif;">❌ Walang nahanap na PC parts sa tindahan. Subukang baguhin ang filter o keyword!</div>`;
      return;
    }

    items.forEach((p) => {
      const isFav = favorites.includes(p.id);
      const isOwn = p.owner === currentUser;
      const sellerId = p.sellerId
        ? ` <span style="color:rgba(255,159,67,.6);font-size:.72rem;">#${p.sellerId}</span>`
        : "";
      const catClass = getCategoryClass(p.category);
      
      const card = document.createElement("div");
      card.className = `mkt-card ${catClass}`;
      
      card.innerHTML = `
        <div class="mkt-card-header">
          <span class="mkt-card-cat-badge font-bold">${p.category}</span>
          <span class="mkt-card-cond-badge ${COND_CLASS[p.condition] || "cond-good"} font-bold">
            ${COND_EMOJI[p.condition] || ""} ${p.condition}
          </span>
        </div>
        
        <h3 class="mkt-card-title font-bold" title="${p.name}">${p.name}</h3>
        
        <div class="mkt-card-meta">
          <span class="mkt-card-seller">👤 ${p.owner || "System"}${sellerId}</span>
          <span class="mkt-card-time">🕒 ${relativeDate(p.listedDate)}</span>
        </div>
        
        <p class="mkt-card-desc" title="${p.description || ""}">${p.description || "High quality desktop hardware catalog item listed on the global market."}</p>
        
        <div class="mkt-card-pricing-row">
          <div class="mkt-card-price-block">
            <span class="mkt-card-price-lbl">PRICE</span>
            <span class="mkt-card-price-val">$${parseFloat(p.price).toFixed(2)}</span>
          </div>
          <div class="mkt-card-stock-block">
            <div class="mkt-card-stock-status">${statusBadge(p.quantity)}</div>
            <div class="mkt-card-rating">${starsHtml(p.rating, p.totalSold)}</div>
          </div>
        </div>
        
        <div class="mkt-card-actions">
          <div class="mkt-card-row-1">
            <button class="mkt-card-btn btn-view" onclick="openMarketDetail(${p.id})">🔍 VIEW</button>
            ${
              isOwn || p.isSeed
                ? ""
                : `<button class="mkt-card-btn btn-cart" onclick="addToCart(${p.id})">＋ CART</button>`
            }
          </div>
          ${
            isOwn
              ? `<div class="mkt-card-own-badge">Your Listing</div>`
              : p.isSeed
                ? `<div class="mkt-card-own-badge" style="background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.08);">System Stock</div>`
                : `<button class="mkt-card-btn btn-buy-now" onclick="openBuyModal(${p.id})">⚡ BUY NOW</button>`
          }
        </div>
      `;
      marketGrid.appendChild(card);
    });

    saveInventory();
    updateCartBadge();
  };

  // Market filter/search listeners
  [
    "market-search",
    "market-filter-cat",
    "market-filter-sort",
    "market-filter-cond",
    "market-seller-search",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderMarket);
    document.getElementById(id)?.addEventListener("change", renderMarket);
  });

  // ── Profile Renderer ──────────────────────────────────────────────
  function renderProfile() {
    const container = document.getElementById("profile-content");
    if (!container) return;
    const currentUser = localStorage.getItem("currentUser") || "Unknown";
    const sellerId = localStorage.getItem("userPublicId") || "----";
    const inv = JSON.parse(localStorage.getItem("inventory") || "[]");
    const myItems = inv.filter((p) => p.owner === currentUser);
    const approved = myItems.filter((p) => p.approved).length;
    const pending = myItems.filter((p) => !p.approved).length;
    const forSale = myItems.filter((p) => p.purpose === "For Sale").length;
    const toKeep = myItems.filter((p) => p.purpose === "To Keep").length;

    const savedProfileImg = localStorage.getItem(`profile_pic_${currentUser}`) || "";
    // Fetch registered GCash if profileInfo.gcash doesn't exist yet
    const usersDb = JSON.parse(localStorage.getItem("users") || "{}");
    let registeredGcash = "N/A";
    for (const key in usersDb) {
      if (usersDb[key].name === currentUser) {
        registeredGcash = usersDb[key].gcash || "N/A";
        break;
      }
    }

    const profileInfo = JSON.parse(localStorage.getItem("profile_info_" + currentUser)) || {
      fullName: currentUser,
      gmail: currentUser.toLowerCase().replace(/\s+/g, "") + "@gmail.com",
      phone: "+63 900 000 0000",
      location: "Manila, Philippines",
      gcash: registeredGcash
    };

    if (!profileInfo.gcash) {
      profileInfo.gcash = registeredGcash;
    }

    const lastLogin = localStorage.getItem(`last_login_${currentUser}`) || "";
    const lastLogout = localStorage.getItem(`last_logout_${currentUser}`) || "";

    const formatSessionDate = (isoString) => {
      if (!isoString) return "No record yet";
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const formatSessionTimeOnly = (isoString) => {
      if (!isoString) return "N/A";
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    const loginDate = formatSessionDate(lastLogin);
    const loginTime = formatSessionTimeOnly(lastLogin);
    const logoutDate = formatSessionDate(lastLogout);
    const logoutTime = formatSessionTimeOnly(lastLogout);

    // Build Connection History table logs
    const sessionLogs = JSON.parse(localStorage.getItem(`session_history_${currentUser}`)) || [];
    let sessionRows = "";
    if (sessionLogs.length === 0) {
      sessionRows = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: rgba(255,255,255,0.4)">No session history logs recorded yet.</td></tr>`;
    } else {
      sessionLogs.forEach((log, index) => {
        const date = new Date(log.time);
        const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const formattedTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const badge = log.type === "Login"
          ? `<span style="background:rgba(46,204,113,0.12); color:#2ecc71; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.75rem; border:1px solid rgba(46,204,113,0.25)">🟢 Login</span>`
          : `<span style="background:rgba(231,76,60,0.12); color:#e74c3c; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.75rem; border:1px solid rgba(231,76,60,0.25)">🔴 Logout</span>`;

        // Limit cascading delay to top 15 records to prevent performance lag
        const rowDelay = Math.min(0.4 + index * 0.05, 1.2);
        sessionRows += `
          <tr class="profile-row-anim" style="animation-delay: ${rowDelay}s;">
            <td style="font-weight:600; color:white;">${badge}</td>
            <td style="color:rgba(255,255,255,0.85);">${formattedDate}</td>
            <td style="color:rgba(255,255,255,0.85);">${formattedTime}</td>
          </tr>
        `;
      });
    }

    // Compute Sales
    const allLogs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
    let myTotalEarnings = 0;
    let myItemsSold = 0;
    const mySalesLogs = [];

    allLogs.forEach((l) => {
      if (!l.action.includes("Bought from Market")) return;
      const sellerMatch = l.amountQty.match(/Seller:\s*([^|]+)/i);
      if (sellerMatch && sellerMatch[1].trim() === currentUser) {
        const qtyMatch = l.amountQty.match(/Qty:\s*(\d+)/i);
        const totalMatch = l.amountQty.match(/Total:\s*\$([0-9.]+)/i);
        
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
        const total = totalMatch ? parseFloat(totalMatch[1]) : 0;
        
        myTotalEarnings += total;
        myItemsSold += qty;

        mySalesLogs.push({
          date: new Date(l.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          itemName: l.itemName || "N/A",
          qty: qty,
          total: total,
          buyer: l.user || "Unknown"
        });
      }
    });

    let salesRows = "";
    if (mySalesLogs.length === 0) {
      salesRows = `<tr><td colspan="5" style="text-align:center;padding:20px;opacity:.5;">No sales yet.</td></tr>`;
    } else {
      mySalesLogs.forEach((s, index) => {
        const rowDelay = Math.min(0.35 + index * 0.05, 1.2);
        salesRows += `
          <tr class="profile-row-anim" style="animation-delay: ${rowDelay}s;">
            <td style="font-size:.78rem;opacity:.65;">${s.date}</td>
            <td><strong>${s.itemName}</strong></td>
            <td style="color:#4facfe;">${s.buyer}</td>
            <td style="text-align:center;font-weight:600;">${s.qty}</td>
            <td style="color:#96c93d;font-weight:700;">$${s.total.toFixed(2)}</td>
          </tr>
        `;
      });
    }

    const isAdmin = currentUser === "Admin Richard" || localStorage.getItem("isAdminSession") === "true";

    const roleBadge = isAdmin
      ? `<span style="background:rgba(255,79,79,0.15);color:#ff4f4f;padding:2px 8px;border-radius:20px;font-size:0.68rem;font-weight:700;border:1px solid rgba(255,79,79,0.25);">SYS ADMIN</span>`
      : `<span style="background:rgba(79,172,254,0.15);color:#00f2fe;padding:2px 8px;border-radius:20px;font-size:0.68rem;font-weight:700;border:1px solid rgba(79,172,254,0.25);">PRO SELLER</span>`;

    const adminBadgeOrSellerId = isAdmin
      ? `<div style="text-align:center;padding:16px 24px;background:linear-gradient(135deg, rgba(255,79,79,0.12), rgba(255,79,79,0.03));border:1px solid rgba(255,79,79,0.25);border-radius:18px;box-shadow:0 0 20px rgba(255,79,79,0.08);flex-shrink:0;">
            <div style="color:#ff4f4f;font-size:1.5rem;font-weight:900;letter-spacing:1px;font-family:'Outfit',sans-serif;text-transform:uppercase;">MASTER</div>
            <div style="color:rgba(255,255,255,.6);font-size:.72rem;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">System Role</div>
          </div>`
      : `<div style="text-align:center;padding:16px 24px;background:linear-gradient(135deg, rgba(255,159,67,0.12), rgba(255,159,67,0.03));border:1px solid rgba(255,159,67,0.25);border-radius:18px;box-shadow:0 0 20px rgba(255,159,67,0.08);flex-shrink:0;">
            <div style="color:#ff9f43;font-size:1.75rem;font-weight:900;letter-spacing:1px;font-family:'Outfit',sans-serif;">#${sellerId}</div>
            <div style="color:rgba(255,255,255,.6);font-size:.72rem;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Seller ID</div>
          </div>`;

    let statCardsHtml = "";
    if (isAdmin) {
      const usersDbForStats = JSON.parse(localStorage.getItem("users") || "{}");
      const adminTotalUsers = Object.keys(usersDbForStats).length;
      const invForStats = JSON.parse(localStorage.getItem("inventory") || "[]");
      const adminTotalProducts = invForStats.length;
      const allPurchasesForStats = JSON.parse(localStorage.getItem("purchases") || "[]");
      const adminTotalSalesCount = allPurchasesForStats.length;
      const adminTotalSystemEarnings = allPurchasesForStats.reduce((acc, p) => acc + (p.price || 0) * (p.qty || 1), 0);

      statCardsHtml = `
        <!-- Sales stat cards (Admin) -->
        <div class="dashboard-card profile-stat-card" style="text-align:center;background:linear-gradient(135deg, rgba(231,76,60,0.15), rgba(231,76,60,0.02));border-color:rgba(231,76,60,0.3);border-left:4px solid #e74c3c;box-shadow:0 12px 30px -10px rgba(231,76,60,0.2); animation-delay: 0.05s; display: flex; flex-direction: column; justify-content: center; padding: 20px; border-radius: 18px;">
          <h3 style="color:#e74c3c;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;font-family:'Outfit',sans-serif;font-size:1.05rem;margin:0;">🌐 Total System Users</h3>
          <p class="stat-num" style="color:#e74c3c !important;font-size:2.3rem;font-family:'Outfit',sans-serif;font-weight:800;text-shadow:0 0 10px rgba(231,76,60,0.25);margin:8px 0 0 0;">${adminTotalUsers}</p>
        </div>
        <div class="dashboard-card profile-stat-card" style="text-align:center;background:linear-gradient(135deg, rgba(0,242,254,0.15), rgba(0,242,254,0.02));border-color:rgba(0,242,254,0.3);border-left:4px solid #00f2fe;box-shadow:0 12px 30px -10px rgba(0,242,254,0.2); animation-delay: 0.1s; display: flex; flex-direction: column; justify-content: center; padding: 20px; border-radius: 18px;">
          <h3 style="color:#00f2fe;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;font-family:'Outfit',sans-serif;font-size:1.05rem;margin:0;">📦 Total System Products</h3>
          <p class="stat-num" style="color:#00f2fe !important;font-size:2.3rem;font-family:'Outfit',sans-serif;font-weight:800;text-shadow:0 0 10px rgba(0,242,254,0.25);margin:8px 0 0 0;">${adminTotalProducts}</p>
        </div>

        <!-- Inventory Stat cards (Grid compact layout) -->
        <div style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 5px;">
          <div class="dashboard-card profile-stat-card" style="text-align:center;padding:15px;background:linear-gradient(135deg, rgba(46,204,113,0.1), rgba(46,204,113,0.01));border:1px solid rgba(46,204,113,0.18);border-left:3px solid #2ecc71; animation-delay: 0.12s;box-shadow:0 8px 20px rgba(46,204,113,0.15); border-radius: 12px;">
            <div style="color:#2ecc71;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">📈 Total System Sales</div>
            <p style="font-size:1.7rem;font-weight:800;color:white;margin:0;font-family:'Outfit',sans-serif;">$${adminTotalSystemEarnings.toFixed(2)}</p>
          </div>
          <div class="dashboard-card profile-stat-card" style="text-align:center;padding:15px;background:linear-gradient(135deg, rgba(155,89,182,0.1), rgba(155,89,182,0.01));border:1px solid rgba(155,89,182,0.18);border-left:3px solid #9b59b6; animation-delay: 0.22s; box-shadow: 0 8px 20px rgba(155,89,182,0.15); border-radius: 12px;">
            <div style="color:#ba68c8;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">🛍️ Total Sales Count</div>
            <p style="font-size:1.7rem;font-weight:800;color:#ba68c8;margin:0;font-family:'Outfit',sans-serif;">${adminTotalSalesCount}</p>
          </div>
        </div>
      `;
    } else {
      statCardsHtml = `
        <!-- Sales stat cards (new) -->
        <div class="dashboard-card profile-stat-card" style="text-align:center;background:linear-gradient(135deg, rgba(46,204,113,0.15), rgba(46,204,113,0.02));border-color:rgba(46,204,113,0.3);border-left:4px solid #2ecc71;box-shadow:0 12px 30px -10px rgba(46,204,113,0.2); animation-delay: 0.05s;">
          <h3 style="color:#2ecc71;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;font-family:'Outfit',sans-serif;font-size:1.05rem;">💰 Total Earnings</h3>
          <p class="stat-num" style="color:#2ecc71 !important;font-size:2.3rem;font-family:'Outfit',sans-serif;font-weight:800;text-shadow:0 0 10px rgba(46,204,113,0.25);margin-top:8px;">$${myTotalEarnings.toFixed(2)}</p>
        </div>
        <div class="dashboard-card profile-stat-card" style="text-align:center;background:linear-gradient(135deg, rgba(0,242,254,0.15), rgba(0,242,254,0.02));border-color:rgba(0,242,254,0.3);border-left:4px solid #00f2fe;box-shadow:0 12px 30px -10px rgba(0,242,254,0.2); animation-delay: 0.1s;">
          <h3 style="color:#00f2fe;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;font-family:'Outfit',sans-serif;font-size:1.05rem;">🛒 Items Sold</h3>
          <p class="stat-num" style="color:#00f2fe !important;font-size:2.3rem;font-family:'Outfit',sans-serif;font-weight:800;text-shadow:0 0 10px rgba(0,242,254,0.25);margin-top:8px;">${myItemsSold}</p>
        </div>

        <!-- Inventory Stat cards (Grid compact layout) -->
        <div style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 5px;">
          <div class="dashboard-card profile-stat-card" style="text-align:center;padding:15px;background:linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.06);border-left:3px solid rgba(255,255,255,0.4); animation-delay: 0.12s;box-shadow:0 8px 20px rgba(0,0,0,0.15);">
            <div style="color:rgba(255,255,255,0.55);font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Total Listed</div>
            <p style="font-size:1.7rem;font-weight:800;color:white;margin:0;font-family:'Outfit',sans-serif;">${myItems.length}</p>
          </div>
          <div class="dashboard-card profile-stat-card" style="text-align:center;padding:15px;background:linear-gradient(135deg, rgba(155,89,182,0.1), rgba(155,89,182,0.01));border:1px solid rgba(155,89,182,0.18);border-left:3px solid #9b59b6; animation-delay: 0.22s; box-shadow: 0 8px 20px rgba(155,89,182,0.15);">
            <div style="color:#ba68c8;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">📦 To Keep</div>
            <p style="font-size:1.7rem;font-weight:800;color:#ba68c8;margin:0;font-family:'Outfit',sans-serif;">${toKeep}</p>
          </div>
        </div>
      `;
    }

    let salesHistoryHtml = "";
    if (!isAdmin) {
      salesHistoryHtml = `
      <!-- My Sales History -->
      <div class="profile-history-card" style="max-width:680px;margin-top:28px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; animation-delay: 0.35s;">
        <h2 style="font-size:1.2rem;margin-bottom:14px;font-family:'Outfit',sans-serif;font-weight:800;color:white;display:flex;align-items:center;gap:8px;">📊 My Sales History</h2>
        <div class="table-container" style="max-height: 300px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Buyer</th>
                <th style="text-align:center;">Qty</th>
                <th>Total Earned</th>
              </tr>
            </thead>
            <tbody>
              ${salesRows}
            </tbody>
          </table>
        </div>
      </div>
      `;
    }

    container.innerHTML = `
      <style>
        /* 1. 3D Perspective card configurations & tilting */
        .profile-identity-card {
          transform-style: preserve-3d;
          perspective: 1000px;
          animation: profileFloat 8s ease-in-out infinite alternate;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .profile-identity-card:hover {
          border-color: rgba(0, 242, 254, 0.45) !important;
          box-shadow: 0 30px 60px rgba(0, 242, 254, 0.22) !important;
          transform: translateY(-4px) rotateX(1.5deg) rotateY(-0.8deg);
        }
        .profile-stat-card {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: profileCardEntrance 0.78s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .profile-stat-card:hover {
          transform: translateY(-8px) scale(1.025);
          box-shadow: 0 18px 35px rgba(0, 242, 254, 0.18) !important;
        }
        .profile-details-card {
          transform-style: preserve-3d;
          perspective: 1000px;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: profileCardEntrance 0.88s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .profile-details-card:hover {
          border-color: rgba(168, 85, 247, 0.45) !important;
          box-shadow: 0 30px 60px rgba(168, 85, 247, 0.22) !important;
          transform: translateY(-4px) rotateX(1deg) rotateY(-0.5deg);
        }
        .profile-history-card {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: profileCardEntrance 0.98s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .profile-history-card:hover {
          border-color: rgba(0, 242, 254, 0.35) !important;
          box-shadow: 0 25px 50px rgba(0, 242, 254, 0.18) !important;
          transform: translateY(-4px);
        }
        .profile-row-anim {
          animation: rowSlideIn 0.58s cubic-bezier(0.16, 1, 0.3, 1) both;
          opacity: 0;
        }

        /* 2. Glass-Pill Capsule Shimmer Scanline styling */
        .profile-pill-capsule {
          position: relative;
          overflow: hidden;
        }
        .profile-pill-capsule::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
          background-size: 200% 100%;
          animation: pillShimmerSweep 8s infinite linear;
          pointer-events: none;
        }

        @keyframes pillShimmerSweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* 3. Avatar Cyber lock ring breathing glow keyframes */
        @keyframes avatarLockBreathing {
          0%, 100% {
            transform: rotate(0deg) scale(1);
            border-color: rgba(79, 172, 254, 0.5);
            box-shadow: 0 0 12px rgba(79, 172, 254, 0.15);
          }
          50% {
            transform: rotate(180deg) scale(1.03);
            border-color: rgba(168, 85, 247, 0.8);
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.4);
          }
        }

        @keyframes rotateDashed {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes profileFloat {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-7px) rotate(0.4deg); }
        }
        @keyframes profileCardEntrance {
          from {
            opacity: 0;
            transform: translateY(35px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      </style>

      <!-- Identity card (full width) -->
      <div class="dashboard-card profile-identity-card" style="grid-column:1/-1;display:flex;align-items:center;gap:24px;padding:26px;background:linear-gradient(135deg, rgba(13,10,31,0.6), rgba(15,23,42,0.45));border:1px solid rgba(255,255,255,0.08);box-shadow:0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);border-radius:20px;backdrop-filter:blur(10px);">
          <div style="position:relative;width:80px;height:80px;display:flex;justify-content:center;align-items:center;flex-shrink:0;">
            <!-- Rotating Dashed Cyber Ring -->
            <div style="position:absolute;width:80px;height:80px;border:1.5px dashed rgba(79, 172, 254, 0.6);border-radius:50%;animation:avatarLockBreathing 6s ease-in-out infinite;box-shadow:0 0 15px rgba(79,172,254,0.15);"></div>
            <div title="Click to upload profile picture" onclick="document.getElementById('profile-upload-input').click()" style="position:relative;width:66px;height:66px;border-radius:50%;background:linear-gradient(135deg,#4facfe,#a855f7);display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:800;color:white;cursor:pointer;overflow:hidden;border:2px solid rgba(255,255,255,0.1);box-shadow:0 0 15px rgba(79, 172, 254, 0.25);transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
              <img id="profile-img-preview" src="${savedProfileImg}" style="width:100%;height:100%;object-fit:cover;display:${savedProfileImg ? 'block' : 'none'};" alt="">
              <span id="profile-img-initial" style="display:${savedProfileImg ? 'none' : 'block'};font-family:'Outfit',sans-serif;">${currentUser.charAt(0).toUpperCase()}</span>
              <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.65);color:white;font-size:0.55rem;text-align:center;padding:2px 0;font-weight:700;letter-spacing:0.05em;">EDIT</div>
            </div>
          </div>
          <div style="flex:1;">
            <div style="font-size:1.45rem;font-weight:800;color:white;font-family:'Outfit',sans-serif;letter-spacing:-0.3px;display:flex;align-items:center;gap:8px;">${currentUser} ${roleBadge}</div>
            <div style="color:rgba(255,255,255,.5);font-size:.82rem;margin-top:4px;display:flex;align-items:center;gap:4px;">💼 Registered Account Partner</div>
          </div>
          ${adminBadgeOrSellerId}
        </div>

        ${statCardsHtml}

        <!-- Seller Info Card (Full Width) -->
        <div class="dashboard-card profile-details-card" style="grid-column:1/-1; background:linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(79, 172, 254, 0.05)); border:1px solid rgba(168, 85, 247, 0.15); border-radius:20px; padding:24px; position:relative; box-shadow:0 10px 30px rgba(0,0,0,0.25); animation-delay: 0.25s;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; margin-bottom:16px;">
            <h3 style="margin:0; font-size:1.1rem; color:#a855f7; display:flex; align-items:center; gap:8px; font-family:'Outfit',sans-serif; font-weight:800;">
              👤 Personal Profile Details & Session logs
            </h3>
            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.4);">Only visible to you</span>
          </div>

          <!-- View Mode -->
          <div id="profile-info-view-mode" style="display: block;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div>
                <label style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">👤 Full Name</label>
                <div id="info-lbl-fullname" class="profile-pill-capsule" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-left:3px solid #a855f7; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:white; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                  👤 ${profileInfo.fullName}
                </div>
              </div>
              <div>
                <label style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">📧 Gmail Address</label>
                <div id="info-lbl-gmail" class="profile-pill-capsule" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-left:3px solid #4facfe; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:white; font-size:0.9rem; display:flex; align-items:center; gap:8px; word-break:break-all;">
                  📧 ${profileInfo.gmail}
                </div>
              </div>
              <div>
                <label style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">📞 Phone Number</label>
                <div id="info-lbl-phone" class="profile-pill-capsule" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-left:3px solid #ec4899; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:white; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                  📞 ${profileInfo.phone}
                </div>
              </div>
              <div>
                <label style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">📍 Location</label>
                <div id="info-lbl-location" class="profile-pill-capsule" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-left:3px solid #ff9f43; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:white; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                  📍 ${profileInfo.location}
                </div>
              </div>
              <div>
                <label style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">💸 GCash Number</label>
                <div id="info-lbl-gcash" class="profile-pill-capsule" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-left:3px solid #00f2fe; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:white; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                  💸 ${profileInfo.gcash || "N/A"}
                </div>
              </div>
              <!-- Session Tracking Logs -->
              <div>
                <label style="font-size:0.75rem; color:rgba(46,204,113,0.5); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">🟢 Last Login Date</label>
                <div id="info-lbl-login-date" class="profile-pill-capsule" style="background:rgba(46,204,113,0.03); border:1px solid rgba(46,204,113,0.1); border-left:3px solid #2ecc71; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:#2ecc71; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                  📅 ${loginDate}
                </div>
              </div>
              <div>
                <label style="font-size:0.75rem; color:rgba(46,204,113,0.5); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">🟢 Last Login Time</label>
                <div id="info-lbl-login-time" class="profile-pill-capsule" style="background:rgba(46,204,113,0.03); border:1px solid rgba(46,204,113,0.1); border-left:3px solid #2ecc71; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:#2ecc71; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                  ⏰ ${loginTime}
                </div>
              </div>
              <div>
                <label style="font-size:0.75rem; color:rgba(231,76,60,0.5); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">🔴 Last Logout Date</label>
                <div id="info-lbl-logout-date" class="profile-pill-capsule" style="background:rgba(231,76,60,0.03); border:1px solid rgba(231,76,60,0.1); border-left:3px solid #e74c3c; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:#e74c3c; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                  📅 ${logoutDate}
                </div>
              </div>
              <div>
                <label style="font-size:0.75rem; color:rgba(231,76,60,0.5); text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">🔴 Last Logout Time</label>
                <div id="info-lbl-logout-time" class="profile-pill-capsule" style="background:rgba(231,76,60,0.03); border:1px solid rgba(231,76,60,0.1); border-left:3px solid #e74c3c; padding:10px 14px; border-radius:10px; margin-top:6px; font-weight:700; color:#e74c3c; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                  ⏰ ${logoutTime}
                </div>
              </div>
            </div>
            <button class="action-btn btn-edit" onclick="window.toggleProfileInfoEdit(true)" style="margin-top:20px; width:100%; padding:12px; border-radius:12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:white; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Outfit',sans-serif; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
              ✏️ Edit Profile Info
            </button>
          </div>

          <!-- Edit Mode -->
          <div id="profile-info-edit-mode" style="display: none;">
            <div style="display:flex; flex-direction:column; gap:16px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div>
                  <label style="font-size:0.75rem; color:rgba(255,255,255,0.5); font-weight:700; margin-bottom:6px; display:block;">👤 Full Name</label>
                  <input type="text" id="info-ipt-fullname" class="search-input" style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.12); box-sizing:border-box;" value="${profileInfo.fullName}">
                </div>
                <div>
                  <label style="font-size:0.75rem; color:rgba(255,255,255,0.5); font-weight:700; margin-bottom:6px; display:block;">📧 Gmail Address</label>
                  <input type="email" id="info-ipt-gmail" class="search-input" style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.12); box-sizing:border-box;" value="${profileInfo.gmail}">
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div>
                  <label style="font-size:0.75rem; color:rgba(255,255,255,0.5); font-weight:700; margin-bottom:6px; display:block;">📞 Phone Number</label>
                  <input type="text" id="info-ipt-phone" class="search-input" style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.12); box-sizing:border-box;" value="${profileInfo.phone}">
                </div>
                <div>
                  <label style="font-size:0.75rem; color:rgba(255,255,255,0.5); font-weight:700; margin-bottom:6px; display:block;">📍 Location</label>
                  <input type="text" id="info-ipt-location" class="search-input" style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.12); box-sizing:border-box;" value="${profileInfo.location}">
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr; gap:16px;">
                <div>
                  <label style="font-size:0.75rem; color:rgba(255,255,255,0.5); font-weight:700; margin-bottom:6px; display:block;">💸 GCash Number</label>
                  <input type="tel" id="info-ipt-gcash" class="search-input" style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.12); box-sizing:border-box;" value="${profileInfo.gcash || ''}" placeholder="09xxxxxxxxx">
                </div>
              </div>
            </div>
            <div style="display:flex; gap:10px; margin-top:20px;">
              <button class="action-btn btn-delete" onclick="window.toggleProfileInfoEdit(false)" style="flex:1; padding:10px; border-radius:10px; font-weight:700; cursor:pointer;">
                ❌ Cancel
              </button>
              <button class="action-btn" onclick="window.saveProfileInfo()" style="flex:2; padding:10px; border-radius:10px; background:linear-gradient(135deg, #00f2fe, #4facfe); border:none; color:white; font-weight:700; cursor:pointer;">
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- How to search tip -->
      <div style="max-width:680px;margin-top:24px;background:linear-gradient(135deg, rgba(0, 242, 254, 0.05), rgba(168, 85, 247, 0.05));border:1px solid rgba(0, 242, 254, 0.15);border-radius:16px;padding:16px 20px;box-shadow:0 8px 30px rgba(0,0,0,0.2);">
        <div style="color:#00f2fe;font-weight:700;font-size:.88rem;margin-bottom:6px;display:flex;align-items:center;gap:6px;font-family:'Outfit',sans-serif;">🔍 Quick Seller Search Guide</div>
        <div style="color:rgba(255,255,255,.55);font-size:.82rem;line-height:1.7;">
          In the <strong style="color:white;">Global Market</strong>, use the Seller search input to filter your listings.<br>
          Type your name: <code style="background:rgba(255,255,255,0.08);color:#00f2fe;padding:2px 8px;border-radius:6px;font-family:monospace;font-size:0.78rem;border:1px solid rgba(255,255,255,0.05);">${currentUser}</code>&nbsp;&nbsp;
          or your public ID: <code style="background:rgba(255,255,255,0.08);color:#ff9f43;padding:2px 8px;border-radius:6px;font-family:monospace;font-size:0.78rem;border:1px solid rgba(255,255,255,0.05);">#${sellerId}</code>
        </div>
      </div>

      ${salesHistoryHtml}

      <!-- Login & Logout Connection Session History Table -->
      <div class="profile-history-card" style="max-width:680px;margin-top:28px;margin-bottom:20px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; animation-delay: 0.4s;">
        <h2 style="font-size:1.2rem;margin-bottom:14px;font-family:'Outfit',sans-serif;font-weight:800;color:white;display:flex;align-items:center;gap:8px;">🕒 Login & Logout Session History</h2>
        <div class="table-container" style="max-height: 300px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${sessionRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ── Profile Slogan & Biography Save Logic ─────────────────────
  window.toggleProfileInfoEdit = function(showEdit) {
    const viewDiv = document.getElementById("profile-info-view-mode");
    const editDiv = document.getElementById("profile-info-edit-mode");
    if (viewDiv && editDiv) {
      viewDiv.style.display = showEdit ? "none" : "block";
      editDiv.style.display = showEdit ? "block" : "none";
    }
  };

  window.saveProfileInfo = function() {
    const currentUser = localStorage.getItem("currentUser") || "Unknown";
    const fullName = document.getElementById("info-ipt-fullname")?.value.trim() || currentUser;
    const gmail = document.getElementById("info-ipt-gmail")?.value.trim() || (currentUser.toLowerCase().replace(/\s+/g, "") + "@gmail.com");
    const phone = document.getElementById("info-ipt-phone")?.value.trim() || "+63 900 000 0000";
    const location = document.getElementById("info-ipt-location")?.value.trim() || "Manila, Philippines";
    const gcash = document.getElementById("info-ipt-gcash")?.value.trim() || "N/A";

    const newInfo = { fullName, gmail, phone, location, gcash };
    localStorage.setItem("profile_info_" + currentUser, JSON.stringify(newInfo));

    // Refresh labels instantly without complete reload!
    const lblFullName = document.getElementById("info-lbl-fullname");
    const lblGmail = document.getElementById("info-lbl-gmail");
    const lblPhone = document.getElementById("info-lbl-phone");
    const lblLocation = document.getElementById("info-lbl-location");
    const lblGcash = document.getElementById("info-lbl-gcash");

    if (lblFullName) lblFullName.textContent = "👤 " + fullName;
    if (lblGmail) lblGmail.textContent = "📧 " + gmail;
    if (lblPhone) lblPhone.textContent = "📞 " + phone;
    if (lblLocation) lblLocation.textContent = "📍 " + location;
    if (lblGcash) lblGcash.textContent = "💸 " + gcash;

    // Sync back to users database
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    for (const key in users) {
      if (users[key].name === currentUser) {
        users[key].gcash = gcash;
        localStorage.setItem("users", JSON.stringify(users));
        break;
      }
    }

    // Log activity
    logActivity("Updated Profile Bio Info", {
      name: currentUser,
      supplier: fullName,
      amountQty: "Contact details & GCash updated",
    });

    window.toggleProfileInfoEdit(false);
    alert("Profile information saved successfully!");
  };

  // View Details Redesigned with Category Animations
  window.openMarketDetail = function (id) {
    const p = inventory.find((p) => p.id == id);
    if (!p) return;
    enrichProduct(p);

    const modalContent = document.querySelector("#market-detail-modal .modal-content");
    if (modalContent) {
      modalContent.className = "modal-content detail-modal-split " + getCategoryClass(p.category);
    }

    // Set standard detail fields
    if (document.getElementById("detail-title")) {
      document.getElementById("detail-title").textContent = p.name;
    }
    if (document.getElementById("detail-name")) {
      document.getElementById("detail-name").textContent = p.name;
    }
    if (document.getElementById("detail-item-name")) {
      document.getElementById("detail-item-name").textContent = p.name;
    }
    if (document.getElementById("detail-category")) {
      document.getElementById("detail-category").textContent = p.category;
    }
    if (document.getElementById("detail-category-badge")) {
      document.getElementById("detail-category-badge").textContent = p.category;
    }
    if (document.getElementById("detail-seller")) {
      document.getElementById("detail-seller").textContent = p.owner || "System";
    }
    if (document.getElementById("detail-pane-seller")) {
      document.getElementById("detail-pane-seller").textContent = p.owner || "System";
    }
    
    const condHtml = `<span class="cond-badge ${COND_CLASS[p.condition] || "cond-good"}">${COND_EMOJI[p.condition] || ""} ${p.condition}</span>`;
    if (document.getElementById("detail-condition")) {
      document.getElementById("detail-condition").innerHTML = condHtml;
    }
    
    // Set left pane condition badge
    const paneBadge = document.getElementById("detail-pane-badge");
    if (paneBadge) {
      paneBadge.className = "pane-badge font-bold cond-badge " + (COND_CLASS[p.condition] || "cond-good");
      paneBadge.innerHTML = (COND_EMOJI[p.condition] || "") + " " + p.condition;
    }

    const priceText = "$" + parseFloat(p.price).toFixed(2);
    if (document.getElementById("detail-price")) {
      document.getElementById("detail-price").textContent = priceText;
    }
    if (document.getElementById("detail-pane-price")) {
      document.getElementById("detail-pane-price").textContent = priceText;
    }

    const stockHtml = statusBadge(p.quantity);
    if (document.getElementById("detail-stock")) {
      document.getElementById("detail-stock").innerHTML = stockHtml;
    }
    if (document.getElementById("detail-pane-stock")) {
      document.getElementById("detail-pane-stock").innerHTML = stockHtml;
    }

    const supplierText = p.supplier || "N/A";
    if (document.getElementById("detail-supplier")) {
      document.getElementById("detail-supplier").textContent = supplierText;
    }
    if (document.getElementById("detail-pane-supplier")) {
      document.getElementById("detail-pane-supplier").textContent = supplierText;
    }

    const descText = p.description || "No description available.";
    if (document.getElementById("detail-description")) {
      document.getElementById("detail-description").textContent = descText;
    }
    if (document.getElementById("detail-overview-text")) {
      document.getElementById("detail-overview-text").textContent = descText;
    }

    const listedText = new Date(p.listedDate).toLocaleDateString();
    if (document.getElementById("detail-listed")) {
      document.getElementById("detail-listed").textContent = listedText;
    }
    if (document.getElementById("detail-listed-date")) {
      document.getElementById("detail-listed-date").textContent = "Listed " + listedText;
    }

    const ratingHtml = starsHtml(p.rating, p.totalSold || 0);
    if (document.getElementById("detail-rating")) {
      document.getElementById("detail-rating").innerHTML = ratingHtml;
    }

    // Set Animated Icon based on category
    const animIconContainer = document.getElementById("detail-animated-icon");
    if (animIconContainer) {
      animIconContainer.innerHTML = getAnimatedIconHtml(p.category);
    }

    // Admin Fields
    const isAdmin = localStorage.getItem("isAdminSession") === "true";
    const costCard = document.getElementById("admin-detail-cost-card");
    const profitCard = document.getElementById("admin-detail-profit-card");
    if (costCard && profitCard) {
      if (isAdmin) {
        costCard.style.display = "block";
        profitCard.style.display = "block";
        const costVal = parseFloat(p.costPrice || 0);
        const priceVal = parseFloat(p.price || 0);
        const netProfit = priceVal - costVal;
        const profitMargin = priceVal > 0 ? Math.round((netProfit / priceVal) * 100) : 0;
        
        const costTextEl = document.getElementById("detail-pane-cost");
        const profitTextEl = document.getElementById("detail-pane-profit");
        if (costTextEl) costTextEl.textContent = "$" + costVal.toFixed(2);
        if (profitTextEl) profitTextEl.textContent = "$" + netProfit.toFixed(2) + " (" + profitMargin + "%)";
      } else {
        costCard.style.display = "none";
        profitCard.style.display = "none";
      }
    }

    const buyBtn = document.getElementById("detail-buy-btn");
    if (buyBtn) {
      buyBtn.onclick = () => {
        document.getElementById("market-detail-modal").classList.add("hidden");
        openBuyModal(id);
      };
    }

    document.getElementById("market-detail-modal").classList.remove("hidden");
  };

  // ── Sales History Modal ─────────────────────────────────────────
  window.openSalesHistoryModal = function () {
    const allLogs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
    // Use "Bought from Market" entries — they have Seller info
    const saleLogs = allLogs
      .filter((l) => l.action.includes("Bought from Market"))
      .reverse();

    const tbody = document.getElementById("sales-history-tbody");
    const summaryEl = document.getElementById("sales-summary");
    if (!tbody || !summaryEl) return;

    let totalRevenue = 0;
    let totalQty = 0;

    tbody.innerHTML = "";

    if (saleLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;opacity:.4;font-size:.9rem;">No sales recorded yet.</td></tr>`;
    } else {
      saleLogs.forEach((log) => {
        const qtyMatch = log.amountQty.match(/Qty:\s*(\d+)/i);
        const totalMatch = log.amountQty.match(/Total:\s*\$([0-9.]+)/i);
        const sellerMatch = log.amountQty.match(/Seller:\s*([^|]+)/i);

        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
        const total = totalMatch ? parseFloat(totalMatch[1]) : 0;
        const seller = sellerMatch ? sellerMatch[1].trim() : "System";
        const buyer = log.user || "Unknown";
        const date = new Date(log.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        totalRevenue += total;
        totalQty += qty;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-size:.78rem;opacity:.65;">${date}</td>
          <td><strong style="font-size:.88rem;">${log.itemName || "N/A"}</strong></td>
          <td style="color:#ff9f43;font-weight:600;">${seller}</td>
          <td style="color:#4facfe;">${buyer}</td>
          <td style="text-align:center;font-weight:600;">${qty}</td>
          <td style="color:#96c93d;font-weight:700;">$${total.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    summaryEl.innerHTML = `
      <div style="background:rgba(150,201,61,.12);border:1px solid rgba(150,201,61,.3);border-radius:10px;padding:10px 18px;text-align:center;min-width:120px;">
        <div style="color:#96c93d;font-size:1.15rem;font-weight:800;">$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        <div style="color:rgba(255,255,255,.45);font-size:.73rem;margin-top:2px;">Total Revenue</div>
      </div>
      <div style="background:rgba(79,172,254,.12);border:1px solid rgba(79,172,254,.3);border-radius:10px;padding:10px 18px;text-align:center;min-width:120px;">
        <div style="color:#4facfe;font-size:1.15rem;font-weight:800;">${saleLogs.length}</div>
        <div style="color:rgba(255,255,255,.45);font-size:.73rem;margin-top:2px;">Transactions</div>
      </div>
      <div style="background:rgba(255,159,67,.12);border:1px solid rgba(255,159,67,.3);border-radius:10px;padding:10px 18px;text-align:center;min-width:120px;">
        <div style="color:#ff9f43;font-size:1.15rem;font-weight:800;">${totalQty}</div>
        <div style="color:rgba(255,255,255,.45);font-size:.73rem;margin-top:2px;">Units Sold</div>
      </div>
    `;

    document.getElementById("sales-history-modal").classList.remove("hidden");
  };

  // Close sales history on backdrop
  document
    .getElementById("sales-history-modal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) this.classList.add("hidden");
    });

  // Favorites
  window.toggleFav = function (id, btn) {
    if (favorites.includes(id)) {
      favorites = favorites.filter((f) => f !== id);
      btn.textContent = "🤍";
      btn.classList.remove("favorited");
    } else {
      favorites.push(id);
      btn.textContent = "❤️";
      btn.classList.add("favorited");
    }
    saveFavs();
  };

  // Cart
  window.addToCart = function (id) {
    const p = inventory.find((p) => p.id == id);
    if (!p) return;
    const existing = cart.find((c) => c.id == id);
    if (existing) {
      existing.qty = Math.min(existing.qty + 1, p.quantity);
    } else {
      cart.push({
        id: p.id,
        name: p.name,
        price: p.price,
        seller: p.owner || "System",
        category: p.category,
        qty: 1,
        maxQty: p.quantity,
      });
    }
    saveCart();
    // Mini flash feedback
    const btn = document.querySelector(
      `.mkt-btn-cart[onclick="addToCart(${id})"]`,
    );
    if (btn) {
      btn.textContent = "✅ Added";
      setTimeout(() => {
        btn.textContent = "＋ Cart";
      }, 1200);
    }
  };

  window.openCartModal = function () {
    renderCartModal();
    document.getElementById("cart-modal").classList.remove("hidden");
  };

  function renderCartModal() {
    const wrap = document.getElementById("cart-items-wrap");
    const totalEl = document.getElementById("cart-total");
    const emptyMsg = document.getElementById("cart-empty-msg");
    if (!wrap) return;

    if (cart.length === 0) {
      wrap.innerHTML = "";
      if (emptyMsg) {
        emptyMsg.style.display = "block";
        wrap.appendChild(emptyMsg);
      }
      if (totalEl) totalEl.textContent = "$0.00";
      return;
    }
    if (emptyMsg) emptyMsg.style.display = "none";

    wrap.innerHTML = cart
      .map(
        (c, i) => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <div class="cart-item-name">${c.name}</div>
          <div class="cart-item-sub">${c.category} • Seller: ${c.seller}</div>
        </div>
        <div class="cart-qty-ctrl">
          <button class="cart-qty-btn" onclick="cartQtyChange(${i}, -1)">−</button>
          <span style="min-width:24px;text-align:center;font-weight:700;">${c.qty}</span>
          <button class="cart-qty-btn" onclick="cartQtyChange(${i}, 1)">+</button>
        </div>
        <div class="cart-item-price">$${(c.price * c.qty).toFixed(2)}</div>
        <button onclick="removeFromCart(${i})" style="background:rgba(231,76,60,.2);border:1px solid rgba(231,76,60,.3);border-radius:7px;color:#e74c3c;padding:4px 9px;cursor:pointer;font-size:.85rem;">🗑</button>
      </div>`,
      )
      .join("");

    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    if (totalEl) totalEl.textContent = "$" + total.toFixed(2);
  }

  window.cartQtyChange = function (i, delta) {
    cart[i].qty = Math.max(1, Math.min(cart[i].qty + delta, cart[i].maxQty));
    saveCart();
    renderCartModal();
  };

  window.removeFromCart = function (i) {
    cart.splice(i, 1);
    saveCart();
    renderCartModal();
  };

  window.checkoutCart = function () {
    if (cart.length === 0) return alert("Your cart is empty!");
    if (
      !confirm(
        `Checkout ${cart.reduce((s, c) => s + c.qty, 0)} item(s) for $${cart.reduce((s, c) => s + c.price * c.qty, 0).toFixed(2)}?`,
      )
    )
      return;

    const currentUser = localStorage.getItem("currentUser") || "Unknown";
    let success = true;

    cart.forEach((cartItem) => {
      const idx = inventory.findIndex((p) => p.id == cartItem.id);
      if (idx === -1 || inventory[idx].quantity < cartItem.qty) {
        success = false;
        return;
      }
      const total = (cartItem.qty * cartItem.price).toFixed(2);
      const receiptNo = "RCP-" + Date.now().toString().slice(-8);
      inventory[idx].quantity -= cartItem.qty;

      const myIdx = inventory.findIndex(
        (p) =>
          p.owner === currentUser &&
          p.category === cartItem.category &&
          p.price === cartItem.price,
      );
      if (myIdx !== -1) inventory[myIdx].quantity += cartItem.qty;
      else
        inventory.push({
          id: Date.now() + Math.random(),
          name: cartItem.name,
          category: cartItem.category,
          price: cartItem.price,
          quantity: cartItem.qty,
          supplier: inventory[idx]?.supplier || "N/A",
          owner: currentUser,
        });

      logActivity("🛒 Bought from Market", {
        name: cartItem.name,
        supplier: inventory[idx]?.supplier || "N/A",
        amountQty: `Qty: ${cartItem.qty} | Total: $${total} | Seller: ${cartItem.seller} | Ref: ${receiptNo}`,
      });
      logActivity("💰 Item Sold (Market)", {
        name: cartItem.name,
        supplier: inventory[idx]?.supplier || "N/A",
        amountQty: `Qty Sold: ${cartItem.qty} | Total: $${total} | Buyer: ${currentUser} | Ref: ${receiptNo}`,
      });
    });

    if (!success) {
      alert("Some items could not be checked out (insufficient stock).");
      return;
    }
    cart = [];
    saveCart();
    saveInventory();
    renderMarket();
    document.getElementById("cart-modal").classList.add("hidden");
    alert("✅ Checkout successful! Check your inventory.");
  };

  // Global Functions for inline onclick
  window.openStockModal = function (id) {
    const product = inventory.find((p) => p.id == id);
    if (!product) return;
    document.getElementById("stock-prod-id").value = id;
    document.getElementById("stock-prod-name").textContent = product.name;
    document.getElementById("stock-amount").value = "";
    stockModal.classList.remove("hidden");
  };

  window.openBuyModal = function (id) {
    const product = inventory.find((p) => p.id == id);
    if (!product) return;
    document.getElementById("buy-prod-id").value = id;
    document.getElementById("buy-prod-name").textContent = product.name;
    document.getElementById("buy-prod-seller").textContent =
      product.owner || "System";
    document.getElementById("buy-amount").max = product.quantity;
    document.getElementById("buy-amount").value = 1;
    buyModal.classList.remove("hidden");
  };

  window.editProduct = function (id) {
    const product = inventory.find((p) => p.id == id);
    if (!product) return;

    document.getElementById("prod-id").value = product.id;

    // Find main category based on product.category
    let mainCat = "";
    for (const [key, values] of Object.entries(subCategories)) {
      if (values.includes(product.category)) mainCat = key;
    }

    const mainCatSelect = document.getElementById("prod-main-category");
    const subCatSelect = document.getElementById("prod-category");

    mainCatSelect.value = mainCat || "";

    if (mainCat) {
      subCatSelect.innerHTML =
        '<option value="" disabled selected>Select Specific Part</option>';
      subCatSelect.disabled = false;
      subCategories[mainCat].forEach((item) => {
        subCatSelect.innerHTML += `<option value="${item}" style="background:#2c3e50;">${item}</option>`;
      });
      subCatSelect.value = product.category;
    }

    document.getElementById("prod-name").value = product.name || "";
    document.getElementById("prod-description").value =
      product.description || "";
    document.getElementById("prod-cost-price").value = product.costPrice || "";
    document.getElementById("prod-price").value = product.price;
    document.getElementById("prod-quantity").value = product.quantity;
    document.getElementById("prod-supplier").value = product.supplier;

    const purposeRadios = document.querySelectorAll(
      'input[name="prod-purpose"]',
    );
    purposeRadios.forEach((radio) => {
      if (radio.value === (product.purpose || "For Sale")) {
        radio.checked = true;
      }
    });

    document.getElementById("modal-title").textContent = "Edit Product";
    productModal.classList.remove("hidden");
  };

  window.deleteProduct = function (id) {
    if (confirm("Are you sure you want to delete this product?")) {
      const product = inventory.find((p) => p.id == id);
      inventory = inventory.filter((p) => p.id != id);
      saveInventory();
      if (product) {
        logActivity("Deleted Product", {
          name: product.name,
          supplier: product.supplier,
          amountQty: `Removed`,
        });
      }
    }
  };

  window.approveProduct = function (id) {
    const product = inventory.find((p) => p.id == id);
    if (!product) return;
    product.approved = !product.approved;
    saveInventory();
    logActivity(product.approved ? "Approved Product" : "Unapproved Product", {
      name: product.name,
      supplier: product.supplier,
      amountQty: `Market Status changed`,
    });
  };

  // Modal Event Listeners
  // ── Populate user catalog selector ─────────────────────────────
  function populateUserProductSelect(searchTerm = "") {
    const sel = document.getElementById("user-prod-select");
    if (!sel) return;

    // Read fresh from localStorage
    let freshInv = JSON.parse(localStorage.getItem("inventory")) || [];

    // If admin catalog is missing or wiped, silently restore from DEFAULT_PRODUCTS
    const hasAdminItems = freshInv.some(
      (p) => p.isCatalog && p.quantity > 0,
    );
    if (!hasAdminItems) {
      const adminDefaults = DEFAULT_PRODUCTS.map((p, i) => ({
        id: 1000 + i,
        name: p.name,
        description: p.description,
        category: p.category,
        costPrice: p.costPrice,
        price: p.price,
        quantity: p.quantity,
        supplier: p.supplier,
        owner: randNames[(1000 + i) % randNames.length],
        isCatalog: true,
        purpose: "For Sale",
        approved: true,
        condition: "New",
        listedDate: new Date(
          Date.now() - Math.random() * 15 * 86400000,
        ).toISOString(),
      }));
      // Preserve any existing user items
      const userItems = freshInv.filter((p) => !p.isCatalog);
      freshInv = [...adminDefaults, ...userItems];
      inventory = freshInv;
      localStorage.setItem("inventory", JSON.stringify(inventory));
    }

    const lower = searchTerm.toLowerCase();
    const catalogItems = freshInv.filter(
      (p) => p.isCatalog && p.quantity > 0,
    );
    const filtered = lower
      ? catalogItems.filter(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.category.toLowerCase().includes(lower),
        )
      : catalogItems;

    sel.innerHTML =
      '<option value="" disabled selected>— Select a product —</option>';

    const byCategory = {};
    filtered.forEach((p) => {
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(p);
    });

    Object.entries(byCategory).forEach(([cat, items]) => {
      const grp = document.createElement("optgroup");
      grp.label = cat;
      items.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name}  —  $${parseFloat(p.price).toFixed(2)}`;
        opt.style.background = "#1e2840";
        grp.appendChild(opt);
      });
      sel.appendChild(grp);
    });
  }

  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      const isAdmin = localStorage.getItem("isAdminSession") === "true";

      if (isAdmin) {
        // Admin: open full product form
        document.getElementById("product-form").reset();
        document.getElementById("prod-id").value = "";
        const defaultPurpose = document.querySelector(
          'input[name="prod-purpose"][value="For Sale"]',
        );
        if (defaultPurpose) defaultPurpose.checked = true;
        const subCatSelect = document.getElementById("prod-category");
        if (subCatSelect) {
          subCatSelect.innerHTML =
            '<option value="" disabled selected>Select Specific Part</option>';
          subCatSelect.disabled = true;
        }
        document.getElementById("modal-title").textContent = "Add Product";
        productModal.classList.remove("hidden");
      } else {
        // Regular user: open catalog-picker modal
        const form = document.getElementById("user-product-form");
        if (form) form.reset();
        const preview = document.getElementById("user-prod-preview");
        const profitRow = document.getElementById("upv-profit-row");
        if (preview) preview.style.display = "none";
        if (profitRow) profitRow.style.display = "none";
        const qtyEl = document.getElementById("user-prod-qty");
        if (qtyEl) qtyEl.value = 1;
        populateUserProductSelect();
        document
          .getElementById("user-product-modal")
          .classList.remove("hidden");
      }
    });
  }

  // ── User product modal — catalog select change ──────────────────
  // ── Condition price multipliers & colors ───────────────────────
  const COND_MULT = { New: 1.2, "Like New": 1.1, Good: 0.9, Fair: 0.75 };
  const COND_COLOR = {
    New: "#96c93d",
    "Like New": "#4facfe",
    Good: "#f39c12",
    Fair: "#e74c3c",
  };
  const COND_LABEL = {
    New: "+20% markup",
    "Like New": "+10% markup",
    Good: "\u221210% discount",
    Fair: "\u221225% discount",
  };

  // Shared helper — updates price input, profit row, and card highlights
  function refreshPriceUI(sysPrice, cond) {
    const mult = COND_MULT[cond] || 1.2;
    const color = COND_COLOR[cond] || "#96c93d";
    const sellPrice = parseFloat((sysPrice * mult).toFixed(2));
    const diff = parseFloat((sellPrice - sysPrice).toFixed(2));
    const isPositive = diff >= 0;

    // Price input
    const priceInput = document.getElementById("user-prod-price");
    if (priceInput) priceInput.value = sellPrice.toFixed(2);

    // Preview top-right price badge
    const priceEl = document.getElementById("upv-price");
    if (priceEl) {
      priceEl.textContent = "$" + sellPrice.toFixed(2);
      priceEl.style.color = color;
    }

    // Profit breakdown row
    const sysEl = document.getElementById("upv-sys-price");
    const sellEl = document.getElementById("upv-sell-price");
    const profitEl = document.getElementById("upv-profit");
    const pctEl = document.getElementById("upv-markup-pct");
    const rowEl = document.getElementById("upv-profit-row");
    if (sysEl) sysEl.textContent = "$" + sysPrice.toFixed(2);
    if (sellEl) {
      sellEl.textContent = "$" + sellPrice.toFixed(2);
      sellEl.style.color = color;
    }
    if (profitEl) {
      profitEl.textContent =
        (isPositive ? "+$" : "-$") + Math.abs(diff).toFixed(2);
      profitEl.style.color = isPositive ? "#f39c12" : "#e74c3c";
    }
    if (pctEl) {
      pctEl.textContent = isPositive
        ? "(" + Math.round((mult - 1) * 100) + "% up)"
        : "(" + Math.round((1 - mult) * 100) + "% off)";
      pctEl.style.color = color;
    }
    if (rowEl) rowEl.style.display = "block";

    // Update card borders & pct labels
    document.querySelectorAll(".user-cond-card").forEach((card) => {
      const c = card.dataset.cond;
      const lbl = card.querySelector(".cond-pct-label");
      if (c === cond) {
        card.style.borderColor = COND_COLOR[c] || "#96c93d";
        if (lbl) lbl.style.color = COND_COLOR[c] || "#96c93d";
      } else {
        card.style.borderColor = "rgba(255,255,255,0.12)";
        if (lbl) lbl.style.color = "rgba(255,255,255,0.35)";
      }
    });
  }

  // Product catalog select — populate preview & run default condition (New)
  document
    .getElementById("user-prod-select")
    ?.addEventListener("change", function () {
      const freshInv = JSON.parse(localStorage.getItem("inventory")) || [];
      const product = freshInv.find((p) => p.id == this.value);
      if (!product) return;
      const sysPrice = parseFloat(product.price);

      // Store sys price for condition-change calculations
      const hiddenSys = document.getElementById("user-prod-sys-price");
      if (hiddenSys) hiddenSys.value = sysPrice;

      // Fill static preview fields
      const nameEl = document.getElementById("upv-name");
      const catEl = document.getElementById("upv-category");
      const descEl = document.getElementById("upv-desc");
      const suppEl = document.getElementById("upv-supplier");
      const preview = document.getElementById("user-prod-preview");
      if (nameEl) nameEl.textContent = product.name;
      if (catEl) catEl.textContent = "📁 " + product.category;
      if (descEl) descEl.textContent = product.description || "";
      if (suppEl)
        suppEl.textContent = product.supplier ? "📦 " + product.supplier : "";
      if (preview) preview.style.display = "block";

      // Apply currently-selected condition
      const cond =
        document.querySelector('input[name="user-prod-condition"]:checked')
          ?.value || "New";
      refreshPriceUI(sysPrice, cond);
    });

  // Condition radios — update price live when changed
  document
    .querySelectorAll('input[name="user-prod-condition"]')
    .forEach((radio) => {
      radio.addEventListener("change", function () {
        const hiddenSys = document.getElementById("user-prod-sys-price");
        const sysPrice = hiddenSys ? parseFloat(hiddenSys.value) : 0;
        if (sysPrice > 0) refreshPriceUI(sysPrice, this.value);
      });
    });

  // Close buttons
  document
    .getElementById("close-user-product-btn")
    ?.addEventListener("click", () => {
      document.getElementById("user-product-modal").classList.add("hidden");
    });
  document
    .getElementById("close-user-product-btn2")
    ?.addEventListener("click", () => {
      document.getElementById("user-product-modal").classList.add("hidden");
    });

  // Close on backdrop click
  document
    .getElementById("user-product-modal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) this.classList.add("hidden");
    });

  // ── User product form submit ─────────────────────────────────────
  document
    .getElementById("user-product-form")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const selectedId = document.getElementById("user-prod-select")?.value;
      if (!selectedId) {
        alert("Please select a product from the catalog.");
        return;
      }
      // Always look up catalog item fresh from localStorage
      const lsInv = JSON.parse(localStorage.getItem("inventory")) || [];
      const catalogItem =
        lsInv.find((p) => p.id == selectedId) ||
        DEFAULT_PRODUCTS.find((_, i) => 1000 + i == selectedId);
      if (!catalogItem) {
        alert("Product not found. Please reopen the modal and try again.");
        return;
      }

      const condition =
        document.querySelector('input[name="user-prod-condition"]:checked')
          ?.value || "New";
      const purpose =
        document.querySelector('input[name="user-prod-purpose"]:checked')
          ?.value || "For Sale";

      const catalogSysPrice = parseFloat(catalogItem.price);
      const price = parseFloat(
        document.getElementById("user-prod-price").value,
      );
      const qty = parseInt(document.getElementById("user-prod-qty").value);
      const currentUser = localStorage.getItem("currentUser") || "Unknown";
      const profitPer = parseFloat((price - catalogSysPrice).toFixed(2));

      if (isNaN(price) || price <= 0) {
        alert("Please enter a valid selling price.");
        return;
      }
      if (isNaN(qty) || qty < 1) {
        alert("Please enter a valid quantity.");
        return;
      }

      const newProduct = {
        id: Date.now(),
        name: catalogItem.name,
        description: catalogItem.description || "",
        category: catalogItem.category,
        costPrice: catalogSysPrice,
        price: price,
        quantity: qty,
        supplier: catalogItem.supplier || "N/A",
        owner: currentUser,
        purpose: purpose,
        approved: true, // Automatically approved instantly!
        condition: condition,
        listedDate: new Date().toISOString(),
      };

      // Save directly to localStorage so admin sees it immediately
      const savedInv = JSON.parse(localStorage.getItem("inventory")) || [];
      savedInv.push(newProduct);
      inventory = savedInv; // keep module-level in sync
      localStorage.setItem("inventory", JSON.stringify(inventory));

      const signedProfit =
        profitPer >= 0
          ? `+$${profitPer.toFixed(2)}`
          : `-$${Math.abs(profitPer).toFixed(2)}`;
      logActivity("Added New Product", {
        name: newProduct.name,
        supplier: newProduct.supplier,
        amountQty: `Condition: ${condition} | Sell: $${price.toFixed(2)} | Cost: $${catalogSysPrice.toFixed(2)} | Margin: ${signedProfit}/item | Qty: ${qty} | ${purpose}`,
      });

      renderInventory(); // refresh the table so badge is visible right away
      document.getElementById("user-product-modal").classList.add("hidden");
      alert(
        `✅ "${newProduct.name}" successfully purchased and added directly to your inventory! [${condition}]\nSelling at $${price.toFixed(2)} (System: $${catalogSysPrice.toFixed(2)}) — Margin: ${signedProfit}/item.`,
      );
    });

  if (clearInventoryBtn) {
    clearInventoryBtn.addEventListener("click", () => {
      const isAdmin = localStorage.getItem("isAdminSession") === "true";
      const cu = localStorage.getItem("currentUser") || "Unknown";
      const msg = isAdmin
        ? "Remove ALL user requests? (Your product catalog is preserved.)"
        : "Remove all YOUR submitted products?";
      if (confirm(msg)) {
        if (isAdmin) {
          // Admin clear = remove only user-submitted requests, keep catalog
          inventory = inventory.filter((p) => p.isCatalog);
        } else {
          // User clear = remove only their own For Sale items, preserving their private "To Keep" inventory vault!
          inventory = inventory.filter((p) => p.owner !== cu || p.purpose !== "For Sale");
        }
        localStorage.setItem("inventory", JSON.stringify(inventory));
        renderInventory();
        logActivity("Cleared Requests", {
          name: isAdmin ? "All user requests" : `${cu}'s items`,
          supplier: "N/A",
          amountQty: "N/A",
        });
      }
    });
  }

  document.getElementById("close-modal-btn")?.addEventListener("click", () => {
    productModal.classList.add("hidden");
  });

  document.getElementById("close-stock-btn")?.addEventListener("click", () => {
    stockModal.classList.add("hidden");
  });

  document.getElementById("close-buy-btn")?.addEventListener("click", () => {
    buyModal.classList.add("hidden");
  });

  // Form Submits
  document.getElementById("product-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("prod-id").value;
    const selectedCategory = document.getElementById("prod-category").value;
    const selectedPurpose =
      document.querySelector('input[name="prod-purpose"]:checked')?.value ||
      "For Sale";
    const product = {
      id: id ? parseInt(id) : Date.now(),
      name:
        document.getElementById("prod-name").value.trim() || selectedCategory,
      description:
        document.getElementById("prod-description").value.trim() || "",
      category: selectedCategory,
      costPrice:
        parseFloat(document.getElementById("prod-cost-price").value) || 0,
      price: parseFloat(document.getElementById("prod-price").value),
      quantity: parseInt(document.getElementById("prod-quantity").value),
      supplier: document.getElementById("prod-supplier").value,
      owner: localStorage.getItem("currentUser") || "Unknown",
      purpose: selectedPurpose,
      approved: true, // Automatically approved instantly!
    };

    if (id) {
      // Edit
      const index = inventory.findIndex((p) => p.id == id);
      if (index !== -1) {
        product.approved = inventory[index].approved; // Preserve approval status
        inventory[index] = product;
        logActivity("Edited Product", {
          name: product.name,
          supplier: product.supplier,
          amountQty: `$${product.price} / ${product.quantity} qty`,
        });
      }
    } else {
      // Add
      inventory.push(product);
      logActivity("Added New Product", {
        name: product.name,
        supplier: product.supplier,
        amountQty: `$${product.price} / ${product.quantity} qty`,
      });
    }

    productModal.classList.add("hidden");
    saveInventory();
  });

  document.getElementById("stock-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("stock-prod-id").value;
    const amount = parseInt(document.getElementById("stock-amount").value);
    const type = document.querySelector(
      'input[name="stock-type"]:checked',
    ).value;

    const index = inventory.findIndex((p) => p.id == id);
    if (index !== -1) {
      if (type === "in") {
        inventory[index].quantity += amount;
        logActivity("Stock IN", {
          name: inventory[index].name,
          supplier: inventory[index].supplier,
          amountQty: `+${amount} qty (Total Val: $${(amount * inventory[index].price).toFixed(2)})`,
        });
      } else if (type === "out") {
        if (inventory[index].quantity >= amount) {
          inventory[index].quantity -= amount;
          logActivity("Stock OUT (Used/Sold)", {
            name: inventory[index].name,
            supplier: inventory[index].supplier,
            amountQty: `-${amount} qty (Total Val: $${(amount * inventory[index].price).toFixed(2)})`,
          });
        } else {
          alert("Not enough stock to remove!");
          return;
        }
      }
      saveInventory();
      stockModal.classList.add("hidden");
    }
  });

  document.getElementById("buy-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("buy-prod-id").value;
    const amount = parseInt(document.getElementById("buy-amount").value);
    const currentUser = localStorage.getItem("currentUser") || "Unknown";

    const marketIndex = inventory.findIndex((p) => p.id == id);
    if (marketIndex !== -1) {
      const marketItem = inventory[marketIndex];

      if (amount > marketItem.quantity) {
        alert("Not enough stock available from seller!");
        return;
      }

      // Deduct from seller
      marketItem.quantity -= amount;

      // Find if current user already has this identical item (same category, price, supplier, and purpose === "To Keep")
      const myIndex = inventory.findIndex(
        (p) =>
          p.owner === currentUser &&
          p.category === marketItem.category &&
          p.price === marketItem.price &&
          p.purpose === "To Keep",
      );

      if (myIndex !== -1) {
        inventory[myIndex].quantity += amount;
      } else {
        inventory.push({
          id: Date.now(),
          name: marketItem.name,
          description: marketItem.description || "",
          category: marketItem.category,
          price: marketItem.price,
          quantity: amount,
          supplier: marketItem.supplier,
          owner: currentUser,
          purpose: "To Keep", // Explicitly tag as owned vault asset
          condition: marketItem.condition || "New",
        });
      }

      const total = (amount * marketItem.price).toFixed(2);
      const receiptNo = "RCP-" + Date.now().toString().slice(-8);
      const now = new Date();

      // Log buy transaction (buyer side)
      logActivity("🛒 Bought from Market", {
        name: marketItem.name,
        supplier: marketItem.supplier,
        amountQty: `Qty: ${amount} | Unit: $${parseFloat(marketItem.price).toFixed(2)} | Total: $${total} | Seller: ${marketItem.owner || "System"} | Ref: ${receiptNo}`,
      });

      // Log sale transaction (seller side) — separate entry
      logActivity("💰 Item Sold (Market)", {
        name: marketItem.name,
        supplier: marketItem.supplier,
        amountQty: `Qty Sold: ${amount} | Unit: $${parseFloat(marketItem.price).toFixed(2)} | Total: $${total} | Buyer: ${currentUser} | Ref: ${receiptNo}`,
      });

      saveInventory();
      renderMarket();
      if (typeof window.renderUserInventory === "function") window.renderUserInventory();
      buyModal.classList.add("hidden");

      // Show receipt
      showReceipt({
        receiptNo,
        date: now.toLocaleString(),
        buyer: currentUser,
        seller: marketItem.owner || "System",
        item: marketItem.name,
        category: marketItem.category,
        unitPrice: parseFloat(marketItem.price).toFixed(2),
        qty: amount,
        total,
      });
    }
  });

  // --- Receipt Functions ---
  window.showReceipt = function (data) {
    document.getElementById("rcpt-no").textContent = data.receiptNo;
    document.getElementById("rcpt-date").textContent = data.date;
    document.getElementById("rcpt-buyer").textContent = data.buyer;
    document.getElementById("rcpt-seller").textContent = data.seller;
    document.getElementById("rcpt-item").textContent = data.item;
    document.getElementById("rcpt-category").textContent = data.category;
    document.getElementById("rcpt-unit-price").textContent =
      "$" + data.unitPrice;
    document.getElementById("rcpt-qty").textContent = data.qty;
    document.getElementById("rcpt-total").textContent = "$" + data.total;
    document.getElementById("receipt-modal").classList.remove("hidden");
  };

  window.closeReceipt = function () {
    document.getElementById("receipt-modal").classList.add("hidden");
    
    // Automatically navigate the user to the "My Inventory" view to show them the item was successfully added!
    const myInvNavBtn = document.querySelector('a[data-view="user-inventory-view"]');
    if (myInvNavBtn) {
      myInvNavBtn.click();
    }
  };

  window.printReceipt = function () {
    const content = document.getElementById("receipt-content").innerHTML;
    const win = window.open("", "_blank", "width=420,height=600");
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Receipt</title>
        <style>
          body { font-family: 'Courier New', monospace; background: #1a1a2e; color: white; padding: 30px; max-width: 380px; margin: 0 auto; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  // Close receipt on background click
  document
    .getElementById("receipt-modal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) closeReceipt();
    });

  document.getElementById("inventory-search")?.addEventListener("input", () => {
    renderInventory();
  });

  document
    .getElementById("inventory-filter")
    ?.addEventListener("change", () => {
      renderInventory();
    });

  // --- Admin Logs Rendering ---
  function renderAdminLogs() {
    const tbody = document.getElementById("admin-logs-tbody");
    if (!tbody) return;
    const logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
    const search =
      document.getElementById("admin-search")?.value.toLowerCase() || "";

    tbody.innerHTML = "";
    [...logs].reverse().forEach((log) => {
      if (
        search &&
        !log.user.toLowerCase().includes(search) &&
        !log.itemName.toLowerCase().includes(search)
      )
        return;

      const tr = document.createElement("tr");

      // Color-code action badges
      let actionColor = "rgba(255,255,255,0.1)";
      let actionTextColor = "white";
      if (log.action.includes("Bought")) {
        actionColor = "rgba(0,176,155,0.25)";
        actionTextColor = "#00b09b";
      } else if (log.action.includes("Sold")) {
        actionColor = "rgba(150,201,61,0.25)";
        actionTextColor = "#96c93d";
      } else if (log.action.includes("Added")) {
        actionColor = "rgba(79,172,254,0.2)";
        actionTextColor = "#4facfe";
      } else if (
        log.action.includes("Deleted") ||
        log.action.includes("Cleared")
      ) {
        actionColor = "rgba(231,76,60,0.2)";
        actionTextColor = "#e74c3c";
      } else if (log.action.includes("Stock IN")) {
        actionColor = "rgba(46,204,113,0.2)";
        actionTextColor = "#2ecc71";
      } else if (log.action.includes("Stock OUT")) {
        actionColor = "rgba(243,156,18,0.2)";
        actionTextColor = "#f39c12";
      }

      tr.innerHTML = `
                <td style="font-size:0.85rem;">${new Date(log.date).toLocaleString()}</td>
                <td style="color: #ff9f43; font-weight: bold;">${log.user}</td>
                <td><span style="background: ${actionColor}; color: ${actionTextColor}; padding: 5px 10px; border-radius: 5px; font-weight:600; font-size:0.85rem; white-space:nowrap;">${log.action}</span></td>
                <td><strong>${log.itemName}</strong></td>
                <td style="opacity:0.8;">${log.supplier}</td>
                <td style="font-size:0.82rem; color:rgba(255,255,255,0.85);">${log.amountQty}</td>
            `;
      tbody.appendChild(tr);
    });
  }

  document
    .getElementById("admin-search")
    ?.addEventListener("input", renderAdminLogs);

  document.getElementById("clear-logs-btn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear ALL audit logs?")) {
      localStorage.removeItem("activityLogs");
      renderAdminLogs();
    }
  });

  // Initial render
  renderInventory();
  renderAdminLogs();

  // --- Purpose Modal (Items to Keep / For Sale) ---
  window.openPurposeModal = function (purpose) {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const currentUser = localStorage.getItem("currentUser") || "Unknown";
    const isAdmin = localStorage.getItem("isAdminSession") === "true";
    const tbody = document.getElementById("purpose-modal-tbody");
    const title = document.getElementById("purpose-modal-title");
    const modal = document.getElementById("purpose-modal");

    const isKeep = purpose === "To Keep";
    title.textContent = isKeep ? "🗂️ Items to Keep" : "🏷️ Items for Sale";
    title.style.color = isKeep ? "#f39c12" : "#96c93d";

    const filtered = inventory.filter((p) => {
      if (currentUser !== "Admin Richard" && p.owner !== currentUser)
        return false;
      return p.purpose === purpose;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; opacity:0.5; padding: 30px;">No items found.</td></tr>`;
    } else {
      tbody.innerHTML = filtered
        .map((p) => {
          let stockColor = "";
          let stockText = p.quantity;
          if (p.quantity === 0) {
            stockColor = "color:#e74c3c;";
            stockText = "0 (Out)";
          } else if (p.quantity < 10) {
            stockColor = "color:#f1c40f;";
          }

          // Show edit/delete only to the owner or admin
          const canEdit = isAdmin || p.owner === currentUser;
          const actions = canEdit
            ? `<button class="action-btn btn-edit"
                 onclick="editFromPurpose(${p.id}, '${purpose}')"
                 style="margin-right:4px;">Edit</button>
               <button class="action-btn btn-delete"
                 onclick="deleteFromPurpose(${p.id}, '${purpose}')">Del</button>`
            : `<span style="opacity:.35;font-size:.75rem;">—</span>`;

          return `<tr>
                    <td style="font-size:.8rem;color:rgba(255,255,255,0.5);">#${p.id}</td>
                    <td><span style="color:#4facfe;font-weight:600;font-size:.85rem;">${p.owner || "Unknown"}</span></td>
                    <td><strong>${p.name}</strong><br><small style="color:rgba(255,255,255,0.5)">${p.supplier}</small></td>
                    <td>${p.category}</td>
                    <td>$${parseFloat(p.price).toFixed(2)}</td>
                    <td style="${stockColor}">${stockText}</td>
                    <td>${actions}</td>
                </tr>`;
        })
        .join("");
    }

    modal.classList.remove("hidden");
  };

  // Open edit modal from purpose modal
  window.editFromPurpose = function (id, purpose) {
    closePurposeModal();
    editProduct(id);
  };

  // Delete from purpose modal then refresh it
  window.deleteFromPurpose = function (id, purpose) {
    if (!confirm("Delete this item?")) return;
    const inv = JSON.parse(localStorage.getItem("inventory")) || [];
    const updated = inv.filter((p) => p.id != id);
    inventory = updated;
    localStorage.setItem("inventory", JSON.stringify(inventory));
    renderInventory();
    openPurposeModal(purpose); // refresh the modal in place
  };

  window.closePurposeModal = function () {
    document.getElementById("purpose-modal").classList.add("hidden");
  };

  // Close purpose modal on background click
  document
    .getElementById("purpose-modal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) closePurposeModal();
    });

  // =============================================
  //  SETTINGS PAGE LOGIC
  // =============================================

  const SETTINGS_KEY = "myapp_settings";

  const defaultSettings = {
    appName: "MyApp",
    language: "en",
    timezone: "Asia/Manila",
    dateFormat: "MM/DD/YYYY",
    theme: "dark",
    accentColor: "#4facfe",
    blur: 20,
    opacity: 10,
  };

  function loadSettings() {
    return Object.assign(
      {},
      defaultSettings,
      JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
    );
  }

  window.saveSettings = function () {
    const s = {
      appName:
        document.getElementById("setting-app-name")?.value ||
        defaultSettings.appName,
      language: document.getElementById("lang-en")?.classList.contains("active")
        ? "en"
        : "fil",
      timezone:
        document.getElementById("setting-timezone")?.value ||
        defaultSettings.timezone,
      dateFormat:
        document.getElementById("setting-dateformat")?.value ||
        defaultSettings.dateFormat,
      theme: localStorage.getItem("_tempTheme") || defaultSettings.theme,
      accentColor:
        localStorage.getItem("_tempAccent") || defaultSettings.accentColor,
      blur: parseInt(document.getElementById("blur-slider")?.value ?? 20),
      opacity: parseInt(document.getElementById("opacity-slider")?.value ?? 10),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  };

  // ── Change Password Reset Logic ─────────────────────────────────
  window.handleSettingChangePassword = function(e) {
    e.preventDefault();
    const userId = document.getElementById("setting-pwd-username")?.value.trim();
    const newPassword = document.getElementById("setting-pwd-new")?.value;

    if (!userId || !newPassword) {
      alert("Please fill in both fields.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || {};
    let accountKey = null;

    // 1. Direct search by Key (email/username)
    if (users[userId]) {
      accountKey = userId;
    } else {
      // 2. Case-insensitive search or search by name property
      const searchLower = userId.toLowerCase();
      for (const [key, val] of Object.entries(users)) {
        if (key.toLowerCase() === searchLower || (val.name && val.name.toLowerCase() === searchLower)) {
          accountKey = key;
          break;
        }
      }
    }

    if (accountKey) {
      users[accountKey].password = newPassword;
      localStorage.setItem("users", JSON.stringify(users));

      // Clear fields
      document.getElementById("setting-pwd-username").value = "";
      document.getElementById("setting-pwd-new").value = "";

      logActivity("Password Reset Successful", {
        name: users[accountKey].name || accountKey,
        supplier: "Settings Reset",
        amountQty: `Password updated for ${accountKey}`,
      });

      alert(`Success! Password for user "${users[accountKey].name || accountKey}" has been successfully updated.`);
    } else {
      alert(`Error: Username or Account ID "${userId}" was not found!`);
    }
  };

  window.showSettingsSaved = function () {
    const msg = document.getElementById("settings-saved-msg");
    if (!msg) return;
    msg.style.display = "block";
    setTimeout(() => {
      msg.style.display = "none";
    }, 2500);
  };

  window.resetSettings = function () {
    if (!confirm("Reset all settings to default?")) return;
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem("_tempTheme");
    localStorage.removeItem("_tempAccent");
    applySettingsToPage(defaultSettings);
    populateSettingsUI(defaultSettings);
    showSettingsSaved();
  };

  // --- App Name ---
  window.applyAppName = function () {
    const val = document.getElementById("setting-app-name")?.value.trim();
    if (val) {
      document.querySelector(".sidebar h2").textContent = val;
      document.title = val;
      saveSettings();
    }
  };

  // --- Language ---
  const translations = {
    en: {
      dashboard: "Dashboard",
      profile: "Profile",
      settings: "Settings",
      inventory: "PC Parts",
      market: "Global Market",
      logout: "Logout",
      welcome: "Welcome",
      overview: "Here is your overview for today.",
    },
    fil: {
      dashboard: "Dashboard",
      profile: "Profil",
      settings: "Mga Setting",
      inventory: "PC Parts",
      market: "Pandaigdigang Palengke",
      logout: "Mag-logout",
      welcome: "Maligayang pagdating",
      overview: "Narito ang iyong pangkalahatang-ideya ngayon.",
    },
  };

  window.setLanguage = function (lang) {
    document
      .getElementById("lang-en")
      ?.classList.toggle("active", lang === "en");
    document
      .getElementById("lang-fil")
      ?.classList.toggle("active", lang === "fil");
    localStorage.setItem(
      "_tempTheme",
      localStorage.getItem("_tempTheme") || defaultSettings.theme,
    );

    const t = translations[lang] || translations.en;
    const navBtns = document.querySelectorAll(".nav-btn");
    navBtns.forEach((btn) => {
      const view = btn.getAttribute("data-view");
      if (view === "dashboard-view") btn.textContent = t.dashboard;
      else if (view === "profile-view") btn.textContent = t.profile;
      else if (view === "settings-view") btn.textContent = t.settings;
      else if (view === "inventory-view") btn.textContent = t.inventory;
      else if (view === "user-inventory-view") btn.textContent = "My Inventory";
      else if (view === "market-view") btn.textContent = t.market;
    });
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.textContent = t.logout;

    const overviewP = document.querySelector("#dashboard-view header p");
    if (overviewP) overviewP.textContent = t.overview;

    saveSettings();
  };

  // --- Date/Time Preview ---
  window.previewDateTime = function () {
    const fmt = document.getElementById("setting-dateformat")?.value;
    const tz =
      document.getElementById("setting-timezone")?.value || "Asia/Manila";
    const now = new Date();
    let preview = "";
    try {
      if (fmt === "long") {
        preview =
          now.toLocaleDateString("en-US", {
            timeZone: tz,
            year: "numeric",
            month: "long",
            day: "numeric",
          }) +
          " " +
          now.toLocaleTimeString("en-US", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
          });
      } else if (fmt === "YYYY-MM-DD") {
        const d = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        preview =
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` +
          " " +
          d.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          });
      } else if (fmt === "DD/MM/YYYY") {
        const d = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        preview =
          `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` +
          " " +
          d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      } else {
        const d = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        preview =
          `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}` +
          " " +
          d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      }
    } catch (e) {
      preview = now.toLocaleString();
    }
    const el = document.getElementById("datetime-preview");
    if (el) el.textContent = "Preview: " + preview;
  };

  // --- Theme ---
  window.setTheme = function (theme) {
    localStorage.setItem("_tempTheme", theme);
    document
      .querySelectorAll(".theme-card")
      .forEach((c) => c.classList.remove("active-theme"));
    document.getElementById("theme-" + theme)?.classList.add("active-theme");
    document.body.classList.remove("theme-light", "theme-dark", "theme-custom");
    document.body.classList.add("theme-" + theme);
    const customRow = document.getElementById("custom-color-row");
    if (customRow)
      customRow.style.display = theme === "custom" ? "flex" : "none";
    saveSettings();
  };

  // --- Accent Color ---
  window.setAccent = function (color) {
    localStorage.setItem("_tempAccent", color);
    document.documentElement.style.setProperty("--accent", color);
    // Apply to primary-btn, links, sidebar title, stat labels
    document.querySelectorAll(".primary-btn").forEach((el) => {
      el.style.background = `linear-gradient(135deg, ${color}, ${color}cc)`;
    });
    document
      .querySelectorAll(".sidebar h2, .settings-section-title, th")
      .forEach((el) => {
        el.style.color = color;
      });
    document.querySelectorAll(".color-preset").forEach((el) => {
      el.classList.remove("selected");
      if (
        el.style.background === color ||
        (el.title && color.toLowerCase().includes(el.title.toLowerCase()))
      ) {
        el.classList.add("selected");
      }
    });
    // Update color picker
    const picker = document.getElementById("custom-color-picker");
    if (picker) picker.value = color;
    saveSettings();
  };

  // --- Blur ---
  window.applyBlur = function (val) {
    document.getElementById("blur-value").textContent = val + "px";
    document
      .querySelectorAll(".dashboard-container, .form-container, .modal-content")
      .forEach((el) => {
        el.style.backdropFilter = `blur(${val}px)`;
        el.style.webkitBackdropFilter = `blur(${val}px)`;
      });
    saveSettings();
  };

  // --- Opacity ---
  window.applyOpacity = function (val) {
    document.getElementById("opacity-value").textContent = val + "%";
    const alpha = (val / 100).toFixed(2);
    document
      .querySelectorAll(".dashboard-container, .form-container")
      .forEach((el) => {
        el.style.background = `rgba(255,255,255,${alpha})`;
      });
    saveSettings();
  };

  // --- Apply all settings to page ---
  function applySettingsToPage(s) {
    // App name
    if (s.appName) {
      const sidebarTitle = document.querySelector(".sidebar h2");
      if (sidebarTitle) sidebarTitle.textContent = s.appName;
      document.title = s.appName;
    }
    // Language
    setLanguage(s.language || "en");
    // Theme
    setTheme(s.theme || "dark");
    // Accent
    if (s.accentColor) setAccent(s.accentColor);
    // Blur
    applyBlur(s.blur ?? 20);
    // Opacity
    applyOpacity(s.opacity ?? 10);
  }

  function populateSettingsUI(s) {
    const appNameEl = document.getElementById("setting-app-name");
    if (appNameEl) appNameEl.value = s.appName || "";

    const tzEl = document.getElementById("setting-timezone");
    if (tzEl) tzEl.value = s.timezone || "Asia/Manila";

    const dfEl = document.getElementById("setting-dateformat");
    if (dfEl) {
      dfEl.value = s.dateFormat || "MM/DD/YYYY";
      previewDateTime();
    }

    const blurEl = document.getElementById("blur-slider");
    if (blurEl) {
      blurEl.value = s.blur ?? 20;
      document.getElementById("blur-value").textContent = (s.blur ?? 20) + "px";
    }

    const opEl = document.getElementById("opacity-slider");
    if (opEl) {
      opEl.value = s.opacity ?? 10;
      document.getElementById("opacity-value").textContent =
        (s.opacity ?? 10) + "%";
    }

    document
      .querySelectorAll(".theme-card")
      .forEach((c) => c.classList.remove("active-theme"));
    document
      .getElementById("theme-" + (s.theme || "dark"))
      ?.classList.add("active-theme");

    const customRow = document.getElementById("custom-color-row");
    if (customRow)
      customRow.style.display = s.theme === "custom" ? "flex" : "none";

    const picker = document.getElementById("custom-color-picker");
    if (picker && s.accentColor) picker.value = s.accentColor;
  }

  // --- Initialize settings on page load ---
  if (document.getElementById("settings-view")) {
    const s = loadSettings();
    applySettingsToPage(s);
    populateSettingsUI(s);
    previewDateTime();
    // Update preview when timezone changes
    document
      .getElementById("setting-timezone")
      ?.addEventListener("change", previewDateTime);
  }
  // --- Profile Image Upload Function ---
  window.handleProfileUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      const cu = localStorage.getItem("currentUser") || "Unknown";
      localStorage.setItem(`profile_pic_${cu}`, dataUrl);
      // Update UI immediately
      const img = document.getElementById("profile-img-preview");
      const initial = document.getElementById("profile-img-initial");
      if (img && initial) {
        img.src = dataUrl;
        img.style.display = "block";
        initial.style.display = "none";
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Dashboard Rendering ---
  window.renderDashboard = function() {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) return;
    
    // Parse inventory and logs
    const currentInventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
    
    // Calculate stats
    let itemsSale = 0;
    let itemsKeep = 0;
    let totalRevenue = 0;
    let totalSpend = 0;

    currentInventory.forEach(item => {
        if (item.owner === currentUser) {
            if (item.purpose === "For Sale") itemsSale++;
            if (item.purpose === "To Keep") itemsKeep++;
        }
    });

    // Check logs for revenue/spend if they contain purchase or sale keywords
    logs.forEach(log => {
        if (log.user === currentUser) {
            const amount = parseFloat(String(log.amountQty).replace(/[^0-9.-]+/g, "")) || 0;
            const actionLower = log.action.toLowerCase();
            
            if (actionLower.includes("sold") || actionLower.includes("sale")) {
                totalRevenue += amount;
            } else if (actionLower.includes("bought") || actionLower.includes("purchase")) {
                totalSpend += amount;
            }
        }
    });

    // Update DOM elements
    const revEl = document.getElementById("dash-total-revenue");
    if (revEl) revEl.textContent = `$${totalRevenue.toFixed(2)}`;

    const spendEl = document.getElementById("dash-total-spend");
    if (spendEl) spendEl.textContent = `$${totalSpend.toFixed(2)}`;

    const saleEl = document.getElementById("dash-items-sale");
    if (saleEl) saleEl.textContent = itemsSale;

    const keepEl = document.getElementById("dash-items-keep");
    if (keepEl) keepEl.textContent = itemsKeep;

    // Render Recent Activity
    const recentActivityContainer = document.getElementById("dash-recent-activity");
    if (recentActivityContainer) {
        const userLogs = logs.filter(log => log.user === currentUser).reverse().slice(0, 5);
        if (userLogs.length === 0) {
            recentActivityContainer.innerHTML = `<p style="color: rgba(255,255,255,0.6)">No recent activity.</p>`;
        } else {
            let html = "";
            userLogs.forEach(log => {
                const date = new Date(log.date).toLocaleDateString() + " " + new Date(log.date).toLocaleTimeString();
                
                // Color mapping depending on log action type
                let accentColor = "#4facfe"; // cyan/blue default
                let logIcon = "📋";
                const actionLower = log.action.toLowerCase();
                
                if (actionLower.includes("purchased") || actionLower.includes("bought") || actionLower.includes("sourced")) {
                    accentColor = "#2ecc71"; // green for buy
                    logIcon = "📥";
                } else if (actionLower.includes("listed") || actionLower.includes("selling") || actionLower.includes("sold")) {
                    accentColor = "#a855f7"; // purple for sell
                    logIcon = "📤";
                } else if (actionLower.includes("profile") || actionLower.includes("updated")) {
                    accentColor = "#ff9f43"; // orange for profile edits
                    logIcon = "⚙️";
                } else if (actionLower.includes("clear") || actionLower.includes("deleted")) {
                    accentColor = "#e74c3c"; // red for deletions
                    logIcon = "⚠️";
                }

                html += `
                <div class="profile-pill-capsule" style="padding: 12px 16px; margin-bottom: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-left: 3px solid ${accentColor}; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(4px)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateX(0)'">
                    <div>
                        <div style="font-size: 0.85rem; color: white; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <span>${logIcon}</span> ${log.action}
                        </div>
                        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 4px;">
                            Item: <span style="color: ${accentColor}; font-weight: 600;">${log.itemName}</span>
                        </div>
                    </div>
                    <div style="font-size: 0.72rem; color: rgba(255,255,255,0.4); text-align: right; font-family: monospace;">
                        ${date}
                    </div>
                </div>`;
            });
            recentActivityContainer.innerHTML = html;
        }
    }
  };

  // Initial render if dashboard is active
  if (document.getElementById("dashboard-view") && !document.getElementById("dashboard-view").classList.contains("hidden")) {
      window.renderDashboard();
  }

  // --- Admin Users Rendering ---
  window.renderAdminUsers = function() {
      const users = JSON.parse(localStorage.getItem("users")) || {};
      const tbody = document.getElementById("admin-users-tbody");
      if (!tbody) return;
      
      tbody.innerHTML = "";
      let hasUsers = false;

      for (const [email, data] of Object.entries(users)) {
          hasUsers = true;
          const tr = document.createElement("tr");
          tr.innerHTML = `
              <td><span style="cursor:pointer; color: #4facfe; text-decoration: underline;" onclick="impersonateUser('${email}')" title="Click to login as this user">${data.name || "N/A"}</span></td>
              <td>${email}</td>
              <td>${data.age || "N/A"}</td>
              <td>${data.dob || "N/A"}</td>
              <td style="color:#00f2fe;font-weight:700;">${data.gcash || "N/A"}</td>
              <td style="font-family: monospace;">${data.password || "N/A"}</td>
          `;
          tbody.appendChild(tr);
      }

      if (!hasUsers) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: rgba(255,255,255,0.6)">No users registered yet.</td></tr>`;
      }
  };

  // --- Admin Impersonate User ---
  window.impersonateUser = function(email) {
      if (confirm("Are you sure you want to log in as this user? You will be logged out of the admin session.")) {
          const users = JSON.parse(localStorage.getItem("users")) || {};
          if (users[email]) {
              localStorage.setItem("currentUser", users[email].name);
              localStorage.setItem("isAdminSession", "false");
              window.location.href = "dashboard.html";
          }
      }
  };

  // --- Dynamic Category-specific animated icons ---
  function getAnimatedIconHtml(cat) {
    if (!cat) return getPeripheralIconSvg();
    const c = cat.toLowerCase();
    if (c.includes("cpu") || c.includes("processor")) return getCpuIconSvg();
    if (c.includes("gpu") || c.includes("graphic")) return getGpuIconSvg();
    if (c.includes("ram") || c.includes("memory")) return getRamIconSvg();
    if (c.includes("ssd") || c.includes("hdd") || c.includes("storage")) return getStorageIconSvg();
    if (c.includes("motherboard")) return getMotherboardIconSvg();
    if (c.includes("psu") || c.includes("power supply")) return getPsuIconSvg();
    if (c.includes("case")) return getCaseIconSvg();
    if (c.includes("cooler") || c.includes("fan") || c.includes("cooling")) return getCoolingIconSvg();
    if (c.includes("monitor")) return getMonitorIconSvg();
    if (c.includes("keyboard")) return getKeyboardIconSvg();
    if (c.includes("mouse") || c.includes("mice")) return getMouseIconSvg();
    return getPeripheralIconSvg();
  }

  function getCpuIconSvg() {
    return `<svg width="120" height="120" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 15px rgba(0, 242, 254, 0.6));">
      <defs>
        <linearGradient id="cpuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe" />
          <stop offset="100%" stop-color="#4facfe" />
        </linearGradient>
        <filter id="cpuGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g stroke="#4facfe" stroke-width="1.5" opacity="0.8">
        <path d="M20,10 V15 M30,10 V15 M40,10 V15 M50,10 V15 M60,10 V15 M70,10 V15 M80,10 V15" />
        <path d="M20,85 V90 M30,85 V90 M40,85 V90 M50,85 V90 M60,85 V90 M70,85 V90 M80,85 V90" />
        <path d="M10,20 H15 M10,30 H15 M10,40 H15 M10,50 H15 M10,60 H15 M10,70 H15 M10,80 H15" />
        <path d="M85,20 H90 M85,30 H90 M85,40 H90 M85,50 H90 M85,60 H90 M85,70 H90 M85,80 H90" />
      </g>
      <rect x="15" y="15" width="70" height="70" rx="8" fill="#111827" stroke="url(#cpuGrad)" stroke-width="2.5" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="#00f2fe" stroke-width="1" stroke-dasharray="6 4" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" transform-origin="50 50" />
      </circle>
      <rect x="28" y="28" width="44" height="44" rx="4" fill="#1e293b" stroke="#00f2fe" stroke-width="2" />
      <rect x="36" y="36" width="28" height="28" rx="2" fill="url(#cpuGrad)" filter="url(#cpuGlow)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </rect>
      <circle cx="50" cy="50" r="3" fill="#fff" />
    </svg>`;
  }

  function getGpuIconSvg() {
    return `<svg width="140" height="90" viewBox="0 0 140 90" style="filter: drop-shadow(0 0 15px rgba(46, 204, 113, 0.5));">
      <defs>
        <linearGradient id="gpuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2ecc71" />
          <stop offset="100%" stop-color="#1abc9c" />
        </linearGradient>
        <linearGradient id="rgbBar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff007f">
            <animate attributeName="stop-color" values="#ff007f;#00f2fe;#2ecc71;#ff007f" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stop-color="#00f2fe">
            <animate attributeName="stop-color" values="#00f2fe;#2ecc71;#ff007f;#00f2fe" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stop-color="#2ecc71">
            <animate attributeName="stop-color" values="#2ecc71;#ff007f;#00f2fe;#2ecc71" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <rect x="10" y="20" width="120" height="52" rx="6" fill="#0f172a" stroke="url(#gpuGrad)" stroke-width="2" />
      <rect x="25" y="72" width="70" height="4" fill="#f1c40f" stroke="#f39c12" stroke-width="0.5" />
      <line x1="10" y1="28" x2="10" y2="64" stroke="#7f8c8d" stroke-width="3" />
      <g transform="translate(42, 46)">
        <circle cx="0" cy="0" r="20" fill="none" stroke="#2ecc71" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="6" fill="#1e293b" stroke="#2ecc71" stroke-width="1.5" />
        <g transform-origin="0 0">
          <path d="M-2,-16 L2,-16 L4,0 L-4,0 Z M-16,-2 L-16,2 L0,4 L0,-4 Z M2,16 L-2,16 L-4,0 L4,0 Z M16,2 L16,-2 L0,-4 L0,4 Z" fill="#2ecc71" opacity="0.8" />
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.8s" repeatCount="indefinite" />
        </g>
      </g>
      <g transform="translate(98, 46)">
        <circle cx="0" cy="0" r="20" fill="none" stroke="#2ecc71" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="6" fill="#1e293b" stroke="#2ecc71" stroke-width="1.5" />
        <g transform-origin="0 0">
          <path d="M-2,-16 L2,-16 L4,0 L-4,0 Z M-16,-2 L-16,2 L0,4 L0,-4 Z M2,16 L-2,16 L-4,0 L4,0 Z M16,2 L16,-2 L0,-4 L0,4 Z" fill="#2ecc71" opacity="0.8" />
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.8s" repeatCount="indefinite" />
        </g>
      </g>
      <rect x="25" y="24" width="90" height="4" rx="2" fill="url(#rgbBar)" />
    </svg>`;
  }

  function getRamIconSvg() {
    return `<svg width="130" height="60" viewBox="0 0 130 60" style="filter: drop-shadow(0 0 15px rgba(155, 89, 182, 0.65));">
      <defs>
        <linearGradient id="ramBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="rgbFlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff007f">
            <animate attributeName="stop-color" values="#ff007f;#00f2fe;#9b59b6;#ff007f" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="33%" stop-color="#00f2fe">
            <animate attributeName="stop-color" values="#00f2fe;#9b59b6;#ff007f;#00f2fe" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="66%" stop-color="#9b59b6">
            <animate attributeName="stop-color" values="#9b59b6;#ff007f;#00f2fe;#9b59b6" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stop-color="#ff007f">
            <animate attributeName="stop-color" values="#ff007f;#00f2fe;#9b59b6;#ff007f" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <g transform="translate(10, 15)">
        <rect x="0" y="8" width="100" height="28" rx="2" fill="url(#ramBody)" stroke="#9b59b6" stroke-width="1.5" />
        <rect x="5" y="0" width="90" height="8" rx="2" fill="url(#rgbFlow)" />
        <path d="M 15,14 H 25 M 35,14 H 45 M 55,14 H 65 M 75,14 H 85" stroke="#9b59b6" stroke-width="1.5" opacity="0.6" />
        <line x1="0" y1="36" x2="100" y2="36" stroke="#f1c40f" stroke-width="2.5" stroke-dasharray="3 2" />
      </g>
      <g transform="translate(20, 5)">
        <rect x="0" y="8" width="100" height="28" rx="2" fill="url(#ramBody)" stroke="#00f2fe" stroke-width="1.5" style="filter: drop-shadow(0 0 5px rgba(0, 242, 254, 0.4));" />
        <rect x="5" y="0" width="90" height="8" rx="2" fill="url(#rgbFlow)" />
        <path d="M 15,14 H 25 M 35,14 H 45 M 55,14 H 65 M 75,14 H 85" stroke="#00f2fe" stroke-width="1.5" opacity="0.6" />
        <line x1="0" y1="36" x2="100" y2="36" stroke="#f1c40f" stroke-width="2.5" stroke-dasharray="3 2" />
      </g>
    </svg>`;
  }

  function getStorageIconSvg() {
    return `<svg width="100" height="100" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 15px rgba(241, 196, 15, 0.6));">
      <defs>
        <radialGradient id="platterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#7f8c8d" />
          <stop offset="70%" stop-color="#bdc3c7" />
          <stop offset="100%" stop-color="#34495e" />
        </radialGradient>
      </defs>
      <rect x="15" y="10" width="70" height="80" rx="6" fill="#111827" stroke="#f1c40f" stroke-width="2" />
      <circle cx="50" cy="55" r="28" fill="url(#platterGrad)" stroke="#f1c40f" stroke-width="1" />
      <circle cx="50" cy="55" r="6" fill="#2c3e50" stroke="#fff" stroke-width="1.5" />
      <circle cx="50" cy="55" r="20" fill="none" stroke="#fff" stroke-width="0.75" stroke-dasharray="40 10" opacity="0.6">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.2s" repeatCount="indefinite" transform-origin="50 55" />
      </circle>
      <circle cx="28" cy="25" r="4.5" fill="#f1c40f" />
      <g transform-origin="28 25">
        <path d="M28,25 L50,48 L46,49" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" />
        <circle cx="50" cy="48" r="1.5" fill="#f1c40f" />
        <animateTransform attributeName="transform" type="rotate" values="-5;18;-5" dur="3s" repeatCount="indefinite" />
      </g>
      <circle cx="77" cy="18" r="2" fill="#2ecc71">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="0.4s" repeatCount="indefinite" />
      </circle>
    </svg>`;
  }

  function getMotherboardIconSvg() {
    return `<svg width="110" height="110" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 15px rgba(26, 188, 156, 0.6));">
      <rect x="10" y="10" width="80" height="80" rx="6" fill="#0f172a" stroke="#1abc9c" stroke-width="2" />
      <rect x="35" y="25" width="30" height="30" rx="3" fill="#1e293b" stroke="#1abc9c" stroke-width="1.5" />
      <rect x="42" y="32" width="16" height="16" fill="none" stroke="#1abc9c" stroke-dasharray="2 1" />
      <line x1="72" y1="20" x2="72" y2="60" stroke="#1e293b" stroke-width="2" />
      <line x1="76" y1="20" x2="76" y2="60" stroke="#1e293b" stroke-width="2" />
      <line x1="72" y1="22" x2="72" y2="58" stroke="#1abc9c" stroke-width="1" opacity="0.8">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
      </line>
      <line x1="76" y1="22" x2="76" y2="58" stroke="#1abc9c" stroke-width="1" opacity="0.8">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </line>
      <rect x="20" y="66" width="45" height="5" rx="1" fill="#1e293b" stroke="#1abc9c" stroke-width="1" />
      <rect x="20" y="78" width="45" height="5" rx="1" fill="#1e293b" stroke="#1abc9c" stroke-width="1" />
      <line x1="22" y1="68" x2="63" y2="68" stroke="#1abc9c" stroke-width="0.75" />
      <path d="M35,40 H20 V55 H30" fill="none" stroke="#1abc9c" stroke-width="1" stroke-dasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="20;0" dur="2s" repeatCount="indefinite" />
      </path>
      <rect x="70" y="68" width="14" height="14" rx="2" fill="#1abc9c" opacity="0.8">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
      </rect>
    </svg>`;
  }

  function getPsuIconSvg() {
    return `<svg width="100" height="100" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 15px rgba(230, 126, 34, 0.6));">
      <rect x="15" y="15" width="70" height="70" rx="8" fill="#111827" stroke="#e67e22" stroke-width="3.5" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="#e67e22" stroke-width="1.5" />
      <g transform-origin="50 50">
        <g fill="#e67e22" opacity="0.75">
          <circle cx="50" cy="50" r="6" />
          <path d="M 50 50 L 32 30 A 12 12 0 0 1 50 18 Z M 50 50 L 68 70 A 12 12 0 0 1 50 82 Z M 50 50 L 30 68 A 12 12 0 0 1 18 50 Z M 50 50 L 70 32 A 12 12 0 0 1 82 50 Z" />
        </g>
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" repeatCount="indefinite" />
      </g>
      <path d="M 53,38 L 41,52 H 49 L 45,65 L 59,48 H 51 Z" fill="#f1c40f" style="filter: drop-shadow(0 0 5px #f1c40f);">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="scale" values="0.95;1.1;0.95" dur="0.8s" repeatCount="indefinite" transform-origin="50 50" />
      </path>
    </svg>`;
  }

  function getCaseIconSvg() {
    return `<svg width="100" height="110" viewBox="0 0 100 110" style="filter: drop-shadow(0 0 15px rgba(230, 126, 34, 0.65));">
      <defs>
        <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#e67e22" />
          <stop offset="100%" stop-color="#d35400" />
        </linearGradient>
        <linearGradient id="rgbIntake" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff007f" />
          <stop offset="50%" stop-color="#00f2fe" />
          <stop offset="100%" stop-color="#2ecc71" />
        </linearGradient>
      </defs>
      <rect x="25" y="96" width="10" height="6" fill="#7f8c8d" />
      <rect x="65" y="96" width="10" height="6" fill="#7f8c8d" />
      <rect x="20" y="10" width="60" height="88" rx="6" fill="#111827" stroke="url(#chassisGrad)" stroke-width="2.5" />
      <rect x="26" y="16" width="40" height="76" rx="2" fill="rgba(0, 242, 254, 0.08)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
      <g transform="translate(71, 30)">
        <circle cx="0" cy="0" r="10" fill="none" stroke="url(#rgbIntake)" stroke-width="1.5">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="-7" y1="-7" x2="7" y2="7" stroke="#fff" stroke-width="1" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.8s" repeatCount="indefinite" />
        </line>
      </g>
      <g transform="translate(71, 58)">
        <circle cx="0" cy="0" r="10" fill="none" stroke="url(#rgbIntake)" stroke-width="1.5">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="-7" y1="-7" x2="7" y2="7" stroke="#fff" stroke-width="1" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.8s" repeatCount="indefinite" />
        </line>
      </g>
      <g transform="translate(71, 86)">
        <circle cx="0" cy="0" r="10" fill="none" stroke="url(#rgbIntake)" stroke-width="1.5">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="-7" y1="-7" x2="7" y2="7" stroke="#fff" stroke-width="1" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.8s" repeatCount="indefinite" />
        </line>
      </g>
      <path d="M 35,30 Q 55,20 45,55 T 35,80" fill="none" stroke="#00f2fe" stroke-width="2" opacity="0.8">
        <animate attributeName="stroke-dasharray" values="50,10;10,50;50,10" dur="2.5s" repeatCount="indefinite" />
      </path>
    </svg>`;
  }

  function getCoolingIconSvg() {
    return `<svg width="110" height="110" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 15px rgba(52, 152, 219, 0.7));">
      <defs>
        <linearGradient id="coolRing1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3498db" />
          <stop offset="100%" stop-color="#00f2fe" />
        </linearGradient>
        <linearGradient id="coolRing2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff007f" />
          <stop offset="100%" stop-color="#3498db" />
        </linearGradient>
      </defs>
      <rect x="15" y="15" width="70" height="70" rx="14" fill="#0f172a" stroke="#3498db" stroke-width="2.5" />
      <rect x="42" y="8" width="6" height="8" rx="1" fill="#7f8c8d" />
      <rect x="52" y="8" width="6" height="8" rx="1" fill="#7f8c8d" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="url(#coolRing1)" stroke-width="2.5" opacity="0.8">
        <animate attributeName="r" values="24;26;24" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="18" fill="none" stroke="url(#coolRing2)" stroke-width="2" opacity="0.6">
        <animate attributeName="r" values="18;16;18" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="10" fill="none" stroke="url(#coolRing1)" stroke-width="1.5" opacity="0.4">
        <animate attributeName="r" values="8;11;8" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="5" fill="#00f2fe">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>`;
  }

  function getMonitorIconSvg() {
    return `<svg width="130" height="100" viewBox="0 0 130 100" style="filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.55));">
      <defs>
        <linearGradient id="standGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fff" />
          <stop offset="100%" stop-color="#7f8c8d" />
        </linearGradient>
      </defs>
      <path d="M 55,62 L 40,86 L 90,86 L 75,62 Z" fill="url(#standGrad)" />
      <rect x="5" y="14" width="120" height="50" rx="6" fill="#111827" stroke="#fff" stroke-width="2.5" />
      <rect x="8" y="17" width="114" height="44" rx="3" fill="#0f172a" />
      <path d="M 12 39 Q 25 15 38 39 T 64 39 T 90 39 T 116 39" fill="none" stroke="#00f2fe" stroke-width="2.5">
        <animate attributeName="d" values="M 12 39 Q 25 15 38 39 T 64 39 T 90 39 T 116 39; M 12 39 Q 25 60 38 39 T 64 39 T 90 39 T 116 39; M 12 39 Q 25 15 38 39 T 64 39 T 90 39 T 116 39" dur="2s" repeatCount="indefinite" />
      </path>
      <line x1="8" y1="39" x2="122" y2="39" stroke="#fff" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.3" />
      <g fill="#2ecc71" opacity="0.8">
        <rect x="94" y="48" width="4" height="8" rx="0.5">
          <animate attributeName="height" values="8;2;8" dur="0.8s" repeatCount="indefinite" />
        </rect>
        <rect x="100" y="48" width="4" height="8" rx="0.5">
          <animate attributeName="height" values="4;10;4" dur="1s" repeatCount="indefinite" />
        </rect>
        <rect x="106" y="48" width="4" height="8" rx="0.5">
          <animate attributeName="height" values="10;5;10" dur="0.6s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>`;
  }

  function getKeyboardIconSvg() {
    return `<svg width="130" height="70" viewBox="0 0 130 70" style="filter: drop-shadow(0 0 15px rgba(231, 76, 60, 0.6));">
      <defs>
        <linearGradient id="kbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ff007f" />
          <stop offset="100%" stop-color="#e74c3c" />
        </linearGradient>
      </defs>
      <rect x="5" y="16" width="120" height="38" rx="5" fill="#1e293b" stroke="url(#kbGrad)" stroke-width="2.5" />
      <g fill="#e74c3c" opacity="0.85">
        <rect x="12" y="22" width="10" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.0s" repeatCount="indefinite" />
        </rect>
        <rect x="26" y="22" width="10" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.1s" repeatCount="indefinite" />
        </rect>
        <rect x="40" y="22" width="10" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
        </rect>
        <rect x="54" y="22" width="10" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
        </rect>
        <rect x="68" y="22" width="10" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
        </rect>
        <rect x="82" y="22" width="10" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.5s" repeatCount="indefinite" />
        </rect>
        <rect x="96" y="22" width="22" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
        </rect>
        <rect x="12" y="34" width="16" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.1s" repeatCount="indefinite" />
        </rect>
        <rect x="32" y="34" width="10" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
        </rect>
        <rect x="46" y="34" width="38" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
        </rect>
        <rect x="88" y="34" width="10" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
        </rect>
        <rect x="102" y="34" width="16" height="8" rx="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.5s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>`;
  }

  function getMouseIconSvg() {
    return `<svg width="80" height="110" viewBox="0 0 80 110" style="filter: drop-shadow(0 0 15px rgba(241, 196, 15, 0.6));">
      <rect x="18" y="15" width="44" height="80" rx="22" fill="#1e293b" stroke="#f1c40f" stroke-width="3" />
      <line x1="40" y1="15" x2="40" y2="48" stroke="#f1c40f" stroke-width="2.5" />
      <path d="M 18,48 Q 40,56 62,48" fill="none" stroke="#f1c40f" stroke-width="1.5" />
      <rect x="37" y="24" width="6" height="14" rx="3" fill="#fff" style="filter: drop-shadow(0 0 6px #f1c40f);">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
      </rect>
      <polygon points="40,68 46,78 34,78" fill="#f1c40f">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="scale" values="0.9;1.15;0.9" dur="2s" repeatCount="indefinite" transform-origin="40 73" />
      </polygon>
    </svg>`;
  }

  function getPeripheralIconSvg() {
    return `<svg width="100" height="100" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 15px rgba(155, 89, 182, 0.7));">
      <defs>
        <linearGradient id="periGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#9b59b6" />
          <stop offset="100%" stop-color="#3498db" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#9b59b6" stroke-width="1" stroke-dasharray="8 6" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" transform-origin="50 50" />
      </circle>
      <circle cx="50" cy="50" r="32" fill="none" stroke="#3498db" stroke-width="1" stroke-dasharray="4 8" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="10s" repeatCount="indefinite" transform-origin="50 50" />
      </circle>
      <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" fill="url(#periGrad)" stroke="#fff" stroke-width="1.5">
        <animate attributeName="opacity" values="0.75;1;0.75" dur="3s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="2s" repeatCount="indefinite" />
      </polygon>
      <circle cx="50" cy="50" r="4" fill="#fff">
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>`;
  }

  // --- Password Reset Handler from Settings ---
  window.handleSettingChangePassword = function(event) {
    if (event) event.preventDefault();
    const usernameInput = document.getElementById("setting-pwd-username").value.trim();
    const newPwd = document.getElementById("setting-pwd-new").value.trim();
    
    if (!usernameInput || !newPwd) {
      alert("⚠️ Mangyaring ilagay ang Username/ID at ang iyong New Password.");
      return;
    }
    
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    let foundEmail = null;
    const lowerInput = usernameInput.toLowerCase();
    
    for (const email in users) {
      const u = users[email];
      const uPrefix = email.split("@")[0].toLowerCase();
      
      if (email.toLowerCase() === lowerInput) {
        foundEmail = email;
        break;
      }
      if (uPrefix === lowerInput) {
        foundEmail = email;
        break;
      }
      if (u.name && u.name.toLowerCase() === lowerInput) {
        foundEmail = email;
        break;
      }
      if (u.publicId && String(u.publicId) === lowerInput.replace("#", "")) {
        foundEmail = email;
        break;
      }
    }
    
    // Fallback: Check if it's the current user's active session public ID
    if (!foundEmail) {
      const currentPublicId = localStorage.getItem("userPublicId");
      const currentUser = localStorage.getItem("currentUser");
      if (currentPublicId && String(currentPublicId) === lowerInput.replace("#", "")) {
        for (const email in users) {
          if (users[email].name === currentUser) {
            foundEmail = email;
            break;
          }
        }
      }
    }
    
    // Check if it's Admin Richard
    if (!foundEmail && (lowerInput === "richard" || lowerInput === "admin richard")) {
      localStorage.setItem("admin_password", newPwd);
      alert("🔒 Admin Richard password updated successfully! Bagong password ay maaari nang gamitin sa login.");
      const form = document.getElementById("setting-change-password-form");
      if (form) form.reset();
      return;
    }
    
    if (foundEmail) {
      users[foundEmail].password = newPwd;
      localStorage.setItem("users", JSON.stringify(users));
      alert(`🔒 Password for account "${users[foundEmail].name}" updated successfully! Maaari mo na itong gamitin sa pag-login.`);
      const form = document.getElementById("setting-change-password-form");
      if (form) form.reset();
    } else {
      alert("❌ Account not found! Pakisigurado na tama ang Username, Email, o Seller ID.");
    }
  };

});
