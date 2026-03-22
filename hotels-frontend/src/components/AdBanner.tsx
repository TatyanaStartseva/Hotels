import "./AdBanner.css";
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

  const cardContent = (
    <>
      <div className="ad-banner__badge">Реклама</div>

      {ad.image_url ? (
        <img
          src={ad.image_url}
          alt={ad.title}
          className="ad-banner__image"
        />
      ) : (
        <div className="ad-banner__image ad-banner__image--empty" />
      )}

      <div className="ad-banner__body">
        <h3 className="ad-banner__title">{ad.title}</h3>
        {ad.description && (
          <p className="ad-banner__description">{ad.description}</p>
        )}
      </div>
    </>
  );

  if (ad.target_url) {
    return (
      <a
        href={ad.target_url}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        className="ad-banner"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div className="ad-banner" onClick={handleClick}>
      {cardContent}
    </div>
  );
}