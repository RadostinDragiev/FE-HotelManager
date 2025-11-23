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
  const $roles = $("#userRoles");
  const $meta = $("#userMeta");
  const $updateBtn = $("#userUpdateBtn");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const $status = $("#userStatus");
  const $loader = $("#userLoader");

  if (!id) {
    $status.text("Missing user id.").addClass("message error").show();
    return;
  }

  async function loadUser() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    try {
      const data = await App.authFetch(`/api/users/${encodeURIComponent(id)}`);
      fillUser(data);
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
    const roles = formatRoles(user?.roles);

    $firstName.val(firstName);
    $lastName.val(lastName);
    $username.val(username);
    $email.val(email);
    $roles.text(roles);
    $meta.text(`${created} / ${lastLogin}`);
    $updateBtn.prop("disabled", true);
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

  loadUser();
});
