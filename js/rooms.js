$(function () {
  App.requireAuth();
  App.initLayout("rooms");

  const $tableBody = $("#roomsTableBody");
  const $status = $("#roomsStatus");
  const $loader = $("#roomsLoader");
  const $createBtn = $("#createRoomBtn");
  const $filterType = $("#filterType");
  const $filterStatus = $("#filterStatus");
  const $pageIndicator = $("#roomsPageIndicator");
  const $prev = $("#roomsPrev");
  const $next = $("#roomsNext");
  const $tbody = $("#roomsTableBody");

  let page = 0;
  const size = 10;
  let totalPages = 1;
  let roomTypes = [];

  async function loadRooms() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    $tableBody.empty();

    try {
      const data = await App.authFetch(buildUrl());
      const records = Array.isArray(data?.records) ? data.records : data;
      renderRows(Array.isArray(records) ? records : []);
      totalPages = Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1);
      updatePagination(data);

      if (!records || records.length === 0) {
        $status.text("No rooms to show yet.").addClass("message").show();
      }
    } catch (err) {
      $status.text(err.message || "Could not load rooms.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function buildUrl() {
    const params = new URLSearchParams();
    if ($filterType.val()) params.set("roomType", $filterType.val());
    if ($filterStatus.val()) params.set("roomStatus", $filterStatus.val());
    params.set("page", page);
    params.set("size", size);
    return `/api/rooms?${params.toString()}`;
  }

  function renderRows(rooms) {
    rooms.forEach((room) => {
      const statusClass = statusFor(room.roomStatus || room.status);
      const id = room.uuid || room.id;
      const $row = $(`
        <tr ${id ? `data-id="${id}"` : ""} class="${id ? "clickable" : ""}">
          <td>${room.roomNumber || room.number || "-"}</td>
          <td>${formatLabel(room.roomType || room.type) || "-"}</td>
          <td><span class="status-pill ${statusClass}">${formatLabel(room.roomStatus || room.status) || "Unknown"}</span></td>
        </tr>
      `);
      $tableBody.append($row);
    });
  }

  function statusFor(status) {
    const normalized = (status || "").toLowerCase();
    if (normalized.includes("available")) return "status-available";
    if (normalized.includes("maintenance")) return "status-maintenance";
    if (normalized.includes("occupied") || normalized.includes("booked")) return "status-occupied";
    if (normalized.includes("construction")) return "status-maintenance";
    if (normalized.includes("cleaning")) return "status-maintenance";
    return "";
  }

  function updatePagination(meta) {
    const total = Math.max(1, Number.isFinite(meta?.totalPages) ? meta.totalPages : totalPages);
    const current = Number.isFinite(meta?.page) ? meta.page : page;
    $pageIndicator.text(`Page ${current + 1} of ${Math.max(total, 1)}`);

    $prev.prop("disabled", current <= 0);
    $next.prop("disabled", current >= total - 1);
  }

  async function loadRoomTypes() {
    try {
      const types = await App.authFetch("/api/room-type");
      roomTypes = Array.isArray(types) ? types : [];
      populateTypeFilter();
    } catch (err) {
      roomTypes = [];
      // show a muted option but don't block
      $filterType.empty().append('<option value="">All types</option>');
    }
  }

  function populateTypeFilter() {
    $filterType.empty().append('<option value="">All types</option>');
    roomTypes.forEach((t) => {
      if (!t?.name || !t?.uuid) return;
      $filterType.append(
        $("<option></option>")
          .attr("value", t.uuid)
          .text(formatLabel(t.name))
      );
    });
  }

  $filterType.on("change", function () {
    page = 0;
    loadRooms();
  });

  $filterStatus.on("change", function () {
    page = 0;
    loadRooms();
  });

  $prev.on("click", function () {
    if (page <= 0) return;
    page -= 1;
    loadRooms();
  });

  $next.on("click", function () {
    if (page >= totalPages - 1) return;
    page += 1;
    loadRooms();
  });

  function formatLabel(raw) {
    if (!raw) return "";
    return raw
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  loadRoomTypes().finally(loadRooms);

  $tbody.on("click", "tr[data-id]", function () {
    const id = $(this).data("id");
    if (id) {
      window.location.href = `/room.html?id=${encodeURIComponent(id)}`;
    }
  });

  $createBtn.on("click", function () {
    window.location.href = "/create-room.html";
  });
});
