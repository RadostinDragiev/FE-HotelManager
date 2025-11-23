const App = (function () {
  const STORAGE_KEYS = {
    token: "hotel-manager-token",
    user: "hotel-manager-user",
  };
  const apiBase = "http://localhost:8080";

  function getStoredUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to parse stored user", err);
      return null;
    }
  }

  function getToken() {
    return localStorage.getItem(STORAGE_KEYS.token);
  }

  function saveAuth(token, user) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.token, token);
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    }
  }

  function clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
  }

  function requireAuth(redirectTo = "/authenticate.html") {
    if (!getToken()) {
      window.location.href = redirectTo;
    }
  }

  function greetFromUser(user) {
    if (!user) return "Hello, Guest";
    if (user.firstName) return `Hello, ${user.firstName}`;
    if (user.name) {
      const first = user.name.split(" ")[0];
      return `Hello, ${first}`;
    }
    return "Hello";
  }

  function highlightNav(pageKey) {
    if (!pageKey) return;
    $(`.nav-link[data-page='${pageKey}']`).addClass("active");
  }

  function extractRoles(user) {
    if (!user) return [];
    if (Array.isArray(user.roles)) {
      return user.roles
        .map((r) => (typeof r === "string" ? r : r?.name))
        .filter(Boolean)
        .map((r) => String(r).toUpperCase());
    }
    const fallback = user.role || user.position;
    return fallback ? [String(fallback).toUpperCase()] : [];
  }

  function hasRole(user, requiredRoles = []) {
    const userRoles = extractRoles(user);
    if (!requiredRoles.length) return true;
    return requiredRoles.some((r) => userRoles.includes(String(r).toUpperCase()));
  }

  function initLayout(pageKey) {
    $("#headerContainer").load("/partials/header.html", function () {
      const user = getStoredUser();
      const token = getToken();
      if (token) {
        $("#userGreeting").text(greetFromUser(user));
        $(".nav-links, .user-actions").show();
      } else {
        $(".nav-links, .user-actions").hide();
      }
      $("[data-roles]").each(function () {
        const $el = $(this);
        const required = ($el.data("roles") || "")
          .split(",")
          .map((r) => r.trim().toUpperCase())
          .filter(Boolean);
        if (required.length && !hasRole(user, required)) {
          $el.hide();
        }
      });
      $("#logoutBtn").on("click", function () {
        clearAuth();
        window.location.href = "/authenticate.html";
      });
      highlightNav(pageKey);

      const $topbar = $("#headerContainer .topbar");
      const $menuToggle = $("#menuToggle");
      function setMenu(open) {
        if (open) {
          $topbar.addClass("nav-open");
          $menuToggle.attr("aria-expanded", "true");
        } else {
          $topbar.removeClass("nav-open");
          $menuToggle.attr("aria-expanded", "false");
        }
      }
      setMenu(false);

      $(document).off("click.menuToggle").on("click.menuToggle", "#menuToggle", function () {
        setMenu(!$topbar.hasClass("nav-open"));
      });
      $(document)
        .off("click.closeNav")
        .on("click.closeNav", ".nav-link, .profile-link, #logoutBtn", function () {
          setMenu(false);
        });
      $(window)
        .off("resize.closeNav")
        .on("resize.closeNav", function () {
          if (window.innerWidth > 768) {
            setMenu(false);
          }
        });
    });

    $("#footerContainer").load("/partials/footer.html");
  }

  async function authFetch(path, options = {}) {
    const token = getToken();
    const headers = Object.assign({}, options.headers || {}, {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    });

    const resp = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
    });

    if (!resp.ok) {
      const message = await safeMessage(resp);
      throw new Error(message || "Request failed");
    }

    if (resp.status === 204) return null;

    const contentType = resp.headers.get("content-type") || "";
    const text = await resp.text();
    if (!text) return null;

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch (err) {
        console.warn("Failed to parse JSON response", err);
        return text;
      }
    }

    return text;
  }

  async function safeMessage(resp) {
    try {
      const data = await resp.json();
      return data.message || data.error;
    } catch (err) {
      return resp.statusText;
    }
  }

  return {
    initLayout,
    saveAuth,
    clearAuth,
    getToken,
    getStoredUser,
    requireAuth,
    userHasRole: (roles) => hasRole(getStoredUser(), roles),
    authFetch,
    getApiBase: () => apiBase,
  };
})();
