'use client';

import { useState, useRef } from 'react';
import { Sparkles, ArrowRight, X, Download, Share2, Palette, Type, MessageSquare, Ticket } from 'lucide-react';
import { TEMPLATE_LIST, PromotionTemplates, TemplateId } from './templates';
import { toPng } from 'html-to-image';
import { usePanelStore } from '@/store/panelStore';

/* ─── Types ─────────────────────────────────────────────── */
type FestivalType = 'generic' | 'diwali' | 'holi' | 'eid' | 'christmas' | 'new_year' | 'durga_puja' | 'ganesh_puja' | 'shiva_ratri' | 'janmastami';

interface EditData {
    title: string;
    body: string;
    couponCode: string;
    primaryColor: string;
    secondaryColor: string;
    festivalType: FestivalType;
    festivalVariant: number;
    fontFamily: string;
}

const FESTIVAL_DEFAULTS: Record<FestivalType, { title: string; body: string; primary: string; secondary: string }> = {
    diwali:      { title: 'Happy Diwali',           body: 'Wishing you a festival full of sweet memories,\nsky full of fireworks, and heart full of joy.',              primary: '#f59e0b', secondary: '#ef4444' },
    holi:        { title: 'Happy Holi',             body: 'May the splash of colors bring joy to your family.\nHave a safe and healthy Holi!',                          primary: '#ec4899', secondary: '#8b5cf6' },
    eid:         { title: 'Eid Mubarak',            body: 'May this Eid bring peace, happiness, and prosperity\nto everyone. Best wishes from our team.',               primary: '#10b981', secondary: '#059669' },
    christmas:   { title: 'Merry Christmas',        body: 'Wishing you a season of blessings and a year of prosperity.\nStay healthy and happy!',                      primary: '#ef4444', secondary: '#16a34a' },
    new_year:    { title: 'Happy New Year',         body: 'Wishing you a year full of health, happiness, and prosperity!\nStay safe and blessed.',                     primary: '#38bdf8', secondary: '#818cf8' },
    durga_puja:  { title: 'Happy Durga Puja',       body: 'May Maa Durga bless you with strength, courage,\nand endless happiness. Jai Maa Durga!',                   primary: '#f43f5e', secondary: '#fb923c' },
    ganesh_puja: { title: 'Happy Ganesh Chaturthi', body: 'May Lord Ganesha remove all obstacles and fill your life\nwith wisdom and health. Ganpati Bappa Morya!',    primary: '#fbbf24', secondary: '#f97316' },
    shiva_ratri: { title: 'Happy Maha Shivaratri',  body: 'May the divine light of Lord Shiva guide you\ntowards peace and well-being. Om Namah Shivaya!',            primary: '#8b5cf6', secondary: '#3b82f6' },
    janmastami:  { title: 'Happy Janmashtami',      body: 'May Lord Krishna bring health, wealth, and joy\nto your heart and home. Jai Shri Krishna!',                 primary: '#0ea5e9', secondary: '#6366f1' },
    generic:     { title: 'Special Greetings',      body: 'Warm wishes from our pharmacy to you.\nYour health is our priority.',                                       primary: '#06b6d4', secondary: '#3b82f6' },
};

const FONTS = [
    { name: 'Modern Sans',     value: "'Montserrat', sans-serif" },
    { name: 'Elegant Serif',   value: "'Playfair Display', serif" },
    { name: 'Festive Cursive', value: "'Great Vibes', cursive" },
    { name: 'Geometric',       value: "'Poppins', sans-serif" },
    { name: 'Classical',       value: "'Cinzel', serif" },
    { name: 'Standard',        value: "'Inter', sans-serif" },
];

const FESTIVALS: FestivalType[] = ['diwali', 'holi', 'eid', 'christmas', 'new_year', 'durga_puja', 'ganesh_puja', 'shiva_ratri', 'janmastami', 'generic'];

