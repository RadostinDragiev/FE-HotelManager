$(function () {
  App.requireAuth();
  App.initLayout();

  const allowedRoles = ["ADMINISTRATOR", "MANAGER", "RECEPTIONIST"];
  if (!App.userHasRole(allowedRoles)) {
    window.location.href = "/dashboard.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const reservationId = params.get("reservation");
  const $back = $("#backToReservation");
  if (reservationId) {
    $back.attr("href", `/reservation.html?id=${encodeURIComponent(reservationId)}`);
    $("#reservationId").val(reservationId);
  }

  const $status = $("#addPaymentStatus");
  const $loader = $("#addPaymentLoader");
  const $form = $("#addPaymentForm");
  const $amount = $("#paymentAmount");
  const $type = $("#paymentType");
  const $reason = $("#paymentReason");
  const $pstatus = $("#paymentStatus");
  const $notes = $("#paymentNotes");
  const $roomId = $("#roomId");

  loadMenus();

  async function loadMenus() {
    $type.empty().append('<option value="">Loading...</option>');
    $reason.empty().append('<option value="">Loading...</option>');
    $pstatus.empty().append('<option value="">Loading...</option>');
    try {
      const menus = await App.authFetch("/api/payments/menus");
      populateSelect($type, menus?.paymentTypes || [], "Select type");
      populateSelect($reason, menus?.reasons || [], "Select reason");
      populateSelect($pstatus, menus?.status || [], "Select status");
    } catch (err) {
      $status.text(err.message || "Could not load payment menus.").addClass("message error").show();
      populateSelect($type, [], "Select type");
      populateSelect($reason, [], "Select reason");
      populateSelect($pstatus, [], "Select status");
    }
  }

  function populateSelect($select, values, placeholder) {
    $select.empty().append(`<option value="">${placeholder}</option>`);
    values.forEach((v) => {
      const value = (v || "").toUpperCase();
      if (!value) return;
      $select.append(`<option value="${value}">${formatLabel(value)}</option>`);
    });
  }

  $form.on("submit", async function (e) {
    e.preventDefault();
    $status.text("").removeClass("error success").hide();

    const payload = {
      amount: parseFloat($amount.val()),
      paymentType: $type.val(),
      reason: $reason.val(),
      paymentStatus: $pstatus.val(),
      notes: ($notes.val() || "").trim() || null,
      reservationId: $("#reservationId").val(),
      roomId: ($roomId.val() || "").trim() || null,
    };

    const error = validate(payload);
    if (error) {
      $status.text(error).addClass("message error").show();
      return;
    }

    $loader.show();
    $form.find("button").prop("disabled", true);
    try {
      const resp = await fetch(`${App.getApiBase()}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${App.getToken() || ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const message = await safeMessage(resp);
        throw new Error(message || "Failed to save payment");
      }

      $status.text("Payment saved successfully.").addClass("message success").show();
      setTimeout(() => {
        if (reservationId) {
          window.location.href = `/reservation.html?id=${encodeURIComponent(reservationId)}`;
        }
      }, 600);
    } catch (err) {
      $status.text(err.message || "Could not save payment.").addClass("message error").show();
    } finally {
      $loader.hide();
      $form.find("button").prop("disabled", false);
    }
  });

  function validate(payload) {
    if (!payload.amount || payload.amount <= 0) return "Amount must be positive.";
    if (!payload.paymentType) return "Payment type is required.";
    if (!payload.reason) return "Reason is required.";
    if (!payload.paymentStatus) return "Payment status is required.";
    if (!payload.reservationId) return "Missing reservation id.";
    return null;
  }

  function formatLabel(raw) {
    if (!raw) return "";
    return raw
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  async function safeMessage(resp) {
    try {
      const data = await resp.json();
      return data.message || data.error;
    } catch (err) {
      return resp.statusText;
    }
  }
});
