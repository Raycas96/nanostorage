import { useNanoStorage } from "@raycas96/nanostorage/react";

export function App() {
  const [theme, setTheme, removeTheme] = useNanoStorage<string>(
    "theme",
    "light",
  );
  const [token, setToken] = useNanoStorage<string | null>("token", null, {
    area: "session",
  });

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h2>localStorage theme: {theme}</h2>
      <button
        onClick={() => setTheme((p) => (p === "light" ? "dark" : "light"))}
      >
        Toggle
      </button>
      <button onClick={removeTheme} style={{ marginLeft: "0.5rem" }}>
        Remove
      </button>

      <h2>sessionStorage token: {token ?? "none"}</h2>
      <button onClick={() => setToken("abc-123")}>Set token</button>
    </div>
  );
}
