import { useEffect, useState } from "react";
import { getRandomAd, registerAdClick, type AdOut } from "../api/ads";

export default function AdBanner() {
  const [ad, setAd] = useState<AdOut | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRandomAd();
        setAd(data);
      } catch (e) {
        console.error("ad load failed", e);
        setAd(null);
      }
    };
    load();
  }, []);

  if (!ad) return null;

  const handleClick = async () => {
    try {
      await registerAdClick(ad.id);
    } catch (e) {
      console.error("ad click failed", e);
    }
  };

  const content = (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        background: "#fafafa",
      }}
    >
      {ad.image_url && (
        <img
          src={ad.image_url}
          alt={ad.title}
          style={{
            width: "100%",
            maxHeight: 250,
            objectFit: "cover",
            borderRadius: 8,
            marginBottom: 10,
          }}
        />
      )}
      <div style={{ fontWeight: 700 }}>{ad.title}</div>

    </div>
  );

  if (ad.target_url) {
    return (
      <a
        href={ad.target_url}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {content}
      </a>
    );
  }

  return <div onClick={handleClick}>{content}</div>;
}