import { useEffect, useState } from "react";
import { createPet, deletePet, getMyPets, type Pet } from "../api/pets";

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [conditions, setConditions] = useState("");
  const [dietType, setDietType] = useState("");
  const [feedings, setFeedings] = useState<number | "">("");

  const load = async () => {
    const data = await getMyPets();
    setPets(data);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const onCreate = async () => {
    try {
      await createPet({
        conditions: conditions || null,
        diet_type: dietType || null,
        feedings_per_day: feedings === "" ? null : Number(feedings),
      });
      setConditions("");
      setDietType("");
      setFeedings("");
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Ошибка создания питомца");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Удалить питомца?")) return;
    await deletePet(id);
    await load();
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Мои питомцы</h1>

      <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 20 }}>
        <h3>Добавить питомца (минимально)</h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="Условия содержания"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <input
            placeholder="Диета (тип)"
            value={dietType}
            onChange={(e) => setDietType(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <input
            placeholder="Кормлений/день"
            type="number"
            value={feedings}
            onChange={(e) => setFeedings(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: 140 }}
          />
          <button onClick={onCreate}>Создать</button>
        </div>
      </div>

      <ul>
        {pets.map((p) => (
          <li key={p.id} style={{ marginBottom: 10 }}>
            <b>#{p.id}</b>{" "}
            {p.conditions ? `— ${p.conditions}` : ""}{" "}
            {p.diet_type ? `— диета: ${p.diet_type}` : ""}{" "}
            {p.feedings_per_day ? `— кормлений/день: ${p.feedings_per_day}` : ""}
            <button style={{ marginLeft: 10 }} onClick={() => onDelete(p.id)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
