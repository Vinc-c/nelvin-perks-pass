import NvIcon from "@/components/brand/NvIcon";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import SectionCard from "@/components/dashboard/SectionCard";
import { EmptyState, ListSkeleton } from "@/components/UiFeedback";
import { Award, Send, Loader2, Trophy, Heart } from "lucide-react";

export const RECOGNITION_BADGES = {
  TEAM_PLAYER: { label: "Esprit d'équipe", glyph: "FAMILY_PARENTING" },
  INNOVATOR: { label: "Innovation", glyph: "SPARK" },
  CUSTOMER_HERO: { label: "Héros client", glyph: "VERIFIED" },
  LEADERSHIP: { label: "Leadership", glyph: "PASS_VIP" },
  GOING_EXTRA_MILE: { label: "Au-delà des attentes", glyph: "STAR_MARK" },
  MENTOR: { label: "Mentor", glyph: "EDUCATION_LEARNING" },
};

const initials = (name) => (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export default function RecognitionWall() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [badge, setBadge] = useState("TEAM_PLAYER");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    if (!user?.company_id) return { people: [], items: [] };
    const [people, items] = await Promise.all([
      callRpc("company_directory"),
      entities.Recognition.filter({ company_id: user.company_id }, "-created_date", 100),
    ]);
    return { people: people || [], items };
  }, [user?.company_id], { initial: { people: [], items: [] } });

  const nameOf = useMemo(() => {
    const m = new Map((data?.people || []).map((p) => [p.id, p.full_name]));
    return (id) => m.get(id) || "Ancien collègue";
  }, [data]);

  const colleagues = (data?.people || []).filter((p) => p.id !== user?.id);

  const leaderboard = useMemo(() => {
    const since = Date.now() - 30 * 86400000;
    const counts = new Map();
    (data?.items || []).filter((r) => new Date(r.created_date).getTime() >= since)
      .forEach((r) => counts.set(r.to_user_id, (counts.get(r.to_user_id) || 0) + Number(r.points || 0)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data]);

  const send = async (e) => {
    e.preventDefault();
    if (!to || message.trim().length < 3) return;
    setSending(true);
    try {
      await entities.Recognition.create({ company_id: user.company_id, to_user_id: to, badge, message: message.trim() });
      toast({ title: "Reconnaissance envoyée", description: `${nameOf(to)} a été notifié(e).` });
      setMessage("");
      setTo("");
      reload();
    } catch (err) {
      toast({ title: "Envoi impossible", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (!user?.company_id) {
    return (
      <PortalLayout title="Mur de reconnaissance" theme="light">
        <EmptyState icon={Award} title="Réservé aux entreprises" description="Le mur de reconnaissance est disponible pour les salariés d'une entreprise cliente Nelvin." />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Mur de reconnaissance" theme="light">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <SectionCard icon={Send} title="Reconnaître un collègue">
            <form onSubmit={send} className="space-y-3">
              <label className="block text-sm text-slate-600">
                Collègue
                <select value={to} onChange={(e) => setTo(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
                  <option value="">Choisir…</option>
                  {colleagues.map((p) => <option key={p.id} value={p.id}>{p.full_name}{p.department ? ` · ${p.department}` : ""}</option>)}
                </select>
              </label>
              <div>
                <p className="text-sm text-slate-600">Valeur</p>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {Object.entries(RECOGNITION_BADGES).map(([id, b]) => (
                    <button type="button" key={id} onClick={() => setBadge(id)} className={`not-pill flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium ${badge === id ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600"}`}>
                      <NvIcon name={b.glyph} className="h-4 w-4" />{b.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm text-slate-600">
                Message
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} required placeholder="Merci pour…" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
              </label>
              <button type="submit" disabled={sending || !to || message.trim().length < 3} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />} Envoyer
              </button>
              {colleagues.length === 0 && !loading && <p className="text-xs text-slate-400">Aucun collègue pour l'instant — invitez votre équipe depuis l'espace RH.</p>}
            </form>
          </SectionCard>

          <SectionCard icon={Trophy} title="Top 30 jours">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-400">Pas encore de reconnaissance ce mois-ci.</p>
            ) : (
              <ol className="space-y-2">
                {leaderboard.map(([id, pts], i) => (
                  <li key={id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><span className="w-5 text-center font-bold text-amber-500">{i + 1}</span>{nameOf(id)}</span>
                    <span className="font-semibold text-slate-700">{pts} pts</span>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard icon={Award} title="Fil de reconnaissance">
            {loading ? (
              <ListSkeleton rows={4} />
            ) : data.items.length === 0 ? (
              <EmptyState icon={Award} title="Soyez le premier" description="Remerciez un collègue pour son travail : il recevra une notification et des points." />
            ) : (
              <div className="space-y-3">
                {data.items.map((r, i) => {
                  const b = RECOGNITION_BADGES[r.badge] || RECOGNITION_BADGES.TEAM_PLAYER;
                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{initials(nameOf(r.to_user_id))}</div>
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">{nameOf(r.from_user_id)}</span> a reconnu{" "}
                          <span className="font-semibold text-slate-900">{nameOf(r.to_user_id)}</span>
                        </p>
                        <span className="ml-auto inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200"><NvIcon name={b.glyph} className="h-3.5 w-3.5" /> {b.label}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">« {r.message} »</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(r.created_date).toLocaleDateString("fr-FR", { dateStyle: "medium" })} · +{r.points} pts</p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PortalLayout>
  );
}
