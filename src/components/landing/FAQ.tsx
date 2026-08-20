'use client';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { ScrollReveal } from './ScrollReveal';

const faqs = [
  {
    question: 'Est-ce vraiment gratuit ?',
    answer:
      'Oui, 100% gratuit pour les particuliers. Vous pouvez créer un nombre illimité de QR codes, les personnaliser, et les utiliser sans aucune limite. Pas de carte bancaire requise.',
  },
  {
    question: 'Dois-je installer une application ?',
    answer:
      "Non, absolument pas ! Ni vous ni vos invités. QR Domotik fonctionne directement dans le navigateur de votre téléphone. Il suffit de scanner le QR code avec l'appareil photo.",
  },
  {
    question: 'Puis-je modifier un QR code après impression ?',
    answer:
      "Oui, c'est la magie des QR codes dynamiques ! Vous pouvez modifier le contenu à tout fois depuis votre dashboard, sans avoir à réimprimer le QR code physique.",
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      "Absolument. Toutes les données sont chiffrées en SSL. Nous sommes conformes au RGPD. Vos données vous appartiennent et ne sont jamais vendues à des tiers.",
  },
  {
    question: 'Puis-je utiliser mes propres designs ?',
    answer:
      'Oui ! Vous pouvez personnaliser les couleurs, ajouter votre logo, et exporter vos QR codes en PNG ou SVG haute résolution.',
  },
];

export function FAQ() {
  return (
    <section
      id="faq"
      className="py-24 md:py-32 bg-gray-50/50"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2
              id="faq-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900"
            >
              Questions fréquentes
            </h2>
            <p className="text-gray-500 text-lg mt-4">
              Tout ce que vous devez savoir
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-white rounded-xl border border-gray-100 mb-3 overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-5 text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors text-base md:text-lg no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
