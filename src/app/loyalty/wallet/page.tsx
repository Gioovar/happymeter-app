"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import {
  getGlobalWallet,
  clearGlobalLoyaltySession,
  getGlobalReservations
} from "@/actions/loyalty-global";
import { Loader2, Plus, QrCode, Store, CreditCard, Calendar, Clock, ChevronDown, ChevronUp, X, User } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { UserButton } from "@clerk/nextjs";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PREMIUM_GRADIENTS = [
  "linear-gradient(135deg, #FF6B6B 0%, #C4124B 100%)", // Ruby Red
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Ocean Blue
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Emerald
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", // Sunset Pink/Yellow
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", // Deep Space Purple/Cyan
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", // Warm Peach
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Royal Plum
  "linear-gradient(135deg, #13547a 0%, #80d0c7 100%)", // Lagoon
];

function getGradientForString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PREMIUM_GRADIENTS.length;
  return PREMIUM_GRADIENTS[index];
}

export default function LoyaltyWalletPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Widget states
  const [isReservationsExpanded, setIsReservationsExpanded] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);

  const router = useRouter();

  // Initialize push notifications if we have a phone/session
  usePushNotifications("LOYALTY", phone || null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setIsLoading(true);
    const res = await getGlobalWallet();
    if (!res.success) {
      toast.error(res.error);
      router.push("/loyalty/login");
    } else {
      setCards(res.cards || []);
      setPhone(res.phone || "");

      if (res.phone) {
        const resvResult = await getGlobalReservations(res.phone);
        if (resvResult.success && resvResult.reservations) {
          setReservations(resvResult.reservations);
        }
      }
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await clearGlobalLoyaltySession();
    router.push("/loyalty/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#050505] text-white font-sans pb-24 overscroll-y-contain">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            HappyMeters
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/loyalty/login" appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 border border-white/10 shadow-lg" } }} />
        </div>
      </header>

      <main className="p-6 max-w-md mx-auto">

        {/* Global Reservations Section */}
        {reservations.length > 0 && (
          <div className="mb-10 animate-in fade-in duration-500 delay-100">
            <button
              onClick={() => setIsReservationsExpanded(!isReservationsExpanded)}
              className="w-full flex items-center justify-between py-3 mb-2 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Próximas Reservaciones
                <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full ml-1">{reservations.length}</span>
              </h2>
              {isReservationsExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>

            <AnimatePresence>
              {isReservationsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {reservations.map((resv) => (
                    <div
                      key={resv.id}
                      onClick={() => setSelectedReservation(resv)}
                      className="bg-[#101014] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-lg ring-1 ring-white/10 relative overflow-hidden cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                      <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex flex-col items-center justify-center border border-indigo-500/20 shrink-0">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase leading-none mb-1">
                          {format(new Date(resv.date), 'MMM', { locale: es })}
                        </span>
                        <span className="text-xl font-black text-white leading-none">
                          {format(new Date(resv.date), 'd')}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="font-bold text-white text-base truncate pr-6">
                          {resv.table?.floorPlan?.user?.businessName || "Restaurante"}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {format(new Date(resv.date), 'h:mm a')}
                          </div>
                          <div className="text-xs font-medium text-gray-400">
                            • {resv.partySize} pax
                          </div>
                        </div>
                      </div>

                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <QrCode className="w-5 h-5 text-white/30" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Reservation Detail/QR Modal */}
        {selectedReservation && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedReservation(null)}>
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm relative text-center shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedReservation(null)} className="absolute top-4 right-4 text-black/50 hover:text-black">
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-bold text-black mb-1">Tu Reservación</h3>
              <p className="text-zinc-500 text-sm mb-6">Muestra este código al llegar</p>

              <div className="bg-white p-2 rounded-xl border-2 border-black/10 mx-auto w-fit mb-6">
                <QRCodeSVG
                  value={`https://happymeters.com/admin/reservations/checkin/${selectedReservation.id}`}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-zinc-400 text-sm">Fecha</span>
                  <span className="font-bold text-black">{format(new Date(selectedReservation.date), 'PPP', { locale: es })}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-zinc-400 text-sm">Hora</span>
                  <span className="font-bold text-black">{format(new Date(selectedReservation.date), 'h:mm a')}</span>
                </div>
                {selectedReservation.table && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-zinc-400 text-sm">Mesa</span>
                    <span className="font-bold text-black">{selectedReservation.table.label}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-zinc-400 text-sm">Personas</span>
                  <span className="font-bold text-black">{selectedReservation.partySize} pax</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold">Mis Tarjetas</h2>
            <p className="text-sm text-gray-400 mt-1">
              Tu billetera de lealtad
            </p>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white/5 border border-white/10 rounded-3xl mt-8">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Billetera Vacía</h3>
            <p className="text-sm text-gray-400 mb-6">
              Aún no te has unido a ningún programa de lealtad.
            </p>

            <button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
              <Plus className="w-5 h-5" /> Escanear Código QR
            </button>
          </div>
        ) : (
          <div className="space-y-4 relative">
            {cards.map((card, index) => {
              const isBlocked =
                card.program.user?.subscriptionStatus === "EXPIRED" ||
                card.program.user?.subscriptionStatus === "SUSPENDED";
              const isDefaultColor =
                !card.program.themeColor ||
                card.program.themeColor.toLowerCase() === "#8b5cf6";
              const cardBackground = isDefaultColor
                ? getGradientForString(card.program.businessName)
                : card.program.themeColor;

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/loyalty/${card.programId}`)}
                  className="relative overflow-hidden rounded-3xl cursor-pointer group shadow-xl active:scale-95 transition-transform"
                  style={{
                    background: cardBackground,
                  }}
                >
                  {/* Glass reflection bubble */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0 pointer-events-none" />

                  {/* Card Design */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors z-10 pointer-events-none" />

                  {/* App Store style gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

                  <div className="relative z-20 p-6 flex flex-col h-48 justify-between">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-white rounded-2xl p-0.5 shadow-lg overflow-hidden shrink-0">
                        {card.program.logoUrl || card.program.user?.logoUrl ? (
                          <img
                            src={
                              card.program.logoUrl || card.program.user?.logoUrl
                            }
                            alt="Logo"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                            <Store className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20 shadow-sm flex items-center gap-1.5 inline-flex">
                          <CreditCard className="w-3 h-3 opacity-70" />
                          {card.tier ? card.tier.name : "Nivel Básico"}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isBlocked && (
                        <span className="inline-block px-2 py-0.5 bg-red-500/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg mb-2 uppercase tracking-wide">
                          Inactivo Temporalmente
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-white drop-shadow-md truncate">
                        {card.program.businessName}
                      </h3>
                      <div className="flex gap-4 mt-1">
                        <p className="text-sm font-medium text-white/90 drop-shadow-sm">
                          {card.currentVisits}{" "}
                          <span className="text-xs opacity-70">Visitas</span>
                        </p>
                        <p className="text-sm font-medium text-white/90 drop-shadow-sm">
                          {card.currentPoints}{" "}
                          <span className="text-xs opacity-70">Puntos</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Fab for Add Card - Fixed at bottom */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
        <button className="pointer-events-auto bg-white hover:bg-gray-100 text-black shadow-2xl shadow-white/10 px-6 py-4 rounded-full font-bold flex items-center gap-2 active:scale-95 transition-all w-fit mx-auto border border-black/10">
          <Plus className="w-5 h-5" /> Agregar Nueva Tarjeta
        </button>
      </div>
    </div>
  );
}
