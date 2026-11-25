import React, { useState, useMemo } from 'react';

// Data Dummy SPKLU Area Bandar Lampung
const INITIAL_STATIONS = [
  {
    id: 1,
    name: "SPKLU PLN — Kampus UBL Hub",
    address: "Jl. ZA. Pagar Alam No.26, Labuhan Ratu, Bandar Lampung",
    distance: 1.2, // km
    power: 60,     // kW
    price: 2466,   // Rp/kWh
    rating: 4.9,
    reviewsCount: 128,
    connectors: ["CCS2", "Type 2"],
    status: "Tersedia",
    slots: "2 / 2 Slot Kosong",
    facilities: ["WiFi", "Kantin", "Toilet", "Mushola"],
    mapPos: { top: "34%", left: "56%" },
    lastCheckIn: "10 menit lalu oleh Andi (Hyundai Ioniq 5) — 'Fast charging lancar!'"
  },
  {
    id: 2,
    name: "SPKLU Fast Charge — Mall Boemi Kedaton",
    address: "Jl. Teuku Umar No.1, Kedaton, Bandar Lampung",
    distance: 2.8,
    power: 50,
    price: 2466,
    rating: 4.7,
    reviewsCount: 94,
    connectors: ["CCS2", "CHAdeMO", "Type 2"],
    status: "Tersedia",
    slots: "1 / 2 Slot Kosong",
    facilities: ["Mall", "Restoran", "Parkir Indoor"],
    mapPos: { top: "62%", left: "68%" },
    lastCheckIn: "28 menit lalu oleh Rina (Wuling Air EV) — 'Slot sebelah masih kosong.'"
  },
  {
    id: 3,
    name: "SPKLU PLN — Urip Sumoharjo",
    address: "Jl. Urip Sumoharjo, Way Halim, Bandar Lampung",
    distance: 4.1,
    power: 100, // Ultra Fast Charging
    price: 2750,
    rating: 4.8,
    reviewsCount: 76,
    connectors: ["CCS2"],
    status: "Tersedia",
    slots: "2 / 3 Slot Kosong",
    facilities: ["Minimarket", "Cafe", "ATM"],
    mapPos: { top: "24%", left: "74%" },
    lastCheckIn: "1 jam lalu oleh Budi (BYD Seal) — '100 kW ngebut banget!'"
  },
  {
    id: 4,
    name: "SPKLU Rest Area — Terminal Rajabasa",
    address: "Jl. ZA. Pagar Alam, Rajabasa, Bandar Lampung",
    distance: 3.5,
    power: 22,
    price: 2466,
    rating: 4.4,
    reviewsCount: 51,
    connectors: ["Type 2"],
    status: "Sedang Dipakai",
    slots: "0 / 1 Slot (Antre ±15 mnt)",
    facilities: ["Toilet", "Warung Kopi"],
    mapPos: { top: "28%", left: "26%" },
    lastCheckIn: "5 menit lalu oleh Dimas (Chery Omoda E5) — 'Lagi ngecas sampai 80%.'"
  }
];

