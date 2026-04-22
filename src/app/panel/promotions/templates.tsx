'use client';

export interface PromotionProps {
    title: string
    body: string
    couponCode?: string
    storeName: string
    primaryColor: string
    secondaryColor: string
    mode?: 'preview' | 'export'
    festivalType?: 'generic' | 'diwali' | 'holi' | 'eid' | 'christmas' | 'new_year' | 'durga_puja' | 'ganesh_puja' | 'shiva_ratri' | 'janmastami'
    festivalVariant?: number
    fontFamily?: string
}

export const PromotionTemplates = {
    minimal: ({ title, body, storeName, primaryColor, secondaryColor, fontFamily }: PromotionProps) => (
        <div
            style={{
                width: 400, height: 600, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: 32, position: 'relative', overflow: 'hidden', color: '#fff',
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                fontFamily: fontFamily || 'inherit'
            }}
        >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 128, height: 128, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', marginRight: -64, marginTop: -64, filter: 'blur(48px)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 128, height: 128, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '50%', marginLeft: -64, marginBottom: -64, filter: 'blur(32px)' }} />

            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', opacity: 0.6 }}>{storeName}</span>
                </div>
                <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 24, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 24px' }}>{title}</h2>
                <p style={{ fontSize: 18, opacity: 0.9, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>{body}</p>
            </div>

            <div style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="ShelfCure" style={{ height: 16, width: 'auto', opacity: 0.4, filter: 'brightness(0) invert(1)' }} />
            </div>
        </div>
    ),

    vibrant: ({ title, body, storeName, primaryColor, secondaryColor, fontFamily, festivalVariant = 1 }: PromotionProps) => {
        if (festivalVariant === 2) {
            return (
                <div style={{ width: 400, height: 600, display: 'flex', flexDirection: 'column', padding: 0, position: 'relative', overflow: 'hidden', backgroundColor: '#050505', color: '#fff', fontFamily: fontFamily || 'inherit' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: `linear-gradient(45deg, ${primaryColor} 25%, transparent 25%, transparent 50%, ${primaryColor} 50%, ${primaryColor} 75%, transparent 75%, transparent)`, backgroundSize: '100px 100px' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, transparent, rgba(0,0,0,0.4), rgba(0,0,0,0.8))' }} />

                    <div style={{ position: 'relative', zIndex: 10, padding: 48, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ marginBottom: 48 }}>
                            <div style={{ width: 64, height: 4, marginBottom: 16, backgroundColor: secondaryColor }} />
                            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', color: '#71717a' }}>{storeName}</span>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h2 style={{ fontSize: 60, fontWeight: 900, lineHeight: 0.85, letterSpacing: '-0.03em', marginBottom: 32, textTransform: 'uppercase', wordBreak: 'break-word', margin: '0 0 32px', textShadow: `4px 4px 0px ${primaryColor}` }}>
                                {title}
                            </h2>
                            <p style={{ fontSize: 20, fontWeight: 700, borderLeft: `4px solid ${secondaryColor}`, paddingLeft: 24, paddingTop: 8, paddingBottom: 8, lineHeight: 1.6, margin: 0 }}>
                                {body}
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {[1, 2, 3].map(i => <div key={i} style={{ width: 24, height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }} />)}
                                </div>
                                <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#52525b' }}>Premium Series</span>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo.png" alt="ShelfCure" style={{ height: 16, width: 'auto', opacity: 0.3, filter: 'brightness(0) invert(1)' }} />
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div style={{ width: 400, height: 600, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, position: 'relative', overflow: 'hidden', backgroundColor: '#000', fontFamily: fontFamily || 'inherit' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `radial-gradient(circle at 50% 50%, ${primaryColor}40, transparent 70%)` }} />

                <div style={{ position: 'relative', zIndex: 10, padding: 40, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)', margin: 16, borderRadius: 24, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 96, height: 96, filter: 'blur(60px)', backgroundColor: secondaryColor }} />

                    <div style={{ marginTop: 16 }}>
                        <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 16, letterSpacing: '-0.03em', margin: '0 0 16px', textShadow: `0 0 20px ${primaryColor}80` }}>
                            {title}
                        </h2>
                        <div style={{ width: 48, height: 4, backgroundColor: '#fff', marginBottom: 24 }} />
                        <p style={{ color: '#d4d4d8', fontSize: 18, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>{body}</p>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1, marginBottom: 4 }}>Store</span>
                            <span style={{ color: '#fff', fontWeight: 700, letterSpacing: '-0.01em' }}>{storeName}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: primaryColor }} />
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo.png" alt="ShelfCure" style={{ height: 16, width: 'auto', opacity: 0.3, filter: 'brightness(0) invert(1)' }} />
                        </div>
                    </div>
                </div>
            </div>
        )
    },

    festival: ({ title, body, storeName, primaryColor, secondaryColor, festivalType = 'generic', festivalVariant = 1, fontFamily }: PromotionProps) => {
        const hasImage = ['diwali', 'holi', 'eid', 'christmas', 'new_year', 'durga_puja', 'ganesh_puja', 'shiva_ratri', 'janmastami'].includes(festivalType);

        const renderDecorations = () => (
            <>
                {hasImage && (
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.4, mixBlendMode: 'screen', pointerEvents: 'none' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/assets/festivals/${festivalType}_${festivalVariant}.png`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={festivalType} />
                    </div>
                )}
                {festivalType === 'generic' && (
                    <>
                        <div style={{ position: 'absolute', top: 16, left: 16, width: 48, height: 48, opacity: 0.4, borderTop: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}` }} />
                        <div style={{ position: 'absolute', top: 16, right: 16, width: 48, height: 48, opacity: 0.4, borderTop: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}` }} />
                        <div style={{ position: 'absolute', bottom: 16, left: 16, width: 48, height: 48, opacity: 0.4, borderBottom: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}` }} />
                        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, opacity: 0.4, borderBottom: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}` }} />
                    </>
                )}
            </>
        )

        return (
            <div style={{
                width: 400, height: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 32, position: 'relative', overflow: 'hidden',
                background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)',
                border: `2px solid ${primaryColor}40`,
                fontFamily: fontFamily || 'inherit'
            }}>
                {renderDecorations()}

                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', marginBottom: 16, color: primaryColor, margin: '0 0 16px' }}>{storeName}</h3>
                    <h2 style={{ fontSize: 48, fontWeight: 900, color: '#fff', marginBottom: 32, letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'pre-line', margin: '0 0 32px' }}>{title}</h2>
                    <div style={{ maxWidth: 280, margin: '0 auto' }}>
                        <p style={{ color: '#a1a1aa', fontSize: 18, fontStyle: 'italic', margin: 0 }}>{body}</p>
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                    <div style={{ opacity: 0.2 }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                        </svg>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="ShelfCure" style={{ height: 16, width: 'auto', opacity: 0.3, filter: 'brightness(0) invert(1)' }} />
                </div>
            </div>
        )
    },

    coupon: ({ title, body, couponCode, storeName, primaryColor, fontFamily, festivalVariant = 1 }: PromotionProps) => {
        if (festivalVariant === 2) {
            return (
                <div style={{ width: 400, height: 600, padding: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', color: '#fff', backgroundColor: primaryColor, fontFamily: fontFamily || 'inherit' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, rgba(0,0,0,0.2), transparent, rgba(0,0,0,0.6))', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(48px)' }} />
                    <div style={{ position: 'absolute', bottom: -80, left: -80, width: 192, height: 192, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '50%', filter: 'blur(48px)' }} />

                    <div style={{ position: 'relative', zIndex: 10, margin: 24, flex: 1, display: 'flex', flexDirection: 'column', border: '3px solid rgba(255,255,255,0.2)', borderRadius: 32, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)' }}>
                        <div style={{ position: 'absolute', top: '65%', left: -20, transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: '#0a0a0a', borderRadius: '50%', zIndex: 20, border: '1px solid rgba(255,255,255,0.1)' }} />
                        <div style={{ position: 'absolute', top: '65%', right: -20, transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: '#0a0a0a', borderRadius: '50%', zIndex: 20, border: '1px solid rgba(255,255,255,0.1)' }} />

                        <div style={{ padding: 32, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <div style={{ marginBottom: 24 }}>
                                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>Presented by</span>
                                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>{storeName}</span>
                            </div>

                            <h2 style={{ fontSize: 48, fontWeight: 900, lineHeight: 0.9, marginBottom: 16, letterSpacing: '-0.03em', textTransform: 'uppercase', fontStyle: 'italic', textShadow: '0 4px 15px rgba(0,0,0,0.4)', margin: '0 0 16px' }}>
                                {title}
                            </h2>
                            <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.8, maxWidth: 240, lineHeight: 1.6, marginBottom: 32, margin: '0 0 32px' }}>{body}</p>

                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 32, opacity: 0.3 }}>
                                <div style={{ height: 0, flex: 1, borderTop: '2px dashed rgba(255,255,255,0.5)' }} />
                            </div>

                            <div style={{ width: '100%', paddingLeft: 16, paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ backgroundColor: '#fff', color: '#000', padding: '16px 8px', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', transform: 'rotate(-1deg)' }}>
                                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', opacity: 0.4, marginBottom: 4, lineHeight: 1 }}>Coupon Code</span>
                                    <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.1em' }}>{couponCode ?? 'WELCOME10'}</span>
                                </div>
                                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', opacity: 0.4, margin: 0 }}>Valid for Limited Time Only</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ position: 'relative', zIndex: 10, paddingBottom: 40, display: 'flex', justifyContent: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="ShelfCure" style={{ height: 14, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.4 }} />
                    </div>
                </div>
            )
        }

        return (
            <div style={{ width: 400, height: 600, backgroundColor: '#09090b', padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', fontFamily: fontFamily || 'inherit' }}>
                <div style={{ position: 'absolute', top: -80, left: -80, width: 256, height: 256, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.2, backgroundColor: primaryColor }} />

                <div style={{ position: 'relative', zIndex: 10, border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 16, flex: 1, display: 'flex', flexDirection: 'column', padding: 32, backgroundColor: 'rgba(24,24,27,0.4)', backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                        <div>
                            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', display: 'block', marginBottom: 4 }}>Offer From</span>
                            <span style={{ color: '#fff', fontWeight: 700 }}>{storeName}</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: 'auto' }}>
                        <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16, margin: '0 0 16px' }}>{title}</h2>
                        <p style={{ color: '#a1a1aa', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{body}</p>
                    </div>

                    <div style={{ marginTop: 32 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', display: 'block', marginBottom: 12, textAlign: 'center' }}>Your Coupon Code</span>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                            <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.2em', color: '#fff', textShadow: `0 0 10px ${primaryColor}40` }}>
                                {couponCode ?? 'WELCOME10'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="ShelfCure" style={{ height: 16, width: 'auto', opacity: 0.3, filter: 'brightness(0) invert(1)' }} />
                </div>
            </div>
        )
    }
}

export type TemplateId = keyof typeof PromotionTemplates

export const TEMPLATE_LIST = [
    { id: 'minimal' as const, name: 'Glassmorphic Minimal', description: 'Modern, clean design with smooth gradients.' },
    { id: 'vibrant' as const, name: 'Vibrant Neo-Dark', description: 'High contrast, bold typography and glowing accents.' },
    { id: 'festival' as const, name: 'Festival Elegance', description: 'Traditional vibes with contemporary aesthetics.' },
    { id: 'coupon' as const, name: 'Digital Coupon', description: 'Perfect for discounts and promotional codes.' },
]
