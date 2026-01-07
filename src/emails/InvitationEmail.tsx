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
} from '@react-email/components';

interface InvitationEmailProps {
    firstName: string; // Or "Colega" if not known
    inviterName: string; // The person inviting
    teamName: string; // The workspace name (or "Equipo de [Inviter]")
    inviteLink: string;
    role: string;
}

export const InvitationEmail = ({ firstName, inviterName, teamName, inviteLink, role }: InvitationEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>{inviterName} te ha invitado a unirte a su equipo en HappyMeter</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Invitación a <strong>HappyMeter</strong>
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hola {firstName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>{inviterName}</strong> te ha invitado a unirte al equipo <strong>{teamName}</strong> como <strong>{role}</strong>.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            HappyMeter les ayudará a medir la satisfacción de sus clientes y mejorar el desempeño del equipo.
                        </Text>

                        <Section className="bg-gray-50 p-4 rounded-lg my-4 border border-gray-200">
                            <Text className="text-black text-[14px] font-bold m-0 mb-2">
                                📱 Pasos para Instalar la App:
                            </Text>
                            <Text className="text-gray-600 text-[13px] leading-[20px] m-0 mb-2">
                                1. Abre el enlace en tu celular.
                            </Text>
                            <Text className="text-gray-600 text-[13px] leading-[20px] m-0 mb-2">
                                2. En <strong>iPhone</strong>: Toca el botón "Compartir" <span className="text-[16px]">share</span> y selecciona "Agregar a Inicio".
                            </Text>
                            <Text className="text-gray-600 text-[13px] leading-[20px] m-0">
                                3. En <strong>Android</strong>: Toca el menú (3 puntos) y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".
                            </Text>
                        </Section>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#8b5cf6] rounded text-white text-[12px] font-bold no-underline text-center px-5 py-3"
                                href={inviteLink}
                            >
                                Aceptar Invitación
                            </Button>
                        </Section>
                        <Text className="text-gray-500 text-[12px] leading-[24px] text-center">
                            o copia este enlace: <Link href={inviteLink} className="text-blue-600 underline">{inviteLink}</Link>
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default InvitationEmail;
