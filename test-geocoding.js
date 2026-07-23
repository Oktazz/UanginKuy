async function test() {
  const query = "Jendral Sudirman, Jakarta Selatan, DKI Jakarta";
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
    headers: {
      "User-Agent": "UanginKuyApp/1.0"
    }
  });
  console.log(res.status);
  const data = await res.json();
  console.log(data);
}
test();
