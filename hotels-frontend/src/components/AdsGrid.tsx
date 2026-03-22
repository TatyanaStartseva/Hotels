import AdBanner from "./AdBanner";

export default function AdsGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <AdBanner />
      <AdBanner />
      <AdBanner />
      <AdBanner />
    </div>
  );
}