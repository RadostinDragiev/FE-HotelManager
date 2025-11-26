$(function () {
  App.requireAuth();
  App.initLayout();

  const allowedRoles = ["ADMINISTRATOR", "MANAGER"];
  if (!App.userHasRole(allowedRoles)) {
    window.location.href = "/dashboard.html";
    return;
  }

  const $form = $("#createRoomForm");
  const $status = $("#createRoomStatus");
  const $loader = $("#createRoomLoader");
  const $roomType = $("#roomType");
  const $roomNumber = $("#roomNumber");
  const $bedTypes = $("#bedTypes");
  const $roomStatus = $("#roomStatus");

  const BED_TYPES = ["SINGLE", "DOUBLE", "SOFA"];

  renderBedTypes();
  loadRoomTypes();

  function renderBedTypes() {
    $bedTypes.empty();
    BED_TYPES.forEach((bt) => {
      const label = formatLabel(bt);
      const id = `bed-${bt.toLowerCase()}`;
      const $pill = $('<label class="pill" for="' + id + '"></label>');
      const $checkbox = $('<input type="checkbox" />')
        .attr("id", id)
        .attr("value", bt)
        .attr("name", "bedTypes");
      $pill.append($checkbox).append(label);
      $bedTypes.append($pill);
    });
  }

  async function loadRoomTypes() {
    $roomType.empty().append('<option value="">Loading types...</option>');
    try {
      const types = await App.authFetch("/api/room-type");
      populateTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      $roomType.empty().append('<option value="">Unable to load types</option>');
      $status.text(err.message || "Could not load room types.").addClass("message error").show();
    }
  }

  function populateTypes(types) {
    $roomType.empty().append('<option value="">Select type</option>');
    types.forEach((t) => {
      const value = t?.name;
      if (!value) return;
      $roomType.append(
        $("<option></option>")
          .attr("value", value)
          .text(formatLabel(value))
      );
    });
  }

  $form.on("submit", async function (e) {
    e.preventDefault();
    $status.text("").removeClass("error success").hide();

    const number = ($roomNumber.val() || "").trim();
    const type = $roomType.val();
    const status = $roomStatus.val();
    const beds = getSelectedBeds();

    const error = validate(number, type, status, beds);
    if (error) {
      $status.text(error).addClass("message error").show();
      return;
    }

    const payload = {
      roomNumber: number,
      roomType: type,
      bedTypes: beds,
      roomStatus: status,
    };

    $loader.show();
    $form.find("button").prop("disabled", true);
    try {
      const resp = await fetch(`${App.getApiBase()}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${App.getToken() || ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (resp.status !== 201) {
        const message = await safeMessage(resp);
        throw new Error(message || "Failed to create room");
      }

      const loc = resp.headers.get("Location") || resp.headers.get("location");
      if (loc) {
        const id = extractIdFromLocation(loc);
        if (id) {
          window.location.href = `/room.html?id=${encodeURIComponent(id)}&loc=${encodeURIComponent(
            loc
          )}`;
        } else {
          window.location.href = `/room.html?loc=${encodeURIComponent(loc)}`;
        }
        return;
      }

      $status.text("Room created successfully.").addClass("message success").show();
      $form[0].reset();
    } catch (err) {
      $status.text(err.message || "Could not create room.").addClass("message error").show();
    } finally {
      $loader.hide();
      $form.find("button").prop("disabled", false);
    }
  });

  function getSelectedBeds() {
    const values = [];
    $bedTypes.find("input[type='checkbox']:checked").each(function () {
      values.push($(this).val());
    });
    return values;
  }

  function validate(number, type, status, beds) {
    if (!number) return "Room number is required.";
    if (number.length > 10) return "Room number must be at most 10 characters.";
    if (!/^[0-9]+$/.test(number)) return "Room number must be numeric.";
    if (parseInt(number, 10) <= 0) return "Room number must be positive.";
    if (!type) return "Room type is required.";
    if (!status) return "Status is required.";
    if (!beds.length) return "Select at least one bed type.";
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

  function extractIdFromLocation(loc) {
    try {
      const url = new URL(loc, window.location.origin);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || null;
    } catch (err) {
      const parts = loc.split("/").filter(Boolean);
      return parts[parts.length - 1] || null;
    }
  }
});
