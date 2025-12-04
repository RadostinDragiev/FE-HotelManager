$(function () {
  App.requireAuth();
  App.initLayout("reservations");

  const allowedRoles = ["ADMINISTRATOR", "MANAGER", "RECEPTIONIST"];
  if (!App.userHasRole(allowedRoles)) {
    window.location.href = "/dashboard.html";
    return;
  }

  const $status = $("#reservationsStatus");
  const $loader = $("#reservationsLoader");
  const $tbody = $("#reservationsTableBody");
  const $pageIndicator = $("#reservationsPageIndicator");
  const $prev = $("#reservationsPrev");
  const $next = $("#reservationsNext");

  const $filterStatus = $("#filterResStatus");
  const $filterFrom = $("#filterFrom");
  const $filterTo = $("#filterTo");
  const $sortBy = $("#sortBy");
  const $sortDir = $("#sortDir");

  let page = 0;
  const size = 10;
  let totalPages = 1;

  async function loadReservations() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    $tbody.empty();

    try {
      const data = await App.authFetch(buildUrl());
      const records = Array.isArray(data?.records) ? data.records : data;
      renderRows(Array.isArray(records) ? records : []);
      totalPages = Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1);
      updatePagination(data);

      if (!records || records.length === 0) {
        $status.text("No reservations to show yet.").addClass("message").show();
      }
    } catch (err) {
      $status.text(err.message || "Could not load reservations.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function buildUrl() {
    const params = new URLSearchParams();
    if ($filterStatus.val()) params.set("status", $filterStatus.val());
    if ($filterFrom.val()) params.set("fromDate", $filterFrom.val());
    if ($filterTo.val()) params.set("toDate", $filterTo.val());
    params.set("sortBy", $sortBy.val() || "startDate");
    params.set("direction", $sortDir.val() || "asc");
    params.set("page", page);
    params.set("size", size);
    return `/api/reservations?${params.toString()}`;
  }

  function renderRows(records) {
    records.forEach((res) => {
      const id = res.uuid || res.id;
      const $row = $(`
        <tr ${id ? `data-id="${id}"` : ""} class="${id ? "clickable" : ""}">
          <td>${formatName(res.firstName, res.lastName)}</td>
          <td>${res.guestsCount ?? "—"}</td>
          <td>${formatLabel(res.reservationStatus)}</td>
          <td>${formatDate(res.startDate)}</td>
          <td>${formatDate(res.endDate)}</td>
        </tr>
      `);
      $tbody.append($row);
    });
  }

  function formatName(first, last) {
    return [first, last].filter(Boolean).join(" ") || "—";
  }

  function formatLabel(raw) {
    if (!raw) return "—";
    return raw
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
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

  $filterStatus.on("change", () => {
    page = 0;
    loadReservations();
  });
  $filterFrom.on("change", () => {
    page = 0;
    loadReservations();
  });
  $filterTo.on("change", () => {
    page = 0;
    loadReservations();
  });
  $sortBy.on("change", () => {
    page = 0;
    loadReservations();
  });
  $sortDir.on("change", () => {
    page = 0;
    loadReservations();
  });

  $prev.on("click", function () {
    if (page <= 0) return;
    page -= 1;
    loadReservations();
  });

  $next.on("click", function () {
    if (page >= totalPages - 1) return;
    page += 1;
    loadReservations();
  });

  $tbody.on("click", "tr[data-id]", function () {
    const id = $(this).data("id");
    if (id) {
      window.location.href = `/reservation.html?id=${encodeURIComponent(id)}`;
    }
  });

  loadReservations();
});
