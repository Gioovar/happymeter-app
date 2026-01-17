import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ReservationConfirmationEmailProps {
    customerName: string;
    businessName: string;
    date: string;
    time: string;
    pax: number;
    table: string;
    qrCodeUrl: string; // Data URL (base64)
    reservationId: string;
}

export const ReservationConfirmationEmail = ({
    customerName,
    businessName,
    date,
    time,
    pax,
    table,
    qrCodeUrl,
    reservationId,
}: ReservationConfirmationEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Confirmación de Reserva en {businessName}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                                ¡Reserva Confirmada!
                            </Heading>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Hola <strong>{customerName}</strong>,
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Tu reserva en <strong>{businessName}</strong> ha sido confirmada exitosamente.
                            </Text>
                        </Section>

                        <Section className="bg-zinc-50 border border-zinc-200 rounded-lg p-6 my-6 text-center">
                            <Heading as="h3" className="text-lg font-bold mb-4">Detalles del Evento</Heading>

                            <Row className="mb-2">
                                <Column align="right" className="w-1/2 pr-2 text-zinc-500">Fecha:</Column>
                                <Column align="left" className="w-1/2 pl-2 font-medium">{date}</Column>
                            </Row>
                            <Row className="mb-2">
                                <Column align="right" className="w-1/2 pr-2 text-zinc-500">Hora:</Column>
                                <Column align="left" className="w-1/2 pl-2 font-medium">{time}</Column>
                            </Row>
                            <Row className="mb-2">
                                <Column align="right" className="w-1/2 pr-2 text-zinc-500">Personas:</Column>
                                <Column align="left" className="w-1/2 pl-2 font-medium">{pax}</Column>
                            </Row>
                            <Row className="mb-4">
                                <Column align="right" className="w-1/2 pr-2 text-zinc-500">Mesa:</Column>
                                <Column align="left" className="w-1/2 pl-2 font-medium">{table}</Column>
                            </Row>

                            <Hr className="border border-zinc-200 my-4" />

                            <Text className="text-xs text-zinc-500 mb-2">
                                Muestra este código QR al llegar para tu Check-In rápido.
                            </Text>

                            <Img
                                src={qrCodeUrl}
                                width="200"
                                height="200"
                                alt="QR Check-in"
                                className="mx-auto rounded-lg border border-zinc-200"
                            />
                            <Text className="text-[10px] text-zinc-400 mt-2">ID: {reservationId}</Text>
                        </Section>

                        <Section className="text-center mt-6">
                            <Text className="text-[#666666] text-[12px] leading-[24px]">
                                Si necesitas cancelar o modificar, por favor contáctanos directamente.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ReservationConfirmationEmail;