export default function App() {
  // State Filter
  const [selectedConnector, setSelectedConnector] = useState("Semua");
  const [batteryLevel, setBatteryLevel] = useState(25);
  const [selectedStationId, setSelectedStationId] = useState(1);

  // State Bobot Kriteria Rekomendasi
  const [wDistance, setWDistance] = useState(40);
  const [wPower, setWPower] = useState(35);
  const [wPrice, setWPrice] = useState(25);

  // Perhitungan Skor Kecocokan Multi-Kriteria Real-time
  const rankedStations = useMemo(() => {
    const filtered = INITIAL_STATIONS.filter(st =>
      selectedConnector === "Semua" ? true : st.connectors.includes(selectedConnector)
    );

    if (filtered.length === 0) return [];

    const minDist = Math.min(...filtered.map(s => s.distance));
    const maxPower = Math.max(...filtered.map(s => s.power));
    const minPrice = Math.min(...filtered.map(s => s.price));

    const totalWeight = (wDistance + wPower + wPrice) || 1;
    const normWDist = wDistance / totalWeight;
    const normWPower = wPower / totalWeight;
    const normWPrice = wPrice / totalWeight;

    return filtered
      .map(st => {
        const rDist = minDist / st.distance;
        const rPower = st.power / maxPower;
        const rPrice = minPrice / st.price;

        const availFactor = st.status === "Tersedia" ? 1 : 0.85;
        const matchScore = ((rDist * normWDist) + (rPower * normWPower) + (rPrice * normWPrice)) * availFactor;

        return {
          ...st,
          matchScore: Number(matchScore.toFixed(3))
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [selectedConnector, wDistance, wPower, wPrice]);

  const activeStation = rankedStations.find(s => s.id === selectedStationId) || rankedStations[0];

  // Estimasi Pengisian & Jejak Karbon (Berdasarkan sisa baterai ke 80%)
  const targetBattery = 80;
  const neededPercent = Math.max(targetBattery - batteryLevel, 10);
  const batteryCapacityKwh = 60;
  const neededKwh = ((neededPercent / 100) * batteryCapacityKwh).toFixed(1);
  const estimatedMinutes = activeStation ? Math.round((neededKwh / activeStation.power) * 60) : 0;
  const co2SavedKg = (neededKwh * 0.42).toFixed(1);

  return (
    <div style={styles.appWrapper}>
      {/* TOP NAVBAR */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}>⚡</div>
          <div>
            <div style={styles.brandTitle}>
              VoltMatch
            </div>
            <div style={styles.brandSub}>Smart EV Charging Map & Recommender</div>
          </div>
        </div>

        <div style={styles.navCenter}>
          <input
            type="text"
            value="📍 Bandar Lampung, Indonesia"
            readOnly
            style={styles.searchInput}
          />
          <select
            value={selectedConnector}
            onChange={e => setSelectedConnector(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="Semua">🔌 Semua Konektor</option>
            <option value="CCS2">⚡ CCS2 (Fast DC)</option>
            <option value="Type 2">🔋 Type 2 (AC)</option>
            <option value="CHAdeMO">🔌 CHAdeMO</option>
          </select>
        </div>

        <div style={styles.navRight}>
          <span style={styles.algoPill}>🌱 Eco-Smart Active</span>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div style={styles.mainLayout}>
        {/* LEFT SIDEBAR: PANEL PRIORITAS & DAFTAR REKOMENDASI */}
        <aside style={styles.sidebar}>
          <div style={styles.panelCard}>
            <div style={styles.panelHeader}>
              <span>⚖️ Prioritas Rekomendasi</span>
              <span style={styles.batteryTag}>Baterai: {batteryLevel}%</span>
            </div>

            <div style={styles.sliderRow}>
              <label style={styles.label}>Sisa Baterai EV ({batteryLevel}%)</label>
              <input
                type="range"
                min="5"
                max="75"
                value={batteryLevel}
                onChange={e => setBatteryLevel(Number(e.target.value))}
                style={styles.rangeInput}
              />
            </div>

            <div style={styles.divider} />

            <div style={styles.sliderRow}>
              <label style={styles.label}>📍 Bobot Jarak Terdekat: <b>{wDistance}%</b></label>
              <input
                type="range"
                min="0"
                max="100"
                value={wDistance}
                onChange={e => setWDistance(Number(e.target.value))}
                style={styles.rangeInput}
              />
            </div>

            <div style={styles.sliderRow}>
              <label style={styles.label}>⚡ Bobot Fast Charging (kW): <b>{wPower}%</b></label>
              <input
                type="range"
                min="0"
                max="100"
                value={wPower}
                onChange={e => setWPower(Number(e.target.value))}
                style={styles.rangeInput}
              />
            </div>

            <div style={styles.sliderRow}>
              <label style={styles.label}>💰 Bobot Tarif Hemat: <b>{wPrice}%</b></label>
              <input
                type="range"
                min="0"
                max="100"
                value={wPrice}
                onChange={e => setWPrice(Number(e.target.value))}
                style={styles.rangeInput}
              />
            </div>
          </div>

          <div style={styles.listHeader}>
            <span>🏆 Rekomendasi SPKLU Terbaik ({rankedStations.length})</span>
          </div>

          <div style={styles.stationList}>
            {rankedStations.map((st, idx) => {
              const isSelected = activeStation?.id === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  style={{
                    ...styles.stationCard,
                    border: isSelected ? "2px solid #16A34A" : "1px solid #DCE8E1",
                    backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF"
                  }}
                >
                  <div style={styles.cardTopRow}>
                    <span style={idx === 0 ? styles.rankGold : styles.rankNormal}>
                      {idx === 0 ? "🥇 #1 Best Match" : `#${idx + 1}`}
                    </span>
                    <span style={styles.sawScoreText}>Skor: {st.matchScore}</span>
                  </div>

                  <div style={styles.stName}>{st.name}</div>
                  <div style={styles.stMeta}>
                    <span>📍 {st.distance} km</span>
                    <span>⚡ {st.power} kW</span>
                    <span>💰 Rp {st.price}/kWh</span>
                  </div>

                  <div style={styles.cardBottomRow}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: st.status === "Tersedia" ? "#DCFCE7" : "#FEF3C7",
                        color: st.status === "Tersedia" ? "#166534" : "#92400E"
                      }}
                    >
                      ● {st.slots}
                    </span>
                    <span style={styles.ratingText}>⭐ {st.rating}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT AREA: PETA INTERAKTIF + DETAIL STASIUN */}
        <main style={styles.mapSection}>
          <div style={styles.mapCanvas}>
            <div style={styles.roadHorizontal} />
            <div style={styles.roadVertical} />
            <div style={styles.roadDiagonal} />

            {/* Label Wilayah */}
            <div style={{ ...styles.areaLabel, top: "14%", left: "18%" }}>Rajabasa</div>
            <div style={{ ...styles.areaLabel, top: "46%", left: "48%" }}>Labuhan Ratu</div>
            <div style={{ ...styles.areaLabel, top: "75%", left: "62%" }}>Kedaton</div>
            <div style={{ ...styles.areaLabel, top: "16%", left: "72%" }}>Way Halim</div>

            {/* Pin Posisi Pengguna */}
            <div style={{ ...styles.userPin, top: "48%", left: "44%" }}>
              🚗 Posisi Anda
            </div>

            {/* Pin Lokasi SPKLU */}
            {rankedStations.map((st, idx) => {
              const isSelected = activeStation?.id === st.id;
              const isAvail = st.status === "Tersedia";
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  style={{
                    ...styles.mapPin,
                    top: st.mapPos.top,
                    left: st.mapPos.left,
                    backgroundColor: isAvail ? "#16A34A" : "#D97706",
                    transform: isSelected ? "scale(1.18)" : "scale(1)",
                    zIndex: isSelected ? 10 : 5,
                    boxShadow: isSelected ? "0 0 0 4px rgba(22, 163, 74, 0.35)" : "0 4px 10px rgba(0,0,0,0.2)"
                  }}
                >
                  <span>⚡ #{idx + 1}</span>
                  <span style={styles.pinSub}>{st.power}kW • {st.matchScore}</span>
                </button>
              );
            })}

            {/* Legenda Peta */}
            <div style={styles.mapLegend}>
              <div><span style={{ color: "#16A34A" }}>●</span> Tersedia (Hijau)</div>
              <div><span style={{ color: "#D97706" }}>●</span> Sedang Dipakai (Oranye)</div>
              <div><span style={{ color: "#2563EB" }}>●</span> Lokasi Kendaraan Anda</div>
            </div>
          </div>

          {/* BOTTOM DETAIL DRAWER */}
          {activeStation && (
            <div style={styles.detailDrawer}>
              <div style={styles.detailLeft}>
                <div style={styles.detailTitleRow}>
                  <h2 style={styles.detailTitle}>{activeStation.name}</h2>
                  <span style={styles.connectorList}>
                    {activeStation.connectors.map(c => (
                      <span key={c} style={styles.connTag}>{c}</span>
                    ))}
                  </span>
                </div>
                <p style={styles.detailAddress}>📍 {activeStation.address}</p>

                <div style={styles.facilityRow}>
                  <strong>Fasilitas:</strong>{" "}
                  {activeStation.facilities.map(f => (
                    <span key={f} style={styles.facBadge}>{f}</span>
                  ))}
                </div>

                <div style={styles.checkinBox}>
                  💬 <strong>Check-in Pengguna Terbaru:</strong> {activeStation.lastCheckIn}
                </div>
              </div>

              <div style={styles.detailRight}>
                <div style={styles.ecoBoxTitle}>🌱 Estimasi Pengisian (ke 80%)</div>
                <div style={styles.ecoStatsGrid}>
                  <div style={styles.ecoStat}>
                    <div style={styles.ecoVal}>{estimatedMinutes} mnt</div>
                    <div style={styles.ecoLbl}>Durasi Cas ({neededKwh} kWh)</div>
                  </div>
                  <div style={styles.ecoStat}>
                    <div style={styles.ecoVal}>-{co2SavedKg} kg</div>
                    <div style={styles.ecoLbl}>Emisi CO₂ Dihemat</div>
                  </div>
                </div>
                <button
                  style={styles.navBtn}
                  onClick={() => alert(`Navigasi rute ramah lingkungan menuju ${activeStation.name} dimulai!`)}
                >
                  🧭 Mulai Rute & Check-in
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Styling Inline CSS
const styles = {
  appWrapper: {
    minHeight: "100vh",
    backgroundColor: "#F2F7F4",
    color: "#1E352B",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column"
  },
  navbar: {
    backgroundColor: "#165B40",
    color: "#FFFFFF",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  },
  navLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logoBox: {
    width: "40px",
    height: "40px",
    backgroundColor: "#22C55E",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.3rem"
  },
  brandTitle: { fontSize: "1.25rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" },
  brandSub: { fontSize: "0.78rem", opacity: 0.85 },
  navCenter: { display: "flex", gap: "10px", flexWrap: "wrap" },
  searchInput: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#FFFFFF",
    color: "#1E352B",
    fontWeight: "600",
    fontSize: "0.85rem",
    width: "220px"
  },
  filterSelect: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#E6F4ED",
    color: "#165B40",
    fontWeight: "700",
    fontSize: "0.85rem",
    cursor: "pointer"
  },
  navRight: { display: "flex", alignItems: "center" },
  algoPill: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "700"
  },
  mainLayout: {
    display: "grid",
    gridTemplateColumns: "370px 1fr",
    gap: "18px",
    padding: "18px",
    flex: 1
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  panelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "14px",
    padding: "16px",
    border: "1px solid #D5E5DD",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "700",
    fontSize: "0.95rem",
    color: "#165B40",
    marginBottom: "12px"
  },
  batteryTag: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    padding: "3px 8px",
    borderRadius: "8px",
    fontSize: "0.78rem"
  },
  sliderRow: { marginBottom: "10px" },
  label: { display: "block", fontSize: "0.82rem", marginBottom: "4px", color: "#374151" },
  rangeInput: { width: "100%", accentColor: "#16A34A", cursor: "pointer" },
  divider: { height: "1px", backgroundColor: "#E5EFEA", margin: "10px 0" },
  listHeader: {
    fontWeight: "700",
    fontSize: "0.92rem",
    color: "#165B40",
    paddingLeft: "4px"
  },
  stationList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "420px",
    overflowY: "auto"
  },
  stationCard: {
    borderRadius: "12px",
    padding: "14px",
    cursor: "pointer",
    transition: "0.15s"
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },
  rankGold: {
    backgroundColor: "#DCFCE7",
    color: "#15803D",
    fontWeight: "800",
    fontSize: "0.75rem",
    padding: "3px 8px",
    borderRadius: "6px"
  },
  rankNormal: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    fontWeight: "700",
    fontSize: "0.75rem",
    padding: "3px 8px",
    borderRadius: "6px"
  },
  sawScoreText: { fontWeight: "800", fontSize: "0.85rem", color: "#165B40" },
  stName: { fontWeight: "700", fontSize: "0.95rem", marginBottom: "4px" },
  stMeta: {
    display: "flex",
    gap: "12px",
    fontSize: "0.8rem",
    color: "#5C736A",
    marginBottom: "8px"
  },
  cardBottomRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { fontSize: "0.75rem", fontWeight: "700", padding: "3px 8px", borderRadius: "10px" },
  ratingText: { fontSize: "0.8rem", fontWeight: "700", color: "#475569" },
  mapSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  mapCanvas: {
    flex: 1,
    minHeight: "360px",
    backgroundColor: "#E4EFE9",
    borderRadius: "16px",
    border: "1px solid #C5DDD0",
    position: "relative",
    overflow: "hidden",
    backgroundImage: "radial-gradient(#B5D3C4 1.5px, transparent 1.5px)",
    backgroundSize: "24px 24px"
  },
  roadHorizontal: {
    position: "absolute",
    top: "52%",
    left: 0,
    right: 0,
    height: "16px",
    backgroundColor: "#FFFFFF",
    borderTop: "2px solid #CBD5E1",
    borderBottom: "2px solid #CBD5E1"
  },
  roadVertical: {
    position: "absolute",
    left: "48%",
    top: 0,
    bottom: 0,
    width: "16px",
    backgroundColor: "#FFFFFF",
    borderLeft: "2px solid #CBD5E1",
    borderRight: "2px solid #CBD5E1"
  },
  roadDiagonal: {
    position: "absolute",
    top: "20%",
    left: "-10%",
    width: "120%",
    height: "12px",
    backgroundColor: "#FFFFFF",
    transform: "rotate(18deg)",
    borderTop: "1px solid #CBD5E1",
    borderBottom: "1px solid #CBD5E1"
  },
  areaLabel: {
    position: "absolute",
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "#648275",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  userPin: {
    position: "absolute",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.78rem",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
    zIndex: 6
  },
  mapPin: {
    position: "absolute",
    color: "#FFFFFF",
    border: "2px solid #FFFFFF",
    borderRadius: "20px",
    padding: "6px 12px",
    fontSize: "0.78rem",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "0.2s"
  },
  pinSub: { fontSize: "0.68rem", opacity: 0.92 },
  mapLegend: {
    position: "absolute",
    bottom: "14px",
    left: "14px",
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "0.75rem",
    fontWeight: "600",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  },
  detailDrawer: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #D5E5DD",
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)"
  },
  detailLeft: { display: "flex", flexDirection: "column", gap: "8px" },
  detailTitleRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  detailTitle: { fontSize: "1.15rem", color: "#165B40", margin: 0 },
  connectorList: { display: "flex", gap: "6px" },
  connTag: {
    backgroundColor: "#E6F4ED",
    color: "#165B40",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: "700"
  },
  detailAddress: { fontSize: "0.85rem", color: "#5C736A", margin: 0 },
  facilityRow: { fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" },
  facBadge: {
    backgroundColor: "#F1F5F9",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "0.75rem"
  },
  checkinBox: {
    backgroundColor: "#F8FAFC",
    borderLeft: "3px solid #16A34A",
    padding: "8px 12px",
    fontSize: "0.8rem",
    borderRadius: "6px",
    marginTop: "4px"
  },
  detailRight: {
    backgroundColor: "#F0FDF4",
    borderRadius: "12px",
    padding: "14px",
    border: "1px solid #BBF7D0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  ecoBoxTitle: { fontSize: "0.85rem", fontWeight: "700", color: "#166534", marginBottom: "8px" },
  ecoStatsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" },
  ecoStat: { backgroundColor: "#FFFFFF", padding: "8px", borderRadius: "8px", textAlign: "center" },
  ecoVal: { fontSize: "1.05rem", fontWeight: "800", color: "#15803D" },
  ecoLbl: { fontSize: "0.7rem", color: "#5C736A" },
  navBtn: {
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    border: "none",
    padding: "10px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "0.85rem",
    cursor: "pointer"
  }
};