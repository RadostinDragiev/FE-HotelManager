$(function () {
  App.requireAuth();
  App.initLayout();

  const allowedRoles = ["ADMINISTRATOR", "MANAGER", "RECEPTIONIST"];
  if (!App.userHasRole(allowedRoles)) {
    window.location.href = "/dashboard.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const loc = params.get("loc");
  let reservationId = id || null;

  const $loader = $("#reservationLoader");
  const $status = $("#reservationStatusMsg");
  const endpoint = resolveEndpoint();

  if (!endpoint) {
    $status.text("Missing reservation id.").addClass("message error").show();
    return;
  }

  async function loadReservation() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    try {
      const data = await App.authFetch(endpoint);
      fillReservation(data);
    } catch (err) {
      $status.text(err.message || "Could not load reservation.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function fillReservation(res) {
    reservationId = res?.uuid || reservationId;
    $("#resGuest").text(formatName(res?.firstName, res?.lastName));
    $("#resEmail").text(res?.email || "—");
    $("#resPhone").text(res?.phone || "—");
    $("#resStatus").text(formatLabel(res?.reservationStatus));
    $("#resGuests").text(res?.guestsCount ?? "—");
    $("#resDates").text(`${formatDate(res?.startDate)} - ${formatDate(res?.endDate)}`);
    $("#resCost").text(formatMoney(res?.reservationCoast));
    $("#resPaymentsSummary").text(`${formatMoney(res?.payedAmount)} paid / ${formatMoney(res?.pendingAmount)} pending`);
    $("#resCreated").text(formatDate(res?.createdDateTime));
    renderRoomTypes(res?.roomTypes);
    renderPayments(res?.payments);
  }

  function renderRoomTypes(list) {
    const $wrap = $("#resRoomTypes");
    $wrap.empty();
    if (!Array.isArray(list) || list.length === 0) {
      $wrap.append('<span class="muted">No room types</span>');
      return;
    }
    list.forEach((rt) => {
      const label = `${formatLabel(rt?.roomTypeName)} — ${rt?.roomsCount ?? 0}`;
      $wrap.append(`<span class="pill">${label}</span>`);
    });
  }

  function renderPayments(list) {
    const $body = $("#resPaymentsTableBody");
    $body.empty();
    if (!Array.isArray(list) || list.length === 0) {
      $body.append('<tr><td colspan="4" class="muted">No payments</td></tr>');
      return;
    }
    list.forEach((p) => {
      const pid = p?.uuid;
      const $row = $(`
        <tr ${pid ? `data-id="${pid}"` : ""} class="${pid ? "clickable" : ""}">
          <td>${formatMoney(p.amount)}</td>
          <td>${formatLabel(p.reason)}</td>
          <td>${formatLabel(p.status)}</td>
          <td>${formatDateTime(p.createdDateTime)}</td>
        </tr>
      `);
      $body.append($row);
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

  function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${mins}`;
  }

  function formatMoney(val) {
    if (val === null || val === undefined || val === "") return "—";
    return `$${Number(val).toFixed(2)}`;
  }

  function resolveEndpoint() {
    if (loc) {
      const normalized = normalizeLocation(loc);
      if (normalized) return normalized;
    }
    if (id) {
      return `/api/reservations/${encodeURIComponent(id)}`;
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

  $("#resPaymentsTableBody").on("click", "tr[data-id]", function () {
    const pid = $(this).data("id");
    if (pid) {
      const query = reservationId ? `?id=${encodeURIComponent(pid)}&reservation=${encodeURIComponent(reservationId)}` : `?id=${encodeURIComponent(pid)}`;
      window.location.href = `/payment.html${query}`;
    }
  });

  $("#addPaymentBtn").on("click", function () {
    if (reservationId) {
      window.location.href = `/add-payment.html?reservation=${encodeURIComponent(reservationId)}`;
    }
  });

  loadReservation();
});
