$(function () {
  App.requireAuth();
  App.initLayout();

  const allowedRoles = ["ADMINISTRATOR", "MANAGER", "RECEPTIONIST"];
  if (!App.userHasRole(allowedRoles)) {
    window.location.href = "/dashboard.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("id");
  const reservationId = params.get("reservation");

  const $loader = $("#paymentLoader");
  const $status = $("#paymentStatusMsg");
  const $backLink = $("#backToReservation");

  if (reservationId) {
    $backLink.attr("href", `/reservation.html?id=${encodeURIComponent(reservationId)}`);
  }

  if (!paymentId) {
    $status.text("Missing payment id.").addClass("message error").show();
    return;
  }

  async function loadPayment() {
    $status.text("").removeClass("error success").hide();
    $loader.show();
    try {
      const data = await App.authFetch(`/api/payments/${encodeURIComponent(paymentId)}`);
      fillPayment(data);
    } catch (err) {
      $status.text(err.message || "Could not load payment.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function fillPayment(pay) {
    $("#payAmount").text(formatMoney(pay?.amount));
    $("#payType").text(formatLabel(pay?.paymentType));
    $("#payReason").text(formatLabel(pay?.reason));
    $("#payStatus").text(formatLabel(pay?.status));
    $("#payRoom").text(pay?.roomNumber || "—");
    $("#payCreated").text(formatDateTime(pay?.createdDateTime));
    $("#payNotes").text(pay?.notes || "—");

    const resId = pay?.reservationUUID || reservationId;
    if (resId) {
      $("#payReservation")
        .text("View reservation")
        .data("id", resId)
        .addClass("clickable");
    } else {
      $("#payReservation").text("—").removeClass("clickable").removeData("id");
    }
  }

  function formatLabel(raw) {
    if (!raw) return "—";
    return raw
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
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

  $("#payReservation").on("click", function () {
    const rid = $(this).data("id");
    if (rid) {
      window.location.href = `/reservation.html?id=${encodeURIComponent(rid)}`;
    }
  });

  loadPayment();
});
