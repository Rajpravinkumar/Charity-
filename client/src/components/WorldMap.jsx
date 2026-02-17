const activeCountries = [
  { name: "Canada", x: 150, y: 120, color: "#2E7D32" },
  { name: "USA", x: 180, y: 165, color: "#C62828" },
  { name: "Mexico", x: 210, y: 200, color: "#6A1B9A" },
  { name: "Brazil", x: 285, y: 285, color: "#00838F" },
  { name: "Colombia", x: 250, y: 250, color: "#283593" },
  { name: "Peru", x: 258, y: 285, color: "#E65100" },
  { name: "Chile", x: 250, y: 325, color: "#5D4037" },
  { name: "Argentina", x: 285, y: 345, color: "#1565C0" },
  { name: "India", x: 490, y: 220, color: "#2E7D32" },
  { name: "Bangladesh", x: 510, y: 222, color: "#00838F" },
  { name: "Nepal", x: 500, y: 210, color: "#E65100" },
  { name: "Philippines", x: 560, y: 230, color: "#6A1B9A" },
  { name: "Indonesia", x: 545, y: 270, color: "#1565C0" },
  { name: "Kenya", x: 430, y: 270, color: "#C62828" },
  { name: "Ethiopia", x: 445, y: 248, color: "#AD1457" },
  { name: "Nigeria", x: 390, y: 250, color: "#283593" },
  { name: "South Africa", x: 425, y: 325, color: "#2E7D32" },
  { name: "Germany", x: 415, y: 155, color: "#E65100" },
  { name: "Italy", x: 425, y: 173, color: "#5D4037" },
  { name: "Greece", x: 440, y: 178, color: "#1565C0" },
  { name: "Ukraine", x: 455, y: 158, color: "#00838F" },
  { name: "Australia", x: 640, y: 305, color: "#6A1B9A" },
  { name: "New Zealand", x: 705, y: 330, color: "#C62828" }
];

export default function WorldMap() {
  return (
    <div className="map-card">
      <h3>Where We Are Active</h3>
      <svg viewBox="0 0 800 420" className="world-map" role="img" aria-label="World map showing active countries">
        <rect x="40" y="120" width="230" height="120" rx="60" className="continent" />
        <rect x="260" y="220" width="130" height="150" rx="60" className="continent" />
        <rect x="330" y="120" width="170" height="90" rx="50" className="continent" />
        <rect x="430" y="90" width="280" height="190" rx="80" className="continent" />
        <rect x="620" y="270" width="120" height="70" rx="35" className="continent" />

        {activeCountries.map((country) => (
          <g key={country.name}>
            <circle cx={country.x} cy={country.y} r="8" fill={country.color} />
            <text x={country.x + 12} y={country.y + 5} className="map-label">
              {country.name}
            </text>
          </g>
        ))}
      </svg>
      <div className="map-legend">
        {activeCountries.map((country) => (
          <span key={country.name}>
            <i style={{ backgroundColor: country.color }} />
            {country.name}
          </span>
        ))}
      </div>
    </div>
  );
}
