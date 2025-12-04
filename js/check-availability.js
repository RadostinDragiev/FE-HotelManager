// Populate booking summary from query params
const params = new URLSearchParams(window.location.search);
const details = [];
if (params.get("checkin")) details.push(`<strong>Check-in:</strong> ${params.get("checkin")}`);
if (params.get("checkout")) details.push(`<strong>Check-out:</strong> ${params.get("checkout")}`);
if (params.get("guests")) details.push(`<strong>Guests:</strong> ${params.get("guests")}`);
if (params.get("rooms")) details.push(`<strong>Rooms:</strong> ${params.get("rooms")}`);
document.getElementById("bookingDetails").innerHTML = details.length
  ? details.join(" · ")
  : "Select dates to personalize availability.";
if (params.get("checkin")) $("#checkin").val(params.get("checkin"));
if (params.get("checkout")) $("#checkout").val(params.get("checkout"));
if (params.get("guests")) $("#guests").val(params.get("guests"));
if (params.get("rooms")) $("#rooms").val(params.get("rooms"));

const baseRooms = [
  {
    name: "Deluxe King Suite",
    meta: "City terrace · Rain shower · Breakfast included",
    price: "$210 / night",
    base: ["open", "open", "limited", "open", "open"],
  },
  {
    name: "Loft Residence",
    meta: "Kitchenette · Workspace · Butler service",
    price: "$340 / night",
    base: ["limited", "open", "open", "open", "booked"],
  },
  {
    name: "Poolside Villa",
    meta: "Private plunge · Outdoor lounge · Chef's menu",
    price: "$540 / night",
    base: ["open", "open", "open", "limited", "limited"],
  },
  {
    name: "Atelier Penthouse",
    meta: "Panoramic view · Marble bath · Concierge lounge",
    price: "$720 / night",
    base: ["open", "limited", "booked", "booked", "open"],
  },
];

const startDate = params.get("checkin") ? new Date(params.get("checkin")) : new Date();
const nights = 45; // about a month and a half
const dates = Array.from({ length: nights }, (_, i) => {
  const d = new Date(startDate);
  d.setDate(d.getDate() + i);
  return d;
});

const head = document.getElementById("timelineHead");
const body = document.getElementById("timelineBody");
const slotWidth = 110;
const infoWidth = 260;

const headRow = document.createElement("tr");
const thRoom = document.createElement("th");
thRoom.textContent = "Room & rate";
thRoom.style.minWidth = `${infoWidth}px`;
headRow.appendChild(thRoom);
dates.forEach((d) => {
  const th = document.createElement("th");
  th.style.minWidth = `${slotWidth}px`;
  th.innerHTML = `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}<br>${d.toLocaleDateString(undefined, { weekday: "short" })}`;
  headRow.appendChild(th);
});
head.appendChild(headRow);

const rooms = baseRooms.map((room) => {
  const slots = Array.from({ length: nights }, (_, i) => room.base[i % room.base.length]);
  return { ...room, slots };
});

rooms.forEach((room) => {
  const tr = document.createElement("tr");
  const tdInfo = document.createElement("td");
  tdInfo.style.minWidth = `${infoWidth}px`;
  const info = document.createElement("div");
  info.className = "room-meta";
  info.innerHTML = `<h3>${room.name}</h3><div class="sub">${room.meta}</div><div class="price">${room.price}</div>`;
  tdInfo.appendChild(info);
  tr.appendChild(tdInfo);

  room.slots.slice(0, nights).forEach((status) => {
    const td = document.createElement("td");
    td.className = `slot ${status}`;
    td.style.minWidth = `${slotWidth}px`;
    td.textContent =
      status === "booked" ? "Booked" : status === "limited" ? "Filling" : "Open";
    tr.appendChild(td);
  });
  body.appendChild(tr);
});

$("#availabilityForm").on("submit", function (e) {
  e.preventDefault();
  const query = new URLSearchParams({
    checkin: $("#checkin").val(),
    checkout: $("#checkout").val(),
    guests: $("#guests").val(),
    rooms: $("#rooms").val(),
  });
  window.location.href = `check-availability.html?${query.toString()}`;
});
