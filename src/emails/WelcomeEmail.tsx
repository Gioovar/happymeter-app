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

interface WelcomeEmailProps {
    firstName: string;
}

export const WelcomeEmail = ({ firstName }: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Bienvenido a HappyMeter - Tu plataforma de satisfacción</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            ¡Bienvenido a <strong>HappyMeter</strong>!
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hola {firstName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Estamos emocionados de tenerte a bordo. HappyMeter te ayudará a entender mejor a tus clientes y mejorar su experiencia.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href="https://happymeter.app/dashboard"
                            >
                                Ir a mi Dashboard
                            </Button>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Si tienes alguna pregunta, simplemente responde a este correo.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;
