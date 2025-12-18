import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Button,
    Tailwind,
    Hr,
} from '@react-email/components';

interface NewResponseEmailProps {
    surveyName: string;
    npsScore: number;
    comment?: string;
    responseLink: string;
}

export const NewResponseEmail = ({
    surveyName = 'Encuesta General',
    npsScore = 10,
    comment,
    responseLink = 'https://happymeter.app/dashboard',
}: NewResponseEmailProps) => {

    const isNegative = npsScore <= 6;
    const isNeutral = npsScore >= 7 && npsScore <= 8;

    // Define colors manually for consistent rendering
    const borderColor = isNegative ? '#ef4444' : isNeutral ? '#eab308' : '#22c55e'; // red-500, yellow-500, green-500
    const textColor = isNegative ? '#b91c1c' : isNeutral ? '#a16207' : '#15803d';
    const bgColor = isNegative ? '#fee2e2' : isNeutral ? '#fef9c3' : '#dcfce7';

    const scoreLabel = isNegative ? 'Detractor 😓' : isNeutral ? 'Passivo 😐' : 'Promotor 🤩';

    return (
        <Html>
            <Head />
            <Preview>Nueva respuesta de cliente: {npsScore}/10 - {surveyName}</Preview>
            <Tailwind>
                <Body className="bg-slate-50 my-auto mx-auto font-sans">
                    <Container className="mx-auto p-0 max-w-[500px] w-full pt-8">

                        {/* Logo Header */}
                        <Section className="mb-6 text-center">
                            <Text className="text-2xl font-bold text-gray-800 m-0 tracking-tight">
                                Happy<span className="text-violet-600">Meter</span>
                            </Text>
                        </Section>

                        {/* Main Card */}
                        <Section className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden p-8">
                            <Heading className="text-gray-800 text-lg font-semibold text-center m-0 mb-6">
                                ¡Nueva Opinión Recibida!
                            </Heading>

                            {/* Score Circle - Using line-height for safer vertical centering in emails */}
                            <Section className="text-center mb-8">
                                <div
                                    style={{
                                        width: '90px',
                                        height: '90px',
                                        borderRadius: '50%',
                                        border: `4px solid ${borderColor}`,
                                        backgroundColor: bgColor,
                                        margin: '0 auto',
                                        textAlign: 'center',
                                        lineHeight: '85px' // Vertically center text
                                    }}
                                >
                                    <span style={{ fontSize: '40px', fontWeight: 900, color: textColor }}>
                                        {npsScore}
                                    </span>
                                </div>

                                <Text className="text-gray-500 font-medium text-sm bg-gray-100 inline-block px-3 py-1 rounded-full uppercase tracking-wide mt-3">
                                    {scoreLabel}
                                </Text>
                            </Section>

                            {/* Details */}
                            <Section className="mb-6">
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider m-0 mb-1">Encuesta</Text>
                                    <Text className="text-gray-800 font-medium text-base m-0 mb-4 truncate">{surveyName}</Text>

                                    {comment && (
                                        <>
                                            <Hr className="border-gray-200 my-3" />
                                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider m-0 mb-1">Comentario</Text>
                                            <Text className="text-gray-700 italic text-base m-0 leading-relaxed">"{comment}"</Text>
                                        </>
                                    )}
                                </div>
                            </Section>

                            {/* CTA - Using explicit style props to guarantee button look */}
                            <Section className="text-center">
                                <Button
                                    style={{
                                        backgroundColor: '#7c3aed', // violet-600
                                        color: '#ffffff',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 24px',
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'center',
                                        textDecoration: 'none'
                                    }}
                                    href={responseLink}
                                >
                                    Ver Respuesta Completa
                                </Button>
                            </Section>
                        </Section>

                        {/* Footer */}
                        <Section className="mt-6 mb-8 text-center">
                            <Text className="text-gray-400 text-xs">
                                © 2025 HappyMeter Inc. <br />
                                <Link href="https://happymeter.app/settings" className="text-gray-400 underline">Ajustar notificaciones</Link>
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default NewResponseEmail;
