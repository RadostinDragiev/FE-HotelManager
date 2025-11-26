$(function () {
  App.requireAuth();
  App.initLayout();

  const allowedRoles = ["ADMINISTRATOR", "MANAGER"];
  if (!App.userHasRole(allowedRoles)) {
    window.location.href = "/dashboard.html";
    return;
  }

  const $firstName = $("#userFirstName");
  const $lastName = $("#userLastName");
  const $username = $("#userUsername");
  const $email = $("#userEmail");
  const $rolesList = $("#userRolesList");
  const $rolesSelect = $("#availableRoles");
  const $addRoleBtn = $("#addRoleBtn");
  const $meta = $("#userMeta");
  const $updateBtn = $("#userUpdateBtn");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const $status = $("#userStatus");
  const $loader = $("#userLoader");
  let allRoles = [];
  let userRoles = [];

  if (!id) {
    $status.text("Missing user id.").addClass("message error").show();
    return;
  }

  async function loadUser() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    try {
      const [roles, data] = await Promise.all([
        App.authFetch(`/api/roles`).catch(() => []),
        App.authFetch(`/api/users/${encodeURIComponent(id)}`),
      ]);
      allRoles = Array.isArray(roles) ? roles : [];
      fillUser(data);
      renderRoleControls();
    } catch (err) {
      $status.text(err.message || "Could not load user.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function fillUser(user) {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const username = user?.username || "";
    const email = user?.email || "";
    const created = formatDate(user?.createdDateTime);
    const lastLogin = formatDate(user?.lastLoginDateTime);
    userRoles = toRoleNames(user?.roles);

    $firstName.val(firstName);
    $lastName.val(lastName);
    $username.val(username);
    $email.val(email);
    $meta.text(`${created} / ${lastLogin}`);
    $updateBtn.prop("disabled", true);
    renderRoleControls();
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  function formatRoles(roles) {
    if (!Array.isArray(roles) || roles.length === 0) return "—";
    return roles
      .map((r) => (typeof r === "string" ? r : r?.name))
      .filter(Boolean)
      .join(", ");
  }

  function toRoleNames(roles) {
    if (!Array.isArray(roles)) return [];
    const names = roles
      .map((r) => (typeof r === "string" ? r : r?.name))
      .filter(Boolean)
      .map((n) => String(n).trim().toUpperCase());
    return Array.from(new Set(names));
  }

  function formatRoleLabel(name) {
    if (!name) return "";
    const lower = name.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  function renderRoleControls() {
    $rolesList.empty();
    if (!userRoles.length) {
      $rolesList.append('<span class="muted">No roles</span>');
    } else {
      userRoles.forEach((role) => {
        const $pill = $('<span class="pill"></span>');
        $pill.append(`<span>${formatRoleLabel(role)}</span>`);
        const $remove = $('<button type="button" class="remove-pill" aria-label="Remove role">×</button>');
        $remove.on("click", function () {
          userRoles = userRoles.filter((r) => r !== role);
          renderRoleControls();
        });
        $pill.append($remove);
        $rolesList.append($pill);
      });
    }

    const available = allRoles
      .map((r) => ({ value: (r?.name || "").toUpperCase(), label: formatRoleLabel(r?.name) }))
      .filter((r) => r.value && !userRoles.includes(r.value));

    $rolesSelect.empty();
    if (!available.length) {
      $rolesSelect.append('<option value="">No more roles</option>');
      $rolesSelect.prop("disabled", true);
      $addRoleBtn.prop("disabled", true);
    } else {
      $rolesSelect.prop("disabled", false);
      $addRoleBtn.prop("disabled", false);
      $rolesSelect.append('<option value="">Select role</option>');
      available.forEach((role) => {
        $rolesSelect.append(`<option value="${role.value}">${role.label}</option>`);
      });
    }
  }

  $addRoleBtn.on("click", function () {
    const value = $rolesSelect.val();
    if (!value) return;
    if (!userRoles.includes(value)) {
      userRoles.push(value);
      renderRoleControls();
    }
  });

  loadUser();
});
