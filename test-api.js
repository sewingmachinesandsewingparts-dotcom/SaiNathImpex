import axios from "axios";

async function test() {
  console.log("Fetching parts from Next.js local server...");
  try {
    const res = await axios.get("http://localhost:3000/api/parts?brand=pegasus&mcg=PG-80005");
    console.log("Status:", res.status);
    console.log("Parts returned:", res.data.length);
    res.data.forEach(p => {
      console.log(`- SKU: ${p.sku}, Name: ${p.name}, MCG: ${p.MCG}, Series: ${p?.linkedSeries?.series}`);
    });
  } catch (err) {
    console.error("Error fetching:", err.message);
  }
}

// Wait a bit for dev server to boot up, then test
setTimeout(test, 3000);
