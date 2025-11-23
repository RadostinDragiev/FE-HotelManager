$(function () {
  App.requireAuth();
  App.initLayout("rooms");

  const $tableBody = $("#roomsTableBody");
  const $status = $("#roomsStatus");
  const $loader = $("#roomsLoader");

  async function loadRooms() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    $tableBody.empty();

    try {
      const rooms = await App.authFetch("/api/rooms");
      renderRows(Array.isArray(rooms) ? rooms : []);
      if (!rooms || rooms.length === 0) {
        $status.text("No rooms to show yet.").addClass("message").show();
      }
    } catch (err) {
      $status.text(err.message || "Could not load rooms.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function renderRows(rooms) {
    rooms.forEach((room) => {
      const statusClass = statusFor(room.status);
      const $row = $(`
        <tr>
          <td>${room.number || "-"}</td>
          <td>${room.type || "-"}</td>
          <td>${room.rate ? `$${room.rate}` : "-"}</td>
          <td><span class="status-pill ${statusClass}">${room.status || "Unknown"}</span></td>
          <td class="muted">${room.description || ""}</td>
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
    return "";
  }

  loadRooms();
});
