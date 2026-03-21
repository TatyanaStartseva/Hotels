import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyPets, createPet, deletePet, type Pet } from "../api/pets";

export default function PetsPage() {
  const navigate = useNavigate();

  const [pets, setPets] = useState<Pet[]>([]);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("cat");

  const [temperatureMin, setTemperatureMin] = useState<number | "">("");
  const [temperatureMax, setTemperatureMax] = useState<number | "">("");
  const [humidityMin, setHumidityMin] = useState<number | "">("");
  const [humidityMax, setHumidityMax] = useState<number | "">("");

  const [conditions, setConditions] = useState("");
  const [vaccinationsText, setVaccinationsText] = useState("");
  const [chipId, setChipId] = useState("");

  const [dietType, setDietType] = useState("");
  const [dietDetails, setDietDetails] = useState("");
  const [feedingsPerDay, setFeedingsPerDay] = useState<number | "">("");

  const [licenseRequired, setLicenseRequired] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");

  const [cohabitationAllowed, setCohabitationAllowed] = useState(true);
  const [cohabitationNotes, setCohabitationNotes] = useState("");
  const [compatibleSpeciesText, setCompatibleSpeciesText] = useState("");

  const loadPets = async () => {
    try {
      const data = await getMyPets();
      setPets(data);
    } catch (e) {
      console.error("loadPets failed:", e);
      setPets([]);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handleCreatePet = async () => {
    if (!name.trim()) {
      alert("Введите имя питомца");
      return;
    }

    const vaccinations = vaccinationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const compatibleSpecies = compatibleSpeciesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await createPet({
        name: name.trim(),
        species,
        temperature_min: temperatureMin === "" ? null : Number(temperatureMin),
        temperature_max: temperatureMax === "" ? null : Number(temperatureMax),
        humidity_min: humidityMin === "" ? null : Number(humidityMin),
        humidity_max: humidityMax === "" ? null : Number(humidityMax),
        conditions: conditions.trim() || null,
        vaccinations: vaccinations.length ? vaccinations : null,
        chip_id: chipId.trim() || null,
        diet_type: dietType.trim() || null,
        diet_details: dietDetails.trim() || null,
        feedings_per_day: feedingsPerDay === "" ? null : Number(feedingsPerDay),
        license_required: licenseRequired,
        license_number: licenseNumber.trim() || null,
        cohabitation_allowed: cohabitationAllowed,
        cohabitation_notes: cohabitationNotes.trim() || null,
        compatible_species: compatibleSpecies.length ? compatibleSpecies : null,
      });

      setName("");
      setSpecies("cat");
      setTemperatureMin("");
      setTemperatureMax("");
      setHumidityMin("");
      setHumidityMax("");
      setConditions("");
      setVaccinationsText("");
      setChipId("");
      setDietType("");
      setDietDetails("");
      setFeedingsPerDay("");
      setLicenseRequired(false);
      setLicenseNumber("");
      setCohabitationAllowed(true);
      setCohabitationNotes("");
      setCompatibleSpeciesText("");

      await loadPets();
      alert("Питомец добавлен");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? e?.message ?? "Ошибка при добавлении питомца");
    }
  };

  const handleDeletePet = async (petId: number) => {
    if (!confirm("Удалить питомца?")) return;

    try {
      await deletePet(petId);
      await loadPets();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? e?.message ?? "Ошибка при удалении питомца");
    }
  };

  const speciesLabel = (value: string) => {
    switch (value) {
      case "cat":
        return "Кошка";
      case "dog":
        return "Собака";
      case "rabbit":
        return "Кролик";
      case "rodent":
        return "Грызун";
      case "bird":
        return "Птица";
      case "snake":
        return "Змея";
      case "reptile":
        return "Рептилия";
      case "spider":
        return "Паук";
      default:
        return value;
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1>Мои питомцы</h1>
        <button onClick={() => navigate("/")}>Назад к отелям</button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Добавить питомца</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="Имя питомца"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 220 }}
          />

          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            style={{ width: 180 }}
          >
            <option value="cat">Кошка</option>
            <option value="dog">Собака</option>
            <option value="rabbit">Кролик</option>
            <option value="rodent">Грызун</option>
            <option value="bird">Птица</option>
            <option value="snake">Змея</option>
            <option value="reptile">Рептилия</option>
            <option value="spider">Паук</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <input
            placeholder="Темп. мин"
            type="number"
            value={temperatureMin}
            onChange={(e) =>
              setTemperatureMin(e.target.value === "" ? "" : Number(e.target.value))
            }
            style={{ width: 140 }}
          />
          <input
            placeholder="Темп. макс"
            type="number"
            value={temperatureMax}
            onChange={(e) =>
              setTemperatureMax(e.target.value === "" ? "" : Number(e.target.value))
            }
            style={{ width: 140 }}
          />

          <input
            placeholder="Влажн. мин"
            type="number"
            value={humidityMin}
            onChange={(e) =>
              setHumidityMin(e.target.value === "" ? "" : Number(e.target.value))
            }
            style={{ width: 140 }}
          />
          <input
            placeholder="Влажн. макс"
            type="number"
            value={humidityMax}
            onChange={(e) =>
              setHumidityMax(e.target.value === "" ? "" : Number(e.target.value))
            }
            style={{ width: 140 }}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <input
            placeholder="Условия содержания"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <input
            placeholder="Прививки (через запятую)"
            value={vaccinationsText}
            onChange={(e) => setVaccinationsText(e.target.value)}
            style={{ width: 280 }}
          />

          <input
            placeholder="ID чипа"
            value={chipId}
            onChange={(e) => setChipId(e.target.value)}
            style={{ width: 220 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <input
            placeholder="Диета (тип)"
            value={dietType}
            onChange={(e) => setDietType(e.target.value)}
            style={{ width: 200 }}
          />

          <input
            placeholder="Особенности питания"
            value={dietDetails}
            onChange={(e) => setDietDetails(e.target.value)}
            style={{ width: 280 }}
          />

          <input
            placeholder="Кормлений/день"
            type="number"
            value={feedingsPerDay}
            onChange={(e) =>
              setFeedingsPerDay(e.target.value === "" ? "" : Number(e.target.value))
            }
            style={{ width: 180 }}
          />
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Нужна лицензия:
            <input
              type="checkbox"
              checked={licenseRequired}
              onChange={(e) => setLicenseRequired(e.target.checked)}
            />
          </label>

          <input
            placeholder="Номер лицензии"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            style={{ width: 220 }}
          />
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Можно совместно содержать:
            <input
              type="checkbox"
              checked={cohabitationAllowed}
              onChange={(e) => setCohabitationAllowed(e.target.checked)}
            />
          </label>

          <input
            placeholder="Заметки по совместному содержанию"
            value={cohabitationNotes}
            onChange={(e) => setCohabitationNotes(e.target.value)}
            style={{ width: 320 }}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <input
            placeholder="Совместимые виды (через запятую)"
            value={compatibleSpeciesText}
            onChange={(e) => setCompatibleSpeciesText(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <button onClick={handleCreatePet} style={{ marginTop: 16 }}>
          Добавить питомца
        </button>
      </div>

      <h2>Сохранённые питомцы</h2>

      {pets.length === 0 ? (
        <p style={{ color: "gray" }}>Питомцев пока нет.</p>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {pets.map((p) => (
            <li key={p.id} style={{ marginBottom: 16 }}>
              <div>
                <b>{p.name}</b> — {speciesLabel(p.species)}
              </div>

              {p.conditions && (
                <div>
                  <span style={{ color: "gray" }}>Условия:</span> {p.conditions}
                </div>
              )}

              {(p.temperature_min != null || p.temperature_max != null) && (
                <div>
                  <span style={{ color: "gray" }}>Температура:</span>{" "}
                  {p.temperature_min ?? "—"} — {p.temperature_max ?? "—"} °C
                </div>
              )}

              {(p.humidity_min != null || p.humidity_max != null) && (
                <div>
                  <span style={{ color: "gray" }}>Влажность:</span>{" "}
                  {p.humidity_min ?? "—"} — {p.humidity_max ?? "—"} %
                </div>
              )}

              {p.vaccinations && p.vaccinations.length > 0 && (
                <div>
                  <span style={{ color: "gray" }}>Прививки:</span>{" "}
                  {p.vaccinations.join(", ")}
                </div>
              )}

              {p.diet_type && (
                <div>
                  <span style={{ color: "gray" }}>Диета:</span> {p.diet_type}
                </div>
              )}

              {p.feedings_per_day != null && (
                <div>
                  <span style={{ color: "gray" }}>Кормлений в день:</span>{" "}
                  {p.feedings_per_day}
                </div>
              )}

              <button
                style={{ marginTop: 8 }}
                onClick={() => handleDeletePet(p.id)}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}