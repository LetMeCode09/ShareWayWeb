import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { createReservation, getReservation, updateReservation } from "../../api/reservationsApi";
import { t } from "../../i18n/en";

const empty = {
    numberOfSeats: 1,
    reservationDate: "", // "2026-02-07T10:30"
    confirmed: false,
    comment: "",
    totalPrice: 0,
    user: null,
    trip: null,
    userId: "",
    tripId: "",
};

export default function ReservationForm({ mode }) {
    const { id } = useParams();
    const nav = useNavigate();

    const [form, setForm] = useState(empty);
    const [status, setStatus] = useState(mode === "edit" ? "loading" : "idle");
    const [error, setError] = useState(null);

    function setField(k, v) {
        setForm((p) => ({ ...p, [k]: v }));
    }

    useEffect(() => {
        if (mode !== "edit") return;

        (async () => {
        try {
            setStatus("loading");
            setError(null);
            const data = await getReservation(id);

            // si vienen user/trip como objeto:
            const userId = data.user?.id ?? "";
            const tripId = data.trip?.id ?? "";

            setForm({
            numberOfSeats: data.numberOfSeats ?? 1,
            reservationDate: data.reservationDate ?? "",
            confirmed: Boolean(data.confirmed),
            comment: data.comment ?? "",
            totalPrice: data.totalPrice ?? 0,
            userId,
            tripId,
            });

            setStatus("idle");
        } catch (e) {
            setError(e);
            setStatus("error");
        }
        })();
    }, [mode, id]);

    async function onSubmit(e) {
        e.preventDefault();
        try {
        setError(null);

        // Payload más compatible sin DTOs:
        // manda user/trip como {id} (JPA suele mapearlo bien)
        const payload = {
            numberOfSeats: Number(form.numberOfSeats),
            reservationDate: form.reservationDate,
            confirmed: Boolean(form.confirmed),
            comment: form.comment,
            totalPrice: Number(form.totalPrice),
            user: { id: Number(form.userId) },
            trip: { id: Number(form.tripId) },
        };

        if (mode === "create") {
            const created = await createReservation(payload);
            nav(`/reservations/${created.id}`);
        } else {
            const updated = await updateReservation(id, payload);
            nav(`/reservations/${updated.id}`);
        }
        } catch (e2) {
        setError(e2);
        }
    }

    if (status === "loading") return <Loading text="Loading form..." />;
    if (status === "error") return <ErrorBox error={error} />;

    return (
        <div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>
            {mode === "create" ? t.newReservation : `${t.edit} Reservation #${id}`}
            </h2>
            <Link to="/reservations">{t.back}</Link>
        </div>

        {error && <div style={{ marginTop: 12 }}><ErrorBox error={error} /></div>}

        <form onSubmit={onSubmit} className="grid" style={{ marginTop: 12 }}>
            <input type="number" value={form.numberOfSeats} onChange={(e) => setField("numberOfSeats", e.target.value)} placeholder="numberOfSeats" />
            <input value={form.reservationDate} onChange={(e) => setField("reservationDate", e.target.value)} placeholder="reservationDate (YYYY-MM-DDTHH:mm)" />
            <input value={form.comment} onChange={(e) => setField("comment", e.target.value)} placeholder="comment" />
            <input type="number" value={form.totalPrice} onChange={(e) => setField("totalPrice", e.target.value)} placeholder="totalPrice" />

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={form.confirmed} onChange={(e) => setField("confirmed", e.target.checked)} />
            confirmed
            </label>

            <input value={form.userId} onChange={(e) => setField("userId", e.target.value)} placeholder="userId" />
            <input value={form.tripId} onChange={(e) => setField("tripId", e.target.value)} placeholder="tripId" />

            <button type="submit">
            {mode === "create" ? t.create : t.save}
            </button>
        </form>
        </div>
    );
}