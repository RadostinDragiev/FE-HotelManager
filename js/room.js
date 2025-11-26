$(function () {
  App.requireAuth();
  App.initLayout();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const locParam = params.get("loc");

  const $loader = $("#roomLoader");
  const $status = $("#roomStatusMsg");

  const endpoint = resolveEndpoint();

  if (!endpoint) {
    $status.text("Missing room id.").addClass("message error").show();
    return;
  }

  async function loadRoom() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    try {
      const data = await App.authFetch(endpoint);
      fillRoom(data);
    } catch (err) {
      $status.text(err.message || "Could not load room.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function fillRoom(room) {
    $("#roomNumber").text(room?.roomNumber || "—");
    $("#roomType").text(formatLabel(room?.roomType));
    $("#roomStatus").text(formatLabel(room?.roomStatus));
    $("#roomCapacity").text(room?.capacity ?? "—");
    $("#roomBeds").text(formatList(room?.bedTypes));
    $("#roomPrice").text(room?.pricePerNight != null ? `$${room.pricePerNight}` : "—");
    $("#roomDates").text(`${formatDate(room?.createdAt)} / ${formatDate(room?.updatedAt)}`);
    $("#roomDescription").text(room?.description || "—");
    renderPhotos(room);
  }

  function renderPhotos(room) {
    const $grid = $("#roomPhotos");
    $grid.empty();
    const combined =
      (Array.isArray(room?.photos) ? room.photos : []).concat(
        Array.isArray(room?.roomTypePhotos) ? room.roomTypePhotos : []
      );
    if (!combined.length) {
      $grid.append('<span class="muted">No photos available</span>');
      return;
    }
    combined.forEach((photo) => {
      const url = photo?.secureUrl;
      if (!url) return;
      const $img = $("<img />").attr("src", url).attr("alt", "Room photo").addClass("thumb");
      $grid.append($img);
    });
  }

  function formatLabel(raw) {
    if (!raw) return "—";
    return raw
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function formatList(list) {
    if (!Array.isArray(list) || list.length === 0) return "—";
    return list
      .map((v) => formatLabel(v))
      .filter(Boolean)
      .join(", ");
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

  function resolveEndpoint() {
    if (locParam) {
      const normalized = normalizeLocation(locParam);
      if (normalized) return normalized;
    }
    if (id) {
      return `/api/rooms/${encodeURIComponent(id)}`;
    }
    return null;
  }

  function normalizeLocation(loc) {
    try {
      const url = new URL(loc, App.getApiBase());
      return url.pathname + url.search;
    } catch (err) {
      if (loc.startsWith("/")) return loc;
      return null;
    }
  }

  loadRoom();
});
