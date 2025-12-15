import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const title = searchParams.get('title')?.slice(0, 100) || 'あんしんレシピ';
        const image = searchParams.get('image');

        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        height: '100%',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        position: 'relative',
                    }}
                >
                    {/* Background Image */}
                    {image && (
                        <img
                            src={image}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                opacity: 0.6
                            }}
                        />
                    )}

                    {/* Gradient Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.9))',
                        zIndex: 1
                    }} />

                    {/* Content */}
                    <div style={{
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        padding: '40px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            fontSize: 30,
                            fontWeight: 'bold',
                            color: '#FF6B6B',
                            marginBottom: 20,
                            padding: '10px 20px',
                            borderRadius: '50px',
                            border: '2px solid #FF6B6B',
                            background: 'white'
                        }}>
                            あんしんレシピ
                        </div>
                        <div style={{
                            fontSize: 70,
                            fontWeight: 900,
                            color: '#333',
                            lineHeight: 1.2,
                            textShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            maxWidth: '900px',
                            wordWrap: 'break-word',
                        }}>
                            {title}
                        </div>
                        <div style={{
                            marginTop: 30,
                            fontSize: 30,
                            color: '#555',
                            fontWeight: 'bold'
                        }}>
                            アレルギー対応・子供のごはん共有アプリ
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e) {
        console.error(e);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
