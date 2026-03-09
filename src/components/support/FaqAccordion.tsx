import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
    question: string;
    answer: string;
}

interface FaqAccordionProps {
    items: FaqItem[];
    category?: string;
}

export function FaqAccordion({ items, category }: FaqAccordionProps) {
    return (
        <div className="w-full">
            {category && (
                <h3 className="mb-4 text-xl font-semibold tracking-tight">{category}</h3>
            )}
            <Accordion type="single" collapsible className="w-full">
                {items.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-medium hover:text-primary transition-all">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