export default function PromotionsHub() {
    const pharmacyName = usePanelStore((s) => s.pharmacyName);
    const storeName = pharmacyName || 'My Pharmacy';

    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
    const [editData, setEditData] = useState<EditData>({
        title: 'Exclusive Offer!',
        body: 'Special discounts on selected medicines this week. Visit us to avail!',
        couponCode: 'SAVE10',
        primaryColor: '#06b6d4',
        secondaryColor: '#3b82f6',
        festivalType: 'generic',
        festivalVariant: 1,
        fontFamily: "'Montserrat', sans-serif",
    });
    const [isExporting, setIsExporting] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const setField = <K extends keyof EditData>(k: K, v: EditData[K]) =>
        setEditData(prev => ({ ...prev, [k]: v }));

    const updateFestival = (type: FestivalType) => {
        const d = FESTIVAL_DEFAULTS[type];
        setEditData(prev => ({
            ...prev,
            festivalType: type,
            title: d.title,
            body: d.body,
            primaryColor: d.primary,
            secondaryColor: d.secondary,
            festivalVariant: 1,
        }));
    };

    const handleDownload = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(exportRef.current, { cacheBust: true, pixelRatio: 2 });
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `promotion-${Date.now()}.png`;
            a.click();
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleShareWhatsApp = async () => {
        await handleDownload();
        const text = encodeURIComponent(`${editData.title}\n\n${editData.body}\n\nFrom: ${storeName}\nPowered by ShelfCure`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    /* ── Shared input style ── */
    const inp: React.CSSProperties = {
        width: '100%', boxSizing: 'border-box',
        backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '12px 16px', color: '#fff',
        outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
        fontSize: 14, fontWeight: 500,
    };

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 2rem)', overflowY: 'auto', paddingRight: 4 }}>
            {/* ── Header ── */}
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Sparkles style={{ width: 32, height: 32, color: '#06b6d4', filter: 'drop-shadow(0 0 8px #06b6d4)' }} />
                    Greetings & Promotions
                </h2>
                <p style={{ margin: '8px 0 0', color: '#71717a', fontWeight: 500 }}>Create and send professional designs to your customers.</p>
            </div>

            {/* ── Template Gallery ── */}
            {!selectedTemplate ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
                    {TEMPLATE_LIST.map((template) => {
                        const Template = PromotionTemplates[template.id];
                        return (
                            <div
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                style={{ cursor: 'pointer', backgroundColor: '#0f0f11', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden', transition: 'all 0.25s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.5)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                {/* Thumbnail */}
                                <div style={{ aspectRatio: '4/5', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ transform: 'scale(0.3)', transformOrigin: 'center', opacity: 0.6, transition: 'all 0.5s ease', pointerEvents: 'none' }}>
                                        <Template {...editData} storeName={storeName} mode="preview" />
                                    </div>
                                    {/* Hover overlay */}
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', opacity: 0, transition: 'opacity 0.3s ease', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 24 }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
                                    >
                                        <span style={{ padding: '8px 16px', backgroundColor: '#06b6d4', borderRadius: 9999, fontSize: 12, fontWeight: 900, color: '#000', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            Customize <ArrowRight style={{ width: 12, height: 12 }} />
                                        </span>
                                    </div>
                                </div>
                                <div style={{ padding: 16 }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontWeight: 700, letterSpacing: '-0.01em' }}>{template.name}</h3>
                                    <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: 12, lineHeight: 1.5 }}>{template.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── Editor View ── */
                <div style={{ display: 'grid', gridTemplateColumns: '5fr 1fr 6fr', gap: 32, alignItems: 'start', marginBottom: 48 }}>
                    {/* Controls */}
                    <div>
                        <div style={{ backgroundColor: '#0f0f11', border: '1px solid rgba(255,255,255,0.1)', padding: 24, borderRadius: 24, boxShadow: '0 16px 64px rgba(0,0,0,0.5)' }}>
                            {/* Controls header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16, marginBottom: 24 }}>
                                <h3 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>Customization</h3>
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    style={{ padding: 8, backgroundColor: 'transparent', border: 'none', borderRadius: 9999, color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#71717a'; }}
                                >
                                    <X style={{ width: 20, height: 20 }} />
                                </button>
                            </div>

                            {/* Inputs */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Title */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Type style={{ width: 12, height: 12 }} /> Header Text
                                    </label>
                                    <input
                                        type="text" value={editData.title}
                                        onChange={e => setField('title', e.target.value)}
                                        style={inp}
                                        onFocus={e => e.currentTarget.style.borderColor = '#06b6d450'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>

                                {/* Body */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <MessageSquare style={{ width: 12, height: 12 }} /> Message Body
                                    </label>
                                    <textarea
                                        rows={3} value={editData.body}
                                        onChange={e => setField('body', e.target.value)}
                                        style={{ ...inp, resize: 'none', lineHeight: 1.6, fontSize: 13 }}
                                        onFocus={e => e.currentTarget.style.borderColor = '#06b6d450'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>

                                {/* Festival picker (only for festival template) */}
                                {selectedTemplate === 'festival' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}>Pick Festival</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                                            {FESTIVALS.map(f => (
                                                <button key={f} onClick={() => updateFestival(f)}
                                                    style={{
                                                        padding: '10px 12px', borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease', fontFamily: 'inherit',
                                                        backgroundColor: editData.festivalType === f ? '#06b6d4' : '#18181b',
                                                        borderColor: editData.festivalType === f ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                                                        color: editData.festivalType === f ? '#000' : '#a1a1aa',
                                                        boxShadow: editData.festivalType === f ? '0 4px 12px rgba(6,182,212,0.3)' : 'none',
                                                    }}
                                                >
                                                    {f.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Design variant (for festival, coupon, vibrant) */}
                                {(selectedTemplate === 'festival' || selectedTemplate === 'coupon' || selectedTemplate === 'vibrant') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}>Design Variant</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {[1, 2].map(v => (
                                                <button key={v} onClick={() => setField('festivalVariant', v)}
                                                    style={{
                                                        flex: 1, padding: '8px', borderRadius: 8, fontSize: 10, fontWeight: 900, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
                                                        backgroundColor: editData.festivalVariant === v ? 'rgba(255,255,255,0.1)' : '#18181b',
                                                        borderColor: editData.festivalVariant === v ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                                        color: editData.festivalVariant === v ? '#fff' : '#71717a',
                                                    }}
                                                >
                                                    Design {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Coupon code */}
                                {selectedTemplate === 'coupon' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Ticket style={{ width: 12, height: 12 }} /> Coupon Code
                                        </label>
                                        <input type="text" value={editData.couponCode}
                                            onChange={e => setField('couponCode', e.target.value)}
                                            style={{ ...inp, fontWeight: 700, letterSpacing: '0.1em' }}
                                            onFocus={e => e.currentTarget.style.borderColor = '#06b6d450'}
                                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                )}

                                {/* Colors */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 8 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Palette style={{ width: 12, height: 12 }} /> Primary
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <input type="color" value={editData.primaryColor}
                                                onChange={e => setField('primaryColor', e.target.value)}
                                                style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                            />
                                            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#a1a1aa' }}>{editData.primaryColor}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}>Secondary</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <input type="color" value={editData.secondaryColor}
                                                onChange={e => setField('secondaryColor', e.target.value)}
                                                style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                            />
                                            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#a1a1aa' }}>{editData.secondaryColor}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Font family */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}>Font Family</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
                                        {FONTS.map(font => (
                                            <button key={font.value} onClick={() => setField('fontFamily', font.value)}
                                                style={{
                                                    padding: '10px 12px', borderRadius: 12, fontSize: 10, fontWeight: 700, border: '1px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease', fontFamily: font.value,
                                                    backgroundColor: editData.fontFamily === font.value ? 'rgba(255,255,255,0.1)' : '#18181b',
                                                    borderColor: editData.fontFamily === font.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                                    color: editData.fontFamily === font.value ? '#fff' : '#71717a',
                                                }}
                                            >
                                                {font.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div style={{ marginTop: 24, paddingTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <button onClick={handleDownload} disabled={isExporting}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: isExporting ? 'not-allowed' : 'pointer', opacity: isExporting ? 0.5 : 1, transition: 'all 0.2s', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { if (!isExporting) e.currentTarget.style.backgroundColor = '#27272a'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#18181b'; }}
                                >
                                    <Download style={{ width: 16, height: 16 }} />
                                    {isExporting ? 'Exporting…' : 'Download'}
                                </button>
                                <button onClick={handleShareWhatsApp}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: '16px', fontSize: 14, fontWeight: 700, color: '#4ade80', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(34,197,94,0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(34,197,94,0.1)'; }}
                                >
                                    <Share2 style={{ width: 16, height: 16 }} />
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div />

                    {/* Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'sticky', top: 24 }}>
                            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#52525b', marginBottom: 24, display: 'block', textAlign: 'center' }}>Live Preview</span>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', inset: -16, background: 'linear-gradient(to bottom right, rgba(6,182,212,0.2), transparent, rgba(6,182,212,0.2))', borderRadius: 40, filter: 'blur(32px)', opacity: 0.5 }} />
                                <div
                                    ref={exportRef}
                                    style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', boxShadow: '0 0 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#000' }}
                                >
                                    {(() => {
                                        const PreviewTemplate = PromotionTemplates[selectedTemplate!];
                                        return <PreviewTemplate {...editData} storeName={storeName} mode="export" />;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
