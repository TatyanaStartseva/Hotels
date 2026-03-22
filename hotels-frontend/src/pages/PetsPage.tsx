import "./PetsPage.css";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyPets,
  createPet,
  updatePet,
  deletePet,
  type Pet,
} from "../api/pets";

type SpeciesOption = { label: string; value: string };

const SPECIES_OPTIONS: SpeciesOption[] = [
  { label: "Кошка", value: "cat" },
  { label: "Собака", value: "dog" },
  { label: "Кролик", value: "rabbit" },
  { label: "Грызун", value: "rodent" },
  { label: "Птица", value: "bird" },
  { label: "Змея", value: "snake" },
  { label: "Рептилия", value: "reptile" },
  { label: "Паук", value: "spider" },
];

function getSpeciesLabel(species?: string) {
  switch (species) {
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
      return "Не указано";
  }
}

function boolText(value?: boolean | null) {
  if (value === true) return "Да";
  if (value === false) return "Нет";
  return "Не указано";
}

function formatVaccinations(vaccinations?: any[]) {
  if (!vaccinations || vaccinations.length === 0) return "Не указано";

  if (typeof vaccinations[0] === "string") {
    return vaccinations.join(", ");
  }

  return vaccinations
    .map((item) => item?.name || "")
    .filter(Boolean)
    .join(", ");
}

