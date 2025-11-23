$(function () {
  App.requireAuth();
  App.initLayout("users");

  const allowedRoles = ["ADMINISTRATOR", "MANAGER"];
  if (!App.userHasRole(allowedRoles)) {
    window.location.href = "/dashboard.html";
    return;
  }

  const $tbody = $("#usersTableBody");
  const $status = $("#usersStatus");
  const $loader = $("#usersLoader");
  const $pageIndicator = $("#usersPageIndicator");
  const $prev = $("#usersPrev");
  const $next = $("#usersNext");
  const $create = $("#createUserBtn");

  $tbody.on("click", "tr[data-id]", function () {
    const id = $(this).data("id");
    if (id) {
      window.location.href = `/user.html?id=${encodeURIComponent(id)}`;
    }
  });

  let page = 0;
  const size = 10;
  let totalPages = 1;

  async function loadUsers() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    $tbody.empty();

    try {
      const data = await App.authFetch(`/api/users?page=${page}&size=${size}`);
      const records = Array.isArray(data?.records) ? data.records : [];

      renderRows(records);
      totalPages = Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1);
      updatePagination(data);

      if (records.length === 0) {
        $status.text("No users to display yet.").addClass("message").show();
      }
    } catch (err) {
      $status.text(err.message || "Could not load users.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function renderRows(records) {
    records.forEach((user) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
      const position = user.position || "—";
      const enabled = Boolean(user.enabled);
      const created = formatDate(user.createdDateTime);
      const id = getUserId(user);

      const $row = $("<tr></tr>");
      if (id) {
        $row.addClass("clickable").attr("data-id", id);
      }
      $("<td></td>").text(name).appendTo($row);
      $("<td></td>").text(position).appendTo($row);
      $("<td></td>").append(statusDot(enabled)).appendTo($row);
      $("<td></td>").text(created).appendTo($row);
      $tbody.append($row);
    });
  }

  function statusDot(isEnabled) {
    const $wrapper = $('<span class="status-dot"></span>');
    const $dot = $('<span class="dot"></span>');
    $wrapper.addClass(isEnabled ? "on" : "off");
    $wrapper.append($dot).append(isEnabled ? "Enabled" : "Disabled");
    return $wrapper;
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

  function updatePagination(meta) {
    const total = Math.max(1, Number.isFinite(meta?.totalPages) ? meta.totalPages : totalPages);
    const current = Number.isFinite(meta?.page) ? meta.page : page;
    $pageIndicator.text(`Page ${current + 1} of ${Math.max(total, 1)}`);

    $prev.prop("disabled", current <= 0);
    $next.prop("disabled", current >= total - 1);
  }

  $prev.on("click", function () {
    if (page <= 0) return;
    page -= 1;
    loadUsers();
  });

  $next.on("click", function () {
    if (page >= totalPages - 1) return;
    page += 1;
    loadUsers();
  });

  $create.on("click", function () {
    $status
      .text("User creation flow is coming soon.")
      .removeClass("error success")
      .addClass("message")
      .show();
  });

  function getUserId(user) {
    if (!user) return null;
    return (
      user.id ||
      user.userId ||
      user.userID ||
      user.uuid ||
      user.userUuid ||
      user.userUUID ||
      null
    );
  }

  loadUsers();
});
