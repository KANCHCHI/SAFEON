let espIP = "";
let ws;
let lastLat = 0, lastLon = 0;

document.getElementById("connectBtn").onclick = () => connectESP();

function connectESP() {
  espIP = document.getElementById("ipInput").value.trim();
  if (!espIP) return alert("Enter ESP32 IP address");
  const wsURL = `ws://${espIP}:81/`;
  ws = new WebSocket(wsURL);

  ws.onopen = () => {
    updateStatus(`✅ Connected to ${espIP}`);
    startLocationUpdates();
  };

  ws.onmessage = (event) => {
    console.log("Received:", event.data);
    if (event.data.toLowerCase().includes("vacation")) {
      updateStatus("📍 ESP requested current location...");
      sendLocationToESP();
    }
  };

  ws.onclose = () => updateStatus("❌ WebSocket closed. Reconnect?");
}

function startLocationUpdates() {
  if (!navigator.geolocation) return alert("GPS not supported");
  getLocation();                            // initial fix
  setInterval(getLocation, 10*60*1000);     // every 10 min
}

function getLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lastLat = pos.coords.latitude.toFixed(6);
      lastLon = pos.coords.longitude.toFixed(6);
      document.getElementById("location").innerText =
        `Location: ${lastLat}, ${lastLon}`;
    },
    (err) => updateStatus("⚠️ Unable to read GPS (" + err.message + ")"),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function sendLocationToESP() {
  if (!lastLat || !lastLon) return updateStatus("No GPS yet!");
  fetch(`http://${espIP}/update?lat=${lastLat}&lon=${lastLon}`)
    .then(r => r.text())
    .then(t => updateStatus("✅ Sent: " + t))
    .catch(e => updateStatus("❌ Failed: " + e));
}

function updateStatus(msg) {
  document.getElementById("status").innerText = msg;
  console.log(msg);
}