export default function PetsPage() {
  const navigate = useNavigate();

  const [pets, setPets] = useState<Pet[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("cat");
  const [conditions, setConditions] = useState("");

  const [temperatureMin, setTemperatureMin] = useState<number | "">("");
  const [temperatureMax, setTemperatureMax] = useState<number | "">("");
  const [humidityMin, setHumidityMin] = useState<number | "">("");
  const [humidityMax, setHumidityMax] = useState<number | "">("");

  const [dietType, setDietType] = useState("");
  const [dietDetails, setDietDetails] = useState("");
  const [feedingsPerDay, setFeedingsPerDay] = useState<number | "">("");

  const [vaccinationsText, setVaccinationsText] = useState("");
  const [licenseRequired, setLicenseRequired] = useState<boolean | "">("");
  const [cohabitationAllowed, setCohabitationAllowed] = useState<boolean | "">("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [editName, setEditName] = useState("");
  const [editSpecies, setEditSpecies] = useState("cat");
  const [editConditions, setEditConditions] = useState("");

  const [editTemperatureMin, setEditTemperatureMin] = useState<number | "">("");
  const [editTemperatureMax, setEditTemperatureMax] = useState<number | "">("");
  const [editHumidityMin, setEditHumidityMin] = useState<number | "">("");
  const [editHumidityMax, setEditHumidityMax] = useState<number | "">("");

  const [editDietType, setEditDietType] = useState("");
  const [editDietDetails, setEditDietDetails] = useState("");
  const [editFeedingsPerDay, setEditFeedingsPerDay] = useState<number | "">("");

  const [editVaccinationsText, setEditVaccinationsText] = useState("");
  const [editLicenseRequired, setEditLicenseRequired] = useState<boolean | "">("");
  const [editCohabitationAllowed, setEditCohabitationAllowed] = useState<boolean | "">("");

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    setMessage(null);
    try {
      const data = await getMyPets();
      setPets(data);

      if (!data.length) {
        setMessage("У вас пока нет добавленных питомцев.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Ошибка при загрузке питомцев.");
    }
  };

  const clearCreateForm = () => {
    setName("");
    setSpecies("cat");
    setConditions("");
    setTemperatureMin("");
    setTemperatureMax("");
    setHumidityMin("");
    setHumidityMax("");
    setDietType("");
    setDietDetails("");
    setFeedingsPerDay("");
    setVaccinationsText("");
    setLicenseRequired("");
    setCohabitationAllowed("");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert("Введите имя питомца");
      return;
    }

    try {
      const vaccinations = vaccinationsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await createPet({
        name: name.trim(),
        species,
        conditions: conditions.trim() || null,
        temperature_min: temperatureMin === "" ? null : Number(temperatureMin),
        temperature_max: temperatureMax === "" ? null : Number(temperatureMax),
        humidity_min: humidityMin === "" ? null : Number(humidityMin),
        humidity_max: humidityMax === "" ? null : Number(humidityMax),
        diet_type: dietType.trim() || null,
        diet_details: dietDetails.trim() || null,
        feedings_per_day: feedingsPerDay === "" ? null : Number(feedingsPerDay),
        vaccinations,
        license_required: licenseRequired === "" ? null : licenseRequired,
        cohabitation_allowed:
          cohabitationAllowed === "" ? null : cohabitationAllowed,
      });

      clearCreateForm();
      await loadPets();
    } catch (e) {
      console.error(e);
      alert("Ошибка при создании питомца");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить питомца?")) return;

    try {
      await deletePet(id);
      await loadPets();
    } catch (e) {
      console.error(e);
      alert("Ошибка при удалении питомца");
    }
  };

  const startEdit = (pet: Pet) => {
    setEditingId(pet.id);

    setEditName(pet.name || "");
    setEditSpecies((pet as any).species || "cat");
    setEditConditions((pet as any).conditions || "");

    setEditTemperatureMin((pet as any).temperature_min ?? "");
    setEditTemperatureMax((pet as any).temperature_max ?? "");
    setEditHumidityMin((pet as any).humidity_min ?? "");
    setEditHumidityMax((pet as any).humidity_max ?? "");

    setEditDietType((pet as any).diet_type || "");
    setEditDietDetails((pet as any).diet_details || "");
    setEditFeedingsPerDay((pet as any).feedings_per_day ?? "");

    const vaccinations = (pet as any).vaccinations || [];
    if (vaccinations.length && typeof vaccinations[0] === "string") {
      setEditVaccinationsText(vaccinations.join(", "));
    } else {
      setEditVaccinationsText(
        vaccinations
          .map((item: any) => item?.name || "")
          .filter(Boolean)
          .join(", ")
      );
    }

    setEditLicenseRequired((pet as any).license_required ?? "");
    setEditCohabitationAllowed((pet as any).cohabitation_allowed ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);

    setEditName("");
    setEditSpecies("cat");
    setEditConditions("");

    setEditTemperatureMin("");
    setEditTemperatureMax("");
    setEditHumidityMin("");
    setEditHumidityMax("");

    setEditDietType("");
    setEditDietDetails("");
    setEditFeedingsPerDay("");

    setEditVaccinationsText("");
    setEditLicenseRequired("");
    setEditCohabitationAllowed("");
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const vaccinations = editVaccinationsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await updatePet(editingId, {
        name: editName.trim(),
        species: editSpecies,
        conditions: editConditions.trim() || null,
        temperature_min:
          editTemperatureMin === "" ? null : Number(editTemperatureMin),
        temperature_max:
          editTemperatureMax === "" ? null : Number(editTemperatureMax),
        humidity_min: editHumidityMin === "" ? null : Number(editHumidityMin),
        humidity_max: editHumidityMax === "" ? null : Number(editHumidityMax),
        diet_type: editDietType.trim() || null,
        diet_details: editDietDetails.trim() || null,
        feedings_per_day:
          editFeedingsPerDay === "" ? null : Number(editFeedingsPerDay),
        vaccinations,
        license_required:
          editLicenseRequired === "" ? null : editLicenseRequired,
        cohabitation_allowed:
          editCohabitationAllowed === "" ? null : editCohabitationAllowed,
      });

      cancelEdit();
      await loadPets();
    } catch (e) {
      console.error(e);
      alert("Ошибка при обновлении питомца");
    }
  };

  return (
    <div className="pets-page">
      <div className="pets-page__container">
        <section className="pets-card pets-hero">
          <div className="pets-hero__top">
            <div>
              <h1 className="pets-hero__title">Мои питомцы</h1>
              <p className="pets-hero__subtitle">
                Добавляйте питомцев и управляйте их условиями содержания
              </p>
            </div>

            <div className="pets-actions">
              <button
                type="button"
                className="pets-btn pets-btn--ghost"
                onClick={() => navigate("/hotels")}
              >
                К отелям
              </button>

              <button
                type="button"
                className="pets-btn pets-btn--secondary"
                onClick={() => navigate("/bookings")}
              >
                Мои бронирования
              </button>

              <button
                type="button"
                className="pets-btn pets-btn--primary"
                onClick={loadPets}
              >
                Обновить список
              </button>
            </div>
          </div>
        </section>

        <section className="pets-card">
          <h2 className="pets-section-title">Добавить питомца</h2>

          <div className="pets-form-grid">
            <div className="pets-field">
              <label className="pets-label">Имя</label>
              <input
                className="pets-input"
                placeholder="Имя питомца"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="pets-field">
              <label className="pets-label">Вид</label>
              <select
                className="pets-select"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              >
                {SPECIES_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pets-field pets-field--wide">
              <label className="pets-label">Особые условия</label>
              <textarea
                className="pets-textarea"
                placeholder="Например: нужен террариум, подогрев, тишина..."
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            </div>

            <div className="pets-field">
              <label className="pets-label">Температура мин</label>
              <input
                className="pets-input"
                type="number"
                value={temperatureMin}
                onChange={(e) =>
                  setTemperatureMin(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <div className="pets-field">
              <label className="pets-label">Температура макс</label>
              <input
                className="pets-input"
                type="number"
                value={temperatureMax}
                onChange={(e) =>
                  setTemperatureMax(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <div className="pets-field">
              <label className="pets-label">Влажность мин</label>
              <input
                className="pets-input"
                type="number"
                value={humidityMin}
                onChange={(e) =>
                  setHumidityMin(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <div className="pets-field">
              <label className="pets-label">Влажность макс</label>
              <input
                className="pets-input"
                type="number"
                value={humidityMax}
                onChange={(e) =>
                  setHumidityMax(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <div className="pets-field">
              <label className="pets-label">Тип питания</label>
              <input
                className="pets-input"
                placeholder="Например: сухой корм"
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
              />
            </div>

            <div className="pets-field">
              <label className="pets-label">Кормлений в день</label>
              <input
                className="pets-input"
                type="number"
                value={feedingsPerDay}
                onChange={(e) =>
                  setFeedingsPerDay(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <div className="pets-field pets-field--wide">
              <label className="pets-label">Детали питания</label>
              <textarea
                className="pets-textarea"
                placeholder="Например: кормить 2 раза в день, без молочных продуктов"
                value={dietDetails}
                onChange={(e) => setDietDetails(e.target.value)}
              />
            </div>

            <div className="pets-field pets-field--wide">
              <label className="pets-label">Прививки</label>
              <input
                className="pets-input"
                placeholder="Через запятую: rabies, complex"
                value={vaccinationsText}
                onChange={(e) => setVaccinationsText(e.target.value)}
              />
            </div>

            <div className="pets-field">
              <label className="pets-label">Нужна лицензия</label>
              <select
                className="pets-select"
                value={licenseRequired === "" ? "" : licenseRequired ? "true" : "false"}
                onChange={(e) =>
                  setLicenseRequired(e.target.value === "" ? "" : e.target.value === "true")
                }
              >
                <option value="">Не указано</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            </div>

            <div className="pets-field">
              <label className="pets-label">Можно совместное содержание</label>
              <select
                className="pets-select"
                value={
                  cohabitationAllowed === ""
                    ? ""
                    : cohabitationAllowed
                    ? "true"
                    : "false"
                }
                onChange={(e) =>
                  setCohabitationAllowed(
                    e.target.value === "" ? "" : e.target.value === "true"
                  )
                }
              >
                <option value="">Не указано</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            </div>
          </div>

          <div className="pets-actions">
            <button
              type="button"
              className="pets-btn pets-btn--primary"
              onClick={handleCreate}
            >
              Добавить питомца
            </button>
          </div>
        </section>

        {message && <div className="pets-message">{message}</div>}

        {pets.length > 0 && (
          <section className="pets-list">
            {pets.map((pet) => (
              <article key={pet.id} className="pets-item">
                {editingId === pet.id ? (
                  <>
                    <h2 className="pets-section-title">Редактирование питомца</h2>

                    <div className="pets-form-grid">
                      <div className="pets-field">
                        <label className="pets-label">Имя</label>
                        <input
                          className="pets-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">Вид</label>
                        <select
                          className="pets-select"
                          value={editSpecies}
                          onChange={(e) => setEditSpecies(e.target.value)}
                        >
                          {SPECIES_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pets-field pets-field--wide">
                        <label className="pets-label">Особые условия</label>
                        <textarea
                          className="pets-textarea"
                          value={editConditions}
                          onChange={(e) => setEditConditions(e.target.value)}
                        />
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">Температура мин</label>
                        <input
                          className="pets-input"
                          type="number"
                          value={editTemperatureMin}
                          onChange={(e) =>
                            setEditTemperatureMin(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">Температура макс</label>
                        <input
                          className="pets-input"
                          type="number"
                          value={editTemperatureMax}
                          onChange={(e) =>
                            setEditTemperatureMax(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">Влажность мин</label>
                        <input
                          className="pets-input"
                          type="number"
                          value={editHumidityMin}
                          onChange={(e) =>
                            setEditHumidityMin(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">Влажность макс</label>
                        <input
                          className="pets-input"
                          type="number"
                          value={editHumidityMax}
                          onChange={(e) =>
                            setEditHumidityMax(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">Тип питания</label>
                        <input
                          className="pets-input"
                          value={editDietType}
                          onChange={(e) => setEditDietType(e.target.value)}
                        />
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">Кормлений в день</label>
                        <input
                          className="pets-input"
                          type="number"
                          value={editFeedingsPerDay}
                          onChange={(e) =>
                            setEditFeedingsPerDay(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="pets-field pets-field--wide">
                        <label className="pets-label">Детали питания</label>
                        <textarea
                          className="pets-textarea"
                          value={editDietDetails}
                          onChange={(e) => setEditDietDetails(e.target.value)}
                        />
                      </div>

                      <div className="pets-field pets-field--wide">
                        <label className="pets-label">Прививки</label>
                        <input
                          className="pets-input"
                          value={editVaccinationsText}
                          onChange={(e) => setEditVaccinationsText(e.target.value)}
                        />
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">Нужна лицензия</label>
                        <select
                          className="pets-select"
                          value={
                            editLicenseRequired === ""
                              ? ""
                              : editLicenseRequired
                              ? "true"
                              : "false"
                          }
                          onChange={(e) =>
                            setEditLicenseRequired(
                              e.target.value === "" ? "" : e.target.value === "true"
                            )
                          }
                        >
                          <option value="">Не указано</option>
                          <option value="true">Да</option>
                          <option value="false">Нет</option>
                        </select>
                      </div>

                      <div className="pets-field">
                        <label className="pets-label">
                          Можно совместное содержание
                        </label>
                        <select
                          className="pets-select"
                          value={
                            editCohabitationAllowed === ""
                              ? ""
                              : editCohabitationAllowed
                              ? "true"
                              : "false"
                          }
                          onChange={(e) =>
                            setEditCohabitationAllowed(
                              e.target.value === "" ? "" : e.target.value === "true"
                            )
                          }
                        >
                          <option value="">Не указано</option>
                          <option value="true">Да</option>
                          <option value="false">Нет</option>
                        </select>
                      </div>
                    </div>

                    <div className="pets-actions">
                      <button
                        type="button"
                        className="pets-btn pets-btn--primary"
                        onClick={saveEdit}
                      >
                        Сохранить
                      </button>

                      <button
                        type="button"
                        className="pets-btn pets-btn--ghost"
                        onClick={cancelEdit}
                      >
                        Отмена
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pets-item__top">
                      <div>
                        <h3 className="pets-item__title">{pet.name}</h3>
                        <p className="pets-item__subtitle">
                          {getSpeciesLabel((pet as any).species)}
                        </p>
                      </div>

                      <div className="pets-actions">
                        <button
                          type="button"
                          className="pets-btn pets-btn--secondary"
                          onClick={() => startEdit(pet)}
                        >
                          Редактировать
                        </button>

                        <button
                          type="button"
                          className="pets-btn pets-btn--danger"
                          onClick={() => handleDelete(pet.id)}
                        >
                          Удалить
                        </button>

                        <Link
                          to="/hotels"
                          className="pets-btn pets-btn--primary"
                          style={{ textDecoration: "none" }}
                        >
                          Подобрать отель
                        </Link>
                      </div>
                    </div>

                    <div className="pets-item__info">
                      <div className="pets-info-box">
                        <div className="pets-info-box__label">Условия</div>
                        <div className="pets-info-box__value">
                          {(pet as any).conditions || "Не указано"}
                        </div>
                      </div>

                      <div className="pets-info-box">
                        <div className="pets-info-box__label">Температура</div>
                        <div className="pets-info-box__value">
                          {(pet as any).temperature_min ?? "—"} /{" "}
                          {(pet as any).temperature_max ?? "—"}
                        </div>
                      </div>

                      <div className="pets-info-box">
                        <div className="pets-info-box__label">Влажность</div>
                        <div className="pets-info-box__value">
                          {(pet as any).humidity_min ?? "—"} /{" "}
                          {(pet as any).humidity_max ?? "—"}
                        </div>
                      </div>

                      <div className="pets-info-box">
                        <div className="pets-info-box__label">Тип питания</div>
                        <div className="pets-info-box__value">
                          {(pet as any).diet_type || "Не указано"}
                        </div>
                      </div>

                      <div className="pets-info-box">
                        <div className="pets-info-box__label">
                          Детали питания
                        </div>
                        <div className="pets-info-box__value">
                          {(pet as any).diet_details || "Не указано"}
                        </div>
                      </div>

                      <div className="pets-info-box">
                        <div className="pets-info-box__label">
                          Кормлений в день
                        </div>
                        <div className="pets-info-box__value">
                          {(pet as any).feedings_per_day ?? "Не указано"}
                        </div>
                      </div>

                      <div className="pets-info-box">
                        <div className="pets-info-box__label">Прививки</div>
                        <div className="pets-info-box__value">
                          {formatVaccinations((pet as any).vaccinations)}
                        </div>
                      </div>

                      <div className="pets-info-box">
                        <div className="pets-info-box__label">
                          Лицензия нужна
                        </div>
                        <div className="pets-info-box__value">
                          {boolText((pet as any).license_required)}
                        </div>
                      </div>

                      <div className="pets-info-box">
                        <div className="pets-info-box__label">
                          Совместное содержание
                        </div>
                        <div className="pets-info-box__value">
                          {boolText((pet as any).cohabitation_allowed)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}