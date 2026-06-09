import { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  async function generateQR() {
    try {
      const res = await fetch("https://qrforgeeeee.workers.dev/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      console.log(err);
      setResult("Error connecting to Worker");
    }
  }

  return (
    <div className="container">
      <h1>QRForge</h1>

      <input
        placeholder="Enter text or URL"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={generateQR}>
        Generate QR
      </button>

      <p>{result}</p>
    </div>
  );
}

export default App;
